// Shared with the Sens project (growthway-ca/Sens, instagram/reel.mjs): same frame-by-frame recorder.
// Records a reel: loads the page, pauses every CSS animation, then steps them frame by frame and screenshots each
// frame, so the video is smooth no matter how slow the machine is. ffmpeg joins the frames into an H.264 MP4.
import { copyFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';

const run = promisify(execFile);

export async function hasFfmpeg() {
  return run('ffmpeg', ['-version']).then(() => true, () => false);
}

// Several slides in a row (a carousel as a reel): each is recorded as its own clip with its own animations,
// then the clips are joined end to end. `parts` is [{ html, seconds }].
export async function recordSequence(browser, parts, outFile, { fps = 30 } = {}) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'seq-'));
  try {
    const clips = [];
    for (const [i, p] of parts.entries()) {
      const clip = path.join(dir, `${i}.mp4`);
      await recordReel(browser, p.html, clip, { seconds: p.seconds, fps });
      clips.push(clip);
    }
    const list = path.join(dir, 'list.txt');
    await writeFile(list, clips.map((c) => `file '${c}'`).join('\n'));
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', outFile]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export async function recordReel(browser, html, outFile, { seconds = 8, fps = 30 } = {}) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const dir = await mkdtemp(path.join(os.tmpdir(), 'reel-'));
  try {
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
    const frames = Math.round(seconds * fps);
    // Once every animation has finished the picture no longer changes: copy the last frame for the hold.
    const endMs = await page.evaluate(() => Math.max(0, ...document.getAnimations().map((a) => a.effect?.getComputedTiming().endTime ?? 0)));
    const lastLive = Math.min(frames - 1, Math.ceil((endMs / 1000) * fps) + 1);
    const file = (i) => path.join(dir, `${String(i).padStart(4, '0')}.jpg`);
    for (let i = 0; i <= lastLive; i++) {
      await page.evaluate((t) => document.getAnimations().forEach((a) => (a.currentTime = t)), (i * 1000) / fps);
      await page.screenshot({ path: file(i), type: 'jpeg', quality: 92 });
    }
    for (let i = lastLive + 1; i < frames; i++) await copyFile(file(lastLive), file(i));
    await run('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, '%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20', '-movflags', '+faststart', outFile]);
  } finally {
    await page.close();
    await rm(dir, { recursive: true, force: true });
  }
}
