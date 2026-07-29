# HOT-Step CPP — PGFX Edition

> **Do you want to take your album art from Meh to YEAH!!!. Then unleash the full potential of HOT-Step-CPP with this enhancement. HOT-Step-CPP was rightfully built for lesser hardware — but if you've got the RAM, VRAM & GPU to dream bigger, the PGFX Edition gives you access to ComfyUI-grade FLUX.2 9B+ models, LTX 2.3 video generation, and a full AI music video studio. Your hardware deserves better. So do your songs. BEWARE - If your rig is not capable this enhancement can and will cripple your machine!!!**
> Built on [HOT-Step CPP](https://github.com/scragnog/HOT-Step-CPP) v1.1.4 by scragnog. Enhanced by PyrateGFX Productions.

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/pyrategfxproductions)

![PyrateGFX Productions](/ui/dist/PGFX_HOT-Step_logo.png)

---

## What is this?

This is a comprehensive enhancement fork of HOT-Step CPP — the local AI music generation tool built on ACE-Step. The PGFX Edition transforms it from a capable inference wrapper into a full **music production system** with genre-aware song structure, narrative intelligence, and creative workflow tools.

**Base**: HOT-Step CPP v1.1.4 (Windows x64, CUDA 13.1)
**Enhancements**: 99 sections of improvements across 14 phases

---

## What's New in the PGFX Edition

### Genre-Aware Song Architecture (60+ Structure Templates)
Every genre now has its own structural grammar — verse/chorus/bridge line counts, section ordering, and rhythm patterns that match how that genre *actually works*. Metal doesn't structure like reggae doesn't structure like K-pop doesn't structure like blues.

- **Multi-select genre picker** — choose multiple genres per album and per track, with a categorized, searchable picker containing 200+ genres across 17 categories. Matches the main page's `GenreSelector.tsx` design.
- **Primary-genre-wins architecture**: First selected genre dictates structure. Secondary genres influence vocabulary, tone, and instrumentation only.
- **60+ templates**: Metal (8 variants), Reggae (3), K-Pop, Hip-Hop (7), Blues (6), Punk (6), Folk (5), DJ/Turntablism (2), Traditional/World (4), plus genre-agnostic fallbacks.
- **DJ / Turntablism** and **Dual DJ** as first-class genres with scratch effects, battle vocabulary, and turntablist structure.
- **4 Traditional/World Music Genres**: Klezmer, Mariachi, Bhangra, Andean — each with culturally-specific structure templates, vocabulary modules, BPM ranges, and sonic tag examples. (Genres that ACE-Step cannot authentically reproduce — such as Gagaku, Carnatic, Hindustani, Gamelan, Tuvan Throat Singing, and others — have been removed to ensure every listed genre produces what it promises.)
- **Patois now optional** with bilingual code-switching support for non-English + Patois combinations.

### Narrative Intelligence
- **3-Act Story Structure**: Every song progresses through Setup → Conflict → Resolution.
- **Narrative Coherence Enforcement**: Every image must connect to the subject.
- **Subject-Aware Vocabulary Protection**: Words in your subject are never replaced by the slop filter.
- **Mandatory Outro**: Every song ends with a proper 3-4 line wind-down — never an abrupt stop.

### Gender & Vocalist Context
- **Album-level gender fields**: Set vocalist gender (male/female/duet) and song subject gender (about a man/about a woman) — flows through lyrics generation, image prompts, and album concept creation.
- **Coherent pronouns**: LLM prompts receive explicit pronoun rules so a male vocalist singing about a woman uses "he" for the singer and "she" for the subject throughout.
- **Gender-aware cover art**: `buildCoverArtPrompt()` enriches scenes with person descriptors ("a man standing in...", "a woman in a scene of...") based on the gender context.
- **Applies to**: AI Auto-Fill, Shuffle Tracks, per-track lyrics generation, album concept, and cover art / video section images.

### Anti-AI Slop System
- **100+ banned words** that make AI lyrics sound generically robotic.
- **Deterministic slop replacer** that swaps clichés for genre-appropriate alternatives.
- **Grease Spot Rule**: Forces concrete nouns over abstract adjectives, with an existential exception for doom metal, folk, shoegaze, and post-rock.

