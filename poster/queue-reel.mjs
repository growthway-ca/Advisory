// Upload a finished reel into the approval queue.
// 1. Create the row with Supabase SQL (the daily brief does this through the Supabase connector):
//      insert into posts (account_id, title, caption, source)
//      select id, '<title>', '<caption>', '<source>' from ig_accounts where handle = 'growthway.ca'
//      returning id, upload_token;
// 2. node poster/queue-reel.mjs <post_id> <upload_token> <folder with reel.mp4 [and cover.png]>
// The reel then waits in the dashboard as "pending" until Matt approves it.
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';

const FN = 'https://gacwxtcdzmxfvxqrrveb.supabase.co/functions/v1/ingest';
const [postId, token, dir] = process.argv.slice(2);
if (!postId || !token || !dir) { console.error('usage: queue-reel.mjs <post_id> <upload_token> <dir>'); process.exit(1); }

async function call(action) {
  const r = await fetch(FN, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ post_id: postId, upload_token: token, action }) });
  const j = await r.json();
  if (!r.ok) throw new Error(`${action}: ${j.error ?? r.status}`);
  return j;
}
async function put(url, file, type) {
  const r = await fetch(url, { method: 'PUT', headers: { 'content-type': type, 'x-upsert': 'true' }, body: await readFile(file) });
  if (!r.ok) throw new Error(`upload ${path.basename(file)}: ${r.status} ${await r.text()}`);
}

const urls = await call('urls');
await put(urls.video.signedUrl, path.join(dir, 'reel.mp4'), 'video/mp4');
const cover = path.join(dir, 'cover.png');
if (await access(cover).then(() => true, () => false)) await put(urls.cover.signedUrl, cover, 'image/png');
const done = await call('done');
console.log(`queued ${postId}: ${done.status}`);
