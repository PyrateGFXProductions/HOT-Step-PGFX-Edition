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
 * - Singer image prompt building (narrative consistency + genre-aware performer poses)
 * - Video prompt building (context-aware motion for performer vs object/animal vs landscape)
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

/* PGFX 2026-08-07: genre supplies LIGHTING/PALETTE/TEXTURE only — NEVER a scene with
   people, instruments, venues or props. The SCENE must come from the lyric subject/
   concept. Sync with the inline copy in server.mjs (init_promptBuilder). */
const GENRE_VISUALS = {
  rock: "raw electric energy, harsh shadows and bright highlights, gritty texture",
  metal: "fire and shadow, heavy dark intensity, monumental contrast",
  punk: "loud rebellion, bold clashing colors, DIY grit and raw attitude",
  pop: "clean bright gloss, vibrant saturated color, polished contemporary surfaces",
  electronic: "sleek futuristic glow, neon light cutting through darkness",
  jazz: "warm golden haze, smoky late-night intimacy, elegant brass reflections",
  blues: "deep moody blue shadows, soulful worn textures, honest emotion",
  folk: "earthy natural warmth, rustic handcrafted textures, open pastoral light",
  classical: "grand elegant scale, renaissance chiaroscuro, timeless dramatic light",
  hip: "bold graphic color, dynamic angles, sharp street light and shadow",
  rap: "sharp dramatic contrast, high-energy attitude, bold graphic color blocks",
  bluegrass: "warm golden afternoon light, dusty open air, weathered wood tones, honest rural warmth",
  "honky-tonk": "amber neon glow, smoky warm light, worn wood and glass reflections",
  americana: "wide nostalgic golden light, big open skies, weathered wood textures, dusty warmth",
  "country rock": "sunset haze, dusty golden light, wide-open sky tones, road-worn warmth",
  outlaw: "dry dusk light, dust on the wind, long open-road shadows, amber haze",
  western: "painted desert light, warm cinematic golden haze, long shadows at dusk",
  gospel: "warm golden rays streaming through tall windows, sacred glowing light, soft dust motes",
  country: "wide golden skies, weathered wood, warm americana openness",
  indie: "dreamy soft light, intimate artistic detail, gentle pastel mood",
  rnb: "smooth warm intimacy, velvet shadows, elegant soft gradients",
  "r&b": "smooth warm intimacy, velvet shadows, elegant soft gradients",
  ambient: "vast ethereal space, soft drifting mist, weightless calm",
  techno: "dark industrial pulse, minimal red and white light, concrete and haze",
  house: "warm glowing light, mirror-ball sparkle, soulful night haze",
  edm: "explosive laser color, sweeping beams through haze, blinding brightness",
  dubstep: "shockwave light, low-end haze, LED color glow",
  synthwave: "retro neon grid, chrome sunset, 80s future glow",
  trap: "dark moody luxury, neon-tinted night, slow heavy low-end light",
  drill: "hard-edged contrast, rain-slicked shadow, stark urban tension",
  "lo-fi": "warm tape-grain softness, cozy golden lamplight, nostalgic calm",
  phonk: "gritty Memphis darkness, harsh amber glow, distortion and haze",
  hyperpop: "electric candy color, glitchy playful energy, surreal brightness",
  industrial: "cold steel tones, harsh halogen glare, mechanical texture",
  bossa: "golden coastal warmth, tropical ease, gentle sunlit waves",
  reggae: "sunset island warmth, laid-back color, sound-system glow",
  soul: "rich vintage warmth, deep emotional tones, golden-era texture",
  funk: "bold groovy color, psychedelic retro energy, rhythmic pattern",
  alternative: "stark artistic contrast, moody unconventional light and shadow"
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

/**
 * Genre-aware performer pose adapter.
 * For electronic/DJ/synth/rock tracks, adapts the pose away from a generic vocal mic.
 */
function getGenrePerformerScene(sectionType, style = "") {
  const base = SINGER_SCENES[sectionType] || SINGER_SCENES.verse;
  const lower = String(style || "").toLowerCase();
  let pose = base.pose;
  if (/dj|turntabl|scratch|sample/i.test(lower)) {
    pose = sectionType === "intro" ? "standing at dual turntables, headphones around neck, selecting a vinyl record"
      : sectionType === "chorus" ? "fast scratching and crossfading on vinyl decks, commanding the turntables with intense energy"
      : "adjusting mixer dials and cueing the next record, headphones pressed to one ear in deep concentration";
  } else if (/electronic|techno|house|synth|edm|ambient|trance|hyperpop/i.test(lower)) {
    pose = sectionType === "chorus" ? "performing behind synthesizer rigs and drum pads, glowing lights pulsating around them"
      : "tweaking analog synthesizer controls and launchpad buttons in creative flow";
  } else if (/rock|metal|punk|grunge/i.test(lower)) {
    pose = sectionType === "chorus" ? "gripping the microphone stand with passionate energy, delivering lyrics with raw power"
      : "leaning into the tempo, guitar in hand, delivering lyrics with intense emotion";
  }
  return { mood: base.mood, pose };
}

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
  "limiter":              "audio mastering preventing clipping, controlled peaks, loudness maximization"
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
  const cleaned = translated.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").replace(/\r/g, "").trim();
  if (!cleaned) return "";
  const lines = cleaned.split(/[.!?\n]+/).filter((l) => l.trim().length > 8);
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
 * PGFX: Build the concept from the STORY the lyrics tell — the protagonist
 * (animal, vehicle, sci-fi/fantasy entity, or repeated proper name), the setting,
 * and the action — instead of a weak title keyword match.
 */
function extractLyricStory(lyrics) {
  if (!lyrics?.trim()) return "";
  let cleaned = lyrics.replace(/\[.*?\]/g, " ").replace(/\(.*?\)/g, " ").replace(/[^\w\s\u0027-]/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length < 20) return "";
  const lower = " " + cleaned.toLowerCase() + " ";
  const hasAny = (words) => words.some((w) => new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`).test(lower));

  const SUBJECT_ENTITIES = {
    cow: ["cow", "heifer", "bull", "calf", "steer"],
    horse: ["horse", "mare", "stallion", "pony", "colt"],
    dog: ["dog", "hound", "puppy", "pup"],
    cat: ["cat", "kitten", "feline"],
    fox: ["fox"],
    bear: ["bear"],
    wolf: ["wolf", "wolves"],
    deer: ["deer", "fawn", "doe"],
    rabbit: ["rabbit", "bunny", "hare"],
    bird: ["bird", "robin", "sparrow", "crow", "raven", "owl", "eagle", "hawk"],
    hen: ["hen", "rooster", "chicken", "chick"],
    pig: ["pig", "hog", "sow", "boar"],
    sheep: ["sheep", "ewe", "lamb", "ram"],
    goat: ["goat"],
    mouse: ["mouse", "mice", "rat"],
    fish: ["fish", "trout", "salmon", "shark", "whale"],
    car: ["car", "chevy", "ford", "cadillac", "convertible", "mustang", "corvette", "coupe", "sedan"],
    truck: ["truck", "pickup", "diesel", "semi", "rig"],
    train: ["train", "locomotive", "boxcar", "steam train", "freight train"],
    ship: ["ship", "sailboat", "vessel", "boat", "yacht", "pirate ship", "ghost ship"],
    motorcycle: ["motorcycle", "chopper", "harley", "bike"],
    robot: ["robot", "android", "cyborg", "automaton", "mech"],
    astronaut: ["astronaut", "cosmonaut", "spaceman", "starship", "spaceship"],
    samurai: ["samurai", "ninja", "warrior", "knight", "swordsman"],
    wizard: ["wizard", "witch", "sorcerer", "mage"]
  };

  let entity = "";
  for (const [species, words] of Object.entries(SUBJECT_ENTITIES)) {
    if (hasAny(words)) { entity = species; break; }
  }

  const SETTINGS = [
    { words: ["movie", "cinema", "picture house", "movie seat", "velvet seat", "ticket", "popcorn", "marquee", "projector", "screen", "showtime", "matinee", "theater", "theatre", "aisle"], scene: "settles into a velvet movie theater seat", place: "a movie theater" },
    { words: ["barn", "fence", "corn bin", "tractor", "pasture", "hay", "silo", "ranch", "farm", "cattle", "field"], scene: "stands in the farmyard beside the fence", place: "a farm" },
    { words: ["street", "avenue", "boulevard", "sidewalk", "neon", "skyscraper", "downtown", "city block"], scene: "walks a city street at night", place: "a city street" },
    { words: ["train", "station", "platform", "railroad", "boxcar", "locomotive"], scene: "waits on a train platform", place: "a train station" },
    { words: ["bar", "saloon", "tavern", "jukebox", "dancefloor", "honky", "dive"], scene: "stands in a smoky bar", place: "a bar" },
    { words: ["ocean", "sea", "wave", "tide", "shore", "beach", "sand", "surf"], scene: "stands at the edge of the ocean", place: "the ocean" },
    { words: ["mountain", "valley", "ridge", "creek", "river", "forest", "woods", "hill", "pine"], scene: "moves through open country", place: "the open country" },
    { words: ["church", "chapel", "pew", "hymn"], scene: "sits in a quiet church pew", place: "a church" },
    { words: ["home", "house", "porch", "kitchen", "doorway", "yard", "garden", "window"], scene: "lingers on a quiet home porch", place: "a quiet home" },
    { words: ["road", "highway", "truck", "engine", "car", "asphalt"], scene: "stands on an open road", place: "an open road" },
    { words: ["space", "stars", "orbit", "galaxy", "cosmos", "station", "nebula"], scene: "drifts through the vast cosmos", place: "deep space" },
    { words: ["castle", "throne", "tower", "dungeon", "courtyard", "fortress"], scene: "stands within ancient stone walls", place: "an ancient castle" }
  ];

  let setting = null;
  let settingScore = 0;
  for (const s of SETTINGS) {
    let score = 0;
    for (const w of s.words) {
      const re = new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`, "g");
      score += (lower.match(re) || []).length;
    }
    if (score > settingScore) { setting = s; settingScore = score; }
  }

  const NON_NAMES = new Set([
    "The", "I", "You", "We", "They", "She", "He", "It", "Yeah", "Oh", "And", "But", "So", "When",
    "If", "Now", "Here", "There", "Well", "Never", "Every", "Gonna", "Wanna", "Cause", "Baby",
    "Hey", "Girl", "Boy", "Get", "Take", "Put", "Let", "Make", "Come", "Go", "Say", "Tell",
    "Don", "Love", "Day", "Night", "Time", "Way", "Back", "Down", "Out", "One", "Two", "Three",
    "What", "Why", "How", "This", "That", "Then", "Just", "Like", "Some", "Such", "Where",
    "Who", "All", "Always", "Suddenly", "Under", "Over", "Into", "With", "Without", "Through",
    "From", "Upon", "Across", "Inside", "Outside", "Before", "After", "While", "Until", "Since"
  ]);
  for (const words of Object.values(SUBJECT_ENTITIES)) for (const w of words) NON_NAMES.add(w.charAt(0).toUpperCase() + w.slice(1));
  for (const s of SETTINGS) for (const w of s.words) for (const part of w.split(" ")) NON_NAMES.add(part.charAt(0).toUpperCase() + part.slice(1));

  const capCount = {};
  for (const w of cleaned.match(/\b[A-Z][a-z]{2,}\b/g) || []) capCount[w] = (capCount[w] || 0) + 1;
  const name = Object.entries(capCount)
    .filter(([w, c]) => c >= 2 && !NON_NAMES.has(w))
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  if (entity) {
    const isVowel = /^[aeiou]/i.test(entity);
    const article = isVowel ? "An" : "A";
    const who = name ? `${name}, a ${entity},` : `${article} ${entity},`;
    return setting && settingScore >= 2 ? `${who} ${setting.scene}` : `${who} at the heart of the story`;
  }
  if (name && setting && settingScore >= 2) return `${name} ${setting.scene}`;
  if (setting && settingScore >= 2) return `A quiet scene in ${setting.place}`;
  return "";
}

