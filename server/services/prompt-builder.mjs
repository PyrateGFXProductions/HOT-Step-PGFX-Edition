/**
 * Prompt Builder Service
 * ──────────────────────
 * Self-contained ES module for all image/video prompt generation:
 * - Music term → visual term translation
 * - Lyric imagery extraction (richest line, not 6 words)
 * - Theme keyword extraction
 * - Title concept mapping
 * - Genre-aware visual context
 * - Section-aware cover art prompt building
 * - Singer image prompt building (narrative consistency)
 * - Video prompt building
 *
 * Extracted from server.mjs to reduce monolithic file size.
 */

/* ═══════════════════════════════════════════════════════════════════════════════
   Data Structures — all self-contained, no external dependencies
   ═══════════════════════════════════════════════════════════════════════════════ */

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
  "with", "by", "from", "is", "it", "its", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "not", "no", "so", "if", "up",
  "out", "just", "like", "my", "me", "we", "you", "your", "they", "them",
  "he", "she", "her", "his", "i", "im", "ive", "dont", "that", "this", "all",
  "got", "get", "when", "what", "where", "how", "why", "oh", "yeah", "ya",
  "na", "la", "da", "uh", "ah", "ooh", "hey", "go", "know", "come", "take",
  "make", "see", "let", "say", "one", "way", "back", "now", "more", "than",
  "into", "over", "down", "been"
]);

const GENRE_VISUALS = {
  rock: "raw electric energy, harsh shadows and bright highlights, gritty texture",
  metal: "a dark monumental scene lit by fire and shadow, heavy and intense",
  punk: "loud rebellion, bold clashing colors, DIY grit and raw attitude",
  pop: "clean bright gloss, vibrant saturated color, polished contemporary surfaces",
  electronic: "sleek futuristic shapes glowing with neon, light cutting through darkness",
  jazz: "warm golden haze, smoky late-night intimacy, elegant brass reflections",
  blues: "deep moody blue shadows, soulful worn textures, honest emotion",
  folk: "earthy natural warmth, rustic handcrafted textures, open pastoral light",
  classical: "grand elegant architecture, renaissance chiaroscuro, timeless composition",
  hip: "bold graphic confidence, dynamic angles, expressive street energy",
  rap: "sharp dramatic contrast, high-energy attitude, bold graphic lines",
  country: "wide golden skies, weathered wood, warm americana openness",
  indie: "dreamy soft light, intimate artistic detail, gentle pastel mood",
  rnb: "smooth warm intimacy, velvet shadows, elegant soft gradients",
  "r&b": "smooth warm intimacy, velvet shadows, elegant soft gradients",
  ambient: "vast ethereal space, soft drifting mist, weightless calm",
  techno: "dark warehouse pulse, minimal red and white light, industrial concrete",
  house: "warm floor-to-ceiling energy, glowing disco ball, soulful nightclub haze",
  edm: "massive festival stage, laser arrays cutting through crowd haze, explosive color",
  dubstep: "bass you can see, shockwave light, festival LED walls",
  synthwave: "retro neon grid, chrome sunset, 80s future glow",
  trap: "dark moody luxury, neon-tinted night, slow heavy bass light",
  drill: "hard-edged contrast, rain-slicked shadow, stark urban tension",
  "lo-fi": "warm tape-grain softness, cozy golden lamplight, nostalgic calm",
  phonk: "gritty Memphis darkness, muscle-car headlights, distortion and haze",
  hyperpop: "electric candy color, glitchy playful energy, surreal brightness",
  industrial: "cold steel and machinery, harsh halogen glare, mechanical texture",
  bossa: "golden coastal warmth, tropical ease, gentle sunlit waves",
  reggae: "sunset island warmth, laid-back color, sound-system soul",
  soul: "rich vintage warmth, deep emotional tones, golden-era texture",
  funk: "bold groovy color, psychedelic retro energy, rhythmic pattern",
  alternative: "stark artistic contrast, moody unconventional beauty"
};

