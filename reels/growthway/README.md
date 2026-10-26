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

A good reel is 5–7 scenes and 18–28 seconds: hook → evidence (stat or gap) → the take (point) → what to do (list) → outro.

## Rules

- Every number on screen must come from a source you've read, and the scene shows that source.
- Write for silent viewing: the words on screen carry the whole story.
- Keep `items` to one line each where possible; a hook never wraps past four lines.