/**
 * Extract the visual essence from lyrics — best descriptive line for MVC pipeline.
 */
function extractVisualEssence(lyrics) {
  if (!lyrics) return "";
  const translated = translateMusicTerms(lyrics);
  const cleaned = translated.replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").trim();
  if (!cleaned) return "";
  const lines = cleaned.split(/\n/).filter((l) => l.trim().length > 10);
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
    const re = new RegExp(`(^|[^a-z0-9&+#])${genre}([^a-z0-9&+#]|$)`);
    if (re.test(lower)) return visuals;
  }
  return "";
}

function matchGenreVisuals(style) {
  if (!style) return null;
  const lower = style.toLowerCase();
  let best = null;
  for (const genre of Object.keys(GENRE_VISUALS)) {
    const re = new RegExp(`(^|[^a-z0-9&+#])${genre}([^a-z0-9&+#]|$)`);
    const m = re.exec(lower);
    if (!m) continue;
    const wordIndex = m.index + m[1].length;
    if (!best || wordIndex < best.index || (wordIndex === best.index && genre.length > best.genre.length)) {
      best = { genre, visuals: GENRE_VISUALS[genre], index: wordIndex };
    }
  }
  return best ? { label: best.genre, visuals: best.visuals } : null;
}

function safeStyleLabel(style) {
  const s = String(style || "").trim();
  if (!s) return "";
  const words = s.replace(/[.!?]+$/, "").split(/[\s,;:]+/).filter(Boolean).slice(0, 10);
  const label = words.join(" ").replace(/[,;:]+$/, "").trim();
  return label.length >= 3 ? label.toLowerCase() : "";
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
    "kingdom|empire|castle|fortress": "grand medieval architecture, towering stone walls, dramatic sky, epic scale",
    "machine|engine|robot|cyber|neon|tech": "futuristic cyberpunk scene, glowing circuits, neon-lit machinery, technological sublime",
    "desert|sand|dune|cactus": "vast desert landscape, shimmering heat haze, sand dunes, harsh sunlight",
    "forest|tree|wood|leaf|moss|fern": "dense ancient forest, dappled sunlight through canopy, rich green foliage, organic textures",
    "mountain|peak|cliff|rock|stone|summit": "towering mountain peak, dramatic clouds, rugged terrain, sense of altitude",
    "flower|bloom|petal|garden|rose|lily": "lush botanical close-up, delicate petals, dewdrops, vibrant floral colors",
    "ice|frost|snow|winter|cold|freeze|glacier": "frozen crystalline landscape, ice formations, cool blue-white palette, frost patterns"
  };
  for (const [pattern, concept] of Object.entries(conceptMap)) {
    if (new RegExp(`(^|[^a-z0-9])(${pattern})([^a-z0-9]|$)`).test(t)) return concept;
  }
  return "";
}

