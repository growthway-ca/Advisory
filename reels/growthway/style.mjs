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
  // Notebook paper: ruled lines and a margin; the marker becomes a highlighter stroke.
  paper: { bg: '#FBF8F1', glow: '#ffffff', text: COLORS.forest, accent: COLORS.rust, marker: COLORS.sage, markText: COLORS.forest, mark: COLORS.forest, paper: true },
};

// Default theme per scene type, so a spec can leave it out and still get the house rhythm.
const DEFAULT_THEME = {
  hook: 'forest', stat: 'sage', gap: 'forest', point: 'rust', list: 'cream', outro: 'deep', quote: 'paper', kinetic: 'deep', versus: 'cream',
  title: 'forest', notes: 'forest', thread: 'deep', mythfact: 'forest', timeline: 'forest', scorecard: 'deep', fineprint: 'forest', search: 'deep',
};

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
    face('jetbrains-mono', 'jetbrains-mono-latin-700-normal.woff2', 'Mono', 700),
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

// Splits a line into rising words. Text inside [[double brackets]] gets the marker (each template styles it its own
// way: sweep, highlighter, box, underline...). There is deliberately no circle style: it clipped at line ends.
function words(text, { start = 0, step = 0.09 } = {}) {
  let i = 0;
  return esc(text).split(/(\[\[.*?\]\])/).map((part) => {
    const marked = part.startsWith('[[');
    const html = (marked ? part.slice(2, -2) : part).split(/\s+/).filter(Boolean)
      .map((w) => `<span class="w" style="--t:${(start + step * i++).toFixed(2)}s">${w}</span>`).join(' ');
    if (!marked) return html;
    return `<span class="mk" style="--t:${(start + step * i).toFixed(2)}s">${html}</span>`;
  }).join(' ');
}

const kicker = (text, t = 0.15) => (text ? `<div class="kicker" style="--t:${t}s"><span>&gt;</span> ${esc(text)}</div>` : '');
const source = (text, t) => (text ? `<div class="source" style="--t:${t}s">${esc(text)}</div>` : '');

// Number that counts up: prefix/suffix stay put, the integer animates via a registered custom property.
function counter(value, { prefix = '', suffix = '', t = 0.3, dur = 1.1 } = {}) {
  return `<div class="num" style="--to:${value};--t:${t}s;--nd:${dur}s"><span class="affix">${esc(prefix)}</span><span class="n"></span><span class="affix">${esc(suffix)}</span></div>`;
}

// Static rich text: [[double brackets]] become the marker, drawn at time t (no per-word rise).
const rich = (text, t = 0) => esc(text).replace(/\[\[(.*?)\]\]/g, (_, x) => `<span class="mk" style="--t:${(+t).toFixed(2)}s">${x}</span>`);

// Timing for the multi-beat formats, shared by the scene markup and the default scene length.
const T = {
  thread(s) {
    let t = 0.7; const beats = [];
    for (const m of s.messages) { beats.push([t, t + 0.75]); t += 0.75 + 0.6 + Math.min(1.5, m.text.length * 0.014); }
    return { beats, end: t };
  },
  search(s) { const t0 = 0.6, cps = 0.045; const tEnd = t0 + [...s.query].length * cps; return { t0, cps, tEnd, res: (k) => tEnd + 0.6 + k * 1.0 }; },
};

// Default length of a scene when the spec doesn't set seconds.
export function durationOf(s) {
  const t0 = s.title ? 0.9 : 0.4;
  switch (s.type) {
    case 'title': return 3.6;
    case 'notes': return 2 + (s.title ? 0.5 : 0) + s.notes.length * 1.25;
    case 'thread': return T.thread(s).end + 1.6;
    case 'mythfact': return (s.flipAt ?? 2.8) + 3.4;
    case 'timeline': return t0 + s.events.length * (s.step ?? 1.15) + 1.8;
    case 'scorecard': return t0 + s.rows.length * (s.step ?? 0.8) + 2;
    case 'fineprint': return (s.zoomAt ?? 2.6) + 3.6;
    case 'search': return T.search(s).res((s.results ?? []).length) + 1.8;
    default: return undefined;
  }
}

