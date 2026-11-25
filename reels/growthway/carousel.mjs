// Builds a Growthway Instagram carousel from a spec (same scene types as reels, rendered as settled 1080x1350 JPEGs).
// Out, in reels/growthway/out/<slug>/: 01.jpg, 02.jpg, ... (Instagram's API takes JPEG only), preview.png, caption.txt.
// Run: npm run carousel:growthway -- <spec.json>
// Spec: { "slug", "caption", "hashtags", "slides": [ {type: "title", ...}, {type: "notes", ...}, ..., {type: "outro"} ] }
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { durationOf, fonts, scenePage, sceneTheme } from './style.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROMIUM = process.env.PW_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

async function build(browser, fontCss, file) {
  const spec = JSON.parse(await readFile(file, 'utf8'));
  const slides = spec.slides.map((s) => ({ ...s, seconds: s.seconds ?? durationOf(s) ?? 6 }));
  if (slides.length < 2 || slides.length > 10) throw new Error('A carousel needs 2-10 slides');
  const out = path.join(HERE, 'out', spec.slug);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  const files = [];
  for (const [i, s] of slides.entries()) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
    try {
      await page.setContent(scenePage(fontCss, s, { index: i, count: slides.length, prev: i ? sceneTheme(slides[i - 1]).bg : undefined, carousel: true, cover: true }));
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = 60000; }));
      const f = path.join(out, `${String(i + 1).padStart(2, '0')}.jpg`);
      await page.screenshot({ path: f, type: 'jpeg', quality: 92 });
      files.push(f);
    } finally {
      await page.close();
    }
  }
  const imgs = await Promise.all(files.map(async (f) => `<img src="data:image/jpeg;base64,${(await readFile(f)).toString('base64')}">`));
  const sheet = await browser.newPage({ viewport: { width: 1600, height: 100 } });
  await sheet.setContent(`<style>body{margin:0;background:#081F15;display:grid;grid-template-columns:repeat(${Math.min(files.length, 5)},1fr);gap:14px;padding:14px}img{width:100%;border-radius:10px}</style>${imgs.join('')}`);
  await sheet.screenshot({ path: path.join(out, 'preview.png'), fullPage: true });
  await sheet.close();
  await writeFile(path.join(out, 'caption.txt'), `${spec.caption.trim()}\n\n${(spec.hashtags ?? []).join(' ')}\n`);
  console.log(`${spec.slug}: ${files.length} slides → ${path.relative(process.cwd(), out)}`);
}

const files = process.argv.slice(2);
const fontCss = await fonts();
const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
try {
  for (const f of files) await build(browser, fontCss, f);
} finally {
  await browser.close();
}