/* ═══════════════════════════════════════════════════════════════════════════════
   buildCoverArtPrompt — section-aware image prompt for cover art + video
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
  const coverArtSubject = (opts.coverArtSubject || opts.subject || "").trim();
  const title = (opts.title || "").trim();
  const lyrics = opts.lyrics || "";
  const description = opts.description || "";

  let personDesc = "";
  if (opts.vocalistGender === "male" || opts.aboutGender === "male") personDesc = "a man";
  else if (opts.vocalistGender === "female" || opts.aboutGender === "female") personDesc = "a woman";
  else if (opts.vocalistGender === "duet") personDesc = "a man and a woman";

  if (coverArtSubject) {
    const storyForSubject = extractLyricStory(lyrics);
    if (storyForSubject) {
      const speciesMatch = storyForSubject.match(/^(?:[A-Z][a-z]{2,}, a ([a-z]+),|A ([a-z]+),|An ([a-z]+),)/i);
      if (speciesMatch) {
        const species = (speciesMatch[1] || speciesMatch[2] || speciesMatch[3] || "").toLowerCase();
        const lowerSubject = coverArtSubject.toLowerCase();
        const speciesRe = new RegExp(`(^|[^a-z0-9])${species}s?([^a-z0-9]|$)`);
        const nameMatch = storyForSubject.match(/^([A-Z][a-z]{2,}), a /i);
        if (!speciesRe.test(lowerSubject) && nameMatch) {
          const firstWord = coverArtSubject.split(/[\s,]+/)[0].replace(/[^\w]/g, "");
          if (firstWord.toLowerCase() === nameMatch[1].toLowerCase()) {
            return coverArtSubject.replace(new RegExp(`^${nameMatch[1]}`, "i"), `${nameMatch[1]}, a ${species},`);
          }
        }
      }
    }
    return coverArtSubject;
  }

  const lyricStory = extractLyricStory(lyrics);
  if (lyricStory) {
    const animalMatch = lyricStory.match(/, a ([a-z]+),/i);
    if (animalMatch) personDesc = "";
    return lyricStory;
  }
  if (description?.trim()) return description.trim();
  const titleConcept = extractTitleConcept(title);
  if (titleConcept) return `In the spirit of the song "${title}", ${titleConcept}`;
  const lyricImagery = extractLyricImagery(lyrics);
  if (lyricImagery) return lyricImagery;
  const themeKeywords = extractThemeKeywords(lyrics, 5);
  if (themeKeywords.length > 0) {
    return `A scene centered on ${themeKeywords.join(", ")}, rich with atmosphere and dramatic light`;
  }
  const fallbackScenes = personDesc ? [
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
  return fallbackScenes[0];
}

function buildCoverArtPrompt(opts) {
  if (opts.prompt?.trim()) {
    return opts.prompt.trim();
  }
  const style = (opts.style || "").trim();
  const sectionType = (opts.sectionType || "").toLowerCase().replace(/[^a-z-]/g, "");
  const isSection = typeof opts.sectionIndex === "number" && opts.sectionIndex >= 0 && (opts.totalSections || 0) > 0;
  const concept = buildSongConcept(opts);

  let genreLabel = "", genreMood = "";
  const lowerStyle = style.toLowerCase();
  for (const [key, visuals] of Object.entries(GENRE_VISUALS)) {
    const re = new RegExp(`(^|[^a-z0-9&+#])${key}([^a-z0-9&+#]|$)`);
    if (re.test(lowerStyle)) { genreLabel = key; genreMood = visuals; break; }
  }
  const sentences = [concept];
  if (genreMood) {
    sentences.push(`The scene is lit with a ${genreLabel} atmosphere: ${genreMood}.`);
  } else if (style) {
    const styleLabel = (style.split(",")[0] || "").trim().toLowerCase() || "music";
    sentences.push(`The scene is lit with a ${styleLabel} atmosphere.`);
  }

  if (opts.titleText && (opts.title || "").trim()) {
    sentences.push(`The song title "${opts.title.trim()}" is rendered in elegant typography across the top of the cover.`);
  }

  if (isSection) {
    const sectionMood = SECTION_MOOD[sectionType] || SECTION_MOOD.verse;
    sentences.push(`Section mood: ${sectionMood}.`);
    sentences.push("Consistent setting and lighting throughout the entire piece.");
  }

  // Anti-storyboard positive bounds: force single frame
  sentences.push("Single full-frame image with no borders, no panels, no comic strip layout, and no text.");
  sentences.push("The composition is cinematic, coherent, and highly detailed.");

  const normalizeSentence = (s) => s.trim().replace(/[.!?]+\s*$/, "") + ".";
  return sentences.map(normalizeSentence).join(" ");
}

/* ═══════════════════════════════════════════════════════════════════════════════
   buildSingerImagePrompt — narrative-consistent singer images across sections
   ═══════════════════════════════════════════════════════════════════════════════ */

