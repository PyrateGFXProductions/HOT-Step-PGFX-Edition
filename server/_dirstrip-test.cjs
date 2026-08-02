// Unit test for sanitizeDirectionLines — run from server\ with ..\runtime\node.exe _dirstrip-test.cjs
const fs = require("fs");
const src = fs.readFileSync("server.mjs", "utf8");

// Extract the function body
const start = src.indexOf("function sanitizeDirectionLines(");
if (start < 0) { console.error("FATAL: sanitizeDirectionLines not found"); process.exit(1); }
// Find the closing brace — match braces from the function start
let depth = 0, end = start, inStr = false, strCh = "";
for (let i = start; i < src.length; i++) {
  const ch = src[i];
  if (inStr) {
    if (ch === "\\") { i++; continue; }
    if (ch === strCh) inStr = false;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === "`") { inStr = true; strCh = ch; continue; }
  if (ch === "{") depth++;
  else if (ch === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
}
if (end <= start) { console.error("FATAL: could not extract function"); process.exit(1); }
const fnSrc = src.slice(start, end);
const sanitizeDirectionLines = eval(`(${fnSrc})`);

let pass = 0, fail = 0;
function t(name, input, expected) {
  const got = sanitizeDirectionLines(input);
  if (got === expected) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.log(`FAIL  ${name}\n  in : ${JSON.stringify(input)}\n  got: ${JSON.stringify(got)}\n  exp: ${JSON.stringify(expected)}`); }
}

// 1. Direction labels → [Instrumental]
t("sample flip w/ annotation", "[Sample Flip: Vocal Chop from a 1972 Soul Record - 'You Got to Move!' chopped into stuttering loops]", "[Instrumental]");
t("straight loop", "[Straight Loop]", "[Instrumental]");
t("dj 1 scratch", "[DJ 1 Scratch: Crab scratches over a jazz vocal sample]", "[Instrumental]");
t("dj battle", "[DJ Battle: Both DJs trade scratch patterns]", "[Instrumental]");
t("crate dig", "[Crate Dig: digging for a hidden gem]", "[Instrumental]");
t("vocal chop", "[Vocal Chop]", "[Instrumental]");
t("instrumental break", "[Instrumental Break: Dub Break - echo-heavy]", "[Instrumental]");
t("dub break", "[Dub Break]", "[Instrumental]");
t("scratch", "[Scratch]", "[Instrumental]");
t("build", "[Build: rising tension]", "[Instrumental]");
t("breakdown", "[Breakdown]", "[Instrumental]");

// 2. Standard labels with annotations → clean labels
t("verse annotation", "[Verse 1: Spoken over dusty riddim]", "[Verse 1]");
t("verse annotation 2", "[Verse 2: Rapped over stuttering beat]", "[Verse 2]");
t("chorus annotation", "[Chorus - High Energy]", "[Chorus]");
t("intro plain", "[Intro]", "[Intro]");
t("chorus plain", "[Chorus]", "[Chorus]");
t("outro plain", "[Outro]", "[Outro]");
t("pre-chorus numbered", "[Pre-Chorus 1]", "[Pre-Chorus 1]");
t("bridge annotation", "[Bridge: key change]", "[Bridge]");
t("hook annotation", "[Hook: the flip]", "[Hook]");
t("instrumental stays", "[Instrumental]", "[Instrumental]");

// 3. Unknown bracket with annotation → bare label only (unless it's a direction label)
t("unknown w/ annotation", "[Beat Switch: everything drops out]", "[Instrumental]");
t("unknown plain", "[Saxophone Solo]", "[Saxophone Solo]");
t("unknown numbered", "[Drop 2: double time]", "[Instrumental]");

// 4. Non-bracket lines untouched
t("lyric line", "Bitches love me cause Im the chosen one", "Bitches love me cause Im the chosen one");
t("empty", "", "");
t("null", null, null);

// 5. Multi-line block (the real-world case)
const block = [
  "[Intro]",
  "[Sample Flip: Vocal Chop from a 1972 Soul Record - 'You Got to Move!' chopped]",
  "[Verse 1: Spoken over dusty riddim]",
  "Line one",
  "[Chorus]",
  "Hook line",
  "[Instrumental Break: Dub Break - echo-heavy]",
  "[Outro]"
].join("\n");
const expectedBlock = [
  "[Intro]",
  "[Instrumental]",
  "[Verse 1]",
  "Line one",
  "[Chorus]",
  "Hook line",
  "[Instrumental]",
  "[Outro]"
].join("\n");
t("full block", block, expectedBlock);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
