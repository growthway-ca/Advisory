// Publishes a day's brief (and reel, when there is one) to the `social` branch, the same way Sens publishes its
// Instagram sets: this week's days newest first in the README, the week before under last-week/, anything older deleted.
// Usage: node social/publish.mjs <old branch dir> <today's dir> <new branch dir> <YYYY-MM-DD>
// Today's dir holds brief.md, covered.json (stories used today) and optionally reel/ (reel.mp4, cover.png, caption.txt).
import { cp, mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const [oldDir, dayDir, newDir, date] = process.argv.slice(2);
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Usage: publish.mjs <old> <today> <new> <YYYY-MM-DD>');

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const day = new Date(`${date}T12:00:00Z`);
const monday = new Date(day);
monday.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
const weekStart = monday.toISOString().slice(0, 10);
const folder = `${date}-${DOW[day.getUTCDay()]}`;
const label = (f) => new Date(`${f.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
const days = async (dir) => (existsSync(dir) ? (await readdir(dir)).filter((f) => /^\d{4}-\d{2}-\d{2}-/.test(f)).sort().reverse() : []);

await rm(newDir, { recursive: true, force: true });
await mkdir(newDir, { recursive: true });
if (existsSync(oldDir)) await cp(oldDir, newDir, { recursive: true, filter: (src) => !src.split(path.sep).includes('.git') });

// New week: this week becomes last week, and the old last week goes.
const thisWeek = path.join(newDir, 'this-week');
const lastWeek = path.join(newDir, 'last-week');
if ((await days(thisWeek)).some((f) => f.slice(0, 10) < weekStart)) {
  await rm(lastWeek, { recursive: true, force: true });
  await rename(thisWeek, lastWeek);
}
await mkdir(thisWeek, { recursive: true });
await rm(path.join(thisWeek, folder), { recursive: true, force: true });
await cp(dayDir, path.join(thisWeek, folder), { recursive: true });

// Stories already used, so tomorrow's brief doesn't repeat them. Kept for 30 days.
const coveredFile = path.join(newDir, 'covered.json');
const covered = existsSync(coveredFile) ? JSON.parse(await readFile(coveredFile, 'utf8')) : [];
const todays = existsSync(path.join(dayDir, 'covered.json')) ? JSON.parse(await readFile(path.join(dayDir, 'covered.json'), 'utf8')) : [];
await rm(path.join(thisWeek, folder, 'covered.json'), { force: true });
const cutoff = new Date(day.getTime() - 30 * 86400e3).toISOString().slice(0, 10);
const merged = [...covered.filter((c) => !todays.some((t) => t.url === c.url)), ...todays.map((t) => ({ ...t, date }))].filter((c) => c.date >= cutoff);
await writeFile(coveredFile, `${JSON.stringify(merged, null, 2)}\n`);

let md = `# Growthway daily brief\n\nA new brief every weekday by 6:30am ET, with a branded reel on Tuesdays and Fridays.
Pick what you like, edit, post. Nothing here is posted automatically.
This week's briefs stay here until Monday, then move to "Last week". After that they're deleted.\n\n## This week (from ${weekStart})\n`;
for (const f of await days(thisWeek)) {
  const dir = path.join(thisWeek, f);
  md += `\n---\n\n## ${label(f)}\n\n`;
  if (existsSync(path.join(dir, 'reel', 'reel.mp4'))) {
    md += `🎬 **Reel:** [reel.mp4](this-week/${f}/reel/reel.mp4) · [folder](this-week/${f}/reel)\n\n<img src="this-week/${f}/reel/cover.png" width="200">\n\n`;
    if (existsSync(path.join(dir, 'reel', 'caption.txt'))) md += `\`\`\`text\n${(await readFile(path.join(dir, 'reel', 'caption.txt'), 'utf8')).trim()}\n\`\`\`\n\n`;
  }
  if (existsSync(path.join(dir, 'brief.md'))) md += `${(await readFile(path.join(dir, 'brief.md'), 'utf8')).trim()}\n`;
}
const last = await days(lastWeek);
if (last.length) md += `\n---\n\n## Last week\n\n${last.map((f) => `- [${label(f)}](last-week/${f}/brief.md)${existsSync(path.join(lastWeek, f, 'reel')) ? ` · [reel](last-week/${f}/reel/reel.mp4)` : ''}`).join('\n')}\n`;
await writeFile(path.join(newDir, 'README.md'), md);
console.log(`Published ${folder} (${todays.length} stories) to ${newDir}`);
