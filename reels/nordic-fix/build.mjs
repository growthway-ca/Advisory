// The Nordic Fix: a Parreira Advisory business-fix story in the house carousel style (a photo per slide, yellow
// caption boxes). An unnamed Nordic spa already hands every guest an RFID bracelet; the fix is to let it run the hot
// stone room, the bistro tables and a guided day.
// Builds the carousel (1080x1350 PNGs), a quick 10-second reel (1080x1920) and one longer clip per slide for editing.
// Photos live in photos/NN.jpg (generated in Canva; media ids below). Run: npm run reel:nordic
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { hasFfmpeg, recordReel, recordSequence } from '../reel.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const PHOTOS = path.join(HERE, 'photos');
const FONT_DIR = path.join(HERE, '../../node_modules/@fontsource');

// Seconds each slide gets in the quick reel: a longer hold on the title, then a fast run (10s in total).
const QUICK = [1.8, ...Array(10).fill(23 / 30), 16 / 30];
// Seconds per slide in the editing clips.
const CLIP = (i) => (i === 0 ? 4 : 3);

// photo: file in photos/ (Canva media id in the comment). at: where the caption sits. lines: one yellow box each.
const SLIDES = [
  { photo: '01.jpg', at: 'bottom', title: 'The Nordic Fix', inset: '04.jpg', // MAHYnYcY4LI, inset MAHYnd7-SvE
    lines: ['I spent $500 at a Nordic spa. The best', 'tech in the building was on my wrist,', 'and it barely did anything.'] },
  { photo: '02.jpg', at: 'top', // MAHYnaj9Nrc
    lines: ['Every guest gets an RFID bracelet.', 'It opens your locker and pays at the', 'bistro. That’s all it does.'] },
  { photo: '03.jpg', at: 'top', // MAHYnRUdWFA
    lines: ['The hot stone room has 10 bays and', 'everyone wants one. Each bay has a', 'sand timer for the 15-minute limit.'] },
  { photo: '04.jpg', at: 'top', // MAHYnd7-SvE
    lines: ['Neither of mine worked. So instead', 'of resting, I lay there watching', 'the sand.'] },
  { photo: '05.jpg', at: 'top', // MAHYnUfXIsE
    lines: ['Every few minutes the door opens.', 'Someone checking for a free bay. The', 'heat and the quiet leave with them.'] },
  { photo: '06.jpg', at: 'top', // MAHYnS6dEgw
    lines: ['At the bistro you carry a number to', 'your table. Twice I heard runners', 'auction off food they couldn’t place.'] },
  { photo: '07.jpg', at: 'top', // MAHYnUgzXFU
    lines: ['$500 for two, and I left with no idea', 'what any of it did for me.'] },
  { photo: '08.jpg', at: 'top', // MAHYnWjdaA0
    lines: ['The fix is already on every wrist. A', 'board outside the stone room: green is', 'free, red is taken. Nobody opens the door.'] },
  { photo: '09.jpg', at: 'top', // MAHYnQFthvE
    lines: ['Tap in at your bay and the bracelet', 'keeps time. A gentle buzz at 15', 'minutes. No sand to watch.'] },
  { photo: '10.jpg', at: 'top', // MAHYnW7TpSQ
    lines: ['Tap the bracelet on your table. The', 'runner’s tablet shows who’s sitting', 'where. No more auctions.'] },
  { photo: '11.jpg', at: 'top', // MAHYnWWUFkE
    lines: ['Opt in and it guides first-timers', 'around the circuit and the queues, then', 'shows what the day did for them.'] },
  { photo: '12.jpg', at: 'top', // MAHYnYQy9wQ
    lines: ['Give me a business you love.', 'I’ll show you the fix hiding', 'inside it.'] },
];

async function fonts() {
  const face = async (file, weight) => {
    const data = (await readFile(path.join(FONT_DIR, 'plus-jakarta-sans/files', file))).toString('base64');
    return `@font-face{font-family:"Jakarta";src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight}}`;
  };
  return (await Promise.all([face('plus-jakarta-sans-latin-700-normal.woff2', 700), face('plus-jakarta-sans-latin-800-normal.woff2', 800)])).join('');
}

