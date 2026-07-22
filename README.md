# HOT-Step CPP — PGFX Edition

> **A music production tool that understands songcraft, not just audio generation.**
> Built on [HOT-Step CPP](https://github.com/scragnog/HOT-Step-CPP) v1.1.4 by scragnog. Enhanced by PyrateGFX Productions.

![PyrateGFX Productions](https://github.com/user-attachments/assets/PyrateGFXProductions.jpg)

---

## What is this?

This is a comprehensive enhancement fork of HOT-Step CPP — the local AI music generation tool built on ACE-Step. The PGFX Edition transforms it from a capable inference wrapper into a full **music production system** with genre-aware song structure, narrative intelligence, and creative workflow tools.

**Base**: HOT-Step CPP v1.1.4 (Windows x64, CUDA 13.1)
**Enhancements**: 32 sections of improvements across 3 phases

---

## What's New in the PGFX Edition

### Genre-Aware Song Architecture (46+ Structure Templates)
Every genre now has its own structural grammar — verse/chorus/bridge line counts, section ordering, and rhythm patterns that match how that genre *actually works*. Metal doesn't structure like reggae doesn't structure like K-pop doesn't structure like blues.

- **Primary-genre-wins architecture**: First selected genre dictates structure. Secondary genres influence vocabulary, tone, and instrumentation only.
- **32+ new templates**: Metal (8 variants), Reggae (3), K-Pop, Hip-Hop (7), Blues (6), Punk (6), Folk (5), DJ/Turntablism (2), plus genre-agnostic fallbacks.
- **DJ / Turntablism** and **Dual DJ** as first-class genres with scratch effects, battle vocabulary, and turntablist structure.
- **Patois now optional** with bilingual code-switching support for non-English + Patois combinations.

### Narrative Intelligence
- **3-Act Story Structure**: Every song progresses through Setup → Conflict → Resolution.
- **Narrative Coherence Enforcement**: Every image must connect to the subject.
- **ALL CAPS Emotional Release**: Placement varies across verses for dynamic impact.
- **Subject-Aware Vocabulary Protection**: Words in your subject are never replaced by the slop filter.
- **Mandatory Outro**: Every song ends with a proper 3-4 line wind-down — never an abrupt stop.

### Anti-AI Slop System
- **100+ banned words** that make AI lyrics sound generically robotic.
- **Deterministic slop replacer** that swaps clichés for genre-appropriate alternatives.
- **Grease Spot Rule**: Forces concrete nouns over abstract adjectives, with an existential exception for doom metal, folk, shoegaze, and post-rock.

### Album Generator
- Generate up to **9 tracks** with per-track subject, title, genre override, and custom lyrics.
- **AI Auto-Fill**: One-click generates a complete album concept with a story arc across all tracks.
- **Shuffle Tracks**: Re-roll all track subjects while preserving the album theme.
- Sequential generation pipeline: LLM lyrics → ACE-Step audio → playback.

### Audio-Reactive Visualizer
Six visualization modes powered by client-side beat detection:
- **Bars** — 64-bar spectrum analyzer with peaks and reflections
- **Wave** — 3-layer oscilloscope with afterglow
- **Particles** — 500-pool beat-spawned particle system
- **Circular** — 128 radial bars with rotation
- **Plasma** — Full-screen plasma effect
- **Image + FX** — Cover art with spectrum overlay and vignette

Built-in **MediaRecorder** for capturing visualizations as video.

### MP4 Video Generator
- Beat-synced crossfades between cover art images
- Ken Burns zoom effects on each image
- Audio-reactive waveform overlay
- Uses ffmpeg for rendering (included or downloadable)

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
| `server/server.mjs` | Modified | ~298K lines | Backend with 46+ genre templates, vocabulary modules, quality analyzer, outro enforcement, DJ/Dual DJ, bilingual Patois, video generation |
| `ui/dist/album.html` | **New** | 42 KB | Album Generator — 9-track workflow with auto-fill, genre dropdowns, sequential generation |
| `ui/dist/visualizer.html` | **New** | 35 KB | Audio-reactive visualizer with 6 modes and recording |
| `ui/dist/index.html` | Modified | 3 KB | Added floating album + visualizer buttons |
| `ui/dist/assets/index-DscBS4mv.js` | Modified | 1.4 MB | React bundle with DJ/Turntablism genre group |

### Full Enhancement Report
See **[HOT-Step-Enhancements-Report.md](HOT-Step-Enhancements-Report.md)** for the complete technical documentation of all 32 enhancement sections, reproduction guide, and file locations.

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

- **HOT-Step CPP** by [scragnog](https://github.com/scragnog/HOT-Step-CPP) — The base application
- **ACE-Step** by [ace-step](https://github.com/ace-step) — The AI music inference engine (MIT License)
- **PyrateGFX Productions** — PGFX Edition enhancements, genre architecture, narrative intelligence, album generator, visualizer, video pipeline

---

## License

This project builds on HOT-Step CPP (which uses ACE-Step under MIT License). The PGFX Edition enhancements are provided as-is for community use. See individual file headers for specific licensing.

---

*Built with obsessive attention to whether a reggae song's outro has the right energy.*
