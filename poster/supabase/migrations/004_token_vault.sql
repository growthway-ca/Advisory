-- Instagram tokens saved from the dashboard's "Reconnect" box, kept in Supabase Vault (encrypted), one per account.
-- Only the edge functions (service_role) can read or write them; the dashboard never sees a token after it's sent.
-- A Vault token takes precedence over the older IG_TOKEN_* Edge Function secret.
create or replace function public.set_ig_token(p_account uuid, p_token text) returns void
language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  select id into sid from vault.secrets where name = 'ig_token:' || p_account;
  if sid is null then perform vault.create_secret(p_token, 'ig_token:' || p_account, 'Instagram Page token');
  else perform vault.update_secret(sid, p_token); end if;
end $$;

create or replace function public.ig_tokens() returns table (account_id uuid, token text)
language sql security definer set search_path = '' as $$
  select substring(name from 10)::uuid, decrypted_secret from vault.decrypted_secrets where name like 'ig_token:%'
$$;

revoke all on function public.set_ig_token(uuid, text) from public, anon, authenticated;
revoke all on function public.ig_tokens() from public, anon, authenticated;
grant execute on function public.set_ig_token(uuid, text) to service_role;
grant execute on function public.ig_tokens() to service_role;

-- The Meta app secret used to exchange tokens (saved to Vault as 'fb_app_secret'; value not in this file).
create or replace function public.fb_app_secret() returns text language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'fb_app_secret' $$;
revoke all on function public.fb_app_secret() from public, anon, authenticated;
grant execute on function public.fb_app_secret() to service_role;
