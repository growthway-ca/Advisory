// A quiet music bed for Growthway reels, synthesised from scratch (no samples, so nothing to license): a soft pad, a
// gentle plucked arpeggio and, for some moods, a low pulse, through a small reverb. Deterministic per seed, so the same
// reel always gets the same track; different reels get different keys, tempos and voicings.
// musicBed(seconds, { mood: 'calm' | 'bright' | 'focus', seed }) -> Buffer (16-bit stereo WAV, 44.1 kHz)

const SR = 44100;

function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function hashSeed(text) {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Chord progressions as semitone offsets from the key root (4 voices each).
const PROGS = {
  calm: [[0, 4, 7, 11], [-3, 0, 4, 7], [-7, -3, 0, 4], [-5, -1, 2, 7]],   // Imaj7 vi7 IVmaj7 V
  bright: [[0, 4, 7, 12], [-5, -1, 2, 7], [-3, 0, 4, 9], [-7, -3, 0, 5]], // I V vi IV
  focus: [[-3, 0, 4, 7], [-7, -3, 0, 4], [0, 4, 7, 11], [-5, -1, 2, 7]],  // vi IV I V
};

export function musicBed(seconds, { mood = 'calm', seed = 1 } = {}) {
  const r = rng(seed);
  const n = Math.ceil((seconds + 1) * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const prog = PROGS[mood] ?? PROGS.calm;
  const root = 57 + Math.floor(r() * 6);              // A3..D4
  const bpm = mood === 'bright' ? 96 + Math.floor(r() * 10) : mood === 'focus' ? 84 + Math.floor(r() * 8) : 76 + Math.floor(r() * 8);
  const beat = 60 / bpm, bar = beat * 4, chordLen = bar * 2;

  // Pad: additive soft saw (5 harmonics), slow attack and release, slight detune between channels.
  for (let c = 0; c * chordLen < seconds + 1; c++) {
    const chord = prog[c % prog.length];
    const t0 = c * chordLen, t1 = t0 + chordLen + 1.2;
    for (const off of chord) {
      const f = hz(root + off);
      for (let i = Math.floor(t0 * SR); i < Math.min(n, t1 * SR); i++) {
        const t = i / SR - t0;
        const env = Math.min(1, t / 0.9) * Math.min(1, Math.max(0, (t1 - t0 - t) / 1.2));
        let sl = 0, sr = 0;
        for (let h = 1; h <= 5; h++) {
          sl += Math.sin(2 * Math.PI * f * h * 0.9985 * t) / (h * h);
          sr += Math.sin(2 * Math.PI * f * h * 1.0015 * t + 0.7) / (h * h);
        }
        L[i] += 0.045 * env * sl; R[i] += 0.045 * env * sr;
      }
    }
  }

  // Pluck arpeggio: eighth notes walking the chord an octave up, alternating pan.
  const pattern = [0, 1, 2, 3, 2, 1, 2, 3].map((k) => (r() < 0.15 ? (k + 1) % 4 : k));
  const step = beat / 2;
  for (let k = 0; k * step < seconds; k++) {
    if (r() < (mood === 'calm' ? 0.35 : 0.15)) continue;   // leave space
    const chord = prog[Math.floor((k * step) / chordLen) % prog.length];
    const f = hz(root + chord[pattern[k % 8]] + 12);
    const start = Math.floor(k * step * SR), len = Math.floor(0.9 * SR);
    const pan = k % 2 ? 0.7 : 0.3, vel = 0.05 + r() * 0.025;
    for (let j = 0; j < len && start + j < n; j++) {
      const t = j / SR;
      const v = vel * Math.exp(-t / 0.28) * (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t));
      L[start + j] += v * (1 - pan); R[start + j] += v * pan;
    }
  }

  // Low pulse on beats 1 and 3 (bright and focus only): a soft sine thump.
  if (mood !== 'calm') {
    for (let b = 0; b * beat < seconds; b += 2) {
      const start = Math.floor(b * beat * SR);
      for (let j = 0; j < 0.3 * SR && start + j < n; j++) {
        const t = j / SR;
        const v = 0.09 * Math.exp(-t / 0.09) * Math.sin(2 * Math.PI * (48 + 40 * Math.exp(-t / 0.03)) * t);
        L[start + j] += v; R[start + j] += v;
      }
    }
  }

  // Gentle lowpass to take the edge off, then a small Schroeder reverb.
  for (const ch of [L, R]) {
    let y = 0;
    for (let i = 0; i < n; i++) { y += 0.32 * (ch[i] - y); ch[i] = y * 1.2; }
  }
  const reverb = (x, d) => {
    const out = new Float32Array(n);
    for (const [len, g] of [[1557, 0.78], [1617, 0.77], [1491, 0.79], [1422, 0.76]].map(([l, g]) => [l + d, g])) {
      const buf = new Float32Array(len); let p = 0;
      for (let i = 0; i < n; i++) { const y = buf[p]; buf[p] = x[i] + y * g; out[i] += y * 0.25; p = (p + 1) % len; }
    }
    return out;
  };
  const wl = reverb(L, 0), wr = reverb(R, 23);
  let peak = 0;
  for (let i = 0; i < n; i++) { L[i] = L[i] * 0.8 + wl[i] * 0.35; R[i] = R[i] * 0.8 + wr[i] * 0.35; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }

  // 16-bit WAV, peak-normalised to -6 dBFS (the final loudness is set when it's mixed into the reel).
  const gain = peak ? 0.5 / peak : 1;
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain)) * 32767), i * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain)) * 32767), i * 4 + 2);
  }
  const head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVE', 8); head.write('fmt ', 12);
  head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22); head.writeUInt32LE(SR, 24);
  head.writeUInt32LE(SR * 4, 28); head.writeUInt16LE(4, 32); head.writeUInt16LE(16, 34); head.write('data', 36); head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}

// Default mood from the reel's main format.
export function moodFor(scenes) {
  const main = scenes.find((s) => !['title', 'outro'].includes(s.type))?.type;
  if (['thread', 'search', 'notes'].includes(main)) return 'bright';
  if (['mythfact', 'fineprint', 'scorecard'].includes(main)) return 'focus';
  return 'calm';
}