const photoUri = async (file) => `data:image/jpeg;base64,${(await readFile(path.join(PHOTOS, file))).toString('base64')}`;

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
.inset{position:absolute;left:44px;top:var(--inset-top);width:380px;height:380px;border-radius:50%;border:9px solid #ffd60a;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.45)}
.inset img{width:100%;height:100%;object-fit:cover}
/* motion (reels only): a slow push in on the photo, caption boxes land one by one */
@keyframes push{from{transform:scale(1)}to{transform:scale(1.08)}}
@keyframes land{from{opacity:0;transform:translateY(24px) scale(.96)}to{opacity:1;transform:none}}
@keyframes pop{0%{opacity:0;transform:scale(.6)}70%{opacity:1;transform:scale(1.04)}100%{transform:none}}
.reel .photo{animation:push var(--dur) linear both}
.reel .cap span{animation:land .3s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(.05s + var(--k) * .08s)}
.reel .cap .title{animation-duration:.45s}
.reel .inset{animation:pop .45s .5s both}
`;

// Reels: 1080x1920, captions kept clear of Instagram's top bar and bottom caption area. Carousel: 1080x1350.
async function page(fontCss, s, { reel = false, seconds = 3 } = {}) {
  const vars = reel
    ? `--h:1920px;--top:400px;--bottom:430px;--fs:46px;--inset-top:335px;--dur:${seconds}s`
    : '--h:1350px;--top:110px;--bottom:120px;--fs:44px;--inset-top:44px';
  const img = await photoUri(s.photo);
  const lines = [...(s.title ? [`<span class="title" style="--k:0">${s.title}</span>`] : []),
    ...s.lines.map((l, k) => `<span style="--k:${k + (s.title ? 3 : 0)}">${l}</span>`)].join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${CSS}</style></head>
<body class="${reel ? 'reel' : 'still'}" style="${vars}">
${reel ? `<img class="blur" src="${img}">` : ''}<div class="frame"><img class="photo" src="${img}">${s.at === 'bottom' ? '<div class="fade"></div>' : ''}</div>
${s.inset ? `<div class="inset"><img src="${await photoUri(s.inset)}"></div>` : ''}
<div class="cap ${s.at}">${lines}</div></body></html>`;
}

const CAPTION = `I spent $500 at a Nordic spa. The smartest thing in the building was the RFID bracelet on my wrist, and all it did was open a locker and pay for lunch.

Meanwhile: broken sand timers in the hot stone room, a door that never stops opening, and bistro runners auctioning off food they can't place.

The fix is already on every wrist. A free-bay board outside the stone room. A gentle buzz when your time is up. Tap-the-table food delivery. And an opt-in guided circuit for first-timers.

Give me a business you love. I'll show you the fix hiding inside it.

#businessideas #nordicspa #smallbusiness #customerexperience #simcoecounty`;

async function main() {
  for (const s of SLIDES) await access(path.join(PHOTOS, s.photo)).catch(() => { throw new Error(`Missing photo: photos/${s.photo}`); });
  const fontCss = await fonts();
  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(OUT, 'carousel'), { recursive: true });
  await mkdir(path.join(OUT, 'clips'), { recursive: true });
  const browser = await chromium.launch();
  try {
    const still = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
    for (const [i, s] of SLIDES.entries()) {
      await still.setContent(await page(fontCss, s));
      await still.evaluate(() => document.fonts.ready);
      await still.screenshot({ path: path.join(OUT, 'carousel', `${String(i + 1).padStart(2, '0')}.png`) });
    }
    await writeFile(path.join(OUT, 'caption.txt'), CAPTION + '\n');
    console.log(`Carousel: ${SLIDES.length} slides`);
    if (!(await hasFfmpeg())) return console.error('Reel skipped: ffmpeg is not installed.');
    const parts = [];
    for (const [i, s] of SLIDES.entries()) parts.push({ html: await page(fontCss, s, { reel: true, seconds: QUICK[i] }), seconds: QUICK[i] });
    await recordSequence(browser, parts, path.join(OUT, 'reel-10s.mp4'));
    console.log(`Reel: ${QUICK.reduce((a, b) => a + b, 0).toFixed(1)}s`);
    for (const [i, s] of SLIDES.entries()) {
      await recordReel(browser, await page(fontCss, s, { reel: true, seconds: CLIP(i) }), path.join(OUT, 'clips', `${String(i + 1).padStart(2, '0')}.mp4`), { seconds: CLIP(i) });
    }
    console.log(`Clips: ${SLIDES.length}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Nordic Fix build failed:', err);
  process.exitCode = 1;
});
