// The Growthway reel style: one look for every Instagram reel, whatever the content. A reel is a list of scenes;
// each scene type (hook, stat, gap, point, list, outro) is a fixed, branded layout that only takes words and numbers.
// Signature moves: the "ring reveal" cut (each scene opens out of a circle, like the ring of the g), words that rise
// out of a blur, a sage marker on the key phrase, a story-style progress bar, and the g-sprout building itself at the end.
// Colours are sampled from the "All Growthway Logos" Canva file.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FONT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../node_modules/@fontsource');

export const COLORS = { forest: '#153C2A', deep: '#081F15', pine: '#1A3326', sage: '#D1E7AE', cream: '#F8F5EE', rust: '#C4632F' };

// bg, text, accent (kicker, numbers, rules), marker (highlight fill) and markText, plus a soft glow behind the content.
export const THEMES = {
  forest: { bg: COLORS.forest, glow: '#24603f', text: COLORS.cream, accent: COLORS.sage, marker: COLORS.sage, markText: COLORS.forest, mark: COLORS.sage },
  deep: { bg: COLORS.deep, glow: '#123b28', text: COLORS.cream, accent: COLORS.sage, marker: COLORS.sage, markText: COLORS.deep, mark: COLORS.sage },
  sage: { bg: COLORS.sage, glow: '#e6f3cf', text: COLORS.forest, accent: COLORS.rust, marker: COLORS.forest, markText: COLORS.sage, mark: COLORS.forest },
  cream: { bg: COLORS.cream, glow: '#ffffff', text: COLORS.forest, accent: COLORS.rust, marker: COLORS.sage, markText: COLORS.forest, mark: COLORS.forest },
  rust: { bg: COLORS.rust, glow: '#d8834f', text: COLORS.cream, accent: COLORS.deep, marker: COLORS.cream, markText: COLORS.rust, mark: COLORS.cream },
};

// Default theme per scene type, so a spec can leave it out and still get the house rhythm.
const DEFAULT_THEME = { hook: 'forest', stat: 'sage', gap: 'forest', point: 'rust', list: 'cream', outro: 'deep' };

export async function fonts() {
  const face = async (pkg, file, family, weight, style = 'normal') => {
    const data = (await readFile(path.join(FONT_DIR, pkg, 'files', file))).toString('base64');
    return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight};font-style:${style}}`;
  };
  return (await Promise.all([
    face('plus-jakarta-sans', 'plus-jakarta-sans-latin-600-normal.woff2', 'Jakarta', 600),
    face('plus-jakarta-sans', 'plus-jakarta-sans-latin-800-normal.woff2', 'Jakarta', 800),
    face('newsreader', 'newsreader-latin-500-italic.woff2', 'Newsreader', 500, 'italic'),
    face('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2', 'Mono', 500),
  ])).join('');
}

// The g-sprout mark, traced from the Canva logo (447x447). With `build`, the ring draws itself, the bar slides out
// and the two leaves grow from the stem.
export function logo(color, { size = 64, build = false, delay = 0 } = {}) {
  const b = build ? ' build' : '';
  return `<svg class="logo${b}" style="--ld:${delay}s" width="${size}" height="${size}" viewBox="0 0 447 447" fill="none">
<circle class="ring" cx="216" cy="165" r="78" stroke="${color}" stroke-width="44" pathLength="100" transform="rotate(-90 216 165)"/>
<rect class="bar" x="214" y="61" width="113" height="44" fill="${color}"/>
<path class="leaf l" d="M107 267C177 268 217 312 217 383C147 383 107 338 107 267Z" fill="${color}"/>
<path class="leaf r" d="M332 267C262 268 222 312 222 383C292 383 332 338 332 267Z" fill="${color}"/></svg>`;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Splits a line into rising words. Text inside [[double brackets]] gets the marker.
function words(text, { start = 0, step = 0.09 } = {}) {
  let i = 0;
  return esc(text).split(/(\[\[.*?\]\])/).map((part) => {
    const marked = part.startsWith('[[');
    const html = (marked ? part.slice(2, -2) : part).split(/\s+/).filter(Boolean)
      .map((w) => `<span class="w" style="--t:${(start + step * i++).toFixed(2)}s">${w}</span>`).join(' ');
    return marked ? `<span class="mk" style="--t:${(start + step * i).toFixed(2)}s">${html}</span>` : html;
  }).join(' ');
}

const kicker = (text, t = 0.15) => (text ? `<div class="kicker" style="--t:${t}s"><span>&gt;</span> ${esc(text)}</div>` : '');
const source = (text, t) => (text ? `<div class="source" style="--t:${t}s">${esc(text)}</div>` : '');

// Number that counts up: prefix/suffix stay put, the integer animates via a registered custom property.
function counter(value, { prefix = '', suffix = '', t = 0.3, dur = 1.1 } = {}) {
  return `<div class="num" style="--to:${value};--t:${t}s;--nd:${dur}s"><span class="affix">${esc(prefix)}</span><span class="n"></span><span class="affix">${esc(suffix)}</span></div>`;
}

const SCENES = {
  hook: (s) => `<div class="content mid">${kicker(s.kicker)}<h1 class="headline">${words(s.text, { start: 0.35 })}</h1>