function subjectLooksLikePerson(subject) {
  const t = String(subject || "").toLowerCase();
  return /(^|[^a-z0-9])(singer|vocalist|performer|performing|artist|musician|band|dj|rapper|rockstar|cowboy|cowgirl|guitarist|drummer|pianist|player|man|woman|girl|boy|lady|gentleman|her\b|him\b|she\b|he\b|herself|himself)([^a-z0-9]|$)/i.test(t);
}

function subjectLooksLikeLandscape(subject) {
  const t = String(subject || "").toLowerCase();
  return /(^|[^a-z0-9])(landscape|mountain|ocean|sea|beach|forest|woods|desert|sky|clouds|city|street|highway|road|field|plain|valley|river|waterfall|horizon|night|room|hall|cathedral|ruins|space|cosmos|nebula)([^a-z0-9]|$)/i.test(t);
}

function subjectLooksLikeAnimalOrVehicle(subject) {
  const t = String(subject || "").toLowerCase();
  return /(^|[^a-z0-9])(cow|horse|dog|cat|fox|bear|wolf|deer|rabbit|bird|eagle|hawk|lion|tiger|panther|fish|shark|whale|car|truck|train|plane|ship|boat|motorcycle|vehicle|robot|android|machine)([^a-z0-9]|$)/i.test(t);
}

