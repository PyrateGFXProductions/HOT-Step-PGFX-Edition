/**
 * ComfyUI Model Discovery Service
 * ────────────────────────────────
 * Auto-detects ComfyUI, scans model directories, builds a unified model
 * registry combining ACE-Step models + ComfyUI models + local models.
 *
 * Provides:
 *   - ComfyUI connection detection (cached, graceful degradation)
 *   - Filesystem model scan (all ComfyUI model subdirs)
 *   - /object_info/ API query for node-level model lists
 *   - Unified GET /api/models response
 *   - Model category counts, file sizes, VRAM estimates
 *
 * Extracted from server.mjs as an ES module.
 */

import fs from "fs";
import path from "path";

/* ═══════════════════════════════════════════════════════════════════════════════
   Configuration
   ═══════════════════════════════════════════════════════════════════════════════ */

const COMFYUI_URL = process.env.COMFYUI_URL || "http://127.0.0.1:8188";
const CACHE_TTL_MS = 300000; /* re-scan ComfyUI models every 5 minutes */
const CONNECT_CHECK_TTL_MS = 60000; /* re-check connection every 60 seconds */

/* ═══════════════════════════════════════════════════════════════════════════════
   ComfyUI Model Category → Filesystem Subdirectory Mapping
   ═══════════════════════════════════════════════════════════════════════════════ */

const COMFYUI_MODEL_DIRS = {
  "image_unet":     { subdirs: ["unet", "diffusion_models", "checkpoints", "ckpt"], extensions: [".safetensors", ".ckpt", ".gguf", ".bin", ".pt", ".pth"] },
  "image_vae":      { subdirs: ["vae", "vae_approx"], extensions: [".safetensors", ".ckpt", ".bin", ".pt", ".pth"] },
  "image_clip":     { subdirs: ["clip", "clip_vision", "text_encoder"], extensions: [".safetensors", ".ckpt", ".bin", ".gguf", ".pt", ".pth"] },
  "video":          { subdirs: ["unet", "diffusion_models"], extensions: [".safetensors", ".gguf", ".bin", ".pt", ".pth"], filter: (name) => /ltx|wan|video|cogvideox/i.test(name) },
  "audio":          { subdirs: ["audio", "diffusion_models"], extensions: [".safetensors", ".onnx", ".bin", ".pt", ".pth"], filter: (name) => /roformer|audio|mel_band|stem|separation/i.test(name) },
  "lora":           { subdirs: ["loras", "lycoris"], extensions: [".safetensors", ".ckpt"] },
  "controlnet":     { subdirs: ["controlnet", "control_net"], extensions: [".safetensors", ".ckpt", ".bin"] },
  "embedding":      { subdirs: ["embeddings", "textual_inversion"], extensions: [".safetensors", ".bin", ".pt"] },
  "upscale":        { subdirs: ["upscale_models", "upscale_models/4x-UltraSharp"], extensions: [".pth", ".pt", ".bin"] },
  "style_model":    { subdirs: ["style_models", "ipadapter"], extensions: [".safetensors", ".bin", ".pt"] },
  "wildcard":       { subdirs: ["wildcards"], extensions: [".txt", ".yaml", ".json"] },
  "workflow":       { subdirs: ["workflows"], extensions: [".json"] },
};

/* ═══════════════════════════════════════════════════════════════════════════════
   ComfyUI Node Class → Category Mapping (for /object_info/ parsing)
   ═══════════════════════════════════════════════════════════════════════════════ */