const SECTION_VISUAL_TONE = {
  intro: "gentle opening, soft light gradually revealing a scene, anticipation in the air",
  verse: "intimate observational scene, natural lighting, grounded and personal perspective",
  chorus: "expansive dramatic reveal, heightened emotion, vivid saturated colors, peak intensity",
  "pre-chorus": "building tension, shifting light, sense of anticipation growing",
  "post-chorus": "lingering resonance, afterglow, emotional echo of the chorus fading",
  bridge: "unexpected perspective shift, dreamlike quality, different visual palette from verses",
  interlude: "transitional atmosphere, suspended moment, quiet visual breathing room",
  outro: "fading resolution, closing imagery, warmth or melancholy settling in",
  instrumental: "abstract musical visualization, flowing forms, no human figures"
};

const ACT_EMPHASIS = {
  1: "opening scene, establishing the world, introducing visual motifs",
  2: "rising intensity, deepening conflict, visuals becoming more complex and layered",
  3: "climax and resolution, transformative imagery, the visual story reaching its peak"
};

const SINGER_SCENES = {
  intro:    { mood: "ethereal, soft ambient lighting, misty atmosphere", pose: "standing still, eyes closed, feeling the music" },
  verse:    { mood: "intimate, warm spotlight, dark background", pose: "singing into microphone, gentle expression" },
  prechorus:{ mood: "building energy, warm to cool transition lighting", pose: "leaning into the mic, intensity building" },
  chorus:   { mood: "explosive energy, vivid colored stage lights, lens flare", pose: "singing passionately, arms expressive, dynamic pose" },
  "post-chorus": { mood: "afterglow, soft neon, atmospheric haze", pose: "smiling, relaxed stage presence" },
  bridge:   { mood: "contemplative, single warm light, shadows", pose: "turning to camera, emotional delivery" },
  interlude:{ mood: "abstract, floating particles, dreamy", pose: "silhouette against colored lights" },
  outro:    { mood: "fading, gentle backlight, silhouette", pose: "walking away, or final note held" },
  instrumental: { mood: "atmospheric, abstract light patterns", pose: "no person, abstract visual" }
};

const GENRE_VISUAL_CONTEXT = {
  "dub":        "massive stacked speaker walls, sound system culture, bass vibrations shaking the room, selector at the decks, deep bass frequencies visible as air distortion, Jamaican sound system dancehall",
  "reggae":     "roots reggae aesthetic, warm golden light, Jamaican vibes, sound system culture, natural earth tones, peaceful resistance",
  "dancehall":  "vibrant Caribbean colors, dancehall queen energy, sound system stage, tropical night, neon lights",
  "riddim":     "bass-heavy speaker stacks, dancefloor energy, crowd moving to deep bass, Caribbean nightlife",
  "metal":      "dark stage, pyrotechnics, aggressive lighting, headbanging energy, leather and chains, industrial aesthetic",
  "doom metal": "dark fog, candlelight, gothic cathedral atmosphere, slow heavy atmosphere, monochrome with red accents",
  "black metal": "frozen landscape, corpse paint, grim atmosphere, forest backdrop, blast beats energy",
  "edm":        "massive LED walls, laser arrays, festival main stage, crowd sea, electronic dance energy",
  "techno":     "dark warehouse, minimal red/white lighting, industrial concrete, underground club aesthetic",
  "house":      "warm warehouse party, disco ball, soulful energy, Chicago underground vibes",
  "dubstep":    "massive bass drops visible as shockwaves, LED panels, festival bass culture, wobble bass energy",
  "hiphop":     "bold colors, confident attitude, dynamic lighting, golden-era textures, expressive energy, boombox aesthetic",
  "trap":       "neon-tinted night atmosphere, luxury textures, dark moody tones, bass culture, atmospheric haze",
  "drill":      "rain-slicked tones, raw energy, stark contrast lighting, hard-edged atmosphere, dark dramatic shadows",
  "r&b":        "velvet curtains, warm amber lighting, intimate stage, soulful expression, smooth aesthetic",
  "soul":       "Motown warmth, golden era aesthetic, rich wood tones, vintage microphone, emotional delivery",
  "funk":       "groovy colors, Parliament-Funkadelic aesthetic, bright neon, funkadelic energy, tight outfits",
  "folk":       "intimate campfire, natural landscape, acoustic warmth, wood and earth tones, storytelling atmosphere",
  "country":    "open plains, western sunset, barn dance, cowboy aesthetic, natural light",
  "pop":        "clean modern aesthetic, bright colors, polished production, mainstream appeal, catchy visual hooks",
  "kpop":       "synchronized choreography, K-pop idol aesthetic, pastel and neon mix, futuristic set design",
  "jazz":       "smoky jazz club, blue hour lighting, saxophone silhouette, intimate corner stage, cocktail lounge",
  "blues":      "Mississippi delta, juke joint, worn wood, single spotlight, raw emotion, whiskey glass",
  "reggaeton":  "tropical nightlife, dembow rhythm energy, Caribbean colors, urban Latin aesthetic, neon palm trees",
  "salsa":      "salsa club, warm colors, dancing couples, brass section, Caribbean heat",
  "classical":  "grand concert hall, dramatic chiaroscuro lighting, orchestral elegance, timeless beauty",
  "punk":       "DIY aesthetic, graffiti, safety pins, mohawk energy, underground venue, raw and loud",
  "post-punk":  "dark wave aesthetic, angular lighting, Joy Division atmosphere, monochrome with stark contrasts"
};

