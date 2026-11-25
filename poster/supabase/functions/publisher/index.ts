// Runs every 15 minutes (pg_cron) and on demand from the dashboard.
// 1. Finishes reels already sent to Instagram (container processing -> publish).
// 2. Sends approved reels whose time has come.
// 3. With {"metrics": true} (daily), records views/reach/likes/... for reels posted in the last 30 days.
// Nothing here posts a reel that isn't status 'approved': approval only happens in the dashboard.
import { Account, admin, authorized, cors, ensureIgId, graph, json, tokenFor } from "../_shared/common.ts";

const PUBLIC = `${Deno.env.get("SUPABASE_URL")}/storage/v1/object/public/reels/`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = admin();
  if (!(await authorized(req, db))) return json({ error: "unauthorized" }, 401);
  const opts = await req.json().catch(() => ({}));
  const log: string[] = [];

  const { data: accounts } = await db.from("ig_accounts").select("id,handle,token_secret,api_host,ig_user_id").eq("active", true);
  const byId = new Map<string, Account>((accounts ?? []).map((a) => [a.id, a as Account]));

  // 1. Containers in progress
  const { data: inflight } = await db.from("posts").select("id,account_id,container_id,updated_at").eq("status", "publishing");
  for (const p of inflight ?? []) {
    const a = byId.get(p.account_id);
    if (!a) continue;
    if (!p.container_id) {
      // Claimed but never sent (a crashed run): put it back in line after 10 minutes.
      if (Date.now() - new Date(p.updated_at).getTime() > 10 * 60 * 1000)
        await db.from("posts").update({ status: "approved" }).eq("id", p.id).eq("status", "publishing").is("container_id", null);
      continue;
    }
    try {
      const st = await graph(a, "GET", p.container_id, { fields: "status_code,status" });
      if (st.status_code === "FINISHED") {
        const igId = await ensureIgId(db, a);
        const pub = await graph(a, "POST", `${igId}/media_publish`, { creation_id: p.container_id });
        const m = await graph(a, "GET", pub.id, { fields: "permalink" }).catch(() => ({}));
        await db.from("posts").update({ status: "published", ig_media_id: pub.id, permalink: m.permalink ?? null, published_at: new Date().toISOString(), error: null }).eq("id", p.id);
        log.push(`published ${p.id}`);
      } else if (st.status_code === "ERROR" || st.status_code === "EXPIRED") {
        await db.from("posts").update({ status: "failed", error: `Instagram processing ${st.status_code}: ${st.status ?? ""}` }).eq("id", p.id);
        log.push(`failed ${p.id}`);
      } else if (Date.now() - new Date(p.updated_at).getTime() > 60 * 60 * 1000) {
        await db.from("posts").update({ status: "failed", error: "Instagram still processing after an hour" }).eq("id", p.id);
      }
    } catch (e) {
      await db.from("posts").update({ error: String((e as Error).message) }).eq("id", p.id);
      log.push(`error ${p.id}: ${(e as Error).message}`);
    }
  }

  // 2. Approved and due
  const { data: due } = await db.from("posts").select("id,account_id,kind,media,caption,video_path,cover_path,attempts,location_id,trial")
    .eq("status", "approved").lte("scheduled_for", new Date().toISOString()).order("scheduled_for").limit(5);
  for (const p of due ?? []) {
    const a = byId.get(p.account_id);
    if (!a || (p.kind === "carousel" ? !p.media?.length : !p.video_path)) continue;
    if (!tokenFor(a)) { log.push(`waiting ${p.id}: no ${a.token_secret} secret yet`); continue; }
    // Claim the post so two overlapping runs can't send it twice.
    const { data: claimed } = await db.from("posts").update({ status: "publishing", container_id: null })
      .eq("id", p.id).eq("status", "approved").select("id");
    if (!claimed?.length) continue;
    try {
      const igId = await ensureIgId(db, a);
      let params: Record<string, string>;
      if (p.kind === "carousel") {
        // One image container per slide (JPEG only), then the carousel container.
        const children: string[] = [];
        for (const path of p.media as string[]) {
          const ch = await graph(a, "POST", `${igId}/media`, { image_url: PUBLIC + path, is_carousel_item: "true" });
          children.push(ch.id);
        }
        params = { media_type: "CAROUSEL", children: children.join(","), caption: p.caption ?? "" };
      } else {
        params = { media_type: "REELS", video_url: PUBLIC + p.video_path, caption: p.caption ?? "" };
        if (p.cover_path) params.cover_url = PUBLIC + p.cover_path;
        // Trial reels are shown to non-followers first; MANUAL = graduate in the app, SS_PERFORMANCE = auto if it does well.
        if (p.trial) params.trial_params = JSON.stringify({ graduation_strategy: p.trial });
        else params.share_to_feed = "true";
      }
      if (p.location_id) params.location_id = p.location_id;
      const c = await graph(a, "POST", `${igId}/media`, params);
      await db.from("posts").update({ status: "publishing", container_id: c.id, attempts: p.attempts + 1, error: null }).eq("id", p.id);
      log.push(`sent ${p.id}`);
    } catch (e) {
      const msg = (e as Error).message;
      const failed = p.attempts + 1 >= 3;
      await db.from("posts").update({ attempts: p.attempts + 1, error: msg, status: failed ? "failed" : "approved" }).eq("id", p.id);
      await db.from("ig_accounts").update({ last_error: msg }).eq("id", a.id);
      log.push(`error ${p.id}: ${msg}`);
    }
  }

  // 3. Metrics
  if (opts.metrics) {
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const { data: live } = await db.from("posts").select("id,account_id,ig_media_id").eq("status", "published").gte("published_at", since);
    for (const p of live ?? []) {
      const a = byId.get(p.account_id);
      if (!a || !p.ig_media_id) continue;
      try {
        const r = await graph(a, "GET", `${p.ig_media_id}/insights`, { metric: "views,reach,likes,comments,saved,shares,total_interactions" })
          .catch(() => graph(a, "GET", `${p.ig_media_id}/insights`, { metric: "reach,likes,comments,saved,shares,total_interactions" }));
        const v: Record<string, number> = {};
        for (const m of r.data ?? []) v[m.name] = m.values?.[0]?.value ?? m.total_value?.value ?? null;
        await db.from("post_metrics").insert({ post_id: p.id, views: v.views, reach: v.reach, likes: v.likes, comments: v.comments, saves: v.saved, shares: v.shares, total_interactions: v.total_interactions });
      } catch (e) {
        log.push(`metrics ${p.id}: ${(e as Error).message}`);
      }
    }
  }
  return json({ ok: true, log });
});
