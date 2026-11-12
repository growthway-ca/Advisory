// Builds a Parreira Advisory story in the house carousel style (a photo per slide, yellow caption boxes) from a list
// of slides: the carousel (1080x1350 PNGs with captions), a quick 10-second reel (1080x1920, photos only) and one
// longer clip per slide for editing. Each story folder holds its own build.mjs, photos/ and out/.
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { hasFfmpeg, recordReel, recordSequence } from './reel.mjs';

const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../node_modules/@fontsource');
const FPS = 30;

// Seconds each slide gets in the quick reel: a 1.8s hold on the title, then the rest share what is left of 10s,
// in whole frames so the reel comes out at exactly 10.0s.
export function quickTimings(count, { total = 10, title = 1.8 } = {}) {
  const frames = Math.round((total - title) * FPS);
  const each = Math.floor(frames / (count - 1));
  const extra = frames - each * (count - 1);
  return [title, ...Array.from({ length: count - 1 }, (_, i) => (each + (i < extra ? 1 : 0)) / FPS)];
}

// Seconds per slide in the editing clips.
const CLIP = (i) => (i === 0 ? 4 : 3);

async function fonts() {
  const face = async (file, weight) => {
    const data = (await readFile(path.join(FONT_DIR, 'plus-jakarta-sans/files', file))).toString('base64');
    return `@font-face{font-family:"Jakarta";src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight}}`;
  };
  return (await Promise.all([face('plus-jakarta-sans-latin-700-normal.woff2', 700), face('plus-jakarta-sans-latin-800-normal.woff2', 800)])).join('');
}

const mime = (file) => (/\.png$/i.test(file) ? 'image/png' : 'image/jpeg');

const CSS = `
*{box-sizing:border-box;margin:0}
html,body{width:1080px;height:var(--h);overflow:hidden;background:#0d0d0d}
body{position:relative;font-family:Jakarta,sans-serif}
.photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.frame{position:absolute;inset:0}
.blur{position:absolute;inset:-60px;width:calc(100% + 120px);height:calc(100% + 120px);object-fit:cover;filter:blur(40px) brightness(.55)}
.reel .frame{top:291px;bottom:auto;height:1338px;overflow:hidden}
.fade{position:absolute;left:0;right:0;bottom:0;height:52%;background:linear-gradient(180deg,transparent,rgba(10,10,10,.75) 55%,#0d0d0d)}
.cap{position:absolute;left:40px;right:40px;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.cap.top{top:var(--top)}
.cap.bottom{bottom:var(--bottom)}
.cap span{display:inline-block;background:#ffd60a;color:#111;font-weight:800;font-size:var(--fs);line-height:1.18;padding:6px 16px 8px;border-radius:12px;box-shadow:0 4px 18px rgba(0,0,0,.25)}
.cap .title{font-size:calc(var(--fs) * 2);text-transform:uppercase;letter-spacing:-.01em;padding:4px 26px 10px;margin-bottom:10px}
.inset{position:absolute;right:44px;top:var(--inset-top);width:380px;height:380px;border-radius:50%;border:9px solid #ffd60a;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.45)}
.inset img{width:100%;height:100%;object-fit:cover}
/* motion (reels only): a slow push in on the photo, the title circle pops in */
@keyframes push{from{transform:scale(1)}to{transform:scale(1.08)}}
@keyframes pop{0%{opacity:0;transform:scale(.6)}70%{opacity:1;transform:scale(1.04)}100%{transform:none}}
.reel .photo{animation:push var(--dur) linear both}
.reel .inset{animation:pop .45s .3s both}
`;

// A slide is { photo, at: 'top' | 'bottom', lines: [...], title?, inset? }; photo and inset are files in photos/.
// Reels: 1080x1920, the 4:5 photo whole over a blurred copy, no captions. Carousel: 1080x1350 with captions.
async function page(photos, fontCss, s, { reel = false, seconds = 3 } = {}) {
  const uri = async (file) => `data:${mime(file)};base64,${(await readFile(path.join(photos, file))).toString('base64')}`;
  const vars = reel
    ? `--h:1920px;--inset-top:335px;--dur:${seconds}s`
    : '--h:1350px;--top:110px;--bottom:120px;--fs:44px;--inset-top:44px';
  const img = await uri(s.photo);
  const lines = [...(s.title ? [`<span class="title">${s.title}</span>`] : []), ...s.lines.map((l) => `<span>${l}</span>`)].join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${CSS}</style></head>
<body class="${reel ? 'reel' : 'still'}" style="${vars}">
${reel ? `<img class="blur" src="${img}">` : ''}<div class="frame"><img class="photo" src="${img}">${s.at === 'bottom' && !reel ? '<div class="fade"></div>' : ''}</div>
${s.inset ? `<div class="inset"><img src="${await uri(s.inset)}"></div>` : ''}
${reel ? '' : `<div class="cap ${s.at}">${lines}</div>`}</body></html>`;
}

export async function buildStory({ dir, name, slides, caption, quick = quickTimings(slides.length) }) {
  const photos = path.join(dir, 'photos');
  const out = path.join(dir, 'out');
  for (const s of slides) {
    for (const file of [s.photo, s.inset].filter(Boolean)) {
      await access(path.join(photos, file)).catch(() => { throw new Error(`Missing photo: photos/${file}`); });
    }
  }
  const fontCss = await fonts();
  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, 'carousel'), { recursive: true });
  await mkdir(path.join(out, 'clips'), { recursive: true });
  const browser = await chromium.launch();
  try {
    const still = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
    for (const [i, s] of slides.entries()) {
      await still.setContent(await page(photos, fontCss, s));
      await still.evaluate(() => document.fonts.ready);
      await still.screenshot({ path: path.join(out, 'carousel', `${String(i + 1).padStart(2, '0')}.png`) });
    }
    await writeFile(path.join(out, 'caption.txt'), caption + '\n');
    console.log(`${name} carousel: ${slides.length} slides`);
    if (!(await hasFfmpeg())) return console.error('Reel skipped: ffmpeg is not installed.');
    const parts = [];
    for (const [i, s] of slides.entries()) parts.push({ html: await page(photos, fontCss, s, { reel: true, seconds: quick[i] }), seconds: quick[i] });
    await recordSequence(browser, parts, path.join(out, 'reel-10s.mp4'));
    console.log(`${name} reel: ${quick.reduce((a, b) => a + b, 0).toFixed(1)}s`);
    for (const [i, s] of slides.entries()) {
      await recordReel(browser, await page(photos, fontCss, s, { reel: true, seconds: CLIP(i) }), path.join(out, 'clips', `${String(i + 1).padStart(2, '0')}.mp4`), { seconds: CLIP(i) });
    }
    console.log(`${name} clips: ${slides.length}`);
  } finally {
    await browser.close();
  }
}

// Runs a story's build and reports a failure without a stack of unhandled rejections.
export function run(story) {
  buildStory(story).catch((err) => {
    console.error(`${story.name} build failed:`, err);
    process.exitCode = 1;
  });
}
