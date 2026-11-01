// Lumi Bath House logo: lowercase "lumi" in Newsreader with a curl of steam in place of the i's dot.
// Renders transparent PNGs in each brand colour, plus a sheet for review. Run: node reels/parreira/nordic-pilot/brand/logo.mjs
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONT = path.join(HERE, '../../../../node_modules/@fontsource/newsreader/files/newsreader-latin-500-normal.woff2');
const CHROMIUM = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
export const COLORS = { spruce: '#1F3A33', steam: '#F4F1EA', cedar: '#C08A4E', slate: '#3B4246' };

// The steam: one thin S-curve rising from where the dot of the i would sit.
const curl = (c) => `<svg class="curl" viewBox="0 0 40 90" fill="none"><path d="M20 86 C 6 70, 34 58, 20 42 S 8 16, 24 4" stroke="${c}" stroke-width="7" stroke-linecap="round"/></svg>`;

export async function logoHtml(color, { sub = false, bg = 'transparent' } = {}) {
  const font = (await readFile(FONT)).toString('base64');
  return `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:N;src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:500}
html,body{margin:0;background:${bg}}
.mark{display:inline-flex;flex-direction:column;align-items:center;padding:40px 60px;color:${color}}
.word{font:500 260px/1 N,serif;letter-spacing:-.01em;position:relative}
.i{position:relative;display:inline-block}
.curl{position:absolute;left:50%;transform:translateX(-50%);bottom:.6em;width:.2em;height:.42em}
.sub{margin-top:18px;font:500 34px/1 N,serif;letter-spacing:.42em;text-transform:uppercase;padding-left:.42em}
</style><div class="mark"><div class="word">lum<span class="i">ı${curl(color)}</span></div>${sub ? '<div class="sub">Bath House</div>' : ''}</div>`;
}

async function main() {
  const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  for (const [name, c] of Object.entries(COLORS)) {
    for (const sub of [false, true]) {
      await page.setContent(await logoHtml(c, { sub }));
      await page.evaluate(() => document.fonts.ready);
      await page.locator('.mark').screenshot({ path: path.join(HERE, `lumi${sub ? '-bathhouse' : ''}-${name}.png`), omitBackground: true });
    }
  }
  // Review sheet: the mark on each background it's meant for.
  const tiles = [['spruce', 'steam'], ['steam', 'spruce'], ['cedar', 'spruce'], ['spruce', 'cedar']];
  const font = (await readFile(FONT)).toString('base64');
  const imgs = await Promise.all(tiles.map(async ([fg, bg]) => `<div style="background:${COLORS[bg]};display:flex;align-items:center;justify-content:center;height:420px"><img style="height:220px" src="data:image/png;base64,${(await readFile(path.join(HERE, `lumi-bathhouse-${fg}.png`))).toString('base64')}"></div>`));
  await page.setViewportSize({ width: 1200, height: 840 });
  await page.setContent(`<body style="margin:0;display:grid;grid-template-columns:1fr 1fr">${imgs.join('')}</body>`);
  await page.screenshot({ path: path.join(HERE, 'sheet.png') });
  await browser.close();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
