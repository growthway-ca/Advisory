// Inspiration library: fills in details for saved Instagram links.
//   {id}  -> enrich one saved link (called by the dashboard right after you paste it)
//   {}    -> enrich up to 10 links that haven't been looked up yet (or re-check ones over 7 days old)
// For each link: the author comes from what you typed, a Research-list match, or oEmbed (oEmbed needs Meta's
// "oEmbed Read" review, which this app doesn't have yet), then Business Discovery gives the author's followers and, if the post is among their
// last 50, its views, likes, comments and caption. Personal accounts can't be looked up (Instagram's rule).
// Callers: a signed-in dashboard admin or pg_cron.
import { Account, admin, authorized, cors, graph, json, tokenFor } from "../_shared/common.ts";

const SHORT = /instagram\.com\/(?:[A-Za-z0-9._]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = admin();
  if (!(await authorized(req, db))) return json({ error: "unauthorized" }, 401);
  const body = await req.json().catch(() => ({}));

  const { data: accounts } = await db.from("ig_accounts").select("id,handle,token_secret,api_host,ig_user_id").eq("active", true);
  const usable = ((accounts ?? []) as Account[]).filter((a) => a.api_host === "graph.facebook.com" && a.ig_user_id && tokenFor(a));
  if (!usable.length) return json({ error: "No connected account to look things up with" }, 400);

  let q = db.from("inspirations").select("id,url,author,account_id");
  if (body.id) q = q.eq("id", body.id);
  else q = q.or(`fetched_at.is.null,fetched_at.lt.${new Date(Date.now() - 7 * 864e5).toISOString()}`).neq("status", "archived").limit(10);
  const { data: rows } = await q;
  const log: string[] = [];

  for (const r of rows ?? []) {
    const a = usable.find((x) => x.id === r.account_id) ?? usable[0];
    const m = r.url.match(SHORT);
    const patch: Record<string, unknown> = { fetched_at: new Date().toISOString(), fetch_error: null };
    if (m) { patch.shortcode = m[2]; patch.media_type = m[1].startsWith("reel") ? "reel" : m[1] === "tv" ? "video" : "post"; }
    let author = (r.author ?? "").replace(/^@/, "").trim();
    const notes: string[] = [];
    // A reel from an account on the Research list: we already know who posted it.
    if (!author && m) {
      const { data: known } = await db.from("comp_media").select("comp:comp_accounts(username)").like("permalink", `%/${m[2]}/%`).limit(1);
      const u = (known?.[0]?.comp as unknown as { username?: string })?.username;
      if (u) author = u;
    }
    try {
      const o = await graph(a, "GET", "instagram_oembed", { url: r.url, fields: "author_name,thumbnail_url" });
      if (!author && o.author_name) author = o.author_name;
      if (o.thumbnail_url) patch.thumbnail_url = o.thumbnail_url;
    } catch (e) {
      if (!author) notes.push(`Add the @author to get views and followers (Instagram doesn't say who posted a link).`);
    }
    if (author) {
      patch.author = author;
      try {
        const bd = (await graph(a, "GET", a.ig_user_id!, {
          fields: `business_discovery.username(${author}){followers_count,media.limit(50){permalink,caption,media_product_type,timestamp,like_count,comments_count,view_count}}`,
        })).business_discovery;
        patch.author_followers = bd.followers_count;
        const hit = m && (bd.media?.data ?? []).find((x: { permalink?: string }) => x.permalink?.includes(`/${m[2]}`));
        if (hit) Object.assign(patch, { caption: hit.caption ?? null, posted_at: hit.timestamp, like_count: hit.like_count ?? null, comments_count: hit.comments_count ?? null, view_count: hit.view_count ?? null });
        else notes.push("Post isn't among the author's latest 50, so only follower count is shown.");
      } catch (e) {
        notes.push(`@${author}: ${(e as Error).message.slice(0, 120)} (personal accounts can't be looked up)`);
      }
    }
    if (notes.length) patch.fetch_error = notes.join(" ");
    await db.from("inspirations").update(patch).eq("id", r.id);
    log.push(`${r.id}: ${notes.length ? notes.join(" ") : "ok"}`);
  }
  return json({ ok: true, log });
});