const MUSIC_TERM_VISUAL = {
  "bass cannon":          "massive speaker stack radiating visible bass vibrations, sound system culture",
  "skank guitar":         "rhythmic upstroke guitar playing, choppy chord chops on the offbeat, reggae rhythm guitar",
  "wobble bass":          "synthesizer with pulsating low-frequency oscillation, electronic bass texture",
  "drop the needle":      "vinyl record player, stylus touching down on spinning record, warm crackle",
  "four on the floor":    "steady kick drum pulse, drum machine, dancefloor rhythm, metronomic beat",
  "breakbeat":            "syncopated drum pattern, funky drummer loop, broken rhythm groove",
  "ghost notes":          "subtle quiet drum taps between main beats, brushed snare, whispered percussion",
  "blue note":            "flattened jazz pitch, soulful bending tone, melancholic musical interval",
  "walking bass":         "upright bass with steady quarter-note movement, jazz club, warm low end",
  "comping":              "rhythmic piano chords supporting a soloist, jazz trio, interactive accompaniment",
  "double stop":          "two strings played simultaneously on guitar, harmonized melodic line",
  "power chord":          "distorted guitar two-note chord, rock stage, amplifier glow, raw energy",
  "tremolo picking":      "rapid alternating guitar picking, surf rock or black metal, blurred strings",
  "slide guitar":         "bottleneck slide on steel strings, blues country, weeping guitar tone",
  "fingerpicking":        "delicate acoustic guitar plucking, folk intimacy, individual string articulation",
  "bowing":               "violin or cello with drawn bow, orchestral warmth, sustained tone",
  "bass drop":            "subwoofer cone vibrating violently, visible air distortion, crowd reaction",
  "rewind":               "vinyl spinning backward, selector hand on turntable, sound system pull-up",
  "wheel and come again": "turntable rewinding, crowd cheering, sound system rewind moment",
  "sound system":         "stacked speaker walls, selector at controls, outdoor dance, Caribbean night",
  "riddim":               "instrumental backing track, riddim file, bass-heavy groove without vocals",
  "rinsing":              "aggressive DJ mixing, fast cutting between tracks, high-energy set",
  "dubplate":             "exclusive vinyl press, one-of-a-kind record, sound system weapon",
  "selector":             "DJ choosing records, hands on vinyl, crowd anticipation",
  "MCing":                "microphone performer, hype man energy, crowd control, live vocal delivery",
  "toasting":             "rhythmic spoken delivery over riddim, Jamaican vocal style, chanting flow",
  "clashing":             "two sound systems competing, bass battle, crowd judging, rivalry energy",
  "drop":                 "sudden bass impact, sub-bass explosion, crowd physically reacting to low end",
  "build-up":             "rising tension, snare roll intensifying, filter sweep opening, anticipation",
  "breakdown":            "stripped-back section, minimal elements, tension before the drop",
  "fade out":             "volume gradually decreasing, song dissolving into silence, lingering end",
  "fade in":              "sound emerging from silence, gradual reveal, opening atmosphere",
  "sidechain":            "pumping compression effect, kick drum ducking other instruments, breathing rhythm",
  "lo-fi":                "vinyl crackle, tape hiss, warm saturation, nostalgic imperfection",
  "reverb tail":          "lingering echo fading into space, large room reflection, atmospheric decay",
  "filter sweep":         "frequency gradually opening or closing, whooshing transition, energy shift",
  "808":                  "deep sub-bass kick, Roland TR-808, trap foundation, chest-shaking low end",
  "break":                "drum-only section, rhythmic spotlight, percussive energy",
  "sample":               "chopped audio fragment, borrowed sound, recontextualized recording",
  "crescendo":            "gradually increasing intensity, everything building to a peak, overwhelming force",
  "staccato":             "sharp detached notes, punchy rhythmic hits, crisp articulation",
  "legato":               "smooth connected notes, flowing melodic line, seamless transitions",
  "syncopation":          "off-beat accents, unexpected rhythmic emphasis, grooving against the pulse",
  "polyrhythm":           "multiple competing rhythmic patterns, layered beats, complex groove",
  "modulation":           "key change, harmonic shift, musical transition to new tonal center",
  "dissonance":           "clashing notes, tension, unresolved harmonic conflict, unsettling sound",
  "resolution":           "tension releasing into harmony, consonance, musical homecoming",
  "fire track":           "music so good it metaphorically burns, passionate energy, heat of the moment",
  "killing it":           "dominating performance, commanding stage presence, absolute mastery",
  "sick beat":            "incredibly good rhythm, head-nodding groove, impressive drum pattern",
  "heavy":                "intense emotional weight, dark atmosphere, powerful low-frequency energy",
  "tight":                "precise musical execution, locked-in rhythm section, clean performance",
  "clean":                "polished production, crisp sound, no distortion, professional quality",
  "raw":                  "unpolished authenticity, gritty texture, emotional honesty, live energy",
  "smooth":               "velvet texture, flowing transitions, effortless delivery, liquid grace",
  "deep":                 "profound emotional resonance, low-frequency immersion, soulful weight",
  "vibing":               "caught up in the music, moving naturally, immersed in sound",
  "grooving":             "rhythmic body movement, locked into the beat, effortless dance flow",
  "jamming":              "spontaneous musical collaboration, improvised flow, creative exploration",
  "session":              "recording studio or jam session, musicians in creative flow, collaborative energy",
  "vocal booth":          "singer behind microphone in treated room, pop filter, studio recording",
  "monitor mix":          "stage speaker pointing at performer, in-ear monitors, live sound setup",
  "front of house":       "main concert PA system, audience-facing speakers, live venue sound",
  "backline":             "stage amplifiers and drum kit, performer equipment, live setup",
  "patch bay":            "studio cable routing matrix, connecting audio signals, technical setup",
  "mixing desk":          "audio console with faders and knobs, studio control room, sound engineering",
  "limiter":              "audio mastering preventing clipping, controlled peaks, loudness maximization",
};

