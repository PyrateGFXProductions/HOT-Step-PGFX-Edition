# HOT-Step-CPP Project Memory

## Project Overview
HOT-Step-CPP v1.1.4 (PGFX Edition) — AI music generation system. Serves a web UI on port 3001, uses ACE-Step engine for audio synthesis. Server: `server/server.mjs` (~302K lines, bundled).

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

#### 9. UI: Floating Icon Stack Layout (final, user-confirmed "better")
- All 4 floating buttons are 44×44 circles at `right:16px`, stacked with 10px gaps.
- Positions (bottom): ✨ Creativity **250px** (panel 304px) → 🖼️ Cover Art **196px** (panel 250px) → 💿 Album **142px** → ☕ Support **88px** → pill toggle **60px**.
- **bottom:60px is the ESTABLISHED FLOOR** (player controls start below). Pill toggle is FIXED at 60px — no sliding.
- Support (Ko-fi) is an `<a href="https://ko-fi.com/pyrategfxproductions">`; Album is `<a href="/album.html">`.
- User rejected: pill at bottom:8px (overlaps player), sliding pill, side-by-side icons, dynamic Support shifting.

#### 10. UI: Collapsible Pill Tray
- Mechanism: `data-hs-float="1"` on each button + `body.hs-float-collapsed [data-hs-float="1"] { display:none !important; }` CSS class toggle.
- Pill (`#hs-floating-toggle`, 44×18px rounded, ▲ expanded/▼ collapsed, z-index 10001) toggles `hs-float-collapsed` on body; state persists in `localStorage['hs-floating-collapsed']`.
- Second implementation worked (first used per-button `style.display` — abandoned).
- Lines: buttons ~36/1213/1494/1550, toggle script ~1561 in `ui/dist/index.html`.

#### 11. UI: Creativity Slider (0.0–1.0)
- Maps: `temperature` 0.5→1.3, `presence_penalty` 2.5→0.8, `top_p` 0.85→0.98. Default 0.5.
- Main page: floating slider by ✨ button; localStorage key `hs-instagen-creativity`; fetch monkey-patch sends `creativity` in `/api/inspire/llm` body.
- Album Creator: settings slider; key `hs-album-creativity`; `api()` helper sends it.
- Server: `/api/inspire/llm` destructures `creativity` (~line 298071).

#### 12. Bug Fix: Samey Choruses (HIGH IMPACT)
- Added `CHORUS VARIATION (CRITICAL)` rule to `GENERATION_SYSTEM_PROMPT` (~line 47901): keep hook line, vary supporting lines, build intensity across repeated choruses.

#### 13. Bug Fix: Dual [Outro] Sections (HIGH IMPACT) ✅ — ROOT CAUSE FOUND
- **Original bug:** OutroFix only inspected the LAST `[Outro]` section for lyrics → trailing empty `[Outro]` after a valid outro went undetected, or empty outros duplicated.
- **First fix (incomplete):** scan ALL `[Outro]` sections for lyrics + cleanup trailing empty header. STILL BROKEN — see root cause below.
- **ROOT CAUSE (this session):** `hasOutroSection` was tested against the LAST NON-EMPTY LINE. A *valid* outro has lyrics AFTER the header, so the last non-empty line is the lyrics ("Take care friend"), not `[Outro]` → `hasOutroSection` was false → the fix block fired on EVERY song with a proper outro → appended a second empty `[Outro]`. This was the actual source of the user-reported `[Outro]\n\n[Outro]`.
- **Complete fix set (server.mjs `processLyricsWithGenre` Step 2b, ~45718):**
  1. `hasOutroSection` now = `lines.some(l => /^\[Outro/i.test(l.trim()))` — ANY header anywhere, not just last line.
  2. `hasValidOutro` threshold lowered `>=2` → `>=1` lyric line (a 1-line outro is real, not empty).
  3. `lastOutroIsEmpty` threshold `<2` → `<1` (only truly empty trailing outro triggers cleanup).
  4. All cleanup blocks match `[Outro]`, `[Outro: Fade]`, `[Outro - x]` variants via `/^\[Outro(\s*[:\-].*)?\]$/i`.
  5. The "no chorus lines" else-branch now ALSO cleans empty outros before appending the minimal `[Outro]` (previously it just concatenated → guaranteed duplicate).
- **Verified:** 9/9 standalone unit tests pass (valid outro unchanged, valid+trailing cleaned, dual-empty deduped, no-outro appended, variants handled, 1-line outro untouched). `node --check` clean.

### Pending / Future Work
- **Module coverage gap:** ~120+ genres in UI have no backing vocabulary module
- **GENRE_LIST extraction:** `test-genres.mjs` can't find GENRE_LIST in album.html (outdated test tool)
- **Testing:** Real generation test with Dub + Jazz Fusion + Dual DJ prompt
- **OutroFix regression test:** Re-run real generation to confirm no more `[Outro]\n\n[Outro]` in output (user should regenerate after this fix)

### Relevant Files
- `server/server.mjs` — All edits: GENRE_STRUCTURE_TEMPLATES, GENRE_HOOK_TIMING, GENRE_VOCABULARY_MODULES, resolveGenreFromStyles, INSTAGEN_FULL_SYSTEM_PROMPT, OutroFix (Step 2b ~45718), CHORUS VARIATION (~47901), creativity handler (~298071)
- `ui/dist/index.html` — Floating buttons/pill/creativity slider (~28–1600)
- `ui/dist/album.html` — Creativity injection (~391, 640), helpers (~486)
- `README.md` — Ko-fi link (lines 11, 283)
- `test-genres.mjs` — Genre audit tool (needs HTML fix)
- `AGENTS.md` — This file

### Key Decisions
1. **Exact match over substring:** Substring matching caused cascading false positives. Exact match is safer — aliases should explicitly cover all user-input variants.
2. **Dual key entries:** Template keys and user-input aliases can differ (e.g., `indie rock` vs `indierock` in GENRE_HOOK_TIMING). Both are needed: template key for structure lookup, user-input alias for primaryKey resolution.
3. **Hook timing before Rule of Three:** All timing entries now use Rule of Three, repetition counts, and concrete noun anchors.
4. **Outro validity = ≥1 lyric line:** The OutroFix safety net must only fire for TRULY EMPTY outros (0 lines). Threshold `>=1` prevents duplicate `[Outro]` headers on real (even short) outros.
5. **Section header detection scans whole song:** Never gate "does an X section exist" on the last non-empty line — valid sections have content AFTER their header.
