// Finds taggable locations (Facebook Pages with location data) for a reel.
//   POST {q: "Barrie, Ontario"}       -> search Pages by name, keep those with a location
//   POST {id: "<page id or fb url>"}  -> look up one Page and check it has a location
//   POST {own: true}                  -> each connected account's own Page, if it has a location
// Callers: a signed-in dashboard admin only.
import { Account, admin, authorized, cors, graph, json, tokenFor } from "../_shared/common.ts";

const FIELDS = "id,name,location,link";

function place(p: Record<string, any>) {
  const l = p.location ?? {};
  return { id: p.id, name: p.name, city: l.city ?? null, state: l.state ?? null, country: l.country ?? null, street: l.street ?? null, link: p.link ?? null, hasLocation: !!(l.city || l.street || l.latitude) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = admin();
  if (!(await authorized(req, db))) return json({ error: "unauthorized" }, 401);
  const body = await req.json().catch(() => ({}));
  const { data: accounts } = await db.from("ig_accounts").select("id,handle,token_secret,api_host,ig_user_id").eq("active", true);
  const usable = (accounts ?? []).filter((a) => tokenFor(a as Account)) as Account[];
  if (!usable.length) return json({ error: "No connected account to search with" }, 400);
  const a = usable[0];
  try {
    if (body.own) {
      const out = [];
      for (const acc of usable) {
        const me = await graph(acc, "GET", "me", { fields: FIELDS }).catch((e) => ({ error: e.message }));
        out.push({ handle: acc.handle, ...(me.error ? { error: me.error } : place(me)) });
      }
      return json({ results: out });
    }
    if (body.id) {
      const id = String(body.id).trim().replace(/\/$/, "").split(/[/?=]/).filter(Boolean).pop()!;
      const p = await graph(a, "GET", id, { fields: FIELDS });
      return json({ results: [place(p)] });
    }
    if (body.q) {
      const r = await graph(a, "GET", "pages/search", { q: String(body.q), fields: FIELDS });
      return json({ results: (r.data ?? []).map(place) });
    }
    return json({ error: "send q, id or own" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});
