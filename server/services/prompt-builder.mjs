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
  rock: "dramatic lighting, electric atmosphere, high contrast",
  metal: "dark dramatic scene, intense fire and shadows, heavy atmosphere",
  punk: "gritty urban scene, raw energy, bold colors, rebellion",
  pop: "vibrant colors, clean aesthetic, bright lighting, contemporary",
  electronic: "neon lights, futuristic environment, glowing particles, cyberpunk",
  jazz: "warm golden tones, smoky atmosphere, elegant mood, sophisticated",
  blues: "moody blue tones, deep shadows, soulful atmosphere",
  folk: "natural landscapes, warm earth tones, rustic beauty, pastoral",
  classical: "elegant composition, renaissance lighting, grand architecture",
  hip: "urban cityscape, bold colors, street culture, dynamic perspective",
  rap: "urban environment, dramatic angles, street aesthetic",
  country: "wide open landscapes, golden hour, rural beauty, americana",
  indie: "dreamy atmosphere, soft pastel colors, artistic composition",
  r: "warm intimate lighting, smooth gradients, elegant silhouettes",
  ambient: "ethereal landscapes, soft focus, atmospheric mist, dreamlike",
  bossa: "tropical sunset, warm golden light, coastal paradise",
  reggae: "tropical colors, island vibes, sunset hues, laid-back mood",
  soul: "warm rich tones, intimate atmosphere, emotional depth",
  funk: "bold psychedelic colors, retro vibes, dynamic energy",
  alternative: "moody atmosphere, artistic composition, unconventional beauty"
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
  "hiphop":     "urban landscape, graffiti walls, street culture, gold chains, boombox aesthetic, concrete jungle",
  "trap":       "neon-lit Atlanta nights, luxury cars, ice chains, dark moody streets, bass culture",
  "drill":      "gritty London streets, dark urban landscape, rain-slicked roads, raw energy",
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
    if (lower.includes(genre)) return visuals;
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
   ═══════════════════════════════════════════════════════════════════════════════ */

