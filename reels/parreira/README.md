# Parreira.ca episodes

The "If I was…" format for Matt's personal account: Matt on the floor under a wall screen with grid paper, and the
screen builds the story with die-cut stickers, tape labels, counters, progress bars and source tags while he talks.
Captions run 2–3 words at a time across his chest. Scripts live on the `social` branch in `parreira/scripts/`; the idea
bank and rules are in `social/parreira-ideas.md`.

```
npm run reel:parreira -- reels/parreira/specs/<slug>.json            # stills + reel.mp4
npm run reel:parreira -- reels/parreira/specs/<slug>.json --stills   # just cover.png and preview.png, fast
```

Out, in `reels/parreira/out/<slug>/`: `reel.mp4` (1080x1920, 30fps, silent), `cover.png`, `preview.png` (one still per beat).
Until the A-roll is filmed, a silhouette stands in for Matt.

## Spec

- `cold`: the cold open. `pill` (the "If I…" label), `cards` (icon, label, x, y, rot), `tap` (which card), `tapAt`,
  `superAt`, `super` (the name that slams in), `until` (when it cuts to the floor shot).
- `zooms`: `{from, to}` punch-ins on the whole frame, for emphasis.
- `beats`: `{from, to, vo, elements}`. `vo` is split on `/` into caption chunks spread over the beat.
  Elements are positioned in % of the screen and pop in at `t`; they leave at the end of the beat unless they set `out`.
  - `sticker`: `icon` (see `icons.mjs`), `w`, `rot`, optional `label`
  - `tape`: `text`, `color` (green, yellow, red, ink), `size`, `rot`; `exit: "peel"` peels it off
  - `counter`: `value` (counts up), `suffix`, `label`, `size`
  - `bar`: `label`, `w`, `fill` (seconds to fill)
  - `source`: the small source tag; every number on screen needs one
  - `text`: short supporting line, `size`, `w`

Times come from the script. Once there's real A-roll, re-time `from`/`to` and each `t` to the actual delivery.
