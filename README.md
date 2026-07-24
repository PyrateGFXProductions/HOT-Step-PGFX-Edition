# HOT-Step CPP — PGFX Edition

> **A music production tool that understands songcraft, not just audio generation.**
> Built on [HOT-Step CPP](https://github.com/scragnog/HOT-Step-CPP) v1.1.4 by scragnog. Enhanced by PyrateGFX Productions.

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/pyrategfxproductions)

![PyrateGFX Productions](/ui/dist/PGFX_HOT-Step_logo.png)

---

## What is this?

This is a comprehensive enhancement fork of HOT-Step CPP — the local AI music generation tool built on ACE-Step. The PGFX Edition transforms it from a capable inference wrapper into a full **music production system** with genre-aware song structure, narrative intelligence, and creative workflow tools.

**Base**: HOT-Step CPP v1.1.4 (Windows x64, CUDA 13.1)
**Enhancements**: 40+ sections of improvements across 4 phases

---

## What's New in the PGFX Edition

### Genre-Aware Song Architecture (60+ Structure Templates)
Every genre now has its own structural grammar — verse/chorus/bridge line counts, section ordering, and rhythm patterns that match how that genre *actually works*. Metal doesn't structure like reggae doesn't structure like K-pop doesn't structure like blues.

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

### Anti-AI Slop System
- **100+ banned words** that make AI lyrics sound generically robotic.
- **Deterministic slop replacer** that swaps clichés for genre-appropriate alternatives.
- **Grease Spot Rule**: Forces concrete nouns over abstract adjectives, with an existential exception for doom metal, folk, shoegaze, and post-rock.

### 🌟 Album Creator
*One of the standout features of the PGFX Edition!*
It will create an album of 9+ tracks with a full story concept from the first track to the last track, either user-created or auto-generated with context based on the genre.

- Generate **9+ tracks** with per-track subject, title, genre override, and custom lyrics.
- **AI Auto-Fill**: One-click generates a complete album concept with a story arc across all tracks.
- **Shuffle Tracks**: Re-roll all track subjects while preserving the album theme.
- **Artist Name & Album Title**: Auto-filled from saved username or randomly generated. Editable with 🎲 random buttons.
- **Persistent Metadata**: LLM-generated BPM, key, duration, and time signature survive page reloads — no need to re-run the LLM if you navigate away.
- **ZIP Download**: Download the entire album as a organized ZIP file with folder structure: `Artist Name/Album Title/01 - Track Title.wav`. Includes `metadata.txt` with track listing.
- **Sequential generation pipeline**: LLM lyrics → ACE-Step audio → playback.
- **Pure Prompt Manager**: The Album Creator generates prompts and hands them off to the main page's generation pipeline — zero duplication of generation logic.

#### Album Batch Handler (API-Direct)
When you click "Generate Album" in the Album Creator, it redirects to the main page where a floating batch panel appears. The batch handler:

- **3-Tier Settings Priority**: (1) Monkey-patch capture from a generation on this session, (2) Saved template with `_src` marker, (3) Direct read from `hs-*` localStorage keys via `readSettingsFromStorage()`.
- **Never Overrides Pipeline Settings**: Only prompt fields (caption, lyrics, title, bpm, duration, etc.) are overridden per track. All generation settings (solver, scheduler, guidance, DCW, etc.) come from the user's configured settings.
- **Stale Template Protection**: Old v1/v2 templates without `_src` marker are auto-purged on page load.
- **Video Generation** *WIP*: After each track's audio completes, the batch handler splits lyrics into sections, generates context images via the cover art system, and renders a beat-synced music video using ffmpeg. *Requires cover art models to be installed and ffmpeg in the server directory.*

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
**Main app integration**: Visualizer button auto-detects the currently playing song and opens with it.
**Keyboard shortcuts**: `Space` Play/Pause, `1`-`0` Modes, `M` Milkdrop, `F` Fullscreen, `R` Record, `S` Settings, `L` Playlist, `P` Presets.

### MP4 Video Generator
- Beat-synced crossfades between cover art images
- Ken Burns zoom effects on each image (6 directional variants: center-in, center-out, left, right, top, bottom)
- Audio-reactive waveform overlay
- 10 transition types: fade, dissolve, fadeblack, fadewhite, smoothleft, smoothright, circlecrop, radial, pixelize, diagtl
- Uses ffmpeg for rendering (included or downloadable)

