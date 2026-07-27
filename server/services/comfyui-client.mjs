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
   Based on user's working workflow: LTX_2.3_ia2v + RTX Super Scale
   ═══════════════════════════════════════════════════════════════════════════════ */

function buildLTX2Workflow({
  imageFilename,
  audioFilename,
  videoPrompt,
  negativePrompt = "pc game, console game, video game, cartoon, childish, ugly",
  width = 768,
  height = 512,
  frames = 97,
  audioDuration = 9,
  audioStart = 0,
  frameRate = 24,
  steps1 = 9,
  steps2 = 4,
  cfg = 1.0,
  imgStrength = 0.7,
  imgCompression = 18,
  upscale = true,
  rtxUltra = true,
  seed = null,
  outputPrefix = "mvc_clip",
  /* Configurable model paths — 'auto' uses defaults */
  unetModel = "auto",
  vaeModel = "auto",
  clipModel = "auto",
  clip2Model = "auto",
  upscaleModel = "auto",
}) {
  if (seed === null) seed = Math.floor(Math.random() * 2**32);
  const finalW = width * 2;
  const finalH = height * 2;
  const upsampledFrames = frames;

  /* Build sigmas strings */
  const sigmas1 = Array.from({length: steps1 + 1}, (_, i) => {
    if (i === 0) return "1.0";
    if (i === steps1) return "0.0";
    return (1.0 - (i / steps1)).toFixed(4);
  }).join(", ");
  const sigmas2 = "0.85, 0.7250, 0.4219, 0.0";

  const workflow = {
    /* ── Model Loading (configurable paths, defaults to current models) ── */
    "1": { class_type: "UnetLoaderGGUF", inputs: { unet_name: unetModel !== "auto" ? unetModel : "ltx2.3\\LTX-2.3-22B-distilled-1.1-Q4_K_M.gguf" } },
    "2": { class_type: "VAELoader", inputs: { vae_name: vaeModel !== "auto" ? vaeModel : "ltx2.3\\ltx2_3_vae.safetensors" } },
    "3": { class_type: "CLIPLoader", inputs: { clip_name: clipModel !== "auto" ? clipModel : "text_encoder\\gemma3-4b-it-Q4_K_M.gguf", type: "stable_diffusion" } },
    "4": { class_type: "DualCLIPLoader", inputs: { clip_name1: clipModel !== "auto" ? clipModel : "text_encoder\\gemma3-4b-it-Q4_K_M.gguf", clip_name2: clip2Model !== "auto" ? clip2Model : "text_encoder\\embeddings.safetensors", type1: "stable_diffusion", type2: "stable_diffusion" } },
    "5": { class_type: "EmptyLTXVLatentVideo", inputs: { width, height, batch_size: 1, video_frames: upsampledFrames } },

    /* ── Pass 1: Coarse sampling ── */
    "10": { class_type: "LTXVImgToVideo", inputs: { width, height, batch_size: 1, video_frames: upsampledFrames, start_step: 0, stop_step: steps1, cfg_scale: cfg, sampler: "euler", scheduler: "linear", seed, denoise: imgStrength, per_block_control: 0.0 } },
    "11": { class_type: "LTXVConditioning", inputs: { frame_rate: Math.round(frameRate * 256), max_seq_len: 256, positive: videoPrompt, negative: negativePrompt } },
    "12": { class_type: "LTXVModelSampling", inputs: { model: ["1", 0], shift: 3.0 } },
    "13": { class_type: "SamplerCustom", inputs: { model: ["12", 0], add_noise: true, noise_seed: seed, cfg: cfg, positive: ["11", 0], negative: ["11", 1], sampler: "euler", sigmas: ["14", 0], latent_image: ["5", 0] } },
    "14": { class_type: "SplitSigmas", inputs: { sigmas: ["15", 0], step: steps1 } },
    "15": { class_type: "SigmasFromList", inputs: { sigmas_list: sigmas1 } },

    /* ── Pass 2: Refinement ── */
    "20": { class_type: "LTXVConditioning", inputs: { frame_rate: Math.round(frameRate * 256), max_seq_len: 256, positive: videoPrompt, negative: negativePrompt } },
    "21": { class_type: "LTXVModelSampling", inputs: { model: ["1", 0], shift: 3.0 } },
    "22": { class_type: "SamplerCustom", inputs: { model: ["21", 0], add_noise: true, noise_seed: seed + 1, cfg: cfg, positive: ["20", 0], negative: ["20", 1], sampler: "euler", sigmas: ["23", 0], latent_image: ["13", 0] } },
    "23": { class_type: "SigmasFromList", inputs: { sigmas_list: sigmas2 } },

    /* ── Decode latent ── */
    "30": { class_type: "VAEDecode", inputs: { samples: ["22", 0], vae: ["2", 0] } },

    /* ── Audio input ── */
    "31": { class_type: "LoadAudio", inputs: { audio: audioFilename, start_time: audioStart } },
    "32": { class_type: "VHS_AudioToVideo", inputs: { audio: ["31", 0], video: ["30", 0] } },

    /* ── Output ── */
    "40": { class_type: "VHS_VideoCombine", inputs: { filename_prefix: outputPrefix, format: "video/h264-mp4", fps: frameRate, save_output: true, images: ["32", 0] } }
  };

  /* ── Optional: Spatial Upscaler ── */
  if (upscale) {
    workflow["50"] = { class_type: "UpscaleModelLoader", inputs: { model_name: upscaleModel !== "auto" ? upscaleModel : "Spatial\\4x-UltraSharp.pth" } };
    workflow["51"] = { class_type: "ImageUpscaleWithModel", inputs: { upscale_model: ["50", 0], image: ["32", 0] } };
    workflow["52"] = { class_type: "ImageScale", inputs: { image: ["51", 0], upscale_method: "lanczos", width: finalW, height: finalH, crop: "disabled" } };
    workflow["53"] = { class_type: "VHS_VideoCombine", inputs: { filename_prefix: outputPrefix + "_upscaled", format: "video/h264-mp4", fps: frameRate, save_output: true, images: ["52", 0] } };
  }

  return workflow;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   FLUX.2 Klein Image Generation Workflow Builder
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
  clip2Model = "auto",
}) {
  if (seed === null) seed = Math.floor(Math.random() * 2**32);

  return {
    "1": { class_type: "UnetLoaderGGUF", inputs: { unet_name: unetModel !== "auto" ? unetModel : "flux2\\FLUX.2-Klein-9B-Q8_0.gguf" } },
    "2": { class_type: "VAELoader", inputs: { vae_name: vaeModel !== "auto" ? vaeModel : "flux2\\flux2_vae.safetensors" } },
    "3": { class_type: "DualCLIPLoader", inputs: { clip_name1: clipModel !== "auto" ? clipModel : "text_encoder\\t5xxl_fp8_e4m3fn.safetensors", clip_name2: clip2Model !== "auto" ? clip2Model : "text_encoder\\clip_l.safetensors", type1: "stable_diffusion", type2: "stable_diffusion" } },
    "4": { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["3", 0] } },
    "5": { class_type: "EmptyLatentImage", inputs: { width, height, batch_size: 1 } },
    "6": { class_type: "ModelSamplingFlux", inputs: { model: ["1", 0], shift: 3.0 } },
    "7": { class_type: "SamplerCustom", inputs: { model: ["6", 0], add_noise: true, noise_seed: seed, cfg, positive: ["4", 0], negative: ["4", 0], sampler: "euler", sigmas: ["8", 0], latent_image: ["5", 0] } },
    "8": { class_type: "SigmasFromList", inputs: { sigmas_list: "1.0, 0.75, 0.5, 0.25, 0.0" } },
    "9": { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["2", 0] } },
    "10": { class_type: "SaveImage", inputs: { images: ["9", 0], filename_prefix: outputPrefix } }
  };
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
