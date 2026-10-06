#!/usr/bin/env node
// Generate a voice-over for a HyperFrames project: one clip per narration line, plus word timings.
//   ELEVENLABS_API_KEY=… [OPENAI_API_KEY=…] node voice.mjs [narration.json] [--voices] [--test "Name" spelling1 spelling2 …]
//
// narration.json:
//   { "voice_id": "…", "model": "eleven_v4", "voice_settings": { "stability": 0.5, "similarity_boost": 0.8 },
//     "pronounce": { "Written": "Spoken" },          // respellings sent to the voice only
//     "out": "assets/voice",                          // where clips go
//     "lines": ["First sentence.", "Second sentence."] }
//
// Writes <out>/NN.mp3 (only lines whose text or settings changed) and <out>/words.json:
//   [{ "i": 0, "text": "…", "file": "assets/voice/00.mp3", "dur": 2.24, "words": [["word", start, end], …] }]
// Word timings need OPENAI_API_KEY (Whisper); without it `words` is empty.
// --voices lists the voices on the key. --test writes one clip per spelling of a name into <out>/test/.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const EL = 'https://api.elevenlabs.io/v1';
const key = process.env.ELEVENLABS_API_KEY;
if (!key) { console.error('ELEVENLABS_API_KEY is not set'); process.exit(1); }

if (args.includes('--voices')) {
  const r = await fetch(`${EL}/voices`, { headers: { 'xi-api-key': key } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  for (const v of (await r.json()).voices) { const l = v.labels || {}; console.log([v.voice_id, v.name, l.gender, l.accent, l.use_case].filter(Boolean).join(' · ')); }
  process.exit(0);
}

const cfgPath = args.find(a => a.endsWith('.json')) || 'narration.json';
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const out = cfg.out || 'assets/voice';
const model = cfg.model || 'eleven_v4', settings = cfg.voice_settings || { stability: 0.5, similarity_boost: 0.8 };
mkdirSync(out, { recursive: true });
const spoken = s => Object.entries(cfg.pronounce || {}).reduce((t, [w, say]) => t.replace(new RegExp(`\\b${w}\\b`, 'g'), say), s);
const duration = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
async function speak(text, file) {
  const r = await fetch(`${EL}/text-to-speech/${cfg.voice_id}?output_format=mp3_44100_128`, { method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify({ text, model_id: model, voice_settings: settings }) });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  writeFileSync(file, Buffer.from(await r.arrayBuffer()));
}
async function words(file) {
  if (!process.env.OPENAI_API_KEY) return [];
  const form = new FormData(); form.append('file', new Blob([readFileSync(file)]), 'l.mp3'); form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json'); form.append('timestamp_granularities[]', 'word');
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return (await r.json()).words.map(w => [w.word, +w.start.toFixed(2), +w.end.toFixed(2)]);
}

const ti = args.indexOf('--test');
if (ti >= 0) {                                    // pronunciation test: the same sentence in several spellings
  const [name, ...spellings] = args.slice(ti + 1);
  mkdirSync(path.join(out, 'test'), { recursive: true });
  for (const [i, sp] of [name, ...spellings].entries()) {
    const f = path.join(out, 'test', `${i}-${sp.replace(/\W+/g, '_')}.mp3`);
    await speak(`Meet ${sp}. This is how ${sp} sounds in a sentence.`, f); console.log(f);
  }
  process.exit(0);
}

const cachePath = path.join(out, 'cache.json');
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};
const result = [];
for (const [i, text] of cfg.lines.entries()) {
  const file = path.join(out, `${String(i).padStart(2, '0')}.mp3`);
  const h = createHash('sha1').update(JSON.stringify([cfg.voice_id, model, settings, spoken(text)])).digest('hex');
  if (cache[i]?.h !== h || !existsSync(file)) { await speak(spoken(text), file); cache[i] = { h, words: await words(file) }; writeFileSync(cachePath, JSON.stringify(cache)); console.log(`line ${i}: generated`); }
  const dur = +duration(file).toFixed(2);
  result.push({ i, text, file, dur, words: cache[i].words });
  console.log(`${String(i).padStart(2)}  ${dur.toFixed(2)}s  ${text}`);
}
writeFileSync(path.join(out, 'words.json'), JSON.stringify(result, null, 1));