const SCENES = {
  hook: (s, th) => `<div class="content mid">${kicker(s.kicker)}<h1 class="headline">${words(s.text, { start: 0.35})}</h1>
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

  point: (s, th) => `<div class="content mid">${kicker(s.kicker)}<p class="serif">${words(s.lead, { start: 0.35, step: 0.08 })}</p>
<h1 class="headline punch">${words(s.text, { start: 0.8 + s.lead.split(/\s+/).length * 0.08, step: 0.1})}</h1></div>`,

  list: (s) => `<div class="content mid">${kicker(s.kicker)}<h2 class="title">${words(s.title, { start: 0.2, step: 0.05 })}</h2>
<ol class="items">${s.items.map((x, k) => `<li style="--t:${0.8 + k * 0.7}s"><span class="ix">${String(k + 1).padStart(2, '0')}</span><span class="it">${esc(x)}</span></li>`).join('')}</ol></div>`,

  // A pull quote: oversized quotation mark, the quote in serif, then a rule and the speaker.
  quote: (s, th) => {
    const n = s.text.split(/\s+/).length;
    const size = n > 14 ? 72 : n > 8 ? 88 : 104;
    const at = 0.5 + n * 0.08;
    return `<div class="content mid">${kicker(s.kicker)}<div class="qmark">&ldquo;</div>
<p class="quote" style="font-size:${size}px">${words(s.text, { start: 0.45, step: 0.08})}</p>
<div class="who" style="--t:${(at + 0.3).toFixed(2)}s"><i></i><div><b>${esc(s.name ?? '')}</b>${s.role ? `<span>${esc(s.role)}</span>` : ''}</div></div></div>`;
  },

  // Kinetic type: one short phrase at a time, full screen, on a beat. [[brackets]] colour a word.
  kinetic: (s) => {
    const n = s.phrases.length;
    const beat = s.beat ?? (s.seconds - 0.6) / n;
    return `<div class="content kin">${s.phrases.map((p, k) => {
      const len = p.replace(/\[\[|\]\]/g, '').length;
      const size = len <= 8 ? 230 : len <= 14 ? 170 : len <= 22 ? 128 : 100;
      const tin = (0.2 + k * beat).toFixed(2);
      const tout = (0.2 + (k + 1) * beat - 0.12).toFixed(2);
      const html = esc(p).replace(/\[\[(.*?)\]\]/g, '<em>$1</em>');
      const anim = k < n - 1 ? `kin-in .32s ${tin}s cubic-bezier(.2,1.3,.4,1) both, kin-out .16s ${tout}s ease-in forwards` : `kin-in .32s ${tin}s cubic-bezier(.2,1.3,.4,1) both`;
      return `<div class="kp" style="font-size:${size}px;animation:${anim}">${html}</div>`;
    }).join('')}</div>`;
  },

  // Before / after: the old way appears and gets struck through, then the new way lands.
  versus: (s) => {
    const col = (c, k, cls) => `<div class="vs ${cls}" style="--t:${0.3 + k * 1.6}s"><div class="vs-label">${esc(c.label)}</div>
<ul>${c.items.map((x, j) => `<li style="--t:${(0.5 + k * 1.6 + j * 0.25).toFixed(2)}s;--s:${(1.3 + j * 0.15).toFixed(2)}s">${esc(x)}</li>`).join('')}</ul></div>`;
    return `<div class="content mid">${kicker(s.kicker)}${s.title ? `<h2 class="title vs-title">${words(s.title, { start: 0.15, step: 0.05 })}</h2>` : ''}
${col(s.before, 0, 'before')}<div class="vs-arrow" style="--t:1.7s">↓</div>${col(s.after, 1, 'after')}</div>`;
  },

  // The opener: green, logo tag, one punchy title that also works as the Instagram cover.
  title: (s) => {
    const len = s.text.replace(/\[\[|\]\]/g, '').length;
    const size = len > 44 ? 104 : len > 30 ? 120 : 138;
    return `<div class="content mid">${s.kicker ? `<div class="chip" style="--t:.15s">${esc(s.kicker)}</div>` : ''}
<h1 class="titlecard" style="font-size:${size}px">${words(s.text, { start: 0.3, step: 0.07 })}</h1>
${s.sub ? `<p class="titlesub" style="--t:${(0.6 + len / 6 * 0.07).toFixed(2)}s">${esc(s.sub)}</p>` : ''}</div>`;
  },

  // Sticky notes slapped onto a board, one idea per note. A note with hot:true is the rust one.
  notes: (s) => {
    const rot = [-3, 2.5, 2, -2.5, 1.5];
    const t0 = s.title ? 0.9 : 0.4;
    const items = s.notes.map((n, k) => {
      const text = typeof n === 'string' ? n : n.text;
      const t = t0 + k * 1.25;
      return `<div class="note ${n.hot ? 'hot' : k % 2 ? 'cream' : 'sage'}" style="--t:${t.toFixed(2)}s;--r:${rot[k % rot.length]}deg"><i class="tape"></i>${rich(text, t + 0.45)}</div>`;
    }).join('');
    return `<div class="content mid">${s.title ? `<h2 class="title notes-title">${words(s.title, { start: 0.2, step: 0.05 })}</h2>` : ''}
<div class="notes n${s.notes.length}">${items}</div>${source(s.source, t0 + s.notes.length * 1.25)}</div>`;
  },

  // A text conversation: typing dots, then the bubble. from: "them" (left) or "us" (right).
  thread: (s) => {
    const { beats } = T.thread(s);
    const rows = s.messages.map((m, k) => {
      const side = m.from === 'us' ? 'us' : 'them';
      const [tt, tb] = beats[k];
      return `<div class="typing ${side}" style="--t:${tt.toFixed(2)}s"><i></i><i></i><i></i></div><div class="bub ${side}" style="--t:${tb.toFixed(2)}s">${rich(m.text, tb + 0.35)}</div>`;
    }).join('');
    return `<div class="content thread"><div class="th-head"><div class="av">${esc((s.with ?? '?').trim()[0].toUpperCase())}</div><div><b>${esc(s.with ?? '')}</b><span>${esc(s.status ?? 'now')}</span></div></div>
<div class="msgs">${rows}</div>${source(s.source, T.thread(s).end)}</div>`;
  },

  // Myth on the front of a card, stamped, then the card flips to the fact.
  mythfact: (s) => {
    const f = s.flipAt ?? 2.8;
    return `<div class="content mid mf"><div class="flip" style="--t:${f}s">
<div class="face front"><div class="mf-label myth">${esc(s.mythLabel ?? 'Myth')}</div><p class="mf-text">${rich(s.myth, 0.5)}</p><div class="stamp" style="--t:${(f - 1.1).toFixed(2)}s">${esc(s.verdict ?? 'Not quite')}</div></div>
<div class="face back"><div class="mf-label fact">${esc(s.factLabel ?? 'Fact')}</div><p class="mf-text">${rich(s.fact, f + 0.8)}</p>${s.source ? `<div class="mf-src">${esc(s.source)}</div>` : ''}</div>
</div></div>`;
  },

  // A line that draws down the screen, dated beats appear along it; next:true marks what's coming.
  timeline: (s) => {
    const step = s.step ?? 1.15, t0 = s.title ? 0.9 : 0.4, n = s.events.length;
    const evs = s.events.map((e, k) => {
      const t = t0 + 0.2 + k * step;
      return `<div class="ev${e.next ? ' next' : ''}" style="--t:${t.toFixed(2)}s"><i class="dot"></i><div class="when">${esc(e.when)}</div><div class="what">${rich(e.text, t + 0.35)}</div></div>`;
    }).join('');
    return `<div class="content mid">${s.title ? `<h2 class="title tl-title">${words(s.title, { start: 0.2, step: 0.05 })}</h2>` : ''}
<div class="tl" style="--t:${t0}s;--dur:${(n * step).toFixed(2)}s">${evs}</div>${source(s.source, t0 + n * step)}</div>`;
  },

  // A checklist of facts with a verdict stamped on each row: status yes | no | part.
  scorecard: (s) => {
    const step = s.step ?? 0.8, t0 = s.title ? 0.9 : 0.4;
    const glyph = { yes: '✓', no: '✗', part: '~' };
    const rows = s.rows.map((r, k) => {
      const t = t0 + k * step;
      return `<div class="sc-row" style="--t:${t.toFixed(2)}s"><div class="sc-l"><b>${rich(r.label, t + 0.3)}</b>${r.note ? `<span>${esc(r.note)}</span>` : ''}</div><div class="sc-v ${r.status}" style="--t:${(t + 0.35).toFixed(2)}s">${esc(r.mark ?? glyph[r.status] ?? '')}</div></div>`;
    }).join('');
    return `<div class="content mid">${s.title ? `<h2 class="title sc-title">${words(s.title, { start: 0.2, step: 0.05 })}</h2>` : ''}<div class="sc">${rows}</div>${source(s.source, t0 + s.rows.length * step)}</div>`;
  },

  // The fine print: a document page, the exact sentence highlighted, then a zoom and what it means.
  fineprint: (s) => {
    const z = s.zoomAt ?? 2.6;
    return `<div class="content mid"><div class="doc" style="--t:.3s;--z:${z}s">
<div class="doc-head">${esc(s.doc)}</div><i class="ln" style="width:94%"></i><i class="ln" style="width:82%"></i><i class="ln" style="width:89%"></i>
<p class="doc-q"><span class="hl" style="--t:${s.highlightAt ?? 1.3}s">${esc(s.quote)}</span></p>
<i class="ln" style="width:91%"></i><i class="ln" style="width:66%"></i></div>
${s.note ? `<div class="fp-note" style="--t:${(z + 0.7).toFixed(2)}s"><span class="arr">↳</span> ${rich(s.note, z + 1.1)}</div>` : ''}${source(s.source, z + 1.3)}</div>`;
  },

  // A question typed into a search bar, then answer cards slide up.
  search: (s) => {
    const { t0, cps, tEnd, res } = T.search(s);
    const chars = [...s.query].map((c, k) => `<span class="ch" style="--t:${(t0 + k * cps).toFixed(3)}s">${c === ' ' ? ' ' : esc(c)}</span>`).join('');
    const cards = (s.results ?? []).map((r, k) => {
      const t = res(k);
      return `<div class="res" style="--t:${t.toFixed(2)}s">${r.label ? `<div class="res-l">${esc(r.label)}</div>` : ''}<div class="res-t">${rich(r.text, t + 0.45)}</div>${r.source ? `<div class="res-s">${esc(r.source)}</div>` : ''}</div>`;
    }).join('');
    return `<div class="content search"><div class="sbar"><svg viewBox="0 0 48 48" width="54" height="54"><circle cx="20" cy="20" r="13" fill="none" stroke="${COLORS.forest}" stroke-width="5"/><path d="M30 30l11 11" stroke="${COLORS.forest}" stroke-width="5" stroke-linecap="round"/></svg>
<div class="q">${chars}<i class="caret" style="--t:${tEnd.toFixed(2)}s"></i></div></div><div class="results">${cards}</div></div>`;
  },

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
.scene.t-wipe{animation-name:wipe;animation-duration:.6s}
.scene.t-slide{animation-name:slide;animation-duration:.55s}
.scene.t-cut{animation:none}
@keyframes wipe{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes slide{from{transform:translateX(100%)}to{transform:none}}
.scene.paper{background-image:linear-gradient(90deg,transparent 46px,rgba(196,99,47,.35) 46px,rgba(196,99,47,.35) 49px,transparent 49px),repeating-linear-gradient(transparent 0 78px,rgba(21,60,42,.09) 78px 80px)}
.scene.paper .grain{opacity:.14}
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

/* quote */
.qmark{font:italic 500 420px/0.6 Newsreader,serif;color:var(--accent);opacity:.9;height:190px;padding-top:150px;margin-bottom:30px;animation:fadeUp .5s .2s both}
.quote{font:italic 500 96px/1.12 Newsreader,serif;letter-spacing:-.01em}
.who{display:flex;gap:28px;align-items:center;margin-top:64px;animation:fadeUp .6s var(--t) both}
.who i{display:block;width:90px;height:5px;background:var(--accent);border-radius:3px}
.who b{display:block;font-weight:800;font-size:44px;letter-spacing:-.02em}
.who span{display:block;margin-top:8px;font:500 26px/1.3 Mono,monospace;letter-spacing:.08em;text-transform:uppercase;opacity:.75}

/* kinetic */
.content.kin{right:84px}
.kp{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);font-weight:800;line-height:.98;letter-spacing:-.045em;text-align:left}
.kp em{font-style:normal;color:var(--accent)}
@keyframes kin-in{from{opacity:0;transform:translateY(-50%) scale(1.25)}to{opacity:1;transform:translateY(-50%) scale(1)}}
@keyframes kin-out{from{opacity:1}to{opacity:0;transform:translateY(-50%) scale(.92)}}

/* versus */
.vs-title{margin-bottom:44px}
.vs{border-radius:30px;padding:44px 46px;animation:fadeUp .6s var(--t) both}
.vs.before{background:color-mix(in srgb,var(--text) 7%,var(--bg))}
.vs.after{background:var(--accent);color:var(--bg)}
.vs-label{font:500 32px/1 Mono,monospace;letter-spacing:.22em;text-transform:uppercase;opacity:.8;margin-bottom:22px}
.vs ul{list-style:none;display:flex;flex-direction:column;gap:14px}
.vs li{font-weight:800;font-size:60px;line-height:1.15;letter-spacing:-.02em;animation:fadeUp .5s var(--t) both}
.vs.before li{position:relative;width:fit-content;opacity:.75}
.vs.before li::after{content:"";position:absolute;left:-4px;right:-4px;top:54%;height:6px;border-radius:3px;background:${COLORS.rust};transform-origin:left;animation:strike .35s var(--s) cubic-bezier(.6,0,.3,1) both}
@keyframes strike{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.vs-arrow{font-weight:800;font-size:80px;line-height:1;text-align:center;margin:18px 0;color:var(--accent);animation:fadeUp .4s var(--t) both}

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



// The narrative formats.
const FORMAT_CSS = `
.board{background-image:radial-gradient(color-mix(in srgb,var(--text) 15%,transparent) 2.5px,transparent 2.5px);background-size:44px 44px}

/* title */
.chip{align-self:flex-start;background:var(--accent);color:var(--bg);font:500 30px/1 Mono,monospace;letter-spacing:.2em;text-transform:uppercase;padding:16px 22px;border-radius:10px;margin-bottom:52px;animation:pop .5s var(--t) cubic-bezier(.3,1.5,.5,1) both}
.titlecard{font-weight:800;line-height:.98;letter-spacing:-.045em;word-spacing:.08em}
.titlesub{margin-top:48px;font:italic 500 58px/1.2 Newsreader,serif;opacity:.9;animation:fadeUp .7s var(--t) both}

/* notes */
.notes-title{margin-bottom:60px}
.notes{display:flex;flex-wrap:wrap;gap:40px 34px;justify-content:space-between}
.note{position:relative;width:calc(50% - 17px);min-height:340px;padding:62px 36px 40px;font-weight:800;font-size:46px;line-height:1.12;letter-spacing:-.02em;color:${COLORS.forest};border-radius:6px;box-shadow:0 26px 50px rgba(0,0,0,.3);transform:rotate(var(--r));animation:stick .55s var(--t) cubic-bezier(.2,1.25,.4,1) both}
.note.sage{background:${COLORS.sage}}.note.cream{background:${COLORS.cream}}.note.hot{background:${COLORS.rust};color:${COLORS.cream}}
.notes.n1 .note,.notes.n3 .note:last-child,.notes.n5 .note:last-child{width:100%;min-height:250px}
.note{--text:${COLORS.forest}}.note.hot{--text:${COLORS.cream}}
.note .mk{--marker:${COLORS.forest};--markText:${COLORS.cream}}
.note.hot .mk{--marker:${COLORS.deep};--markText:${COLORS.cream}}
.tape{position:absolute;top:-22px;left:50%;width:150px;height:46px;margin-left:-75px;background:rgba(248,245,238,.6);transform:rotate(-3deg);box-shadow:0 2px 6px rgba(0,0,0,.08)}
@keyframes stick{from{opacity:0;transform:translateY(-150px) scale(1.2) rotate(calc(var(--r) + 10deg))}to{opacity:1;transform:rotate(var(--r))}}

/* thread */
.content.thread{display:flex;flex-direction:column;justify-content:flex-start}
.th-head{display:flex;align-items:center;gap:26px;padding-bottom:30px;margin-bottom:10px;border-bottom:2px solid color-mix(in srgb,var(--text) 18%,transparent);animation:fadeUp .5s .1s both}
.av{width:92px;height:92px;border-radius:50%;background:${COLORS.sage};color:${COLORS.forest};display:grid;place-items:center;font-weight:800;font-size:44px}
.th-head b{display:block;font-weight:800;font-size:44px;letter-spacing:-.02em}
.th-head > div > span{display:block;margin-top:6px;font:500 24px/1 Mono,monospace;letter-spacing:.14em;text-transform:uppercase;opacity:.6}
.msgs{flex:1;display:flex;flex-direction:column;justify-content:flex-start;overflow:hidden}
.bub{max-width:82%;padding:30px 36px;border-radius:42px;font-weight:600;font-size:44px;line-height:1.24;margin-top:24px;color:${COLORS.deep};animation:bubIn .38s var(--t) cubic-bezier(.3,1.4,.5,1) both}
.bub.them{align-self:flex-start;background:${COLORS.cream};border-bottom-left-radius:10px;transform-origin:left bottom}
.bub.us{align-self:flex-end;background:${COLORS.sage};border-bottom-right-radius:10px;transform-origin:right bottom}
.bub{--text:${COLORS.deep}}
.bub .mk{--marker:${COLORS.forest};--markText:${COLORS.cream}}
@keyframes bubIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
.typing{display:flex;gap:12px;align-items:center;border-radius:42px;padding:0 34px;background:${COLORS.cream};overflow:hidden;animation:typing .75s var(--t) both}
.typing.them{align-self:flex-start}.typing.us{align-self:flex-end;background:${COLORS.sage}}
.typing i{width:18px;height:18px;border-radius:50%;background:${COLORS.forest};opacity:.45}
@keyframes typing{0%{max-height:0;opacity:0;padding-top:0;padding-bottom:0;margin-top:0}15%,85%{max-height:100px;opacity:1;padding-top:32px;padding-bottom:32px;margin-top:24px}100%{max-height:0;opacity:0;padding-top:0;padding-bottom:0;margin-top:0}}

/* myth / fact */
.mf{perspective:2600px}
.flip{position:relative;height:900px;transform-style:preserve-3d;animation:flipCard .8s var(--t) cubic-bezier(.6,0,.3,1) both}
@keyframes flipCard{from{transform:rotateY(0)}to{transform:rotateY(180deg)}}
.face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:40px;padding:70px 62px;display:flex;flex-direction:column;justify-content:center;color:${COLORS.forest};box-shadow:0 34px 90px rgba(0,0,0,.3)}
.face.front{background:${COLORS.cream};animation:fadeUp .6s .2s both}
.face.back{background:${COLORS.sage};transform:rotateY(180deg)}
.mf-label{align-self:flex-start;font:500 32px/1 Mono,monospace;letter-spacing:.24em;text-transform:uppercase;padding:14px 20px;border-radius:8px;margin-bottom:46px}
.myth{background:${COLORS.rust};color:${COLORS.cream}}.fact{background:${COLORS.forest};color:${COLORS.sage}}
.mf-text{font-weight:800;font-size:66px;line-height:1.1;letter-spacing:-.025em}
.face{--text:${COLORS.forest}}
.face .mk{--marker:${COLORS.forest};--markText:${COLORS.cream}}
.mf-src{margin-top:46px;font:500 26px/1.4 Mono,monospace;opacity:.7}
.stamp{position:absolute;right:52px;bottom:76px;border:8px solid ${COLORS.rust};color:${COLORS.rust};font:700 44px/1 Mono,monospace;letter-spacing:.1em;text-transform:uppercase;padding:18px 26px;border-radius:10px;transform:rotate(-8deg);animation:stamp .35s var(--t) cubic-bezier(.3,1.6,.5,1) both}
@keyframes stamp{from{opacity:0;transform:rotate(-8deg) scale(2.3)}to{opacity:1;transform:rotate(-8deg) scale(1)}}