function buildSingerImagePrompt({ sectionType, lyrics, style, vocalistGender, title, subject, sectionIndex, totalSections, role }) {
  const scene = getGenrePerformerScene(sectionType, style);
  const performance = role === "performance";
  const genderWord = vocalistGender === "female" ? "a woman"
    : vocalistGender === "duet" ? "a man and a woman"
    : vocalistGender === "male" ? "a man"
    : performance ? "a man"
    : "a singer";

  const subjectWorld = (subject || "").trim();
  const subjectLed = !performance && !!subjectWorld && !subjectLooksLikePerson(subjectWorld);
  let visualWorld;
  if (performance) {
    const world = subjectWorld || extractLyricStory(lyrics) || extractTitleConcept(title) || "";
    visualWorld = world
      ? `${genderWord} performing inside the song's world: ${world}`
      : `${genderWord} performing, the stage and venue alive around them`;
  } else if (subjectLed) {
    visualWorld = `The song's world: ${subjectWorld}`;
  } else if (subjectWorld) {
    visualWorld = `${genderWord} performing inside the song's world: ${subjectWorld}`;
  } else {
    visualWorld = `${genderWord} in a music performance setting`;
  }

  const lowerStyle = (style || "").toLowerCase();
  let genreKey = "", genreLight = "";
  for (const [key, visuals] of Object.entries(GENRE_VISUALS)) {
    const re = new RegExp(`(^|[^a-z0-9&+#])${key}([^a-z0-9&+#]|$)`);
    if (re.test(lowerStyle)) { genreKey = key; genreLight = visuals; break; }
  }

  const visualEssence = extractVisualEssence(lyrics);

  const sentences = [visualWorld];
  sentences.push(`Atmosphere: ${scene.mood}.`);
  if (genreLight) sentences.push(`The scene is lit with a ${genreKey} atmosphere: ${genreLight}.`);
  if (!subjectLed) sentences.push(scene.pose);
  if (visualEssence) sentences.push(`Visual elements from the song: ${visualEssence}.`);
  if (title) sentences.push(`Theme: "${title}".`);

  sentences.push("Single full-frame image with no borders, no panels, no comic strip layout, and no text.");
  sentences.push("Cinematic, photorealistic composition with dramatic lighting.");
  return sentences.filter(Boolean).map((s) => s.trim().replace(/[.!?]+\s*$/, "") + ".").join(" ");
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Video Motion Builders (LTX 2.3 & MiniMax H3)
   ═══════════════════════════════════════════════════════════════════════════════ */

const VIDEO_CAMERA_INTENT = {
  intro:        "a slow push-in from a wide establishing frame",
  verse:        "a slow push-in into intimate close framing",
  prechorus:    "a medium dolly-in as the energy rises",
  chorus:       "a slow dolly-in with a slight orbit, light sweeping past the lens",
  "post-chorus": "a gentle pull-back into warm afterglow",
  bridge:       "a slow lateral tracking shot, contemplative and patient",
  interlude:    "a slow drift through the scene, the camera floating without anchor",
  outro:        "a long slow pull-back, the subject receding into distance",
  instrumental: "a slow steady pan across the scene, gliding with the music"
};

const CAMERA_MOTION_PRESETS = {
  auto:            null,
  push_in:         "a slow, steady cinematic push-in toward the subject with intimate focal compression",
  pull_back:       "a smooth slow pull-back revealing the wider surroundings, subject remaining centered",
  drone_reveal:    "a dynamic rising crane and drone reveal, camera elevating smoothly over the scene",
  orbit_360:       "a smooth 360-degree parallax orbit gliding around the subject with light sweeping across",
  tracking_fast:   "a high-speed dynamic tracking shot moving alongside the subject with lateral motion blur",
  ground_skim:     "a low-angle ground-skimming camera rushing forward with dramatic perspective",
  tripod_lock:     "a locked-off static tripod shot with zero camera shake, all movement coming from the subject",
  handheld_subtle: "subtle natural handheld camera breathing with organic micro-movements and cinematic depth"
};

const PERFORMER_ACTION_INTENT = {
  intro:        "the performer takes the stage: gentle posture, subtle breath, lighting gradually catching their silhouette",
  verse:        "the performer delivers with intimate intent: subtle head movement, expressive gaze, locked into the rhythm",
  prechorus:    "the performer builds intensity: leaning forward, body language tightening, energy rising with the music",
  chorus:       "the performer commands the shot with peak energy: expressive gestures, hair and fabric catching the light, moving powerfully to the beat",
  "post-chorus": "the performer eases into a relaxed groove: smooth sway, breathing steadily in the warm afterglow",
  bridge:       "the performer turns reflective: slow contemplative posture, deep emotional expression, shadowed lighting",
  interlude:    "the performer pauses in the atmospheric glow, feeling the instrumental flow",
  outro:        "the performer holds the final gesture as light recedes, slowly fading into silhouette",
  instrumental: "the performer lets the music take over, moving rhythmically with effortless stage presence"
};

const OBJECT_ANIMAL_ACTION_INTENT = {
  intro:        "the subject rests in the still air as morning light reveals its form and subtle textures",
  verse:        "the subject shifts naturally: slow deliberate movement, turning into the light, natural organic motion",
  prechorus:    "motion accelerates: engine revving or steady stride quickening, dust or air stirring around the form",
  chorus:       "full kinetic momentum: powerful swift movement, dynamic motion blur, surging across the scene",
  "post-chorus": "the motion steadily decelerates, settling back into a calm rhythmic pace",
  bridge:       "a slow graceful turn against the backdrop, shadows lengthening as it pauses",
  interlude:    "drifting smoothly through the environment in quiet suspended motion",
  outro:        "gliding steadily into the distance, slowly receding into the horizon",
  instrumental: "steady hypnotic motion, cutting through space with effortless fluidity"
};

const ENVIRONMENT_ACTION_INTENT = {
  intro:        "the landscape awakens: mist drifts across the ground, morning light gradually illuminates the horizon",
  verse:        "natural elements in gentle motion: wind swaying branches or water rippling softly under natural light",
  prechorus:    "atmospheric pressure shifts: shadows lengthen rapidly, clouds gather and drift with rising energy",
  chorus:       "dramatic environmental transformation: brilliant light bursts, sweeping atmospheric surges, vivid motion",
  "post-chorus": "warm light washes over the terrain, golden hour reflections shimmering in the calm",
  bridge:       "the scene shifts into deep twilight: fog rolling in, ambient particles glowing in soft contrast",
  interlude:    "abstract atmospheric currents swirl and morph, light beams cutting through deep haze",
  outro:        "twilight deepens into darkness, stars or city lights blinking on as the landscape settles into silence",
  instrumental: "undulating waves of light and atmospheric texture flowing in long hypnotic patterns"
};

const VIDEO_ACTION_INTENT = PERFORMER_ACTION_INTENT; // Backwards-compatible alias

function _ltxSectionKey(sectionType) {
  return (sectionType || "verse").toLowerCase().replace(/\s+/g, "-");
}

function _selectActionIntent(sectionKey, subject, isPerformer) {
  if (isPerformer) {
    return PERFORMER_ACTION_INTENT[sectionKey] || PERFORMER_ACTION_INTENT.verse;
  }
  if (subject && (subjectLooksLikeAnimalOrVehicle(subject) || !subjectLooksLikePerson(subject))) {
    if (subjectLooksLikeLandscape(subject)) {
      return ENVIRONMENT_ACTION_INTENT[sectionKey] || ENVIRONMENT_ACTION_INTENT.verse;
    }
    return OBJECT_ANIMAL_ACTION_INTENT[sectionKey] || OBJECT_ANIMAL_ACTION_INTENT.verse;
  }
  return PERFORMER_ACTION_INTENT[sectionKey] || PERFORMER_ACTION_INTENT.verse;
}

const SHOT_SCALE = {
  intro:       "an extreme wide establishing shot of the whole scene",
  verse:       "a medium shot framing the subject from the waist up",
  "pre-chorus":"a medium close-up, the camera gliding slightly closer",
  chorus:      "a close-up with an energetic push toward the subject",
  "post-chorus":"a medium shot that holds steady",
  bridge:      "a close-up, slow and intimate",
  interlude:   "an extreme wide shot, the subject small within the scene",
  outro:       "a wide shot slowly pulling back",
  instrumental:"a medium shot with a slow drifting camera"
};

const CONTINUITY_SHOT = "Every shot continues the same scene: the same subject, the same location, the same light as every other shot in this video";

function _shotScaleFor(sectionType) {
  const key = _ltxSectionKey(sectionType);
  return SHOT_SCALE[key] || SHOT_SCALE.verse;
}

function _ltxShorten(text, max) {
  if (typeof text !== "string") return "";
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.substring(0, max).replace(/\s+\S*$/, "");
  return cut.length > 30 ? cut : t.substring(0, max);
}

function buildVideoMotionPrompt({ segmentLines, sectionType, concept, style, vocalistGender, shotScale, continuity, role, subject, cameraPreset }) {
  const sectionKey = _ltxSectionKey(sectionType);
  const camera = (cameraPreset && CAMERA_MOTION_PRESETS[cameraPreset])
    ? CAMERA_MOTION_PRESETS[cameraPreset]
    : (VIDEO_CAMERA_INTENT[sectionKey] || VIDEO_CAMERA_INTENT.verse);
  const isPerformer = role === "performance" || (!role && subjectLooksLikePerson(subject || concept));
  const action = _selectActionIntent(sectionKey, subject || concept, isPerformer);
  const lines = (segmentLines || []).map((l) => String(l).trim()).filter(Boolean);

  const sentences = [];
  const world = _ltxShorten(concept || "", 110);
  if (world) sentences.push(`The song lives in this world: ${world}`);

  if (lines.length > 0) {
    const moment = lines.join("; ").replace(/[.;,!?]+\s*$/g, "").trim();
    sentences.push(`In this moment: ${_ltxShorten(moment, 200)}`);
  } else {
    sentences.push("In this moment the scene shifts and transforms");
  }
  sentences.push(action);

  const resolvedScale = shotScale || _shotScaleFor(sectionType);
  if (resolvedScale) sentences.push(`This is ${resolvedScale}`);

  const genreMood = matchGenreVisuals(style || "");
  if (genreMood) sentences.push(`The scene is lit with a ${genreMood.label} atmosphere: ${genreMood.visuals}`);
  else if (style) sentences.push(`The scene is lit with a ${safeStyleLabel(style) || "music"} atmosphere`);

  const resolvedContinuity = continuity || CONTINUITY_SHOT;
  if (resolvedContinuity) sentences.push(resolvedContinuity);

  sentences.push(camera);

  const normalizeSentence = (s) => s.trim().replace(/[.!?]+\s*$/, "") + ".";
  return sentences.map(normalizeSentence).join(" ");
}

function buildH3MotionPrompt({ segmentLines, sectionType, concept, style, shotScale, continuity, role, subject, cameraPreset }) {
  const sectionKey = _ltxSectionKey(sectionType);
  const isPerformer = role === "performance" || (!role && subjectLooksLikePerson(subject || concept));
  const action = _selectActionIntent(sectionKey, subject || concept, isPerformer);
  const lines = (segmentLines || []).map((l) => String(l).trim()).filter(Boolean);

  const sentences = [];
  const world = _ltxShorten(concept || "", 100);
  if (world) sentences.push(`The song lives in this world: ${world}`);

  if (lines.length > 0) {
    const moment = lines.join("; ").replace(/[.;,!?]+\s*$/g, "").trim();
    sentences.push(`In this moment: ${_ltxShorten(moment, 160)}`);
  } else {
    sentences.push("In this moment the scene shifts and transforms");
  }
  sentences.push(action);

  const resolvedScale = shotScale || _shotScaleFor(sectionType);
  if (resolvedScale) sentences.push(`This is ${resolvedScale}`);

  const genreMood = matchGenreVisuals(style || "");
  if (genreMood) sentences.push(`The scene is lit with a ${genreMood.label} atmosphere: ${genreMood.visuals}`);

  const resolvedContinuity = continuity || CONTINUITY_SHOT;
  if (resolvedContinuity) sentences.push(resolvedContinuity);

  if (cameraPreset && CAMERA_MOTION_PRESETS[cameraPreset]) {
    sentences.push(CAMERA_MOTION_PRESETS[cameraPreset]);
  }

  /* MiniMax H3 native audio soundscape / ambient bed matching section mood */
  const moodAudio = {
    intro: "gentle ambient room tone, soft acoustic resonance building slowly",
    verse: "intimate ambient texture, subtle natural room tone and quiet acoustic bed",
    "pre-chorus": "rising atmospheric tension with light rhythmic pulse and swelling ambient pads",
    chorus: "dynamic full soundscape, vibrant acoustic presence and energetic musical rhythm",
    "post-chorus": "warm reverberant afterglow, gentle decaying echoes and smooth ambient bed",
    bridge: "dreamlike atmospheric depth, ethereal ambient textures and distant melodic reverb",
    interlude: "suspended ambient silence, spacious room tone and subtle airy textures",
    outro: "calm fading ambiance, gentle harmonic decay receding into silence",
    instrumental: "rich atmospheric soundstage with dynamic rhythmic pulse and flowing textures"
  };
  const audioBed = moodAudio[sectionKey] || moodAudio.verse;
  sentences.push(`Audio: ${audioBed}`);

  const normalizeSentence = (s) => s.trim().replace(/[.!?]+\s*$/, "") + ".";
  return sentences.map(normalizeSentence).join(" ");
}

function buildVideoPrompt({ imagePrompt, sectionType, vocalistGender, segmentLines, concept, style, shotScale, continuity, role, subject, cameraPreset }) {
  if (segmentLines || concept || style) {
    return buildVideoMotionPrompt({ segmentLines, sectionType, concept, style, vocalistGender, shotScale, continuity, role, subject, cameraPreset });
  }
  if (imagePrompt) {
    const cleaned = String(imagePrompt)
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s && !/full-frame scene standing|Each image is one|no text and no lettering|same characters, location and lighting|Single full-frame/i.test(s))
      .join(" ");
    return buildVideoMotionPrompt({ segmentLines: [], sectionType, concept: _ltxShorten(cleaned, 220), style: "", vocalistGender, shotScale, continuity, role, subject, cameraPreset });
  }
  return buildVideoMotionPrompt({ segmentLines: [], sectionType, concept: "", style: "", vocalistGender, shotScale, continuity, role, subject, cameraPreset });
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Exports
   ═══════════════════════════════════════════════════════════════════════════════ */

export {
  /* Data structures */
  STOP_WORDS,
  GENRE_VISUALS,
  SECTION_VISUAL_TONE,
  ACT_EMPHASIS,
  SINGER_SCENES,
  GENRE_VISUAL_CONTEXT,
  MUSIC_TERM_VISUAL,
  SECTION_NARRATIVE,
  VIDEO_CAMERA_INTENT,
  CAMERA_MOTION_PRESETS,
  PERFORMER_ACTION_INTENT,
  OBJECT_ANIMAL_ACTION_INTENT,
  ENVIRONMENT_ACTION_INTENT,
  VIDEO_ACTION_INTENT,
  SHOT_SCALE,
  CONTINUITY_SHOT,
  /* Functions */
  translateMusicTerms,
  extractLyricImagery,
  extractLyricStory,
  extractVisualEssence,
  extractThemeKeywords,
  getGenreVisuals,
  getGenrePerformerScene,
  extractTitleConcept,
  buildCoverArtPrompt,
  buildSingerImagePrompt,
  subjectLooksLikePerson,
  subjectLooksLikeLandscape,
  subjectLooksLikeAnimalOrVehicle,
  buildVideoPrompt,
  buildVideoMotionPrompt,
  buildH3MotionPrompt,
  _shotScaleFor,
  _selectActionIntent
};
