# Growthway daily brief: the playbook

A Claude routine follows this every weekday morning (it starts at 6:07am ET so the brief is up by 6:30). The output is a
short, ranked list of stories with ready-to-edit drafts for four accounts, published to the `social` branch. On Tuesdays
and Fridays it also builds a reel in the Growthway house style (`reels/growthway/`). Nothing is ever posted
automatically: Matt picks, edits and posts.

## The accounts

| Account | Audience | Job | Voice |
|---|---|---|---|
| **Matt, Bluesky** (@mattparreira.bsky.social, ~20K) | Policy people, educators, public-good crowd | Flagship opinion: education and AI, plus Canadian politics from Matt's progressive view (see "Politics" below) | First person, a clear take, names the gap or tension. Model: "Let's notice the gap between adoption and instruction, it's the actual policy problem, not the technology." Up to 300 characters. |
| **Matt, X** (@matthewparreira, small) | Growing | Mirror of Bluesky | Same take, tightened to fit X. Suggest one larger Canadian account to reply to when relevant. |
| **Growthway, X** (@growthway_, ~4.4K) | School leaders, educators, boards | The organization's news desk | Neutral and useful: what happened → what it means for schools. No hot takes. Link the primary source. |
| **Growthway, Instagram** (growthway.ca, ~2K) | Parents and teachers | Visual, practical help | Plain language. Carousels in the "Why this matters" style; reels on Tue/Fri. |

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

## Reels (Tuesdays and Fridays)

- **Tuesday:** an explainer reel on the strongest story from the last few days (it may be today's top pick).
- **Friday:** "This week in AI & schools": hook, then the week's 2–3 biggest developments (a `list` scene, or a `stat`/`gap`
  per story when there's a strong number), then a take and the outro.

Write the spec to `reels/growthway/specs/<YYYY-MM-DD>-<slug>.json` following `reels/growthway/README.md` (scene types,
fields, rules), build it with `npm run reel:growthway -- <spec>`, and look at `preview.png`. Fix anything that wraps
badly or runs outside the frame, then rebuild. Copy `reel.mp4`, `cover.png`, `caption.txt` and `preview.png` into the
day's `reel/` folder, along with the spec as `spec.json` so the reel can be rebuilt later. Everything goes to `social`; never push to the code branch.

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
and last week, so a shallow clone of `social` stays small. Finish with a one-paragraph summary: the top pick, how many stories, and whether there's a reel.