### 🌟 Album Creator
*One of the standout features of the PGFX Edition!*
It will create an album of up to 20 tracks with a full story concept from the first track to the last track, either user-created or auto-generated with context based on the genre.

- Generate up to **20 tracks** with per-track subject, title, genre override, and custom lyrics.
- **AI Auto-Fill**: One-click generates a complete album concept with a story arc across all tracks.
- **Shuffle Tracks**: Re-roll all track subjects while preserving the album theme.
- **Artist Name & Album Title**: Auto-filled from saved username or randomly generated. Editable with 🎲 random buttons.
- **Random Album Theme**: 🎲 button generates a genre-aware album concept via LLM — picks up on selected genres and gender context to produce a thematically relevant concept.
- **Persistent Metadata**: LLM-generated BPM, key, duration, and time signature survive page reloads — no need to re-run the LLM if you navigate away.
- **ZIP Download**: Download the entire album as a organized ZIP file with folder structure: `Artist Name/Album Title/01 - Track Title.wav`. Includes `metadata.txt` with track listing.
- **Sequential generation pipeline**: LLM lyrics → ACE-Step audio → playback.
- **Pure Prompt Manager**: The Album Creator generates prompts and hands them off to the main page's generation pipeline — zero duplication of generation logic.

#### Album Batch Handler (API-Direct)
When you click "Generate Album" in the Album Creator, it redirects to the main page where a floating batch panel appears. The batch handler:

- **3-Tier Settings Priority**: (1) Monkey-patch capture from a generation on this session, (2) Saved template with `_src` marker, (3) Direct read from `hs-*` localStorage keys via `readSettingsFromStorage()`.
- **Never Overrides Pipeline Settings**: Only prompt fields (caption, lyrics, title, bpm, duration, etc.) are overridden per track. All generation settings (solver, scheduler, guidance, DCW, etc.) come from the user's configured settings.
- **Stale Template Protection**: Old v1/v2 templates without `_src` marker are auto-purged on page load.
- **Video Generation**: After each track's audio completes, the batch handler calls the unified `/api/inspire/video/create` endpoint to generate a section-aware, beat-synced music video. *Requires cover art models to be installed and ffmpeg in the server directory.*

### Audio-Reactive Visualizer
Eleven visualization modes powered by client-side beat detection:
- **Bars** — 64-bar spectrum analyzer with peaks, reflections, and gradient fills
- **Wave** — 3-layer oscilloscope with afterglow and optional mirror
- **Particles** — 600-pool beat-spawned particle system with glow
- **Circular** — 128 radial bars with rotation and inner mirror
- **Plasma** — Full-screen audio-reactive plasma effect
- **Tunnel** — Perspective-correct rectangular tunnel with depth
- **Starfield** — 400-star warp field with streaks
- **Rings** — Concentric rotating rings reactive to frequency bands
- **Liquid** — Layered fluid waves with floating orbs
- **Image + FX** — Cover art with spectrum overlay, vignette, and particle bursts
- **Milkdrop** — WebGL Milkdrop renderer via Butterchurn with 70+ built-in presets and custom `.milk` file import

**Settings panel**: 6 color schemes, sensitivity, smoothing, brightness, BG opacity, mode blending, mirror, glow, and scanline toggles.
**Preset browser** (Milkdrop mode): Searchable preset list, prev/next/shuffle navigation, drag-and-drop `.milk` file import for custom presets.
**Playback controls**: Play/pause, stop, prev/next, seek bar, volume, track info.
**Playlist**: Auto-loads songs from server, shuffle, repeat, auto-advance.
**Video generation**: One-click MP4 creation via server ffmpeg pipeline.
**Main app integration**: Visualizer button opens in a new browser tab (to avoid iframe autoplay restrictions) with the currently playing song pre-loaded and auto-playing.
**Keyboard shortcuts**: `Space` Play/Pause, `1`-`0` Modes, `M` Milkdrop, `F` Fullscreen, `R` Record, `S` Settings, `L` Playlist, `P` Presets.

