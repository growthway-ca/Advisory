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

### Templates

Set `"template"` at the top of the spec to restyle the whole reel. Same palette and logo, seven different looks:

| template | look |
|---|---|
| `classic` | The house rhythm: theme per scene type, ring reveals, sage marker sweep. The default. |
| `notebook` | Ruled notebook paper on every scene, highlighter strokes on key phrases, wipe cuts. |
| `newsdesk` | Dark studio with a "LIVE · The Growthway Brief · date" bar, rust kicker chips and lower-third rules, slide cuts. Set `"date"` (YYYY-MM-DD) for the bar. |
| `bold` | Full-bleed colour blocks that alternate rust, sage, forest, cream; all-caps type that slams in; inverted blocks; hard cuts. |
| `terminal` | Dark grid, monospace type that prints on, `$` prompts, a blinking cursor, outlined list rows; hard cuts. |
| `editorial` | Magazine look: serif headlines, a rule above each block, rust underline accents, fades. |
| `cards` | Each beat on a tilted white card taped to a dotted background (forest, rust, deep), pop-in cuts. |

Scenes can still set their own `theme` or `transition` to override the template. Preview all seven quickly with
`--stills` (skips the mp4).

### Variation

- `transition` on any scene: `ring`, `wipe`, `slide`, `cut`, `fade` or `pop`.
- `theme: "paper"`: notebook paper with ruled lines and a highlighter on key phrases.
- Pace: set `seconds` per scene; kinetic scenes read best at 3–4 seconds.
- Key phrases are only ever highlighted with `[[double brackets]]` (each template draws its own marker). There is no circle
  style: it clipped at the edge of the line.

A good reel is 5–7 scenes and 25–35 seconds: hook → evidence (stat or gap) → the take (point) → what to do (list) → outro.

## Rules

- Every number on screen must come from a source you've read, and the scene shows that source.
- Write for silent viewing: the words on screen carry the whole story.
- Keep `items` to one line each where possible; a hook never wraps past four lines.