const SECTION_NARRATIVE = {
  intro:      { position: "opening", energy: "low — establishing the world, setting the scene" },
  verse:      { position: "developing", energy: "medium — introducing characters, building context" },
  prechorus:  { position: "building", energy: "rising — tension escalating toward the peak" },
  chorus:     { position: "peak", energy: "high — the emotional and visual climax of this moment" },
  "post-chorus": { position: "afterglow", energy: "falling — the echo of the peak, reflection" },
  bridge:     { position: "turning point", energy: "shifted — a new perspective, a twist in the story" },
  interlude:  { position: "breathing", energy: "floating — a pause between chapters" },
  outro:      { position: "closing", energy: "fading — resolution, the final image that lingers" },
  instrumental: { position: "abstract", energy: "pure — no words, only visual emotion" }
};

/* ═══════════════════════════════════════════════════════════════════════════════
   Functions
   ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Replace music/slang terms in lyrics with their visual equivalents.
 * Sorts by length (longest first) so "bass cannon" matches before "bass".
 */
function translateMusicTerms(text) {
  if (!text) return "";
  let result = text;
  const sortedTerms = Object.keys(MUSIC_TERM_VISUAL).sort((a, b) => b.length - a.length);
  for (const term of sortedTerms) {
    const regex = new RegExp("\\b" + term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi");
    if (regex.test(result)) {
      result = result.replace(regex, MUSIC_TERM_VISUAL[term]);
    }
  }
  return result;
}

/**
 * Extract the richest lyric line for image generation.
 * Returns the full sentence with the most concrete visual nouns (not just 6 words).
 */
function extractLyricImagery(lyrics) {
  if (!lyrics?.trim()) return "";
  const translated = translateMusicTerms(lyrics);
  const cleaned = translated.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").replace(/\n+/g, " ").trim();
  if (!cleaned) return "";
  const lines = cleaned.split(/[.!?]+/).filter((l) => l.trim().length > 8);
  if (lines.length === 0) return "";
  const visualWords = /\b(sun|moon|stars?|sky|sea|ocean|fire|rain|storm|night|day|light|dark|shadow|color|red|blue|gold|silver|street|road|door|window|wall|floor|hand|face|eye|heart|bone|blood|stone|iron|steel|wood|glass|water|wind|dust|smoke|flame|neon|chrome|concrete|asphalt|jungle|forest|mountain|river|desert|city|town|speaker|stage|crowd|dancefloor|turntable|vinyl|microphone|amplifier|subwoofer|bass|drum|guitar|crown|sword|chain|mask|ghost|angel|devil|shadow|abyss|horizon|gate|tower|bridge|rose|thorn|vine|leaf|tree|flower|garden|cliff|cave|beach|shore|cloud|frost|ember|spark|flame|wave|tide|thunder|lightning|fog|mist|ash|dust|dirt|mud|sand|gravel)\b/gi;
  let bestLine = "";
  let bestScore = 0;
  for (const line of lines) {
    const matches = line.match(visualWords) || [];
    if (matches.length > bestScore) {
      bestScore = matches.length;
      bestLine = line.trim();
    }
  }
  if (bestLine) {
    return bestLine.replace(/[,;.!?]+$/, "").substring(0, 150);
  }
  return lines[0].trim().replace(/[,;.!?]+$/, "").substring(0, 150);
}

/**
 * Extract the visual essence from lyrics — best descriptive line for MVC pipeline.
 */
function extractVisualEssence(lyrics) {
  if (!lyrics) return "";
  const translated = translateMusicTerms(lyrics);
  const cleaned = translated.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").trim();
  if (!cleaned) return "";
  const lines = cleaned.split(/\n/).filter(l => l.trim().length > 10);
  if (lines.length === 0) return "";
  const visualWords = /\b(sun|moon|stars?|sky|sea|ocean|fire|rain|storm|night|day|light|dark|shadow|color|red|blue|gold|silver|street|road|door|window|wall|floor|hand|face|eye|heart|bone|blood|stone|iron|steel|wood|glass|water|wind|dust|smoke|flame|neon|chrome|concrete|asphalt|jungle|forest|mountain|river|desert|city|town|speaker|stage|crowd|dancefloor|turntable|vinyl|microphone|amplifier|subwoofer|bass|drum|guitar|synthesizer)\b/gi;
  let bestLine = "";
  let bestScore = 0;
  for (const line of lines) {
    const matches = line.match(visualWords) || [];
    if (matches.length > bestScore) {
      bestScore = matches.length;
      bestLine = line.trim();
    }
  }
  if (bestLine) {
    return bestLine.replace(/[,;.!?]+$/, "").substring(0, 120);
  }
  return lines[0].trim().replace(/[,;.!?]+$/, "").substring(0, 120);
}

/**
 * Extract frequent non-stopword terms from lyrics as theme keywords.
 */
function extractThemeKeywords(lyrics, maxKeywords = 5) {
  if (!lyrics?.trim()) return [];
  let cleaned = lyrics.replace(/\[.*?\]/g, "");
  cleaned = cleaned.replace(/[^\w\s]/g, "").toLowerCase();
  const words = cleaned.split(/\s+/).filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  if (words.length === 0) return [];
  const freq = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, maxKeywords).map(([word]) => word);
}

