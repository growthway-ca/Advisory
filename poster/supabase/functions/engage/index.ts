// Comments and audience timing.
//   (cron, every 2 h) {}                  -> pull new comments on our posts from the last 30 days; refresh best hours daily
//   (dashboard) {reply: {id, text}}       -> reply to a comment on Instagram, mark it replied
// Callers: pg_cron (cron key) or a signed-in dashboard admin.
import { Account, admin, authorized, cors, ensureIgId, graph, json, tokenFor } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = admin();
  if (!(await authorized(req, db))) return json({ error: "unauthorized" }, 401);
  const body = await req.json().catch(() => ({}));
  const { data: accounts } = await db.from("ig_accounts").select("id,handle,token_secret,api_host,ig_user_id,best_hours").eq("active", true);
  const byId = new Map<string, Account & { best_hours?: unknown }>((accounts ?? []).map((a) => [a.id, a as Account]));

  if (body.reply) {
    const { id, text } = body.reply;
    if (!id || !text || String(text).length > 2200) return json({ error: "id and text required" }, 400);
    const { data: c } = await db.from("comments").select("id,account_id").eq("id", id).maybeSingle();
    const a = c && byId.get(c.account_id);
    if (!a) return json({ error: "comment not found" }, 404);
    try {
      await graph(a, "POST", `${id}/replies`, { message: String(text) });
      await db.from("comments").update({ status: "replied", reply_text: String(text), replied_at: new Date().toISOString() }).eq("id", id);
      return json({ ok: true });
    } catch (e) {
      return json({ error: (e as Error).message }, 502);
    }
  }

  const log: string[] = [];
  // Token health: a cheap call per account; the error (e.g. an expired session) shows on the dashboard.
  for (const a of byId.values()) {
    if (!tokenFor(a)) continue;
    try { await graph(a, "GET", "me", { fields: "id" }); await db.from("ig_accounts").update({ last_error: null }).eq("id", a.id); }
    catch (e) { const m = (e as Error).message; await db.from("ig_accounts").update({ last_error: m }).eq("id", a.id); log.push(`${a.handle} token: ${m}`); }
  }
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data: posts } = await db.from("posts").select("id,account_id,ig_media_id,permalink").eq("status", "published").gte("published_at", since);
  for (const p of posts ?? []) {
    const a = byId.get(p.account_id);
    if (!a || !p.ig_media_id || !tokenFor(a)) continue;
    try {
      const r = await graph(a, "GET", `${p.ig_media_id}/comments`, { fields: "id,text,username,timestamp,like_count", limit: "50" });
      const rows = (r.data ?? []).filter((c: { username?: string }) => c.username && c.username !== a.handle).map((c: Record<string, unknown>) => ({
        id: c.id, account_id: a.id, post_id: p.id, ig_media_id: p.ig_media_id, permalink: p.permalink, username: c.username, text: c.text,
        posted_at: c.timestamp, like_count: c.like_count ?? 0,
      }));
      if (rows.length) await db.from("comments").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
      log.push(`${p.id}: ${rows.length} comments`);
    } catch (e) {
      log.push(`${p.id}: ${(e as Error).message}`);
    }
  }

  // Best hours to post, from when followers are online (lifetime metric, by hour). Refresh once a day.
  if (new Date().getUTCHours() < 2 || body.hours) {
    for (const a of byId.values()) {
      if (!tokenFor(a)) continue;
      try {
        const igId = await ensureIgId(db, a);
        const r = await graph(a, "GET", `${igId}/insights`, { metric: "online_followers", period: "lifetime" });
        const vals = r.data?.[0]?.values ?? [];
        const hours: Record<string, number> = {};
        for (const v of vals) for (const [h, n] of Object.entries(v.value ?? {})) hours[h] = (hours[h] ?? 0) + Number(n);
        if (Object.keys(hours).length) {
          // Stored as Instagram reports the hour buckets (0-23); the dashboard labels the time zone.
          await db.from("ig_accounts").update({ best_hours: hours }).eq("id", a.id);
          log.push(`${a.handle}: best hours updated`);
        } else log.push(`${a.handle}: no online_followers data`);
      } catch (e) {
        log.push(`${a.handle} hours: ${(e as Error).message}`);
      }
    }
  }
  return json({ ok: true, log });
});
