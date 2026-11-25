// Nightly (pg_cron) and on demand: for each comp account, pull public stats through Instagram's
// Business Discovery API (official; works for public Business/Creator accounts), save a snapshot,
// and score each recent reel against that account's median views (outlier = views / median).
import { Account, admin, authorized, cors, ensureIgId, graph, json } from "../_shared/common.ts";

const MEDIA = "id,caption,media_product_type,timestamp,permalink,like_count,comments_count,view_count";

function median(xs: number[]) {
  const s = xs.filter((x) => x > 0).sort((a, b) => a - b);
  if (!s.length) return 0;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = admin();
  if (!(await authorized(req, db))) return json({ error: "unauthorized" }, 401);
  const log: string[] = [];
  const { data: comps } = await db.from("comp_accounts")
    .select("id,username,account:ig_accounts(id,handle,token_secret,api_host,ig_user_id)").eq("active", true);
  for (const c of comps ?? []) {
    const a = c.account as unknown as Account;
    if (a.api_host !== "graph.facebook.com") { log.push(`${c.username}: research needs a Facebook-login token`); continue; }
    try {
      const igId = await ensureIgId(db, a);
      const r = await graph(a, "GET", igId, {
        fields: `business_discovery.username(${c.username}){followers_count,media_count,media.limit(30){${MEDIA}}}`,
      });
      const bd = r.business_discovery;
      await db.from("comp_snapshots").insert({ comp_id: c.id, followers: bd.followers_count, media_count: bd.media_count });
      const media = bd.media?.data ?? [];
      const med = median(media.map((m: { view_count?: number }) => m.view_count ?? 0));
      const rows = media.map((m: Record<string, unknown>) => ({
        comp_id: c.id, ig_media_id: m.id, permalink: m.permalink, caption: m.caption, media_product_type: m.media_product_type,
        posted_at: m.timestamp, like_count: m.like_count, comments_count: m.comments_count, view_count: m.view_count ?? null,
        outlier: med && m.view_count ? Number(((m.view_count as number) / med).toFixed(2)) : null, captured_at: new Date().toISOString(),
      }));
      if (rows.length) await db.from("comp_media").upsert(rows, { onConflict: "comp_id,ig_media_id" });
      await db.from("comp_accounts").update({ last_error: null }).eq("id", c.id);
      log.push(`${c.username}: ${rows.length} posts`);
    } catch (e) {
      await db.from("comp_accounts").update({ last_error: (e as Error).message }).eq("id", c.id);
      log.push(`${c.username}: ${(e as Error).message}`);
    }
  }
  return json({ ok: true, log });
});
