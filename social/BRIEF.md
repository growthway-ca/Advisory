# Growthway daily brief: the playbook

A Claude routine follows this every weekday morning (it starts at 6:07am ET so the brief is up by 6:30). The output is a
short, ranked list of stories with ready-to-edit drafts for four accounts, published to the `social` branch. Every weekday
it also builds a Growthway reel (`reels/growthway/`) and puts it in the poster's approval queue. Nothing is ever posted
automatically: Matt approves each reel in the poster dashboard (growthway-poster.netlify.app) and picks, edits and posts
the text drafts himself.

## The accounts

| Account | Audience | Job | Voice |
|---|---|---|---|
| **Matt, Bluesky** (@mattparreira.bsky.social, ~20K) | Policy people, educators, public-good crowd | Flagship opinion: education and AI, plus Canadian politics from Matt's progressive view (see "Politics" below) | First person, a clear take, names the gap or tension. Model: "Let's notice the gap between adoption and instruction, it's the actual policy problem, not the technology." Up to 300 characters. |
| **Matt, X** (@matthewparreira, small) | Growing | Mirror of Bluesky | Same take, tightened to fit X. Suggest one larger Canadian account to reply to when relevant. |
| **Growthway, X** (@growthway_, ~4.4K) | School leaders, educators, boards | The organization's news desk | Neutral and useful: what happened → what it means for schools. No hot takes. Link the primary source. |
| **Growthway, Instagram** (growthway.ca, ~2K) | Parents and teachers | Visual, practical help | Plain language. Carousels in the "Why this matters" style; a reel every weekday. |

Read `social/positions.md` before drafting. New drafts must agree with it; if a story pushes against a position, say so
in the brief rather than quietly contradicting it.

## Scan (the last 48 hours; 72 on Mondays)

Use web search. Prefer primary sources (the ministry release, the report itself) over articles about them.

**Government and policy (highest value: few people read it)**
- Provincial ministries of education: Ontario, BC, Alberta, Quebec, Nova Scotia, Manitoba, Saskatchewan, New Brunswick, PEI, Newfoundland and Labrador. AI guidance, phones and screens, curriculum, procurement, digital literacy.
- Federal: the Minister of AI and Digital Innovation and ISED, Canada Gazette, Parliament committee hearings on AI, online harms, privacy.
- Privacy commissioners: the federal OPC and the provincial ones (IPC Ontario, BC OIPC, Alberta OIPC, CAI Québec). Student data, edtech.
- Large school boards: TDSB, Peel, York Region, Ottawa-Carleton, Vancouver, Surrey, Calgary (CBE), Edmonton (EPSB), Montreal (CSSDM). Board AI policies and votes.
- Teacher unions: ETFO, OSSTF, BCTF, ATA, CTF/FCE. Statements on AI, workload, assessment.

**Research and data:** StatCan's The Daily, People for Education, EdCan Network, CMEC, MediaSmarts, KPMG/Leger/Abacus polls; for comparison, OECD, UNESCO, Common Sense Media, Brookings.

**News:** CBC, Globe and Mail (education), The Canadian Press, The Conversation Canada, University Affairs; EdSurge and Chalkbeat for US comparisons.

**Industry:** student- or school-facing launches and policy changes from OpenAI, Google, Microsoft, Anthropic, and platforms schools use (Google Classroom, Brightspace, Microsoft Teams for Education).

Suggested queries (adapt as stories develop): `Ontario ministry of education AI`, `school board artificial intelligence policy Canada`,
`privacy commissioner students edtech`, `Canadian students AI survey`, `teachers union AI Canada`, `AI literacy curriculum Canada`,
`cellphone ban schools Canada results`, `minister of AI Canada schools`, plus a pass over each province's newsroom.

## Pick (score each candidate 0–2 on each, keep 7+)

1. **Canadian**: national 1, provincial or local 2.
2. **K-12, parents or educators**: directly about them 2.
3. **Fresh**: from the last 48 hours, or a genuinely new angle 2.
4. **A gap or tension**: adoption vs. guidance, policy vs. practice, promise vs. evidence 2.
5. **Growthway can add something**: a useful take or practical advice, not just repeating the headline 2.

Drop anything already in `covered.json` on the `social` branch unless there's real news on it. Keep 3–5 stories. On a
quiet day, 1–2 strong stories beat 5 weak ones; it's fine to say "quiet day".

## Politics (Matt · Bluesky only)

Matt's Bluesky also covers general Canadian politics from his progressive view (the list under "Matt (politics)" in
`social/positions.md`). This is a separate track from the education stories above. Growthway's accounts stay
non-partisan and never get political drafts, and Matt · X stays on education unless Matt says otherwise.

**Scan** (same window): federal, provincial and big-city elections, results, platforms and budgets; votes in Parliament
and the legislatures; and news on the issues in positions.md (health care workforce, post-secondary, child care,
income support, tax fairness, corporate influence and lobbying, housing, homelessness, addiction, food insecurity).
Primary sources first: Elections Canada and the provincial election agencies, party platforms, budget documents,
Hansard, StatCan, the PBO and provincial budget officers. Then CBC, The Canadian Press, Globe and Mail, The Narwhal, The Tyee.

