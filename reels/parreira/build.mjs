// Builds a Parreira.ca "If I was…" episode: the screen graphics, captions and cold open, timed to the script.
// The look follows the format Matt likes: he sits on the floor under a wall screen with grid paper on it, and the
// screen builds the story with die-cut stickers, tape labels, counters and progress bars while he talks.
// Until the A-roll exists, a silhouette stands in for Matt; his footage goes in its place once it's filmed.
// Spec: reels/parreira/specs/<slug>.json. Out, in reels/parreira/out/<slug>/: reel.mp4 (1080x1920, silent),
// cover.png and preview.png (stills at each beat).
// Run: npm run reel:parreira -- reels/parreira/specs/<file>.json
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { hasFfmpeg, recordReel } from '../reel.mjs';
import { fonts } from '../growthway/style.mjs';
import { ICONS } from './icons.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CHROMIUM = process.env.PW_CHROMIUM ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

// The wall screen: everything on it is positioned in % of this box.
const SCREEN = { left: 40, top: 150, width: 1000, height: 562 };
const TAPE = { green: ['#1F7A4D', '#FFF8EC'], yellow: ['#FFC93C', '#18233A'], red: ['#D7263D', '#FFF8EC'], ink: ['#18233A', '#FFF8EC'] };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Timing for one element: pops in at `t`, leaves at `out` (the end of its beat unless it says otherwise).
const timing = (e, pop = 'pop') => `animation:${pop} .45s cubic-bezier(.2,1.4,.4,1) ${e.t}s both, ${e.exit ?? 'leave'} .3s ease-in ${e.out}s forwards;`;
const place = (e) => `left:${e.x}%;top:${e.y}%;--r:${e.rot ?? 0}deg;`;

function element(e) {
  switch (e.type) {
    case 'sticker':
      return `<div class="el sticker" style="${place(e)}width:${e.w ?? 22}%;${timing(e)}">${ICONS[e.icon]}${e.label ? `<span class="slabel">${esc(e.label)}</span>` : ''}</div>`;
    case 'tape': {
      const [bg, fg] = TAPE[e.color ?? 'green'];
      return `<div class="el tape" style="${place(e)}background:${bg};color:${fg};font-size:${e.size ?? 30}px;${timing(e, 'slap')}">${esc(e.text)}</div>`;
    }
    case 'counter':
      return `<div class="el counter" style="${place(e)}${timing(e)}"><div class="num" style="font-size:${e.size ?? 150}px;--n:${e.value};animation:count-${e.value} 1.1s ease-out ${e.t + 0.1}s both">${esc(e.suffix ?? '')}</div><div class="clabel">${esc(e.label ?? '')}</div></div>`;
    case 'bar':
      return `<div class="el bar" style="${place(e)}width:${e.w ?? 60}%;${timing(e)}"><div class="track"><div class="fill" style="animation:fill ${e.fill ?? 3}s ease-in-out ${e.t + 0.4}s both"></div></div><div class="blabel">${esc(e.label)}</div></div>`;
    case 'source':
      return `<div class="el source" style="${place(e)}${timing(e, 'fade')}">${esc(e.text)}</div>`;
    case 'text':
      return `<div class="el text" style="${place(e)}font-size:${e.size ?? 44}px;max-width:${e.w ?? 60}%;${timing(e, 'fade')}">${esc(e.text)}</div>`;
    default:
      throw new Error(`Unknown element type: ${e.type}`);
  }
}

// Captions: the beat's VO split on "/" into 2–3 word chunks, spread evenly over the beat.
function captions(beat) {
  const chunks = beat.vo.split('/').map((c) => c.trim()).filter(Boolean);
  const step = (beat.to - beat.from) / chunks.length;
  return chunks.map((c, i) => `<div class="cap" style="animation:cap ${step.toFixed(3)}s step-end ${(beat.from + i * step).toFixed(3)}s">${esc(c)}</div>`).join('');
}

// The A-roll stand-in: Matt sitting cross-legged on the floor, laptop on his lap, like the reference.
const PRESENTER = `<svg class="matt" viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="300" cy="820" rx="290" ry="70" fill="#1d1a18"/>
  <path d="M40 760 Q60 650 300 660 Q540 650 560 760 Q540 830 300 820 Q60 830 40 760Z" fill="#222327"/>
  <ellipse cx="90" cy="790" rx="70" ry="34" fill="#E9E6E0"/><ellipse cx="510" cy="790" rx="70" ry="34" fill="#E9E6E0"/>
  <path d="M150 360 Q300 300 450 360 L470 640 Q300 690 130 640Z" fill="#9DB5D3"/>
  <path d="M150 380 Q90 470 150 600 L210 590 Q180 480 210 420Z" fill="#9DB5D3"/>
  <path d="M450 380 Q510 470 450 600 L390 590 Q420 480 390 420Z" fill="#9DB5D3"/>
  <rect x="200" y="590" width="200" height="70" rx="10" fill="#111"/>
  <rect x="268" y="290" width="64" height="70" rx="20" fill="#D9A27C"/>
  <ellipse cx="300" cy="215" rx="88" ry="104" fill="#E2B08A"/>
  <path d="M212 200 Q210 100 300 96 Q392 100 388 200 Q380 150 300 146 Q220 150 212 200Z" fill="#2B1E17"/>
  <path d="M226 240 Q300 340 374 240 Q372 300 300 312 Q228 300 226 240Z" fill="#3A2A20"/>
</svg>`;

