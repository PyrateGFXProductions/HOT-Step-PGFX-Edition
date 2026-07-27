/**
 * ComfyUI Bridge Service
 * ──────────────────────
 * Primary AI generation source with layered fallbacks.
 * Adapted from the PGFX Logo Designer Studio bridge pattern.
 *
 * Architecture:
 *   Pipeline Archetype Registry → pluggable workflow builders
 *   Model Parameter Inference   → auto-detect steps/CFG from filename
 *   Capability Discovery        → map models + nodes to capabilities
 *   Layered Fallbacks           → ComfyUI primary → sd-cli.exe / local fallback
 *
 * When ComfyUI is available:
 *   - All image generation (cover art, singer images, video frames) routes through ComfyUI
 *   - Model selection is automatic based on filename pattern matching
 *   - Pipeline is auto-detected from the selected model
 *
 * When ComfyUI is offline:
 *   - Cover art falls back to local sd-cli.exe (FLUX.2 Klein 9B)
 *   - Video generation is unavailable (returns clear error)
 *   - Stem separation continues via ace-server
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  comfyGet,
  comfyPost,
  comfySubmitAndWait,
  comfyFindOutput,
  comfyDownload,
  comfyUpload,
  comfyQueue,
  buildLTX2Workflow,
  buildFLUX2Workflow,
  checkComfyUIConnection,
  COMFYUI_URL,
} from "./comfyui-client.mjs";
import {
  detectComfyUI,
  getComfyUIStatus,
  invalidateCache as invalidateModelCache,
  findComfyUIDir,
} from "./comfyui-model-scanner.mjs";

/* ═══════════════════════════════════════════════════════════════════════════════
   Pipeline Archetype Registry
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * @typedef {Object} PipelineArchetype
 * @property {string} id           - Unique pipeline identifier
 * @property {string} mediaType    - 'image' | 'video' | 'audio'
 * @property {RegExp} modelPattern - Regex to match model filenames
 * @property {string[]} requiredNodes - Node class_types needed for this pipeline
 * @property {Function} build      - (ctx: BuildContext) => Workflow JSON
 */

const registry = new Map();

function registerPipeline(archetype) {
  registry.set(archetype.id, archetype);
}

function getPipeline(id) {
  return registry.get(id);
}

function listPipelines() {
  return [...registry.values()];
}

