---
name: hot-step-prompt-orchestrator
description: Cross-media prompt orchestration for HOT-Step-CPP music production — one Master Creative Brief drives ACE-Step 1.5 audio, FLUX.2 album art, and LTX 2.3 music video prompts, each written per its vendor prompting guide
compatibility: opencode
metadata:
  app: HOT-Step-CPP
  engines: ace-step-1.5 / flux.2-klein / ltx-2.3
  version: 1
---

## Purpose

HOT-Step-CPP generates a complete music product from one prompt: a song (ACE-Step 1.5), album art (FLUX.2 Klein), and a lyric-driven music video (LTX 2.3 I2V). Each engine is a text-to-anything model with its OWN prompting rules. This skill documents the **Master Creative Brief → per-engine prompt** pipeline so every medium stays on one narrative and follows its vendor guide.

## The One-Sentence Rule

One song = one narrative world. The SAME concept (subject/story) anchors:

1. the ACE-Step **tags** (what the audio conditions on) + **lyrics** (what gets sung),
2. the FLUX.2 **album cover** prompt (subject is the scene, genre is lighting only),
3. the LTX 2.3 **video prompts** (subject-first motion, one dominant event per clip).

Genre must never become the subject. Genre tints lighting, never the story.

## Master Creative Brief

Produce a single JSON brief before writing any engine prompt:

```json
{
  "title": "Won't Turn Any More",
  "genre": "bluegrass / crate digging hybrid",
  "subject": "an old truck that won't start on a cold morning",
  "narrative_theme": "letting go of a thing that carried a life",
  "visual_palette": "warm golden afternoon light, weathered wood, frost on glass",
  "setting": "rural yard, frozen fields",
  "protagonist": "a man in a worn coat, hands frozen"
}
```

Every engine prompt below is DERIVED from this brief — never written fresh per engine.

## 1. ACE-Step 1.5 (Audio) — Caption Is King

Sources: `server.mjs` `INSTAGEN_FULL_SYSTEM_PROMPT` (~122697), `/api/inspire/llm` enhancedUserPrompt (~309466+), `translateParams`.