${s.sub ? `<p class="sub" style="--t:${0.6 + s.text.split(/\s+/).length * 0.09}s">${esc(s.sub)}</p>` : ''}</div>`,

  stat: (s) => `<div class="content mid">${kicker(s.kicker)}${counter(s.value, { prefix: s.prefix, suffix: s.suffix })}
<p class="label">${words(s.label, { start: 1.0, step: 0.07 })}</p>${source(s.source, 1.9)}</div>`,

  // Two bars and the space between them, the house way of showing "adoption is outpacing guidance".
  gap: (s) => {
    const [a, b] = s.bars;
    const bar = (x, k) => `<div class="bar-row" style="--t:${0.6 + k * 0.55}s">
<div class="bar-head"><span class="bar-label">${esc(x.label)}</span><span class="bar-val">${esc(x.display ?? `${x.value}%`)}</span></div>
<div class="track"><div class="fill ${k ? 'b' : 'a'}" style="--w:${x.value}%"></div></div></div>`;
    return `<div class="content mid">${kicker(s.kicker)}<h2 class="title">${words(s.title, { start: 0.2, step: 0.05 })}</h2>
<div class="bars">${bar(a, 0)}${bar(b, 1)}
<div class="gapmark" style="--l:${b.value}%;--r:${a.value}%"><div class="brace"></div><div class="gaptag">${esc(s.gapLabel ?? 'THE GAP')}</div></div></div>
${source(s.source, 2.6)}</div>`;
  },

  point: (s) => `<div class="content mid">${kicker(s.kicker)}<p class="serif">${words(s.lead, { start: 0.35, step: 0.08 })}</p>
<h1 class="headline punch">${words(s.text, { start: 0.8 + s.lead.split(/\s+/).length * 0.08, step: 0.1 })}</h1></div>`,

  list: (s) => `<div class="content mid">${kicker(s.kicker)}<h2 class="title">${words(s.title, { start: 0.2, step: 0.05 })}</h2>
<ol class="items">${s.items.map((x, k) => `<li style="--t:${0.8 + k * 0.7}s"><span class="ix">${String(k + 1).padStart(2, '0')}</span><span class="it">${esc(x)}</span></li>`).join('')}</ol></div>`,

  outro: (s, th) => `<div class="content center">${logo(th.mark, { size: 300, build: true, delay: 0.25 })}
