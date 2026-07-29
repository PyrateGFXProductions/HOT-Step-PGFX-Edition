/**
 * ComfyUI Client Service
 * ──────────────────────
 * Self-contained ES module for all ComfyUI interactions:
 * - HTTP helpers (POST, GET, upload, download)
 * - VRAM management
 * - Workflow submission + polling
 * - LTX 2.3 workflow builder
 * - FIFO job queue (prevents OOM under concurrent load)
 *
 * Extracted from server.mjs to reduce monolithic file size.
 * Can be imported by any module or used standalone.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

/* ═══════════════════════════════════════════════════════════════════════════════
   Configuration
   ═══════════════════════════════════════════════════════════════════════════════ */

const COMFYUI_URL = process.env.COMFYUI_URL || "http://127.0.0.1:8188";
const COMFYUI_POLL_MS = 2000;
const COMFYUI_TIMEOUT_MS = 600000; /* 10 min max per job */
const MAX_CONCURRENT_JOBS = 1;     /* FIFO queue: only 1 ComfyUI job at a time */

/* ═══════════════════════════════════════════════════════════════════════════════
   HTTP Helpers
   ═══════════════════════════════════════════════════════════════════════════════ */

async function comfyPost(endpoint, body) {
  const resp = await fetch(`${COMFYUI_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000)
  });
  if (!resp.ok) throw new Error(`ComfyUI POST ${endpoint} failed: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

async function comfyGet(endpoint) {
  const resp = await fetch(`${COMFYUI_URL}${endpoint}`, { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error(`ComfyUI GET ${endpoint} failed: ${resp.status}`);
  return resp.json();
}

async function comfyUpload(filePath, fileName) {
  const fileBytes = await fs.promises.readFile(filePath);
  const blob = new Blob([fileBytes], { type: "application/octet-stream" });
  const form = new FormData();
  form.append("image", blob, fileName);
  form.append("overwrite", "true");
  const resp = await fetch(`${COMFYUI_URL}/upload/image`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60000)
  });
  if (!resp.ok) throw new Error(`ComfyUI upload failed: ${resp.status}`);
  return resp.json();
}

async function comfyDownload(filename, subfolder, type) {
  const params = new URLSearchParams({ filename, subfolder: subfolder || "", type: type || "output" });
  const resp = await fetch(`${COMFYUI_URL}/view?${params}`, { signal: AbortSignal.timeout(60000) });
  if (!resp.ok) throw new Error(`ComfyUI download failed: ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

/* ═══════════════════════════════════════════════════════════════════════════════
   VRAM Management
   ═══════════════════════════════════════════════════════════════════════════════ */

async function comfyFreeVRAM() {
  try { await comfyPost("/free", {}); } catch {}
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FIFO Job Queue
   ───────────────
   Prevents OOM by ensuring only MAX_CONCURRENT_JOBS run at a time.
   Requests are queued and processed in order (First-In, First-Out).
   This is critical when concurrent requests arrive (e.g., album batch
   generating video clips while the core engine runs audio tracks).
   ═══════════════════════════════════════════════════════════════════════════════ */

class ComfyUIJobQueue {
  constructor(maxConcurrent = MAX_CONCURRENT_JOBS) {
    this._maxConcurrent = maxConcurrent;
    this._running = 0;
    this._queue = [];
    this._stats = { totalQueued: 0, totalCompleted: 0, totalFailed: 0, peakQueueLength: 0 };
  }

  /**
   * Enqueue a job function and return a promise that resolves with its result.
   * Jobs are functions that return a Promise (e.g., () => comfySubmitAndWait(workflow))
   */
  enqueue(jobFn, label = "unnamed") {
    return new Promise((resolve, reject) => {
      const job = { jobFn, label, resolve, reject, enqueuedAt: Date.now() };
      this._stats.totalQueued++;
      this._stats.peakQueueLength = Math.max(this._stats.peakQueueLength, this._queue.length);
      this._queue.push(job);
      console.log(`[ComfyUI Queue] + "${label}" queued (position: ${this._queue.length}, running: ${this._running}/${this._maxConcurrent})`);
      this._processNext();
    });
  }

  async _processNext() {
    if (this._running >= this._maxConcurrent || this._queue.length === 0) return;
    const job = this._queue.shift();
    this._running++;
    const waitMs = Date.now() - job.enqueuedAt;
    console.log(`[ComfyUI Queue] ▶ "${job.label}" starting (waited ${waitMs}ms)`);
    try {
      const result = await job.jobFn();
      this._stats.totalCompleted++;
      job.resolve(result);
    } catch (err) {
      this._stats.totalFailed++;
      job.reject(err);
    } finally {
      this._running--;
      console.log(`[ComfyUI Queue] ✓ "${job.label}" done (running: ${this._running}/${this._maxConcurrent}, queued: ${this._queue.length})`);
      this._processNext();
    }
  }

  /** Current queue status for health endpoints */
  getStatus() {
    return {
      running: this._running,
      maxConcurrent: this._maxConcurrent,
      queued: this._queue.length,
      queue: this._queue.map((j, i) => ({ position: i + 1, label: j.label, waitMs: Date.now() - j.enqueuedAt })),
      stats: { ...this._stats }
    };
  }

  /** Drain the queue (for graceful shutdown) */
  drain() {
    for (const job of this._queue) {
      job.reject(new Error("Queue drained — server shutting down"));
    }
    this._queue = [];
  }
}

const comfyQueue = new ComfyUIJobQueue(MAX_CONCURRENT_JOBS);

/* ═══════════════════════════════════════════════════════════════════════════════
   Submit + Poll Workflow
   ═══════════════════════════════════════════════════════════════════════════════ */

async function comfySubmitAndWaitRaw(workflow, onProgress) {
  await comfyFreeVRAM();
  const submitResp = await comfyPost("/prompt", { prompt: workflow });
  if (submitResp.error) throw new Error(`Workflow error: ${JSON.stringify(submitResp.node_errors || submitResp.error)}`);
  const promptId = submitResp.prompt_id;
  if (!promptId) throw new Error("No prompt_id returned from ComfyUI");
  console.log(`[ComfyUI] Submitted job: ${promptId}`);
  const start = Date.now();
  while (Date.now() - start < COMFYUI_TIMEOUT_MS) {
    await new Promise(r => setTimeout(r, COMFYUI_POLL_MS));
    const hist = await comfyGet(`/history/${promptId}`);
    if (hist[promptId]) {
      const entry = hist[promptId];
      if (entry.status && entry.status.completed === false) continue;
      if (entry.status && entry.status.status_str === "error") {
        const msgs = entry.status.messages || [];
        throw new Error(`ComfyUI execution error: ${JSON.stringify(msgs)}`);
      }
      if (entry.outputs) {
        console.log(`[ComfyUI] Job ${promptId} completed in ${((Date.now()-start)/1000).toFixed(1)}s`);
        return { promptId, outputs: entry.outputs };
      }
    }
    if (onProgress) onProgress(((Date.now() - start) / COMFYUI_TIMEOUT_MS) * 100);
  }
  throw new Error(`ComfyUI job timed out after ${COMFYUI_TIMEOUT_MS/1000}s`);
}

/**
 * Queue-safe workflow submission.
 * Automatically routes through the FIFO queue to prevent OOM.
 */
async function comfySubmitAndWait(workflow, onProgress) {
  return comfyQueue.enqueue(
    () => comfySubmitAndWaitRaw(workflow, onProgress),
    `workflow_${workflow["1"]?.class_type || "unknown"}`
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Output Helpers
   ═══════════════════════════════════════════════════════════════════════════════ */

function comfyFindOutput(outputs, nodeType) {
  for (const [nodeId, nodeOut] of Object.entries(outputs)) {
    if (nodeOut.videos && nodeOut.videos.length > 0) {
      return { type: "video", files: nodeOut.videos };
    }
    if (nodeOut.images && nodeOut.images.length > 0) {
      return { type: "image", files: nodeOut.images };
    }
  }
  /* Fallback: grab first available output */
  for (const [nodeId, nodeOut] of Object.entries(outputs)) {
    if (nodeOut.gifs) return { type: "gif", files: nodeOut.gifs };
    if (nodeOut.audio) return { type: "audio", files: nodeOut.audio };
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   LTX 2.3 Image-to-Video Workflow Builder
   ────────────────────────────────────────
   Rewritten to match actual ComfyUI LTX 2.3 workflow structure.
   
   Uses the low-level LTX node graph for maximum flexibility:
   - UnetLoaderGGUF → GGUF quantized model
   - CLIPLoader (type=ltxv) → LTXV text encoder
   - CLIPTextEncode → prompt conditioning
   - LTXVConditioning → frame-rate-aware conditioning pair
   - ModelSamplingLTXV → sampling shift
   - LTXVScheduler → sigmas
   - RandomNoise → seed noise
   - KSamplerSelect → sampler
   - BasicGuider → guider (CFG-based)
   - SamplerCustomAdvanced → sample
   - LTXVAddGuide → reference image conditioning
   - VAEDecode → decode video frames
   - SaveVideo → output MP4
   
   Reference: LTX_2.3_ia2v + RTX Super Scale workflow
   ═══════════════════════════════════════════════════════════════════════════════ */

function buildLTX2Workflow({
  imageFilename,
  audioFilename,
  videoPrompt,
  negativePrompt = "pc game, console game, video game, cartoon, childish, ugly, low quality",
  width = 768,
  height = 512,
  frames = 97,
  frameRate = 25,
  steps = 20,
  cfg = 3.0,
  imgStrength = 1.0,
  seed = null,
  outputPrefix = "ltx2_clip",
  /* Configurable model paths — 'auto' uses defaults */
  unetModel = "auto",
  vaeModel = "auto",
  clipModel = "auto",
  audioVaeModel = "auto",
  icLoraModel = "auto",
}) {
  if (seed === null) seed = Math.floor(Math.random() * 2**32);

  /* ── Model Loading ── */
  const workflow = {
    /* 1: Load UNet (GGUF quantized) */
    "1": {
      class_type: "UnetLoaderGGUF",
      inputs: {
        unet_name: unetModel !== "auto" ? unetModel : "ltx2.3/LTX-2.3-22B-distilled-1.1-Q4_K_M.gguf"
      }
    },
    /* 2: Load VAE (video) */
    "2": {
      class_type: "VAELoader",
      inputs: {
        vae_name: vaeModel !== "auto" ? vaeModel : "ltx2.3/ltx-2.3-22b-distilled_video_vae.safetensors"
      }
    },
    /* 3: Load Text Encoder (LTXV type) */
    "3": {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: clipModel !== "auto" ? clipModel : "ltx2.3/ltx-2.3-22b-distilled_embeddings_connectors.safetensors",
        type: "ltxv"
      }
    },
    /* 4: Encode positive prompt */
    "4": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: videoPrompt,
        clip: ["3", 0]
      }
    },
    /* 5: Encode negative prompt */
    "5": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: negativePrompt,
        clip: ["3", 0]
      }
    },
    /* 6: LTXV conditioning (frame-rate aware) */
    "6": {
      class_type: "LTXVConditioning",
      inputs: {
        positive: ["4", 0],
        negative: ["5", 0],
        frame_rate: frameRate
      }
    },

    /* ── Model Sampling ── */
    /* 7: ModelSamplingLTXV — apply sampling shift */
    "7": {
      class_type: "ModelSamplingLTXV",
      inputs: {
        model: ["1", 0],
        max_shift: 2.05,
        base_shift: 0.95
      }
    },

    /* ── Scheduler + Sampler ── */
    /* 8: LTXVScheduler */
    "8": {
      class_type: "LTXVScheduler",
      inputs: {
        steps: steps,
        max_shift: 2.05,
        base_shift: 0.95,
        stretch: true,
        terminal: 0.1
      }
    },
    /* 9: KSamplerSelect */
    "9": {
      class_type: "KSamplerSelect",
      inputs: {
        sampler_name: "euler"
      }
    },
    /* 10: RandomNoise */
    "10": {
      class_type: "RandomNoise",
      inputs: {
        noise_seed: seed
      }
    },

    /* ── Reference Image Conditioning ── */
    /* 11: Load reference image */
    "11": {
      class_type: "LoadImage",
      inputs: {
        image: imageFilename
      }
    },
    /* 12: Create latent from image (LTXVImgToVideo creates latent + conditioning) */
    "12": {
      class_type: "LTXVImgToVideo",
      inputs: {
        positive: ["6", 0],
        negative: ["6", 1],
        vae: ["2", 0],
        image: ["11", 0],
        width: width,
        height: height,
        length: frames,
        batch_size: 1,
        strength: imgStrength
      }
    },

    /* ── Guided Sampler ── */
    /* 13: CFGGuider (model + positive + negative + cfg) */
    "13": {
      class_type: "CFGGuider",
      inputs: {
        model: ["7", 0],
        positive: ["12", 0],
        negative: ["12", 1],
        cfg: cfg
      }
    },
    /* 14: Sample */
    "14": {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: ["10", 0],
        guider: ["13", 0],
        sampler: ["9", 0],
        sigmas: ["8", 0],
        latent_image: ["12", 2]
      }
    },

    /* ── Decode + Save ── */
    /* 15: VAEDecode */
    "15": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["14", 0],
        vae: ["2", 0]
      }
    },
    /* 16: VHS_VideoCombine — encode to MP4 with optional audio muxing */
    "16": {
      class_type: "VHS_VideoCombine",
      inputs: {
        images: ["15", 0],
        frame_rate: frameRate,
        loop_count: 0,
        filename_prefix: outputPrefix,
        format: "video/h264-mp4",
        pingpong: false,
        save_output: true
      }
    }
  };

  /* ── Optional: IC-LoRA (applies to UNet before sampling) ── */
  if (icLoraModel && icLoraModel !== "auto") {
    /* 50: Load IC-LoRA via LTXICLoRALoaderModelOnly */
    workflow["50"] = {
      class_type: "LTXICLoRALoaderModelOnly",
      inputs: {
        lora_name: icLoraModel,
        strength: 1.0,
        model: ["1", 0]
      }
    };
    /* Rewire ModelSamplingLTXV to use IC-LoRA-modified model */
    workflow["7"].inputs.model = ["50", 0];
  }

    /* ── Optional: Audio-driven conditioning ── */
  if (audioFilename) {
    /* 20: Load audio */
    workflow["20"] = {
      class_type: "LoadAudio",
      inputs: {
        audio: audioFilename
      }
    };
    /* 21: Load audio VAE (use VAELoader — LTXVAudioVAELoader only scans checkpoints dir) */
    workflow["21"] = {
      class_type: "VAELoader",
      inputs: {
        vae_name: audioVaeModel !== "auto" ? audioVaeModel : "ltx2.3/ltx-2.3-22b-distilled_audio_vae.safetensors"
      }
    };
    /* 22: Encode audio */
    workflow["22"] = {
      class_type: "LTXVAudioVAEEncode",
      inputs: {
        audio: ["20", 0],
        audio_vae: ["21", 0]
      }
    };
    /* 23: Set audio reference tokens on conditioning
       LTXVSetAudioRefTokens returns: [positive, negative, latent] */
    workflow["23"] = {
      class_type: "LTXVSetAudioRefTokens",
      inputs: {
        positive: ["6", 0],
        negative: ["6", 1],
        audio_latent: ["22", 0]
      }
    };
    /* Update guider to use audio-aware positive/negative conditioning */
    workflow["13"].inputs.positive = ["23", 0];
    workflow["13"].inputs.negative = ["23", 1];
    /* Also mux audio into the video output */
    workflow["16"].inputs.audio = ["20", 0];
  }

  return workflow;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FLUX.2 Klein Image Generation Workflow Builder
   ──────────────────────────────────────────────
   Rewritten to match actual ComfyUI FLUX2_Workflow.json node structure.
   Supports both GGUF and safetensors UNet models — auto-detected by extension.
   
   Uses native FLUX.2 nodes:
   - UnetLoaderGGUF (.gguf) OR UNETLoader (.safetensors) → FLUX.2 Klein 9B
   - CLIPLoader (type=flux2) → Qwen 3 8B text encoder
   - VAELoader → FLUX.2 VAE
   - EmptyFlux2LatentImage → latent canvas
   - RandomNoise → seed
   - Flux2Scheduler → sigmas (width/height aware)
   - KSamplerSelect → sampler
   - CFGGuider → guidance (model + positive + negative + cfg)
   - SamplerCustomAdvanced → sample
   - ConditioningZeroOut → negative (zeroed positive)
   - VAEDecode → decode pixels
   - SaveImage → output
   
   Reference: FLUX2_Workflow.json (nodes 403-419)
   FLUX.2 uses cfg_scale=1.0 (FLUX-native guidance), negative prompts ignored.
   ═══════════════════════════════════════════════════════════════════════════════ */

function buildFLUX2Workflow({
  prompt,
  negativePrompt = "",
  width = 1024,
  height = 1024,
  steps = 4,
  cfg = 1.0,
  seed = null,
  outputPrefix = "flux2_image",
  /* Configurable model paths — 'auto' uses defaults */
  unetModel = "auto",
  vaeModel = "auto",
  clipModel = "auto",
}) {
  if (seed === null) seed = Math.floor(Math.random() * 2**32);

  /* ── Resolve model names ── */
  const resolvedUnet = unetModel !== "auto" ? unetModel : "FLUX.2/flux-2-klein-9b-fp8.safetensors";
  const resolvedVae = vaeModel !== "auto" ? vaeModel : "FLUX.2/flux2-vae.safetensors";
  const resolvedClip = clipModel !== "auto" ? clipModel : "qwen_3_8b_fp8mixed.safetensors";

  /* ── Auto-detect GGUF vs safetensors ── */
  const isGGUF = resolvedUnet.toLowerCase().endsWith(".gguf");

  /* ── UNet node — format-dependent ── */
  const unetNode = isGGUF
    ? { class_type: "UnetLoaderGGUF", inputs: { unet_name: resolvedUnet } }
    : { class_type: "UNETLoader",     inputs: { unet_name: resolvedUnet, weight_dtype: "fp8_e4m3fn" } };

  const workflow = {
    /* ── Model Loading ── */
    /* 1: UNet loader (auto-detected: GGUF or safetensors) */
    "1": unetNode,
    /* 2: VAELoader */
    "2": {
      class_type: "VAELoader",
      inputs: {
        vae_name: resolvedVae
      }
    },
    /* 3: CLIPLoader (Qwen 3 8B for FLUX.2) */
    "3": {
      class_type: "CLIPLoader",
      inputs: {
        clip_name: resolvedClip,
        type: "flux2",
        device: "default"
      }
    },

    /* ── Text Encoding ── */
    /* 4: CLIPTextEncode — positive prompt */
    "4": {
      class_type: "CLIPTextEncode",
      inputs: {
        text: prompt,
        clip: ["3", 0]
      }
    },
    /* 5: ConditioningZeroOut — negative (zeroed positive) */
    "5": {
      class_type: "ConditioningZeroOut",
      inputs: {
        conditioning: ["4", 0]
      }
    },

    /* ── Latent Canvas ── */
    /* 6: EmptyFlux2LatentImage */
    "6": {
      class_type: "EmptyFlux2LatentImage",
      inputs: {
        width: width,
        height: height,
        batch_size: 1
      }
    },

    /* ── Noise + Scheduler + Sampler ── */
    /* 7: RandomNoise */
    "7": {
      class_type: "RandomNoise",
      inputs: {
        noise_seed: seed
      }
    },
    /* 8: Flux2Scheduler — width/height-aware sigmas */
    "8": {
      class_type: "Flux2Scheduler",
      inputs: {
        steps: steps,
        width: width,
        height: height
      }
    },
    /* 9: KSamplerSelect */
    "9": {
      class_type: "KSamplerSelect",
      inputs: {
        sampler_name: "euler"
      }
    },

    /* ── Guided Sampling ── */
    /* 10: CFGGuider */
    "10": {
      class_type: "CFGGuider",
      inputs: {
        model: ["1", 0],
        positive: ["4", 0],
        negative: ["5", 0],
        cfg: cfg
      }
    },
    /* 11: SamplerCustomAdvanced */
    "11": {
      class_type: "SamplerCustomAdvanced",
      inputs: {
        noise: ["7", 0],
        guider: ["10", 0],
        sampler: ["9", 0],
        sigmas: ["8", 0],
        latent_image: ["6", 0]
      }
    },

    /* ── Decode + Save ── */
    /* 12: VAEDecode */
    "12": {
      class_type: "VAEDecode",
      inputs: {
        samples: ["11", 0],
        vae: ["2", 0]
      }
    },
    /* 13: SaveImage */
    "13": {
      class_type: "SaveImage",
      inputs: {
        images: ["12", 0],
        filename_prefix: outputPrefix
      }
    }
  };

  return workflow;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Connection Check
   ═══════════════════════════════════════════════════════════════════════════════ */

async function checkComfyUIConnection() {
  try {
    const sys = await comfyGet("/system_stats");
    return {
      connected: true,
      url: COMFYUI_URL,
      vram: sys?.devices?.[0]?.vram_total || 0,
      freeVram: sys?.devices?.[0]?.vram_free || 0
    };
  } catch (err) {
    return { connected: false, url: COMFYUI_URL, error: err.message };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Exports
   ═══════════════════════════════════════════════════════════════════════════════ */

export {
  COMFYUI_URL,
  COMFYUI_TIMEOUT_MS,
  comfyPost,
  comfyGet,
  comfyUpload,
  comfyDownload,
  comfyFreeVRAM,
  comfySubmitAndWait,
  comfySubmitAndWaitRaw,
  comfyFindOutput,
  comfyQueue,
  buildLTX2Workflow,
  buildFLUX2Workflow,
  checkComfyUIConnection
};
