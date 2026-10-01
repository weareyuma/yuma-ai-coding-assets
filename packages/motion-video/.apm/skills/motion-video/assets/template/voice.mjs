// Generate the voice-over from narration.json and mix it into the video.
//   ELEVENLABS_API_KEY=... node voice.mjs --tts | --mux | --check | --words N | --voices
// A mode is required: running without one does nothing, because --tts spends API credits.
// Lines are numbered from 0, like the clips (voice/00.mp3 is the first line).
// --tts     (re)generates voice/NN.mp3 for every line (cached by text and TTS settings)
// --mux     lays the lines at their timestamps, ducks the music (music.wav, from
//           `uv run music.py`) under them and muxes both into <output>.mp4
// --check   prints each line's length against its slot, without mixing
// --words N prints word-level timestamps of line N (needs OPENAI_API_KEY) — use them
//           to sync on-screen events to the exact word that names them
// --voices  lists the ElevenLabs voices available to the key
// --theme light  mixes into the light version (video-only-light.mp4 → <output>-light.mp4)
// Each line must fit between its `at` and `until`; a line that runs long is sped
// up (at most 12%) and reported, anything longer is an error to fix in the script.
// `pronounce` maps written words to how the voice should say them (e.g. a
// respelling of a product name); on-screen text is unaffected.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(path.join(dir, 'narration.json'), 'utf8'));
const tts = cfg.tts;
const vdir = path.join(dir, 'voice');
const args = process.argv.slice(2);
const theme = args.includes('--theme') ? args[args.indexOf('--theme') + 1] : 'dark';
const suffix = theme === 'dark' ? '' : `-${theme}`;
const modes = ['--tts', '--mux', '--voices', '--check', '--words'].filter(a => args.includes(a));
const outName = cfg.output || 'video';
if (!modes.length) { console.log('usage: node voice.mjs --tts | --mux | --check | --words N | --voices  [--theme light]'); process.exit(0); }
const doTts = args.includes('--tts');
const doMux = args.includes('--mux');

const clip = i => path.join(vdir, `${String(i).padStart(2, '0')}.mp3`);
const spoken = text => Object.entries(cfg.pronounce || {})
  .reduce((s, [w, say]) => s.replace(new RegExp(`\\b${w}\\b`, 'g'), say), text);
const settings = () => tts.provider === 'openai' ? tts.openai : { model: tts.model, voice_id: tts.voice_id, voice_settings: tts.voice_settings };
const key = l => createHash('sha1').update(JSON.stringify([tts.provider, settings(), spoken(l.text)])).digest('hex');
const needClips = () => { const missing = cfg.lines.findIndex((_, i) => !existsSync(clip(i))); if (missing >= 0) { console.error(`voice/${String(missing).padStart(2, '0')}.mp3 is missing — run: node voice.mjs --tts`); process.exit(1); } };
const duration = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

async function speak(text) {
  if (tts.provider === 'openai') {
    const { model, voice, instructions } = tts.openai;
    return fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, voice, instructions, input: text, response_format: 'mp3' }),
    });
  }
  if (!tts.voice_id) throw new Error('set tts.voice_id in narration.json (node voice.mjs --voices lists them)');
  return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${tts.voice_id}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: tts.model, voice_settings: tts.voice_settings }),
  });
}

if (args.includes('--voices')) {
  const res = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  for (const v of (await res.json()).voices) {
    const l = v.labels || {};
    console.log([v.voice_id, v.name, l.gender, l.age, l.accent, l.use_case, l.description].filter(Boolean).join(' · '));
  }
}

if (args.includes('--check')) {
  needClips();
  for (const [i, l] of cfg.lines.entries()) {
    const d = duration(clip(i)), room = l.until - l.at;
    console.log(`${String(i).padStart(2)}  ${l.at.toFixed(2).padStart(7)} → ${l.until.toFixed(2).padStart(7)}  ${d.toFixed(2)}s / ${room.toFixed(2)}s ${d > room ? `OVER by ${(d - room).toFixed(2)}s` : ''}  ${l.text.slice(0, 50)}`);
  }
}

if (args.includes('--words')) {
  const i = Number(args[args.indexOf('--words') + 1]);
  const form = new FormData();
  form.append('file', new Blob([readFileSync(clip(i))]), 'line.mp3');
  form.append('model', 'whisper-1'); form.append('response_format', 'verbose_json'); form.append('timestamp_granularities[]', 'word');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const at = cfg.lines[i].at;
  for (const w of (await res.json()).words) console.log(`${(at + w.start).toFixed(2).padStart(7)}  (+${w.start.toFixed(2)})  ${w.word}`);
}

if (doTts) {
  mkdirSync(vdir, { recursive: true });
  for (const [i, l] of cfg.lines.entries()) {
    const stamp = clip(i) + '.key';
    if (existsSync(clip(i)) && existsSync(stamp) && readFileSync(stamp, 'utf8') === key(l)) continue;
    const res = await speak(spoken(l.text));
    if (!res.ok) throw new Error(`TTS failed for line ${i}: ${res.status} ${await res.text()}`);
    writeFileSync(clip(i), Buffer.from(await res.arrayBuffer()));
    writeFileSync(stamp, key(l));
    console.log(`line ${i}: generated`);
  }
}

if (doMux) {
  needClips();
  const inputs = [], filters = [];
  for (const [i, l] of cfg.lines.entries()) {
    const d = duration(clip(i)), room = l.until - l.at;
    let tempo = 1;
    if (d > room) {
      tempo = d / room;
      if (tempo > 1.12) throw new Error(`line ${i} is ${d.toFixed(2)}s for a ${room.toFixed(2)}s slot — shorten it`);
      console.log(`line ${i}: ${d.toFixed(2)}s in ${room.toFixed(2)}s, sped up ×${tempo.toFixed(3)}`);
    } else console.log(`line ${i}: ${d.toFixed(2)}s in ${room.toFixed(2)}s`);
    inputs.push('-i', clip(i));
    filters.push(`[${i + 1}:a]aresample=48000,atempo=${tempo.toFixed(4)},adelay=${Math.round(l.at * 1000)}:all=1[a${i}]`);
  }
  const n = cfg.lines.length;
  filters.push(`${cfg.lines.map((_, i) => `[a${i}]`).join('')}amix=inputs=${n}:normalize=0[vo]`);
  if (cfg.music) {
    // the music ducks under the voice, then both are levelled together
    inputs.push('-i', path.join(dir, cfg.music.file));
    filters.push('[vo]asplit[vo1][vo2]');
    filters.push(`[${n + 1}:a]volume=${cfg.music.gain}[mu]`);
    filters.push('[mu][vo1]sidechaincompress=threshold=0.015:ratio=8:attack=30:release=700:makeup=1[muduck]');
    filters.push('[vo2][muduck]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[voice]');
  } else filters.push('[vo]loudnorm=I=-16:TP=-1.5:LRA=11[voice]');
  const video = path.join(dir, `video-only${suffix}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, ...inputs, '-filter_complex', filters.join(';'),
    '-map', '0:v', '-map', '[voice]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-t', String(duration(video)), '-movflags', '+faststart', path.join(dir, `${outName}${suffix}.mp4`)], { stdio: 'inherit' });
  console.log(`wrote ${outName}${suffix}.mp4`);
}