#### Performance Optimizations (Phase 10)
- **Plasma mode**: Pre-computed sin/cos lookup tables (2048-entry Float32Array) replace 6 `Math.sin()` + 1 `Math.cos()` per-pixel. Distance LUT pre-computed per resolution. Bit-shift indexing, integer truncation, brightness pre-factorized outside loop.
- **Scanlines**: Pre-rendered scanline overlay canvas replaces per-line `fillRect` calls. Redundant inline scanline draws removed from Plasma and Image+FX modes.
- **Frame timing**: Proper delta-time from `requestAnimationFrame` timestamps replaces hardcoded `0.016` increment. 100ms cap prevents jumps after tab-switch.
- **Disco particles (React app)**: DOM-based particle system (`document.createElement('div')` × 30, 6 style writes each, `will-change` GPU layers, `setTimeout` cleanup) replaced with single-canvas renderer. Particles managed as plain JS objects in a `requestAnimationFrame` loop — zero DOM manipulation per particle, single GPU layer.

#### Disco Mode Latency Fix (Phase 10)
The React app's Disco mode previously spawned individual `<div>` DOM elements for each particle (up to 30 concurrent), each with 6 inline style writes, CSS `will-change` forcing separate GPU compositor layers, and `setTimeout`-based cleanup causing asynchronous layout thrashing. This caused severe jank at 60fps. The fix replaces the entire DOM particle system with a canvas-based renderer that draws all particles on a single `<canvas>` element using `ctx.arc()`, with energy values read from a ref in the `requestAnimationFrame` loop (avoiding React re-renders on every beat).

### MP4 Video Generator
- **Unified pipeline** — single `POST /api/inspire/video/create` endpoint handles everything: parse lyrics → calculate section timings from BPM → generate section-aware images → assemble beat-synced Ken Burns video
- Beat-synced crossfades between cover art images
- Ken Burns zoom effects on each image (6 directional variants: center-in, center-out, left, right, top, bottom)
- Audio-reactive waveform overlay
- 10 transition types: fade, dissolve, fadeblack, fadewhite, smoothleft, smoothright, circlecrop, radial, pixelize, diagtl
- Uses ffmpeg for rendering (included or downloadable)

### 🎬 Album Music Video Pipeline
*Automatic lyric-driven music video generation for each album track.*

- **Lyric Section Splitting**: Splits lyrics by `[Section]` headers (Verse, Chorus, Bridge, etc.) into visual segments.
- **Context Image Generation**: Each section gets a FLUX-generated image based on the lyrics' visual themes using the existing cover art prompt builder.
- **Beat-Synced Video Rendering**: Images are timed to musical structure using server-side beat detection. Transitions happen at onset points, not arbitrary timestamps.
- **ZIP Integration**: Completed albums include both `.wav` and `.mp4` files in the organized folder structure.
- **Unified Endpoint**: `POST /api/inspire/video/create` — one endpoint handles the full pipeline for both single tracks and album batch. Accepts `songId` for existing songs or direct params (`audioUrl`, `lyrics`, `style`, `coverArtSubject`, `vocalistGender`, `aboutGender`).
- **Section-Aware Cover Art**: Each lyric section gets its own image with 3-act narrative emphasis, subject grounding, and anti-GTA text suppression.
- **Gender-Aware Person Descriptors**: Cover art and video images use gender context to produce accurate person visuals.
- **Static Video Serving**: Generated MP4s served from `/temp/video/` route.

*Note: Cover art can use either the **local sd-cli engine** (download via **Settings → Cover Art → Download Models + Engine**) or the **ComfyUI bridge** (uses your existing ComfyUI models). Click the 🖼️ floating button (bottom-right) to open the Cover Art Engine panel, toggle "Use ComfyUI Bridge", and select your preferred UNet/VAE/CLIP models from what's already installed in ComfyUI. No duplicate model downloads needed.*

### Music Video Creator
A full-featured music video production page with stem-reactive layered effects, AI image/video generation via ComfyUI, and MP4 export.