### 🎬 Album Music Video Pipeline *WIP*
*Automatic lyric-driven music video generation for each album track.*

- **Lyric Section Splitting**: Splits lyrics by `[Section]` headers (Verse, Chorus, Bridge, etc.) into visual segments.
- **Context Image Generation**: Each section gets a FLUX-generated image based on the lyrics' visual themes using the existing cover art prompt builder.
- **Beat-Synced Video Rendering**: Images are timed to musical structure using server-side beat detection. Transitions happen at onset points, not arbitrary timestamps.
- **ZIP Integration**: Completed albums include both `.wav` and `.mp4` files in the organized folder structure.
- **Two New Server Endpoints**:
  - `POST /api/cover-art/generate-sections` — generates images per lyric section (no songId required)
  - `POST /api/inspire/video/generate-album` — renders video from audio URL + images (no songId required)
- **Static Video Serving**: Generated MP4s served from `/temp/video/` route.

*Note: This feature requires the cover art models (FLUX.2-klein-4B) to be installed and ffmpeg.exe in the server directory. Video generation adds ~3 minutes per track (image generation + ffmpeg render). Full 9-track album video pipeline takes approximately 25-30 minutes.*

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
| `server/server.mjs` | Modified | ~299K lines | Backend with 46+ genre templates, vocabulary modules, quality analyzer, outro enforcement, DJ/Dual DJ, bilingual Patois, video generation, album video pipeline *WIP*, cover art sections endpoint *WIP* |
| `ui/dist/album.html` | **New** | ~45 KB | Album Generator — 9-track workflow with auto-fill, genre dropdowns, artist name, album title, persistent metadata, ZIP download with folder organization |
| `ui/dist/visualizer.html` | **New** | 43 KB | Audio-reactive visualizer with 11 modes (incl. Milkdrop/Butterchurn), preset browser, settings panel, playlist, video generation |
| `ui/dist/index.html` | Modified | ~7 KB | Added floating album + visualizer buttons, Album Batch Handler v3 (API-direct, 3-tier settings, video pipeline *WIP*, ZIP download with MP4 support) |
| `ui/dist/assets/index-DscBS4mv.js` | Modified | 1.4 MB | React bundle with DJ/Turntablism genre group |

### Full Enhancement Report
See **[HOT-Step-Enhancements-Report.md](HOT-Step-Enhancements-Report.md)** for the complete technical documentation of all 33 enhancement sections, reproduction guide, and file locations.

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

---

## Credits

### Original Author
- **HOT-Step CPP** by [scragnog](https://github.com/scragnog/HOT-Step-CPP) — The base application, inference pipeline, UI, and ACE-Step integration. All original code, architecture, and design belong to scragnog. The PGFX Edition enhancements are additive modifications to this foundation.

### AI Music Engine
- **ACE-Step** by [ace-step](https://github.com/ace-step/ACE-Step) — The AI music inference engine powering all audio generation. Licensed under MIT.

### PGFX Edition Enhancements
- **PyrateGFX Productions** — Genre-aware song architecture (60+ structure templates, 4 traditional/world music genres), narrative intelligence (3-Act structure, coherence enforcement), anti-AI slop system, album generator with auto-fill, shuffle, artist name, album title, persistent metadata, and ZIP download with folder organization, audio-reactive visualizer with Milkdrop/Butterchurn integration, MP4 video generator, album music video pipeline with lyric-driven image generation and beat-synced rendering *WIP*, DJ/Dual DJ genre system, bilingual Patois code-switching, quality analyzer, and all Phase 1-4 enhancements.

---

## Support This Project

If the PGFX Edition has been useful to your music production workflow, consider supporting continued development:

[![Support me on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/pyrategfxproductions)

Your support helps fund new features, genre expansions, visualizer improvements, and keeping the project maintained and free for everyone.

---

## License

This project builds upon HOT-Step CPP by scragnog (which uses ACE-Step under MIT License). The original HOT-Step CPP code and ACE-Step engine retain their original licenses. The PGFX Edition enhancements are provided as-is for community use and potential upstream contribution. See individual file headers for specific licensing.

---

*Built with obsessive attention to whether a reggae song's outro has the right energy.*
