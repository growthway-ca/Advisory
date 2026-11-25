# Growthway Poster

An approval queue that posts finished reels to Instagram through Meta's official API, plus nightly comp-account research.
Nothing posts until Matt approves it in the dashboard.

- **Dashboard:** https://growthway-poster.netlify.app (Netlify site `growthway-poster`, deployed from `dashboard/`)
- **Backend:** Supabase project "Growthway posting" (`gacwxtcdzmxfvxqrrveb`)

## How it fits together

```
daily brief (Tue/Fri reel) ──insert row──▶ posts: uploading ──queue-reel.mjs──▶ pending
                                                                          │  Matt: Approve & schedule (dashboard)
                                                                          ▼
pg_cron every 15 min ──▶ publisher ──▶ Instagram container ──▶ processing ──▶ published (+ permalink)
pg_cron 09:17 UTC daily ──▶ publisher {metrics} ──▶ post_metrics (views, reach, likes, saves, shares; 30 days)
pg_cron 07:43 UTC daily ──▶ research ──▶ Business Discovery ──▶ comp_snapshots + comp_media (outlier = views ÷ median)
```

| Piece | Where |
|---|---|
| Schema, grants, Vault cron key, pg_cron jobs | `supabase/migrations/001_poster_schema.sql` |
| `ingest`: one-time-token upload of reel.mp4 / cover.png | `supabase/functions/ingest` |
| `publisher`: send approved + due reels, finish processing ones, daily metrics | `supabase/functions/publisher` |
| `research`: comp accounts via Business Discovery | `supabase/functions/research` |
| Shared helpers (deployed as `common.ts` next to each function) | `supabase/functions/_shared/common.ts` |
| Dashboard (static, supabase-js, row-level security) | `dashboard/index.html` |
| Upload a reel folder into the queue | `queue-reel.mjs` |

Security: every table is admin-only (row-level security + an `admins` list). The publisher and research functions accept
only the pg_cron key (kept in Supabase Vault) or a signed-in admin. Instagram tokens are Edge Function secrets
(`IG_TOKEN_GROWTHWAY`, `IG_TOKEN_HOUSINGDATA`), never in the database or this repo. Videos are public files (Instagram
has to download them), under random IDs.

## Queue a reel (what the daily brief does)

1. Supabase SQL (through the Supabase connector):
   ```sql
   insert into posts (account_id, title, caption, source)
   select id, '<title>', $cap$<caption.txt>$cap$, 'social:this-week/<day>/reel'
   from ig_accounts where handle = 'growthway.ca'
   returning id, upload_token;
   ```
2. `node poster/queue-reel.mjs <id> <upload_token> <folder with reel.mp4 and cover.png>`

The reel then shows as **pending** in the dashboard.

## Connecting Instagram (Matt, once per account)

See `SETUP.md`.

## Redeploying

- Functions: deploy each folder's `index.ts` with `_shared/common.ts` uploaded beside it as `common.ts` (and the import
  changed to `./common.ts`), `verify_jwt` off (the functions check auth themselves).
- Dashboard: Netlify site `growthway-poster`, publish directory `dashboard/`.