- **Layer stack** — 6 default layers (Kick, Snare, HiHat, Lead Vocals, Bass, Backing Vocals), up to 17 total. Each layer has: stem assignment, visual effect, blend mode, opacity, beat sensitivity, color tint, mute/solo.
- **12 visual effects** — Bars, Wave, Particles, Circular, Plasma, Tunnel, Rings, Liquid, Starfield, Circular Bars, Spectrum, Galaxy. Real-time multi-layer compositing with per-stem AnalyserNodes.
- **Stem decomposition** — Server-side SuperSep splits audio into stems (Drums, Bass, Vocals, Other) before visualization. Stems are assigned to layers for beat-reactive effects.
- **ComfyUI image generation** — Section-aware prompts with gender context. Generates a unique image per lyric section (Verse, Chorus, Bridge, etc.) using FLUX.2 Klein 9B. Supports single image or batch generation for all sections.
- **ComfyUI video generation** — LTX 2.3 22B distilled image-to-video via ComfyUI. Two-pass sampling, audio+video latent concatenation, spatial upscaler, RTX Video Super Resolution, ColorMatch + Sharpen.
- **ComfyUI Model Browser** — Real-time model discovery with status widget (green/orange/red dot showing ComfyUI connection + VRAM). Per-pipeline model arrays: FLUX.2 (UNet, VAE, Text Encoder) and LTX 2.3 (UNet, Video VAE, Text Encoder, Audio VAE, IC-LoRA, Upscaler). Models auto-scanned from correct ComfyUI directories with smart labels.
- **ComfyUI Bridge** — When ComfyUI is online, all image/video generation routes through it automatically. When offline, cover art falls back to local `sd-cli.exe` (FLUX.2 Klein 9B). Pipeline auto-detection from model filename. Model parameter inference (steps, CFG) from model name.
- **Timeline** — Section blocks with transport controls (play/pause, stop, seek). Visual effects are synced to the timeline position.
- **Export** — Server-side FFmpeg compositing: resolution/FPS/audio options, Ken Burns zoom on images, crossfade transitions, audio waveform overlay.
- **Keyboard shortcuts** — Space (play/pause), Esc (exit), M (mute), S (solo), A (add layer), Delete (remove layer), 1-9 (select layer).

