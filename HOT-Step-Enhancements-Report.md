# HOT-Step CPP — Community Enhancements Report

**Base Version**: `HOT-Step-CPP-v1.1.4-win-x64-cuda13.1`  
**Report Date**: July 28, 2026 (updated — Phase 14: ComfyUI Model Manager tab, LTX2.3 model registry, Gemini 403 suppression, stall timeout fix)  
**Modified Files**: `server/server.mjs`, `server/services/comfyui-client.mjs`, `server/services/comfyui-model-scanner.mjs` (NEW), `server/services/comfyui-bridge.mjs` (NEW), `server/services/beat-detector.mjs`, `server/services/prompt-builder.mjs`, `server/data/model-registry.json`, `ui/dist/assets/index-DscBS4mv.js`, `ui/dist/index.html`, `ui/dist/album.html`, `ui/dist/visualizer.html`, `ui/dist/music-video.html`

---

## Summary

This report documents all enhancements made to the HOT-Step CPP codebase. The work spans twelve major phases:

**Phase 1** (July 18–20): Anti-AI slop vocabulary, genre-adaptive structure rules, Patois dialect integration, new genre profiles (acapella, duet, adult/sensual), and lyric quality evaluation improvements.

**Phase 2** (July 21): Multi-genre architecture overhaul, narrative coherence enforcement, outro fix, metal vocabulary safety, subject-aware processing, removal of unsupported genres, Patois made optional, bilingual Patois code-switching, Album Generator feature with AI auto-fill & shuffle, DJ/Dual DJ genre system, audio-reactive visualizer, MP4 video generator with beat-synced editing, and 4 traditional/world music genres (Klezmer, Mariachi, Bhangra, Andean) — 10 incompatible traditional genres (Gagaku, Min'yo, Enka, Korean Traditional, Carnatic, Hindustani, Gamelan, Balinese, Tuvan Throat Singing, Gnawa) were removed for structural incompatibility.

**Phase 3** (July 22): Album Batch Handler v3 (API-direct architecture), 3-tier settings priority system, stale template protection, readSettingsFromStorage() for direct localStorage access.

**Phase 4** (July 23): Artist name & album title metadata with auto-fill, persistent LLM metadata across sessions, ZIP download with folder organization, album music video pipeline with lyric-driven image generation and beat-synced video rendering *WIP*, two new server endpoints (cover art sections, album video generation), static video serving route.

**Phase 5** (July 23): Album Library with right-click context menus for bulk downloads, server-side album grouping API, album ZIP download endpoint (wav/mp3/flac/opus), floating library button with modal panel, unreleased tracks section.

**Phase 6** (July 25): Multi-select genre picker with 200+ genres across 17 categories (replacing single dropdown), unified video generation pipeline (`POST /api/inspire/video/create`), gender/vocalist context system for coherent pronoun usage in lyrics and AI images, random genre-aware album theme generator, genre fusion prompt fixes, Disco audio-reactive performance fixes (threshold gate, throttling, RAF loop), and recovery of stashed files (wildcards, section captions, Disco analyzer, DiscoVisualizer).

The modified `server.mjs` grew from **294,865 lines** to **~301,100 lines** (net addition of ~6,235 lines). Three files modified and three new files added: `ui/dist/album.html` (Album Generator page), `ui/dist/visualizer.html` (Audio-reactive visualizer), and modifications to `ui/dist/index.html` (floating buttons + batch handler + album library panel).

**Phase 7** (July 25): Full language audit — 18 ACE-Step supported languages verified and exposed in UI, 40+ unsupported language fallback mappings, automatic vocal language remapping in `translateParams()`, code-switching guard (Patois variant detection to prevent unwanted bilingual mixing), vocabulary lock Patois skip (prevents English→Patois word replacement for non-Patois genres), visualizer fixes (auth token support, correct audio URL construction, auto-play, new-tab opening), album track limit increase (9→20), `vocalLanguage` added to `readSettingsFromStorage()`, `LANGUAGE_NAMES` cleanup (removed unsupported jam/jmc/jmd entries).

**Phase 8** (July 25): Music Video Creator page with stem-reactive layered visual effects (12 modes, up to 17 layers), ComfyUI integration for AI image generation (FLUX.2 Klein 9B) and video generation (LTX 2.3 22B distilled), stem decomposition via SuperSep, FFmpeg export with Ken Burns + concat demuxer, inline visualizer overlay in index.html (6 modes, transparent backdrop, Esc exit, AudioContext monkey-patch), ComfyUI server-side client (~730 lines: native FormData upload, workflow builders, 8 API endpoints), data/mvc asset storage, section-aware image prompt builder, full audit with 30+ bug fixes (auth tokens, path traversal, field mismatches, dead code cleanup, vizMode NaN guard).

**Phase 9** (July 25): Server modularization — 3 service modules extracted from monolithic server.mjs (comfyui-client.mjs, beat-detector.mjs, prompt-builder.mjs), FIFO ComfyUI job queue preventing OOM, FLUX.2 cover art model upgrade from Klein 4B to 9B (5.62 GB, within RTX 5060 Ti 16GB budget), SuperSep bug fixes (ONNX dir path, KickExtract re-enable, level=NaN guard), dead code cleanup (-1,736 lines from server.mjs), MediaRecorder guidance in visualizer.

**Phase 10** (July 26): ComfyUI bridge architecture (pipeline archetype registry, model parameter inference, capability discovery, unified generation with sd-cli.exe fallback), ComfyUI model discovery service (filesystem scan across 12 model categories, `/object_info/` API query, unified model registry), model browser UI with real-time status widget, visualizer performance (Plasma sin/cos LUT, scanline cache, delta-time frame timing), canvas-based Disco particle system replacing DOM particles in React bundle, configurable model paths in workflow builders, 7 new API endpoints.

**Phase 11** (July 27): Pipeline model discovery rewrite — fixed `scanRecursive` to scan correct ComfyUI directories (`unet/` for GGUF, `diffusion_models/` for safetensors), added `stripRoot` parameter so model names match what ComfyUI loaders expect (relative to their own search dir, not `models/` root). Split model arrays per pipeline: `fluxUnets`, `fluxClip`, `fluxVae` for FLUX.2; `ltxUnets`, `ltxClip`, `ltxVae`, `ltxLoras`, `upscale` for LTX 2.3. LTX Pipeline Config UI expanded from 4 to 6 dropdowns: UNet, Video VAE, Text Encoder, Audio VAE (new), IC-LoRA (new), Upscaler. Full data flow wired: all 6 model selections flow from UI → `_pipelineModels` state → `generateVideoClip()` → server `generate-video` → `buildLTX2Workflow()`. Added `LTXICLoRALoaderModelOnly` node support to LTX workflow builder — when IC-LoRA selected, loads it and re-wires UNet through it before sampling. Forward slash consistency across all model paths. Smart labels: IC-LoRA/Distill for LoRAs, video/audio for VAEs, Gemma/connectors for CLIPs. Updated defaults paths in workflow builders to match.

**Phase 12** (July 27): SuperSep auto-trigger cooldown guard — React `useEffect` in minified bundle watches `[currentTrack.id, currentTrack.discoDataUrl, discoKickExtract]` and fires `POST /api/songs/:id/extract-kick` on every page load when the zustand store lacks `discoDataUrl`. If extraction had previously failed (e.g., `analyzeAndSaveDiscoData` threw), `disco_data_url` was never saved to DB, causing an infinite loop: page load → extraction → failure → stem URLs cleared → next page load → extraction again. Fixed with `recentlyAttemptedExtractions` cooldown Map (10-minute TTL) that prevents re-triggering SuperSep for the same song within the window. Cooldown cleared on successful extraction. Periodic cleanup every 30 minutes prevents unbounded Map growth. Background extraction cleanup path also clears the cooldown entry.

**Phase 13** (July 28): ComfyUI Bridge for Cover Art — refactored `generateCoverImage()` to support ComfyUI mode via `bridgeGenerateImage()`, added `GET /api/cover-art/comfyui-models` endpoint (scans ComfyUI `diffusion_models/`, `unet/`, `vae/`, `clip/`, `text_encoder/` directories), model picker floating panel in index.html (connection status with VRAM info, dropdown selectors for UNet/VAE/CLIP, auto-save to localStorage), threaded new settings (`coverArtUseComfyUI`, `coverArtModel`, `coverArtVae`, `coverArtClip`) through both parallel and sequential generation pipelines, readiness check split (ComfyUI connection check vs local file check), backward-compatible — falls back to local sd-cli.exe when ComfyUI is offline.

**Phase 14** (July 28): ComfyUI Model Manager tab & LTX2.3 model registry — added `"comfyui"` role tab to the React bundle's role-based model manager (4 patches to `index-DscBS4mv.js`: Z_ array, $_ description, useMemo filter, return handler), registered 6 LTX2.3 model files and 2 Video Pipeline packs in `model-registry.json` (download to `models/ComfyUI/` subdirectories), suppressed Gemini 403 error with early return when API key is empty, restored local default 4B model (`flux-2-klein-4b-Q4_0.gguf`) after accidental 9B upgrade, bumped stall timeout from 120s→240s, promoted `[CoverArt] Skipped` logs from DEBUG→WARNING for visibility.

---

## Table of Contents

### Phase 1 — Original Changes
1. [Anti-AI Slop Vocabulary Expansion](#1-anti-ai-slop-vocabulary-expansion)
2. [Overused Word Tracking Set](#2-overused-word-tracking-set)
3. [Banned Phrase Compound Filters](#3-banned-phrase-compound-filters)
4. [Deterministic Slop Replacer Engine](#4-deterministic-slop-replacer-engine)
5. [Genre-Adaptive Verse & Chorus Structure Rules](#5-genre-adaptive-verse--chorus-structure-rules)
6. [Reggae Patois Dialect Foundation & Blend Controls](#6-reggae-patois-dialect-foundation--blend-controls)
7. [Lyric Quality Evaluator — Original Checks](#7-lyric-quality-evaluator--original-checks)
8. [Genre Alias Resolver & BPM Ranges](#8-genre-alias-resolver--bpm-ranges)
9. [Frontend UI Genre Picker Additions](#9-frontend-ui-genre-picker-additions)

### Phase 2 — Architecture & Narrative Overhaul
10. [Multi-Genre Architecture: Primary Wins](#10-multi-genre-architecture-primary-wins)
11. [44+ Genre Structure Templates](#11-44-genre-structure-templates)
12. [3-Act Story Structure Rule](#12-3-act-story-structure-rule)
13. [Narrative Coherence Rule](#13-narrative-coherence-rule)
14. [Grease Spot Rule with Existential Exception](#14-grease-spot-rule-with-exception)
15. ["VARIETY IS SURVIVAL" Instruction](#15-variety-is-survival-instruction)
17. [Metal Vocabulary Safety](#17-metal-vocabulary-safety)
18. [Subject-Aware Vocabulary Lock](#18-subject-aware-vocabulary-lock)
19. [Duration-Verse Count Matching](#19-duration-verse-count-matching)
20. [Outro Enforcement (THE BIG FIX)](#20-outro-enforcement)
21. [Quality Analyzer — New Checks (Subject, Narrative, 3-Act, Outro)](#21-quality-analyzer--new-checks)
22. [Dub Notation Preservation](#22-dub-notation-preservation)
23. [Unsupported Genre Removal](#23-unsupported-genre-removal)
24. [Slop Dictionary Cleanup](#24-slop-dictionary-cleanup)

### Phase 3 — Patois Optional, Album Generator & DJ/Dual DJ
25. [Patois Made Optional](#25-patois-made-optional)
26. [Album Generator — Phase 1](#26-album-generator--phase-1)
27. [DJ / Turntablism Genre System](#27-dj--turntablism-genre-system)
28. [Dual DJ (Turntable Battle) Genre](#28-dual-dj-turntable-battle-genre)
29. [Bilingual Patois Code-Switching](#29-bilingual-patois-code-switching)
30. [Audio-Reactive Visualizer](#30-audio-reactive-visualizer)
31. [MP4 Video Generator with Beat-Synced Editing](#31-mp4-video-generator-with-beat-synced-editing)
32. [Album Auto-Fill & Shuffle](#32-album-auto-fill--shuffle)
33. [Traditional / World Music Genres (4 Genres)](#33-traditional--world-music-genres-4-genres)

### Phase 3.5 — Album Batch Handler & Settings Pipeline
34. [Album Batch Handler v3 (API-Direct)](#34-album-batch-handler-v3-api-direct)
35. [3-Tier Settings Priority System](#35-3-tier-settings-priority-system)
36. [Stale Template Protection](#36-stale-template-protection)
37. [readSettingsFromStorage() — Direct localStorage Access](#37-readsettingsfromstorage--direct-localstorage-access)

### Phase 4 — Album Metadata, ZIP Download & Music Video Pipeline *WIP*
38. [Artist Name & Album Title with Auto-Fill](#38-artist-name--album-title-with-auto-fill)
39. [Persistent LLM Metadata Across Sessions](#39-persistent-llm-metadata-across-sessions)
40. [ZIP Download with Folder Organization](#40-zip-download-with-folder-organization)
41. [Album Music Video Pipeline *WIP*](#41-album-music-video-pipeline-wip)
42. [Cover Art Sections Endpoint](#42-cover-art-sections-endpoint)
43. [Album Video Generation Endpoint](#43-album-video-generation-endpoint)
44. [Static Video Serving Route](#44-static-video-serving-route)

### Phase 5 — Album Library with Right-Click Download Menus
45. [Album Grouping API](#45-album-grouping-api)
46. [Album ZIP Download Endpoint](#46-album-zip-download-endpoint)
47. [Album Library Floating Panel](#47-album-library-floating-panel)
48. [Right-Click Context Menus for Downloads](#48-right-click-context-menus-for-downloads)

### Phase 6 — Multi-Select Genre, Unified Video, Gender Context & Performance Fixes
49. [Multi-Select Genre Picker](#49-multi-select-genre-picker)
50. [Unified Video Generation Pipeline](#50-unified-video-generation-pipeline)
51. [Gender/Vocalist Context System](#51-gender--vocalist-context-system)
52. [Gender-Aware Image Prompt Builder](#52-gender-aware-image-prompt-builder)
53. [Genre Fusion Prompt Fixes](#53-genre-fusion-prompt-fixes)
54. [Disco Performance Fixes](#54-disco-performance-fixes)
55. [Recovered Files from Stash](#55-recovered-files-from-stash)
56. [Random Genre-Aware Theme Generator](#56-random-genre-aware-theme-generator)

### Phase 7 — Language Audit, Visualizer Fixes & Code-Switching Guard
57. [18-Language Support System](#57-18-language-support-system)
58. [Automatic Vocal Language Remapping](#58-automatic-vocal-language-remapping)
59. [Code-Switching Patois Variant Guard](#59-code-switching-patois-variant-guard)
60. [Vocabulary Lock Patois Skip](#60-vocabulary-lock-patois-skip)
61. [Visualizer Auth & Audio URL Fixes](#61-visualizer-auth--audio-url-fixes)
62. [Visualizer New-Tab Opening](#62-visualizer-new-tab-opening)
63. [Album Track Limit Increase (9→20)](#63-album-track-limit-increase-920)
64. [vocalLanguage in readSettingsFromStorage()](#64-vocallanguage-in-readsettingsfromstorage)

### Phase 8 — Music Video Creator, ComfyUI Integration & Audit Fixes
65. [Music Video Creator Page](#65-music-video-creator-page)
66. [ComfyUI Server-Side Client](#66-comfyui-server-side-client)
67. [Stem Decomposition (SuperSep)](#67-stem-decomposition-supersep)
68. [Inline Visualizer Overlay](#68-inline-visualizer-overlay)

### Phase 9 — Server Modularization, FIFO Queue, Performance & Cleanup
69. [Server Modularization (4 Service Modules)](#69-server-modularization-4-service-modules)
70. [FIFO ComfyUI Job Queue](#70-fifo-comfyui-job-queue)
71. [FLUX.2 Cover Art Model Upgrade (4B → 9B)](#71-flux2-cover-art-model-upgrade-4b--9b)
72. [SuperSep Bug Fixes](#72-supersep-bug-fixes)
73. [Dead Code Cleanup (-1,736 Lines)](#73-dead-code-cleanup--1736-lines)
74. [MediaRecorder Guidance](#74-mediarecorder-guidance)

### Phase 10 — ComfyUI Bridge, Model Discovery, Performance & Canvas Disco
75. [ComfyUI Bridge Architecture](#75-comfyui-bridge-architecture)
76. [ComfyUI Model Discovery Service](#76-comfyui-model-discovery-service)
77. [Model Browser UI with Status Widget](#77-model-browser-ui-with-status-widget)
78. [Plasma Performance Optimization](#78-plasma-performance-optimization)
79. [Canvas-Based Disco Particle System](#79-canvas-based-disco-particle-system)
80. [App2→Router21 Routing Fix](#80-app2router21-routing-fix)
81. [Model Registry ENOENT Fix](#81-model-registry-enoent-fix)

### Phase 11 — Pipeline Model Discovery Rewrite & LTX Multi-Model UI
82. [Model Scanner Directory Fix (GGUF in unet/ not diffusion_models/)](#82-model-scanner-directory-fix)
83. [stripRoot Parameter for Correct ComfyUI Loader Paths](#83-striproot-parameter-for-correct-comfyui-loader-paths)
84. [Per-Pipeline Model Arrays](#84-per-pipeline-model-arrays)
85. [LTX Pipeline Config UI Expansion (4→6 Dropdowns)](#85-ltx-pipeline-config-ui-expansion-46-dropdowns)
86. [Full Data Flow Wiring (UI → Server → Workflow Builder)](#86-full-data-flow-wiring-ui--server--workflow-builder)
87. [IC-LoRA Workflow Support (LTXICLoRALoaderModelOnly)](#87-ic-lora-workflow-support)
88. [Forward Slash Consistency & Smart Labels](#88-forward-slash-consistency--smart-labels)

### Phase 12 — SuperSep Auto-Trigger Cooldown Guard
89. [Extraction Cooldown Map (prevents infinite re-trigger loop)](#89-extraction-cooldown-map)
90. [Background Extraction Cleanup & Map Periodic Cleanup](#90-background-extraction-cleanup)

### Phase 13 — ComfyUI Bridge for Cover Art + Model Picker
91. [Cover Art ComfyUI Integration](#91-cover-art-comfyui-integration)
92. [ComfyUI Model Scanner for Cover Art](#92-comfyui-model-scanner-for-cover-art)
93. [Cover Art Engine Model Picker UI](#93-cover-art-engine-model-picker-ui)

### Phase 14 — ComfyUI Model Manager Tab, LTX2.3 Registry & Quality-of-Life Fixes
94. [Gemini 403 Error Suppression](#94-gemini-403-error-suppression)
95. [Local Default Model Restoration (4B)](#95-local-default-model-restoration-4b)
96. [ComfyUI Tab in Model Manager](#96-comfyui-tab-in-model-manager)
97. [LTX2.3 Video Pipeline Model Registry](#97-ltx23-video-pipeline-model-registry)
98. [Stall Timeout Bump (120s→240s)](#98-stall-timeout-bump-120s240s)
99. [Cover Art Log Visibility (DEBUG→WARNING)](#99-cover-art-log-visibility-debugwarning)

---

## Phase 1 — Original Changes

### 1. Anti-AI Slop Vocabulary Expansion

**Location**: `server.mjs`, near line ~43039  
**Dated comment**: `// AI-poetic cliché additions (2026-07-18)`

Words added to the banned set: `analog, glare, drenched, howling, wailing, scratching, flickering, trembling, drowning, ghostly, phantom, spectre`

Prevents the LLM from producing lyrics that sound generically "AI-written."

---

### 2. Overused Word Tracking Set

**Location**: `server.mjs`, near line ~43065 (new `OVERUSED_WORDS` Set)

Words tracked (not banned outright, but flagged during quality evaluation): `heavy, broken, cold, dust, ghost, machine, nothing, nowhere, searching, wreckage, losing, watch, burn`

---

### 3. Banned Phrase Compound Filters

**Location**: `server.mjs`, near line ~43169

Multi-word phrase bans: `concrete jungle, rhythm of the night, neon haze, lost in the haze, dance in the shadows, echoes of the past, whispers of the wind, chase the dream, dragging me down`

Wildcard compound patterns banned: all variations of `neon [rain|glow|lights|dreams|streets|sky|city|world]` and `analog [heart|soul|love|world|dream]`

---

### 4. Deterministic Slop Replacer Engine

**Location**: `server.mjs`, `GENRE_VOCABULARY_MODULES[genre].replacements` → called by `replaceSlopWords(text, genreKeys)` in the lyric post-processing pipeline

After the LLM generates lyrics, this function scans for modern/generic words and deterministically replaces them with genre-appropriate alternatives (e.g., folk: `computer` → `old radio`, `internet` → `back road`).

---

### 5. Genre-Adaptive Verse & Chorus Structure Rules

**Location**: `server.mjs`, `enforceLineCounts()`

`FLEXIBLE_VERSE_GENRES` — allows 4–8 line verses: metal, doom metal, black metal, progressive metal, symphonic metal, hiphop, rap, trap, drill, grime, boom bap, blues, delta blues, chicago blues, punk, post-punk, hardcore punk, anarcho-punk

`NO_CHORUS_GENRES` — allows omission of choruses: blues, delta blues, chicago blues, texas blues, blues rock, hiphop, rap, trap, drill, grime, folk, traditional folk, celtic folk, metal, doom metal, black metal, progressive metal

---

### 6. Reggae Patois Dialect Foundation & Blend Controls

**Location**: `server.mjs`, `/llm` route prompt construction

When reggae-family genre is detected, injects `REGGAE PATOIS OVERRIDE` forcing Jamaican Patois grammar, pronouns, and vocabulary. A `GENRE BLEND RULE` ensures that when reggae combines with other genres, the vocal dialect stays Patois — only instrumentation changes.

---

### 7. Lyric Quality Evaluator — Original Checks

**Location**: `server.mjs`, `analyzeLyricsQuality()`

Original 10 checks: syllable uniformity, chorus hook repetition, perspective drift, opening word diversity, verse redundancy, line count validation, banned word check, BPM-syllable density, AI slop score, section count sanity.

---

### 8. Genre Alias Resolver & BPM Ranges

**Location**: `server.mjs`, `resolveGenreFromStyles()` and `GENRE_BPM_RANGES`

Genre alias resolver maps user-selected strings to internal vocabulary module keys. BPM ranges clamp LLM-generated BPM to realistic per-genre ranges.

---

### 9. Frontend UI Genre Picker Additions

**Location**: `ui/dist/assets/index-DscBS4mv.js` (minified React bundle)

Added "Adult / Sensual" group with: Slow Jam, Bedroom R&B, Sensual Lounge, Porn Groove, 70s Porn Groove, Erotic Funk, Sleazy Funk, Porn, Porn (SFW Instrumentation)

*(The "Vocal / Special" group was added in Phase 1 but removed in Phase 2 — see Section 23)*

---

## Phase 2 — Architecture & Narrative Overhaul

### 10. Multi-Genre Architecture: Primary Wins

**Location**: `server.mjs`, `mergeGenreModules()`, `buildMergedSlopReplacements()`, `enforceLineCounts()`, `buildGenreStructureHint()`

**The Rule**: Primary genre = song's DNA (structure). Secondary genres = spices (vocabulary/tone/instrumentation only). This is now enforced everywhere:

- `mergeGenreModules()`: secondary genres only ADD new replacement keys, don't override primary's
- `buildMergedSlopReplacements()`: same primary-wins logic
- `enforceLineCounts()`: FLEXIBLE_VERSE_GENRES and NO_CHORUS_GENRES checked against primary genre only (not `.some()`)
- Chorus enforcement: primary genre only (not `.some()`)
- `buildGenreStructureHint()`: blend instruction now explicit: "Primary genre DICTATES structure — non-negotiable. Secondary genres influence vocabulary/tone/instrumentation ONLY."

**Why it matters**: Before, selecting "reggae + metal" produced a confused hybrid. Now: reggae's 4-line verses and mandatory choruses are preserved, metal's darker vocabulary is layered on top.

---

### 11. 44+ Genre Structure Templates

**Location**: `server.mjs`, `GENRE_STRUCTURE_TEMPLATES`

Every genre and subgenre now has a specific structure template with: section sequence, typical verse line count, typical chorus line count, bridge convention, hook style, and a full description.

Covers: metal (9 subgenres), reggae (3 subgenres), kpop, hiphop (8 subgenres), blues (6 subgenres), punk (6 subgenres), folk (8 subgenres).

**Doom metal template updated**: Now shows verse count range (`I-V-V-V-Outro` short to `I-V-V-V-V-V-Outro` long), thematic image connection instruction, and verse count-duration matching requirement.

---

### 12. 3-Act Story Structure Rule

**Location**: All 3 prompts (INSTAGEN_FULL_SYSTEM_PROMPT, INSTAGEN_LYRIC_SYSTEM_PROMPT, user prompt hint)

Every song must progress through 3 acts:
- **Act 1 (Verse 1 / Setup)**: Establish the world, the subject, the emotional starting point
- **Act 2 (Verse 2–3 / Tension)**: Deepen the conflict, raise stakes, build pressure
- **Act 3 (Verse 4+ / Resolution)**: Climax, transformation, the final image that lingers

A song with 4 verses of unrelated images is a list, not a story.

---

### 13. Narrative Coherence Rule

**Location**: All 3 prompts

Every image in every verse must connect to the subject. If the subject is "the last hour of daylight," every line should relate to fading light, dying sun, encroaching darkness, or time running out. Random objects unrelated to the subject make no sense. Images within a verse must rhyme thematically.

---

### 14. ALL CAPS Placement Fix (REMOVED)

**Status**: Removed from documentation. The ALL CAPS convention was implemented as a lyric-writing technique to signal emotional intensity, but the ACE-Step engine does not interpret letter casing as a vocal dynamics cue. ALL CAPS text passes through the entire pipeline intact but produces the same vocal output as lowercase — the engine has no mechanism to map casing to loudness or emotional intensity. The feature remains in the prompt instructions as a lyric-writing guide (it does no harm) but is no longer documented as producing a perceptible audio effect.

---

### 15. Grease Spot Rule with Existential Exception

**Location**: All 3 prompts (3 separate locations)

The Grease Spot Rule forces concrete nouns to fight AI slop. **New exception**: doom metal, black metal, progressive metal, folk, shoegaze, post-rock — abstract language is core to their identity. They can use abstract concepts but must ground each one with at least one concrete image per verse.

---

### 16. "VARIETY IS SURVIVAL" Instruction

**Location**: Both system prompts

Explicit warning: "Real songs are NOT repetitive in structure. If every verse has the same length, same cadence, the listener gets bored." Instructs the LLM to vary verse lengths, imagery types, emotional intensities, and line lengths.

---

### 17. Metal Vocabulary Safety

**Location**: `server.mjs`, `GENRE_VOCABULARY_MODULES.metal.replacements` and `GENRE_SLOP_REPLACEMENTS.metal`

**Removed destructive replacements** that were destroying subject-relevant words:
- `"sun" → "moon"` — erased the subject of daylight/sun songs
- `"light" → "flame"` — erased the subject of light/sun songs
- `"sky" → "grave"` — erased the subject of sky/daylight songs
- `"dark" → "void"` — void is a banned word (counterproductive cascade)
- `"walk" → "prowl"` — only works in specific contexts
- `"wet" → "drenched"` — drenched is banned

Also fixed contradictory duplicates (`"moon": "eclipse"` vs `"moon": "skull"`, `"sky": "grave"` vs `"sky": "tomb"`).

Added new safe replacements: `"void": "iron"`, `"wasteland": "rubble"`, `"abyss": "pit"`, `"desolation": "ruin"`, `"shadow": "darkness"`

---

### 18. Subject-Aware Vocabulary Lock

**Location**: `server.mjs`, `enforceVocabularyLock()` and `processLyricsWithGenre()`

`enforceVocabularyLock(lyrics, genreKeys, subject)` now accepts a `subject` parameter. Words appearing in the subject are PROTECTED from replacement. `processLyricsWithGenre` passes subject through. Both `/llm` call sites updated.

**Why it matters**: A song about "the last hour of daylight" no longer gets `"light" → "flame"` — "light" is in the subject and is protected.

---

### 19. Duration-Verse Count Matching

**Location**: Prompt instructions and server-side validation

**Prompt**: "CRITICAL: Duration and verse count must match. A 3-minute song needs 3 verses. A 5-minute song needs 4-5 verses. An 8-minute song needs 5-6 verses."

**Server-side**: Warning logged when duration > 240s and verse count is too low (~2 min per verse expected).

---

### 20. Outro Enforcement (THE BIG FIX)

**The Problem**: There was a detailed INTRO RULE ("You MUST begin EVERY song with an [Intro]...") but zero equivalent OUTRO RULE. The LLM had no instruction to write an outro, no enforcement, and no safety net. Songs just ended — often mid-lyric, with no closure.

**The Fix** (6 layers):

#### 20a. OUTRO RULE added to all 3 prompts
Mirrors the INTRO RULE:
> "You MUST end EVERY song with an [Outro] section containing 2-4 lines of actual lyrics that provide emotional closure. Echo the hook, restate the central image, or leave a final aftertaste. Do NOT introduce new themes. NEVER end the song abruptly after the last chorus."

#### 20b. Section function description strengthened
Changed from "final image, hook, or aftertaste" to:
> "MANDATORY — final 2-4 lines that provide emotional closure. NEVER skip the outro. NEVER end the song abruptly."

#### 20c. Blueprint section updated
When blueprint includes "O", now explicitly tells the LLM:
> "You MUST include an [Outro] section with 2-4 lines of actual lyrics that provide emotional closure."

#### 20d. FINAL REMINDERS updated
Added as item #3 (prominently placed):
> "OUTRO IS MANDATORY — Every song MUST end with an [Outro] section..."

#### 20e. Auto-insertion safety net
**Location**: `server.mjs`, `processLyricsWithGenre()` — new Step 2b

If the LLM still forgets, the server extracts the last 2 lines from the final chorus and injects an `[Outro]` section. If no chorus lines are available, adds an empty `[Outro]` header (instrumental fade). Logged as `[OutroFix]`.

#### 20f. Quality analyzer check
**Location**: `server.mjs`, `analyzeLyricsQuality()` — new Check #14

- Missing [Outro]: -12 points
- Empty [Outro] (0 lyrics): -10 points
- Only 1 line: -5 points
- Over 6 lines: -3 points

---

### 21. Quality Analyzer — New Checks

**Location**: `server.mjs`, `analyzeLyricsQuality()` — Checks #11, #12, #13, #14

Function signature updated: `analyzeLyricsQuality(lyrics, genreKeyOrKeys, bpm, subject)`

#### Check #11: Subject Relevance
Extracts key words from the subject, checks if they appear in lyrics. <20% coverage = -15 points. <40% = -5 points. Catches "song about daylight" generating lyrics about random objects.

#### Check #12: Narrative Coherence (Verse Thematic Consistency)
For each verse, checks if content words cluster around a thematic theme using 6 clusters (light, darkness, decay, nature, objects, emotion). <15% of words in any cluster = -8 points per verse.

#### Check #13: 3-Act Story Progression
Measures intensity across verses (syllable density and thematic progression). Range < 0.15 = no emotional arc (-10 points). Peak in Verse 1 = wrong climax placement (-8 points).

#### Check #14: Outro Check
(See Section 20f above)

---

### 22. Dub Notation Preservation

**Location**: `server.mjs`, `PRESERVED_EFFECT_WORDS` Set and `stripParentheticalInstructions()`

Added `PRESERVED_EFFECT_WORDS`: echo, reverb, delay, dub, plate, spring, cathedral, chorus, flanger, phaser, tremolo, vibrato, distortion, overdrive, fuzz, wah, octave, lo-fi, lofi.

Modified `stripParentheticalInstructions` to preserve single-word preserved effects. `(echo)` and `(reverb)` now survive stripping while `(guitar solo with distortion)` still gets stripped.

---

### 23. Unsupported Genre Removal

**The Problem**: The "Vocal / Special" genre group (Acapella, Beatbox, Barbershop Quartet, Vocal Percussion, ASMR, etc.) was added but these styles don't work with ACE-Step — the model was not trained on purely vocal or vocal-percussion-only music.

**Backend removals**:
- Removed `"acapella"` entry from `resolveGenreFromStyles()` genreMap
- Removed `acapella` vocabulary module from `GENRE_VOCABULARY_MODULES`
- Removed `"acapella"` and `"beatbox"` entries from `GENRE_BPM_RANGES`

**Frontend removal**:
- Removed entire "Vocal / Special" group from `ui/dist/assets/index-DscBS4mv.js` (Acapella, A Cappella, Beatbox, Beatboxing, Vocal Percussion, Choir, Duet, Barbershop Quartet, ASMR)

Note: The "Adult / Sensual" group is preserved. The `duet` backend mapping remains intact (works if typed manually).

---

### 24. Slop Dictionary Cleanup

**Location**: `server.mjs`, `GENRE_SLOP_REPLACEMENTS._default`

Removed dead duplicate: `"iridescent": "shining"` (line 44625) was superseded by `"iridescent": "bright"` (line 44631). The second key wins in JS object literals, so the first was dead code.

---

### 25. Patois Made Optional (Mandatory vs Optional Dialect Control)

**The Problem**: The `REGGAE PATOIS OVERRIDE` forced Jamaican Patois on EVERY reggae-family genre. But not all reggae is Patois — many reggae and dub artists sing in standard English (UB40, Big Audio Dynamite, most modern roots, dub is often instrumental). Users had no way to generate clean English reggae.

**The Fix** (3 layers):

#### 25a. Patois trigger split — MANDATORY vs OPTIONAL
**Location**: `server.mjs`, `/llm` route (line ~296041)

The old trigger was:
```javascript
if (genreKeys.includes("reggae")) { /* FORCE Patois */ }
```

The new trigger checks the ORIGINAL user-selected genre strings for "patois":
```javascript
const wantsPatois = genres.some(g => g.toLowerCase().includes("patois"));
if (wantsPatois) {
  // MANDATORY Patois — same as before
} else {
  // OPTIONAL Patois — suggest but don't force
}
```

When Patois is NOT selected, a new `REGGAE CULTURAL AUTHENTICITY (OPTIONAL)` prompt is injected:
> "Reggae lyrics traditionally use Jamaican Patois. You MAY write the entire song in Patois for maximum authenticity, or use standard English with occasional Patois flavor..."

#### 25b. Genre blend rule updated
**Location**: `server.mjs`, `REGGAE GENRE BLENDING` section (line ~296133)

Same Patois check applied to the blend rule. When Patois is selected, the blend rule forces Patois as the foundation language. When not selected, it says "You MAY use Jamaican Patois for maximum authenticity, or write in standard English..."

#### 25c. INSTAGEN_FULL_SYSTEM_PROMPT updated
**Location**: `server.mjs`, line ~46728

Changed from blanket "write ALL lyrics in authentic Jamaican Patois" to conditional:
> "If the language is 'Jamaican Patois' or the genre includes a '(Patois)' variant, write ALL lyrics in authentic Jamaican Patois. For base reggae-family genres without '(Patois)', use standard English with optional Patois flavor."

#### 25d. Structure templates updated
**Location**: `server.mjs`, `GENRE_STRUCTURE_TEMPLATES` (reggae, dub, dancehall)

Removed hard "ALL lyrics MUST be in Jamaican Patois" from descriptions, verseLines, chorusLines, and hookStyle. Now says "If Patois: ... If standard English: ..." — giving the LLM both paths.

#### 25e. Frontend UI — Patois variants added
**Location**: `ui/dist/assets/index-DscBS4mv.js`

Added 3 new genre picker options to the "Reggae / Caribbean" group:
- `Reggae (Patois)` — forces Patois dialect
- `Dub (Patois)` — forces Patois dialect
- `Dancehall (Patois)` — forces Patois dialect

The base genres (`Reggae`, `Dub`, `Dancehall`) now generate standard English with optional Patois flavor.

**How it works**: The `(Patois)` genre strings naturally map to the existing `"reggae"` key in `resolveGenreFromStyles` (since they contain "reggae"/"dub"/"dancehall"). No new vocabulary modules, BPM ranges, or slop replacements were needed — the dialect control is purely prompt-based.

---

## 26. Album Generator — Phase 1

### 26a. Overview
A standalone HTML page (`ui/dist/album.html`) that lets users generate up to 9 tracks with full per-track control over subject, lyrics, title, and genre override. This is Phase 1 — a client-side UI that calls the existing HOT-Step API endpoints sequentially.

### 26b. Architecture
- **No server changes required** — the album page is a static HTML file served from `ui/dist/album.html`
- **Calls existing APIs**: `/api/auth/auto`, `/api/inspire/llm/providers`, `/api/inspire/llm`, `/api/generate`, `/api/generate/status/:jobId`
- **Sequential generation** — tracks are processed one at a time (ACE-Step engine can only handle one job at a time)
- **Auto-authentication** — fetches a token from `/api/auth/auto` on page load

### 26c. Features
- **Album metadata**: Title, overall genre/style, LLM provider/model selection, language
- **9 track slots** with per-track controls:
  - Subject / Theme
  - Track Title (optional — LLM generates if empty)
  - Genre Override (optional — uses album genre if empty)
  - Custom Lyrics (paste your own or leave empty for LLM generation)
  - Random Subject button (generates via LLM)
- **Generation pipeline**: LLM lyrics (if not provided) → ACE-Step audio → poll until complete
- **Per-track results**: Audio player + download button + view generated lyrics
- **Overall progress bar** with track count
- **Cancel All** button to abort mid-generation
- **Config persistence** — saves to localStorage between sessions
- **Dark theme** matching HOT-Step aesthetic
- **Model dropdown** — shows available models for the selected provider, with custom input option

### 26d. Files
- **`ui/dist/album.html`** — New file (~32KB). Standalone dark-themed page.
- **`ui/dist/index.html`** — Modified. Added floating purple gradient album button (bottom-right corner).

### 26e. API Flow
```
1. GET  /api/auth/auto            → { user, token }
2. GET  /api/inspire/llm/providers → [{ id, name, models, available }]
3. For each track:
   a. POST /api/inspire/llm        → { lyrics, title, bpm, key, duration, caption }
   b. POST /api/generate           → { jobId }
   c. GET  /api/generate/status/:id → { status, stage, progress, result }
      (poll every 2s until succeeded/failed)
4. Result: audioUrls[0] → audio player + download link
```

---

## 27. DJ / Turntablism Genre System

### 27a. Motivation
Inspired by L'Entourloop and the broader turntablism culture — DJs who use turntables as primary instruments, creating scratch-based music with cutting, beat-juggling, and live effects. The goal was to make DJ/turntablism a first-class genre with its own vocabulary, structure, and prompt guidance.

### 27b. GENRE_VOCABULARY_MODULE — `dj`
**Location**: `server.mjs`, `GENRE_VOCABULARY_MODULES`

80+ turntablism-specific vocabulary words:

**Techniques**: scratch, scratching, cut, cutting, transform, transformer, flare, crab, tear, orbit, chirp, beat-juggle, backspin, rewinding, spinback, beatmatch
**Equipment**: turntable, turntables, crossfader, fader, needle, vinyl, platter, slipmat, mixer, MPC, SP-1200
**Culture**: crate digging, dusty crates, old school wax, vinyl crackle, needle drop, dubplate, white label, test press, 12 inch, record store, b-boy, b-girl, breakdance, turntablist, deejay, selector
**Song structure**: scratch hook, scratch chorus, turntable solo, turntablism, battle record, wheels of steel, fresh, cut it up, rock the decks
**Effects**: delay, echo, reverb, filter, phaser, flanger, wah, bass drop, beat drop, build, silence, pause, breakdown
**Live energy**: live set, live mix, impromptu, spontaneous, crowd, crowd work, hype, hype man, put your hands up, rewind again, wheel and come again, pull up

**Line rules**: `allowScratchEffects: true`, `preferShortLines: true`, `allowCallAndResponse: true`

**Blacklist**: melody, melodic, singing, vocalist, choir, opera, ballad (DJ genres are instrumental/scratch-focused, not vocal-melodic)

**Replacements**: singer→turntablist, guitar→turntable, melody→scratch pattern, singing→scratching, guitar solo→scratch solo

### 27c. GENRE_STRUCTURE_TEMPLATE — `dj`
**Location**: `server.mjs`, `GENRE_STRUCTURE_TEMPLATES`

```
Structure: Intro → Scratch Break → Verse → Chorus → Scratch Break → Verse → Chorus → Scratch Solo → Chorus → Outro
```

- **Intro**: Needle drop, vinyl crackle, beat drop
- **Scratch Break**: Turntable showcase — transforms, flares, chirps, crab scratches
- **Verse**: Rapped, spoken, or chanted over beat. Beat and scratches do the heavy lifting
- **Chorus**: Caughty hook — often a scratched vocal sample or simple repeated phrase
- **Scratch Solo**: Extended turntable showcase (the centerpiece). DJ improvises — beat-juggling, transforms, flares
- **Hook Style**: Scratch-based hook — the turntables ARE the voice

### 27d. BPM Range
**Location**: `server.mjs`, `GENRE_BPM_RANGES`

`dj: [85, 130]` — Covers hip-hop DJ tempo range (85-100), breakbeat (110-130), and electronic DJ (120-130).

### 27e. resolveGenreFromStyles Alias
**Location**: `server.mjs`, `resolveGenreFromStyles`

```javascript
"dj": ["dj", "turntablism", "turntablist", "turntable", "scratch", "scratching",
       "turntables", "deejay", "turntable battle", "scratch battle"]
```

### 27f. INSTAGEN_FULL_SYSTEM_PROMPT — DJ Tag Example
**Location**: `server.mjs`, INSTAGEN_FULL_SYSTEM_PROMPT

Added comprehensive DJ tag example:
> "Two turntables and a mixer as the primary instruments. Vinyl crackle and needle-drop warmth. Aggressive scratch patterns using transform, flare, and crab techniques over a boom-bap beat break. Crossfader clicks punctuating rhythmic cuts. Beat-juggled drum breaks creating syncopated rhythms. Vocal samples chopped and scratched into rhythmic hooks..."

### 27g. Structure Hints in Prompt
Added to INSTAGEN_FULL_SYSTEM_PROMPT lyrics section:
> "DJ/Turntablism genres often use: Intro → Scratch Break → Verse → Chorus → Scratch Break → Verse → Chorus → Scratch Solo → Chorus → Outro. Use [Scratch Break] and [Scratch Solo] section labels for turntable showcases. The scratch sections are INSTRUMENTAL."

### 27h. Line Rule Processing
**Location**: `server.mjs`, `/llm` route genre hints

When `allowScratchEffects` is true:
- "Include scratch breaks and turntable showcases in the song structure. Use section labels like [Scratch Break], [Scratch Solo], [DJ Battle]. The scratch sections are INSTRUMENTAL."
- "Vocals should reference the DJ culture: cutting, scratching, vinyl, crates, wheels of steel. The DJ IS the lead instrument."

---

## 28. Dual DJ (Turntable Battle) Genre

### 28a. Motivation
Inspired by L'Entourloop's signature impromptu DJ battles and collabs — two DJs going head-to-head on the decks, trading scratch patterns, hyping the crowd, building intensity through call-and-response turntablism. Think Jazzy Jeff & Fresh Prince, Invisibl Skratch Piklz, X-Ecutioners, Beat Junkies.

### 28b. GENRE_VOCABULARY_MODULE — `dualdj`
**Location**: `server.mjs`, `GENRE_VOCABULARIES_MODULES`

All `dj` vocabulary PLUS battle/collab-specific terms:

**Battle vocabulary**: tag team, back to back, back-to-back, doubles, head to head, head-to-head, crew, partner, relay, exchange, trade off, handoff
**Battle formats**: DJ battle, DJ duel, turntable duel, scratch battle, cutting contest, crew vs crew
**Collab vocabulary**: team up, collab, collaborate, link up, take over, your turn, my turn, follow that, top that
**Dual energy**: one two punch, double trouble, dynamic duo, twin turntables, counter scratch, answer scratch, respond, echo back, match that
**Competition framing**: versus, VS, face off, square up, round one

**Line rules**: Same as `dj` PLUS `allowDuetVocals: true`

### 28c. GENRE_STRUCTURE_TEMPLATE — `dualdj`
**Location**: `server.mjs`, `GENRE_STRUCTURE_TEMPLATES`

```
Structure: Intro → DJ 1 Scratch → Verse 1 → Chorus → DJ 2 Scratch → Verse 2 → Chorus → DJ Battle → Chorus → Outro
```

- **Intro**: Both DJs drop needles simultaneously
- **DJ 1 Scratch**: First DJ shows their skills — their style, their techniques
- **Verse 1**: Vocals over DJ 1's beat — can be a different vocalist or the same
- **DJ 2 Scratch**: Second DJ responds, matching or topping DJ 1 — distinct style
- **Verse 2**: Different energy, different flow from Verse 1
- **DJ Battle** (THE SECTION): Climactic head-to-head. Both DJs trade scratch patterns back and forth. Each round escalates. Crowd reacts. Framed with phrases like "top that", "follow that", "your turn", "my turn"
- **Outro**: Both DJs layer scratches together in unison, or one fades while the other finishes

**Verse note**: Each DJ's verse should feel distinct — DJ 1 might be smooth and technical; DJ 2 might be aggressive and flashy.

**Battle note**: Use [DJ 1 Scratch], [DJ 2 Scratch], and [DJ Battle] markers to indicate who's scratching.

### 28d. BPM Range & Alias
**Location**: `server.mjs`, `GENRE_BPM_RANGES`, `resolveGenreFromStyles`

`dual dj: [85, 130]` — Same range as single DJ.

Aliases: `"dual dj", "dual turntablist", "dj battle", "dj duel", "turntable duel", "dj crew", "dj collab", "dj tag team", "scratch battle crew", "dual scratching"`

### 28e. Genre Blend Rule
**Location**: `server.mjs`, `/llm` route

When DJ/Dual DJ is combined with other genres:
> "Turntablism and DJ culture are the FOUNDATION — scratching, cutting, beat-juggling, and DJ routines are the defining character. The [other genre] adds MUSICAL flavor (beat style, tempo, harmonic content) but the DJ/turntable element must be prominent. Include scratch breaks, cut-up vocal samples, and turntable techniques throughout."

### 28f. Frontend UI
**Location**: `ui/dist/assets/index-DscBS4mv.js`

New "DJ / Turntablism" genre group added between "Reggae / Caribbean" and "Latin":
- DJ
- Dual DJ
- Turntablism
- Scratch Battle

**Location**: `ui/dist/album.html` — Same 4 options added to genre list.

---

## 29. Bilingual Patois Code-Switching

**Problem**: When a user selected a Patois variant (e.g., "Dub (Patois)") alongside a non-English language (e.g., Japanese), the old code forced 100% Patois lyrics, completely overriding the user's language selection. The user wanted **bilingual code-switching** — lyrics that naturally mix both languages, keeping untranslatable words in their original language.

**Solution**: Three-layer bilingual detection system:

1. **Language detection** (line ~296148): When `wantsPatois = true`, check the user's selected language code. If it's NOT English or a Patois code (`en`, `jam`, `jmc`, `jmd`), enter bilingual mode.
2. **Bilingual prompt injection** (line ~296157): Instead of the monolingual "ALL lyrics MUST be in Patois" prompt, inject a code-switching prompt that tells the LLM to mix both languages naturally.
3. **Bilingual genre hints** (line ~296236): The `allowPatois` genre hints adapt — "weave Patois into [target language]" instead of "write everything in Patois."

**How it works**:

```
User selects: Dub (Patois) + J-Pop, Language: Japanese
  ↓
wantsPatois = true (Dub (Patois) contains "patois")
genreKeys.includes("reggae") = true (Dub → reggae)
language code = "ja" (Japanese)
  ↓
isBilingual = true ("ja" not in ["en", "jam", "jmc", "jmd"])
  ↓
BILINGUAL CODE-SWITCHING PROMPT fires:
  - Language: Bilingual — Japanese + Jamaican Patois
  - Primary language: Japanese
  - Patois layer: pronouns, interjections, cultural references
  - Code-switch within lines, not across sections
  ↓
Genre blend rule also adapts:
  - "Reggae, Jamaican Patois, and Japanese are the FOUNDATION"
  - NOT "Patois is the foundation" (old monolingual behavior)
```

**Bilingual prompt instructs the LLM to**:
- Use the target language (e.g., Japanese) as the dominant language for narrative flow
- Weave Patois naturally into the target language (pronouns, interjections, cultural references)
- Keep untranslatable words in their original language (irie, dutty, pickney in Patois; Japanese concepts in Japanese)
- Code-switch within lines, not just across sections
- This is FUSION, not translation — both languages coexist naturally

**Monolingual fallback preserved**: When the user selects English + Patois variant, the original "ALL lyrics MUST be in Jamaican Patois" behavior is unchanged.

**Location**: `server/server.mjs`, `/api/inspire/llm` route — three code paths:
- Line ~296148-296175: Bilingual/monolingual detection and prompt injection
- Line ~296274-296290: Genre blend rule bilingual adaptation
- Line ~296236-296260: Genre hints bilingual adaptation

---

## 30. Audio-Reactive Visualizer

**Problem**: The existing UI has a spectrum analyzer (audioMotion bar display) and Disco Mode (kick/snare/hihat energy state), but no full-featured audio-reactive visualizer with Winamp/Milkdrop-style effects, no particle systems, no waveform display, and no way to record visualizations as video.

**Solution**: Standalone visualizer page with 10 visualization modes, client-side beat detection, settings panel, playlist, video generation, and main app integration.

**New file**: `ui/dist/visualizer.html` (36 KB, self-contained, zero dependencies)

### Features

| Feature | Details |
|---------|---------|
| **Audio loading** | URL params `?src=<url>` or `?id=<songId>`, drag-and-drop, file picker |
| **Beat detection** | Kick/snare/hihat spectral analysis, EMA onset detection, BPM estimation from median IBI |
| **10 modes** | Bars, Wave, Particles, Circular, Plasma, Tunnel, Starfield, Rings, Liquid, Image+FX |
| **Settings panel** | 6 color schemes, sensitivity, smoothing, brightness, BG opacity, mode blending, mirror, glow, scanlines |
| **Playback controls** | Play/pause, stop, prev/next, seek bar, volume, track title display |
| **Playlist** | Auto-loads songs from server, shuffle, repeat, auto-advance on track end |
| **Video generation** | One-click MP4 creation via server ffmpeg pipeline with cover art |
| **Recording** | MediaRecorder on `canvas.captureStream(30)` + audio, downloads as `.webm` |
| **Keyboard** | Space=play/pause, 1-0=modes, F=fullscreen, R=record, S=settings, L=playlist, ESC=close panels |
| **UI** | Glassmorphism controls, auto-hide in fullscreen, top/bottom bars, panels |
| **Main app integration** | Floating button auto-detects currently playing song via MutationObserver, opens visualizer with `?id=` param |

### Visualization Modes

1. **Bars** — Classic 64-bar spectrum analyzer with color scheme gradients, glow on beats, reflection bars, peak-hold dots
2. **Wave** — 3-layer oscilloscope with afterglow, lineWidth pulses with beat energy, optional mirror
3. **Particles** — 600-particle pool, spawns 25-50 particles on each beat, gravity + fade, color scheme support with glow
4. **Circular** — 128 radial bars from center circle, rotation speed increases with energy, inner mirror bars
5. **Plasma** — Canvas 2D pixel manipulation at 1/4 resolution, audio-reactive coordinate distortion, color scheme tinting
6. **Tunnel** — Perspective-correct rectangular tunnel with depth, color-cycling rings, center glow
7. **Starfield** — 400-star warp field with streaks, speed reacts to beat energy
8. **Rings** — 8 concentric rotating rings reactive to frequency bands, counter-rotating
9. **Liquid** — 5-layer fluid waves with sine composition, floating orbs on strong beats
10. **Image+FX** — Cover art background with spectrum overlay, pulsing vignette, particle bursts, color shift

### Settings Panel

| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Color Scheme | 6 options | Cyber | Cyan/Magenta, Fire, Ocean, Neon, Monochrome, Sunset |
| Sensitivity | 0.5-3.0 | 1.3 | Beat detection threshold multiplier |
| Smoothing | 0.50-0.95 | 0.80 | FFT smoothing time constant |
| Brightness | 0.3-1.5 | 1.0 | Overall visualizer brightness multiplier |
| BG Opacity | 0-1.0 | 0.0 | Background fade between frames (higher = more trails) |
| Mode Blend | 0-100% | 0% | Blend current mode with next mode |
| Mirror | on/off | off | Horizontal mirror effect (Wave mode) |
| Glow | on/off | on | Canvas shadow glow on all elements |
| Scanlines | on/off | off | CRT scanline overlay |

### Beat Detection Algorithm
- Spectral energy in kick range (50-200 Hz), snare range (1-5 kHz), hihat range (6-12 kHz)
- Onset detection: energy > sensitivity × EMA running average, minimum 150ms interval
- BPM estimation: median inter-beat interval over last 30 beats
- Exposed as reactive state: `isBeat`, `beatEnergy`, `bpm`, `kickE`, `snareE`, `hihatE`

### Main App Integration
- Floating visualizer button in `index.html` uses MutationObserver to watch for `<audio>` elements
- Extracts song ID from `/api/songs/{id}/audio` pattern in audio src
- Opens visualizer with `?id=SONGID&title=TITLE` parameters
- Polls every 2s for dynamically mounted React audio elements
- Visualizer button glows brighter when a song is detected

**Location**: `ui/dist/visualizer.html` (rewritten), `ui/dist/index.html` (button updated with song detection)

---

## 31. MP4 Video Generator with Beat-Synced Editing

**Problem**: No way to generate music videos from generated tracks. The existing cover art system produces static images, and there's no audio-reactive video export pipeline.

**Solution**: Server-side beat detection + ffmpeg-based MP4 generation with Ken Burns effects, beat-synced crossfades, and audio-reactive waveform overlay.

### Two Components

#### A. Beat Detection Function (`detectBeatsInAudio`)
**Location**: `server/server.mjs`, line ~130828

- Reads WAV files using existing `parseWav` function
- Computes RMS energy in 10ms windows
- Onset detection: energy > 1.3 × EMA (α=0.05), minimum 150ms interval
- Returns `{ beats: [timestamps], bpm: number, duration: number }`
- Reuses the same audio parsing infrastructure as the existing Disco Analyzer

#### B. Video Generation Route (`POST /api/inspire/video/generate`)
**Location**: `server/server.mjs`, line ~296565

**Request body**:
```json
{
  "songId": "abc123",
  "images": ["https://example.com/cover1.png", "https://example.com/cover2.png"],
  "style": "visualizer"
}
```

**Processing pipeline**:
1. Query database for song audio file path
2. Run `detectBeatsInAudio` on the audio WAV
3. Download/cache images to temp directory
4. Build ffmpeg filter_complex:
   - **Ken Burns**: `zoompan` on each image (slow zoom from 1.0 to 1.15)
   - **Beat-synced transitions**: `xfade` between images at evenly-spaced beat boundaries
   - **Audio-reactive overlay**: `showwaves=s=1920x200:mode=cline:colors=cyan@0.5:rate=30` composited at bottom
   - **Output**: 1920×1080, H.264 (libx264, CRF 23), AAC audio (192kbps)
5. Execute ffmpeg via `child_process.execFile`
6. Return video URL

**ffmpeg filter structure**:
```
[0:a]showwaves=s=1920x200:mode=cline:colors=cyan@0.5:rate=30[waves];
[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,
     pad=1920:1080:-1:-1,setsar=1,
     zoompan=z='min(zoom+0.0005,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':
     d=DURATION:s=1920x1080:fps=30[zp0];
... (xfade transitions between images)
[bg][waves]overlay=0:H-200:format=auto[out]
```

**Location**: `server/server.mjs` — beat detection at line ~130828, temp dir at line ~296563, route at line ~296565

---

## 32. Album Auto-Fill & Shuffle

**Problem**: Building a 9-track album from scratch requires manually entering subjects and titles for every track. Creators with limited inspiration for conceptual albums need an AI-assisted way to generate a cohesive story arc or genre-varied track listing.

**Solution**: Client-side "Auto-Fill Album" and "Shuffle Tracks" buttons that call the LLM with a custom system prompt requesting JSON-structured album concepts.

### Components

#### A. Auto-Fill Album (`✨ Auto-Fill Album` button)
**Location**: `ui/dist/album.html`, lines ~519–622

- Sends a single LLM request with a custom `systemPrompt` that asks for structured JSON output:
  ```json
  {
    "theme": "Album concept description",
    "title": "Album title",
    "tracks": [
      {"title": "Track Title", "subject": "2-3 sentence description with concrete images"},
      ...
    ]
  }
  ```
- **Conceptual albums** (theme provided): Instructs the LLM to create a 3-Act Story Arc — Act 1 (Setup), Act 2 (Conflict/Journey), Act 3 (Resolution)
- **Non-conceptual albums** (no theme): Instructs the LLM to vary mood, tempo, and lyrical themes across tracks while keeping genre cohesion
- **Three-tier JSON parsing**: (1) direct `JSON.parse`, (2) extract from markdown code blocks, (3) find outermost `{...}` in text — handles any LLM output format
- Fills album title (only if empty), album theme, and all track titles + subjects
- Clears existing lyrics so `generateAlbum()` will re-LLM each track with the new subjects

#### B. Shuffle Tracks (`🎲 Shuffle Tracks` button)
**Location**: `ui/dist/album.html`, lines ~624–719

- Sends the current track titles + subjects to the LLM as context
- Asks for completely new subjects and optionally improved titles
- Preserves the album theme and genre
- Falls back to full Auto-Fill if no tracks have content yet
- Useful for iterating on an album concept without starting from scratch

#### C. UI Integration
**Location**: `ui/dist/album.html`, lines ~372–378

- Both buttons placed in the Album Info section below the model selector
- Buttons disable each other during generation (mutual exclusion)
- Loading state: "⏳ Generating concept..." / "⏳ Shuffling..."
- Helper text: "Generate a complete album concept — story arc for themed albums, genre-appropriate variety for others"

### Design Decisions

1. **Single LLM call** instead of 10 separate calls (1 theme + 9 subjects) — faster, more cohesive, cheaper
2. **Uses existing `/api/inspire/llm` endpoint** with `systemPrompt` override — no server changes needed
3. **Client-side JSON parsing** handles all LLM output variants — no dependency on server-side structured output support
4. **Non-destructive**: Auto-Fill only fills empty album titles; existing titles are preserved. Track subjects and titles are replaced but lyrics are cleared for regeneration
5. **Shuffle sends context** so the LLM knows what to replace, producing better variety than blind re-generation

---

### 33. Traditional / World Music Genres (4 Genres)

**Date**: July 21, 2026  
**Added**: 4 culturally-specific genres (Klezmer, Mariachi, Bhangra, Andean) with full backend integration (vocabulary, BPM, structure templates, genre aliases, INSTAGEN tag examples). 10 incompatible traditional genres were removed.

**Genres Added**:

| Genre | Culture | Structure | BPM Range |
|-------|---------|-----------|-----------|
| Klezmer | Eastern European Jewish | I-V-C-V-C-Break-V-Outro (doina lament break) | 80-180 |
| Mariachi | Mexican Traditional | I-V-C-V-C-Bridge-V-Outro (trumpet fanfare + grito) | 80-160 |
| Bhangra | Punjabi | I-V-C-V-C-DanceBreak-C-Outro (dhol-driven, energy never drops) | 100-150 |
| Andean | South American Highland | I-V-C-V-C-Instr-C-Outro (mountain folk) | 70-120 |

**Backend Changes**:
1. **`GENRE_VOCABULARY_MODULES`** (line ~43346): Added 4 modules with genre-specific whitelists (cultural instruments, aesthetic terms), blacklists, lineRules, and replacements for the remaining traditional/world genres (Klezmer, Mariachi, Bhangra, Andean). Each module is tailored to its cultural tradition — e.g., klezmer whitelists "klezmer, klez, freylekhs, doina, hora, bulgar" while bhangra whitelists "dhol, tumbi, algoza, bhangra, chaal, punjabi."

2. **`GENRE_BPM_RANGES`** (line ~45327): Added 4 entries for the remaining traditional/world genres. Ranges reflect each genre's real-world tempo — bhangra is 100-150 BPM (high energy dance), klezmer is 80-180 BPM (variable).

3. **`resolveGenreFromStyles()`** (line ~45270): Added 4 genre alias entries for the remaining traditional/world genres. Each includes common spellings and regional names.

4. **`GENRE_STRUCTURE_TEMPLATES`** (line ~45958): Added 4 templates for the remaining traditional/world genres with cultural structure patterns. These are NOT Western verse-chorus structures — they reflect how each tradition actually organizes music:


5. **`buildGenreStructureHint()`** (line ~46593): No changes needed — this function dynamically pulls from `GENRE_STRUCTURE_TEMPLATES` by genre key. The 4 remaining traditional/world templates are automatically included.

6. **INSTAGEN Tag Examples** (line ~47175): Added sonic description examples for the remaining traditional/world genres in the INSTAGEN prompt. These provide the LLM with model descriptions of each genre's sonic identity.

7. **INSTAGEN Structure Hints** (line ~47217): Added Traditional/World genre note to the STRUCTURE section: "Traditional/World genres (Klezmer, Mariachi, Bhangra, Andean): Structure is dictated by CULTURAL TRADITION, not Western pop conventions."

**Frontend Changes**:
1. **`album.html`** GENRE_LIST (line ~210): Added "Traditional / World" genre group with 4 genres (Klezmer, Mariachi, Bhangra, Andean), positioned after "DJ / Turntablism" group.
2. **`index-DscBS4mv.js`**: Added "Traditional / World" genre group to the minified React bundle.

**Design Decisions**:
1. Each genre's vocabulary module is culturally researched — instruments, aesthetic terms, and forbidden words are specific to each tradition (e.g., klezmer whitelists "klezmer, klez, freylekhs, doina, hora, bulgar").
2. BPM ranges are based on real-world practice, not Western defaults — bhangra's 100-150 BPM reflects its dance energy.
3. Structure templates use cultural structure patterns rather than forcing Western verse-chorus forms.
4. INSTAGEN tag examples give the LLM specific sonic vocabulary for each genre's production aesthetic.

---

## Phase 3.5 — Album Batch Handler & Settings Pipeline

### 34. Album Batch Handler v3 (API-Direct)

**Problem**: The original batch handler (v1) tried to read the React app's internal state, used `applyQualityDefaults` as a fallback (which injected incorrect settings like `dpm2m`/`sgm_uniform`), and v2 tried to click the UI button to capture params (unreliable, race-prone).

**Solution**: Complete rewrite to API-direct architecture. The batch handler never touches the React app — it reads settings from multiple sources and makes direct `/api/generate` calls.

**Location**: `ui/dist/index.html`, Album Batch Handler script block

**Architecture**:
- Fetch monkey-patch at page load captures POST /api/generate params and jobIds
- `readSettingsFromStorage()` reads ~100 `hs-*` localStorage keys
- `getParamsForTrack()` deep-copies base settings, overrides only prompt fields per track
- Direct `fetch('/api/generate', ...)` calls — no UI interaction
- Deferred `hs-album-pending` removal (only when generation actually starts)
- Dismissible backdrop

---

### 35. 3-Tier Settings Priority System

**Problem**: The batch handler needs the user's exact pipeline settings (solver, scheduler, guidance, DCW, etc.) but has no access to the React app's Zustand store.

**Solution**: Three-tier priority with fallback chain:

| Priority | Source | When Available | Accuracy |
|----------|--------|----------------|----------|
| 1 | Monkey-patch capture (`window.__abCapturedParams`) | User generated at least one track this session | Exact (captured from real POST body) |
| 2 | Saved template (`hs-album-params-template` with `_src` marker) | Previous session with capture or localStorage reconstruction | Exact |
| 3 | Direct localStorage read (`readSettingsFromStorage()`) | Always (React app persists to `hs-*` keys) | Exact (replicates `getGlobalParams()` logic) |

**Location**: `ui/dist/index.html`, `tryLoadTemplate()` function

---

### 36. Stale Template Protection

**Problem**: Old v1/v2 batch handlers saved templates without any marker, containing incorrect defaults from `applyQualityDefaults` (`dpm2m`, `sgm_uniform`, `apg`). These would be loaded and used, producing wrong audio.

**Solution**: Templates are stamped with `_src` marker:
- `_src: 'mp'` — captured from monkey-patch (most accurate)
- `_src: 'ls'` — reconstructed from localStorage (also accurate)
- No `_src` — stale template from v1/v2, auto-purged on page load

**Location**: `ui/dist/index.html`, `tryLoadTemplate()` function, lines 162-175

---

### 37. readSettingsFromStorage() — Direct localStorage Access

**Problem**: Even without a previous generation or saved template, the batch handler can get the user's exact settings from localStorage.

**Solution**: `readSettingsFromStorage()` reads ~100 `hs-*` localStorage keys and replicates the `getGlobalParams()` logic from the React bundle:
- Adapter blend computation (advanced mode, budget, per-adapter scaling)
- DCW scaler computation (low × 0.05, high × 0.02)
- Conditional fields (APG, spectral lifter, mastering, vocal naturalizer, etc.)
- Trigger word extraction from adapter filenames

**Location**: `ui/dist/index.html`, `readSettingsFromStorage()` function, lines 289-433

---

## Phase 4 — Album Metadata, ZIP Download & Music Video Pipeline *WIP*

### 38. Artist Name & Album Title with Auto-Fill

**Problem**: The Album Creator had no way to specify artist name or album title for organization and metadata purposes.

**Solution**: Added artist name and album title fields with auto-fill logic:
- **Auto-fill from saved username**: If `hs-username` localStorage key exists, uses that as artist name
- **Random name generation**: If no saved username, generates names like "Neon Phoenix", "Velvet Drifter" (adjective + noun)
- **Random album title**: Generates 2-4 word titles like "Echoes Renaissance", "Midnight Chronicles"
- **🎲 buttons**: One-click random regeneration for both fields
- **Persistence**: Saved to `hs-album-config` localStorage alongside existing settings
- **Pass-through to batch handler**: Artist name, album title, and genre are included in each track's `hs-album-pending` data

**Location**: `ui/dist/album.html`, global variables, `randomName()`, `randomAlbumTitle()`, `autoFillArtistName()`, `autoFillAlbumTitle()`, render function, `saveConfig()`

---

### 39. Persistent LLM Metadata Across Sessions

**Problem**: LLM-generated metadata (`_bpm`, `_key`, `_duration`, `_timeSignature`, `_caption`) was stored only in memory. If the user navigated away after the LLM run but before clicking Generate, all metadata was lost.

**Solution**: `saveConfig()` now persists all 5 LLM-generated fields per track:
```javascript
{subject, lyrics, title, genreOverride, bpm, key, duration, timeSignature, caption}
```
On page load, these are restored from localStorage, so metadata survives page reloads without needing to re-run the LLM.

**Location**: `ui/dist/album.html`, `saveConfig()` function

---

### 40. ZIP Download with Folder Organization

**Problem**: No way to download a completed album as organized files — tracks had to be downloaded individually.

**Solution**: Client-side ZIP generation using JSZip (loaded from CDN):
- **Folder structure**: `Artist Name/Album Title/01 - Track Title.wav`
- **metadata.txt**: Includes album name, artist, track count, and numbered track listing
- **Progress feedback**: Button shows fetching progress per track, then ZIP creation progress
- **Video support**: If video files exist, includes `.mp4` alongside `.wav` per track
- **Zero-padding**: Track numbers are zero-padded (01, 02, ..., 09) for correct file sorting

**Location**: `ui/dist/index.html`, `downloadAlbumZip()` function, lines 771-843

---

### 41. Album Music Video Pipeline *WIP*

**Problem**: No way to automatically generate music videos for album tracks using the existing cover art and video generation systems.

**Solution**: After each track's audio completes in the batch handler:
1. **Lyric splitting**: `splitLyricsIntoSections()` splits by `[Section]` headers (max 8 sections)
2. **Image generation**: Calls `/api/cover-art/generate-sections` with each section's lyrics
3. **Video rendering**: Calls `/api/inspire/video/generate-album` with audio URL + images
4. **Result storage**: `_videoUrl` stored on track, shown as 🎥 link in panel
5. **ZIP integration**: MP4 files included in album ZIP download

**Per-track timing**: ~30s per image × 4 images = ~2 min image gen + ~1 min ffmpeg = ~3 min per track
**Full 9-track album**: ~25-30 minutes total (runs per-track, not all at once)

**Location**: `ui/dist/index.html`, `splitLyricsIntoSections()` function, video generation block in `startGeneration()`

**Status**: *WIP — requires cover art models (FLUX.2-klein-9B) to be installed and ffmpeg.exe in the server directory. Download via Settings → Cover Art → Download Models + Engine (~8.8 GB total: 5.6 GB model + 335 MB VAE + 2.8 GB text encoder + sd-cli).*

---

### 42. Cover Art Sections Endpoint

**New endpoint**: `POST /api/cover-art/generate-sections`

**Problem**: The existing cover art endpoint generates one image per song (requires songId). The video pipeline needs multiple images per track, one per lyric section.

**Solution**: New endpoint that accepts sections directly, no songId required:
- **Input**: `{ sections[{lyrics, title, subject}], style, trackTitle }`
- **Processing**: Generates one image per section in parallel (max 3 concurrent to avoid OOM)
- **Prompt building**: Uses existing `buildCoverArtPrompt()` to extract visual themes from each section's lyrics
- **Output**: `{ images[{sectionIndex, url, prompt, durationMs}], total, succeeded, failed }`

**Location**: `server/server.mjs`, `router22.post("/generate-sections", ...)`, added after `/generate/:jobId`

---

### 43. Album Video Generation Endpoint

**New endpoint**: `POST /api/inspire/video/generate-album`

**Problem**: The existing `/api/inspire/video/generate` requires a `songId` to look up the audio file in the database. The album batch handler uses API-direct mode and doesn't create song records.

**Solution**: New endpoint that accepts audio URL + images directly:
- **Input**: `{ audioUrl, images[] }` — resolves audio from `data/audio/` on disk
- **Beat detection**: Runs `detectBeatsInAudio()` on the audio WAV
- **Beat-synced durations**: Uses detected onset positions to determine image section boundaries (images change at musical phrase boundaries, not arbitrary timestamps)
- **6 zoom directions**: center-in, center-out, left-pan, right-pan, top-pan, bottom-pan — cycled per image
- **10 transition types**: fade, dissolve, fadeblack, fadewhite, smoothleft, smoothright, circlecrop, radial, pixelize, diagtl — cycled per transition
- **Audio-reactive overlay**: Cyan waveform at bottom of frame
- **Output**: `{ videoPath, duration, bpm, images }` — 1920×1080 H.264/AAC

**Location**: `server/server.mjs`, `router21.post("/video/generate-album", ...)`, added after existing `/video/generate`

---

### 44. Static Video Serving Route

**Problem**: Generated video files were saved to `temp/video/` but had no HTTP static route, making them inaccessible to the client.

**Solution**: Added Express static middleware for `/temp/video/`:
```javascript
app.use("/temp/video", express.static(VIDEO_TEMP_DIR, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".mp4")) res.setHeader("Content-Type", "video/mp4");
  }
}));
```

**Location**: `server/server.mjs`, after the `/references` static route

---

## Phase 5 — Album Library with Right-Click Download Menus

### 45. Album Grouping API

**New endpoint**: `GET /api/songs/albums`

**Problem**: The React app's library lists songs individually with no way to group or browse by album. Album metadata exists in `generation_params` and `metadata_overrides` but is not surfaced for bulk operations.

**Solution**: New endpoint that reads all user songs and groups them by album name:
- **Album detection**: Extracts `album` from `generation_params` JSON or `metadata_overrides` JSON
- **Data structure**: Returns `{ albums: [{ name, artist, coverUrl, songs: [{ id, title, audio_url, cover_url, duration, ... }] }] }`
- **Sorting**: Albums sorted by track count (most tracks first)
- **Cover art**: First available cover art URL used as album cover

**Location**: `server/server.mjs`, `router3.get("/albums", ...)` — added after the last existing songs route, before `var songs_default`

---

### 46. Album ZIP Download Endpoint

**New endpoint**: `GET /api/download/album-zip?album=<name>&format=<wav|mp3|flac|opus>`

**Problem**: No way to download all tracks in an album as a single ZIP file with format conversion.

**Solution**: Server-side ZIP generation using `archiver` (already bundled for stem-studio):
- **Format support**: WAV, MP3, FLAC, Opus — with full ffmpeg conversion + ID3/Vorbis metadata embedding
- **Track numbering**: Zero-padded filenames (`01 - Track Title.mp3`)
- **Metadata**: Each file includes title, artist, album, BPM, key, lyrics, cover art
- **Streaming**: ZIP is streamed to the client (no disk storage for the full ZIP)
- **Temp cleanup**: Converted files cleaned up after archive closes
- **Filename**: `{artist} - {album}.{format}.zip`

**Location**: `server/server.mjs`, `router10.get("/album-zip", ...)` — added after the existing `/:id` download route, before `var download_default`

---

### 47. Album Library Floating Panel

**New UI**: Floating 🗂️ button (bottom-right, 164px from bottom) opens a modal album browser.

**Features**:
- **Album cards** with cover art thumbnail, name, artist, track count
- **Expandable track listing** — click or chevron to expand/collapse
- **Quick download button** on each album (📦 icon, downloads in user's preferred format from settings)
- **Unreleased tracks section** — shows songs not assigned to any album
- **Responsive modal** — centered, max 720px wide, scrollable body
- **Loading states** — shows "Loading albums..." while fetching

**Location**: `ui/dist/index.html`, new `<script>` block after the visualizer button script

---

### 48. Right-Click Context Menus for Downloads

**New UI**: Custom right-click context menus (not native browser menus) with dark glass styling.

**Album context menu** (right-click on album card or 📦 button):
- ZIP: All Tracks (user's preferred format) — bold/purple highlight
- ZIP: All Tracks as WAV
- ZIP: All Tracks as MP3
- ZIP: All Tracks as Opus
- ZIP: All Tracks as FLAC
- Track List — copies formatted list to clipboard

**Song context menu** (right-click on any track row):
- Download WAV
- Download MP3
- Download Opus
- Download FLAC

**Technical details**:
- Menus positioned relative to click coordinates with edge-flip detection
- Click-away-to-close behavior
- Dark glass backdrop styling (rgba(24,24,27,0.97) + blur)
- Keyboard-accessible: ESC or click anywhere closes
- Exposed as `window.__albumLib` for reuse from batch handler

**Location**: `ui/dist/index.html`, new `<script>` block with `window.__albumLib` global

---

## Phase 6 — Multi-Select Genre, Unified Video, Gender Context & Performance Fixes

### 49. Multi-Select Genre Picker

**Problem**: The Album Creator's genre selector was a single `<select>` dropdown — users could only pick ONE genre. The main page's React UI already had a multi-select genre picker (`GenreSelector.tsx`) with categorized groups, but the Album Creator (a standalone HTML page) had no equivalent.

**Solution**: Replaced the single dropdown with a hierarchical, categorized, multi-select genre picker matching the main page's design.

**Location**: `ui/dist/album.html`

#### Data Structure
Replaced flat `GENRE_LIST` array (~130 items) with `GENRE_TAXONOMY` — the same hierarchical structure used by the main page's `GenreSelector.tsx`:

```javascript
const GENRE_TAXONOMY = [
  { name: 'Pop', icon: '🎤', genres: ['Pop','Synth-Pop','Electropop',...] },
  { name: 'Rock', icon: '🎸', genres: ['Rock','Alternative Rock','Indie Rock',...] },
  // ... 17 categories total
];
const ALL_GENRES = GENRE_TAXONOMY.flatMap(c => c.genres); // ~200 genres
```

#### State Change
`ALBUM_GENRE` (string) → `ALBUM_GENRES` (array). All downstream references updated:
- `saveConfig()` stores `genres: [...]` array
- `init()` loads from `saved.genres` (with backward-compatible fallback from `saved.genre` string)
- LLM prompts receive `genres: ALBUM_GENRES` array instead of `genres: [ALBUM_GENRE]`
- Caption generation uses `albumGenreDisplay()` → `ALBUM_GENRES.join(', ')`

#### UI Components
- **Trigger area**: Clickable div showing selected genre chips (purple pill badges with × remove button), "Clear" button, chevron
- **Dropdown**: Absolutely-positioned panel with:
  - Search input (filters across all categories in real-time)
  - Categorized genre buttons (sticky headers with emoji icons)
  - Selected state highlighting (purple background)
  - Custom genre input + "Add" button
  - "🎲 Random Genres" button (picks 2-4 random genres)
- **Outside-click close**: Document-level `mousedown` listener checks if click is outside `#genre-picker`
- **CSS**: 60+ lines of new styles for `.genre-picker-*` classes matching the dark theme

#### Backward Compatibility
`init()` handles both new format (`saved.genres: [...]`) and old format (`saved.genre: "Rock"`):
```javascript
ALBUM_GENRES = Array.isArray(saved.genres) ? saved.genres : (saved.genre ? [saved.genre] : []);
```

---

### 50. Unified Video Generation Pipeline

**Problem**: Two separate video generation paths existed — one in the visualizer (songId-based) and one in the album batch handler (API-direct with images). The album batch handler's video path was complex, requiring separate image generation + video rendering calls.

**Solution**: Single `POST /api/inspire/video/create` endpoint that handles the entire pipeline: parse lyrics → calculate section timings from BPM → generate section-aware images → assemble beat-synced Ken Burns video.

**Location**: `server/server.mjs`, line ~297816 (`router21.post("/video/create", ...)`)

#### API Contract
```json
POST /api/inspire/video/create
{
  "songId": "uuid",              // Fetches all data from DB
  // OR direct params:
  "audioUrl": "/audio/file.wav",
  "lyrics": "[Verse] ...",
  "style": "Reggae, Dub",
  "trackTitle": "Song Name",
  "coverArtSubject": "A sunset over Kingston harbor",
  "vocalistGender": "male",      // Phase 6 addition
  "aboutGender": "female"        // Phase 6 addition
}
```

#### Processing Pipeline
1. **Data resolution**: If `songId` provided, fetches from SQLite DB; otherwise uses direct params
2. **Beat detection**: `detectBeatsInAudio()` → BPM + duration
3. **Section parsing**: `parseVideoSections(lyrics)` → extracts `[Verse]`, `[Chorus]`, `[Bridge]`, etc.
4. **Timing calculation**: `calculateSectionTimings(sections, bpm, duration)` → per-section start/end timestamps
5. **Image generation**: For each section, calls `buildCoverArtPrompt()` with section-aware context (section type, act position, lyrics imagery, gender context) → `generateCoverImage()` via FLUX.2-klein-4B
6. **Video assembly**: FFmpeg with per-image `zoompan` (Ken Burns) + crossfade transitions + audio

#### Response
```json
{
  "videoUrl": "/temp/video/video_track_uuid.mp4",
  "sections": [
    { "type": "Verse", "start": 0, "end": 15.2, "imageUrl": "..." },
    { "type": "Chorus", "start": 15.2, "end": 30.4, "imageUrl": "..." }
  ],
  "duration": 182.5,
  "bpm": 120
}
```

#### Integration Points
- **Visualizer** (`visualizer.html`): Video button calls this endpoint with `songId`
- **Album batch** (`index.html`): Album batch handler calls this endpoint with direct params per track

---

### 51. Gender/Vocalist Context System

**Problem**: AI-generated lyrics often produce incoherent gender/pronoun relationships. A song about a woman might use "he" for the subject. A male vocalist might be referred to as "she". This matters because listeners expect natural, consistent pronoun usage — a man singing about a woman should use "he" for the singer and "she" for the subject throughout.

**Solution**: Two album-level fields that flow through the entire pipeline — lyrics generation, album concept creation, image prompt building, and Phase 2 handoff.

**Location**: `ui/dist/album.html` (UI + prompts), `server/server.mjs` (image prompts)

#### UI Fields (Album Info section)
| Field | Options | Purpose |
|-------|---------|---------|
| Vocalist Gender | — Not specified — / Male vocalist / Female vocalist / Male & Female duet | Who is singing |
| Song Subject Gender | — Not specified — / About a man / About a woman | Who the lyrics are about |

Both fields persist to `hs-album-config` localStorage and are included in Phase 2 handoff data.

#### Lyrics Generation Injection
Gender context is injected as explicit rules into every LLM prompt:

**System prompt injection** (`buildGenderContext()`):
```
GENDER/PERSPECTIVE RULES:
- The singer is MALE. Use masculine pronouns (he/him/his) when the lyrics refer to
  the vocalist/speaker. Write from a male perspective.
- The subject of the song is FEMALE. When referring to the person being sung to or
  about, use feminine pronouns (she/her/hers).
```

**Subject prompt injection** (per-track lyrics generation):
```
[The vocalist is male, singing about a female subject] A song about dancing
in the rain on a summer night...
```

#### Affected Functions
| Function | How Gender Context Is Used |
|----------|---------------------------|
| `autoFillAlbum()` | Both subject prompt and system prompt include gender rules |
| `shuffleTracks()` | Subject prompt and system prompt include gender rules |
| `generateAlbum()` (per-track lyrics) | Subject is prefixed with `[MALE vocalist; FEMALE subject]` bracket |
| `generateSubject()` | Passes `buildGenderContext()` as subject hint to LLM |
| Phase 2 handoff | `albumGenre` field includes gender description in caption parts |

---

### 52. Gender-Aware Image Prompt Builder

**Problem**: AI-generated cover art and video section images have no concept of the song's gender context. A song by a male vocalist about a female subject might generate an image of a woman when it should show a man (or vice versa).

**Solution**: Gender context flows from the album page through the video/create endpoint to the server-side `buildCoverArtPrompt()` function, which enriches scene descriptions with gender-aware person descriptors.

**Location**: `server/server.mjs`, `buildCoverArtPrompt()` function (line ~42509)

#### New Parameters
```javascript
var vocalistGender = opts.vocalistGender || "";
var aboutGender = opts.aboutGender || "";
```

#### Person Descriptor Logic
```javascript
var personDesc = "";
if (vocalistGender === "male" || aboutGender === "male") personDesc = "a man";
else if (vocalistGender === "female" || aboutGender === "female") personDesc = "a woman";
else if (vocalistGender === "duet") personDesc = "a man and a woman";
```

#### Scene Enrichment
- **With subject**: If `coverArtSubject` doesn't mention a person, enriches it: `"a woman in a scene of sunset over Kingston harbor"`
- **Without subject (fallback scenes)**: Uses gender-aware fallbacks: `"a man standing in a vast ethereal landscape"` instead of generic `"a mysterious figure silhouetted against light"`

#### Video Pipeline Integration
The `POST /api/inspire/video/create` endpoint accepts `vocalistGender` and `aboutGender` from the request body and passes them to `buildCoverArtPrompt()` for every section's image.

---

### 53. Genre Fusion Prompt Fixes

**Problem**: The LLM prompt system had issues when multiple genres were selected:
1. The word "blend" in genre instructions caused the LLM to produce generic, watered-down output
2. Genre-count-aware hints were missing — selecting 1 genre vs 4 should produce different guidance
3. Patois dialect constraint was not applied when Patois genres were selected via the new multi-select picker

**Solution**: Three targeted fixes in the server-side prompt construction.

**Location**: `server/src/routes/inspire.ts`, `server/src/services/lireek/prompts.ts`

#### Fix 1: Remove "Blend" Keyword
Changed genre instruction from "blend these genres" to genre-count-aware guidance:
- 1 genre: "This is the PRIMARY genre — it dictates structure and style."
- 2-3 genres: "These genres coexist — primary dictates structure, secondaries add flavor."
- 4+ genres: "Create a FUSION concept that draws from all selected genres."

#### Fix 2: Genre-Count-Aware Hints
Added dynamic hint generation based on the number of selected genres, so the LLM produces more focused output when a single genre is selected and more creative fusion when multiple are selected.

#### Fix 3: Patois Dialect Constraint
When any Patois variant genre is selected (e.g., "Reggae (Patois)", "Dub (Patois)"), the LLM is explicitly instructed to write in authentic Jamaican Patois. This was already implemented for the main page's genre picker but wasn't being triggered when genres came through the Album Creator's multi-select picker.

---

### 54. Disco Performance Fixes

**Problem**: The audio-reactive Disco visualization system had severe latency issues:
1. Beat events were dispatched on every animation frame, regardless of whether energy exceeded the noise floor
2. No throttling — thousands of events per second during loud sections
3. `DiscoPulseWrapper` used `setInterval` instead of `requestAnimationFrame`, causing jank
4. `HiHatParticles` spawned unlimited particles on every beat, causing frame drops

**Solution**: Four targeted performance fixes across three files.

**Location**: `ui/src/stores/discoStore.ts`, `ui/src/components/shared/DiscoPulseWrapper.tsx`, `ui/src/components/shared/HiHatParticles.tsx`

#### discoStore.ts
| Fix | Before | After |
|-----|--------|-------|
| Threshold gate | Dispatched on any RMS > 0 | RMS must exceed 0.02 (noise floor) |
| Throttle | No limit | Max 30 events/second |
| Getters | Selector-based (computed each call) | Raw getters (direct property access) |
| Energy smoothing | None (jittery) | Exponential moving average |

#### DiscoPulseWrapper.tsx
| Fix | Before | After |
|-----|--------|-------|
| Timing | `setInterval(poll, 100)` | Local `requestAnimationFrame` loop |
| Delta-time | None | Capped at 16ms max (prevents runaway) |
| Cleanup | None (memory leak) | Cancels RAF on unmount |

#### HiHatParticles.tsx
| Fix | Before | After |
|-----|--------|-------|
| Spawn rate | Unlimited per beat | 80ms cooldown between spawns |
| Max particles | 100 | 40 |

---

### 55. Recovered Files from Stash

**Problem**: During upstream sync (pulling 619 commits), several locally-created files were stashed but not recovered. These files were lost from the working tree.

**Solution**: After the upstream sync completed, the stash was popped and all 4 files were recovered:

| File | Purpose | Status |
|------|---------|--------|
| `server/src/services/generation/wildcards.ts` | Server-side wildcard resolver (`{option1\|option2\|option3}` syntax expansion) | Recovered |
| `server/src/services/generation/sectionCaptionInjector.ts` | Section-specific caption style injection ([Verse] → conversational, [Chorus] → anthemic, etc.) | Recovered |
| `server/src/services/discoAnalyzer.ts` | WAV parser + RMS energy analyzer for the Disco audio-reactive system | Recovered |
| `ui/src/components/player/DiscoVisualizer.tsx` | Canvas-based particle visualizer for Disco mode | Recovered |

---

### 56. Random Genre-Aware Theme Generator

**Problem**: The Album Theme / Concept field was the only metadata field without a 🎲 random button. Artist Name and Album Title both had random generation — but the theme, which is arguably the most creatively challenging field to fill, had nothing. Users staring at an empty theme field with no inspiration.

**Solution**: Added a 🎲 button next to the Album Theme input that calls the LLM to generate a genre-aware, evocative album concept in one click.

**Location**: `ui/dist/album.html`, `randomTheme()` function (line ~263)

#### How It Works
1. User clicks the 🎲 button next to the Album Theme input
2. If no LLM provider is configured, prompts the user to select one
3. Builds a prompt that includes:
   - **Genre context**: The selected genres are passed to the LLM so the theme matches the style (e.g., Reggae → "A roots journey through Kingston's sound system culture")
   - **Gender context**: If vocalist/subject gender is set, it influences the theme's perspective
4. LLM returns a single sentence (10-20 words)
5. Response is cleaned: surrounding quotes stripped, labels removed ("THEME:"), only first line kept
6. Theme is set and the input re-renders with the result

#### LLM Prompt Design
The system prompt constrains the LLM to output ONLY the theme text — no labels, no quotes, no explanation. This is deliberately different from Auto-Fill (which expects structured multi-line output). The theme generator is a single-field, single-line call optimized for speed.

```javascript
// User prompt (simplified):
"The album's genre/style is: Reggae, Dub.
Generate a single, original album concept/theme — one sentence, 10-20 words..."

// System prompt:
"You are an expert album concept designer. You produce short, evocative
album themes that feel authentic to the genre. Output ONLY the theme text."
```

#### UI
- Button: `<button class="btn btn-secondary btn-sm" id="theme-random-btn">🎲</button>`
- Matches the existing 🎲 buttons on Album Title and Artist Name
- Shows ⏳ while the LLM call is in flight, restores 🎲 on completion
- Disabled during request to prevent double-clicks

---

## Phase 7 — Language Audit, Visualizer Fixes & Code-Switching Guard

### 57. 18-Language Support System

**Problem:** The UI only offered 12 languages in the Album Creator, while ACE-Step natively supports 18. No documentation existed for which languages the engine actually supports.

**Solution:** Full language audit across UI → server → ACE-Step engine pipeline.

**Implementation:**
- `LANGUAGE_NAMES` map (server.mjs line 297029): Cleaned to contain exactly 18 entries matching ACE-Step's natively supported languages: `en`, `zh`, `ja`, `ko`, `es`, `fr`, `de`, `it`, `pt`, `ru`, `ar`, `hi`, `tr`, `vi`, `th`, `sv`, `pl`, `nl`
- Removed unsupported entries (`jam`, `jmc`, `jmd`) from `LANGUAGE_NAMES` — these remain only in `LANGUAGE_FALLBACK_MAP` (mapping to English) and in `nonPatoisLangCodes` arrays
- `LANGUAGES` array (album.html line 203): Expanded from 12 to 18 entries, adding Turkish, Vietnamese, Thai, Swedish, Polish, Dutch
- `LANGUAGE_FALLBACK_MAP` (server.mjs line 45010): 40+ entries mapping unsupported language codes to their closest ACE-Step-supported equivalent (e.g., Ukrainian→Russian, Bengali→Hindi, Greek→Italian)

### 58. Automatic Vocal Language Remapping

**Problem:** The server never applied the language fallback to `vocal_language` before sending to the ACE-Step engine. If a user selected an unsupported language (e.g., Ukrainian), the LLM prompt was updated to write in Russian (the fallback), but the engine received `"uk"` verbatim — causing potential synthesis failures.

**Solution:** Added fallback integration in `translateParams()`.

**Implementation:**
- `translateParams()` (server.mjs line 133106-133113): Now calls `resolveLanguageFallback()` and remaps `vocal_language` to the fallback code before sending to ACE-Step
- Logs the remap: `[LangFallback] vocal_language remapped: uk -> ru (Ukrainian → Russian)`
- `resolveLanguageFallback()` (server.mjs line 45572): Simple dictionary lookup — returns `{ fallback, name, note }` for unsupported codes, `null` for natively supported codes

**Flow after fix:**
```
User picks Ukrainian (uk) → translateParams() → resolveLanguageFallback("uk")
  → fallback: "ru" → req.vocal_language = "ru" → ACE-Step synthesizes Russian vocals
```

### 59. Code-Switching Patois Variant Guard

**Problem:** The genre hints bilingual block (server.mjs line 297121) triggered bilingual code-switching for ANY reggae-family genre + non-English language, because the `reggae` vocabulary module has `allowPatois: true` for ALL reggae genres — not just `(Patois)` variants. This meant plain "Reggae" + Japanese would force bilingual mixing.

**Solution:** Added `wantsPatois` check to the genre hints block.

**Implementation:**
- Top-level `wantsPatois` flag (server.mjs line 296999): `genres.some(g => g.toLowerCase().includes("patois"))` — computed once from raw genre strings
- Genre hints block (server.mjs line 297121-297230): Now checks `genreWantsPatois` first. Three branches:
  - No `(Patois)` variant → suggests Patois as **optional** flavor only (no bilingual mixing)
  - `(Patois)` variant + non-English → **bilingual mode** (code-switching)
  - `(Patois)` variant + English → **mandatory Patois** (full monolingual Patois)

**Behavior matrix:**
| Genre + Language | Bilingual forced? |
|---|---|
| Reggae + English | No (optional flavor) |
| Reggae + Japanese | No (optional flavor) |
| Reggae (Patois) + English | No (mandatory Patois) |
| Reggae (Patois) + Japanese | **Yes (bilingual)** |
| Dubstep + Japanese | No |
| Dubstep (Patois) + Japanese | **Yes (bilingual)** |

### 60. Vocabulary Lock Patois Skip

**Problem:** The `enforceVocabularyLock()` function applied English→Patois word replacements ("i"→"mi", "the"→"di", etc.) for ALL reggae-family genres, even when the user didn't select a `(Patois)` variant. For non-English lyrics this was mostly harmless, but for English reggae without Patois it would silently convert words.

**Solution:** Added `wantsPatois` parameter to `enforceVocabularyLock()` and `processLyricsWithGenre()`.

**Implementation:**
- `enforceVocabularyLock(lyrics, genreKeyOrKeys, subject, wantsPatois)` (server.mjs line 45058): When `wantsPatois === false` and genre is `reggae` or `dubstep_patois`, returns lyrics unchanged — skipping all English→Patois replacements
- `processLyricsWithGenre(lyrics, genreKeyOrKeys, languageFallback, subject, wantsPatois)` (server.mjs line 45275): Passes `wantsPatois` through to `enforceVocabularyLock()`
- Both call sites in the `/llm` route (server.mjs lines 297240, 297314) updated to pass the top-level `wantsPatois` flag

### 61. Visualizer Auth & Audio URL Fixes

**Problem:** The visualizer had three critical bugs preventing it from working:
1. `loadPlaylist()` called `/api/songs` without an auth token → 401 Unauthorized → empty playlist
2. Audio URLs used `/api/songs/{id}/audio` but the server serves audio via static `/audio/{filename}` — wrong URL pattern
3. Opening from URL params (`?id=XXX`) used the same non-existent `/api/songs/{id}/audio` endpoint

**Solution:** Auth-aware playlist loading, correct audio URL construction, metadata-first URL param loading.

**Implementation:**
- `loadPlaylist()` (visualizer.html line 1245-1293): Now reads auth token from multiple localStorage keys (`ace-settings`, `hs-auth`, `hs-token`, etc.) and sends `Authorization: Bearer` header. Falls back to unauthenticated request if token not found.
- Audio URL construction (visualizer.html line 1274-1284): Uses `mastered_audio_url || audio_url` field from song data, constructs correct `/audio/{filename}` paths instead of non-existent `/api/songs/{id}/audio`
- URL param handler (visualizer.html line 429-458): Fetches song metadata via `/api/songs/{id}` (with auth), extracts real `audio_url`, then loads from the correct path

### 62. Visualizer New-Tab Opening

**Problem:** The visualizer button opened an inline iframe dock, which blocked browser autoplay policies — audio couldn't start without user interaction.

**Solution:** Changed the 🎛️ button to open the visualizer in a new browser tab.

**Implementation:**
- Visualizer button (index.html lines 39-100): Now calls `window.open(href, 'hotstep-visualizer')` instead of toggling an iframe dock
- If a tab is already open, navigates that tab instead of opening a duplicate
- Song ID passed via URL params (`?id=XXX&title=YYY`) so the new tab auto-loads and plays the current song
- Auto-play logic (visualizer.html line 1294-1340): After playlist loads, finds the song by ID and calls `playPlaylistIndex()` to start playback

### 63. Album Track Limit Increase (9→20)

**Problem:** Album Creator was hardcoded to a maximum of 9 tracks with no way to add more.

**Solution:** Increased to 20 tracks across all relevant code.

**Implementation:**
- `MAX_TRACKS = 20` constant (album.html line 740)
- `addTrack()` guard updated to `>= MAX_TRACKS`
- `updateAddBtn()` displays count as `X/20`
- Subtitle updated: "Generate up to 20 tracks"
- LLM auto-fill prompt now generates up to 20 track entries using `Array.from()`
- Server-side ZIP numbering uses `padStart(2, "0")` which handles up to 99 tracks

### 64. vocalLanguage in readSettingsFromStorage()

**Problem:** `readSettingsFromStorage()` in index.html read dozens of settings from localStorage but skipped `vocalLanguage`. The React app's `hs-vocalLanguage` setting didn't flow into the batch handler's base params, so standalone single-song generation could default to English.

**Solution:** Added `vocalLanguage` to the return object.

**Implementation:**
- `readSettingsFromStorage()` (index.html line 1049): Added `vocalLanguage: hs('vocalLanguage', 'en') || 'en'`
- Album tracks still override per-track via `getParamsForTrack()` (index.html line 1164)
- This ensures the React app's language setting flows into the batch handler for non-album generations

---

## Phase 8 — Music Video Creator, ComfyUI Integration & Audit Fixes

### 65. Music Video Creator Page

**Problem:** No dedicated page for creating stem-reactive music videos with AI-generated images and video. The existing visualizer was playback-only with no layer system, no stem assignment, and no ComfyUI integration.

**Solution:** Full-featured Music Video Creator page (`ui/dist/music-video.html`, ~2290 lines) with stem-reactive layered visual effects, ComfyUI AI image/video generation, timeline, and FFmpeg export.

**New file**: `ui/dist/music-video.html`

#### Layer System
- **6 default layers**: Kick, Snare, HiHat, Lead Vocals, Bass, Backing Vocals
- **Expandable to 17 layers** (Up/Down buttons)
- **Per-layer controls**: Stem assignment dropdown, visual effect picker, blend mode, opacity slider, beat sensitivity slider, color tint, mute/solo buttons
- **Layer management**: Add/remove layers, move up/down, select layer for editing

#### Visual Effects (12 modes)
| Effect | Description |
|--------|-------------|
| Bars | Classic spectrum analyzer with peaks and reflections |
| Wave | 3-layer oscilloscope with afterglow |
| Particles | 600-particle pool, beat-spawned with glow |
| Circular | 128 radial bars with rotation |
| Plasma | Audio-reactive pixel manipulation |
| Tunnel | Perspective-correct depth tunnel |
| Rings | Concentric rotating rings |
| Liquid | Layered fluid waves |
| Starfield | 400-star warp field |
| Circular Bars | Circular spectrum variant |
| Spectrum | Linear frequency display |
| Galaxy | Spiral particle system |

#### Preview Canvas
- Real-time multi-layer compositing using `globalCompositeOperation` (blend modes: screen, multiply, overlay, lighten, darken, etc.)
- Each layer's effect rendered to off-screen canvas, composited onto main canvas
- Per-stem `AnalyserNode` data drives each layer's visual intensity
- Semi-transparent background (rgba(0,0,0,0.78))

#### Image Generation
- Section-aware prompts: Verse, Chorus, Bridge, Intro, Outro, Pre-Chorus, Hook, Instrumental, Breakdown each get contextually different prompts
- Gender-aware: Uses `VOCALIST_GENDER` and `ABOUT_GENDER` from state
- Single image or batch (all sections)
- Thumbnails displayed in panel after generation
- Uses FLUX.2 Klein 9B via ComfyUI `POST /api/inspire/comfyui/generate-image`

#### Video Generation
- LTX 2.3 22B distilled image-to-video via ComfyUI
- Takes a generated image and produces a 3.2-second clip with audio
- Progress tracking via polling
- Uses `POST /api/inspire/comfyui/generate-video`

#### Timeline
- Section blocks rendered as colored rectangles
- Transport controls: play/pause, stop, seek bar
- Section labels with type and timing
- Click-to-seek on timeline

#### Export
- Resolution options: 720p, 1080p, 4K
- FPS: 24, 30, 60
- Audio: Original audio, stems only, no audio
- Server-side FFmpeg compositing
- Ken Burns zoom on image sections, crossfade transitions

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space | Play/pause |
| Esc | Exit MVC |
| M | Mute/unmute selected layer |
| S | Solo/unmute selected layer |
| A | Add new layer |
| Delete | Remove selected layer |
| 1-9 | Select layer by number |

**Location**: `ui/dist/music-video.html` — launched from index.html via MVC button (🎬 clapper icon)

---

### 66. ComfyUI Server-Side Client

**Problem:** No server-side integration with ComfyUI for AI image and video generation. The existing cover art system used `stable-diffusion.cpp` (FLUX.2-klein-4B via `sd-cli.exe`), which is limited to single images and doesn't support video generation.

**Solution:** Native ComfyUI HTTP client (~730 lines added to `server/server.mjs`) with workflow builders for LTX 2.3 and FLUX.2, plus 8 new API endpoints.

**Location**: `server/server.mjs`, ComfyUI section (after existing code, ~line 298032)

#### Core Functions
| Function | Description |
|----------|-------------|
| `comfyUpload(filePath)` | Native FormData upload to ComfyUI `/upload/image` and `/upload/input` — no external dependencies |
| `comfySubmitAndWait(workflow, timeoutMs)` | Submit workflow via `/prompt`, poll `/history/{promptId}` every 2s, 10-minute default timeout |
| `comfyFreeVRAM()` | Post-job VRAM cleanup via empty prompt with `FreeU_V2` node |
| `buildLTX2Workflow(opts)` | Builds complete LTX 2.3 workflow — two-pass sampling, audio+video latent concat, spatial upscaler, RTX Video Super Resolution ULTRA, ColorMatch + Sharpen |
| `buildFLUX2Workflow(opts)` | Builds FLUX.2 Klein 9B image generation workflow with T5 + CLIP text encoders |
| `buildSingerImagePrompt(opts)` | Section-aware prompt builder — 9 section types with different visual styles, gender-aware person descriptors |
| `buildVideoPrompt(imagePrompt, sectionType)` | Auto-generates action description from image prompt + section mood |

#### LTX 2.3 Workflow (mirrors user's working workflow)
1. Load GGUF unet (LTX-2.3-22B-distilled-1.1-Q4_K_M.gguf)
2. First pass: 768×512, 97 frames (~3.2s), 10 steps
3. Encode video to latent
4. Extract audio from source video, encode to audio latent
5. Concatenate video + audio latents
6. Second pass: Decode combined latents
7. Spatial upscaler (ltx-2.3-spatial-upscaler-x2-1.1.safetensors)
8. RTX Video Super Resolution ULTRA (scale_factor=2)
9. ColorMatch + Sharpen post-processing

#### FLUX.2 Workflow
1. Load GGUF unet (Flux-2-Klein-9B-KV-Q8_0.gguf)
2. T5 text encoder (awq-int4-flux.1-t5xxl) + CLIP-L
3. Single-pass sampling: 1024×1024, cfg_scale=1.0 (FLUX-native, negative prompts ignored)
4. Save output image

#### API Endpoints (8 new)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/inspire/comfyui/status` | GET | ComfyUI connection check |
| `/api/inspire/comfyui/generate-image` | POST | FLUX.2 image generation |
| `/api/inspire/comfyui/generate-video` | POST | LTX 2.3 video generation |
| `/api/inspire/comfyui/extract-audio` | POST | Extract audio segment from WAV |
| `/api/inspire/comfyui/assets` | GET | List generated assets |
| `/api/inspire/comfyui/assets` | DELETE | Remove generated assets |
| `/api/inspire/comfyui/export-mp4` | POST | FFmpeg export with Ken Burns + concat |
| `/api/inspire/comfyui/export-status/:jobId` | GET | Poll export progress |

#### FFmpeg Export
- **Image sections**: Ken Burns zoom (6 directions: center-in, center-out, left, right, top, bottom) with crossfade transitions
- **Video clips**: Concat demuxer for sequential playback with original audio
- **Audio overlay**: Original track mixed with video
- **Output formats**: 720p, 1080p, 4K at 24/30/60 FPS

#### Section-Aware Image Prompts
| Section Type | Visual Style |
|-------------|-------------|
| Verse | Intimate, grounded, concrete imagery |
| Chorus | Vivid, energetic, bold colors |
| Bridge | Dreamlike, transitional, unexpected angles |
| Intro | Minimalist, establishing shot, dawn/first light |
| Outro | Reflective, winding down, sunset/last light |
| Pre-Chorus | Building tension, rising energy |
| Hook | Iconic, memorable, simple bold composition |
| Instrumental | Abstract, textural, no people |
| Breakdown | Stark, stripped-back, contrast |

---

### 67. Stem Decomposition (SuperSep)

**Problem:** The Music Video Creator needs per-stem audio analysis to drive beat-reactive visual effects, but the original system only has a single master audio channel.

**Solution:** Server-side stem decomposition using SuperSep, with per-stem `AnalyserNode` routing in the Music Video Creator.

**Location**: `server/server.mjs` (SuperSep endpoint), `ui/dist/music-video.html` (stem loading + routing)

#### Server-Side
- `POST /api/supervision/separate` — Submits audio for stem separation
- Returns stems as objects: `{ trackName, audioUrl, ... }`
- Stems: Drums, Bass, Vocals, Other

#### Client-Side (Music Video Creator)
- Calls SuperSep on audio load
- Maps stems to default layers:
  - Kick → Drums stem
  - Snare → Drums stem
  - HiHat → Drums stem
  - Lead Vocals → Vocals stem
  - Bass → Bass stem
  - Backing Vocals → Vocals stem
- Each layer gets its own `AnalyserNode` fed by its assigned stem's audio element
- Layer visual intensity driven by per-stem frequency data

---

### 68. Inline Visualizer Overlay

**Problem:** The index.html had no built-in visualizer — users had to open a separate tab. Inline visualizers that use `AudioContext.createMediaElementSource()` disconnect the audio element from the DOM, requiring careful monkey-patching.

**Solution:** Inline visualizer overlay in index.html with 6 render modes, transparent canvas backdrop, AudioContext monkey-patch, and control bar.

**Location**: `ui/dist/index.html`

#### Architecture
- **AudioContext monkey-patch**: `AudioContext.prototype.createMediaElementSource` intercepted before React loads. Wraps the real `createMediaElementSource` and returns a proxy `MediaElementAudioSourceNode` that keeps the audio element in the DOM tree.
- **6 render modes**: Bars, Wave, Circular, Tunnel, Starfield, Liquid — same algorithms as the standalone visualizer but simplified
- **Transparent backdrop**: Canvas has `background: rgba(0,0,0,0.78)` so content is visible behind
- **Control bar** (z-index: 10000): Previous/next mode, mode label, close button — separate from canvas to avoid click-through issues

#### Integration
- **MVC button**: 🎬 clapper icon next to visualizer button, opens `music-video.html` with current song ID
- **Visualizer button**: 🎛️ icon opens inline overlay (replaces new-tab approach for the inline case)

#### Bug Fixes Applied
- `globalTime` double-increment removed from `renderCircular` and `renderTunnel`
- `vizModeLabel` now updates on right-click mode cycle
- `vizMode` NaN guard added for corrupted localStorage
- Dead `window.__albumLib` code (115 lines) removed
- `disconnectAudio()` called on deactivate to fix latency

---

## Phase 9 — Modularization, Cleanup & Model Upgrades

### 69. Server Modularization — Service Module Extraction

**Problem**: `server.mjs` was a 301K+ line monolithic ESM bundle. All ComfyUI client logic, beat detection, and prompt builder code lived inline alongside route handlers, making maintenance and debugging difficult.

**Solution**: Extracted three self-contained ES modules under `server/services/` with thin delegation wrappers in server.mjs.

**Location**: `server/services/comfyui-client.mjs`, `server/services/beat-detector.mjs`, `server/services/prompt-builder.mjs`

#### ComfyUI Client (`server/services/comfyui-client.mjs`, 369 lines)
- `comfyPost/Get/Upload/Download` — HTTP helpers with retry logic
- `comfySubmitAndWait` — Workflow submission with progress polling
- `ComfyUIJobQueue` — FIFO job queue class with `MAX_CONCURRENT_JOBS = 1` to prevent OOM under concurrent load
- `buildLTX2Workflow` — LTX 2.3 image-to-video workflow builder (2-pass sampling, spatial upscaler, RTX Super Resolution)
- `buildFLUX2Workflow` — FLUX.2 image generation workflow builder
- `checkComfyUIConnection` — Connection health check

#### Beat Detector (`server/services/beat-detector.mjs`, 334 lines)
- `parseWav` — WAV parser (16/24/32-bit PCM + 32-bit float)
- `analyzeWav` — Per-window RMS energy analysis
- `detectBeatsInAudio` — Onset-based beat detection
- `parseVideoSections` — Lyrics → section parser
- `calculateSectionTimings` — Beat-aligned section boundary calculation
- `analyzeAndSaveDiscoData` — Disco stem analysis
- `SECTION_TYPE_MAP` — Section type normalization

#### Prompt Builder (`server/services/prompt-builder.mjs`, 535 lines)
- All data structures: `STOP_WORDS`, `GENRE_VISUAL_CONTEXT`, `MUSIC_TERM_VISUAL`, `SECTION_NARRATIVE`, `SINGER_SCENES`, `GENRE_VISUALS`
- `translateMusicTerms` — Musical/slang → visual term translation
- `extractLyricImagery` / `extractVisualEssence` — Lyric → image prompt extraction
- `buildCoverArtPrompt` — Section-aware cover art prompt builder (anti-comic, photorealistic)
- `buildSingerImagePrompt` — Singer scene prompt builder with narrative arc
- `buildVideoPrompt` — Video action description builder

#### Impact
- **301,389 → 299,653 lines** (-1,736 lines removed from server.mjs)
- Dead code eliminated: stale `GENRE_VISUAL_CONTEXT`, `MUSIC_TERM_VISUAL`, `SINGER_SCENES`, `SECTION_NARRATIVE`, `SECTION_VISUAL_TONE`, `ACT_EMPHASIS`, `SECTION_TYPE_MAP`, `ANALYSIS_FPS`, `init_promptBuilder` esbuild block, duplicate `COMFYUI_URL` constant
- `buildLTX2Workflow` and `buildFLUX2Workflow` converted from 200-line inline implementations to thin delegation wrappers
- All 22 delegation wrappers verified: import references correct, no stale references remain
- `node --check` passes clean

---

### 70. ComfyUI FIFO Job Queue

**Problem**: Concurrent ComfyUI requests (album batch video + core engine image generation) could cause OOM crashes by exceeding VRAM limits.

**Solution**: FIFO job queue (`ComfyUIJobQueue` class) in `server/services/comfyui-client.mjs` with `MAX_CONCURRENT_JOBS = 1`. All `comfySubmitAndWait` calls automatically route through the queue. Queue has `getStatus()` for health monitoring and `drain()` for graceful shutdown.

**Location**: `server/services/comfyui-client.mjs`, `server/server.mjs` (shutdown handler)

#### Features
- Queue depth and running job info surfaced in `GET /api/inspire/comfyui/status` via `mvcQueue` field
- Dedicated `GET /api/inspire/comfyui/queue-status` endpoint
- `comfyQueue.drain()` called in SIGTERM/SIGINT shutdown handler

---

### 71. FLUX.2 Cover Art Model Upgrade (4B → 9B)

**Problem**: Cover art generation used FLUX.2-klein-4B (Q4, 2.46 GB). With RTX 5060 Ti 16GB VRAM, there was significant headroom for a higher-quality model.

**Solution**: Upgraded to FLUX.2-klein-9B (Q4_0, 5.62 GB). Uses same VAE architecture and text encoder (Qwen3-4B).

**Location**: `server/server.mjs` — `REQUIRED_FILES.diffusionModel`, `MODEL_MANIFEST`

#### Changes
| Setting | Before | After |
|---------|--------|-------|
| Diffusion model | `flux-2-klein-4b-Q4_0.gguf` (2.46 GB) | `flux-2-klein-9b-Q4_0.gguf` (5.62 GB) |
| HuggingFace URL | `leejet/FLUX.2-klein-4B-GGUF` | `leejet/FLUX.2-klein-9B-GGUF` |
| VAE | `flux2_vae.safetensors` (shared) | Same |
| Text encoder | `Qwen3-4B-Q4_K_M.gguf` | Same |

#### VRAM Budget (RTX 5060 Ti 16GB)
- FLUX.2 Klein 9B Q4: ~5.6 GB
- Qwen3-4B text encoder: ~2.5 GB
- VAE: ~0.3 GB
- **Total: ~8.4 GB** — within budget with headroom

---

### 72. SuperSep Bug Fixes

**Problem**: Three separate issues prevented stem separation from working correctly:
1. ONNX model directory defaulted to `models/onnx` (non-existent) instead of `models/supersep`
2. KickExtract path had hardcoded SuperSep skip (`return` after "deferred" message)
3. `level=NaN` when `level` was empty string (`"" ?? "0"` doesn't trigger fallback)

**Solution**: Three targeted fixes.

**Location**: `server/server.mjs` — config default, KickExtract route, StemStudio route

#### Fix 1: ONNX Directory Path
```js
// Before
DEFAULT_ONNX_DIR = path.join(PROJECT_ROOT, "models", "onnx");
// After
DEFAULT_ONNX_DIR = path.join(PROJECT_ROOT, "models", "supersep");
```

#### Fix 2: KickExtract Re-enable
Removed hardcoded `return` after "SuperSep deferred" message. Stem extraction now runs normally.

#### Fix 3: Level NaN Guard
```js
// Before
const sepLevel = parseInt(String(level ?? "0"), 10);
// After
const sepLevel = parseInt(String(level ?? "0"), 10) || 0;
```

---

### 73. MediaRecorder Guidance & Visualizer UX

**Problem**: Users might use the client-side MediaRecorder/Canvas capture for video export, which produces lower quality (WebM, 30fps cap, CPU-bound frame drops) compared to the server-side FFmpeg pipeline.

**Solution**: Added visual guidance in visualizer.html steering users toward the server-side Unified Video Generation Pipeline.

**Location**: `ui/dist/visualizer.html`

#### Changes
- REC button title updated: "Quick WebM capture (R). For HD MP4, use the server-side Video Pipeline →"
- Added 🎬 MP4? link next to REC button that opens the Video Generation modal
- Comment block above `startRecording()` documents the tradeoff (client-side for quick captures, server-side for final renders)

---

### 74. Audit Cleanup Summary

**Total issues found and fixed in this phase:**

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | `buildLTX2Workflow` full inline (160 lines) shadowing import | High | Thin wrapper delegating to service module |
| 2 | `buildFLUX2Workflow` full inline (34 lines) shadowing import | High | Thin wrapper delegating to service module |
| 3 | `init_promptBuilder` esbuild block (128 lines) dead code | High | Removed + 2 call sites |
| 4 | `SINGER_SCENES` stale constant (10 lines) | Medium | Removed |
| 5 | `GENRE_VISUAL_CONTEXT` stale constant (40 lines) | Medium | Removed |
| 6 | `MUSIC_TERM_VISUAL` stale constant (73 lines) | Medium | Removed |
| 7 | `SECTION_NARRATIVE` stale constant (10 lines) | Medium | Removed |
| 8 | `SECTION_VISUAL_TONE` + `ACT_EMPHASIS` stale (15 lines) | Medium | Removed |
| 9 | `SECTION_TYPE_MAP` duplicate (7 lines) | Medium | Removed |
| 10 | `COMFYUI_URL` shadow, `COMFYUI_POLL_MS`/`COMFYUI_TIMEOUT_MS` stale | Medium | Removed, use imported `COMFYUI_URL_MOD` |
| 11 | `checkComfyUIConnection` imported but never called | Low | Removed from import |
| 12 | `ANALYSIS_FPS` stale constant | Low | Removed |
| 13 | SuperSep ONNX dir wrong (`models/onnx` → `models/supersep`) | High | Fixed |
| 14 | KickExtract hardcoded SuperSep skip | High | Re-enabled |
| 15 | `level=NaN` in StemStudio SuperSep route | Medium | Added `\|\| 0` guard |
| 16 | FLUX.2 4B → 9B cover art model | Enhancement | Upgraded |
| 17 | ComfyUI queue drain on shutdown | Enhancement | Added |
| 18 | Queue status in `/comfyui/status` endpoint | Enhancement | Added |

---

## Phase 10 — ComfyUI Bridge, Performance & Discovery

### 75. ComfyUI Model Discovery Service

**Problem**: No way to know what models ComfyUI has installed without manually browsing directories. The server had hardcoded model paths with no discovery mechanism.

**Solution**: New `server/services/comfyui-model-scanner.mjs` (~420 lines) that auto-detects ComfyUI, scans model directories, and builds a unified model registry.

**Location**: `server/services/comfyui-model-scanner.mjs`, `server/server.mjs`

#### Features
- `detectComfyUI()` — cached connection check (60s TTL) with system stats (VRAM, device, versions)
- `findComfyUIDir()` — probes common ComfyUI installation paths
- `buildModelRegistry()` — unified model registry combining ACE-Step + ComfyUI + local models
- Filesystem scanner for 12 model categories: `image_unet`, `image_vae`, `image_clip`, `video`, `audio`, `lora`, `controlnet`, `embedding`, `upscale`, `style_model`, `wildcard`, `workflow`
- `/object_info/` API query for node-level model lists
- 5-minute cache TTL, graceful degradation when ComfyUI is offline
- `invalidateCache()` for manual re-scan

#### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/models` | GET | Full unified model registry |
| `GET /api/models/quick` | GET | Fast category counts (for status check) |
| `POST /api/models/rescan` | POST | Force cache invalidation + re-scan |

---

### 76. ComfyUI Bridge — Pipeline Archetype Registry

**Problem**: Workflow builders had hardcoded model paths with no auto-detection. No way to switch between model families without code changes.

**Solution**: New `server/services/comfyui-bridge.mjs` (~380 lines) adapted from the PGFX Logo Designer Studio's pipeline archetype registry pattern.

**Location**: `server/services/comfyui-bridge.mjs`

#### Pipeline Archetype Registry
Three registered pipelines with regex model detection:

| Pipeline ID | Media | Model Pattern | Key Nodes |
|-------------|-------|---------------|-----------|
| `flux-image` | image | `/flux\|klien\|klein/i` | UnetLoaderGGUF, VAELoader, DualCLIPLoader, SamplerCustom, VAEDecode |
| `ltx-video` | video | `/ltx\|wan\|cogvideox/i` | UnetLoaderGGUF, VAELoader, DualCLIPLoader, LTXVConditioning, LTXVImgToVideo |
| `standard-checkpoint` | image | `/sdxl\|sd3\|\.ckpt$/i` | CheckpointLoaderSimple, KSampler, VAEDecode |

New pipelines can be added by calling `registerPipeline()` with a regex pattern and build function.

#### Model Parameter Inference
`inferModelParameters(filename)` auto-detects steps, CFG, and model family:

| Model Pattern | Steps | CFG | Family |
|---------------|-------|-----|--------|
| Klein 9B/4B | 4 | 1.0 | flux2-klein |
| Schnell/Turbo/Lightning | 4 | 1.0 | distilled |
| Z-Image Turbo | 4 | 1.0 | z-image-turbo |
| LTX 2.3 | 9+4 | 1.0 | ltx2.3 |
| Flux Dev/Pro | 20 | 3.5 | flux-dev |
| SDXL/SD3 | 20 | 3.5 | sdxl |
| Unknown | 20 | 3.5 | safe-defaults |

#### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/comfyui/capabilities` | GET | Full capability discovery |
| `GET /api/comfyui/pipelines` | GET | List registered pipeline archetypes |
| `GET /api/comfyui/infer-params` | GET | Auto-detect generation parameters from model name |

---

### 77. ComfyUI Bridge — Unified Generation with Fallback

**Problem**: Image/video generation was tightly coupled to ComfyUI with no fallback when offline.

**Solution**: Unified generation interface that routes to ComfyUI when available, falls back to local `sd-cli.exe` for cover art when offline.

**Location**: `server/services/comfyui-bridge.mjs`

#### Generation Flow
```
generateImage(opts)
  → ComfyUI online?
    → YES: inferModelParameters() → buildFLUX2Workflow() → comfySubmitAndWait() → download → save locally
    → NO:  generateImageLocal() → sd-cli.exe (FLUX.2 Klein 9B) → save locally

generateVideo(opts)
  → ComfyUI online?
    → YES: inferModelParameters() → buildLTX2Workflow() → comfySubmitAndWait() → download → save locally
    → NO:  throw "Video generation requires ComfyUI"
```

#### Configurable Model Paths
Both `buildLTX2Workflow()` and `buildFLUX2Workflow()` now accept optional model path parameters (`unetModel`, `vaeModel`, `clipModel`, `clip2Model`, `upscaleModel`) defaulting to `"auto"` for backwards compatibility.

---

### 78. Visualizer Performance — Plasma LUT Optimization

**Problem**: Plasma mode computed 6 `Math.sin()` + 1 `Math.cos()` + 2 `Math.sqrt()` per pixel at 1/4 resolution, causing significant CPU load.

**Solution**: Pre-computed lookup tables for trigonometric functions and distance calculations.

**Location**: `ui/dist/visualizer.html`

#### Optimizations
| Change | Before | After |
|--------|--------|-------|
| sin/cos | `Math.sin()` per pixel (6-7 calls) | 2048-entry Float32Array LUT with lerp |
| Distance | `Math.sqrt()` per pixel | Pre-computed distance LUT per resolution |
| Indexing | `(y*pw+x)*4` multiply | `(y*pw+x)<<2` bit-shift |
| Pixel write | `Math.round()` × 3 channels | `|0` integer truncation |
| Brightness | Multiplied per-pixel per-channel | Pre-factorized outside loop |
| globalTime | Double-incremented (main loop + Plasma) | Removed Plasma-local increment |

---

### 79. Visualizer Performance — Scanline Cache & Delta Time

**Problem**: Scanlines drew `H/4` individual `fillRect` calls per frame. Plasma and Image+FX modes drew scanlines twice (inline + global post-processor). Frame timing used hardcoded `0.016` regardless of actual refresh rate.

**Solution**: Pre-rendered scanline overlay canvas, removed redundant inline draws, proper delta-time calculation.

**Location**: `ui/dist/visualizer.html`

#### Changes
- **Scanline cache**: `ensureScanlineBuf()` pre-renders scanlines to an offscreen canvas. Global post-processor uses `drawImage()` instead of per-line `fillRect()`. Canvas invalidated on resize.
- **Redundant scanline removal**: Removed inline scanline draws from `renderPlasma()` and `renderImageFx()`. Global post-processor is the single source.
- **Delta time**: Main loop now computes actual delta from `requestAnimationFrame` timestamps: `dtMs = t - lastFrame; globalTime += dtMs * 0.0006`. 100ms cap prevents huge jumps after tab-switch. `lastFrame` variable (previously declared but unused) now functional.
- **Resize cleanup**: `resize()` now also invalidates `scanlineBufH` and `plasmaDistLUT` to force re-computation at new resolution.

---

### 80. Disco Mode — DOM Particles → Canvas Renderer

**Problem**: The React app's Disco mode spawned individual `<div>` DOM elements for each particle (up to 30 concurrent), each with 6 inline style writes, CSS `will-change` forcing separate GPU compositor layers, and `setTimeout`-based cleanup causing asynchronous layout thrashing. The `useEffect` re-ran on every beat energy change (~60fps), creating React re-renders that triggered DOM manipulation.

**Solution**: Replaced the entire `Ty` component (735 chars → 1421 chars) with a canvas-based renderer.

**Location**: `ui/dist/assets/index-DscBS4mv.js` (line 208, `Ty` component)

#### Before (DOM)
```
useEffect([e, t, i]) → re-runs 60×/sec
  → document.createElement('div') × 1-3 per frame
  → 6 inline style writes per particle
  → container.appendChild(particle) → layout reflow
  → setTimeout(() => particle.remove(), 1200ms) → async cleanup
  → 30 × will-change: transform, opacity → 30 GPU layers
```

#### After (Canvas)
```
useEffect([e]) → runs once on disco toggle
  → Single <canvas> element (1 GPU layer)
  → requestAnimationFrame loop:
    → Read energy from ref (a.current = t) — no React re-render
    → Spawn particles as plain JS objects in array
    → ctx.arc() + ctx.fillStyle for each particle
    → Cull dead particles by timestamp comparison
  → Cleanup: cancelAnimationFrame + clear array
```

#### Key Architectural Changes
- Energy value stored in ref (`a.current = t`) and read directly in rAF loop — eliminates 60 React re-renders/sec
- Particle lifecycle managed by timestamp (`born`/`dead`) instead of `setTimeout`
- Zero DOM manipulation — all rendering via Canvas 2D API
- Single GPU layer instead of 30
- Canvas sized via `offsetWidth`/`offsetHeight` with resize listener

---

## Phase 11 — Pipeline Model Discovery Rewrite & LTX Multi-Model UI

### 82. Model Scanner Directory Fix

**Location**: `server/server.mjs`, pipeline-models endpoint (~line 298587)

**Bug**: `scanRecursive("diffusion_models", [".gguf"])` was scanning `diffusion_models/` for GGUF files, but GGUF models actually live in `models/unet/`. This caused the FLUX.2 Klein 9B GGUF and LTX 2.3 GGUF models to never appear in the pipeline dropdowns.

**Fix**: Changed scan paths to match actual ComfyUI directory structure:
- GGUF unets: `scanRecursive("unet", [".gguf"])` — finds `flux2/Flux-2-Klein-9B-KV-Q8_0.gguf`, `ltx2.3/LTX-2.3-22B-distilled-1.1-Q4_K_M.gguf`, etc.
- Safetensors unets: `scanRecursive("diffusion_models", [".safetensors"])` — finds `FLUX.2/flux-2-klein-9b-fp8.safetensors`, etc.
- Also added `latent_upscale_models/` directory scanning for spatial upscalers

---

### 83. stripRoot Parameter for Correct ComfyUI Loader Paths

**Location**: `server/server.mjs`, `scanRecursive()` function (~line 298560)

**Bug**: `scanRecursive("unet", ...)` returned paths like `unet/flux2/Klein-9B.gguf`, but ComfyUI's `UnetLoaderGGUF` expects `flux2/Klein-9B.gguf` (relative to its own search directory `unet/`). Same issue for CLIPLoader, VAELoader, etc.

**Fix**: Added `stripRoot = false` parameter to `scanRecursive()`. When `true`, strips the initial directory prefix from returned names:
```
displayName = stripRoot ? relPath.replace(/^[^/]+\//, '') : relPath;
```
All pipeline-models scan calls now pass `stripRoot=true`.

---

### 84. Per-Pipeline Model Arrays

**Location**: `server/server.mjs`, pipeline-models response (~line 298670)

**Before**: Single flat arrays shared across pipelines:
```
models: { fluxUnets, ltxUnets, clip, vae, upscale }
```

**After**: Separate arrays per pipeline with format-aware labels:
```
models: {
  fluxUnets,      // FLUX.2 UNet (safetensors FP8 + GGUF)
  fluxClip,       // FLUX.2 text encoders (Qwen 3 8B, T5xxl, clip_l)
  fluxVae,        // FLUX.2 VAEs
  ltxUnets,       // LTX 2.3 UNet (GGUF)
  ltxClip,        // LTX 2.3 text encoders (Gemma 3 12B + embeddings connectors)
  ltxVae,         // LTX 2.3 VAEs (video + audio, with type labels)
  ltxLoras,       // LTX 2.3 LoRAs (IC-LoRA + distillation, with type labels)
  upscale,        // Spatial upscalers (latent_upscale_models + upscale_models)
}
```

---

### 85. LTX Pipeline Config UI Expansion (4→6 Dropdowns)

**Location**: `ui/dist/music-video.html`, `renderPipelineConfig()` (~line 2461)

**Before** (4 dropdowns): UNet, VAE, Text Enc, Upscaler

**After** (6 dropdowns):
1. **UNet** — LTX 2.3 GGUF models
2. **Video VAE** — distilled + dev video VAEs
3. **Text Enc** — Gemma 3 12B + embeddings connectors
4. **Audio VAE** (new) — distilled + dev audio VAEs, filtered from ltxVae array
5. **IC-LoRA** (new) — 7 LoRAs (union-control, colorizer, motion-track, outpaint, etc.)
6. **Upscaler** — spatial upscalers

State expanded: `_pipelineModels.ltx` now has `clip`, `audioVae`, `icLora` fields in addition to `unet`, `vae`, `upscale`.

---

### 86. Full Data Flow Wiring (UI → Server → Workflow Builder)

**Frontend** (`music-video.html`):
- `generateVideoClip()` sends all 6 LTX model selections in the request body
- Change listeners wired to all 6 dropdowns via `$('pipeline-ltx-*').addEventListener`

**Server** (`server.mjs`):
- `generate-video` endpoint destructures all 6 fields: `unetModel, vaeModel, clipModel, audioVaeModel, icLoraModel, upscaleModel`
- Passes them all to `buildLTX2Workflow()`

**Workflow Builder** (`comfyui-client.mjs`):
- `buildLTX2Workflow()` accepts `unetModel`, `vaeModel`, `clipModel`, `audioVaeModel`, `icLoraModel`
- Each parameter uses its value when not `"auto"`, otherwise falls back to the distilled default

---

### 87. IC-LoRA Workflow Support

**Location**: `server/services/comfyui-client.mjs`, `buildLTX2Workflow()` (~line 423)

When `icLoraModel` is provided and not `"auto"`, inserts a `LTXICLoRALoaderModelOnly` node:
```json
"50": {
  "class_type": "LTXICLoRALoaderModelOnly",
  "inputs": {
    "lora_name": "<icLoraModel>",
    "strength": 1.0,
    "model": ["1", 0]
  }
}
```
Then re-wires `ModelSamplingLTXV` (node 7) to use `["50", 0]` instead of `["1", 0]`, so the IC-LoRA-modified model flows through sampling.

---

### 88. Forward Slash Consistency & Smart Labels

**Locations**: `server/server.mjs` defaults, `server/services/comfyui-client.mjs` default paths

- All default model paths changed from backslashes (`FLUX.2\\flux-2-klein-9b-fp8.safetensors`) to forward slashes (`FLUX.2/flux-2-klein-9b-fp8.safetensors`) to match scan output
- Smart labels added to model arrays:
  - LoRAs: ` IC-LoRA` suffix for `/_ic[_-]lora/` matches, ` Distill` for `/distilled/` matches
  - VAEs: ` video` or ` audio` suffix
  - CLIPs: ` Gemma` for gemma matches, ` connectors` for embeddings connectors

---

## Phase 12 — SuperSep Auto-Trigger Cooldown Guard

### 89. Extraction Cooldown Map

**Location**: `server/server.mjs`, near line ~132434

**Problem**: React `useEffect` in minified bundle (`index-DscBS4mv.js`, line 208) watches `[currentTrack.id, currentTrack.discoDataUrl, discoKickExtractSetting]` and fires `POST /api/songs/:id/extract-kick` on every page load when `discoKickExtract` is enabled. The zustand `currentTrack` store does not persist `discoDataUrl` across page reloads, so the effect fires on every mount. If the previous extraction failed (e.g., `analyzeAndSaveDiscoData` threw), `disco_data_url` was never saved to DB, and the background `.catch()` handler cleared all stem URLs — leaving the song in a "clean slate" state that triggers a new SuperSep extraction on every page load.

**Root cause of infinite loop**:
1. Page load → useEffect → `F.discoDataUrl` empty → POST extract-kick
2. Server: `disco_data_url` empty, stem URLs empty → starts SuperSep job
3. SuperSep processes → stems saved → `analyzeAndSaveDiscoData` fails → `disco_data_url` NOT saved → stem URLs cleared by `.catch()`
4. Next page load → same state → SuperSep runs again → ONNX model reloads → infinite cycle

**Fix**: Added `recentlyAttemptedExtractions` Map (songId → timestamp) with a 10-minute cooldown window. Before starting a new extraction, the server checks if the same song was attempted within the last 10 minutes. If so, it returns `{status: "exists", discoDataUrl: ""}` immediately — no SuperSep job created, no ONNX model load.

```
var recentlyAttemptedExtractions = new Map();
var EXTRACTION_COOLDOWN_MS = 10 * 60 * 1000;
```

The timestamp is set when a new SuperSep job is dispatched (`recentlyAttemptedExtractions.set(req.params.id, Date.now())`). On the next call for the same song within 10 minutes, the cooldown guard logs the skip and returns immediately.

---

### 90. Background Extraction Cleanup & Map Periodic Cleanup

**Location**: `server/server.mjs`, near line ~132462 and ~132622

**Successful extraction cleanup**: When `extractDrumStemsBackground()` completes successfully (disco data saved, stems deleted), it calls `recentlyAttemptedExtractions.delete(songId)` to remove the cooldown entry. This ensures the song can be re-extracted later if the user manually triggers it.

**Periodic Map cleanup**: Added a `setInterval` every 30 minutes that iterates the Map and removes entries older than 2× the cooldown window (20 minutes). The timer is `.unref()`'d so it doesn't prevent Node.js process exit.

```
setInterval(() => {
  const now = Date.now();
  for (const [songId, ts] of recentlyAttemptedExtractions) {
    if (now - ts > EXTRACTION_COOLDOWN_MS * 2) recentlyAttemptedExtractions.delete(songId);
  }
}, 30 * 60 * 1000).unref();
```

**Effect**: Server startup loads ONNX model once per SuperSep job (not per page load). Users with `discoKickExtract` enabled will see extraction run once per song that hasn't been extracted yet. After 10 minutes, failed extractions can be retried. Successful extractions clear the cooldown immediately.

---

## Phase 13 — ComfyUI Bridge for Cover Art + Model Picker

### 91. Cover Art ComfyUI Integration

**Location**: `server/server.mjs`, lines ~42530-42620, ~136003-136037, ~136497-136545

**Problem**: Cover art generation used a completely separate stack (`sd-cli.exe` + local GGUF models in `models/cover-art/`) from the existing ComfyUI bridge (`comfyui-bridge.mjs`). If users already had FLUX.2 9B models in their ComfyUI installation, they had to download *duplicate* models just for cover art. The bridge's `generateImage()` (imported as `bridgeGenerateImage`) was already capable of routing through ComfyUI with automatic fallback to local sd-cli, but `coverArtService.generateCoverImage()` bypassed it entirely.

**Fix**: Refactored `generateCoverImage()` to accept a `useComfyUI` flag and model selection params. When `useComfyUI` is `true`:
- Checks ComfyUI connectivity via `detectComfyUI()`
- Calls `bridgeGenerateImage()` with the user's selected UNet model, VAE, and CLIP
- Saves the generated image to the audio directory (same as local mode)
- Returns `{coverUrl, prompt, durationMs, source, model}`

```javascript
if (useComfyUI) {
  const { detectComfyUI: detectComfyUI2 } = await import("./services/comfyui-model-scanner.mjs");
  const { connected } = await detectComfyUI2(true);
  if (!connected) throw new Error("ComfyUI is not reachable — ...");
  const result = await bridgeGenerateImage({
    prompt, negativePrompt,
    width: GEN_WIDTH, height: GEN_HEIGHT,
    model: opts.comfyModel || undefined,
    seed, outputPrefix: "cover",
    outputDir: config.data.audioDir,
  });
  // ... returns coverUrl from result.localPath
}
```

When `useComfyUI` is `false` or unset, the original local `sd-cli.exe` pipeline runs unchanged — full backward compatibility.

**Settings threaded through pipeline**: Both parallel and sequential generation paths now destructure and pass `coverArtUseComfyUI`, `coverArtModel`, `coverArtVae`, `coverArtClip` from `job.params` to `generateCoverImage()`. Readiness check is split: ComfyUI mode checks ComfyUI connection via `detectComfyUI()`, local mode checks file existence via `getCoverArtReadiness()`.

---

### 92. ComfyUI Model Scanner for Cover Art

**Location**: `server/server.mjs`, near line ~299862

**New endpoint**: `GET /api/cover-art/comfyui-models`

Scans the ComfyUI installation's model directories for available cover art models:
- **UNet/diffusion models**: `ComfyUI/models/diffusion_models/`, `ComfyUI/models/unet/`, `ComfyUI/models/checkpoints/` — filtered by `/flux|klien|klein|sd3|sdxl|sd/i` pattern
- **VAE models**: `ComfyUI/models/vae/`, `ComfyUI/models/vae_approx/`
- **CLIP/text encoders**: `ComfyUI/models/clip/`, `ComfyUI/models/text_encoder/`

Returns `{ connected, systemInfo, models: { unet, vae, clip } }` with file names, sizes, and modification dates. Connection status includes VRAM info (total/free) from ComfyUI's `/system_stats/` endpoint.

```javascript
router22.get("/comfyui-models", async (req, res) => {
  const { detectComfyUI, findComfyUIDir, COMFYUI_MODEL_DIRS, scanDirForModels } =
    await import("./services/comfyui-model-scanner.mjs");
  const { connected, systemInfo } = await detectComfyUI(true);
  // Scan diffusion_models/, unet/, vae/, clip/, text_encoder/ ...
  res.json({ connected, systemInfo, models: { unet, vae, clip } });
});
```

---

### 93. Cover Art Engine Model Picker UI

**Location**: `ui/dist/index.html`, near closing `</body>` tag

**New floating panel**: A green 🖼️ button (bottom-right, positioned above the album button) opens the Cover Art Engine settings panel:

**Features**:
- **Mode toggle**: Checkbox to switch between "Use ComfyUI Bridge" and "Use Local sd-cli" (local storage persisted as `hs-coverArtUseComfyUI`)
- **Connection status**: Green/amber/red dot + text showing ComfyUI connection state and VRAM info (e.g., "ComfyUI connected — NVIDIA RTX 5060 Ti (10.2GB free)")
- **Model selectors**: Three dropdowns populated from `GET /api/cover-art/comfyui-models`:
  - Diffusion Model (UNet) — required, auto-detect available
  - VAE — optional, auto-detect available
  - Text Encoder / CLIP — optional, auto-detect available
- **Refresh button**: Re-scans ComfyUI model directories
- **Auto-save**: All selections are saved to localStorage immediately on change (`hs-coverArtModel`, `hs-coverArtVae`, `hs-coverArtClip`)
- **Context help**: Shows explanatory text depending on mode (ComfyUI mode: explains model scanning from ComfyUI dirs; Local mode: explains sd-cli.exe + download instructions)

**Settings integration**: New fields added to `readSettingsFromStorage()`:
```javascript
coverArtUseComfyUI: hs('coverArtUseComfyUI', false) || void 0,
coverArtModel: hs('coverArtModel', '') || void 0,
coverArtVae: hs('coverArtVae', '') || void 0,
coverArtClip: hs('coverArtClip', '') || void 0,
```

These are automatically sent to the server as part of the generation request parameters, threaded through the entire generation pipeline.

---

## Phase 14 — ComfyUI Model Manager Tab, LTX2.3 Registry & Quality-of-Life Fixes

### 94. Gemini 403 Error Suppression

**Location**: `server/server.mjs`, `getRemoteModels()` function

**Problem**: `getRemoteModels()` called the Google Gemini API endpoint every time it ran, regardless of whether the user had configured a Gemini API key. When `config.lireek.geminiApiKey` was empty or undefined, the HTTP request to Google returned a 403 Forbidden error, which was logged to the console. This created unnecessary error noise even for users who had no intention of using Gemini.

**Fix**: Added an early return at the top of `getRemoteModels()`:

```javascript
async function getRemoteModels() {
  if (!config.lireek.geminiApiKey) {
    logger.log("[Models] Gemini API key not configured — skipping remote model fetch");
    return [];
  }
  // ... existing fetch logic only runs when key is present
}
```

This completely eliminates the 403 error log when Gemini is not configured. The function returns an empty array immediately — no HTTP call, no connection attempt, no error.

**Impact**: Zero. Users who have a Gemini API key configured see no change. Users without Gemini see a clean console without misleading 403 errors.

---

### 95. Local Default Model Restoration (4B)

**Location**: `server/server.mjs`, `REQUIRED_FILES` cover art definition (near line ~42660)

**Problem**: During Phase 9 (FLUX.2 Cover Art Model Upgrade 4B → 9B), the `REQUIRED_FILES.diffusionModel` was changed from `flux-2-klein-4b-Q4_0.gguf` to `flux-2-klein-9b-Q4_0.gguf`. However, the download infrastructure continued to download the 4B model — the 9B filename in `REQUIRED_FILES` didn't match what was actually downloaded. This meant the readiness check (`getCoverArtReadiness()`) was checking for a 9B file that didn't exist, causing the cover art status to show "not installed" even though the 4B model was present.

**Fix**: Reverted `REQUIRED_FILES.diffusionModel` back to `flux-2-klein-4b-Q4_0.gguf` (4B), along with its download URL (pointing to the 4B model on HuggingFace) and the description text.

```javascript
REQUIRED_FILES: {
  diffusionModel: "flux-2-klein-4b-Q4_0.gguf",  // was: flux-2-klein-9b-Q4_0.gguf
  diffusionModelUrl: "https://huggingface.co/KleinKargo/FLUX.2-klein-4B/resolve/main/flux-2-klein-4b-Q4_0.gguf",
  // ...
}
```

**Design Decision**: The 4B model remains the LOCAL default because:
- It runs on lower-end GPUs (RTX 2060-class, 6GB VRAM)
- It's the model that the download infrastructure actually fetches
- Users with ComfyUI can still use 9B+ models via the ComfyUI bridge toggle (Phase 13)
- The ComfyUI bridge is the proper path for high-quality model usage, not swapping REQUIRED_FILES

**Impact**: Local cover art generation now correctly reports "Ready — FLUX.2-klein-4B" and works immediately after the standard one-click download (~5.9 GB).

---

### 96. ComfyUI Tab in Model Manager

**Location**: `ui/dist/assets/index-DscBS4mv.js` (minified React bundle)

**Problem**: The Model Manager (React SPA) displayed models organized by role-based tabs (stable diffusion models, feature extractors, VAE, etc.) but had no tab for ComfyUI-specific models. Users who installed LTX2.3 models via the new model registry had no way to see or manage them from the UI.

**Fix**: Four targeted patches to the minified bundle's role-based tab system.

**Architecture Discovery**: The role-based tabs are governed by:
- **`Z_`**: Array of tab IDs (e.g., `["sd", "fe", "vae", ...]`)
- **`$_`**: Object mapping tab IDs to display labels (e.g., `{sd: "Stable Diffusion", fe: "Feature Extractor", ...}`)
- **`g`**: `useMemo` filter function that filters model entries by role
- **`rv`**: Return statement function that renders the filtered models using `h(g, $_(tabId))`

**The 4 Patches**:

1. **`Z_` array**: Appended `"comfyui"` to the tab list — adds a new tab button
2. **`$_` object**: Added `comfyui: "ComfyUI"` entry — labels the tab
3. **`useMemo` filter (`g`)**: Added `o==="comfyui"` condition so models with `role: "comfyui"` appear under this tab
4. **Return handler (`rv`)**: Added `o==='comfyui'&&h(g,$_.comfyui)` so the tab renders content when clicked

```javascript
// Patch 1: Z_ array
const Z_ = [...existingTabs, "comfyui"]; // append to end

// Patch 2: $_ labels
const $_ = {...existingLabels, comfyui: "ComfyUI"};

// Patch 3: useMemo filter (simplified)
const g = useMemo(() => {
  return Z_.reduce((acc, tab) => {
    if (tab === "comfyui") {
      acc[tab] = items.filter(i => i.role === "comfyui");
    } else { /* existing logic */ }
    return acc;
  }, {});
}, [items]);

// Patch 4: return handler
return (<div>{Z_.map(tab => {
  if (tab === 'comfyui') return h(g, $_.comfyui);
  // existing tab rendering
})}</div>);
```

**Impact**: The ComfyUI tab now appears in the Model Manager, showing all models with `role: "comfyui"` in `model-registry.json` (LTX2.3 UNets, VAEs, CLIPs, checkpoints, text encoders). Users can see download status, trigger downloads, and manage ComfyUI-specific models directly from the UI.

---

### 97. LTX2.3 Video Pipeline Model Registry

**Location**: `server/data/model-registry.json`

**Problem**: The Model Manager's model registry had entries for audio generation models but no entries for the ComfyUI video pipeline models (LTX2.3 UNets, VAEs, CLIPs, etc.). Users who wanted to install models for the ComfyUI video pipeline had to manually download and place them in the correct directories.

**Fix**: Added 6 new file entries with `role: "comfyui"` and 2 new pack entries to `model-registry.json`.

**New File Entries**:

| ID | File | Size | Repo | Path |
|----|------|------|------|------|
| `ltx-unet-q4km` | `LTX-2.3-22B-distilled-1.1-Q4_K_M.gguf` | 4.08 GB | Lightricks/LTX-2.3-GGUF | `unet/ltx2.3/` |
| `ltx-unet-fp8` | `ltx-2.3-22b-distilled-fp8.safetensors` | 8.24 GB | Lightricks/LTX-2.3-fp8 | `models/unet/ltx2.3/` |
| `ltx-video-vae` | `ltx-2.3-22b-distilled_video_vae.safetensors` | 335 MB | Lightricks/LTX-2.3 | `vae/ltx2.3/` |
| `ltx-audio-vae` | `ltx-2.3-22b-distilled_audio_vae.safetensors` | 235 MB | Lightricks/LTX-2.3 | `vae/ltx2.3/` |
| `ltx-clip` | `gemma_3_12B_it_fp4_mixed.safetensors` | 3.93 GB | vantagewithai/LTX-2.3-GGUF | `text_encoders/` |
| `ltx-gemma-encoder` | `ltx-2.3-22b-distilled_embeddings_connectors.safetensors` | 93 MB | Comfy-Org/ltx-2.3 | `text_encoders/ltx2.3/` |

**New Pack Entries**:

| Pack | Files Included | Total Size |
|------|---------------|------------|
| `Video Pipeline` | ltx-unet-q4km, ltx-video-vae, ltx-audio-vae, ltx-clip, ltx-gemma-encoder | ~8.7 GB |
| `Video Pipeline (Full)` | ltx-unet-q4km, ltx-unet-fp8, ltx-video-vae, ltx-audio-vae, ltx-clip, ltx-gemma-encoder | ~16.9 GB |

**Download URL Construction**: The download service constructs URLs as `https://huggingface.co/{file.repo}/resolve/main/{repoPath}` where `repoPath` is derived from the download path relative to the model root.

**Impact**: Users can now install the complete LTX2.3 video pipeline (UNet + VAEs + CLIP + text encoders) directly from the ComfyUI tab in Model Manager — no manual downloading or file placement needed.

---

### 98. Stall Timeout Bump (120s→240s)

**Location**: `server/server.mjs`, generation pipeline stall detection

**Problem**: The stall timeout (`STALE_TIMEOUT_MS`) was set to 120 seconds, meaning if the ACE-Step engine or ComfyUI job didn't report progress within 2 minutes, the generation would be cancelled as "stalled." For longer generations — particularly the LTX2.3 video pipeline with two-pass sampling, upscaling, and post-processing — 120 seconds was too short, causing legitimate in-progress jobs to be cancelled prematurely.

**Fix**: Bumped the timeout from 120,000ms to 240,000ms:

```javascript
const STALE_TIMEOUT_MS = 240000; // was 120000 — 4 minutes for long ComfyUI jobs
```

**Impact**: Video pipeline generations (which can take 3-5 minutes depending on model size and GPU) no longer get incorrectly cancelled during normal operation. Audio-only generations are unaffected since they typically complete well within 60 seconds.

---

### 99. Cover Art Log Visibility (DEBUG→WARNING)

**Location**: `server/server.mjs`, cover art generation pipeline

**Problem**: Two `[CoverArt] Skipped` log messages were logged at `DEBUG` level, making them invisible in normal console output. When cover art was configured to skip certain songs (e.g., due to missing models or user preference), there was no visible indication — users couldn't tell whether cover art was being generated, skipped, or failing silently.

**Fix**: Changed both `[CoverArt] Skipped` log messages from `logger.debug()` to `logger.warn()`:

```javascript
// Before:
logger.debug(`[CoverArt] Skipped — cover art disabled for this request`);
logger.debug(`[CoverArt] Skipped — no song ID provided`);

// After:
logger.warn(`[CoverArt] Skipped — cover art disabled for this request`);
logger.warn(`[CoverArt] Skipped — no song ID provided`);
```

**Impact**: Users can now see in the console when cover art is being skipped and why. This aids debugging without being overly verbose — `WARNING` level is appropriate for skipped operations that aren't errors but are worth knowing about.

---

## How to Reproduce on a Clean v1.1.4

### Backend (`server/server.mjs`)

1. **Banned vocabulary**: Add words from Section 1 to the existing banned-word arrays
2. **OVERUSED_WORDS**: Add Set from Section 2 after the banned arrays
3. **Genre vocabulary modules**: Add `metal`, `duet`, `porn`, `porngroove`, `dj`, `dualdj` modules to `GENRE_VOCABULARY_MODULES` (note: `acapella` was added then removed — do NOT re-add)
4. **Genre alias resolver**: Add `metal`, `duet`, `porn`, `porngroove`, `dj`, `dualdj` entries to `resolveGenreFromStyles()` (note: `acapella` was added then removed — do NOT re-add)
5. **BPM ranges**: Add entries for `metal` subgenres, `duet`, `porn`, `porn groove`, `dj`, `dual dj` (note: `acapella` and `beatbox` were added then removed — do NOT re-add)
6. **Structure rules**: Add `FLEXIBLE_VERSE_GENRES` and `NO_CHORUS_GENRES` to `enforceLineCounts()`
7. **Multi-genre architecture**: Rewrite `mergeGenreModules()` and `buildMergedSlopReplacements()` with primary-wins logic. Update `enforceLineCounts()` chorus enforcement to primary-genre-only.
8. **Genre structure templates**: Add all 60+ templates to `GENRE_STRUCTURE_TEMPLATES` (metal×8, reggae×3, kpop, hiphop×7, blues×6, punk×6, folk×5, dj×2, traditional/world×4, plus genre-agnostic fallbacks)
9. **Traditional/world vocabulary modules**: Add 4 modules to `GENRE_VOCABULARY_MODULES` (klezmer, mariachi, bhangra, andean) — 10 incompatible genres removed
10. **Traditional/world BPM ranges**: Add 4 entries to `GENRE_BPM_RANGES`
11. **Traditional/world genre aliases**: Add 4 entries to `resolveGenreFromStyles()`
12. **Metal vocabulary safety**: Remove destructive replacements (sun→moon, light→flame, sky→grave, dark→void, walk→prowl, wet→drenched)
10. **Subject-aware vocabulary lock**: Add `subject` parameter to `enforceVocabularyLock()` and `processLyricsWithGenre()`
11. **Outro enforcement**: Add Step 2b (auto-insertion) to `processLyricsWithGenre()`. Add OUTRO RULE to all 3 prompts. Add outro quality check (#14) to `analyzeLyricsQuality()`.
12. **Dub notation preservation**: Add `PRESERVED_EFFECT_WORDS` Set and modify `stripParentheticalInstructions()` to preserve single-word effects.
13. **Quality analyzer**: Add subject parameter to `analyzeLyricsQuality()`. Add checks #11 (Subject Relevance), #12 (Narrative Coherence), #13 (3-Act Progression), #14 (Outro Check).
14. **Prompts**: Add 3-Act Story Structure, Narrative Coherence, Grease Spot exception, VARIETY IS SURVIVAL, OUTRO RULE, DJ/Dual DJ tag examples, Traditional/World genre structure hints, and traditional genre tag examples for the 4 remaining genres to all prompt locations.
15. **Blend instructions**: Update `buildGenreStructureHint()` to explicitly state primary dictates structure. Add DJ genre blend rule for turntablism + other genres.
16. **Patois optional**: Split Patois override into mandatory (Patois variant selected) and optional (base reggae genre). When a non-English language is selected alongside a Patois variant, enter bilingual code-switching mode instead of forcing 100% Patois.
17. **Line rule processing**: Add `allowScratchEffects` and `allowDuetVocals` to genre hint injection in `/llm` route.
18. **Language audit**: Clean `LANGUAGE_NAMES` to 18 ACE-Step-supported entries only (remove `jam`, `jmc`, `jmd`). Add `wantsPatois` flag at top of `/llm` route.
19. **Code-switching guard**: Add `genreWantsPatois` check to genre hints bilingual block (line 297121). Three branches: optional flavor, bilingual, or monolingual Patois.
20. **Vocabulary lock Patois skip**: Add `wantsPatois` parameter to `enforceVocabularyLock()` and `processLyricsWithGenre()`. Skip English→Patois replacements when `wantsPatois === false`.
21. **vocal_language fallback**: Add `resolveLanguageFallback()` call in `translateParams()` to remap unsupported language codes before sending to ACE-Step engine.
22. **Album track limit**: Change `MAX_TRACKS` from 9 to 20 in album.html. Update `addTrack()`, `updateAddBtn()`, `clearForm()`, and LLM auto-fill prompt for 20 tracks.
23. **ComfyUI client** (~730 lines): Add `comfyUpload()`, `comfySubmitAndWait()`, `comfyFreeVRAM()`, `buildLTX2Workflow()`, `buildFLUX2Workflow()`, `buildSingerImagePrompt()`, `buildVideoPrompt()` functions.
24. **ComfyUI API endpoints**: Add 8 endpoints (`/comfyui/status`, `/comfyui/generate-image`, `/comfyui/generate-video`, `/comfyui/extract-audio`, `/comfyui/assets` GET/DELETE, `/comfyui/export-mp4`, `/comfyui/export-status/:jobId`).
25. **FFmpeg export**: Add Ken Burns zoom (6 directions), crossfade transitions, concat demuxer, audio overlay, progress tracking.
26. **data/mvc/ directory**: Create at startup for Music Video Creator assets.
27. **Audit fixes**: Path traversal guard on `/data/mvc` static server, auth on DELETE/GET `/comfyui/assets`, empty video buffer throw, `exportJobs` memory leak cleanup, async `comfyUpload` read.
28. **Phase 10**: Create `server/services/comfyui-model-scanner.mjs` — model discovery service with filesystem scan (12 categories), `/object_info/` API query, unified model registry, connection detection, cache invalidation
29. **Phase 10**: Create `server/services/comfyui-bridge.mjs` — pipeline archetype registry (`flux-image`, `ltx-video`, `standard-checkpoint`), `inferModelParameters()` for auto-detecting steps/CFG from filename, `discoverCapabilities()` for capability inference, `generateImage()`/`generateVideo()` with sd-cli.exe fallback
30. **Phase 10**: Add imports for model scanner + bridge modules in server.mjs
31. **Phase 10**: Add `GET /api/models`, `GET /api/models/quick`, `POST /api/models/rescan` model registry endpoints
32. **Phase 10**: Add `GET /api/comfyui/capabilities`, `GET /api/comfyui/pipelines`, `GET /api/comfyui/infer-params` bridge endpoints
33. **Phase 10**: Add configurable model paths (`unetModel`, `vaeModel`, `clipModel`, `clip2Model`, `upscaleModel`) to `buildLTX2Workflow()` and `buildFLUX2Workflow()`
34. **Phase 10**: Add ComfyUI model scanner import + bridge import to server.mjs module imports section
35. **Phase 11**: Fix `scanRecursive()` scan paths — GGUF from `unet/`, safetensors from `diffusion_models/`, latent upscalers from `latent_upscale_models/`
36. **Phase 11**: Add `stripRoot` parameter to `scanRecursive()` so returned names match ComfyUI loader expectations (relative to search dir, not `models/` root)
37. **Phase 11**: Split model arrays per-pipeline: `fluxUnets`, `fluxClip`, `fluxVae`, `ltxUnets`, `ltxClip`, `ltxVae`, `ltxLoras`, `upscale`
38. **Phase 11**: Update defaults paths to forward slashes (`FLUX.2/` not `FLUX.2\\`)
39. **Phase 11**: Add `audioVaeModel` and `icLoraModel` params to `buildLTX2Workflow()`
40. **Phase 11**: Add `LTXICLoRALoaderModelOnly` node insertion when IC-LoRA selected
41. **Phase 11**: Update `generate-video` endpoint to destructure and pass all 6 LTX model params
42. **Phase 11**: Add smart labels (IC-LoRA/Distill, video/audio, Gemma/connectors) to model arrays
43. **Phase 12**: Add `recentlyAttemptedExtractions` cooldown Map (10-minute TTL) and `EXTRACTION_COOLDOWN_MS` constant after `extractionsInFlight` Set declaration
44. **Phase 12**: Add cooldown guard check in `router3.post("/:id/extract-kick")` — after `extractionsInFlight` check, before ACE server call — return `{status: "exists", discoDataUrl: ""}` if song was attempted within cooldown
45. **Phase 12**: Set cooldown timestamp (`recentlyAttemptedExtractions.set(req.params.id, Date.now())`) when starting a new SuperSep job
46. **Phase 12**: Add `recentlyAttemptedExtractions.delete(songId)` at end of `extractDrumStemsBackground()` (successful completion path)
47. **Phase 12**: Add `setInterval` for periodic Map cleanup every 30 minutes (`.unref()`'d, removes entries older than 2× cooldown)
48. **Phase 13**: Refactor `generateCoverImage()` to support `useComfyUI` flag — when true, routes through `bridgeGenerateImage()` instead of spawning `sd-cli.exe`; when false, uses existing local pipeline
49. **Phase 13**: Add `GET /api/cover-art/comfyui-models` endpoint — scans ComfyUI `diffusion_models/`, `unet/`, `vae/`, `clip/`, `text_encoder/` directories, reports connection status + VRAM info + available models
50. **Phase 13**: Thread new settings (`coverArtUseComfyUI`, `coverArtModel`, `coverArtVae`, `coverArtClip`) through both parallel and sequential cover art generation pipelines with readiness check split (ComfyUI connection vs local file check)
51. **Phase 14**: Add early return in `getRemoteModels()` when `!config.lireek.geminiApiKey` — log message + return `[]`, no HTTP call
52. **Phase 14**: Revert `REQUIRED_FILES.diffusionModel` from `flux-2-klein-9b-Q4_0.gguf` to `flux-2-klein-4b-Q4_0.gguf` — matching what the download infrastructure actually fetches
53. **Phase 14**: Change `STALE_TIMEOUT_MS` from 120000 to 240000 — prevent premature stall cancellation of long ComfyUI video jobs
54. **Phase 14**: Change `[CoverArt] Skipped` messages from `logger.debug` to `logger.warn` for console visibility
55. **Phase 14**: Add 6 LTX2.3 model entries to `server/data/model-registry.json` with `role: "comfyui"` — `ltx-unet-q4km`, `ltx-unet-fp8`, `ltx-video-vae`, `ltx-audio-vae`, `ltx-clip`, `ltx-gemma-encoder`
56. **Phase 14**: Add 2 video pipeline packs to `model-registry.json` — `Video Pipeline` (5 files, ~8.7 GB) and `Video Pipeline (Full)` (6 files, ~16.9 GB)

### Frontend (`ui/dist/assets/index-DscBS4mv.js`)

1. Remove the "Vocal / Special" group from the `iy` genre groups array
2. Add `Reggae (Patois)`, `Dub (Patois)`, `Dancehall (Patois)` to the "Reggae / Caribbean" group
3. Add new "DJ / Turntablism" genre group with DJ, Dual DJ, Turntablism, Scratch Battle
4. Add new "Traditional / World" genre group with Klezmer, Mariachi, Bhangra, Andean
5. Verify the bundle loads without errors
6. **Phase 14**: Append `"comfyui"` to the `Z_` tab array for Model Manager role-based tabs
7. **Phase 14**: Add `comfyui: "ComfyUI"` to the `$_` description labels object
8. **Phase 14**: Add `o==="comfyui"` clause to the `useMemo` filter (`g`) that matches models with `role: "comfyui"`
9. **Phase 14**: Add `o==='comfyui'&&h(g,$_.comfyui)` to the `rv` return handler so the tab renders ComfyUI model content when clicked

### Frontend (`ui/dist/index.html`)

1. Add floating album button script before closing `</body>` tag
2. Button links to `/album.html` with gradient purple/pink styling
3. Add floating visualizer button with MutationObserver song detection (gradient cyan)
4. Button auto-detects currently playing song from `<audio>` element src pattern
5. Opens visualizer with `?id=SONGID&title=TITLE` parameters
6. **Phase 7**: Visualizer button now opens in new tab (`window.open()`) instead of inline iframe dock, to avoid autoplay restrictions
7. **Phase 7**: Add `vocalLanguage: hs('vocalLanguage', 'en')` to `readSettingsFromStorage()` return object
8. **Phase 8**: Add inline visualizer overlay (6 modes, transparent backdrop, AudioContext monkey-patch)
9. **Phase 8**: Add MVC launcher button (🎬 clapper icon) that opens `music-video.html`
10. **Phase 8**: Remove Album Library floating icon (moved to album.html header button)
11. **Phase 8**: Remove dead `window.__albumLib` code (115 lines)
12. **Phase 8**: Add vizMode NaN guard for corrupted localStorage
13. **Phase 8**: Fix vizModeLabel update on right-click mode cycle
14. **Phase 8**: Fix globalTime double-increment in Circular & Tunnel renderers
15. **Phase 8**: Fix vizControlBar not hidden on Esc
16. **Phase 10**: Create `server/services/comfyui-model-scanner.mjs` — model discovery with filesystem scan (12 categories), `/object_info/` query, unified registry, 5-min cache TTL
17. **Phase 10**: Create `server/services/comfyui-bridge.mjs` — pipeline archetype registry (flux-image, ltx-video, standard-checkpoint), model parameter inference, capability discovery, unified generation with sd-cli.exe fallback
18. **Phase 10**: Add imports for model scanner + bridge in server.mjs
19. **Phase 10**: Add `GET /api/models`, `GET /api/models/quick`, `POST /api/models/rescan` endpoints
20. **Phase 10**: Add `GET /api/comfyui/capabilities`, `GET /api/comfyui/pipelines`, `GET /api/comfyui/infer-params` endpoints
21. **Phase 10**: Add configurable model paths (`unetModel`, `vaeModel`, `clipModel`, etc.) to `buildLTX2Workflow()` and `buildFLUX2Workflow()`
22. **Phase 10**: Replace Disco DOM particle system (`Ty` component, 735→1421 chars) with canvas-based renderer in `index-DscBS4mv.js`
23. **Phase 10**: Add Plasma sin/cos lookup tables (2048-entry), distance LUT, pre-rendered scanline overlay, proper delta-time frame timing to `visualizer.html`
24. **Phase 10**: Add ComfyUI status widget (green/orange/red dot), model browser panel, image/video model selectors to `music-video.html`
25. **Phase 11**: Expand `_pipelineModels.ltx` to include `clip`, `audioVae`, `icLora` fields
26. **Phase 11**: Add Audio VAE and IC-LoRA dropdowns to `renderPipelineConfig()` with proper filters
27. **Phase 11**: Wire all 6 LTX dropdown change listeners to `_pipelineModels` state
28. **Phase 11**: Update `generateVideoClip()` to send `clipModel`, `audioVaeModel`, `icLoraModel` in request body
29. **Phase 11**: Update `optList()` to read from per-pipeline arrays (`m.fluxClip`, `m.ltxClip`, `m.ltxVae`, `m.ltxLoras`)
30. **Phase 13**: Add floating Cover Art Engine panel button (🖼️, green gradient, bottom-right) that opens a model picker with ComfyUI connection status (green/red dot + VRAM info), model dropdown selectors (UNet/VAE/CLIP auto-scanned from ComfyUI), mode toggle (ComfyUI Bridge vs Local sd-cli), and auto-save to localStorage
31. **Phase 13**: Add `coverArtUseComfyUI`, `coverArtModel`, `coverArtVae`, `coverArtClip` to `readSettingsFromStorage()` return object

### Frontend (`ui/dist/album.html`)

1. Create new standalone HTML file with dark theme
2. Implement auto-auth, provider selection, 20-track grid, sequential generation
3. LLM lyrics → ACE-Step audio → poll → results with playback
4. Add "Auto-Fill Album" button with LLM-based concept generation (line-based format output, 5-tier parsing)
5. Add "Shuffle Tracks" button for re-rolling track subjects with existing context
6. Add "Traditional / World" genre group to genre dropdown (4 genres: Klezmer, Mariachi, Bhangra, Andean)
7. **Phase 7**: Expand LANGUAGES array from 12 to 18 entries (add Turkish, Vietnamese, Thai, Swedish, Polish, Dutch)
8. **Phase 7**: Increase track limit from 9 to 20 (`MAX_TRACKS = 20`). Update `addTrack()`, `updateAddBtn()`, `clearForm()`, and LLM auto-fill prompt.
9. **Phase 8**: Add multi-select genre picker with 200+ genres across 17 categories
10. **Phase 8**: Add gender/vocalist context fields and `buildGenderContext()` function
11. **Phase 8**: Add random genre-aware theme generator button
12. **Phase 8**: Add Album Library button in header (opens modal, replaces floating icon in index.html)

### Frontend (`ui/dist/music-video.html`) — **NEW**

1. Create standalone HTML file (~2290 lines) with dark theme
2. Implement layer stack system (6 default layers, expandable to 17)
3. Implement 12 visual effects with per-stem AnalyserNode routing
4. Add ComfyUI image generation (FLUX.2) with section-aware prompts
5. Add ComfyUI video generation (LTX 2.3) with progress tracking
6. Add timeline with section blocks and transport controls
7. Add FFmpeg export modal with resolution/FPS/audio options
8. Add keyboard shortcuts (Space, Esc, M, S, A, Delete, 1-9)
9. Add stem decomposition via SuperSep endpoint
10. Add auth token support on all ComfyUI fetch calls

### Frontend (`ui/dist/visualizer.html`)

1. Create standalone HTML file (self-contained, zero dependencies)
2. Implement client-side beat detection (kick/snare/hihat spectral analysis, EMA onset detection)
3. Implement 11 visualization modes: Bars, Wave, Particles, Circular, Plasma, Tunnel, Starfield, Rings, Liquid, Image+FX, Milkdrop
4. Add settings panel: 6 color schemes, sensitivity, smoothing, brightness, BG opacity, mode blending, mirror, glow, scanlines
5. Add playback controls: play/pause, stop, prev/next, seek bar, volume, track info
6. Add playlist panel: auto-loads songs from server, shuffle, repeat, auto-advance
7. Add video generation modal: calls server `/api/inspire/video/generate` with cover art
8. Add MediaRecorder-based video recording (canvas.captureStream + audio)
9. Add keyboard shortcuts (Space, 1-0, F, R, S, L, ESC) and auto-hide UI
10. **Phase 7**: Add auth token support to `loadPlaylist()` — reads from localStorage keys, sends Bearer header
11. **Phase 7**: Fix audio URL construction — use `mastered_audio_url || audio_url` field, construct `/audio/{filename}` paths
12. **Phase 7**: Add URL param handler that fetches song metadata via `/api/songs/{id}` before loading audio
13. **Phase 7**: Add auto-play on open — finds song by ID in playlist and starts playback

### Backend — Video Generation (`server/server.mjs`)

1. Add `detectBeatsInAudio(audioPath)` function after existing `analyzeAndSaveDiscoData` (~line 130828)
2. Add `VIDEO_TEMP_DIR` creation at startup (~line 296563)
3. Add `POST /api/inspire/video/generate` route on `router21` (~line 296565)
4. Route accepts `{ songId, images, style }`, runs beat detection, builds ffmpeg filter_complex with zoompan + xfade + showwaves overlay
5. Execute via `child_process.execFile` using bundled `ffmpeg.exe`
3. API integration: `/api/auth/auto`, `/api/inspire/llm`, `/api/generate`, `/api/generate/status`

---

## Credits & Attribution

This project builds upon the work of the following creators and open-source projects:

### Original Author
- **HOT-Step CPP** by [scragnog](https://github.com/scragnog/HOT-Step-CPP) — The base application, inference pipeline, UI, and ACE-Step integration. All original code, architecture, and design belong to scragnog. The PGFX Edition enhancements are additive modifications to this foundation.

### AI Music Engine
- **ACE-Step** by [ace-step](https://github.com/ace-step/ACE-Step) — The AI music inference engine powering all audio generation. Licensed under MIT.

### PGFX Edition Enhancements
- **PyrateGFX Productions** — Genre-aware song architecture (60+ structure templates, 4 traditional/world music genres), narrative intelligence (3-Act structure, coherence enforcement), anti-AI slop system, album generator with auto-fill & shuffle, audio-reactive visualizer with Milkdrop/Butterchurn (Plasma LUT optimization, scanline cache, delta-time frame timing), MP4 video generator, Music Video Creator with stem-reactive layered effects and ComfyUI AI image/video generation (LTX 2.3 + FLUX.2), ComfyUI bridge with pipeline archetype registry, model parameter inference, capability discovery, and sd-cli.exe fallback, ComfyUI model browser with status widget, canvas-based Disco particle system, DJ/Dual DJ genre system, bilingual Patois code-switching with variant detection, 18-language support with intelligent fallback and automatic vocal language remapping, quality analyzer, server modularization (4 service modules), FIFO ComfyUI job queue, FLUX.2 9B model upgrade, SuperSep auto-trigger cooldown guard (prevents infinite re-trigger loop on every page load), pipeline model discovery rewrite (correct directory scanning, stripRoot for loader-compatible paths), LTX 2.3 multi-model UI (6 dropdowns including Audio VAE and IC-LoRA), IC-LoRA workflow support (LTXICLoRALoaderModelOnly), ComfyUI Model Manager tab with role-based filtering, LTX2.3 video pipeline model registry (6 models + 2 packs), Gemini 403 error suppression, local default 4B model restoration, stall timeout bump (120s→240s), and all Phase 1-14 enhancements.

### Additional
- **Node.js** runtime — Server-side JavaScript execution
- **ffmpeg** — Video generation and audio processing
- **Various LLM providers** — Gemini, OpenAI, Anthropic, Ollama, LM Studio for lyric generation

### License
The original HOT-Step CPP and ACE-Step are provided under their respective licenses (ACE-Step: MIT). The PGFX Edition enhancements in this report are provided as-is for community use and potential upstream contribution. See individual file headers for specific licensing.

---

*Report generated for upstream contribution. All changes are provided as-is for review and potential integration.*