/* timeline */
.tl-title,.sc-title{margin-bottom:58px}
.tl{position:relative;padding-left:78px;display:flex;flex-direction:column;gap:50px}
.tl::before{content:"";position:absolute;left:14px;top:16px;bottom:16px;width:6px;border-radius:3px;background:var(--accent);transform-origin:top;animation:line var(--dur) var(--t) linear both}
@keyframes line{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.ev{position:relative;animation:slideIn .55s var(--t) cubic-bezier(.2,.8,.2,1) both}
.ev .dot{position:absolute;left:-78px;top:4px;width:36px;height:36px;border-radius:50%;background:var(--bg);border:7px solid var(--accent)}
.ev.next .dot{background:${COLORS.rust};border-color:${COLORS.rust};animation:pulse 1.3s calc(var(--t) + .4s) ease-out infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(196,99,47,.65)}100%{box-shadow:0 0 0 34px rgba(196,99,47,0)}}
.when{font:500 30px/1 Mono,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.what{font-weight:800;font-size:50px;line-height:1.14;letter-spacing:-.02em}

/* scorecard */
.sc{display:flex;flex-direction:column}
.sc-row{display:flex;align-items:center;gap:30px;padding:32px 0;border-bottom:2px solid color-mix(in srgb,var(--text) 16%,transparent);animation:fadeUp .5s var(--t) both}
.sc-l{flex:1}
.sc-l b{display:block;font-weight:800;font-size:50px;line-height:1.12;letter-spacing:-.02em}
.sc-l > span{display:block;margin-top:10px;font:500 26px/1.35 Mono,monospace;opacity:.7}
.sc-v{flex:none;width:108px;height:108px;border-radius:24px;display:grid;place-items:center;font-weight:800;font-size:66px;animation:stampIn .35s var(--t) cubic-bezier(.3,1.6,.5,1) both}
.sc-v.yes{background:${COLORS.sage};color:${COLORS.deep}}.sc-v.no{background:${COLORS.rust};color:${COLORS.cream}}.sc-v.part{border:6px solid ${COLORS.sage};color:${COLORS.sage}}
@keyframes stampIn{from{opacity:0;transform:scale(2) rotate(-12deg)}to{opacity:1;transform:none}}

/* fine print */
.doc{background:#FBF8F1;color:${COLORS.deep};border-radius:14px;padding:56px 54px;box-shadow:0 30px 80px rgba(0,0,0,.35);transform:rotate(-1deg);transform-origin:50% 55%;animation:docIn .6s var(--t) both,zoomDoc 1s var(--z) cubic-bezier(.6,0,.3,1) forwards}
@keyframes docIn{from{opacity:0;transform:translateY(90px) rotate(-1deg)}to{opacity:1;transform:rotate(-1deg)}}
@keyframes zoomDoc{from{transform:rotate(-1deg) scale(1)}to{transform:rotate(0deg) scale(1.06)}}
.doc-head{font:500 24px/1.35 Mono,monospace;letter-spacing:.12em;text-transform:uppercase;opacity:.6;padding-bottom:26px;margin-bottom:30px;border-bottom:2px solid rgba(8,31,21,.15)}
.ln{display:block;height:20px;border-radius:10px;background:rgba(8,31,21,.11);margin:22px 0}
.doc-q{font-weight:600;font-size:50px;line-height:1.3;margin:36px 0;letter-spacing:-.01em}
.hl{background:linear-gradient(${COLORS.sage},${COLORS.sage}) no-repeat 0 88%/0% 78%;-webkit-box-decoration-break:clone;box-decoration-break:clone;padding:0 .08em;animation:hlSweep 1.1s var(--t) cubic-bezier(.5,0,.3,1) both}
@keyframes hlSweep{to{background-size:100% 78%}}
.fp-note{margin-top:64px;font-weight:800;font-size:60px;line-height:1.1;letter-spacing:-.025em;animation:fadeUp .6s var(--t) both}
.fp-note .arr{color:var(--accent)}

/* search */
.content.search{justify-content:flex-start;padding-top:70px}
.sbar{display:flex;align-items:center;gap:26px;background:${COLORS.cream};color:${COLORS.deep};border-radius:64px;padding:32px 42px;box-shadow:0 20px 50px rgba(0,0,0,.3);animation:fadeUp .5s .1s both}
.sbar svg{flex:none}
.q{font-weight:600;font-size:44px;line-height:1.25}
.ch{opacity:0;animation:typeOn .01s var(--t) steps(1) forwards}
@keyframes typeOn{to{opacity:1}}
.caret{display:inline-block;width:5px;height:50px;vertical-align:middle;background:${COLORS.rust};margin-left:4px;opacity:0;animation:typeOn .01s var(--t) forwards,blink 1s calc(var(--t) + .02s) steps(1) infinite}
.results{margin-top:64px;display:flex;flex-direction:column;gap:32px}
.res{background:color-mix(in srgb,var(--text) 8%,var(--bg));border-radius:30px;padding:42px 44px;animation:slideUp .55s var(--t) cubic-bezier(.2,.8,.2,1) both}
@keyframes slideUp{from{opacity:0;transform:translateY(90px)}to{opacity:1;transform:none}}
.res-l{font:500 26px/1 Mono,monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);margin-bottom:20px}
.res-t{font-weight:800;font-size:52px;line-height:1.14;letter-spacing:-.02em}
.res-s{margin-top:22px;font:500 24px/1.35 Mono,monospace;opacity:.65}
`;

// Extra transitions and the notebook highlighter.
const EXTRA_CSS = `
.scene.t-fade{animation:fadeScene .7s ease both}
@keyframes fadeScene{from{opacity:0}to{opacity:1}}
.scene.t-pop{animation:popScene .55s cubic-bezier(.3,1.35,.5,1) both}
@keyframes popScene{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:none}}
.paper .mk{--marker:rgba(209,231,174,.95);color:var(--text);border-radius:6px 18px 8px 16px;padding:0 .14em;background-position:0 78%;background-size:0% 62%;animation-name:hilite}
@keyframes hilite{from{background-size:0% 62%}to{background-size:100% 62%}}
@keyframes blink{50%{opacity:0}}
`;

export function sceneTheme(s) {
  return THEMES[s.theme ?? DEFAULT_THEME[s.type]];
}

// One scene as a full HTML page. `index`/`count` drive the progress bar; `prev` is the previous scene's background
// (what the reveal opens out of).
export function scenePage(fontCss, s, { index, count, prev, cover = false }) {
  const th = sceneTheme(s);
  if (!SCENES[s.type]) throw new Error(`Unknown scene type: ${s.type}`);
  const vars = `--bg:${th.bg};--glow:${th.glow};--text:${th.text};--accent:${th.accent};--marker:${th.marker};--markText:${th.markText};--prev:${prev ?? th.bg};--d:${s.seconds}s`;
  const segs = Array.from({ length: count }, (_, k) => `<div class="seg ${k < index ? 'done' : k === index ? 'now' : ''}"><i></i></div>`).join('');
  const board = ['notes', 'timeline', 'mythfact', 'fineprint'].includes(s.type) ? ' board' : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}${CSS}${EXTRA_CSS}${FORMAT_CSS}</style></head>
<body class="${index === 0 ? 'first' : ''} ${cover ? 'cover' : ''}" style="${vars}"><div class="scene t-${s.transition ?? 'ring'}${th.paper ? ' paper' : ''}${board} s-${s.type}">
<div class="glow"></div>${s.type === 'outro' ? '' : `<div class="water">${logo(th.mark)}</div>`}<div class="grain"></div>
<div class="progress">${segs}</div>
${s.type === 'outro' ? '' : `<div class="tag">${logo(th.text, { size: 46 })}<span>Growthway</span></div>`}
${SCENES[s.type](s, th)}
</div></body></html>`;
}
