// The Nordic Fix: a Parreira Advisory business-fix story. An unnamed Nordic spa already hands every guest an RFID
// bracelet; the fix is to let it run the hot stone room, the bistro tables and a guided day.
// Builds the carousel (1080x1350 PNGs), a quick 10-second reel (1080x1920) and one longer clip per slide for editing.
// Run: npm run reel:nordic   (needs ffmpeg; Playwright's Chromium)
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { hasFfmpeg, recordReel, recordSequence } from '../reel.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'out');
const FONT_DIR = path.join(HERE, '../../node_modules/@fontsource');

// Seconds each slide gets in the quick reel: a longer hold on the title, then a fast run (10s in total).
const QUICK = [1.8, ...Array(10).fill(23 / 30), 16 / 30];
// Seconds per slide in the editing clips.
const CLIP = (i) => (i === 0 ? 4 : 3);

async function fonts() {
  const face = async (family, file, weight, style = 'normal') => {
    const data = (await readFile(path.join(FONT_DIR, file))).toString('base64');
    return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight};font-style:${style}}`;
  };
  return (await Promise.all([
    face('Inter', 'inter/files/inter-latin-500-normal.woff2', 500),
    face('Inter', 'inter/files/inter-latin-800-normal.woff2', 800),
    face('Inter', 'inter/files/inter-latin-900-normal.woff2', 900),
    face('Newsreader', 'newsreader/files/newsreader-latin-400-normal.woff2', 400),
    face('Newsreader', 'newsreader/files/newsreader-latin-400-italic.woff2', 400, 'italic'),
  ])).join('');
}

const TREES = `<svg class="trees" viewBox="0 0 1080 260" preserveAspectRatio="none" aria-hidden="true"><path fill="#07100f" d="M0 260V170l30-60 22 40 26-90 30 80 20-50 28 70 34-120 36 110 22-60 26 70 30-100 34 90 24-40 30 60 36-130 38 120 20-50 28 60 34-90 30 80 26-60 32 70 36-140 40 130 22-50 30 60 32-100 34 90 26-40 30 50 34-120 38 110 24-60 28 70 30-80 26 60 30-40V260Z"/></svg>`;
const STEAM = `<div class="steam" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>`;

const BAND = `<svg class="band" viewBox="0 0 360 300" aria-hidden="true">
  <ellipse cx="180" cy="190" rx="150" ry="70" fill="none" stroke="#173f3a" stroke-width="40"/>
  <ellipse cx="180" cy="190" rx="150" ry="70" fill="none" stroke="#2c6b62" stroke-width="6" stroke-dasharray="4 14"/>
  <rect x="122" y="92" width="116" height="74" rx="22" fill="#ffd43b"/>
  <circle cx="180" cy="129" r="13" fill="#0b1416"/>
  <g fill="none" stroke="#ffd43b" stroke-width="9" stroke-linecap="round">
    <path class="w1" d="M152 62a40 40 0 0 1 56 0"/><path class="w2" d="M134 38a66 66 0 0 1 92 0"/><path class="w3" d="M116 14a92 92 0 0 1 128 0"/>
  </g></svg>`;

const N = 12;
const foot = (i) => `<footer><span>Parreira Advisory</span><span>${String(i + 1).padStart(2, '0')} / ${N}</span></footer>`;

const BAYS = (free) => `<div class="bays">${Array.from({ length: 10 }, (_, k) => `<i class="${free.includes(k) ? 'on' : ''}" style="--k:${k}"><b>${k + 1}</b></i>`).join('')}</div>`;

const SLIDES = [
  // 1. Title
  `<div class="title">
     ${STEAM}
     <p class="kick">A business fix · Nordic spa</p>
     <h1><span>The</span><span>Nordic</span><span>Fix</span></h1>
     <div class="hero-band">${BAND}</div>
     <p class="sub">The fix is already<br>on every guest’s wrist.</p>
     <p class="swipe">Swipe →</p>
   </div>`,
  // 2–6. What a $500 day looks like
  `<p class="kick">A $500 day for two</p>
   <h2>Every guest gets an RFID bracelet.</h2>
   <p class="body">It opens a locker. It pays at the bistro. <em>That’s all it does.</em></p>`,
  `<p class="kick">The hot stone room</p>
   <h2>10 bays. Sand timers that don’t work.</h2>
   <p class="body">Ten to fifteen minutes max, so you lie there watching the sand instead of resting.</p>`,
  `<p class="kick">The hot stone room</p>
   <h2>And the door keeps opening.</h2>
   <p class="body">Someone peeks in to check for a free bay. The heat and the quiet go out with them.</p>`,
  `<p class="kick">The bistro</p>
   <h2>“Number 47? Anyone?”</h2>
   <p class="body">Runners hunt for table numbers inside and out. Twice, food got auctioned off.</p>`,
  `<p class="kick">The end of the day</p>
   <h2>$500 later, no idea what it did for you.</h2>`,
  // 7–11. The fix
  `<p class="kick">The fix</p>
   <h2>Same bracelet. Every feature.</h2>
   ${BAND}
   <p class="body">A reader at each bay, each table, each pool and sauna.</p>`,
  `<p class="kick">Fix 1 · the stone room</p>
   <h2>Green means free.</h2>
   ${BAYS([2, 6, 9])}
   <p class="body">Tap in at your bay and it turns red on a board outside the door. No more peeking.</p>`,
  `<p class="kick">Fix 2 · the timer</p>
   <h2>A gentle buzz at 15 minutes.</h2>
   <p class="body">No sand to watch. You rest your full time, and the bay frees up on cue.</p>`,
  `<p class="kick">Fix 3 · the bistro</p>
   <h2>Tap the table. The food finds you.</h2>
   <p class="body">The runner’s tablet shows which guests are at which table. Nothing gets auctioned off.</p>`,
  `<p class="kick">Fix 4 · the guided day</p>
   <h2>“Next: feature 4.”</h2>
   <div class="list route">
     <div><b>3</b>Warm pool <span>18 min ✓</span></div>
     <div class="hi"><b>4</b>Hot stone <span>2 bays free · go now</span></div>
     <div><b>C</b>Cold plunge <span>after</span></div>
   </div>
   <p class="body">Opt in and the band walks newcomers through the circuit, around the queues. At checkout, a summary of their day.</p>`,
  // 12. Close
  `<div class="close">
     <h2>The spa already bought the hardware.<br><em>Now let it do the work.</em></h2>
     <p class="body">Parreira Advisory finds the fix hiding in the business you already have.</p>
     <p class="cta">Follow for the next fix</p>
   </div>`,
];

const CSS = `
*{box-sizing:border-box;margin:0}
html,body{width:1080px;height:var(--h);overflow:hidden}
body{--y:#ffd43b;--ice:#a9dbe6;--ink:#f4f1ea;position:relative;font-family:Inter,sans-serif;color:var(--ink);
  background:
    radial-gradient(900px 700px at 80% 8%,rgba(169,219,230,.16),transparent 65%),
    radial-gradient(700px 600px at 10% 92%,rgba(255,212,59,.07),transparent 70%),
    linear-gradient(180deg,#0e1f22 0%,#0b1416 55%,#081011 100%);
  display:grid;place-items:center}
.trees{position:absolute;left:0;right:0;bottom:0;width:100%;height:calc(var(--h) * .14);opacity:.95}
.water{position:absolute;left:0;right:0;bottom:0;height:calc(var(--h) * .05);background:linear-gradient(180deg,#0d2a2c,#061011)}
main{position:relative;z-index:2;width:100%;padding:0 96px;display:flex;flex-direction:column;gap:34px}
.kick{font-weight:500;font-size:30px;letter-spacing:.14em;text-transform:uppercase;color:var(--ice)}
h1,h2{font-weight:900;color:var(--y);letter-spacing:-.02em;line-height:.98}
h2{font-size:104px}
em{font-family:Newsreader,serif;font-weight:400;font-style:italic;letter-spacing:-.01em;color:var(--ink)}
.body{font-family:Newsreader,serif;font-size:46px;line-height:1.3;max-width:20em}
footer{position:absolute;z-index:3;left:96px;right:96px;bottom:calc(var(--safe) + 30px);display:flex;justify-content:space-between;
  font-size:24px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,241,234,.6)}
/* title */
.title{position:relative;display:flex;flex-direction:column;gap:30px}
.hero-band{position:absolute;right:-30px;top:calc(50% - 5px);width:400px;filter:drop-shadow(0 0 50px rgba(255,212,59,.45))}
.hero-band .band{width:100%}
.title::after{content:"";position:absolute;z-index:-1;right:-60px;top:30%;width:620px;height:620px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,170,60,.22),transparent)}
.title h1{display:flex;flex-direction:column;font-size:236px;line-height:.86;text-transform:uppercase;text-shadow:0 10px 60px rgba(255,212,59,.25)}
.title h1 span:first-child{font-size:110px;color:var(--ink);letter-spacing:.02em}
.title .sub{font-family:Newsreader,serif;font-style:italic;font-size:54px;line-height:1.2}
.swipe{font-size:28px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--y)}
.reel .swipe{display:none}
.steam{position:absolute;inset:-200px -100px 0;z-index:-1;pointer-events:none}
.steam i{position:absolute;bottom:-120px;width:520px;height:520px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(232,244,246,.28),transparent);filter:blur(30px)}
.steam i:nth-child(1){left:-80px}.steam i:nth-child(2){left:260px;width:640px;height:640px}.steam i:nth-child(3){left:600px}
.steam i:nth-child(4){left:80px;bottom:300px;opacity:.6}.steam i:nth-child(5){left:520px;bottom:420px;opacity:.5}
/* pieces */
.list{display:grid;gap:18px}
.list div{display:flex;align-items:center;gap:24px;font-size:44px;font-weight:800;padding:22px 28px;border-radius:20px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1)}
.band{width:440px;height:auto;align-self:center}
.bays{display:grid;grid-template-columns:repeat(5,1fr);gap:18px}
.bays i{display:grid;place-items:center;aspect-ratio:1;border-radius:24px;background:rgba(255,92,92,.16);border:3px solid #ff5c5c}
.bays i b{font-size:44px;font-weight:900;color:#ff8a8a}
.bays i.on{background:rgba(88,214,141,.18);border-color:#58d68d;box-shadow:0 0 40px rgba(88,214,141,.35)}
.bays i.on b{color:#7fe3a9}
.route div{font-size:38px;gap:22px}
.route b{display:grid;place-items:center;width:58px;height:58px;flex:none;border-radius:50%;border:3px solid var(--ice);color:var(--ice);font-size:30px}
.route span{margin-left:auto;font-size:28px;font-weight:500;color:rgba(244,241,234,.7)}
.route .hi{border-color:var(--y);background:rgba(255,212,59,.1)}
.route .hi b{background:var(--y);border-color:var(--y);color:#0b1416}
.route .hi span{color:var(--y);font-weight:800}
.close{display:flex;flex-direction:column;gap:40px}
.close h2{font-size:112px}
.cta{align-self:flex-start;font-size:34px;font-weight:800;color:#0b1416;background:var(--y);padding:20px 34px;border-radius:999px}
/* motion (reels only) */
@keyframes up{from{opacity:0;transform:translateY(46px)}to{opacity:1;transform:none}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes pop{0%{opacity:0;transform:scale(.7)}70%{opacity:1;transform:scale(1.05)}100%{transform:none}}
@keyframes rise{from{transform:translateY(160px) scale(.9);opacity:0}40%{opacity:1}to{transform:translateY(-260px) scale(1.15);opacity:.4}}
@keyframes ping{0%,100%{opacity:.25}50%{opacity:1}}
.reel .kick{animation:fade .3s both}
.reel h2{animation:up .4s .05s cubic-bezier(.2,.8,.2,1) both}
.reel .body{animation:fade .35s .25s both}
.reel .list div{animation:up .35s both;animation-delay:calc(.2s + var(--k) * .1s)}
.reel .list div:nth-child(1){--k:0}.reel .list div:nth-child(2){--k:1}.reel .list div:nth-child(3){--k:2}
.reel .bays i{animation:pop .3s both;animation-delay:calc(.15s + var(--k) * .03s)}
.reel .band{animation:pop .45s .15s both}
.reel .band .w1{animation:ping .5s .3s 3 both}.reel .band .w2{animation:ping .5s .4s 3 both}.reel .band .w3{animation:ping .5s .5s 3 both}
.reel .title .kick{animation:fade .4s .1s both}
.reel .title h1 span{animation:up .55s cubic-bezier(.2,.8,.2,1) both}
.reel .title h1 span:nth-child(1){animation-delay:.15s}.reel .title h1 span:nth-child(2){animation-delay:.3s}.reel .title h1 span:nth-child(3){animation-delay:.45s}
.reel .title .sub{animation:fade .5s .8s both}
.reel .hero-band{animation:pop .5s .55s both}
.reel .steam i{animation:rise 4s ease-out both}
.reel .steam i:nth-child(2){animation-delay:-1s}.reel .steam i:nth-child(3){animation-delay:-2s}.reel .steam i:nth-child(4){animation-delay:-2.6s}.reel .steam i:nth-child(5){animation-delay:-3.2s}
.reel .close h2{animation:up .45s .05s cubic-bezier(.2,.8,.2,1) both}
.reel .cta{animation:pop .4s .3s both}
`;

// Reels: 1080x1920 with the bottom 300px kept clear for Instagram's caption and buttons. Carousel: 1080x1350.
function page(fontCss, inner, i, { reel = false } = {}) {
  const vars = reel ? '--h:1920px;--safe:300px' : '--h:1350px;--safe:0px';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${CSS}</style></head>
<body class="${reel ? 'reel' : 'still'}" style="${vars}"><div class="water"></div>${TREES}<main>${inner}</main>${foot(i)}</body></html>`;
}

const CAPTION = `The Nordic Fix 🧖

A $500 day at a Nordic spa. Every guest wears an RFID bracelet, and all it does is open a locker and pay at the bistro. Meanwhile the hot stone room runs on broken sand timers and a door that never stops opening, and the bistro runners auction off food they cannot find a table for.

The fix is already on every wrist: a free-bay board outside the stone room, a gentle buzz when your time is up, tap-the-table food delivery, and an opt-in guided circuit that routes newcomers around the queues.

Follow for the next fix.

#businessideas #nordicspa #smallbusiness #operations #parreiraadvisory`;

async function main() {
  const fontCss = await fonts();
  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(OUT, 'carousel'), { recursive: true });
  await mkdir(path.join(OUT, 'clips'), { recursive: true });
  const browser = await chromium.launch();
  try {
    const still = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
    for (const [i, html] of SLIDES.entries()) {
      await still.setContent(page(fontCss, html, i));
      await still.evaluate(() => document.fonts.ready);
      await still.screenshot({ path: path.join(OUT, 'carousel', `${String(i + 1).padStart(2, '0')}.png`) });
    }
    await writeFile(path.join(OUT, 'caption.txt'), CAPTION + '\n');
    console.log(`Carousel: ${SLIDES.length} slides`);
    if (!(await hasFfmpeg())) return console.error('Reel skipped: ffmpeg is not installed.');
    const parts = SLIDES.map((html, i) => ({ html: page(fontCss, html, i, { reel: true }), seconds: QUICK[i] }));
    await recordSequence(browser, parts, path.join(OUT, 'reel-10s.mp4'));
    console.log(`Reel: ${QUICK.reduce((a, b) => a + b, 0).toFixed(1)}s`);
    for (const [i, p] of parts.entries()) {
      await recordReel(browser, p.html, path.join(OUT, 'clips', `${String(i + 1).padStart(2, '0')}.mp4`), { seconds: CLIP(i) });
    }
    console.log(`Clips: ${parts.length}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Nordic Fix build failed:', err);
  process.exitCode = 1;
});