const NODE_TYPE_TO_CATEGORY = {
  "CheckpointLoaderSimple":      "image_unet",
  "CheckpointLoader":            "image_unet",
  "UnetLoaderGGUF":              "image_unet",
  "UNETLoader":                  "image_unet",
  "DiffusersLoader":             "image_unet",
  "VAELoader":                   "image_vae",
  "CLIPLoader":                  "image_clip",
  "DualCLIPLoader":              "image_clip",
  "TripleCLIPLoader":            "image_clip",
  "CLIPTextEncode":              "image_clip",
  "LoraLoader":                  "lora",
  "LoraLoaderModelOnly":         "lora",
  "ControlNetLoader":            "controlnet",
  "UpscaleModelLoader":          "upscale",
  "StyleModelLoader":            "style_model",
  "IPAdapterModelLoader":        "style_model",
  "LUTLoader":                   "style_model",
  "Embedding":                   "embedding",
  "LoadImage":                   "image",
  "LoadAudio":                   "audio",
  "LTXVConditioning":            "video",
  "LTXVImgToVideo":              "video",
  "LoadVideo":                   "video",
  "WanImageToVideo":             "video",
  "WanVideoSampler":             "video",
};

/* ═══════════════════════════════════════════════════════════════════════════════
   State
   ═══════════════════════════════════════════════════════════════════════════════ */

let _comfyuiConnected = false;
let _comfyuiConnectedAt = 0;
let _comfyuiSystemInfo = null;

let _modelCache = null;
let _modelCacheAt = 0;
let _comfyuiModelsByCategory = null;
let _objectInfoCache = null;

/* ═══════════════════════════════════════════════════════════════════════════════
   ComfyUI Connection Detection (cached)
   ═══════════════════════════════════════════════════════════════════════════════ */

