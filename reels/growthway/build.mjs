// Builds a Growthway Instagram reel from a spec (reels/growthway/specs/*.json) in the house style (style.mjs).
// Out, in reels/growthway/out/<slug>/: reel.mp4 (1080x1920, silent; add the audio in Instagram), cover.png (the hook,
// settled, for the reel cover), preview.png (one still per scene, for review) and caption.txt.
// Run: npm run reel:growthway -- reels/growthway/specs/<file>.json   (no argument = every spec; --stills = skip the mp4)
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { hasFfmpeg, recordSequence } from '../reel.mjs';
import { durationOf, fonts, sceneTheme, scenePage } from './style.mjs';
import { hashSeed, moodFor, musicBed } from './music.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STILLS = process.argv.includes('--stills');

// Cloud sessions ship one Chromium that may not match this repo's Playwright version; use it when it's there.
const CHROMIUM = process.env.PW_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

// Default seconds per scene type, long enough to read at a normal pace.
const SECONDS = { hook: 5, stat: 4.6, gap: 6, point: 4.8, list: 6.4, outro: 4, quote: 5.6, kinetic: 4, versus: 6.4 };

async function still(browser, html, file, at) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  try {
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), at * 1000);
    await page.screenshot({ path: file, type: 'png' });
  } finally {
    await page.close();
  }
}

async function contactSheet(browser, files, out) {
  const imgs = await Promise.all(files.map(async (f) => `<img src="data:image/png;base64,${(await readFile(f)).toString('base64')}">`));
  const page = await browser.newPage({ viewport: { width: 1600, height: 100 } });
  try {
    await page.setContent(`<style>body{margin:0;background:#081F15;display:grid;grid-template-columns:repeat(${Math.min(files.length, 4)},1fr);gap:16px;padding:16px}img{width:100%;border-radius:12px}</style>${imgs.join('')}`);
    await page.screenshot({ path: out, fullPage: true });
  } finally {
    await page.close();
  }
}

async function build(browser, fontCss, specFile) {
  const spec = JSON.parse(await readFile(specFile, 'utf8'));
  const scenes = spec.scenes.map((s) => ({ ...s, seconds: s.seconds ?? durationOf(s) ?? SECONDS[s.type] }));
  const out = path.join(HERE, 'out', spec.slug);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  const opts = (i) => ({ index: i, count: scenes.length, prev: i ? sceneTheme(scenes[i - 1]).bg : undefined });
  const pages = scenes.map((s, i) => scenePage(fontCss, s, opts(i)));

  await still(browser, scenePage(fontCss, scenes[0], { ...opts(0), cover: true }), path.join(out, 'cover.png'), 60);
  const shots = [];
  for (const [i, s] of scenes.entries()) {
    const f = path.join(out, `.scene-${i}.png`);
    await still(browser, pages[i], f, Math.max(0, s.seconds - 0.1));
    shots.push(f);
  }
  await contactSheet(browser, shots, path.join(out, 'preview.png'));
  await Promise.all(shots.map((f) => rm(f)));
  await writeFile(path.join(out, 'caption.txt'), `${spec.caption.trim()}\n\n${(spec.hashtags ?? []).join(' ')}\n`);

  if (STILLS) return console.log(`${spec.slug}: stills only → ${path.relative(process.cwd(), out)}`);
  if (!(await hasFfmpeg())) return console.error(`${spec.slug}: reel skipped, ffmpeg is not installed.`);
  await recordSequence(browser, scenes.map((s, i) => ({ html: pages[i], seconds: s.seconds })), path.join(out, 'reel.mp4'));
  if (spec.music !== 'none') await addMusic(out, scenes, spec);
  console.log(`${spec.slug}: ${scenes.length} scenes, ${scenes.reduce((a, s) => a + s.seconds, 0).toFixed(1)}s → ${path.relative(process.cwd(), out)}`);
}

// Bakes a quiet, original music bed into the reel (see music.mjs). spec.music: "calm" | "bright" | "focus" | "none".
async function addMusic(out, scenes, spec) {
  const total = scenes.reduce((a, s) => a + s.seconds, 0);
  const wav = path.join(out, '.music.wav'), tmp = path.join(out, '.with-music.mp4'), mp4 = path.join(out, 'reel.mp4');
  await writeFile(wav, musicBed(total, { mood: spec.music ?? moodFor(scenes), seed: hashSeed(spec.slug) }));
  const fadeOut = Math.max(0, total - 1.8).toFixed(2);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
    '-af', `afade=t=in:d=0.6,afade=t=out:st=${fadeOut}:d=1.8,loudnorm=I=-20:TP=-2:LRA=9`, '-shortest', '-movflags', '+faststart', tmp]);
  await rm(mp4); await rm(wav);
  await run('mv', [tmp, mp4]);
}

async function main() {
  const specDir = path.join(HERE, 'specs');
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const files = args.length
    ? args
    : (await readdir(specDir)).filter((f) => f.endsWith('.json')).map((f) => path.join(specDir, f));
  const fontCss = await fonts();
  const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
  try {
    for (const f of files) {
      await build(browser, fontCss, f);
      // A/B hook test: "titleB" builds a second reel, identical except for the title card, into <slug>-b.
      const spec = JSON.parse(await readFile(f, 'utf8'));
      if (spec.titleB) {
        const b = { ...spec, slug: `${spec.slug}-b`, scenes: spec.scenes.map((s, i) => (i === 0 ? { ...s, text: spec.titleB, kicker: spec.kickerB ?? s.kicker } : s)) };
        const tmp = path.join(HERE, 'out', `.${spec.slug}-b.json`);
        await mkdir(path.dirname(tmp), { recursive: true });
        await writeFile(tmp, JSON.stringify(b));
        await build(browser, fontCss, tmp);
        await rm(tmp);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Growthway reel build failed:', err);
  process.exitCode = 1;
});
