import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

export function admin(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

// Allowed callers: pg_cron (x-cron-key from Vault) or a signed-in dashboard admin.
export async function authorized(req: Request, db: SupabaseClient): Promise<boolean> {
  const key = req.headers.get("x-cron-key");
  if (key) {
    const { data } = await db.rpc("cron_key_ok", { k: key });
    return data === true;
  }
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return false;
  const user = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data } = await user.rpc("is_admin");
  return data === true;
}

export type Account = {
  id: string; handle: string; token_secret: string; api_host: string; ig_user_id: string | null;
};

export function tokenFor(a: Account): string | undefined {
  return Deno.env.get(a.token_secret) || undefined;
}

// Calls the Graph API. Throws with Meta's error message on failure.
export async function graph(a: Account, method: "GET" | "POST", path: string, params: Record<string, string> = {}) {
  const token = tokenFor(a);
  if (!token) throw new Error(`No access token yet: add the ${a.token_secret} secret in Supabase`);
  const url = new URL(`https://${a.api_host}/${path.replace(/^\//, "")}`);
  const body = new URLSearchParams({ ...params, access_token: token });
  let res: Response;
  if (method === "GET") {
    body.forEach((v, k) => url.searchParams.set(k, v));
    res = await fetch(url);
  } else {
    res = await fetch(url, { method: "POST", body });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error ?? {};
    throw new Error(`${e.message ?? res.statusText}${e.error_user_msg ? ` (${e.error_user_msg})` : ""}`);
  }
  return data;
}

// Finds the Instagram account id behind a token, once, and stores it.
export async function ensureIgId(db: SupabaseClient, a: Account): Promise<string> {
  if (a.ig_user_id) return a.ig_user_id;
  let id: string | undefined;
  if (a.api_host === "graph.instagram.com") {
    const me = await graph(a, "GET", "me", { fields: "user_id,username" });
    id = me.user_id ?? me.id;
  } else {
    // A Facebook Page access token: the Page's linked Instagram business account.
    const me = await graph(a, "GET", "me", { fields: "instagram_business_account{id,username}" });
    id = me.instagram_business_account?.id;
    if (!id) throw new Error("This token's Facebook Page has no linked Instagram professional account");
  }
  await db.from("ig_accounts").update({ ig_user_id: id, last_error: null }).eq("id", a.id);
  a.ig_user_id = id!;
  return id!;
}