- **Caption = contract.** The `tags` field is a 150-200+ word natural-language description of the COMPLETE sonic portrait the audio engine conditions on. It is not a genre label list.
- **Metadata is separate.** `bpm`, `key`, `time_signature`, `duration` are metadata, NOT part of the caption. The caption must never say "120 BPM" — the metadata fields say that.
- **Multi-dimension captions:** genre foundation, rhythm/percussion, harmonic/melodic essence, vocal style & delivery, production techniques, spatial character, timbral qualities, unique sonic signature, AND subject/mood encoded in sound (2-4 subject-specific sonic metaphors, e.g. "kick drum hits like a racing pulse").
- **Caption ↔ lyrics consistency:** whatever the tags promise about the vocals, the lyrics must deliver. Whispered tags → hushed short lines; call-and-response tags → echo lines present in the lyrics.
- **Metaphor discipline:** the sonic metaphors in the tags and the imagery in the lyrics come from the SAME emotional world.
- **Syllable discipline:** lyric lines 6-14 syllables (verses), 8-16 (choruses) — singable in one breath.
- **Subject discipline (critical):** songs are ABOUT the subject/story, never about the music. "Find the wax in the holler" is a FAILURE (it sings the style). No meta-production stories (vinyl, crates, DJing, studios) unless the subject literally is a record collector. If no subject given, invent a human story from the genre's mood/setting, and ROTATE settings across songs (never reuse a cliche anchor like "holler").
- **Anti-repetition architecture:** never use fixed noun pools. Constrain by RELATIONSHIP role ("something they are trying to get back to, about to lose, must let go of…") + a dynamic negative space (the user's actual recent songs injected as "do NOT reuse these"). See `buildSubjectGuidance` (~165900).

## 2. FLUX.2 (Album Art & Video Keyframes) — Prose, No Negatives, Subject First

Sources: `buildCoverArtPrompt` (server.mjs ~47840), `buildVideoSegmentPrompt` (~311105), `buildSingerImagePrompt` (prompt-builder.mjs), all mirrored in `server/services/prompt-builder.mjs`.

Per the FLUX.2 prompting guide (docs.bfl.ml):

- **No negative prompt language.** Say what the image IS, not what it is not. Instead of "never a storyboard, comic strip, grid or collage" write "Each image is one full-frame scene standing completely alone, a single continuous composition." Instead of "no text and no lettering anywhere" write "entirely wordless."
- **Word order is priority.** Subject → Action → Style → Context. The subject's noun phrase opens the prompt. Words earlier in the prompt carry more weight — never bury the subject in the middle.
- **30-80 words** is the sweet spot for medium prompts. Prose, complete sentences, no tag spamming, no SD-era token lists ("8k", "highly detailed").
- **Text/typography:** text intended for the cover goes INSIDE explicit quotes and is positioned ("The song title \"Millie's Movie Seat\" is rendered in elegant typography across the top of the cover."). Opt-in via `opts.titleText`; wordless covers stay wordless by default.
- **The scene is the SUBJECT, genre is lighting only:** `The scene is lit with a bluegrass atmosphere: warm golden afternoon light, dusty open air, weathered wood tones.` GENRE_VISUALS values are strictly people/instrument/venue-free light+texture+color (enforced by a harness table sweep) so a "bluegrass" mood can never render "musicians on a porch" over a song about a truck.
- **Concept chain (fallback priority):** explicit subject (`coverArtSubject`/`opts.subject`) → `extractLyricStory(lyrics)` (protagonist/species/setting with ≥2-setting-evidence floor — "Millie, a cow, settles into a velvet movie theater seat") → `extractTitleConcept(title)` (word-boundary match only — "Movie Seat" never matches "sea") → `extractLyricImagery` (best single scoring lyric line) → theme keywords → randomized prose fallback.
- **Single-frame guard:** every keyframe prompt ends with the positive bound sentences (single continuous composition / entirely wordless) — FLUX.2 renders storyboard grids when "story/narrative" language appears; the positive bound suppresses it (ComfyUI ignores the negative-prompt slot on this stack).

## 3. LTX 2.3 (Music Video Clips) — Motion-First, 4-Part Structure

Sources: `buildVideoMotionPrompt` (prompt-builder.mjs), `/comfyui/video-plan` route (server.mjs ~311890) returns per-segment `prompt` (FLUX keyframe) AND `motionPrompt` (LTX motion), `/comfyui/generate-video` (~311720) auto-converts still-image prompts.

Per the LTX 2.3 prompting guide:

- **The video prompt is NOT a still-image prompt with "subtle motion" bolted on.** A video prompt leads with the SUBJECT, then a DOMINANT NATURAL MOTION EVENT, then STYLE/LIGHTING, then explicit CAMERA INTENT — a flowing paragraph of 4-8 sentences.
- **4-part formula:** [Subject/Scene] → [Action/Motion] → [Style/Lighting] → [Camera shot/movement].
- **Verbs, not style words.** "the subject moves with quiet intent: a slow turn of the head, fingers tracing the air" not "cinematic, beautiful, slow subtle movement".
- **One dominant event.** One natural motion per clip (light drifting, hair catching light, a step forward). No multi-subject chaos, no text/logos, no complex physics, no internal emotional states described as facts (show physical behavior instead).
- **Camera intent is explicit and section-aware** (`VIDEO_CAMERA_INTENT`):
  - intro → slow push-in from wide establishing frame
  - verse → slow push-in, intimate close framing
  - prechorus → medium dolly-in as energy rises
  - chorus → slow dolly-in with slight orbit, light sweeping past the lens
  - post-chorus → gentle pull-back into warm afterglow
  - bridge → slow lateral tracking shot
  - interlude → slow drift, floating camera
  - outro → long slow pull-back, subject receding
  - instrumental → slow steady pan
- **Section-aware action** (`VIDEO_ACTION_INTENT`): verse = quiet intent, prechorus = building (a step, fabric stirring), chorus = full energy (arms rise, hair catches light), bridge = contemplative, outro = receding.
- **Segment lyric lines drive the moment:** `In this moment: Standing on the cliff edge; the salt wind tastes like old mistakes.` — the clip visualizes the lines being sung.
- **Never pass a FLUX.2 still-image prompt to LTX.** The `generate-video` route detects the still-image markers ("Each image is one full-frame scene…", "no text and no lettering…") and rebuilds the prompt as a motion prompt; the video-plan route pre-builds `motionPrompt` per segment so the client sends the right one.

## Orchestration Pipeline (end-to-end)

```
User prompt (subject, genres, caption)
        │
        ▼
┌─────────────────────┐
│  MASTER BRIEF       │  buildSongConcept (subject/lyric-story/title chain)
│  (one narrative)    │  + buildSubjectGuidance (role + recent-song negative space)
└─────────────────────┘
        │  same concept object flows to all three
        ├─────────────────────────────────────────────────────────────┐
        ▼                                                             ▼
┌─────────────────────┐                                  ┌─────────────────────┐
│  ACE-STEP 1.5       │                                  │  FLUX.2 / LTX 2.3   │
│  tags (sonic world) │                                  │  video-plan route   │
│  lyrics (the story) │                                  │  per SEGMENT:       │
│  metadata (bpm/key) │                                  │   prompt (FLUX)     │
└─────────────────────┘                                  │   motionPrompt (LTX)│
                                                         └─────────────────────┘
        │
        ▼
  song audio (engine)      →  album cover (FLUX.2 prose keyframe)
                          →  video segment keyframes (FLUX.2, 2-line lyric segments)
                          →  LTX 2.3 I2V clips (motion prompt + sliced audio, ~4-8s)
                          →  NLE assembly (ffmpeg, per-segment timings)
```

Consistency guarantees:
- `buildSongConcept` is computed ONCE per song and passed as `concept:` to every cover AND every segment prompt.
- The same subject nouns, setting, and palette words appear in tags, cover, and video prompts.
- Per-segment variation comes ONLY from the segment's own lyric lines + section arc — never from a different narrative.

## Regression Tests

- `server\_videoseg-test.cjs` — segment split/timings + FLUX keyframe prompt + LTX motion prompt (62 cases). Run from `server\`: `..\runtime\node.exe _videoseg-test.cjs`.
- `server\_bpmcover-test.cjs` — cover-prompt concept chain, GENRE_VISUALS lighting-only table sweep, prompt hygiene (155+ cases).
- `server\_dirstrip-test.cjs` — bracketed-direction sanitizer (53 cases).
- Harness constraint: extracted functions must contain ZERO literal apostrophes (use `\u0027` in regexes; no possessives in comments).

## Gotchas / Lessons Learned

1. **Substring matching is a bug factory.** "Movie Seat" matched "sea" → ocean covers. Use word-boundary regex everywhere (`(^|[^a-z0-9&+#])`).
2. **Genre = lighting, never scene.** A genre mood sentence that names people/instruments re-renders as a competing scene. The table sweep test enforces this forever.
3. **Never reuse a cliche anchor.** Concrete-noun anchor lists in prompts become vocabulary teachers (every bluegrass song about "the holler"). Write VARY + avoid-the-worn-out rules instead.
4. **Negative prose was the only carrier on ComfyUI** (negative slot ignored) — so when FLUX.2 guide says "no negatives," translate the bound into positive prose ("entirely wordless", "single continuous composition") rather than deleting it.
5. **The FLUX.2 keyframe prompt and the LTX motion prompt are DIFFERENT artifacts** — the client used to send the FLUX prompt as the video prompt. Always generate both from the brief; never reuse one for the other.
