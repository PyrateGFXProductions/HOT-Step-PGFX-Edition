# HOT-Step CPP — Community Enhancements Report

**Base Version**: `HOT-Step-CPP-v1.1.4-win-x64-cuda13.1`  
**Report Date**: July 21, 2026 (updated — Traditional/World Music Genres + Visualizer + Video Generator + Bilingual Patois + Album Auto-Fill added)  
**Modified Files**: `server/server.mjs`, `ui/dist/assets/index-DscBS4mv.js`, `ui/dist/index.html`, `ui/dist/album.html`, `ui/dist/visualizer.html`

---

## Summary

This report documents all enhancements made to the HOT-Step CPP codebase. The work spans two major phases:

**Phase 1** (July 18–20): Anti-AI slop vocabulary, genre-adaptive structure rules, Patois dialect integration, new genre profiles (acapella, duet, adult/sensual), and lyric quality evaluation improvements.

**Phase 2** (July 21): Multi-genre architecture overhaul, narrative coherence enforcement, outro fix, metal vocabulary safety, subject-aware processing, removal of unsupported genres, Patois made optional, bilingual Patois code-switching, Album Generator feature with AI auto-fill & shuffle, DJ/Dual DJ genre system, audio-reactive visualizer, MP4 video generator with beat-synced editing, and 14 traditional/world music genres (Gagaku, Min'yo, Enka, Korean Traditional, Carnatic, Hindustani, Gamelan, Balinese, Klezmer, Mariachi, Tuvan Throat Singing, Bhangra, Gnawa, Andean).

The modified `server.mjs` grew from **294,865 lines** to **~299,000 lines** (net addition of ~4,135 lines). Three new files added: `ui/dist/album.html` (Album Generator page), `ui/dist/visualizer.html` (Audio-reactive visualizer), and modifications to `ui/dist/index.html` (floating buttons).

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
14. [ALL CAPS Placement Fix](#14-all-caps-placement-fix)
15. [Grease Spot Rule with Existential Exception](#15-grease-spot-rule-with-exception)
16. ["VARIETY IS SURVIVAL" Instruction](#16-variety-is-survival-instruction)
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
33. [Traditional / World Music Genres (14 Genres)](#33-traditional--world-music-genres-14-genres)

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

### 14. ALL CAPS Placement Fix

**Location**: All 3 prompts

**Before** (wrong): "Vary the position of ALL CAPS" — implying it should be on different lines in different verses.

**After** (correct): "Vary WHETHER a verse gets ALL CAPS at all." Release naturally lands on the last line (that's correct). The variety is in which verses get the payoff and which stay entirely lowercase (sustained tension, denied release).

---

### 15. Grease Spot Rule with Existential Exception

**Location**: All 3 prompts (3 separate locations)

The Grease Spot Rule forces concrete nouns to fight AI slop. **New exception**: doom metal, black metal, progressive metal, folk, shoegaze, post-rock — abstract language is core to their identity. They can use abstract concepts but must ground each one with at least one concrete image per verse.

---

### 16. "VARIETY IS SURVIVAL" Instruction

**Location**: Both system prompts

Explicit warning: "Real songs are NOT repetitive in structure. If every verse has the same length, same cadence, same ALL CAPS placement, the listener gets bored." Instructs the LLM to vary verse lengths, imagery types, emotional intensities, and line lengths.

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
Measures intensity across verses (ALL CAPS ratio + syllable density). Range < 0.15 = no emotional arc (-10 points). Peak in Verse 1 = wrong climax placement (-8 points).

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

### 33. Traditional / World Music Genres (14 Genres)

**Date**: July 21, 2026  
**Added**: 14 culturally-specific genres with full backend integration (vocabulary, BPM, structure templates, genre aliases, INSTAGEN tag examples)

**Genres Added**:

| Genre | Culture | Structure | BPM Range |
|-------|---------|-----------|-----------|
| Gagaku | Japanese Imperial Court | Jo-Ha-Kyu (slow acceleration) | 30-60 |
| Min'yo | Japanese Folk | I-V-R-V-R-Outro (refrain, call-and-response) | 70-140 |
| Enka | Japanese Ballad | I-V-C-V-C-Bridge-C-Outro (kobushi vibrato) | 50-80 |
| Korean Traditional | Korean (Sanjo/Pansori) | I-Sanjo-Pansori-Outro (instrumental meditation → narrative) | 40-120 |
| Carnatic | South Indian Classical | Alapana-Kriti-Tanam-Pallavi-Swaras (raga-based) | 60-180 |
| Hindustani | North Indian Classical | Alap-Jor-Jhala-Gat (journey through a raga) | 40-160 |
| Gamelan | Indonesian Orchestral | Cyclic-Colotomic (gong-punctuated cycles) | 50-120 |
| Balinese | Balinese Gamelan | I-Kebyar-Interlocking-Outro (explosive dynamics) | 60-180 |
| Klezmer | Eastern European Jewish | I-V-C-V-C-Break-V-Outro (doina lament break) | 80-180 |
| Mariachi | Mexican Traditional | I-V-C-V-C-Bridge-V-Outro (trumpet fanfare + grito) | 80-160 |
| Tuvan Throat Singing | Tuvan/Inner Asian | Drone-Sygyt-Kargyraa-Outro (overtone singing) | 30-70 |
| Bhangra | Punjabi | I-V-C-V-C-DanceBreak-C-Outro (dhol-driven, energy never drops) | 100-150 |
| Gnawa | Moroccan Trance | Lila-Cyclic-Trance (trance-inducing repetition) | 80-130 |
| Andean | South American Highland | I-V-C-V-C-Instr-C-Outro (mountain folk) | 70-120 |

**Backend Changes**:
1. **`GENRE_VOCABULARY_MODULES`** (line ~43346): Added 14 modules with genre-specific whitelists (cultural instruments, aesthetic terms), blacklists, lineRules, and replacements. Each module is tailored to its cultural tradition — e.g., gagaku whitelists "sho, hichiriki, biwa, gagaku, jo-ha-kyu, ma" while bhangra whitelists "dhol, tumbi, algoza, bhangra, chaal, punjabi."

2. **`GENRE_BPM_RANGES`** (line ~45327): Added 14 entries. Ranges reflect the genre's real-world tempo — gagaku is 30-60 BPM (ceremonial, slow), carnatic spans 60-180 BPM (depends on raga and section), bhangra is 100-150 BPM (high energy dance).

3. **`resolveGenreFromStyles()`** (line ~45270): Added 14 genre alias entries. Each includes common spellings and regional names — e.g., "min'yo" resolves to "minyo", and aliases include "japanese folk", "nihon min'yo", "minyo."

4. **`GENRE_STRUCTURE_TEMPLATES`** (line ~45958): Added 14 templates with cultural structure patterns. These are NOT Western verse-chorus structures — they reflect how each tradition actually organizes music:
   - **Gagaku**: Jo-Ha-Kyu (slow introduction → gradual acceleration → rapid conclusion)
   - **Min'yo**: Intro-Verse-Refrain-Verse-Refrain-Outro (communal call-and-response)
   - **Carnatic**: Alapana-Kriti-Tanam-Pallavi-Swaras (free-tempo exploration → composed piece → rhythmic improvisation → scalar passages)
   - **Hindustani**: Alap-Jor-Jhala-Gat (free-tempo → rhythm enters → fast climax → composed piece)
   - **Gamelan**: Cyclic-Colotomic (gong-punctuated cycles, interlocking kotekan patterns)
   - **Tuvan**: Drone-Sygyt-Kargyraa (fundamental drone → high whistle overtones → deep subharmonics)
   - **Gnawa**: Lila-Cyclic-Trance (ceremony-based, repetition induces trance state)

5. **`buildGenreStructureHint()`** (line ~46593): No changes needed — this function dynamically pulls from `GENRE_STRUCTURE_TEMPLATES` by genre key. The 14 new templates are automatically included.

6. **INSTAGEN Tag Examples** (line ~47175): Added sonic description examples for 12 traditional genres in the INSTAGEN prompt. These provide the LLM with model descriptions of each genre's sonic identity — e.g., gamelan: "Indonesian metallophone orchestra. Bonang (kettle gongs) and gender (metallophones) playing interlocking kotekan patterns creating shimmering polyrhythmic texture."

7. **INSTAGEN Structure Hints** (line ~47217): Added Traditional/World genre note to the STRUCTURE section: "Traditional/World genres (Carnatic, Hindustani, Gamelan, Gagaku, Min'yo, Enka, Korean Traditional, Balinese, Klezmer, Mariachi, Tuvan, Bhangra, Gnawa, Andean): Structure is dictated by CULTURAL TRADITION, not Western pop conventions."

**Frontend Changes**:
1. **`album.html`** GENRE_LIST (line ~210): Added "Traditional / World" genre group with all 14 genres, positioned after "DJ / Turntablism" group.
2. **`index-DscBS4mv.js`**: Added "Traditional / World" genre group to the minified React bundle.

**Design Decisions**:
1. Each genre's vocabulary module is culturally researched — instruments, aesthetic terms, and forbidden words are specific to each tradition (e.g., tuvan bans "synthesizer, electric, digital" while klezmer whitelists "klezmer, klez, freylekhs, doina, hora, bulgar").
2. BPM ranges are based on real-world practice, not Western defaults — gagaku's 30-60 BPM reflects its ceremonial pace; bhangra's 100-150 BPM reflects its dance energy.
3. Structure templates use cultural structure patterns (Jo-Ha-Kyu, raga cycles, cyclic gong structures) rather than forcing Western verse-chorus forms.
4. INSTAGEN tag examples give the LLM specific sonic vocabulary for each genre's production aesthetic.

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
8. **Genre structure templates**: Add all 60+ templates to `GENRE_STRUCTURE_TEMPLATES` (metal×8, reggae×3, kpop, hiphop×7, blues×6, punk×6, folk×5, dj×2, traditional/world×14, plus genre-agnostic fallbacks)
9. **Traditional/world vocabulary modules**: Add 14 modules to `GENRE_VOCABULARY_MODULES` (gagaku, minyo, enka, koreantraditional, carnatic, hindustani, gamelan, balinese, klezmer, mariachi, tuvan, bhangra, gnawa, andean)
10. **Traditional/world BPM ranges**: Add 14 entries to `GENRE_BPM_RANGES`
11. **Traditional/world genre aliases**: Add 14 entries to `resolveGenreFromStyles()`
12. **Metal vocabulary safety**: Remove destructive replacements (sun→moon, light→flame, sky→grave, dark→void, walk→prowl, wet→drenched)
10. **Subject-aware vocabulary lock**: Add `subject` parameter to `enforceVocabularyLock()` and `processLyricsWithGenre()`
11. **Outro enforcement**: Add Step 2b (auto-insertion) to `processLyricsWithGenre()`. Add OUTRO RULE to all 3 prompts. Add outro quality check (#14) to `analyzeLyricsQuality()`.
12. **Dub notation preservation**: Add `PRESERVED_EFFECT_WORDS` Set and modify `stripParentheticalInstructions()` to preserve single-word effects.
13. **Quality analyzer**: Add subject parameter to `analyzeLyricsQuality()`. Add checks #11 (Subject Relevance), #12 (Narrative Coherence), #13 (3-Act Progression), #14 (Outro Check).
14. **Prompts**: Add 3-Act Story Structure, Narrative Coherence, ALL CAPS fix, Grease Spot exception, VARIETY IS SURVIVAL, OUTRO RULE, DJ/Dual DJ tag examples, Traditional/World genre structure hints, and 12 traditional genre tag examples to all prompt locations.
15. **Blend instructions**: Update `buildGenreStructureHint()` to explicitly state primary dictates structure. Add DJ genre blend rule for turntablism + other genres.
16. **Patois optional**: Split Patois override into mandatory (Patois variant selected) and optional (base reggae genre). When a non-English language is selected alongside a Patois variant, enter bilingual code-switching mode instead of forcing 100% Patois.
17. **Line rule processing**: Add `allowScratchEffects` and `allowDuetVocals` to genre hint injection in `/llm` route.

### Frontend (`ui/dist/assets/index-DscBS4mv.js`)

1. Remove the "Vocal / Special" group from the `iy` genre groups array
2. Add `Reggae (Patois)`, `Dub (Patois)`, `Dancehall (Patois)` to the "Reggae / Caribbean" group
3. Add new "DJ / Turntablism" genre group with DJ, Dual DJ, Turntablism, Scratch Battle
4. Add new "Traditional / World" genre group with Gagaku, Min'yo, Enka, Korean Traditional, Carnatic, Hindustani, Gamelan, Balinese, Klezmer, Mariachi, Tuvan Throat Singing, Bhangra, Gnawa, Andean
5. Verify the bundle loads without errors

### Frontend (`ui/dist/index.html`)

1. Add floating album button script before closing `</body>` tag
2. Button links to `/album.html` with gradient purple/pink styling
3. Add floating visualizer button with MutationObserver song detection (gradient cyan)
4. Button auto-detects currently playing song from `<audio>` element src pattern
5. Opens visualizer with `?id=SONGID&title=TITLE` parameters

### Frontend (`ui/dist/album.html`)

1. Create new standalone HTML file with dark theme
2. Implement auto-auth, provider selection, 9-track grid, sequential generation
3. LLM lyrics → ACE-Step audio → poll → results with playback
4. Add "Auto-Fill Album" button with LLM-based concept generation (line-based format output, 5-tier parsing)
5. Add "Shuffle Tracks" button for re-rolling track subjects with existing context
6. Add "Traditional / World" genre group to genre dropdown (14 genres)

### Frontend (`ui/dist/visualizer.html`)

1. Create standalone HTML file (36 KB, self-contained, zero dependencies)
2. Implement client-side beat detection (kick/snare/hihat spectral analysis, EMA onset detection)
3. Implement 10 visualization modes: Bars, Wave, Particles, Circular, Plasma, Tunnel, Starfield, Rings, Liquid, Image+FX
4. Add settings panel: 6 color schemes, sensitivity, smoothing, brightness, BG opacity, mode blending, mirror, glow, scanlines
5. Add playback controls: play/pause, stop, prev/next, seek bar, volume, track info
6. Add playlist panel: auto-loads songs from server, shuffle, repeat, auto-advance
7. Add video generation modal: calls server `/api/inspire/video/generate` with cover art
8. Add MediaRecorder-based video recording (canvas.captureStream + audio)
9. Add keyboard shortcuts (Space, 1-0, F, R, S, L, ESC) and auto-hide UI

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
- **PyrateGFX Productions** — Genre-aware song architecture (60+ structure templates, 14 traditional/world music genres), narrative intelligence (3-Act structure, coherence enforcement), anti-AI slop system, album generator with auto-fill & shuffle, audio-reactive visualizer, MP4 video generator, DJ/Dual DJ genre system, bilingual Patois code-switching, quality analyzer, and all Phase 1-3 enhancements.

### Additional
- **Node.js** runtime — Server-side JavaScript execution
- **ffmpeg** — Video generation and audio processing
- **Various LLM providers** — Gemini, OpenAI, Anthropic, Ollama, LM Studio for lyric generation

### License
The original HOT-Step CPP and ACE-Step are provided under their respective licenses (ACE-Step: MIT). The PGFX Edition enhancements in this report are provided as-is for community use and potential upstream contribution. See individual file headers for specific licensing.

---

*Report generated for upstream contribution. All changes are provided as-is for review and potential integration.*
