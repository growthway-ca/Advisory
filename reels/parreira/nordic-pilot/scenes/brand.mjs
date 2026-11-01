// Puts the Lumi logo onto the generated scenes (image generators can't spell it reliably, so the surfaces were left
// blank on purpose). Reads scenes/raw/NN.jpg, writes scenes/NN.jpg. Run: node reels/parreira/nordic-pilot/scenes/brand.mjs
import { existsSync } from 'node:fs';
import { copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BRAND = path.join(HERE, '../brand');
const CHROMIUM = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;

// x, y: centre of the mark on the 1080x1920 frame; w: its width. Extra CSS sits the mark into the surface.
const PLACEMENTS = {
  '06': [{ logo: 'lumi-steam', x: 562, y: 838, w: 92, css: 'opacity:.6;filter:blur(.4px)' }], // apron bib
  '07': [{ logo: 'lumi-bathhouse-steam', x: 460, y: 611, w: 300, css: 'opacity:.94;filter:drop-shadow(0 0 8px rgba(255,226,180,.28))' }], // entrance sign
  '08': [{ logo: 'lumi-steam', x: 537, y: 1150, w: 104, css: 'opacity:.7' }], // foot of the free-bay board
  '10': [{ logo: 'lumi-steam', x: 537, y: 1046, w: 84, css: 'opacity:.82;transform:translate(-50%,-50%) scaleY(.78)' }], // tap disc
  '12': [{ logo: 'lumi-spruce', x: 377, y: 1270, w: 170, css: 'opacity:.8;mix-blend-mode:multiply;filter:blur(.5px)' }], // towel
};

const uri = async (f) => `data:image/${f.endsWith('.jpg') ? 'jpeg' : 'png'};base64,${(await readFile(f)).toString('base64')}`;

async function main() {
  const browser = await chromium.launch(CHROMIUM ? { executablePath: CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  for (let n = 1; n <= 12; n++) {
    const id = String(n).padStart(2, '0');
    const src = path.join(HERE, 'raw', `${id}.jpg`);
    const out = path.join(HERE, `${id}.jpg`);
    if (!PLACEMENTS[id]) { await copyFile(src, out); continue; }
    const marks = await Promise.all(PLACEMENTS[id].map(async (m) => `<img src="${await uri(path.join(BRAND, `${m.logo}.png`))}" style="position:absolute;left:${m.x}px;top:${m.y}px;width:${m.w}px;transform:translate(-50%,-50%);${m.css}">`));
    await page.setContent(`<body style="margin:0;width:1080px;height:1920px;position:relative;overflow:hidden"><img src="${await uri(src)}" style="position:absolute;inset:0;width:1080px;height:1920px">${marks.join('')}</body>`);
    await page.screenshot({ path: out, type: 'jpeg', quality: 93 });
  }
  await browser.close();
}

main();