/**
 * Map genre string to visual atmosphere description.
 */
function getGenreVisuals(style) {
  if (!style) return "";
  const lower = style.toLowerCase();
  for (const [genre, visuals] of Object.entries(GENRE_VISUALS)) {
    // Word-boundary match: prevents 'r' matching every style ("warm intimate lighting"
    // on every EDM cover) and 'hip' matching "ship"/"chipped".
    const re = new RegExp(`(^|[^a-z0-9&+#])${genre}([^a-z0-9&+#]|$)`);
    if (re.test(lower)) return visuals;
  }
  return "";
}

/**
 * Map song title to visual concept based on keyword patterns.
 */
function extractTitleConcept(title) {
  if (!title?.trim()) return "";
  const t = title.trim().toLowerCase();
  const conceptMap = {
    "fire|flame|burn|blaze|inferno": "intense flames, glowing embers, rising heat, orange and red hues",
    "rain|storm|thunder|lightning|tempest": "dramatic storm clouds, rain streaks, lightning illuminating a dark sky",
    "night|midnight|dark|moon|moonlight": "nocturnal scene, moonlight casting long shadows, deep blue and black tones",
    "sun|sunrise|sunset|dawn|golden|day": "warm golden hour light, sun-drenched landscape, long shadows, amber tones",
    "city|urban|street|building|skyline": "modern cityscape, architectural forms, concrete and glass, neon reflections",
    "ocean|sea|wave|water|tide|surf|deep": "vast ocean expanse, rolling waves, underwater light rays, deep blues and greens",
    "sky|cloud|heaven|star|galaxy|cosmos": "sweeping sky view, cloud formations, celestial bodies, cosmic dust, ethereal light",
    "heart|love|passion|desire|kiss": "romantic warm tones, intimate close-up, soft bokeh, rose and crimson palette",
    "ghost|haunt|shadow|phantom|spirit|soul": "ethereal translucent figures, misty atmosphere, spectral light, haunting stillness",
    "diamond|gold|crown|throne|royal|king|queen": "opulent regal scene, metallic gold and jewel tones, ornate details, luxury",
    "wolf|tiger|lion|eagle|raven|serpent": "powerful animal in natural habitat, intense gaze, wild landscape, primal energy",
    "time|clock|hour|moment|eternity|forever": "surreal time imagery, melting clocks, hourglass, temporal distortion",
    "road|journey|path|trail|wander": "winding road through landscape, vanishing point, sense of movement and exploration",
    "dream|sleep|awake|vision|imagine": "surreal dreamlike scene, impossible geometry, soft edges, surreal color palette",
    "blood|wound|scar|pain|hurt|cry": "dramatic chiaroscuro lighting, raw emotion, intense red accents on dark background",
    "war|fight|battle|sword|gun|army": "epic battlefield scene, dramatic smoke, silhouettes against fiery sky, conflict",
    "peace|calm|serene|quiet|still|gentle": "tranquil pastoral scene, soft diffused light, gentle colors, harmonious composition",
    "dance|move|groove|rhythm|beat|flow": "dynamic sense of motion, flowing fabric or particles, rhythmic visual patterns",
    "mask|face|eye|stare|gaze|look": "mysterious face or mask, intense eye detail, dramatic shadow play, enigmatic mood",
    "chain|link|bind|lock|shack|free": "symbolic chains or freedom imagery, contrast of confinement and liberation",
    "ghost|phantom|specter|wraith|apparition": "ghostly translucent figures, eerie fog, supernatural lighting, otherworldly atmosphere",
    "kingdom|empire|throne|castle|fortress": "grand medieval architecture, towering stone walls, dramatic sky, epic scale",
    "machine|engine|robot|cyber|neon|tech": "futuristic cyberpunk scene, glowing circuits, neon-lit machinery, technological sublime",
    "desert|sand|dune|cactus|sun|heat": "vast desert landscape, shimmering heat haze, sand dunes, harsh sunlight",
    "forest|tree|wood|leaf|moss|fern": "dense ancient forest, dappled sunlight through canopy, rich green foliage, organic textures",
    "mountain|peak|cliff|rock|stone|summit": "towering mountain peak, dramatic clouds, rugged terrain, sense of altitude",
    "flower|bloom|petal|garden|rose|lily": "lush botanical close-up, delicate petals, dewdrops, vibrant floral colors",
    "ice|frost|snow|winter|cold|freeze|glacier": "frozen crystalline landscape, ice formations, cool blue-white palette, frost patterns"
  };
  for (const [pattern, concept] of Object.entries(conceptMap)) {
    if (new RegExp(pattern).test(t)) return concept;
  }
  return "";
}