function detectPipeline(modelFilename, mediaType = "image") {
  for (const p of registry.values()) {
    if (p.mediaType === mediaType && p.modelPattern && p.modelPattern.test(modelFilename)) {
      return p;
    }
  }
  /* Default pipelines */
  if (mediaType === "video") return registry.get("ltx-video");
  return registry.get("flux-image");
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Model Parameter Inference
   ──────────────────────────
   Auto-detect steps, CFG, and other parameters from model filename.
   Falls back to safe defaults for unrecognized models.
   ═══════════════════════════════════════════════════════════════════════════════ */

function inferModelParameters(modelPath) {
  const name = (modelPath || "").toLowerCase();
  const basename = path.basename(name);

  /* Distilled / turbo models — low steps, low CFG */
  if (/klien.*9b|klein.*9b/i.test(basename)) {
    return { steps: 4, cfg: 1.0, isDistilled: true, isFlux: true, family: "flux2-klein-9b" };
  }
  if (/klien.*4b|klein.*4b/i.test(basename)) {
    return { steps: 4, cfg: 1.0, isDistilled: true, isFlux: true, family: "flux2-klein-4b" };
  }
  if (/schnell|turbo|lightning|distilled/i.test(basename)) {
    return { steps: 4, cfg: 1.0, isDistilled: true, isFlux: false, family: "distilled" };
  }
  if (/z-image.*turbo|zimage.*turbo/i.test(basename)) {
    return { steps: 4, cfg: 1.0, isDistilled: true, isFlux: false, family: "z-image-turbo" };
  }

  /* LTX Video models */
  if (/ltx.*2\.3|ltx.*distilled/i.test(basename)) {
    return { steps1: 9, steps2: 4, cfg: 1.0, isDistilled: true, isLTX: true, family: "ltx2.3" };
  }
  if (/ltx.*2\.0|ltx.*1\.0/i.test(basename)) {
    return { steps1: 12, steps2: 8, cfg: 2.5, isDistilled: false, isLTX: true, family: "ltx" };
  }

  /* Flux dev/pro — medium steps */
  if (/flux.*dev|flux.*pro/i.test(basename)) {
    return { steps: 20, cfg: 3.5, isDistilled: false, isFlux: true, family: "flux-dev" };
  }

  /* SDXL / SD3 / checkpoint models */
  if (/sdxl|sd3|sd\..*\.safetensors/i.test(basename)) {
    return { steps: 20, cfg: 3.5, isDistilled: false, isFlux: false, family: "sdxl" };
  }

  /* Fallback: safe defaults */
  return { steps: 20, cfg: 3.5, isDistilled: false, isFlux: false, family: "unknown" };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Capability Inference
   ─────────────────────
   Maps models + node availability to high-level capabilities.
   ═══════════════════════════════════════════════════════════════════════════════ */

async function discoverCapabilities() {
  const { connected, systemInfo } = await detectComfyUI();
  if (!connected) {
    return {
      online: false,
      capabilities: {
        imageGeneration: { available: false, reason: "ComfyUI offline" },
        videoGeneration: { available: false, reason: "ComfyUI offline" },
        upscaling: { available: false, reason: "ComfyUI offline" },
      },
      models: {},
      nodes: {},
      systemInfo: null,
    };
  }

  /* Query /object_info/ for node inventory */
  let objectInfo = {};
  try {
    const resp = await fetch(`${COMFYUI_URL}/object_info`, { signal: AbortSignal.timeout(15000) });
    if (resp.ok) objectInfo = await resp.json();
  } catch {}

  const nodeTypes = new Set(Object.keys(objectInfo));

  /* Check for specific capability-enabling nodes */
  const hasNode = (name) => nodeTypes.has(name);

  /* Check for specific models */
  const comfyDir = findComfyUIDir();
  const modelsDir = comfyDir ? path.join(comfyDir, "models") : null;
  const hasModel = (dir, pattern) => {
    if (!modelsDir) return false;
    try {
      const dirPath = path.join(modelsDir, dir);
      if (!fs.existsSync(dirPath)) return false;
      return fs.readdirSync(dirPath).some(f => pattern.test(f));
    } catch { return false; }
  };

  /* Image generation: needs a UNet/checkpoint + VAE + CLIP */
  const hasImageModel =
    hasModel("unet", /flux|klien/i) ||
    hasModel("diffusion_models", /flux|klien/i) ||
    hasModel("checkpoints", /\.safetensors|\.ckpt/i);
  const hasImageNodes = hasNode("UnetLoaderGGUF") || hasNode("UNETLoader") || hasNode("CheckpointLoaderSimple");

  /* Video generation: needs LTX/Wan model + video nodes */
  const hasVideoModel = hasModel("unet", /ltx|wan/i) || hasModel("diffusion_models", /ltx|wan/i);
  const hasVideoNodes = hasNode("LTXVImgToVideo") || hasNode("WanImageToVideo");

  /* Upscaling */
  const hasUpscaleModel = hasModel("upscale_models", /\.pth|\.pt/i);
  const hasUpscaleNodes = hasNode("UpscaleModelLoader");

  const capabilities = {
    imageGeneration: {
      available: hasImageModel && hasImageNodes,
      reason: hasImageModel && hasImageNodes ? "Ready" : (!hasImageModel ? "No image models found" : "Missing node types"),
      models: hasImageModel,
      nodes: hasImageNodes,
    },
    videoGeneration: {
      available: hasVideoModel && hasVideoNodes,
      reason: hasVideoModel && hasVideoNodes ? "Ready" : (!hasVideoModel ? "No video models found" : "Missing node types"),
      models: hasVideoModel,
      nodes: hasVideoNodes,
    },
    upscaling: {
      available: hasUpscaleModel && hasUpscaleNodes,
      reason: hasUpscaleModel && hasUpscaleNodes ? "Ready" : (!hasUpscaleModel ? "No upscale models" : "Missing UpscaleModelLoader"),
      models: hasUpscaleModel,
      nodes: hasUpscaleNodes,
    },
  };

  const activeCount = Object.values(capabilities).filter(c => c.available).length;

  return {
    online: true,
    systemInfo,
    capabilities,
    nodeCount: nodeTypes.size,
    activeCapabilities: activeCount,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Unified Generation Interface
   ╀────────────────────────────
   Single entry point for all AI generation. Routes to ComfyUI when available,
   falls back to local tools when not.
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Generate an image via ComfyUI (primary) or local sd-cli.exe (fallback).
 *
 * @param {Object} opts
 * @param {string} opts.prompt - Text prompt
 * @param {string} [opts.negativePrompt] - Negative prompt
 * @param {number} [opts.width=1024]
 * @param {number} [opts.height=1024]
 * @param {string} [opts.model] - Model filename (auto-detected if omitted)
 * @param {string} [opts.pipeline] - Pipeline ID (auto-detected from model)
 * @param {number} [opts.seed]
 * @param {string} [opts.outputPrefix="generated"]
 * @param {string} [opts.outputDir] - Local output directory
 * @returns {Promise<{url: string, source: string, model: string, seed: number}>}
 */
async function generateImage(opts) {
  const {
    prompt,
    negativePrompt = "",
    width = 1024,
    height = 1024,
    model,
    pipeline: pipelineId,
    seed = null,
    outputPrefix = "generated",
    outputDir,
  } = opts;

  const actualSeed = seed !== null && seed !== undefined ? seed : Math.floor(Math.random() * 2 ** 32);

  /* ── Try ComfyUI first ── */
  const { connected } = await detectComfyUI();
  if (connected) {
    try {
      const params = inferModelParameters(model);
      const workflow = buildFLUX2Workflow({
        prompt,
        negativePrompt,
        width,
        height,
        steps: params.steps,
        cfg: params.cfg,
        seed: actualSeed,
        outputPrefix,
        unetModel: model || "auto",
      });

      console.log(`[Bridge] ComfyUI image generation: ${outputPrefix} (${params.family}, ${params.steps} steps, cfg ${params.cfg})`);
      const result = await comfySubmitAndWait(workflow);
      const output = comfyFindOutput(result.outputs);
      if (!output) throw new Error("No output from workflow");

      const imgFile = output.files[0];
      const imgBuffer = await comfyDownload(imgFile.filename, imgFile.subfolder, imgFile.type);

      /* Save locally */
      const outDir = outputDir || path.join(process.cwd(), "data", "mvc");
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      const localName = `${outputPrefix}_${actualSeed}.png`;
      const localPath = path.join(outDir, localName);
      fs.writeFileSync(localPath, imgBuffer);

      return {
        url: `/data/mvc/${localName}`,
        localPath,
        source: "comfyui",
        model: model || "auto",
        seed: actualSeed,
        prompt,
      };
    } catch (err) {
      console.warn(`[Bridge] ComfyUI image generation failed, falling back to local: ${err.message}`);
    }
  }

  /* ── Fallback: local sd-cli.exe ── */
  return generateImageLocal(opts, actualSeed);
}

/**
 * Local fallback for image generation using sd-cli.exe (FLUX.2 Klein 9B).
 */
async function generateImageLocal(opts, actualSeed) {
  const { prompt, negativePrompt = "", width = 1024, height = 1024, outputPrefix = "generated", outputDir } = opts;
  const outDir = outputDir || path.join(process.cwd(), "data", "mvc");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const localName = `${outputPrefix}_${actualSeed}.png`;
  const localPath = path.join(outDir, localName);

  const sdCli = path.join(process.cwd(), "server", "cover-art", "sd-cli.exe");
  if (!fs.existsSync(sdCli)) {
    throw new Error("No image generation available: ComfyUI offline and sd-cli.exe not found");
  }

  console.log(`[Bridge] Local sd-cli.exe image generation: ${outputPrefix}`);
  const args = [
    "txt2img",
    "--model", path.join(process.cwd(), "server", "cover-art", "FLUX.2-Klein-9B-Q4_0.gguf"),
    "--vae", path.join(process.cwd(), "server", "cover-art", "ae.safetensors"),
    "--clip_l", path.join(process.cwd(), "server", "cover-art", "clip_l.safetensors"),
    "--t5", path.join(process.cwd(), "server", "cover-art", "qwen2.5-3b-instruct-q4_k_m.gguf"),
    "--prompt", prompt,
    "--negative", negativePrompt,
    "--width", String(width),
    "--height", String(height),
    "--steps", "4",
    "--cfg", "1.0",
    "--seed", String(actualSeed),
    "--output", localPath,
  ];

  const { execSync } = await import("child_process");
  try {
    execSync(`"${sdCli}" ${args.map(a => `"${a}"`).join(" ")}`, {
      timeout: 120000,
      stdio: "pipe",
    });
  } catch (err) {
    throw new Error(`sd-cli.exe failed: ${err.stderr?.toString() || err.message}`);
  }

  return {
    url: `/data/mvc/${localName}`,
    localPath,
    source: "sd-cli",
    model: "FLUX.2-Klein-9B-Q4_0",
    seed: actualSeed,
    prompt,
  };
}

/**
 * Generate a video clip via ComfyUI (LTX 2.3).
 * No local fallback — ComfyUI is required for video.
 *
 * @param {Object} opts
 * @param {string} opts.imageFilename - Input image (already uploaded to ComfyUI)
 * @param {string} opts.audioFilename - Audio file (already uploaded to ComfyUI)
 * @param {string} opts.videoPrompt - Video prompt
 * @param {number} [opts.width=768]
 * @param {number} [opts.height=512]
 * @param {number} [opts.frames=97]
 * @param {number} [opts.frameRate=24]
 * @param {string} [opts.model] - UNet model filename
 * @param {number} [opts.seed]
 * @param {string} [opts.outputPrefix="clip"]
 * @returns {Promise<{url: string, source: string, model: string}>}
 */
async function generateVideo(opts) {
  const {
    imageFilename,
    audioFilename,
    videoPrompt,
    negativePrompt = "pc game, console game, video game, cartoon, childish, ugly",
    width = 768,
    height = 512,
    frames = 97,
    frameRate = 24,
    model,
    seed = null,
    outputPrefix = "clip",
    outputDir,
  } = opts;

  const { connected } = await detectComfyUI();
  if (!connected) {
    throw new Error("Video generation requires ComfyUI — it is currently offline");
  }

  const actualSeed = seed !== null && seed !== undefined ? seed : Math.floor(Math.random() * 2 ** 32);
  const params = inferModelParameters(model);

  const workflow = buildLTX2Workflow({
    imageFilename,
    audioFilename,
    videoPrompt,
    negativePrompt,
    width,
    height,
    frames,
    frameRate,
    steps1: params.steps1 || 9,
    steps2: params.steps2 || 4,
    cfg: params.cfg || 1.0,
    seed: actualSeed,
    outputPrefix,
    unetModel: model || "auto",
  });

  console.log(`[Bridge] ComfyUI video generation: ${outputPrefix} (${params.family})`);
  const result = await comfySubmitAndWait(workflow);
  const output = comfyFindOutput(result.outputs);
  if (!output) throw new Error("No video output from workflow");

  const vidFile = output.files.find(f => f.type === "output") || output.files[0];
  const vidBuffer = await comfyDownload(vidFile.filename, vidFile.subfolder, vidFile.type);

  const outDir = outputDir || path.join(process.cwd(), "data", "mvc");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const localName = `${outputPrefix}_${actualSeed}.mp4`;
  const localPath = path.join(outDir, localName);
  fs.writeFileSync(localPath, vidBuffer);

  return {
    url: `/data/mvc/${localName}`,
    localPath,
    source: "comfyui",
    model: model || "auto",
    seed: actualSeed,
    prompt: videoPrompt,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Register Built-in Pipelines
   ═══════════════════════════════════════════════════════════════════════════════ */

registerPipeline({
  id: "flux-image",
  mediaType: "image",
  modelPattern: /flux|klien|klein/i,
  requiredNodes: ["UnetLoaderGGUF", "VAELoader", "DualCLIPLoader", "CLIPTextEncode", "EmptyLatentImage", "SamplerCustom", "VAEDecode", "SaveImage"],
  build: (ctx) => buildFLUX2Workflow(ctx),
});

registerPipeline({
  id: "ltx-video",
  mediaType: "video",
  modelPattern: /ltx|wan|cogvideox/i,
  requiredNodes: ["UnetLoaderGGUF", "VAELoader", "DualCLIPLoader", "LTXVConditioning", "LTXVImgToVideo", "SamplerCustom", "VAEDecode"],
  build: (ctx) => buildLTX2Workflow(ctx),
});

registerPipeline({
  id: "standard-checkpoint",
  mediaType: "image",
  modelPattern: /sdxl|sd3|\.ckpt$/i,
  requiredNodes: ["CheckpointLoaderSimple", "KSampler", "VAEDecode", "SaveImage"],
  build: (ctx) => {
    /* Standard checkpoint workflow — uses CheckpointLoaderSimple */
    const params = inferModelParameters(ctx.model);
    return {
      "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: ctx.model || "auto" } },
      "2": { class_type: "CLIPTextEncode", inputs: { text: ctx.prompt, clip: ["1", 1] } },
      "3": { class_type: "CLIPTextEncode", inputs: { text: ctx.negativePrompt || "", clip: ["1", 1] } },
      "4": { class_type: "EmptyLatentImage", inputs: { width: ctx.width || 1024, height: ctx.height || 1024, batch_size: 1 } },
      "5": { class_type: "KSampler", inputs: { model: ["1", 0], positive: ["2", 0], negative: ["3", 0], latent_image: ["4", 0], seed: ctx.seed || 0, steps: params.steps || 20, cfg: params.cfg || 3.5, sampler_name: "euler", scheduler: "normal", denoise: 1.0 } },
      "6": { class_type: "VAEDecode", inputs: { samples: ["5", 0], vae: ["1", 2] } },
      "7": { class_type: "SaveImage", inputs: { images: ["6", 0], filename_prefix: ctx.outputPrefix || "generated" } },
    };
  },
});

/* ═══════════════════════════════════════════════════════════════════════════════
   Exports
   ═══════════════════════════════════════════════════════════════════════════════ */

export {
  /* Pipeline registry */
  registerPipeline,
  getPipeline,
  listPipelines,
  detectPipeline,
  /* Model inference */
  inferModelParameters,
  /* Capability discovery */
  discoverCapabilities,
  /* Unified generation */
  generateImage,
  generateImageLocal,
  generateVideo,
  /* Re-exports for convenience */
  comfyQueue,
  comfySubmitAndWait,
  comfyFindOutput,
  comfyDownload,
  comfyUpload,
  COMFYUI_URL,
};
