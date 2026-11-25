// "Reconnect Instagram" from the dashboard. Paste ANY token from Meta's Graph API Explorer (short-lived user token,
// extended one, or a Page token) and this turns it into Page tokens that never expire, then saves one per account
// whose Instagram handle matches a Page the token can see:
//   1. exchange it for a long-lived token (needs the app secret: FB_APP_SECRET Edge Function secret or Vault 'fb_app_secret'; the app id comes from the token)
//   2. user token -> me/accounts -> each Page's token (Page tokens from a long-lived user token don't expire)
//   3. check each with debug_token and refuse to save anything that expires
//   4. save in Vault (set_ig_token), clear the error, record Meta's data-access deadline
// Signed-in dashboard admins only.
import { admin, authorized, cors, json } from "../_shared/common.ts";

const G = "https://graph.facebook.com";
async function get(path: string, params: Record<string, string>) {
  const u = new URL(`${G}/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u);
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.error) throw new Error(d.error?.message ?? r.statusText);
  return d;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const db = admin();
  if (req.headers.get("x-cron-key") || !(await authorized(req, db))) return json({ error: "unauthorized" }, 401);
  const { token } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") return json({ error: "Paste a token first" }, 400);
  const secret = Deno.env.get("FB_APP_SECRET") || (await db.rpc("fb_app_secret")).data;
  if (!secret) return json({ error: "The Meta app secret isn't saved in Supabase yet" }, 500);

  try {
    const t = token.trim();
    const app = await get("app", { access_token: t, fields: "id,name" });
    const appToken = `${app.id}|${secret}`;
    const kind = (await get("debug_token", { input_token: t, access_token: appToken })).data?.type;

    // Collect candidate Pages: [{name, token, ig: {id, username}}]
    let pages: { name: string; access_token: string; instagram_business_account?: { id: string; username: string } }[] = [];
    if (kind === "PAGE") {
      const long = await get("oauth/access_token", { grant_type: "fb_exchange_token", client_id: app.id, client_secret: secret, fb_exchange_token: t });
      const me = await get("me", { access_token: long.access_token, fields: "name,instagram_business_account{id,username}" });
      pages = [{ name: me.name, access_token: long.access_token, instagram_business_account: me.instagram_business_account }];
    } else {
      const long = await get("oauth/access_token", { grant_type: "fb_exchange_token", client_id: app.id, client_secret: secret, fb_exchange_token: t });
      const r = await get("me/accounts", { access_token: long.access_token, fields: "name,access_token,instagram_business_account{id,username}", limit: "100" });
      pages = r.data ?? [];
    }

    const { data: accounts } = await db.from("ig_accounts").select("id,handle").eq("active", true);
    const results: { handle: string; ok: boolean; message: string }[] = [];
    for (const a of accounts ?? []) {
      const p = pages.find((x) => x.instagram_business_account?.username?.toLowerCase() === a.handle.toLowerCase());
      if (!p) continue;
      const info = (await get("debug_token", { input_token: p.access_token, access_token: appToken })).data ?? {};
      if (!info.is_valid) { results.push({ handle: a.handle, ok: false, message: "Meta says the token isn't valid" }); continue; }
      if (info.expires_at && info.expires_at !== 0) {
        results.push({ handle: a.handle, ok: false, message: `Not saved: it would expire ${new Date(info.expires_at * 1000).toLocaleString("en-CA")}` });
        continue;
      }
      const { error } = await db.rpc("set_ig_token", { p_account: a.id, p_token: p.access_token });
      if (error) { results.push({ handle: a.handle, ok: false, message: error.message }); continue; }
      const dataAccess = info.data_access_expires_at ? new Date(info.data_access_expires_at * 1000).toISOString().slice(0, 10) : null;
      await db.from("ig_accounts").update({
        ig_user_id: p.instagram_business_account!.id, api_host: "graph.facebook.com", last_error: null,
        ...(dataAccess ? { data_access_expires: dataAccess } : {}),
      }).eq("id", a.id);
      results.push({ handle: a.handle, ok: true, message: `Connected via the ${p.name} Page. Never expires${dataAccess ? `; Meta asks you to re-approve the app by ${dataAccess}` : ""}.` });
    }
    const seen = pages.map((p) => `${p.name}${p.instagram_business_account ? ` (@${p.instagram_business_account.username})` : " (no Instagram linked)"}`);
    return json({ results, pages: seen });
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