/* ═══════════════════════════════════════════════════════════════════════════════
   buildCoverArtPrompt — section-aware image prompt for cover art + video
   PGFX: FLUX.2 is a text-to-image transformer — it wants descriptive PROSE with a
   single coherent concept, not comma-separated keyword lists. Every prompt below
   is built from one song concept paragraph shared by the cover AND all video
   sections (cohesion between music and visuals).
   ═══════════════════════════════════════════════════════════════════════════════ */

const SECTION_MOOD = {
  intro: "the scene opens gently, soft light gradually revealing itself",
  verse: "the scene turns intimate and observational, natural grounded light",
  "pre-chorus": "tension builds as the light begins to shift and gather",
  chorus: "the scene opens wide and vivid, color and emotion at full intensity",
  "post-chorus": "the energy lingers, a resonant afterglow settling over everything",
  bridge: "the scene shifts into a dreamlike space, a different palette than the verses",
  interlude: "a suspended quiet moment, the visual world holding its breath",
  outro: "the scene resolves and fades, warmth or melancholy settling in",
  instrumental: "abstract flowing forms, pure visual music with no human figures"
};

function buildSongConcept(opts) {
  if (opts.concept?.trim()) return opts.concept.trim();
  var coverArtSubject = (opts.coverArtSubject || opts.subject || "").trim();
  var title = (opts.title || "").trim();
  var lyrics = opts.lyrics || "";
  var description = opts.description || "";
  // A person only enters via the no-subject fallback pool — never forced into a
  // subject's scene (an "empty highway" subject must stay empty).
  var personDesc = "";
  if (opts.vocalistGender === "male" || opts.aboutGender === "male") personDesc = "a man";
  else if (opts.vocalistGender === "female" || opts.aboutGender === "female") personDesc = "a woman";
  else if (opts.vocalistGender === "duet") personDesc = "a man and a woman";
  if (coverArtSubject) return coverArtSubject;
  if (description?.trim()) return description.trim();
  var titleConcept = extractTitleConcept(title);
  if (titleConcept) return `In the spirit of the song "${title}", ${titleConcept}`;
  var lyricImagery = extractLyricImagery(lyrics);
  if (lyricImagery) return lyricImagery;
  var themeKeywords = extractThemeKeywords(lyrics, 5);
  if (themeKeywords.length > 0) {
    return `A scene centered on ${themeKeywords.join(", ")}, rich with atmosphere and dramatic light`;
  }
  var fallbackScenes = personDesc ? [
    `${personDesc} stands alone in a vast open landscape under a dramatic sky`,
    `${personDesc} walks through drifting light and shadow in an endless space`,
    `${personDesc} waits in a quiet room where a single beam of light falls through the dark`,
    `${personDesc} moves through a dreamlike field of color and mist`
  ] : [
    "a vast open landscape stretches under a dramatic sky, light breaking through heavy clouds",
    "soft abstract forms drift through a deep field of color, lit from within",
    "a lone light source glows in a wide dark space, its reflections spreading across still water",
    "weathered textures fill the frame, carved by time and lit with warm directional light",
    "layered shapes recede into atmospheric depth, each one catching a different hue of light",
    "a single road cuts through an endless plain toward a glowing horizon"
  ];
  return fallbackScenes[Math.floor(Math.random() * fallbackScenes.length)];
}

