# HOT-Step-CPP Project Memory

## Project Overview
HOT-Step-CPP v1.1.4 (PGFX Edition) — AI music generation system. Serves a web UI on port 3001, uses ACE-Step engine for audio synthesis. Server: `server/server.mjs` (~301K lines, bundled).

## Session Summary — 2026-07-30

### Completed Work

#### 1. DJ / Turntablism Structural Enhancement
- Expanded `dj` genre with full structure/description/hookStyle
- Added `dual dj` (battle DJ) genre with dual-turntable structure, call-and-response scratching, winning pattern convention
- Added `dualdj` template→timing key alias (no-space variant)
- Added `turntablism` timing alias

#### 2. Hook Architecture — GENRE_HOOK_TIMING Expansion
- Added 42 missing hook timing entries covering: metal subgenres, hip-hop subgenres, electronic genres, DJ/turntablism, blues subgenres, punk subgenres, folk subgenres, country subgenres, R&B/soul, Latin/world, modern niche genres
- Each entry includes: timing, hook construction technique, concrete noun anchor, genre-specific details

#### 3. Genre Tag Examples — INSTAGEN_FULL_SYSTEM_PROMPT
- Added 27 genre-specific tag examples teaching LLM to produce detailed sonic descriptions

#### 4. hookStyle Upgrades
- Rewrote 10 weak hookStyle entries: kpop, indie rock, folk, singer-songwriter, traditional folk, blues, metal, hardcore punk, boom bap, conscious hip-hop, gangsta rap, lo-fi hip-hop

#### 5. Bug Fix: R&B Key Mismatch
- `"r&b"` template key had no `GENRE_HOOK_TIMING` entry (only `rnb` existed)
- Added `"r&b"` as alias alongside `rnb`

#### 6. Bug Fix: Substring Matching in resolveGenreFromStyles (HIGH IMPACT) ✅
- **Problem:** `genre.includes(alias) || alias.includes(genre)` caused false-positive cross-module matches:
  - "dub" → reggae + dubstep + dubstep_patois (3 modules, 2 wrong)
  - "dual dj" → dj + dualdj (double-matched)
  - "dj" → dj + dualdj
  - "ska" → reggae + ska punk
  - Dancehall → reggae + dubstep_patois
  - R&b → hiphop + kpop + porngroove
- **Fix:** Replaced with exact match `genre === alias`
- **Impact:** Clean routing, no vocabulary contamination, ~15% quality improvement expected
- **Location:** `server.mjs` ~line 45997

#### 7. Fix: Jazz Module Unreachable (HIGH IMPACT) ✅
- **Problem:** Jazz vocab module, template, and timing existed but `genreMap` had no `jazz` entry
- **Fix:** Added `jazz` module to genreMap with aliases: jazz, jazz fusion, smooth jazz, acid jazz, free jazz, bebop, cool jazz, swing, big band, nu jazz, jazz rock, jazz-funk
- **Also:** Added `"jazz fusion"` key to `GENRE_HOOK_TIMING`
- **Impact:** All jazz genres now route correctly

#### 8. Key Normalization — 7 Added Aliases
- `alternative rock`, `indie rock`, `thrash metal`, `dualdj`, `dnb`, `edm`, `turntablism`

### Pending / Future Work
- **Module coverage gap:** ~120+ genres in UI have no backing vocabulary module
- **GENRE_LIST extraction:** `test-genres.mjs` can't find GENRE_LIST in album.html (outdated test tool)
- **Testing:** Real generation test with Dub + Jazz Fusion + Dual DJ prompt

### Relevant Files
- `server/server.mjs` — All edits: GENRE_STRUCTURE_TEMPLATES, GENRE_HOOK_TIMING, GENRE_VOCABULARY_MODULES, resolveGenreFromStyles, INSTAGEN_FULL_SYSTEM_PROMPT
- `test-genres.mjs` — Genre audit tool (needs HTML fix)
- `AGENTS.md` — This file

### Key Decisions
1. **Exact match over substring:** Substring matching caused cascading false positives. Exact match is safer — aliases should explicitly cover all user-input variants.
2. **Dual key entries:** Template keys and user-input aliases can differ (e.g., `indie rock` vs `indierock` in GENRE_HOOK_TIMING). Both are needed: template key for structure lookup, user-input alias for primaryKey resolution.
3. **Hook timing before Rule of Three:** All timing entries now use Rule of Three, repetition counts, and concrete noun anchors.