<div class="wordmark" style="--t:1.35s">Growthway</div>
<p class="tagline" style="--t:1.6s">${esc(s.tagline ?? 'AI literacy for Canadian K–12 schools')}</p>
<div class="cta" style="--t:1.95s">${esc(s.cta ?? 'Follow for the weekly brief')} <span>→</span></div>
<div class="url" style="--t:2.1s">growthway.ca</div></div>`,
};

const CSS = `
@property --n{syntax:'<integer>';inherits:false;initial-value:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
body{background:var(--prev);font-family:Jakarta,sans-serif;color:var(--text)}
.scene{position:absolute;inset:0;background:var(--bg);overflow:hidden;animation:reveal .85s cubic-bezier(.7,0,.25,1) both}
.first .scene{animation:none}
@keyframes reveal{from{clip-path:circle(0% at 50% 46%)}to{clip-path:circle(75% at 50% 46%)}}
.glow{position:absolute;width:1500px;height:1500px;left:-210px;top:200px;border-radius:50%;background:radial-gradient(circle,var(--glow) 0%,transparent 62%);opacity:.75;animation:breathe var(--d) ease-in-out both}
@keyframes breathe{from{transform:scale(.92) translateY(30px)}to{transform:scale(1.08) translateY(-30px)}}
.water{position:absolute;right:-260px;bottom:180px;opacity:.07;animation:drift var(--d) linear both}
.water .logo{width:980px;height:980px}
@keyframes drift{from{transform:rotate(-10deg) translateY(40px)}to{transform:rotate(0) translateY(-40px)}}
.grain{position:absolute;inset:0;opacity:.09;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

/* chrome: progress segments and the brand tag, inside Instagram's top safe zone */
.progress{position:absolute;left:84px;right:84px;top:132px;display:flex;gap:10px}
.seg{flex:1;height:7px;border-radius:4px;background:color-mix(in srgb,var(--text) 22%,transparent);overflow:hidden}
.seg i{display:block;height:100%;background:var(--text);width:0}
.seg.done i{width:100%}
.seg.now i{animation:grow var(--d) linear both}
@keyframes grow{to{width:100%}}
.tag{position:absolute;left:84px;top:178px;display:flex;align-items:center;gap:16px;font:500 26px/1 Mono,monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--text);opacity:.9}
.cover .progress{display:none}

/* content box: clear of the IG header (top), caption and buttons (bottom, right) */
.content{position:absolute;left:84px;right:150px;top:300px;bottom:430px;display:flex;flex-direction:column;justify-content:center}
.content.center{align-items:center;text-align:center;right:84px}
.kicker{font:500 30px/1 Mono,monospace;letter-spacing:.22em;text-transform:uppercase;color:var(--accent);margin-bottom:44px;animation:fadeUp .6s var(--t) cubic-bezier(.2,.8,.2,1) both}
.kicker span{opacity:.7;margin-right:6px}
.w{display:inline-block;animation:rise .9s var(--t) cubic-bezier(.2,.8,.2,1) both}
@keyframes rise{from{opacity:0;transform:translateY(56px);filter:blur(12px)}to{opacity:1;transform:none;filter:blur(0)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
.mk{position:relative;display:inline;padding:0 .12em;margin:0 -.04em;color:var(--markText);background:linear-gradient(var(--marker),var(--marker)) no-repeat 0 92%/0% 88%;animation:marker .55s calc(var(--t) + .25s) cubic-bezier(.65,0,.35,1) both;-webkit-box-decoration-break:clone;box-decoration-break:clone;border-radius:10px}
@keyframes marker{from{background-size:0% 88%;color:var(--text)}to{background-size:100% 88%;color:var(--markText)}}
.headline{font-weight:800;font-size:112px;line-height:1.04;letter-spacing:-.035em;word-spacing:.1em}
.sub{margin-top:48px;font-weight:600;font-size:44px;line-height:1.3;opacity:.85;animation:fadeUp .7s var(--t) both}
.title{font-weight:800;font-size:72px;line-height:1.08;letter-spacing:-.03em;word-spacing:.08em;margin-bottom:64px}
.num{display:flex;align-items:baseline;font-weight:800;font-size:330px;line-height:.9;letter-spacing:-.06em;color:var(--accent);animation:fadeUp .5s var(--t) both}
.num .n{--n:0;counter-reset:n var(--n);animation:count var(--nd) var(--t) cubic-bezier(.15,.7,.25,1) both}
.num .n::after{content:counter(n)}
@keyframes count{from{--n:0}to{--n:var(--to)}}
.num .affix{font-size:.55em;letter-spacing:-.03em}
.label{margin-top:40px;font-weight:800;font-size:66px;line-height:1.12;letter-spacing:-.025em;word-spacing:.08em}
.source{margin-top:56px;font:500 26px/1.4 Mono,monospace;letter-spacing:.06em;opacity:.7;animation:fadeUp .6s var(--t) both}
.bars{position:relative;display:flex;flex-direction:column;gap:56px;padding-bottom:150px}
.bar-row{animation:fadeUp .6s var(--t) both}
.bar-head{display:flex;justify-content:space-between;align-items:baseline;gap:24px;margin-bottom:18px}
.bar-label{font-weight:600;font-size:38px;line-height:1.2;max-width:620px;opacity:.9}
.bar-val{font-weight:800;font-size:76px;letter-spacing:-.04em;color:var(--accent)}
.track{height:54px;border-radius:27px;background:color-mix(in srgb,var(--text) 12%,transparent);overflow:hidden}
.fill{height:100%;border-radius:27px;width:var(--w);transform-origin:left;animation:fill 1s calc(var(--t) + .2s) cubic-bezier(.3,.8,.2,1) both}
.fill.a{background:var(--accent)}
.fill.b{background:${COLORS.rust}}
@keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.gapmark{position:absolute;left:var(--l);width:calc(var(--r) - var(--l));bottom:0;height:130px;animation:fadeUp .6s 2.3s both}
.brace{height:34px;border:5px solid ${COLORS.rust};border-top:0;border-radius:0 0 18px 18px}
.gaptag{position:absolute;left:50%;top:56px;transform:translateX(-50%);white-space:nowrap;background:${COLORS.rust};color:${COLORS.cream};font:500 30px/1 Mono,monospace;letter-spacing:.2em;padding:16px 22px;border-radius:12px}
.serif{font:italic 500 76px/1.12 Newsreader,serif;opacity:.92;margin-bottom:36px}
.punch{font-size:124px}
.items{list-style:none;display:flex;flex-direction:column;gap:40px}
.items li{display:flex;gap:34px;align-items:flex-start;padding:34px 36px;border-radius:28px;background:color-mix(in srgb,var(--text) 7%,var(--bg));animation:slideIn .65s var(--t) cubic-bezier(.2,.8,.2,1) both}
@keyframes slideIn{from{opacity:0;transform:translateX(-70px)}to{opacity:1;transform:none}}
.ix{font:500 34px/1.5 Mono,monospace;color:var(--accent);flex:none}
.it{font-weight:800;font-size:52px;line-height:1.15;letter-spacing:-.02em;word-spacing:.08em}
.wordmark{margin-top:56px;font-weight:800;font-size:110px;letter-spacing:-.04em;animation:fadeUp .7s var(--t) both}
.tagline{margin-top:18px;font:italic 500 50px/1.25 Newsreader,serif;opacity:.85;animation:fadeUp .7s var(--t) both}
.cta{margin-top:70px;display:inline-flex;gap:14px;align-items:center;background:var(--accent);color:var(--bg);font-weight:800;font-size:42px;padding:26px 44px;border-radius:60px;animation:pop .6s var(--t) cubic-bezier(.3,1.5,.5,1) both}
@keyframes pop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}
.url{margin-top:36px;font:500 32px/1 Mono,monospace;letter-spacing:.16em;opacity:.75;animation:fadeUp .6s var(--t) both}

/* the mark building itself */
.logo.build .ring{stroke-dasharray:100;animation:draw .9s var(--ld) cubic-bezier(.6,0,.3,1) both}
@keyframes draw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
.logo.build .bar{transform-box:fill-box;transform-origin:left;animation:barOut .35s calc(var(--ld) + .8s) cubic-bezier(.3,.8,.2,1) both}
@keyframes barOut{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.logo.build .leaf{transform-box:fill-box;animation:leaf .6s calc(var(--ld) + 1s) cubic-bezier(.3,1.6,.5,1) both}
.logo.build .leaf.l{transform-origin:100% 100%}
.logo.build .leaf.r{transform-origin:0 100%;animation-delay:calc(var(--ld) + 1.12s)}
@keyframes leaf{from{transform:scale(0) rotate(-12deg)}to{transform:none}}
`;

export function sceneTheme(s) {
  return THEMES[s.theme ?? DEFAULT_THEME[s.type]];
}

// One scene as a full HTML page. `index`/`count` drive the progress bar; `prev` is the previous scene's background
// (what the ring reveal opens out of).
export function scenePage(fontCss, s, { index, count, prev, cover = false }) {
  const th = sceneTheme(s);
  if (!SCENES[s.type]) throw new Error(`Unknown scene type: ${s.type}`);
  const vars = `--bg:${th.bg};--glow:${th.glow};--text:${th.text};--accent:${th.accent};--marker:${th.marker};--markText:${th.markText};--prev:${prev ?? th.bg};--d:${s.seconds}s`;
  const segs = Array.from({ length: count }, (_, k) => `<div class="seg ${k < index ? 'done' : k === index ? 'now' : ''}"><i></i></div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${CSS}</style></head>
<body class="${index === 0 ? 'first' : ''} ${cover ? 'cover' : ''}" style="${vars}"><div class="scene">
<div class="glow"></div>${s.type === 'outro' ? '' : `<div class="water">${logo(th.mark)}</div>`}<div class="grain"></div>
<div class="progress">${segs}</div>
${s.type === 'outro' ? '' : `<div class="tag">${logo(th.text, { size: 46 })}<span>Growthway</span></div>`}
${SCENES[s.type](s, th)}
</div></body></html>`;
}