*Requires ComfyUI running locally with LTX 2.3 and FLUX.2 models installed. See [ComfyUI Setup](#comfyui-setup) below.*

#### ComfyUI Setup
1. Install ComfyUI (e.g., via [Easy Install](https://github.com/ComfyUI-Easy-Install))
2. Install custom nodes: ComfyUI-GGUF, ComfyUI-LTXVideo
3. Download models and place in ComfyUI model directories:
   - **LTX 2.3**: `LTX-2.3-22B-distilled-1.1-Q4_K_M.gguf` (unet/ltx2.3/), `ltx-2.3-22b-distilled_video_vae.safetensors` + `audio_vae` (vae/ltx2.3/), `gemma_3_12B_it_fp4_mixed.safetensors` (text_encoders/), `ltx-2.3-22b-distilled_embeddings_connectors.safetensors` (text_encoders/ltx2.3/), `ltx-2.3-22b-ic-lora-union-control-ref0.5.safetensors` (loras/ltx2.3/), `ltx-2.3-spatial-upscaler-x2-1.1.safetensors` (latent_upscale_models/ltx2.3/)
   - **FLUX.2**: `Flux-2-Klein-9B-KV-Q8_0.gguf` (unet/flux2/) or `flux-2-klein-9b-fp8.safetensors` (diffusion_models/FLUX.2/), `flux2-vae.safetensors` (vae/FLUX.2/), `qwen_3_8b_fp8mixed.safetensors` (clip/)
4. ComfyUI must be running on port 8188 when using MVC features

### ComfyUI Bridge (Auto-Detection & Fallback)
When ComfyUI is available, all AI generation (cover art, singer images, video frames) automatically routes through it. When ComfyUI is offline, cover art falls back to the local `sd-cli.exe` (FLUX.2 Klein 9B).

- **Capability Discovery**: Probes ComfyUI's `/object_info/` and model directories to determine what it can do (image generation, video generation, upscaling). Returns structured availability with reasons.
- **Pipeline Archetype Registry**: Pluggable workflow builders with regex model detection. Three registered pipelines: `flux-image`, `ltx-video`, `standard-checkpoint`. New pipelines can be added by calling `registerPipeline()`.
- **Model Parameter Inference**: Auto-detects steps, CFG, and model family from filename (e.g., Klein 9B → 4 steps/cfg 1.0, LTX 2.3 → 9+4 steps, unknown → safe defaults).
- **Cover Art Model Picker**: Click the 🖼️ floating button (bottom-right) to open the engine panel. The panel shows ComfyUI connection status, VRAM info, and lets you select which specific UNet/diffusion model, VAE, and text encoder/CLIP to use for cover art generation. Models are auto-scanned from your ComfyUI installation's `diffusion_models/`, `unet/`, `vae/`, `clip/`, and `text_encoder/` directories. Selections are saved to localStorage.
- **Cover Art Settings in Settings**: `coverArtUseComfyUI`, `coverArtModel`, `coverArtVae`, `coverArtClip` are now part of the generation settings pipeline, passed through to the server and threaded into `bridgeGenerateImage()` for ComfyUI-based generation.
- **API Endpoints**: `GET /api/comfyui/capabilities`, `GET /api/comfyui/pipelines`, `GET /api/comfyui/infer-params?model=filename`
- **Model Discovery**: `GET /api/models` returns unified registry of ACE-Step + ComfyUI + local models across 12 categories.

### Album Library — Browse & Download
An 🗂️ Album Library button in the album.html header opens a modal album browser that:
- **Groups songs by album** — detects album name from generation params or metadata overrides
- **Album cards** — cover art, artist name, track count, expandable track listing
- **Right-click context menus** on albums:
  - ZIP download in your preferred format (WAV/MP3/Opus/FLAC)
  - Track list copy to clipboard
- **Right-click context menus** on individual tracks:
  - Download as WAV, MP3, Opus, or FLAC
- **Unreleased tracks section** — songs without an album assignment shown at the bottom
- **Server-side ZIP creation** — uses `archiver` for efficient streaming ZIP with format conversion

**API Endpoints:**
- `GET /api/songs/albums` — groups all user songs by album name
- `GET /api/download/album-zip?album=<name>&format=<wav|mp3|flac|opus>` — streams a ZIP of all tracks in the album

### 18-Language Support with Intelligent Fallback
All 18 languages natively supported by ACE-Step are available across the Album Creator and main UI:

**Supported Languages:** English, Chinese, Japanese, Korean, Spanish, French, German, Italian, Portuguese, Russian, Arabic, Hindi, Turkish, Vietnamese, Thai, Swedish, Polish, Dutch

- **Bilingual Patois code-switching**: When a `(Patois)` genre variant is selected with any non-English language, lyrics are automatically written in both languages — the target language as dominant, Patois woven throughout for authentic reggae feel.
- **Intelligent fallback**: 40+ unsupported languages (Ukrainian, Bengali, Greek, etc.) are mapped to their closest supported equivalent for vocal synthesis. The LLM writes lyrics in the fallback language while the engine synthesizes with the correct vocal model.
- **Automatic vocal language remapping**: The server automatically remaps unsupported language codes before sending to the ACE-Step engine — users never need to know which languages are natively supported.
- **Language selector**: Available in the Album Creator (18 languages) and main React UI settings.

---

## How to Install

### Option A: Apply to existing HOT-Step CPP v1.1.4 install

1. Download the original [HOT-Step CPP v1.1.4](https://github.com/scragnog/HOT-Step-CPP)
2. Extract it
3. Replace/merge the following files from this PGFX Edition:
   - `server/server.mjs` — replaces the original
   - `ui/dist/index.html` — replaces the original
   - `ui/dist/assets/index-DscBS4mv.js` — replaces the original (minified React bundle)
   - `ui/dist/album.html` — **new file**, place in `ui/dist/`
   - `ui/dist/music-video.html` — **new file**, place in `ui/dist/`
   - `ui/dist/visualizer.html` — **new file**, place in `ui/dist/`
   - `plugins/` — merge with existing plugins directory
4. Copy `.env.example` to `.env` and configure your API keys
5. Run `HOT-Step.bat`

### Option B: Full install (if you don't have HOT-Step CPP yet)

1. Download and extract [HOT-Step CPP v1.1.4](https://github.com/scragnog/HOT-Step-CPP)
2. Download this PGFX Edition
3. Copy all tracked files over the base install
4. Copy `.env.example` to `.env` and configure
5. Run `HOT-Step.bat`

### First Launch
1. Go to **Settings > Model Manager** to download AI models (~7 GB)
2. Configure at least one LLM provider (Gemini, OpenAI, Ollama, etc.) for lyric generation
3. Start creating!

---

## File Changes Summary

| File | Status | Size | Description |
|------|--------|------|-------------|
| `server/server.mjs` | Modified | ~301K lines | Backend with 46+ genre templates, vocabulary modules, quality analyzer, outro enforcement, DJ/Dual DJ, bilingual Patois, unified video pipeline (`/api/inspire/video/create`), section-aware cover art with gender context, album ZIP download, album grouping API, 18-language support with 40+ fallback mappings, automatic vocal language remapping, code-switching guard (Patois variant detection), vocabulary lock Patois skip, ComfyUI client (LTX2.3 video + FLUX.2 image generation), stem decomposition (SuperSep), FFmpeg export with Ken Burns + concat, 12+ ComfyUI API endpoints including bridge capabilities/pipelines/infer-params, model registry endpoints, pipeline-models endpoint with per-pipeline model arrays and correct ComfyUI directory scanning, **Gemini 403 error suppression** (early return when API key empty), **local default model** reverted to 4B (flux-2-klein-4b-Q4_0.gguf), **stall timeout bumped** 120s→240s for long ComfyUI jobs, **CoverArt log visibility** (Skipped→WARNING) |
| `server/services/comfyui-client.mjs` | Modified | ~680 lines | ComfyUI HTTP helpers, FIFO job queue, LTX2.3 workflow builder (IC-LoRA node support, configurable audioVaeModel/clipModel), FLUX.2 workflow builder (auto-detect GGUF/safetensors), configurable model paths |
| `server/services/comfyui-model-scanner.mjs` | **New** | ~420 lines | ComfyUI model discovery — connection detection, filesystem model scan (12 categories), `/object_info/` API query, unified model registry combining ACE-Step + ComfyUI + local models |
| `server/services/comfyui-bridge.mjs` | **New** | ~380 lines | ComfyUI bridge — pipeline archetype registry (flux-image, ltx-video, standard-checkpoint), model parameter inference from filename, capability discovery, unified generation interface with sd-cli.exe fallback |
| `server/services/beat-detector.mjs` | Existing | 334 lines | Beat detection, section timing, disco data analysis |
| `server/services/prompt-builder.mjs` | Existing | 535 lines | Cover art, singer image, video prompt builders |
| `ui/dist/album.html` | Modified | ~50 KB | Album Generator — 20-track workflow with multi-select genre picker (200+ genres, 17 categories), random genre-aware theme generator, gender/vocalist context fields, auto-fill, artist name, album title, persistent metadata, ZIP download with folder organization, 18-language selector, Album Library button in header |
| `ui/dist/music-video.html` | Modified | ~68 KB | Music Video Creator — stem-reactive layered effects (12 modes), layer stack (up to 17 layers), ComfyUI image/video generation, ComfyUI status widget + pipeline config panel (6 LTX dropdowns: UNet, Video VAE, Text Enc, Audio VAE, IC-LoRA, Upscaler), timeline with section blocks, FFmpeg export, keyboard shortcuts, multi-layer compositing |
| `ui/dist/visualizer.html` | Modified | ~52 KB | Audio-reactive visualizer with 11 modes (incl. Milkdrop/Butterchurn), preset browser, settings panel, playlist, video generation via unified endpoint, Plasma LUT optimization, pre-rendered scanline overlay, proper delta-time frame timing, auth-aware playlist loading |
| `ui/dist/index.html` | Modified | ~11 KB | Inline visualizer overlay (6 modes, transparent backdrop, Esc exit, disconnect for latency), MVC launcher button (clapper icon), Album Library removed from floating buttons (moved to album.html header), dead `window.__albumLib` code removed, vizMode NaN guard, vizModeLabel update on right-click cycle |
| `server/data/model-registry.json` | Modified | ~3 KB | LTX2.3 video pipeline model entries (6 files + 2 packs with `role: "comfyui"`) registered for ComfyUI Model Manager tab — UNets, VAEs, CLIP, text encoders, download to `models/ComfyUI/` subdirectories |
| `ui/dist/assets/index-DscBS4mv.js` | Modified | 1.4 MB | React bundle — DJ/Turntablism genre group, canvas-based Disco particle system (replaced DOM particles), **ComfyUI Model Manager tab** (4 patches: Z_ array, $_ descriptions, useMemo filter, return handler) |

### Full Enhancement Report
See **[HOT-Step-Enhancements-Report.md](HOT-Step-Enhancements-Report.md)** for the complete technical documentation of all 99 enhancement sections across 14 phases, reproduction guide, and file locations.

---

## What You Need

- **Windows 10/11** (64-bit)
- **NVIDIA GPU** (RTX 2060 or newer recommended) — CPU mode works but is slow
- **Node.js** runtime (included in `runtime/`)
- **ffmpeg** — Download from [ffmpeg.org](https://ffmpeg.org/download.html) and place `ffmpeg.exe` in the project root (only needed for video generation)
- **LLM API key** — At least one provider for lyric generation:
  - Google Gemini (free tier available)
  - OpenAI
  - Anthropic
  - Ollama (local, free)
  - LM Studio (local, free)
  - Any OpenAI-compatible endpoint
- **ComfyUI** (optional) — Required only for Music Video Creator AI image/video generation:
  - [ComfyUI Easy Install](https://github.com/ComfyUI-Easy-Install) recommended
  - LTX 2.3 22B distilled model (~12 GB) for video generation
  - FLUX.2 Klein 9B (~5 GB) for image generation
  - See [ComfyUI Setup](#comfyui-setup) section above

---

## Credits

### Original Author
- **HOT-Step CPP** by [scragnog](https://github.com/scragnog/HOT-Step-CPP) — The base application, inference pipeline, UI, and ACE-Step integration. All original code, architecture, and design belong to scragnog. The PGFX Edition enhancements are additive modifications to this foundation.

### AI Music Engine
- **ACE-Step** by [ace-step](https://github.com/ace-step/ACE-Step) — The AI music inference engine powering all audio generation. Licensed under MIT.

### PGFX Edition Enhancements
- **PyrateGFX Productions** — Genre-aware song architecture (60+ structure templates, 4 traditional/world music genres), narrative intelligence (3-Act structure, coherence enforcement), anti-AI slop system, album generator with auto-fill, multi-select genre picker, random genre-aware theme generator, gender/vocalist context system, artist name, album title, persistent metadata, and ZIP download with folder organization, audio-reactive visualizer with Milkdrop/Butterchurn integration (Plasma LUT optimization, scanline cache, delta-time frame timing), unified MP4 video pipeline, album music video pipeline with lyric-driven image generation and beat-synced rendering, Music Video Creator with stem-reactive layered effects and ComfyUI AI image/video generation (LTX 2.3 + FLUX.2), ComfyUI bridge with pipeline archetype registry, model parameter inference, capability discovery, and sd-cli.exe fallback, ComfyUI model browser with real-time status widget, pipeline model discovery rewrite (correct directory scanning, stripRoot for loader-compatible paths), LTX 2.3 multi-model UI (6 dropdowns including Audio VAE and IC-LoRA), IC-LoRA workflow support (LTXICLoRALoaderModelOnly), canvas-based Disco particle system (replaced DOM particles), album library with right-click context menus for bulk WAV/MP3/Opus/FLAC downloads, DJ/Dual DJ genre system, bilingual Patois code-switching with variant detection, 18-language support with intelligent fallback and automatic vocal language remapping, quality analyzer, server modularization (4 service modules), FIFO ComfyUI job queue, FLUX.2 9B model upgrade, SuperSep auto-trigger cooldown guard (prevents infinite re-trigger loop on every page load), **ComfyUI Model Manager tab** (role-based tab in React bundle), **LTX2.3 model registry** (6 files + 2 packs with `role: "comfyui"`), **Gemini 403 error suppression**, **local default 4B model restoration**, **stall timeout bump 120s→240s**, **CoverArt skipped log visibility** (DEBUG→WARNING), and all Phase 1-14 enhancements.

---

## Support This Project

If the PGFX Edition has been useful to your music production workflow, consider supporting continued development:

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/pyrategfxproductions)

Your support helps fund new features, genre expansions, visualizer improvements, and keeping the project maintained and free for everyone.

---

## License

This project builds upon HOT-Step CPP by scragnog (which uses ACE-Step under MIT License). The original HOT-Step CPP code and ACE-Step engine retain their original licenses. The PGFX Edition enhancements are provided as-is for community use and potential upstream contribution. See individual file headers for specific licensing.

---

*Built with obsessive attention.*