// Upload a finished reel or carousel into the poster's approval queue.
// 1. Create the row with Supabase SQL (the daily brief does this through the Supabase connector), e.g.
//      insert into posts (account_id, kind, title, caption, source, format, hook, variant_group, variant, trial)
//      select id, 'reel', '<title>', $cap$<caption>$cap$, '<source>', '<format>', '<hook>', <uuid or null>, <'A'|'B'|null>, <trial or null>
//      from ig_accounts where handle = 'growthway.ca'
//      returning id, upload_token;
// 2. node social/queue-reel.mjs <post_id> <upload_token> <folder>
//    The folder holds reel.mp4 (+ cover.png) for a reel, or 01.jpg, 02.jpg, ... for a carousel.
// It then waits in the dashboard as "pending" until Matt approves it.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const FN = 'https://gacwxtcdzmxfvxqrrveb.supabase.co/functions/v1/ingest';
const [postId, token, dir] = process.argv.slice(2);
if (!postId || !token || !dir) { console.error('usage: queue-reel.mjs <post_id> <upload_token> <dir>'); process.exit(1); }

const names = (await readdir(dir)).filter((n) => n === 'reel.mp4' || n === 'cover.png' || /^\d{2}\.jpg$/.test(n)).sort();
if (!names.length) { console.error(`nothing to upload in ${dir}`); process.exit(1); }
const type = (n) => (n.endsWith('.mp4') ? 'video/mp4' : n.endsWith('.png') ? 'image/png' : 'image/jpeg');

async function call(action, extra = {}) {
  const r = await fetch(FN, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ post_id: postId, upload_token: token, action, ...extra }) });
  const j = await r.json();
  if (!r.ok) throw new Error(`${action}: ${j.error ?? r.status}`);
  return j;
}

const { urls } = await call('urls', { files: names });
for (const n of names) {
  const r = await fetch(urls[n].signedUrl, { method: 'PUT', headers: { 'content-type': type(n), 'x-upsert': 'true' }, body: await readFile(path.join(dir, n)) });
  if (!r.ok) throw new Error(`upload ${n}: ${r.status} ${await r.text()}`);
}
const done = await call('done');
console.log(`queued ${postId} (${names.length} files): ${done.status}`);