function buildCoverArtPrompt(opts) {
  if (opts.prompt?.trim()) {
    return opts.prompt.trim();
  }
  var style = (opts.style || "").trim();
  var sectionType = (opts.sectionType || "").toLowerCase().replace(/[^a-z-]/g, "");
  var isSection = typeof opts.sectionIndex === "number" && opts.sectionIndex >= 0 && (opts.totalSections || 0) > 0;
  var concept = buildSongConcept(opts);
  var genreMood = getGenreVisuals(style);
  var styleLabel = (style.split(",")[0] || "").trim().toLowerCase() || "music";
  var sentences = [concept];
  if (genreMood) {
    sentences.push(`The image carries a ${styleLabel} mood: ${genreMood}.`);
  } else if (style) {
    sentences.push(`The image carries a ${styleLabel} mood.`);
  }
  if (isSection) {
    var progress = opts.sectionIndex / Math.max(1, (opts.totalSections || 1) - 1);
    var arcDesc = progress < 0.2 ? "an opening moment"
      : progress < 0.4 ? "a building moment"
      : progress < 0.6 ? "a peak emotional moment"
      : progress < 0.8 ? "an intensifying moment"
      : "a closing moment";
    var sectionMood = SECTION_MOOD[sectionType] || SECTION_MOOD.verse;
    sentences.push(`This image is ${arcDesc} of the song: ${sectionMood}.`);
    sentences.push("The same characters, location and lighting continue across every image in this series, each one rendered as a separate single frame.");
  }
  sentences.push("Each image is one full-frame scene standing completely alone — never a storyboard, comic strip, grid or collage.");
  sentences.push("The composition is cinematic and richly detailed, with no text and no lettering anywhere.");
  // Every element must read as a complete sentence for FLUX.2 prose prompting.
  var normalizeSentence = function(s) { return s.trim().replace(/[.!?]+\s*$/, "") + "."; };
  return sentences.map(normalizeSentence).join(" ");
}