**Pick** (0–2 each, keep 7+, 1–2 stories a day, none on a quiet day):
1. **Canadian**: national 1, provincial or a big city 2.
2. **Fresh**: from the window, or a genuinely new angle 2.
3. **A gap or tension**: who pays vs. who benefits, promise vs. costing, rhetoric vs. record 2.
4. **Fits Matt's views**: a clear progressive take that matches positions.md 2.
5. **Timely**: an election, a vote, a budget or a deadline this week 2.

**Rules:** argue about policies and records, not people's character. Every figure and quote has to come from a source you
opened, same as the education stories. Prefer "here's what was promised and what it costs" over slogans. When a take
would sharply criticize a government or minister Growthway deals with (an education ministry, a big board), flag it so
Matt can weigh it against Growthway's relationships.

## Write `brief.md`

~~~markdown
**Top pick:** <one line on the story to lead with today and why>

### 1. <headline in plain words> · score 9/10
<one or two sentences: what happened> · [primary source](url) · [coverage](url)
**Why it matters:** <one line, Growthway's angle>

**Matt · Bluesky**
```text
<draft>
```
**Matt · X**
```text
<draft>
```
**Growthway · X**
```text
<draft with link>
```
**Instagram** (only when the story suits it): carousel outline, 5–7 slides, one line each.

### 2. ...

## Politics (Matt · Bluesky only)

### P1. <headline in plain words> · score 8/10
<one or two sentences: what happened> · [primary source](url) · [coverage](url)

**Matt · Bluesky**
```text
<draft>
```

**Watchlist:** dates coming up (committee hearings, board votes, survey releases, consultations closing, elections).
~~~

Politics stories get one Matt · Bluesky draft each (two takes, sharper and more measured, on the strongest one) and no
Growthway or X drafts. Skip the section on a day with nothing worth 7+.

Every story gets all three text drafts (Matt · Bluesky, Matt · X, Growthway · X), even one you suggest holding. Give two takes for Matt on the top pick (one sharper, one more measured) so there's a real choice. Never invent
numbers or quotes; every figure in a draft must appear in a source you opened. Canadian spelling.

Also write `covered.json`: `[{"url": "...", "title": "..."}]` for the stories in today's brief.

## Parreira.ca episode pitches (Thursdays)

On Thursdays, add a `## Parreira.ca episode pitches` section after the politics section: three ideas for Matt's
"If I was…" video series (`social/parreira-ideas.md` has the format, rules and an idea bank). One politics, one
business (acquisition, rebrand, boring-business venture, new service or incubator), one post-secondary. Prefer ideas
hooked to this week's news; otherwise take one from the bank. For each:

~~~markdown
### "If I <did X>" · politics | business | post-secondary
**Hook:** <the cold-open line and who or what Matt taps on the board>
**Tension:** <one or two numbers, each with its source link>
**Moves:** First … / Then … / Finally …
**Screen:** <3–5 sticker or graphic cues>
~~~

Same sourcing rules as everything else: every number comes from a source you opened.

## Reels (every weekday)

- **Monday to Thursday:** an explainer reel on the strongest story from the last few days (it may be today's top pick).
  Don't repeat a story that already has a reel in `this-week/` or `last-week/`; if nothing new is strong enough, make an
  evergreen practical reel instead (a parent or teacher how-to, a "myth vs fact", a "before/after" on assessment or
  homework), still sourced.
- **Friday:** "This week in AI & schools": the week's 2–3 biggest developments told in that day's format (sticky notes,
  a timeline or a scorecard work best for a roundup), then the outro.

**Format:** every reel opens with a `title` scene (green, logo, a punchy title that works as the cover) and ends with the
`outro`. In between, tell the story in one narrative format, and never use the same format two reels in a row. Rotate
`notes`, `thread`, `mythfact`, `timeline`, `scorecard`, `fineprint`, `search` in that order, starting after the format used
in the most recent `reel/spec.json` in `this-week/` or `last-week/` on `social` (Friday's roundup can use `timeline`,
`notes` or `scorecard` when it's that format's turn, or the next of those three). Pick the angle that fits the format:
a `thread` is a parent or teacher asking the question the story raises; a `mythfact` corrects a likely misunderstanding;
`fineprint` quotes the primary source word for word. A numbered `list` scene at most once a week. Same fonts and palette
always; highlight key phrases with `[[double brackets]]`; never circle words.

Write the spec to `reels/growthway/specs/<YYYY-MM-DD>-<slug>.json` following `reels/growthway/README.md` (formats, scene
types, fields, rules), build it with `npm run reel:growthway -- <spec>`, and look at `preview.png`. Fix anything that wraps
badly or runs outside the frame, then rebuild. Copy `reel.mp4`, `cover.png`, `caption.txt` and `preview.png` into the
day's `reel/` folder (variant B's into `reel-b/`), along with the spec as `spec.json` so the reel can be rebuilt later. Everything goes to `social`;
never push to the code branch. Delete the spec from `reels/growthway/specs/` afterwards so the checkout stays clean.

