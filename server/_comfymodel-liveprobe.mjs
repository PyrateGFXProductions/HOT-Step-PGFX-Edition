// ── _comfymodel-liveprobe.cjs ───────────────────────────────────────────────────
// Live probe: verify the running comfyui-client.mjs normalizes the EXACT model
// names the server sends (forward slashes) to ComfyUI's canonical backslash
// listing form, against the LIVE ComfyUI at 127.0.0.1:8188.
// Run from `server\` via `..\runtime\node.exe _comfymodel-liveprobe.cjs`.
// --------------------------------------------------------------------------------
import { comfyResolveModelName, comfyNormalizeWorkflowModelNames, buildMiniMaxH3Workflow } from "./services/comfyui-client.mjs";

const probes = [
  ["UNETLoader", "unet_name", "FLUX.2/flux-2-klein-9b-fp8.safetensors"],
  ["VAELoader", "vae_name", "FLUX.2/flux2-vae.safetensors"],
  ["UnetLoaderGGUF", "unet_name", "ltx2.3/LTX-2.3-22B-distilled-1.1-Q4_K_M.gguf"],
  ["VAELoader", "vae_name", "ltx2.3/ltx-2.3-22b-distilled_video_vae.safetensors"],
  ["VAELoader", "vae_name", "ltx2.3/ltx-2.3-22b-distilled_audio_vae.safetensors"],
  ["CLIPLoader", "clip_name", "qwen_3_8b_fp8mixed.safetensors"],
  ["CLIPLoader", "clip_name", "ltx2.3/ltx-2.3-22b-distilled_embeddings_connectors.safetensors"],
];

let pass = 0, fail = 0;
for (const [cls, input, name] of probes) {
  const resolved = await comfyResolveModelName(cls, input, name);
  const hasBackslash = resolved.includes("\\");
  const hasForward = resolved.includes("/");
  const ok = resolved !== "auto" && (resolved === name || hasBackslash) && !hasForward;
  const status = ok ? "ok " : "FAIL";
  if (ok) pass++; else fail++;
  console.log(`${status} ${cls}.${input} '${name}' -> '${resolved}'`);
}

/* Whole-workflow rewrite + membership check against live lists */
const wf = {
  "1": { class_type: "UNETLoader", inputs: { unet_name: "FLUX.2/flux-2-klein-9b-fp8.safetensors", weight_dtype: "fp8_e4m3fn" } },
  "2": { class_type: "VAELoader", inputs: { vae_name: "FLUX.2/flux2-vae.safetensors" } },
  "3": { class_type: "CLIPLoader", inputs: { clip_name: "qwen_3_8b_fp8mixed.safetensors", type: "flux2" } },
};
await comfyNormalizeWorkflowModelNames(wf);
const unetOk = wf["1"].inputs.unet_name.includes("\\");
const vaeOk = wf["2"].inputs.vae_name.includes("\\");
const clipOk = wf["3"].inputs.clip_name === "qwen_3_8b_fp8mixed.safetensors";
console.log(`workflow unet_name: ${wf["1"].inputs.unet_name} ${unetOk ? "ok" : "FAIL"}`);
console.log(`workflow vae_name:  ${wf["2"].inputs.vae_name} ${vaeOk ? "ok" : "FAIL"}`);
console.log(`workflow clip_name: ${wf["3"].inputs.clip_name} ${clipOk ? "ok" : "FAIL"}`);
if (unetOk) pass++; else fail++;
if (vaeOk) pass++; else fail++;
if (clipOk) pass++; else fail++;

/* MiniMax H3 (session 40): default workflow + normalization against LIVE lists */
console.log("== MiniMax H3 live workflow checks ==");
const h3wf = buildMiniMaxH3Workflow({
  imageFilename: "seg_0.png",
  videoPrompt: "The cow walks to the velvet seat. Audio: warm projector hum",
  width: 768,
  height: 512,
  durationSec: 5,
  steps: 20,
  seed: 424242,
  outputPrefix: "mvc_h3_liveprobe"
});
await comfyNormalizeWorkflowModelNames(h3wf);
const h3Checks = [
  ["H3 unet normalized", h3wf["1"].inputs.unet_name.includes("\\")],
  ["H3 video vae normalized", h3wf["3"].inputs.vae_name.includes("\\")],
  ["H3 audio vae normalized", h3wf["4"].inputs.vae_name.includes("\\")],
  ["H3 clip normalized", h3wf["2"].inputs.clip_name.includes("\\")],
  ["H3 length 5s on 17k+5 grid", h3wf["6"].inputs.length === 124],
  ["H3 canvas 768x512 -> 1152x768", h3wf["6"].inputs.width === 1152 && h3wf["6"].inputs.height === 768],
  ["H3 sampler res_multistep", h3wf["8"].inputs.sampler_name === "res_multistep"],
  ["H3 scheduler simple", h3wf["9"].inputs.scheduler === "simple"],
  ["H3 VHS h264 + native audio at 24fps", h3wf["14"].inputs.format === "video/h264-mp4" && h3wf["14"].inputs.frame_rate === 24 && h3wf["14"].inputs.audio[0] === "13"],
];
for (const [label, ok] of h3Checks) {
  console.log(`${ok ? "ok " : "FAIL"} ${label}`);
  if (ok) pass++; else fail++;
}
console.log(`H3 unet final:   ${h3wf["1"].inputs.unet_name}`);
console.log(`H3 clip final:   ${h3wf["2"].inputs.clip_name}`);
console.log(`H3 vae final:    ${h3wf["3"].inputs.vae_name}`);
console.log(`H3 audioVae fin: ${h3wf["4"].inputs.vae_name}`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