/* ═══════════════════════════════════════════════════════════════════════════════
   buildSingerImagePrompt — narrative-consistent singer images across sections
   ═══════════════════════════════════════════════════════════════════════════════ */

function buildSingerImagePrompt({ sectionType, lyrics, style, vocalistGender, title, subject, sectionIndex, totalSections }) {
  const scene = SINGER_SCENES[sectionType] || SINGER_SCENES.verse;
  const narrative = SECTION_NARRATIVE[sectionType] || SECTION_NARRATIVE.verse;
  const genderWord = vocalistGender === "male" ? "a man" : vocalistGender === "female" ? "a woman" : "a singer";

  const visualWorld = subject || `${genderWord} in a music performance setting`;

  const genreKey = (style || "").toLowerCase().split(/[,\s]+/)[0] || "";
  const genreVisual = GENRE_VISUAL_CONTEXT[genreKey] || "";

  const idx = typeof sectionIndex === "number" ? sectionIndex : 0;
  const total = typeof totalSections === "number" ? totalSections : 6;
  const progress = total > 1 ? idx / (total - 1) : 0.5;
  let narrativeArc = "";
  if (progress < 0.2) narrativeArc = "an opening moment, first impressions";
  else if (progress < 0.4) narrativeArc = "a building moment, details emerging";
  else if (progress < 0.6) narrativeArc = "a peak emotional moment, the mood at its fullest";
  else if (progress < 0.8) narrativeArc = "an intensifying moment, the mood at its most vivid";
  else narrativeArc = "a closing moment, resolution settling in";

  const visualEssence = extractVisualEssence(lyrics);

  const sentences = [visualWorld];
  sentences.push(`This image belongs to a ${narrativeArc}: ${scene.mood}.`);
  if (genreVisual) sentences.push(`The setting carries a ${genreKey} atmosphere: ${genreVisual}.`);
  sentences.push(scene.pose);
  if (visualEssence) sentences.push(`Imagery drawn from the lyrics: ${visualEssence}.`);
  if (title) sentences.push(`The song's theme is "${title}".`);
  /* PGFX: FLUX.2 treats "visual story/chapters" as a request for multi-panel storyboards.
     Keep per-series consistency without narrative framing; force a single frame. */
  sentences.push("The same characters, location and lighting continue across every image in this series, each one rendered as a separate single frame.");
  sentences.push("Each image is one full-frame scene standing completely alone — never a storyboard, comic strip, grid or collage.");
  sentences.push("Cinematic and photorealistic with dramatic lighting and no text or lettering anywhere.");
  return sentences.filter(Boolean).join(" ");
}

/* ═══════════════════════════════════════════════════════════════════════════════
   buildVideoPrompt — describes image + subtle motion for LTX2 video generation
   ═══════════════════════════════════════════════════════════════════════════════ */

function buildVideoPrompt({ imagePrompt, sectionType, vocalistGender }) {
  const scene = SINGER_SCENES[sectionType] || SINGER_SCENES.verse;
  return `${imagePrompt}. ${scene.pose}. Subtle breathing movement, hair swaying gently, ambient stage haze drifting, slow camera push-in. Cinematic, photorealistic.`;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Exports
   ═══════════════════════════════════════════════════════════════════════════════ */

export {
  /* Data structures (for external use if needed) */
  STOP_WORDS,
  GENRE_VISUALS,
  SECTION_VISUAL_TONE,
  ACT_EMPHASIS,
  SINGER_SCENES,
  GENRE_VISUAL_CONTEXT,
  MUSIC_TERM_VISUAL,
  SECTION_NARRATIVE,
  /* Functions */
  translateMusicTerms,
  extractLyricImagery,
  extractVisualEssence,
  extractThemeKeywords,
  getGenreVisuals,
  extractTitleConcept,
  buildCoverArtPrompt,
  buildSingerImagePrompt,
  buildVideoPrompt
};