function page(fontCss, spec) {
  const beats = spec.beats.map((b) => ({ ...b, elements: (b.elements ?? []).map((e) => ({ ...e, out: e.out ?? b.to })) }));
  const els = beats.flatMap((b) => b.elements).map(element).join('');
  const counters = [...new Set(beats.flatMap((b) => b.elements).filter((e) => e.type === 'counter').map((e) => e.value))];
  const zooms = (spec.zooms ?? []).map((z) => `punch ${z.to - z.from}s step-end ${z.from}s`);
  const cold = spec.cold;
  const coldCards = cold.cards.map((c, i) => `<div class="card${i === cold.tap ? ' tapcard' : ''}" style="left:${c.x}%;top:${c.y}%;--r:${c.rot ?? 0}deg">${ICONS[c.icon]}<span>${esc(c.label)}</span></div>`).join('');
  const tapCard = cold.cards[cold.tap];
  const end = Math.max(...beats.map((b) => b.to));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontCss}
@property --n { syntax: '<integer>'; initial-value: 0; inherits: true; }
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:#2a2522;font-family:Jakarta,sans-serif}
.room{position:absolute;inset:0;transform-origin:540px 980px}
.wall{position:absolute;left:0;right:0;top:0;height:760px;background:radial-gradient(120% 90% at 50% 10%,#F1DFC6,#D8BC98 70%,#C9A982)}
.credenza{position:absolute;left:0;right:0;top:740px;height:700px;background:
  repeating-linear-gradient(90deg,rgba(0,0,0,.18) 0 3px,transparent 3px 268px),
  repeating-linear-gradient(90deg,#B98A5E 0 30px,#B4855A 30px 61px,#BC8E62 61px 97px),#B98A5E;
  box-shadow:inset 0 14px 22px rgba(0,0,0,.25)}
.credenza::before{content:"";position:absolute;left:0;right:0;top:0;height:16px;background:#9E7048}
.floor{position:absolute;left:0;right:0;top:1440px;bottom:0;background:linear-gradient(#3a332d,#211d1a)}
.tv{position:absolute;left:${SCREEN.left - 14}px;top:${SCREEN.top - 14}px;width:${SCREEN.width + 28}px;height:${SCREEN.height + 28}px;background:#1b1d21;border-radius:14px;box-shadow:0 26px 40px rgba(0,0,0,.35)}
.screen{position:absolute;left:${SCREEN.left}px;top:${SCREEN.top}px;width:${SCREEN.width}px;height:${SCREEN.height}px;overflow:hidden;border-radius:4px;
  background:linear-gradient(rgba(150,165,180,.28) 1px,transparent 1px) 0 0/28px 28px,linear-gradient(90deg,rgba(150,165,180,.28) 1px,transparent 1px) 0 0/28px 28px,#F4F2EE}
.cambar{position:absolute;left:390px;top:${SCREEN.top + SCREEN.height + 4}px;width:300px;height:40px;border-radius:20px;background:linear-gradient(#E9EBEE,#C9CDD3);box-shadow:0 6px 10px rgba(0,0,0,.25)}
.cambar::after{content:"";position:absolute;left:130px;top:4px;width:40px;height:32px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#6b7b8f,#0c1016 60%)}
.brand{position:absolute;left:0;right:0;top:${SCREEN.top + SCREEN.height + 54}px;text-align:center;font:500 18px Mono,monospace;letter-spacing:.3em;color:rgba(40,30,20,.55)}
.matt{position:absolute;left:240px;top:880px;width:600px;height:900px}
.aroll{position:absolute;left:0;right:0;top:1810px;text-align:center;font:500 18px Mono,monospace;letter-spacing:.2em;color:rgba(255,255,255,.45)}
.el{position:absolute;transform:translate(-50%,-50%) rotate(var(--r));opacity:1}
.sticker svg{display:block;width:100%;height:auto;filter:drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(0 10px 10px rgba(0,0,0,.28))}
.slabel{display:block;margin-top:8px;text-align:center;font:800 22px Jakarta;color:#18233A;text-transform:uppercase;white-space:nowrap}
.tape{padding:8px 18px;font-weight:800;text-transform:uppercase;white-space:nowrap;letter-spacing:.02em;border-radius:3px;box-shadow:0 6px 10px rgba(0,0,0,.22);
  clip-path:polygon(0 6%,3% 0,97% 4%,100% 0,99% 94%,100% 100%,2% 96%,0 100%)}
.counter{text-align:center}
.num{font-weight:800;color:#18233A;line-height:.9;letter-spacing:-.04em}
.num::before{counter-reset:n var(--n);content:counter(n)}
.clabel{margin-top:6px;font:800 26px Jakarta;color:#1F7A4D;text-transform:uppercase;max-width:440px}
.bar .track{height:44px;border-radius:22px;background:#fff;border:5px solid #18233A;overflow:hidden}
.bar .fill{height:100%;background:#1F7A4D;width:92%}
.bar .blabel{margin-top:10px;text-align:center;font:800 26px Jakarta;color:#18233A;text-transform:uppercase}
.source{font:500 19px Mono,monospace;color:#5d6673;background:rgba(255,255,255,.9);padding:5px 10px;border:1.5px solid #c9ced6;border-radius:6px;white-space:nowrap}
.text{font-weight:800;color:#18233A;text-align:center;line-height:1.1;text-transform:uppercase}
.cap{position:absolute;left:60px;right:60px;top:1330px;text-align:center;font:800 64px Jakarta;text-transform:uppercase;color:#fff;opacity:0;letter-spacing:.01em;
  text-shadow:0 0 2px #000,0 3px 0 #000,0 6px 14px rgba(0,0,0,.6);-webkit-text-stroke:2px #111;paint-order:stroke fill}
.cold{position:absolute;inset:0;animation:cut .01s step-end ${cold.until}s forwards;
  background:radial-gradient(130% 80% at 50% 30%,#D98A4E,#B4652F);overflow:hidden}
.cold::before{content:"";position:absolute;inset:0;background-image:radial-gradient(rgba(70,30,10,.25) 2px,transparent 2px);background-size:22px 22px}
.pill{position:absolute;left:50%;top:150px;transform:translateX(-50%);background:#1F7A4D;color:#fff;font:800 46px Jakarta;padding:12px 34px;border-radius:18px;border:4px solid #0d4a2c;white-space:nowrap;text-transform:uppercase}
.card{position:absolute;width:300px;padding:24px 24px 14px;background:#FFF8EC;border-radius:6px;transform:translate(-50%,-50%) rotate(var(--r));box-shadow:0 14px 24px rgba(0,0,0,.35)}
.card svg{width:100%;height:auto;display:block}
.card span{display:block;text-align:center;font:800 28px Jakarta;color:#18233A;text-transform:uppercase;margin-top:6px}
.card::before{content:"";position:absolute;left:50%;top:-12px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:#D7263D;box-shadow:0 3px 4px rgba(0,0,0,.4)}
.tapcard{animation:lift .4s ease-out ${cold.tapAt}s both}
.hand{position:absolute;width:150px;left:${tapCard.x + 6}%;top:${tapCard.y + 8}%;animation:handin .7s cubic-bezier(.2,.9,.3,1) ${cold.tapAt - 0.6}s both, press .2s ease-in-out ${cold.tapAt}s}
.hand svg{width:100%;height:auto;filter:drop-shadow(0 8px 8px rgba(0,0,0,.4))}
.super{position:absolute;left:0;right:0;top:1300px;text-align:center;font:800 150px/0.92 Jakarta;color:#FFC93C;text-transform:uppercase;letter-spacing:-.03em;
  -webkit-text-stroke:5px #3a2405;paint-order:stroke fill;text-shadow:0 10px 0 #3a2405,0 18px 30px rgba(0,0,0,.45);animation:slam .35s cubic-bezier(.2,1.6,.4,1) ${cold.superAt}s both}
@keyframes pop{0%{opacity:0;transform:translate(-50%,-50%) rotate(var(--r)) scale(.2)}70%{opacity:1;transform:translate(-50%,-50%) rotate(var(--r)) scale(1.08)}100%{opacity:1;transform:translate(-50%,-50%) rotate(var(--r)) scale(1)}}
@keyframes slap{0%{opacity:0;transform:translate(-50%,-50%) rotate(calc(var(--r) - 8deg)) scale(1.5)}100%{opacity:1;transform:translate(-50%,-50%) rotate(var(--r)) scale(1)}}
@keyframes fade{from{opacity:0;transform:translate(-50%,-40%) rotate(var(--r))}to{opacity:1;transform:translate(-50%,-50%) rotate(var(--r))}}
@keyframes leave{to{opacity:0;transform:translate(-50%,-50%) rotate(var(--r)) scale(.6)}}
@keyframes peel{to{opacity:0;transform:translate(-30%,-140%) rotate(calc(var(--r) + 25deg)) scale(.9)}}
@keyframes fill{from{width:0}to{width:92%}}
${counters.map((v) => `@keyframes count-${v}{from{--n:0}to{--n:${v}}}`).join('\n')}
@keyframes cap{0%{opacity:1;transform:scale(1.12)}6%,100%{opacity:1;transform:scale(1)}}
@keyframes punch{0%,100%{transform:scale(1.22)}}
@keyframes cut{to{opacity:0;visibility:hidden}}
@keyframes lift{to{transform:translate(-50%,-50%) rotate(0deg) scale(1.12);box-shadow:0 28px 40px rgba(0,0,0,.45)}}
@keyframes handin{from{opacity:0;transform:translate(260px,420px)}to{opacity:1;transform:none}}
@keyframes press{50%{transform:scale(.86)}}
@keyframes slam{0%{opacity:0;transform:scale(2.4)}100%{opacity:1;transform:scale(1)}}
@keyframes hold{to{opacity:1}}
</style></head><body>
<div class="room" style="${zooms.length ? `animation:${zooms.join(',')}` : ''}">
  <div class="wall"></div><div class="credenza"></div><div class="floor"></div>
  <div class="tv"></div><div class="screen">${els}</div><div class="cambar"></div>
  <div class="brand">PARREIRA.CA</div>
  ${PRESENTER}<div class="aroll">A-ROLL PLACEHOLDER · MATT ON CAMERA</div>
</div>
${beats.map(captions).join('')}
<div class="cold">
  <div class="pill">${esc(cold.pill)}</div>
  ${coldCards}
  <div class="hand">${ICONS.pointer}</div>
  <div class="super">${esc(cold.super)}</div>
</div>
<div style="position:absolute;width:1px;height:1px;animation:hold .01s linear ${end}s both"></div>
</body></html>`;
}

async function still(browser, html, file, at) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  try {
    await p.setContent(html);
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), at * 1000);
    await p.screenshot({ path: file, type: 'png' });
  } finally {
    await p.close();
  }
}

async function contactSheet(browser, files, out) {
  const imgs = await Promise.all(files.map(async (f) => `<img src="data:image/png;base64,${(await readFile(f)).toString('base64')}">`));
  const p = await browser.newPage({ viewport: { width: 1800, height: 100 } });
  try {
    await p.setContent(`<style>body{margin:0;background:#111;display:grid;grid-template-columns:repeat(6,1fr);gap:12px;padding:12px}img{width:100%;border-radius:8px}</style>${imgs.join('')}`);
    await p.screenshot({ path: out, fullPage: true });
  } finally {
    await p.close();
  }
}

async function build(browser, fontCss, specFile, { stillsOnly }) {
  const spec = JSON.parse(await readFile(specFile, 'utf8'));
  const out = path.join(HERE, 'out', spec.slug);
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });
  const html = page(fontCss, spec);
  await still(browser, html, path.join(out, 'cover.png'), spec.cold.until - 0.15);
  // One still per beat, near its end so its stickers have landed; the cold open first.
  const times = [spec.cold.until - 0.15, ...spec.beats.map((b) => Math.max(b.from + 0.2, b.to - 0.25))];
  const shots = [];
  for (const [i, t] of times.entries()) {
    const f = path.join(out, `.still-${i}.png`);
    await still(browser, html, f, t);
    shots.push(f);
  }
  await contactSheet(browser, shots, path.join(out, 'preview.png'));
  await Promise.all(shots.map((f) => rm(f)));
  if (stillsOnly) return console.log(`${spec.slug}: stills → ${path.relative(process.cwd(), out)}`);
  if (!(await hasFfmpeg())) return console.error(`${spec.slug}: video skipped, ffmpeg is not installed.`);
  const seconds = Math.max(...spec.beats.map((b) => b.to));
  await recordReel(browser, html, path.join(out, 'reel.mp4'), { seconds, fps: 30 });
  console.log(`${spec.slug}: ${spec.beats.length} beats, ${seconds}s → ${path.relative(process.cwd(), out)}`);
}

async function main() {
  const args = process.argv.slice(2);
  const stillsOnly = args.includes('--stills');
  const files = args.filter((a) => !a.startsWith('--'));
  if (!files.length) throw new Error('Usage: npm run reel:parreira -- reels/parreira/specs/<file>.json [--stills]');
  const fontCss = await fonts();
  const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
  try {
    for (const f of files) await build(browser, fontCss, f, { stillsOnly });
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Parreira reel build failed:', err);
  process.exitCode = 1;
});
