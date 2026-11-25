# Growthway reels

One house style for every Growthway Instagram reel. A reel is a short JSON spec made of scenes, and each scene type is a
fixed, branded layout that only takes words and numbers, so every reel looks like it came from the same studio.

```
npm run reel:growthway -- reels/growthway/specs/student-ai-gap.json
```

Out, in `reels/growthway/out/<slug>/`:
- `reel.mp4`: 1080x1920, 30fps, silent. Add a track in Instagram when posting (something calm and instrumental; trending audio helps reach).
- `cover.png`: the hook, settled. Use it as the reel cover so the grid stays consistent.
- `preview.png`: one still per scene, for a quick check before posting.
- `caption.txt`: the caption and hashtags.

## The look

- **Palette** (from the "All Growthway Logos" Canva file): forest `#153C2A`, deep `#081F15`, sage `#D1E7AE`, cream `#F8F5EE`, rust `#C4632F`.
- **Type:** Plus Jakarta Sans ExtraBold for headlines, Newsreader italic for the quiet line, JetBrains Mono for labels and sources (the `> WHY THIS MATTERS` style from the carousels).
- **Signature motion:** every scene opens out of a circle (the ring of the g); words rise out of a blur; the key phrase gets a sage marker swept under it; numbers count up; the reel ends with the g-sprout drawing itself.
- **Chrome:** story-style progress segments and the Growthway tag at the top. Text stays inside Instagram's safe zone (clear of the header, the caption and the buttons on the right).

## Scenes

Every scene takes an optional `kicker` (the mono label), `theme` (`forest`, `deep`, `sage`, `cream`, `rust`) and `seconds`.
Leave `theme` out to get the house rhythm (hook forest → stat sage → gap forest → point rust → list cream → outro deep).
In any text, wrap the key phrase in `[[double brackets]]` to give it the marker.

| type | fields | use it for |
|---|---|---|
| `hook` | `text`, `sub` (optional) | The opening line. One idea, under 10 words. |
| `stat` | `value` (integer), `prefix`, `suffix`, `label`, `source` | One number that matters. |
| `gap` | `title`, `bars` (two of `{label, value, display?}`; first is the bigger), `gapLabel`, `source` | Adoption vs. guidance, policy vs. practice: the space between two numbers. |
| `point` | `lead` (serif line), `text` | The take. Short and punchy. |
| `list` | `title`, `items` (2–4, short) | What to do about it. |
| `outro` | `tagline`, `cta` (both optional) | Always last. |

| `quote` | `text`, `name`, `role` | A pull quote: oversized quotation mark, serif text, speaker line. Quote words exactly; trim with … rather than paraphrase. Defaults to the paper look in `classic`. |
| `kinetic` | `phrases` (2–5 short phrases), `beat` (optional seconds per phrase) | Full-screen words, one phrase at a time. Good for hooks and lists of single words. `[[brackets]]` colour a word. |
| `versus` | `before` and `after` (each `{label, items}`), optional `title` | The old way appears and gets struck through, then the new way lands. |

### Narrative formats

Every reel opens with a `title` scene (dark green, logo tag, one punchy title that doubles as the Instagram cover) and
ends with the `outro`. In between, tell the story in ONE main format, and rotate formats from reel to reel. Same fonts and
palette throughout; what changes is how the information is presented.

| type | fields | the story it tells |
|---|---|---|
| `title` | `kicker` (chip), `text` (≤ ~45 characters, one `[[highlight]]`), `sub` (optional serif line) | The opener / cover. |
| `notes` | `title` (optional), `notes` (2–5; strings or `{text, hot}`), `source` | Ideas slapped onto a board as sticky notes; the `hot` one is rust. |
| `thread` | `with` (who's texting), `status`, `messages` (`{from: "them"\|"us", text}`, 3–5), `source` | A text conversation: a parent or teacher asks, we answer. Typing dots, then bubbles. |
| `mythfact` | `myth`, `verdict` (stamp, e.g. "Not quite"), `fact`, `source` | A myth card gets stamped, then flips to the fact. |
| `timeline` | `title` (optional), `events` (`{when, text, next}`, 3–5), `source` | A line draws down the screen; dated beats appear; `next: true` pulses. |
| `scorecard` | `title` (optional), `rows` (`{label, status: yes\|no\|part, note}`, 3–6), `source` | A checklist where each row gets a stamped ✓, ✗ or ~. Facts only. |
| `fineprint` | `doc` (document name and date), `quote` (exact words, ≤ ~180 characters), `note`, `source` | A document page; the exact sentence gets highlighted, the page zooms, then what it means. |
| `search` | `query` (what a parent or teacher would type), `results` (`{label, text, source}`, 1–2) | A question types into a search bar, then answer cards slide up. |

The older scene types below (`stat`, `gap`, `point`, `quote`, `versus`, `kinetic`) are supporting beats: a strong number,
a pull quote, a takeaway. `list` (numbered rows) is the least interesting way to show anything; use it at most once a week.
Scene lengths are worked out from the content; set `seconds` only to override.

### Variation

- `transition` on any scene: `ring`, `wipe`, `slide`, `cut`, `fade` or `pop`.
- Pace: set `seconds` per scene; kinetic scenes read best at 3–4 seconds.
- Key phrases are only ever highlighted with `[[double brackets]]`. There is no circle style: it clipped at the edge of the line.

A good reel is 3–5 scenes and 20–35 seconds: title → the format scene (sometimes two beats of it, or one supporting beat) → outro.

### Sound, A/B titles, carousels

- **Music:** every reel gets an original synthesised music bed (`music.mjs`: pad, plucked arpeggio, soft pulse, reverb;
  deterministic per slug). Mood follows the main format; override with `"music": "calm" | "bright" | "focus" | "none"`.
- **A/B hook test:** add `"titleB"` (and optionally `"kickerB"`); the build also makes `out/<slug>-b/` with only the title
  card changed.
- **Carousels:** `npm run carousel:growthway -- <spec>` with `"slides"` instead of `"scenes"` renders settled
  1080x1350 JPEGs (`01.jpg`…), a page counter and "Swipe →". Myth/fact shows both cards on one slide.

## Rules

- Every number on screen must come from a source you've read, and the scene shows that source.
- Write for silent viewing: the words on screen carry the whole story.
- Keep `items` to one line each where possible; a hook never wraps past four lines.