**Sound:** reels get an original music bed automatically (synthesised, nothing to license). Leave it on; set
`"music": "calm" | "bright" | "focus"` in the spec only to override the mood, or `"none"` to skip it.

**Regular reel or A/B trial pair:**
- Time-sensitive news Growthway's followers need now (a vote, a deadline, a policy that changes this week), or a
  direct call to action: one **regular** reel.
- Everything else (explainers, evergreen how-tos, new formats): an **A/B hook test**. Add `"titleB"` (and optionally
  `"kickerB"`) to the spec: a genuinely different angle on the same story, not a reworded copy (a question vs. a
  number, a myth vs. a promise). The build makes `<slug>` and `<slug>-b`. Queue both as **trial reels** with
  `trial = 'SS_PERFORMANCE'` and one shared `variant_group`; Matt approves them, and the better one graduates itself.
- Aim for 2–3 regular reels a week; the rest are trial pairs.

**Queue it for approval** (after the reel is built and checked):
1. With the Supabase connector (project "Growthway posting", `gacwxtcdzmxfvxqrrveb`), insert one row per reel. For an
   A/B pair, use the same `variant_group` (e.g. from `select gen_random_uuid()`) with `variant` 'A' and 'B':
   ```sql
   insert into posts (account_id, kind, title, caption, source, format, hook, variant_group, variant, trial)
   select id, 'reel', '<short title> (<Mon d>)', $cap$<the full caption.txt>$cap$, 'social:<YYYY-MM-DD-ddd>/reel',
          '<main format: notes|thread|mythfact|timeline|scorecard|fineprint|search|list>', '<the title-card text>',
          <'<uuid>' or null>, <'A'|'B'|null>, <'SS_PERFORMANCE' or null>
   from ig_accounts where handle = 'growthway.ca'
   returning id, upload_token;
   ```
2. `node social/queue-reel.mjs <id> <upload_token> <folder>` for each (the `reel/` folder; `reel-b/` for variant B).
   It prints `queued …: pending`.
3. Mention in the summary what's waiting in the dashboard. If a step fails, say so; the files are still on `social`.

Never set a post's status to `approved` or call the publisher: approval is Matt's.

## Carousels (Mondays and Wednesdays)

When the top story has an Instagram carousel outline, also build it: write `reels/growthway/specs/<date>-<slug>-carousel.json`
with `"slides"` (title slide, 3–6 content slides in the narrative formats, then `{"type": "outro"}`; one idea per
slide), run `npm run carousel:growthway -- <spec>`, check `preview.png`, copy `01.jpg…`, `preview.png`, `caption.txt` and the
spec to the day's `carousel/` folder, and queue it like a reel with `kind = 'carousel'` and the `carousel/` folder.
Same sourcing rules. Carousels are never trial posts.

## Engagement and learning (every day, after the reel)

- **Comments:** `select id, username, text, permalink from comments where status = 'new' and draft is null order by posted_at`.
  For each, write a short, warm, specific reply draft in Growthway's voice (plain language, no hard sell, no promises
  we can't keep, nothing political) and save it: `update comments set draft = $d$...$d$ where id = '<id>'`. Skip spam
  and anything abusive (`update comments set status = 'ignored' ...`). Never send replies: Matt does, in the dashboard.
- **Borrow from the research:** run
  `select c.username, m.outlier, m.view_count, m.permalink, left(m.caption, 160) from comp_media m join comp_accounts c on c.id = m.comp_id where m.posted_at > now() - interval '14 days' and m.outlier >= 3 order by m.outlier desc limit 5`
  and add a short **"Hooks and formats to borrow"** section to the brief: what each outlier did (hook pattern, format,
  length) and how a Growthway reel could use the idea. Borrow structure, never content or wording.
- **Mondays, the weekly scorecard:** from `post_stats` (last 30 days): average views by `format`, regular vs trial,
  and each finished A/B pair's winner. Add a **"What's working"** section with 3 bullets, and let it steer the week: when
  a format clearly leads (2+ posts, about 1.5× the others), use it up to twice this week, and drop the weakest format
  for a week. Say what you changed.

## Publish

```bash
DAY=$(TZ=America/Toronto date +%F)
git fetch -q --depth 1 origin +social:refs/remotes/origin/social && mkdir -p "$TMP/old" && git archive origin/social | tar -x -C "$TMP/old"  # skip if the branch doesn't exist yet
node social/publish.mjs "$TMP/old" "$TMP/today" "$TMP/new" "$DAY"
export GIT_INDEX_FILE="$TMP/idx"; git --work-tree="$TMP/new" add -A
P=$(git rev-parse -q --verify origin/social >/dev/null && echo "-p origin/social")  # empty when social doesn't exist yet
git push origin "$(git commit-tree "$(git write-tree)" $P -m "Brief $DAY"):refs/heads/social"
```

Each run adds one commit on top of the last (a plain push, never a force push), and the tree only ever holds this week
and last week, so a shallow clone of `social` stays small. Finish with a one-paragraph summary: the top pick, how many stories, the reel (format, topic, regular or A/B trial), anything else queued, and how many reply drafts are waiting.
