/**
 * Beat Detection & Audio Analysis Service
 * ────────────────────────────────────────
 * Self-contained ES module for audio analysis:
 * - WAV file parsing (16/24/32-bit PCM, 32-bit float)
 * - Onset-based beat detection
 * - Audio energy analysis
 * - Disco data analysis (stem energy per-frame)
 * - Section timing calculation (beat-aligned)
 * - Video section parsing from lyrics
 *
 * Extracted from server.mjs to reduce monolithic file size.
 */

import fs from "fs";
import path from "path";

const ANALYSIS_FPS = 60;

/* ═══════════════════════════════════════════════════════════════════════════════
   WAV File Parsing
   Supports: 16-bit PCM, 24-bit PCM, 32-bit PCM, 32-bit float
   Returns: { sampleRate, channels, samples (Float32Array mono) }
   ═══════════════════════════════════════════════════════════════════════════════ */

function parseWav(filePath) {
  const buf = fs.readFileSync(filePath);
  const riff = buf.toString("ascii", 0, 4);
  const wave = buf.toString("ascii", 8, 12);
  if (riff !== "RIFF" || wave !== "WAVE") {
    throw new Error(`Not a WAV file: ${filePath}`);
  }
  let fmtOffset = -1;
  let dataOffset = -1;
  let dataSize = 0;
  let pos = 12;
  while (pos < buf.length - 8) {
    const chunkId = buf.toString("ascii", pos, pos + 4);
    const chunkSize = buf.readUInt32LE(pos + 4);
    if (chunkId === "fmt ") {
      fmtOffset = pos + 8;
    } else if (chunkId === "data") {
      dataOffset = pos + 8;
      dataSize = chunkSize;
    }
    pos += 8 + chunkSize;
    if (chunkSize % 2 !== 0) pos++;
  }
  if (fmtOffset < 0) throw new Error(`No fmt chunk in: ${filePath}`);
  if (dataOffset < 0) throw new Error(`No data chunk in: ${filePath}`);
  const audioFormat = buf.readUInt16LE(fmtOffset);
  const channels = buf.readUInt16LE(fmtOffset + 2);
  const sampleRate = buf.readUInt32LE(fmtOffset + 4);
  const bitsPerSample = buf.readUInt16LE(fmtOffset + 14);
  const bytesPerSample = bitsPerSample / 8;
  const totalFrames = Math.floor(dataSize / (bytesPerSample * channels));
  const samples = new Float32Array(totalFrames);
  for (let i = 0; i < totalFrames; i++) {
    let monoSum = 0;
    for (let ch = 0; ch < channels; ch++) {
      const offset = dataOffset + (i * channels + ch) * bytesPerSample;
      let sample;
      if (audioFormat === 3 && bitsPerSample === 32) {
        sample = buf.readFloatLE(offset);
      } else if (audioFormat === 1 && bitsPerSample === 16) {
        sample = buf.readInt16LE(offset) / 32768;
      } else if (audioFormat === 1 && bitsPerSample === 24) {
        const b0 = buf[offset];
        const b1 = buf[offset + 1];
        const b2 = buf[offset + 2];
        const val2 = b2 << 16 | b1 << 8 | b0;
        sample = (val2 >= 8388608 ? val2 - 16777216 : val2) / 8388608;
      } else if (audioFormat === 1 && bitsPerSample === 32) {
        sample = buf.readInt32LE(offset) / 2147483648;
      } else {
        throw new Error(`Unsupported WAV format: ${audioFormat}/${bitsPerSample}bit in ${filePath}`);
      }
      monoSum += sample;
    }
    samples[i] = monoSum / channels;
  }
  return { sampleRate, channels, samples };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Audio Energy Analysis
   Returns per-window RMS energy normalized to [0, 1]
   ═══════════════════════════════════════════════════════════════════════════════ */

function analyzeWav(filePath) {
  const wav = parseWav(filePath);
  const windowSamples = Math.floor(wav.sampleRate / ANALYSIS_FPS);
  const totalWindows = Math.ceil(wav.samples.length / windowSamples);
  const energy = new Float32Array(totalWindows);
  let maxRms = 0;
  for (let w = 0; w < totalWindows; w++) {
    const start = w * windowSamples;
    const end2 = Math.min(start + windowSamples, wav.samples.length);
    let sumSq = 0;
    for (let i = start; i < end2; i++) {
      sumSq += wav.samples[i] * wav.samples[i];
    }
    const rms = Math.sqrt(sumSq / (end2 - start));
    energy[w] = rms;
    if (rms > maxRms) maxRms = rms;
  }
  const result = new Array(totalWindows);
  if (maxRms > 1e-8) {
    for (let w = 0; w < totalWindows; w++) {
      result[w] = Math.round(energy[w] / maxRms * 100) / 100;
    }
  } else {
    result.fill(0);
  }
  const duration = wav.samples.length / wav.sampleRate;
  return { energy: result, duration, sampleRate: wav.sampleRate };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Onset-Based Beat Detection
   Returns: { beats: number[], bpm: number, duration: number }
   ═══════════════════════════════════════════════════════════════════════════════ */

function detectBeatsInAudio(audioPath) {
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }
  const wav = parseWav(audioPath);
  const { sampleRate, samples } = wav;
  const windowSize = Math.floor(sampleRate * 0.01);
  if (windowSize < 1) throw new Error("Sample rate too low for 10ms windows");
  const totalWindows = Math.ceil(samples.length / windowSize);
  const energy = new Float32Array(totalWindows);
  for (let w = 0; w < totalWindows; w++) {
    const start = w * windowSize;
    const end2 = Math.min(start + windowSize, samples.length);
    let sumSq = 0;
    for (let i = start; i < end2; i++) {
      sumSq += samples[i] * samples[i];
    }
    energy[w] = Math.sqrt(sumSq / (end2 - start));
  }
  const alpha = 0.05;
  const minOnsetInterval = 0.15;
  const duration = samples.length / sampleRate;
  const timePerWindow = 0.01;
  let runningAvg = energy[0] || 0;
  const onsets = [];
  let lastOnsetTime = -minOnsetInterval;
  for (let w = 0; w < totalWindows; w++) {
    runningAvg = alpha * energy[w] + (1 - alpha) * runningAvg;
    const t = w * timePerWindow;
    if (energy[w] > 1.3 * runningAvg && (t - lastOnsetTime) >= minOnsetInterval) {
      onsets.push(t);
      lastOnsetTime = t;
    }
  }
  if (onsets.length < 2) {
    return { beats: onsets, bpm: 0, duration };
  }
  const intervals = [];
  for (let i = 1; i < onsets.length; i++) {
    intervals.push(onsets[i] - onsets[i - 1]);
  }
  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  const bpm = medianInterval > 0 ? Math.round(60 / medianInterval) : 0;
  return { beats: onsets, bpm, duration };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Section Type Map
   ═══════════════════════════════════════════════════════════════════════════════ */

const SECTION_TYPE_MAP = {
  "intro": "intro", "verse": "verse", "pre-chorus": "prechorus",
  "prechorus": "prechorus", "chorus": "chorus", "post-chorus": "postchorus",
  "postchorus": "postchorus", "bridge": "bridge", "interlude": "interlude",
  "outro": "outro", "instrumental": "instrumental", "drop": "drop",
  "build": "build", "hook": "chorus", "refrain": "chorus",
  "solo": "instrumental", "ad-lib": "postchorus", "adlib": "postchorus"
};

/* ═══════════════════════════════════════════════════════════════════════════════
   Lyrics → Section Parser
   ═══════════════════════════════════════════════════════════════════════════════ */

function parseVideoSections(lyrics) {
  if (!lyrics?.trim()) return [];
  var sections = [];
  var lines = lyrics.split("\n");
  var current = null;
  var currentLines = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var m = line.match(/^\[([^\]]+)\]\s*$/);
    if (m) {
      if (current && currentLines.length > 0) {
        sections.push({ sectionType: current, lyrics: currentLines.join("\n").trim() });
      }
      var raw = m[1].trim();
      var lower = raw.toLowerCase().replace(/[^a-z0-9 -]/g, "");
      current = SECTION_TYPE_MAP[lower] || "verse";
      currentLines = [];
    } else if (line.trim()) {
      currentLines.push(line);
    }
  }
  if (current && currentLines.length > 0) {
    sections.push({ sectionType: current, lyrics: currentLines.join("\n").trim() });
  }
  if (sections.length === 0 && lyrics.trim().length > 20) {
    sections.push({ sectionType: "verse", lyrics: lyrics.trim() });
  }
  return sections;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Beat-Aligned Section Timing
   ═══════════════════════════════════════════════════════════════════════════════ */

function calculateSectionTimings(sections, bpm, duration, beats) {
  /* Use actual beat positions when available for precise section boundaries */
  if (beats && beats.length > sections.length) {
    var barSeconds = bpm > 0 ? 240.0 / bpm : 4;
    var barsPerSection = Math.max(2, Math.round(beats.length / sections.length / 4));
    var timings = [0];
    var beatIdx = 0;
    for (var i = 0; i < sections.length - 1; i++) {
      beatIdx += barsPerSection * 4;
      if (beatIdx >= beats.length) beatIdx = beats.length - 1;
      timings.push(Math.min(duration, beats[beatIdx] || timings[i] + barSeconds * barsPerSection));
    }
    timings.push(duration);
    console.log(`[SectionTiming] Beat-aligned: ${timings.length} timings from ${beats.length} beats`);
    return timings;
  }
  /* Fallback: line-count weighted timing when no beat data */
  if (!sections.length || !bpm || bpm <= 0 || !duration || duration <= 0) {
    var even = duration / Math.max(1, sections.length);
    return sections.map(function(_, i) { return i * even; }).concat([duration]);
  }
  var barSeconds2 = 240.0 / bpm;
  var barsPerLine = Math.min(4.0, Math.max(2.5, 2.5 + 1.5 * ((bpm - 80) / 100)));
  var weights = sections.map(function(s) {
    var lines = s.lyrics.split("\n").filter(function(l) { return l.trim().length > 0; }).length;
    return Math.max(1, lines);
  });
  var totalWeight = weights.reduce(function(a, b) { return a + b; }, 0);
  var usableDuration = duration * 0.95;
  var timings2 = [0];
  var elapsed = 0;
  for (var i2 = 0; i2 < sections.length; i2++) {
    var sectionDuration = (weights[i2] / totalWeight) * usableDuration;
    sectionDuration = Math.max(3, Math.min(duration * 0.7, sectionDuration));
    elapsed += sectionDuration;
    timings2.push(Math.min(duration, elapsed));
  }
  if (elapsed > 0) {
    var scale = duration / elapsed;
    for (var j = 1; j < timings2.length; j++) {
      timings2[j] = Math.round(timings2[j] * scale * 100) / 100;
    }
    timings2[timings2.length - 1] = duration;
  }
  return timings2;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Disco Stem Analysis
   Analyzes kick, snare, and hi-hat stems for per-frame energy data.
   ═══════════════════════════════════════════════════════════════════════════════ */

function analyzeAndSaveDiscoData(songId, audioDir, stemUrls) {
  const stemCount = [stemUrls.kick, stemUrls.snare, stemUrls.hihat].filter(Boolean).length;
  if (stemCount === 0) {
    console.log(`[DiscoAnalyzer] Song ${songId}: no stems to analyze`);
    return "";
  }
  console.log(`[DiscoAnalyzer] Song ${songId}: analyzing ${stemCount} stem(s)...`);
  const t0 = Date.now();
  let duration = 0;
  function analyzeStem(url, label) {
    if (!url) return [];
    const filename = path.basename(url);
    const filePath = path.join(audioDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`[DiscoAnalyzer] ${label} stem file not found: ${filePath}`);
      return [];
    }
    try {
      const result = analyzeWav(filePath);
      if (result.duration > duration) duration = result.duration;
      console.log(`[DiscoAnalyzer]   ${label}: ${result.energy.length} windows, ${result.duration.toFixed(1)}s`);
      return result.energy;
    } catch (err) {
      console.error(`[DiscoAnalyzer]   ${label}: analysis failed: ${err.message}`);
      return [];
    }
  }
  const kick = analyzeStem(stemUrls.kick, "kick");
  const snare = analyzeStem(stemUrls.snare, "snare");
  const hihat = analyzeStem(stemUrls.hihat, "hihat");
  const data = {
    version: 1,
    fps: ANALYSIS_FPS,
    duration,
    kick,
    snare,
    hihat
  };
  const filename = `${songId}_disco.json`;
  const filePath = path.join(audioDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data));
  const fileSize = fs.statSync(filePath).size;
  const elapsed = Date.now() - t0;
  console.log(`[DiscoAnalyzer] Song ${songId}: saved ${filename} (${(fileSize / 1024).toFixed(1)} KB) in ${elapsed}ms`);
  return `/audio/${filename}`;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Exports
   ═══════════════════════════════════════════════════════════════════════════════ */

export {
  parseWav,
  analyzeWav,
  detectBeatsInAudio,
  parseVideoSections,
  calculateSectionTimings,
  analyzeAndSaveDiscoData,
  SECTION_TYPE_MAP,
  ANALYSIS_FPS
};
