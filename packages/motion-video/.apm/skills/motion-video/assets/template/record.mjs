// Render index.html to an MP4, one deterministic frame at a time.
//   node record.mjs [out.mp4] [--fps 30] [--scale 2] [--crf 20] [--theme light] [--stills 2,22,38]
// --theme light renders the light (Yuma beige) version: video-only-light.mp4.
// Chrome is found automatically; set CHROME_PATH to override.
// --scale 2 renders the 1920x1080 page at 2x density: 3840x2160 (4K).
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const theme = opt('--theme', 'dark');
const suffix = theme === 'dark' ? '' : `-${theme}`;
const out = args[0] && !args[0].startsWith('--') ? args[0] : path.join(dir, `video-only${suffix}.mp4`);
const fps = Number(opt('--fps', 30));
const stills = opt('--stills', null);
const scale = Number(opt('--scale', 2));
const crf = opt('--crf', '20');

const chrome = [process.env.CHROME_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find(p => p && existsSync(p));
if (!chrome) throw new Error('Chrome not found — set CHROME_PATH');
mkdirSync(path.join(dir, 'frames'), { recursive: true });

const browser = await chromium.launch({
  executablePath: chrome,
  args: ['--allow-file-access-from-files', '--force-color-profile=srgb'],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href + `?render&theme=${theme}`);
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => [...document.images].every(i => i.complete));

if (stills) {
  for (const t of stills.split(',').map(Number)) {
    await page.evaluate(t => window.renderAt(t), t);
    await page.screenshot({ path: path.join(dir, 'frames', `still${suffix}-${t}.png`) });
  }
  await browser.close();
  process.exit(0);
}

const duration = await page.evaluate(() => window.DURATION);
const total = Math.round(duration * fps);
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });

for (let i = 0; i < total; i++) {
  await page.evaluate(t => window.renderAt(t), i / fps);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % fps === 0) process.stdout.write(`\r${i}/${total} frames`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.log(`\nwrote ${out}`);
