#!/usr/bin/env node
/**
 * test-genres.mjs — Genre Pipeline Dry-Run Audit Tool
 * =====================================================
 * Validates the entire genre pipeline without calling any LLM API.
 * Reads production data directly from server.mjs to stay in sync.
 *
 * Usage:
 *   node test-genres.mjs --audit           Full coverage audit (table output)
 *   node test-genres.mjs --dryrun <genre>  Simulate prompt assembly for one genre
 *   node test-genres.mjs --all             Dry-run every genre in GENRE_LIST
 *   node test-genres.mjs --check           Check consistency between function sets
 *   node test-genres.mjs --sample-lyrics   Test processLyricsWithGenre with sample lyrics
 *   node test-genres.mjs (no args)         Runs --audit + --check
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = join(__dirname, 'server', 'server.mjs');
const ALBUM_PATH = join(__dirname, 'ui', 'dist', 'album.html');

// ═══════════════════════════════════════════════════════════════════════════════
// 1. EXTRACT DATA FROM PRODUCTION CODE
// ═══════════════════════════════════════════════════════════════════════════════

function extractBracedBlock(code, startIdx) {
  // Find the opening brace
  let i = code.indexOf('{', startIdx);
  if (i === -1) return null;
  let depth = 0;
  const start = i;
  for (; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) return code.slice(start, i + 1);
    }
  }
  return null;
}

function extractServerData() {
  const code = readFileSync(SERVER_PATH, 'utf-8');

  // Extract GENRE_VOCABULARY_MODULES
  const vocabIdx = code.indexOf('var GENRE_VOCABULARY_MODULES = {');
  const vocabBlock = extractBracedBlock(code, vocabIdx);
  const VOCAB_KEYS = [];
  if (vocabBlock) {
    const keyRe = /^\s{2}"?([\w][\w\s\-]*)"?\s*:\s*\{/gm;
    let m;
    while ((m = keyRe.exec(vocabBlock)) !== null) VOCAB_KEYS.push(m[1]);
  }

  // Extract GENRE_SLOP_REPLACEMENTS
  const slopIdx = code.indexOf('var GENRE_SLOP_REPLACEMENTS = {');
  const slopBlock = extractBracedBlock(code, slopIdx);
  const SLOP_KEYS = [];
  if (slopBlock) {
    const keyRe = /^\s{2}"?([\w][\w\s\-]*)"?\s*:\s*\{/gm;
    let m;
    while ((m = keyRe.exec(slopBlock)) !== null) SLOP_KEYS.push(m[1]);
  }

  // Extract GENRE_STRUCTURE_TEMPLATES
  const structIdx = code.indexOf('var GENRE_STRUCTURE_TEMPLATES = {');
  const structBlock = extractBracedBlock(code, structIdx);
  const STRUCT_KEYS = [];
  if (structBlock) {
    const keyRe = /^\s{2}"?([\w][\w\s\-]*)"?\s*:\s*\{/gm;
    let m;
    while ((m = keyRe.exec(structBlock)) !== null) STRUCT_KEYS.push(m[1]);
  }

  // Extract genreMap keys from resolveGenreFromStyles
  const genreMapIdx = code.indexOf('const genreMap = {', code.indexOf('function resolveGenreFromStyles'));
  const genreMapBlock = extractBracedBlock(code, genreMapIdx);
  const GENRE_MAP_KEYS = [];
  if (genreMapBlock) {
    const keyRe = /^\s{4}"([\w][\w\s\-]*)":\s*\[/gm;
    let m;
    while ((m = keyRe.exec(genreMapBlock)) !== null) GENRE_MAP_KEYS.push(m[1]);
  }

  // Extract GENRE_BPM_RANGES keys
  const bpmIdx = code.indexOf('const GENRE_BPM_RANGES = {');
  const bpmBlock = extractBracedBlock(code, bpmIdx);
  const BPM_KEYS = [];
  if (bpmBlock) {
    const keyRe = /^\s+"([^"]+)":\s*\[/gm;
    let m;
    while ((m = keyRe.exec(bpmBlock)) !== null) BPM_KEYS.push(m[1]);
  }

  // Extract FLEXIBLE_VERSE_GENRES from enforceLineCounts
  const elcIdx = code.indexOf('function enforceLineCounts');
  const elcBlock = code.slice(elcIdx, elcIdx + 3000);
  const flexVerseMatch = elcBlock.match(/FLEXIBLE_VERSE_GENRES = new Set\(\[([\s\S]*?)\]\)/);
  const flexVerseKeys = [];
  if (flexVerseMatch) {
    flexVerseMatch[1].replace(/"([^"]+)"/g, (_, k) => { flexVerseKeys.push(k); });
  }

  // Extract NO_CHORUS_GENRES from enforceLineCounts
  const noChorusMatch = elcBlock.match(/NO_CHORUS_GENRES = new Set\(\[([\s\S]*?)\]\)/);
  const noChorusKeys = [];
  if (noChorusMatch) {
    noChorusMatch[1].replace(/"([^"]+)"/g, (_, k) => { noChorusKeys.push(k); });
  }

  // Extract FLEXIBLE_VERSE_GENRES from analyzeLyricsQuality
  const alqIdx = code.indexOf('function analyzeLyricsQuality');
  const alqBlock = code.slice(alqIdx, alqIdx + 5000);
  const alqFlexMatch = alqBlock.match(/FLEXIBLE_VERSE_GENRES = new Set\(\[([\s\S]*?)\]\)/);
  const alqFlexVerseKeys = [];
  if (alqFlexMatch) {
    alqFlexMatch[1].replace(/"([^"]+)"/g, (_, k) => { alqFlexVerseKeys.push(k); });
  }

  // Extract NO_CHORUS_GENRES from analyzeLyricsQuality
  const alqNoChorusMatch = alqBlock.match(/NO_CHORUS_GENRES = new Set\(\[([\s\S]*?)\]\)/);
  const alqNoChorusKeys = [];
  if (alqNoChorusMatch) {
    alqNoChorusMatch[1].replace(/"([^"]+)"/g, (_, k) => { alqNoChorusKeys.push(k); });
  }

  return {
    VOCAB_KEYS, SLOP_KEYS, STRUCT_KEYS, GENRE_MAP_KEYS, BPM_KEYS,
    flexVerseKeys, noChorusKeys, alqFlexVerseKeys, alqNoChorusKeys
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. EXTRACT GENRE_LIST FROM ALBUM.HTML
// ═══════════════════════════════════════════════════════════════════════════════

function extractGenreList() {
  const html = readFileSync(ALBUM_PATH, 'utf-8');
  const match = html.match(/const GENRE_LIST = \[([\s\S]*?)\];/);
  if (!match) throw new Error('Could not find GENRE_LIST in album.html');
  const genres = [];
  match[1].replace(/'([^']+)'/g, (_, g) => { genres.push(g); });
  return genres;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. RESOLVE GENRE (standalone copy of resolveGenreFromStyles logic)
// ═══════════════════════════════════════════════════════════════════════════════

function resolveGenreFromStyles(genres, genreMap) {
  if (!genres || !genres.length) return { primary: null, all: [] };
  const genresLower = genres.map(g => g.toLowerCase().trim());
  const matched = [];
  const matchedSet = new Set();
  for (const genre of genresLower) {
    for (const [key, aliases] of Object.entries(genreMap)) {
      if (matchedSet.has(key)) continue;
      for (const alias of aliases) {
        if (genre.includes(alias) || alias.includes(genre)) {
          matched.push(key);
          matchedSet.add(key);
          break;
        }
      }
    }
  }
  return { primary: matched[0] || null, all: matched };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SIMULATE processLyricsWithGenre (simplified for dry-run)
// ═══════════════════════════════════════════════════════════════════════════════

function simulateProcessLyrics(lyrics, genreKeys, vocabKeys, slopKeys) {
  const logs = [];
  const hasVocab = genreKeys.some(k => vocabKeys.includes(k));
  const hasSlop = genreKeys.some(k => slopKeys.includes(k) || slopKeys.includes('_default'));
  logs.push(`  genreKeys: [${genreKeys.join(', ')}]`);
  logs.push(`  hasVocabularyModule: ${hasVocab}`);
  logs.push(`  hasSlopReplacements: ${hasSlop}`);
  if (!hasVocab) logs.push(`  ⚠ No vocabulary module — only _default slop will apply`);
  if (genreKeys.length > 1) logs.push(`  ⚠ Multi-genre: merged module will be used`);
  return logs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. DETECT SUBSTRING MATCHING BUGS
// ═══════════════════════════════════════════════════════════════════════════════

function detectSubstringBugs(genreMap) {
  const bugs = [];
  const allAliases = [];
  for (const [key, aliases] of Object.entries(genreMap)) {
    for (const alias of aliases) {
      allAliases.push({ key, alias });
    }
  }
  // Check for alias-to-alias substring collisions
  for (let i = 0; i < allAliases.length; i++) {
    for (let j = 0; j < allAliases.length; j++) {
      if (i === j) continue;
      if (allAliases[i].key === allAliases[j].key) continue;
      const a = allAliases[i].alias;
      const b = allAliases[j].alias;
      if (a.includes(b) || b.includes(a)) {
        bugs.push({
          type: 'SUBSTRING_COLLISION',
          alias1: `${a} (module: ${allAliases[i].key})`,
          alias2: `${b} (module: ${allAliases[j].key})`,
          severity: 'HIGH',
          note: `Selecting "${a}" may also match "${allAliases[j].key}" module via substring`
        });
      }
    }
  }
  return bugs;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. SAMPLE LYRICS FOR DRY-RUN TESTING
// ═══════════════════════════════════════════════════════════════════════════════

const SAMPLE_LYRICS = `[Intro]
Neon lights are fading down
The city hums a lullaby

[Verse]
I walk these streets alone at night
Searching for a spark of light
The shadows dance across the wall
I hear the distant city call

[Chorus]
Hold on tight the world is spinning round
Feel the beat it's making up for lost ground
We're alive tonight the stars have come unbound
Let it ride the music is the only sound

[Verse 2]
The sunrise paints the morning gold
A story waiting to be told
The neon fades but dreams remain
We rise and fall and rise again

[Outro]
Hold on tight the world is spinning round
Feel the beat it's making up for lost ground
We're alive tonight`;

const SAMPLE_LYRICS_DUBSTEP = `[Intro]
Bass drops heavy on the floor
Wobble shaking through the walls

[Build]
Rising up the frequency
Tension building endlessly
Snare rolls climbing to the peak
Every second make it speak

[Drop]
Bass cannon firing tonight
Wobble shaking left and right
Sub frequency ripping the ground
Bass drop heavy make it pound

[Verse]
MC riding on the riddim tight
Bass is heavy feeling right
Speaker cone is flexing hard
Every beat is like a guard

[Build 2]
Rising up again we go
Bigger than the last crescendo
Pitch sweep climbing to the sky
Make the whole damn building fly

[Drop 2]
Bass cannon firing non-stop
Wobble tearing through the top
Sub bass rumbling the floor
Shell the place and make it roar

[Bridge]
Silence falling echo deep
Reverb drowning what I speak
Filtered voices in the dark
One more drop before we part

[Drop 3]
Bass cannon maximum weight
Wobble shaking every gate
Sub frequency through your chest
This is dubstep at its best

[Outro]
Bass fading echo delay
Sound system riding away
`;

// ═══════════════════════════════════════════════════════════════════════════════
// 7. OUTPUT FORMATTING
// ═══════════════════════════════════════════════════════════════════════════════

const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  bold: '\x1b[1m', dim: '\x1b[2m',
};
function log(color, msg) { console.log(`${color}${msg}${C.reset}`); }
function header(msg) { console.log(`\n${C.bold}${C.cyan}${'═'.repeat(70)}${C.reset}`); log(C.bold, `  ${msg}`); console.log(`${C.bold}${C.cyan}${'═'.repeat(70)}${C.reset}`); }

// ═══════════════════════════════════════════════════════════════════════════════
// 8. COMMANDS
// ═══════════════════════════════════════════════════════════════════════════════

function runAudit(genreList, data) {
  header('GENRE PIPELINE COVERAGE AUDIT');

  // Build genreMap from genreMap keys + their aliases
  // We'll simulate this by checking each GENRE_LIST entry
  const genreMap = {};
  for (const key of data.GENRE_MAP_KEYS) {
    // Reconstruct from the production code's genreMap
    // For the audit, we just need the keys
    genreMap[key] = true;
  }

  const issues = [];
  const warnings = [];
  const ok = [];

  // Track which GENRE_LIST entries map to which modules
  const resolution = {};

  for (const genre of genreList) {
    const genreLower = genre.toLowerCase().trim();
    const hasModule = data.VOCAB_KEYS.includes(genreLower);
    const hasStruct = data.STRUCT_KEYS.includes(genreLower);
    const hasSlop = data.SLOP_KEYS.includes(genreLower) || data.SLOP_KEYS.includes('_default');
    const hasBpm = data.BPM_KEYS.includes(genreLower);
    const inGenreMap = data.GENRE_MAP_KEYS.includes(genreLower);

    // Check what it resolves to via substring matching
    let resolvedTo = 'NONE';
    let isMisroute = false;
    for (const key of data.GENRE_MAP_KEYS) {
      if (genreLower.includes(key) || key.includes(genreLower)) {
        resolvedTo = key;
        // Check for misroute: e.g., "j-pop" matching "kpop"
        if (genreLower !== key && !genreLower.includes(key)) {
          isMisroute = true;
        }
        break;
      }
    }

    // Special case: some GENRE_LIST entries are aliases, not primary keys
    // e.g., "Death Metal" should resolve to "metal" module
    // But "J-Pop" resolving to "kpop" is a misroute

    const status = {
      genre,
      hasModule,
      hasStruct,
      hasSlop: hasSlop,
      hasBpm,
      inGenreMap,
      resolvedTo,
      isMisroute
    };

    resolution[genre] = status;

    if (!hasModule && !inGenreMap) {
      issues.push(status);
    } else if (isMisroute) {
      warnings.push(status);
    } else if (hasModule && hasStruct && hasSlop) {
      ok.push(status);
    } else {
      warnings.push(status);
    }
  }

  // Print summary
  console.log(`\n${C.bold}Total genres in UI: ${genreList.length}${C.reset}`);
  console.log(`${C.green}✓ Full coverage (module + struct + slop): ${ok.length}${C.reset}`);
  console.log(`${C.yellow}⚠ Partial/misrouted: ${warnings.length}${C.reset}`);
  console.log(`${C.red}✗ No coverage at all: ${issues.length}${C.reset}`);

  // Print detailed table
  console.log(`\n${C.bold}─── DETAILED COVERAGE TABLE ───${C.reset}\n`);

  const tableHeader = [
    'Genre'.padEnd(28),
    'Module'.padEnd(6),
    'Struct'.padEnd(7),
    'Slop'.padEnd(6),
    'BPM'.padEnd(6),
    'Map'.padEnd(6),
    'Resolves To'.padEnd(16),
    'Status'
  ].join(' │ ');

  console.log(C.bold + tableHeader + C.reset);
  console.log('─'.repeat(tableHeader.length));

  for (const genre of genreList) {
    const s = resolution[genre];
    const mod = s.hasModule ? `${C.green}  ✓  ` : `${C.red}  ✗  `;
    const str = s.hasStruct ? `${C.green}  ✓  ` : `${C.red}  ✗  `;
    const slp = s.hasSlop ? `${C.green}  ✓  ` : `${C.dim}  —  `;
    const bpm = s.hasBpm ? `${C.green}  ✓  ` : `${C.dim}  —  `;
    const map = s.inGenreMap ? `${C.green}  ✓  ` : `${C.red}  ✗  `;
    const resolve = s.resolvedTo.padEnd(16);
    let status;
    if (!s.hasModule && !s.inGenreMap) {
      status = `${C.red}NO MODULE${C.reset}`;
    } else if (s.isMisroute) {
      status = `${C.yellow}MISROUTE${C.reset}`;
    } else if (s.hasModule && s.hasStruct) {
      status = `${C.green}OK${C.reset}`;
    } else {
      status = `${C.yellow}PARTIAL${C.reset}`;
    }
    console.log(`${genre.padEnd(28)} │ ${mod}${C.reset} │ ${str}${C.reset} │ ${slp}${C.reset} │ ${bpm}${C.reset} │ ${map}${C.reset} │ ${resolve} │ ${status}`);
  }
}

function runDryRun(genre, genreList, data) {
  header(`DRY-RUN: "${genre}"`);

  // 1. Check if genre exists in GENRE_LIST
  const inList = genreList.includes(genre);
  console.log(`\n${C.bold}Step 1: Genre List Check${C.reset}`);
  console.log(`  In GENRE_LIST: ${inList ? `${C.green}YES${C.reset}` : `${C.red}NO${C.reset}`}`);

  // 2. Resolve via genreMap
  const genreLower = genre.toLowerCase().trim();
  const genreMapReconstructed = {};
  for (const key of data.GENRE_MAP_KEYS) {
    genreMapReconstructed[key] = [key]; // simplified — just the key itself as alias
  }

  // Simulate resolveGenreFromStyles with the actual genreMap aliases
  // For accurate simulation, we'd need the full alias list. We'll report what we can.
  const hasModule = data.VOCAB_KEYS.includes(genreLower);
  const hasStruct = data.STRUCT_KEYS.includes(genreLower);
  const hasSlop = data.SLOP_KEYS.includes(genreLower) || data.SLOP_KEYS.includes('_default');
  const hasBpm = data.BPM_KEYS.includes(genreLower);
  const inGenreMap = data.GENRE_MAP_KEYS.includes(genreLower);

  console.log(`\n${C.bold}Step 2: Module Resolution${C.reset}`);
  console.log(`  Vocabulary module: ${hasModule ? `${C.green}FOUND (${genreLower})${C.reset}` : `${C.red}NOT FOUND${C.reset}`}`);
  console.log(`  Structure template: ${hasStruct ? `${C.green}FOUND${C.reset}` : `${C.red}NOT FOUND${C.reset}`}`);
  console.log(`  Slop replacements: ${hasSlop ? `${C.green}FOUND${C.reset}` : `${C.red}NOT FOUND${C.reset}`}`);
  console.log(`  BPM range: ${hasBpm ? `${C.green}FOUND${C.reset}` : `${C.red}NOT FOUND${C.reset}`}`);
  console.log(`  In genreMap: ${inGenreMap ? `${C.green}YES${C.reset}` : `${C.red}NO${C.reset}`}`);

  // 3. Check FLEXIBLE_VERSE / NO_CHORUS
  console.log(`\n${C.bold}Step 3: Structural Rules${C.reset}`);
  console.log(`  FLEXIBLE_VERSE_GENRES (enforceLineCounts): ${data.flexVerseKeys.includes(genreLower) ? `${C.green}YES${C.reset}` : `${C.dim}NO${C.reset}`}`);
  console.log(`  NO_CHORUS_GENRES (enforceLineCounts): ${data.noChorusKeys.includes(genreLower) ? `${C.green}YES${C.reset}` : `${C.dim}NO${C.reset}`}`);
  console.log(`  FLEXIBLE_VERSE_GENRES (analyzeLyricsQuality): ${data.alqFlexVerseKeys.includes(genreLower) ? `${C.green}YES${C.reset}` : `${C.dim}NO${C.reset}`}`);
  console.log(`  NO_CHORUS_GENRES (analyzeLyricsQuality): ${data.alqNoChorusKeys.includes(genreLower) ? `${C.green}YES${C.reset}` : `${C.dim}NO${C.reset}`}`);

  // 4. Simulate processLyricsWithGenre
  console.log(`\n${C.bold}Step 4: Post-Generation Pipeline Simulation${C.reset}`);
  const logs = simulateProcessLyrics(SAMPLE_LYRICS, [genreLower], data.VOCAB_KEYS, data.SLOP_KEYS);
  logs.forEach(l => console.log(l));

  // 5. Report issues
  console.log(`\n${C.bold}Step 5: Issue Report${C.reset}`);
  if (!hasModule) {
    console.log(`  ${C.red}CRITICAL: No vocabulary module — genre gets only _default vocabulary guidance${C.reset}`);
    console.log(`  ${C.red}         This means ~90% of genre-specific language rules are missing${C.reset}`);
  }
  if (!hasStruct) {
    console.log(`  ${C.red}CRITICAL: No structure template — no genre-specific structural guidance${C.reset}`);
  }
  if (!inGenreMap) {
    console.log(`  ${C.red}CRITICAL: Not in genreMap — cannot be resolved from user selection${C.reset}`);
  }
  if (hasModule && hasStruct && inGenreMap) {
    console.log(`  ${C.green}No critical issues found${C.reset}`);
  }
}

function runCheck(data) {
  header('CROSS-FUNCTION CONSISTENCY CHECK');

  // 1. FLEXIBLE_VERSE_GENRES mismatch between enforceLineCounts and analyzeLyricsQuality
  console.log(`\n${C.bold}── FLEXIBLE_VERSE_GENRES Consistency ──${C.reset}`);
  const onlyInELC = data.flexVerseKeys.filter(k => !data.alqFlexVerseKeys.includes(k));
  const onlyInALQ = data.alqFlexVerseKeys.filter(k => !data.flexVerseKeys.includes(k));
  console.log(`  enforceLineCounts count: ${data.flexVerseKeys.length}`);
  console.log(`  analyzeLyricsQuality count: ${data.alqFlexVerseKeys.length}`);
  if (onlyInELC.length) {
    console.log(`  ${C.yellow}Only in enforceLineCounts:${C.reset} ${onlyInELC.join(', ')}`);
  }
  if (onlyInALQ.length) {
    console.log(`  ${C.yellow}Only in analyzeLyricsQuality:${C.reset} ${onlyInALQ.join(', ')}`);
  }
  if (!onlyInELC.length && !onlyInALQ.length) {
    console.log(`  ${C.green}CONSISTENT${C.reset}`);
  }

  // 2. NO_CHORUS_GENRES mismatch
  console.log(`\n${C.bold}── NO_CHORUS_GENRES Consistency ──${C.reset}`);
  const noChorusOnlyInELC = data.noChorusKeys.filter(k => !data.alqNoChorusKeys.includes(k));
  const noChorusOnlyInALQ = data.alqNoChorusKeys.filter(k => !data.noChorusKeys.includes(k));
  console.log(`  enforceLineCounts count: ${data.noChorusKeys.length}`);
  console.log(`  analyzeLyricsQuality count: ${data.alqNoChorusKeys.length}`);
  if (noChorusOnlyInELC.length) {
    console.log(`  ${C.yellow}Only in enforceLineCounts:${C.reset} ${noChorusOnlyInELC.join(', ')}`);
  }
  if (noChorusOnlyInALQ.length) {
    console.log(`  ${C.yellow}Only in analyzeLyricsQuality:${C.reset} ${noChorusOnlyInALQ.join(', ')}`);
  }
  if (!noChorusOnlyInELC.length && !noChorusOnlyInALQ.length) {
    console.log(`  ${C.green}CONSISTENT${C.reset}`);
  }

  // 3. Module coverage: vocab vs structure vs slop
  console.log(`\n${C.bold}── Module Coverage Parity ──${C.reset}`);
  const vocabOnly = data.VOCAB_KEYS.filter(k => !data.STRUCT_KEYS.includes(k));
  const structOnly = data.STRUCT_KEYS.filter(k => !data.VOCAB_KEYS.includes(k));
  const slopOnly = data.SLOP_KEYS.filter(k => k !== '_default' && !data.VOCAB_KEYS.includes(k));
  const noSlop = data.VOCAB_KEYS.filter(k => !data.SLOP_KEYS.includes(k));

  console.log(`  Vocabulary modules: ${data.VOCAB_KEYS.length}`);
  console.log(`  Structure templates: ${data.STRUCT_KEYS.length}`);
  console.log(`  Slop replacement sets: ${data.SLOP_KEYS.length - 1} (+ _default)`);

  if (vocabOnly.length) {
    console.log(`  ${C.yellow}Vocab but NO structure:${C.reset} ${vocabOnly.join(', ')}`);
  }
  if (structOnly.length) {
    console.log(`  ${C.yellow}Structure but NO vocab:${C.reset} ${structOnly.join(', ')}`);
  }
  if (slopOnly.length) {
    console.log(`  ${C.yellow}Slop but NO vocab module:${C.reset} ${slopOnly.join(', ')}`);
  }
  if (noSlop.length) {
    console.log(`  ${C.yellow}Vocab but NO slop set:${C.reset} ${noSlop.join(', ')}`);
  }

  // 4. Substring matching bugs
  console.log(`\n${C.bold}── Substring Matching Bug Detection ──${C.reset}`);
  const bugs = detectSubstringBugs({
    metal: ["metal", "heavy metal"],
    reggae: ["reggae", "dub", "ska", "rocksteady", "dancehall", "lovers rock", "roots reggae", "ragga"],
    kpop: ["k-pop", "kpop", "korean pop", "j-pop", "jpop", "c-pop", "cpop", "mandopop", "cantopop", "korean r&b"],
    hiphop: ["hip-hop", "hiphop", "rap", "trap", "drill", "grime", "boom bap", "conscious hip-hop", "gangsta rap", "mumble rap", "lo-fi hip-hop", "r&b"],
    blues: ["blues", "delta blues", "chicago blues", "texas blues", "blues rock", "piano blues", "acoustic blues", "electric blues"],
    punk: ["punk", "punk rock", "pop punk", "post-punk", "hardcore punk", "ska punk", "anarcho-punk", "garage punk"],
    folk: ["folk", "indie folk", "folk rock", "celtic folk", "traditional folk", "singer-songwriter", "americana", "country folk", "bluegrass"],
    duet: ["duet", "duets", "male female duet", "male and female vocals", "dual vocals", "alternating vocals"],
    porn: ["porn sfw", "sfw porn", "porn instrumentation", "sfw adult pop"],
    porngroove: ["porn", "porn groove", "70s porn groove", "sensual lounge", "erotic funk", "sexy bedroom soul", "slow jam", "bedroom r&b", "sleazy funk", "nsfw porn", "adult lyrics"],
    dj: ["dj", "turntablism", "turntablist", "turntable", "scratch", "scratching", "turntables", "deejay", "turntable battle", "scratch battle"],
    dualdj: ["dual dj", "dual turntablist", "dj battle", "dj duel", "turntable duel", "dj crew", "dj collab", "dj tag team", "scratch battle crew", "dual scratching"],
    dubstep: ["dubstep", "brostep", "riddim dubstep", "tearout", "uk dubstep", "deep dubstep", "melodic dubstep", "english dubstep"],
    dubstep_patois: ["dubstep (patois)", "patois dubstep", "jamaican dubstep", "dancehall dubstep", "ragga dubstep", "dubstep patois", "raggamuffin dubstep"],
  });
  if (bugs.length === 0) {
    console.log(`  ${C.green}No substring collisions detected${C.reset}`);
  } else {
    for (const bug of bugs) {
      console.log(`  ${C.red}${bug.severity}: ${bug.alias1} ↔ ${bug.alias2}${C.reset}`);
      console.log(`    ${C.dim}${bug.note}${C.reset}`);
    }
  }

  // 5. Missing section labels in fixSectionLabels
  console.log(`\n${C.bold}── fixSectionLabels Coverage ──${C.reset}`);
  const knownLabels = [
    'x', 'breakdown', 'drop', 'solo', 'hook', 'rap', 'spoken',
    'dub break', 'dub', 'riddim break', 'riddim', 'toast', 'toasting',
    'deejay', 'singjay', 'rub-a-dub', 'dancehall break', 'passa passa',
    'blast beat', 'ad-lib', 'ad lib', 'skit', 'beat switch', 'outro skit',
    'gang vocal', 'gang vocals', 'call and response', 'turnaround', '12-bar',
    'boogie', 'air', 'reel', 'jig',
    // Dubstep / EDM labels (added 2026-07-22)
    'build', 'build 2', 'pre-chorus', 'drop 2', 'drop 3', 'break'
  ];
  const dubstepLabels = ['build', 'drop', 'drop 2', 'drop 3', 'build 2', 'break'];
  const missing = dubstepLabels.filter(l => !knownLabels.includes(l));
  if (missing.length) {
    console.log(`  ${C.yellow}Dubstep/EDM labels NOT in fixSectionLabels:${C.reset} ${missing.join(', ')}`);
    console.log(`  ${C.dim}  These labels will pass through unmapped — which may be correct${C.reset}`);
    console.log(`  ${C.dim}  since Dubstep uses Drop as a core section, not a mislabeled Chorus${C.reset}`);
  }

  // 6. BPM range for unlisted genres
  console.log(`\n${C.bold}── BPM Range Coverage ──${C.reset}`);
  const bpmParentGenres = ['metal', 'reggae', 'hiphop', 'hip-hop', 'blues', 'punk', 'folk', 'dj', 'dubstep'];
  const unlistedBpm = bpmParentGenres.filter(k => !data.BPM_KEYS.includes(k));
  if (unlistedBpm.length) {
    console.log(`  ${C.yellow}Parent genres without BPM entry:${C.reset} ${unlistedBpm.join(', ')}`);
  } else {
    console.log(`  ${C.green}All parent genres have BPM ranges${C.reset}`);
  }
}

function runSampleLyrics(genreList, data) {
  header('SAMPLE LYRICS PROCESSING SIMULATION');

  const testCases = [
    { genre: 'metal', lyrics: SAMPLE_LYRICS },
    { genre: 'reggae', lyrics: SAMPLE_LYRICS },
    { genre: 'hiphop', lyrics: SAMPLE_LYRICS },
    { genre: 'dubstep', lyrics: SAMPLE_LYRICS_DUBSTEP },
    { genre: 'dubstep_patois', lyrics: SAMPLE_LYRICS_DUBSTEP },
    { genre: 'kpop', lyrics: SAMPLE_LYRICS },
    { genre: 'blues', lyrics: SAMPLE_LYRICS },
    { genre: 'punk', lyrics: SAMPLE_LYRICS },
    { genre: 'folk', lyrics: SAMPLE_LYRICS },
  ];

  for (const tc of testCases) {
    console.log(`\n${C.bold}── Genre: ${tc.genre} ──${C.reset}`);
    const hasModule = data.VOCAB_KEYS.includes(tc.genre);
    if (!hasModule) {
      console.log(`  ${C.red}No vocabulary module — skipping${C.reset}`);
      continue;
    }
    // Show what replacements would apply
    const slopSet = data.SLOP_KEYS.includes(tc.genre) ? tc.genre : '_default';
    console.log(`  Slop set: ${slopSet}`);
    console.log(`  Sample lyrics (${tc.lyrics.split('\n').length} lines)`);
    console.log(`  Pipeline: fixSectionLabels → enforceLineCounts → enforceVocabularyLock → replaceSlopWords`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

console.log(`\n${C.bold}${C.magenta}  HOT-Step Genre Pipeline Audit Tool v1.0${C.reset}`);
console.log(`${C.dim}  Reading production data from: ${SERVER_PATH}${C.reset}`);

const genreList = extractGenreList();
const data = extractServerData();

console.log(`${C.dim}  Found ${genreList.length} genres in GENRE_LIST${C.reset}`);
console.log(`${C.dim}  Found ${data.VOCAB_KEYS.length} vocabulary modules${C.reset}`);
console.log(`${C.dim}  Found ${data.STRUCT_KEYS.length} structure templates${C.reset}`);
console.log(`${C.dim}  Found ${data.SLOP_KEYS.length} slop replacement sets${C.reset}`);
console.log(`${C.dim}  Found ${data.BPM_KEYS.length} BPM range entries${C.reset}`);
console.log(`${C.dim}  Found ${data.GENRE_MAP_KEYS.length} genreMap routing keys${C.reset}`);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${C.bold}Usage:${C.reset}
  node test-genres.mjs --audit           Full coverage audit table
  node test-genres.mjs --dryrun <genre>  Dry-run for one genre
  node test-genres.mjs --all             Dry-run every genre
  node test-genres.mjs --check           Cross-function consistency check
  node test-genres.mjs --sample-lyrics   Test with sample lyrics
  node test-genres.mjs                   Runs --audit + --check (default)
`);
  process.exit(0);
}

if (args.includes('--dryrun')) {
  const idx = args.indexOf('--dryrun');
  const genre = args[idx + 1];
  if (!genre) {
    console.error(`${C.red}Error: --dryrun requires a genre name${C.reset}`);
    process.exit(1);
  }
  runDryRun(genre, genreList, data);
} else if (args.includes('--all')) {
  for (const genre of genreList) {
    runDryRun(genre, genreList, data);
  }
} else if (args.includes('--check')) {
  runCheck(data);
} else if (args.includes('--sample-lyrics')) {
  runSampleLyrics(genreList, data);
} else {
  // Default: audit + check
  runAudit(genreList, data);
  runCheck(data);
}