function buildCoverArtPrompt(opts) {
  if (opts.prompt?.trim()) {
    return opts.prompt.trim();
  }
  var parts = [];
  var style = opts.style || "";
  var title = opts.title || "";
  var lyrics = opts.lyrics || "";
  var description = opts.description || "";
  var coverArtSubject = opts.coverArtSubject || opts.subject || "";
  var sectionType = (opts.sectionType || "").toLowerCase().replace(/[^a-z-]/g, "");
  var sectionIndex = typeof opts.sectionIndex === "number" ? opts.sectionIndex : -1;
  var totalSections = typeof opts.totalSections === "number" ? opts.totalSections : 0;
  var vocalistGender = opts.vocalistGender || "";
  var aboutGender = opts.aboutGender || "";

  var act = 0;
  if (sectionIndex >= 0 && totalSections > 0) {
    var pct = sectionIndex / Math.max(1, totalSections - 1);
    act = pct < 0.33 ? 1 : pct < 0.66 ? 2 : 3;
  }

  var lyricImagery = extractLyricImagery(lyrics);
  var themeKeywords = extractThemeKeywords(lyrics, 5);

  var personDesc = "";
  if (vocalistGender === "male" || aboutGender === "male") personDesc = "a man";
  else if (vocalistGender === "female" || aboutGender === "female") personDesc = "a woman";
  else if (vocalistGender === "duet") personDesc = "a man and a woman";

  if (coverArtSubject && sectionType) {
    var tone = SECTION_VISUAL_TONE[sectionType] || SECTION_VISUAL_TONE["verse"];
    if (act > 0 && ACT_EMPHASIS[act]) {
      parts.push(coverArtSubject + ", " + ACT_EMPHASIS[act] + ", " + tone);
    } else {
      parts.push(coverArtSubject + ", " + tone);
    }
    if (lyricImagery) {
      parts.push("visual details: " + lyricImagery);
    }
  } else if (coverArtSubject) {
    var enrichedSubject = coverArtSubject;
    if (personDesc && !/man|woman|boy|girl|he|she|male|female/i.test(coverArtSubject)) {
      enrichedSubject = personDesc + " in a scene of " + coverArtSubject;
    }
    parts.push(enrichedSubject);
    if (lyricImagery) parts.push("visual details: " + lyricImagery);
  } else if (description?.trim()) {
    parts.push(description.trim());
  } else if (lyricImagery) {
    var titleConcept = extractTitleConcept(title);
    if (titleConcept) {
      parts.push("A scene inspired by \"" + title.trim() + "\": " + titleConcept);
    } else {
      parts.push("Visual composition featuring: " + lyricImagery);
    }
  } else if (themeKeywords.length > 0) {
    parts.push("A scene evoking themes of " + themeKeywords.join(", "));
  } else {
    var fallbackScenes = personDesc ? [
      personDesc + " standing in a vast ethereal landscape under a dramatic sky",
      personDesc + " silhouetted against flowing abstract forms with rich color gradients",
      personDesc + " in a mysterious atmospheric scene with dramatic lighting",
      personDesc + " surrounded by symbolic objects in dramatic composition",
      personDesc + " amidst organic shapes merging with geometric patterns"
    ] : [
      "a vast ethereal landscape under a dramatic sky",
      "abstract flowing forms with rich color gradients",
      "a mysterious figure silhouetted against light",
      "symbolic objects arranged in dramatic composition",
      "organic shapes merging with geometric patterns"
    ];
    parts.push(fallbackScenes[Math.floor(Math.random() * fallbackScenes.length)]);
  }

  var genreVisuals = getGenreVisuals(style);
  if (genreVisuals) {
    parts.push(genreVisuals);
  } else if (style) {
    var styleWords = style.split(",").map(function(w) { return w.trim().toLowerCase(); }).filter(function(w) { return w.length > 2 && !w.includes("_"); }).slice(0, 2);
    if (styleWords.length > 0) {
      parts.push(styleWords.join(" ") + " aesthetic");
    }
  }

  parts.push("no text, no words, no letters, no signs, no UI, no HUD, no watermark");

  if (sectionIndex >= 0 && totalSections > 0) {
    var progress = sectionIndex / Math.max(1, totalSections - 1);
    var arcDesc = progress < 0.2 ? "early chapter — introducing the world"
      : progress < 0.4 ? "rising action — deepening into the world"
      : progress < 0.6 ? "middle of the story — the world is fully alive"
      : progress < 0.8 ? "climax approaching — intensity building"
      : "final chapter — resolution, lasting impression";
    parts.push("Visual continuity: all section images depict the same scene, same characters, same location, same lighting palette. This is one continuous visual story, not disconnected images.");
    parts.push("Narrative progression: " + arcDesc);
  }

  parts.push("photorealistic, real photograph, no text, no words, no letters, no signs, no UI, no HUD, no watermark, no drawing, no illustration, no comic, no anime, no cartoon, no painted style");

  var suffixPool = [
    "cinematic photography, dramatic natural lighting, shallow depth of field, film grain, RAW photo quality",
    "professional photography, atmospheric lighting, rich textures, shot on 35mm lens, vivid realism",
    "editorial photography, balanced composition, nuanced color grading, gallery quality photograph",
    "documentary style photography, authentic atmosphere, real-world lighting, compelling visual narrative",
    "fine art photography, luminous natural light, intricate detail, breathtaking cinematic composition",
    "portrait photography, volumetric lighting, sharp focus on subject, award-winning photojournalism",
    "landscape photography, epic scale, atmospheric perspective, golden hour warmth, visually striking",
    "street photography, candid moment, dynamic composition, raw emotion, real-world texture"
  ];
  var suffix = suffixPool[Math.floor(Math.random() * suffixPool.length)];
  parts.push(suffix);
  return parts.join(". ");
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
  if (progress < 0.2) narrativeArc = "early chapter — introducing the world, first impressions, dawn of the story";
  else if (progress < 0.4) narrativeArc = "rising action — deepening into the world, details emerging";
  else if (progress < 0.6) narrativeArc = "middle of the story — the world is fully alive, stakes are real";
  else if (progress < 0.8) narrativeArc = "climax approaching — intensity building, the world at its most vivid";
  else narrativeArc = "final chapter — resolution, the world fading or transforming, lasting impression";

  const visualEssence = extractVisualEssence(lyrics);

  const parts = [
    `Scene: ${visualWorld}`,
    `Story arc: ${narrative.position}, ${narrative.energy}`,
    `Narrative progression: ${narrativeArc}`,
    genreVisual ? `Visual style: ${genreVisual}` : "",
    `Atmosphere: ${scene.mood}`,
    `Moment: ${scene.pose}`,
    visualEssence ? `Imagery: ${visualEssence}` : "",
    title ? `Song theme: ${title}` : "",
    `Visual continuity: all section images depict the same scene, same characters, same location, same lighting palette. This is one continuous visual story, not disconnected images.`,
    "cinematic film still, dramatic lighting, photorealistic, 8k, cohesive visual narrative"
  ].filter(Boolean);
  return parts.join(". ");
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