export async function detectComfyUI(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && _comfyuiConnectedAt && (now - _comfyuiConnectedAt) < CONNECT_CHECK_TTL_MS) {
    return { connected: _comfyuiConnected, systemInfo: _comfyuiSystemInfo };
  }

  try {
    const resp = await fetch(`${COMFYUI_URL}/system_stats`, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const sys = await resp.json();
    const device = sys?.devices?.[0] || {};
    _comfyuiConnected = true;
    _comfyuiSystemInfo = {
      vramTotal: device.vram_total || 0,
      vramFree: device.vram_free || 0,
      vramUsed: (device.vram_total || 0) - (device.vram_free || 0),
      deviceName: device.name || "unknown",
      pythonVersion: sys?.system?.python_version || "unknown",
      comfyuiVersion: sys?.system?.comfyui_version || "unknown",
      torchVersion: sys?.system?.pytorch_version || "unknown",
      cudaVersion: sys?.system?.cuda_version || "unknown",
    };
    _comfyuiConnectedAt = now;
    console.log(`[ModelScanner] ComfyUI connected: ${_comfyuiSystemInfo.deviceName}, VRAM ${(_comfyuiSystemInfo.vramFree / 1e9).toFixed(1)}GB free / ${(_comfyuiSystemInfo.vramTotal / 1e9).toFixed(1)}GB total`);
  } catch (err) {
    _comfyuiConnected = false;
    _comfyuiSystemInfo = null;
    _comfyuiConnectedAt = now;
    console.log(`[ModelScanner] ComfyUI not reachable at ${COMFYUI_URL}: ${err.message}`);
  }

  return { connected: _comfyuiConnected, systemInfo: _comfyuiSystemInfo };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   /object_info/ API Query — discovers what models ComfyUI actually has loaded
   ═══════════════════════════════════════════════════════════════════════════════ */

async function queryObjectInfo() {
  if (_objectInfoCache) return _objectInfoCache;
  try {
    const resp = await fetch(`${COMFYUI_URL}/object_info`, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    _objectInfoCache = await resp.json();
    console.log(`[ModelScanner] /object_info/ returned ${Object.keys(_objectInfoCache).length} node types`);
  } catch (err) {
    console.log(`[ModelScanner] /object_info/ query failed: ${err.message}`);
    _objectInfoCache = {};
  }
  return _objectInfoCache;
}

/** Extract model filenames from /object_info/ for specific node types */
function extractModelsFromObjectInfo(objectInfo, nodeType) {
  const models = new Set();
  const nodeDef = objectInfo[nodeType];
  if (!nodeDef?.input?.required) return [...models];

  const required = nodeDef.input.required;
  for (const [paramName, paramDef] of Object.entries(required)) {
    /* ComfyUI model lists appear as [list_of_strings, {"default": ...}] */
    if (Array.isArray(paramDef) && Array.isArray(paramDef[0])) {
      for (const name of paramDef[0]) {
        if (typeof name === "string") models.add(name);
      }
    }
  }
  return [...models];
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Filesystem Model Scanner — reads actual files from ComfyUI model dirs
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Find the ComfyUI installation directory by probing common locations.
 */
export function findComfyUIDir() {
  const candidates = [
    process.env.COMFYUI_DIR,
    "E:\\ComfyUI-Easy-Install_torch-2.9.1+cu130\\ComfyUI-Easy-Install\\ComfyUI",
    path.join(process.env.LOCALAPPDATA || "", "ComfyUI"),
    path.join(process.env.USERPROFILE || "", "ComfyUI"),
    "C:\\ComfyUI",
    "D:\\ComfyUI",
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const modelsDir = path.join(candidate, "models");
      if (fs.existsSync(modelsDir)) {
        console.log(`[ModelScanner] ComfyUI found at: ${candidate}`);
        return candidate;
      }
    } catch {}
  }
  return null;
}

/**
 * Recursively scan a directory for model files.
 * Returns an array of { name, path, size, modified } objects.
 */
function scanDirForModels(dirPath, extensions, maxDepth = 3) {
  const results = [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue; /* skip hidden files */
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        if (maxDepth > 0) {
          results.push(...scanDirForModels(fullPath, extensions, maxDepth - 1));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (extensions.includes(ext)) {
          try {
            const stat = fs.statSync(fullPath);
            results.push({
              name: entry.name,
              path: fullPath,
              size: stat.size,
              modified: stat.mtime.toISOString(),
            });
          } catch {}
        }
      }
    }
  } catch {}
  return results;
}

/**
 * Scan all ComfyUI model directories and categorize models.
 */
function scanComfyUIFilesystem(comfyDir) {
  const modelsDir = path.join(comfyDir, "models");
  if (!fs.existsSync(modelsDir)) return {};

  const result = {};
  for (const [category, config] of Object.entries(COMFYUI_MODEL_DIRS)) {
    const categoryModels = [];
    for (const subdir of config.subdirs) {
      const dirPath = path.join(modelsDir, subdir);
      const files = scanDirForModels(dirPath, config.extensions);
      for (const file of files) {
        /* Apply category-specific filter if present */
        if (config.filter && !config.filter(file.name)) continue;
        categoryModels.push({
          name: file.name,
          path: file.path,
          /* Relative path from models/ for display */
          relativePath: path.relative(modelsDir, file.path),
          size: file.size,
          sizeFormatted: formatBytes(file.size),
          modified: file.modified,
        });
      }
    }
    /* Sort by name */
    categoryModels.sort((a, b) => a.name.localeCompare(b.name));
    result[category] = categoryModels;
  }
  return result;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Unified Model Registry
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Build the complete model registry: ACE-Step + ComfyUI + local.
 * Cached for CACHE_TTL_MS.
 */
export async function buildModelRegistry(aceStepModels = {}) {
  const now = Date.now();
  if (_modelCache && (now - _modelCacheAt) < CACHE_TTL_MS) return _modelCache;

  const { connected: comfyConnected, systemInfo } = await detectComfyUI();
  const comfyDir = comfyConnected ? findComfyUIDir() : null;

  /* ── ComfyUI models (filesystem + API) ── */
  let comfyModels = {};
  let objectInfoModels = {};

  if (comfyConnected) {
    comfyModels = comfyDir ? scanComfyUIFilesystem(comfyDir) : {};
    const objectInfo = await queryObjectInfo();
    objectInfoModels = extractObjectInfoModels(objectInfo);
  }

  /* ── ACE-Step models (from server.mjs) ── */
  const aceModels = normalizeACEStepModels(aceStepModels);

  /* ── Combine into unified registry ── */
  const registry = {
    timestamp: new Date().toISOString(),
    comfyui: {
      connected: comfyConnected,
      url: COMFYUI_URL,
      systemInfo,
      models: comfyModels,
      objectInfo: objectInfoModels,
    },
    acestep: aceModels,
    categories: buildCategorySummary(comfyModels, aceModels),
    totalModels: 0,
  };

  /* Count total */
  let total = 0;
  for (const cat of Object.values(comfyModels)) total += cat.length;
  for (const cat of Object.values(aceModels)) {
    if (Array.isArray(cat)) total += cat.length;
  }
  registry.totalModels = total;

  _modelCache = registry;
  _modelCacheAt = now;
  console.log(`[ModelScanner] Registry built: ${total} models (${Object.keys(comfyModels).length} ComfyUI categories, ${Object.keys(aceModels).length} ACE-Step categories)`);
  return registry;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════════ */

/** Extract models from /object_info/ grouped by our categories */
function extractObjectInfoModels(objectInfo) {
  const result = {};
  for (const [nodeType, category] of Object.entries(NODE_TYPE_TO_CATEGORY)) {
    const models = extractModelsFromObjectInfo(objectInfo, nodeType);
    if (models.length > 0) {
      if (!result[category]) result[category] = {};
      result[category][nodeType] = models;
    }
  }
  return result;
}

/** Normalize ACE-Step model paths from the server's existing model data */
function normalizeACEStepModels(aceStepModels) {
  const result = {};
  for (const [key, val] of Object.entries(aceStepModels)) {
    if (Array.isArray(val)) {
      result[key] = val.map(v => ({
        name: typeof v === "string" ? path.basename(v) : v.name || v,
        path: typeof v === "string" ? v : v.path || "",
        source: "acestep",
      }));
    } else if (typeof val === "string") {
      result[key] = [{ name: path.basename(val), path: val, source: "acestep" }];
    }
  }
  return result;
}

/** Build summary counts per category */
function buildCategorySummary(comfyModels, aceModels) {
  const summary = {};
  const allCategories = new Set([...Object.keys(comfyModels), ...Object.keys(aceModels)]);
  for (const cat of allCategories) {
    const comfyCount = comfyModels[cat]?.length || 0;
    const aceCount = aceModels[cat]?.length || 0;
    summary[cat] = {
      total: comfyCount + aceCount,
      comfyui: comfyCount,
      acestep: aceCount,
      label: categoryLabel(cat),
    };
  }
  return summary;
}

/** Human-readable category labels */
function categoryLabel(cat) {
  const labels = {
    image_unet: "Image Models (UNet / Checkpoint / Diffusion)",
    image_vae: "VAE (Variational Autoencoder)",
    image_clip: "Text Encoders (CLIP / T5 / Gemma)",
    video: "Video Models (LTX / Wan / CogVideo)",
    audio: "Audio Models (MelBand / BS-RoFormer)",
    lora: "LoRAs",
    controlnet: "ControlNets",
    embedding: "Embeddings / Textual Inversion",
    upscale: "Upscale Models",
    style_model: "Style / IP-Adapter Models",
    wildcard: "Wildcards",
    workflow: "Workflows",
  };
  return labels[cat] || cat;
}

/** Format bytes to human-readable */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

/** Get current connection status (sync, cached) */
export function getComfyUIStatus() {
  return {
    connected: _comfyuiConnected,
    systemInfo: _comfyuiSystemInfo,
    lastChecked: _comfyuiConnectedAt ? new Date(_comfyuiConnectedAt).toISOString() : null,
  };
}

/** Invalidate the model cache (e.g., after ComfyUI restart) */
export function invalidateCache() {
  _modelCache = null;
  _modelCacheAt = 0;
  _objectInfoCache = null;
  _comfyuiConnectedAt = 0;
  console.log("[ModelScanner] Cache invalidated");
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Exports
   ═══════════════════════════════════════════════════════════════════════════════ */

export {
  COMFYUI_URL,
  COMFYUI_MODEL_DIRS,
  NODE_TYPE_TO_CATEGORY,
  categoryLabel,
  formatBytes,
  scanDirForModels,
};
