-- Growthway poster: approval queue, publishing, metrics, comp-account research.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Who may use the dashboard. Anyone can sign up, but only rows here see or change data.
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy admins_self on public.admins for select to authenticated using (user_id = (select auth.uid()));

-- Our Instagram accounts. The access token is an Edge Function secret named token_secret (never stored here).
create table public.ig_accounts (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,              -- e.g. growthway.ca
  label text not null,
  token_secret text not null unique,        -- e.g. IG_TOKEN_GROWTHWAY
  api_host text not null default 'graph.facebook.com' check (api_host in ('graph.facebook.com','graph.instagram.com')),
  ig_user_id text,                          -- filled in on first run
  active boolean not null default true,
  last_error text,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ig_accounts(id) on delete cascade,
  title text,
  caption text not null default '',
  video_path text,                          -- path in the 'reels' bucket
  cover_path text,
  source text,                              -- where it came from, e.g. social/this-week/2026-11-24-tue/reel
  status text not null default 'uploading'
    check (status in ('uploading','pending','approved','publishing','published','failed','rejected')),
  scheduled_for timestamptz,
  approved_at timestamptz,
  container_id text,
  ig_media_id text,
  permalink text,
  published_at timestamptz,
  error text,
  attempts int not null default 0,
  upload_token uuid default gen_random_uuid(), -- one-time token for the ingest function; cleared after upload
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_due on public.posts (status, scheduled_for);

create table public.post_metrics (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.posts(id) on delete cascade,
  captured_at timestamptz not null default now(),
  views bigint, reach bigint, likes bigint, comments bigint, saves bigint, shares bigint, total_interactions bigint
);
create index post_metrics_post on public.post_metrics (post_id, captured_at desc);

-- Comp accounts to study, per one of our accounts.
create table public.comp_accounts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ig_accounts(id) on delete cascade,
  username text not null,
  notes text,
  active boolean not null default true,
  last_error text,
  created_at timestamptz not null default now(),
  unique (account_id, username)
);

create table public.comp_snapshots (
  id bigint generated always as identity primary key,
  comp_id uuid not null references public.comp_accounts(id) on delete cascade,
  captured_at timestamptz not null default now(),
  followers bigint, media_count bigint
);

create table public.comp_media (
  comp_id uuid not null references public.comp_accounts(id) on delete cascade,
  ig_media_id text not null,
  permalink text, caption text, media_product_type text, posted_at timestamptz,
  like_count bigint, comments_count bigint, view_count bigint,
  outlier numeric,                          -- views / median views of that account's recent posts
  captured_at timestamptz not null default now(),
  primary key (comp_id, ig_media_id)
);

-- updated_at
create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();

-- RLS: admins only. The Edge Functions use the service role and bypass RLS.
do $$ declare t text; begin
  foreach t in array array['ig_accounts','posts','post_metrics','comp_accounts','comp_snapshots','comp_media'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t||'_admin', t);
  end loop;
end $$;
-- The dashboard never needs the upload token.
revoke select (upload_token) on public.posts from authenticated, anon;

-- Video storage. Public read, because Instagram fetches the file by URL; writes only via signed upload URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reels', 'reels', true, 314572800, array['video/mp4','video/quicktime','image/png','image/jpeg'])
on conflict (id) do nothing;

-- Cron key: random, kept in Vault, checked by the functions. Nobody needs to see it.
select vault.create_secret(gen_random_uuid()::text || gen_random_uuid()::text, 'cron_key', 'Shared key for pg_cron -> Edge Functions');

create or replace function public.cron_key_ok(k text) returns boolean
language sql stable security definer set search_path = public, vault as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'cron_key' and decrypted_secret = k);
$$;
revoke all on function public.cron_key_ok(text) from public, anon, authenticated;
grant execute on function public.cron_key_ok(text) to service_role;

-- Our two accounts. Tokens go in as Edge Function secrets with these names.
insert into public.ig_accounts (handle, label, token_secret) values
  ('growthway.ca', 'Growthway', 'IG_TOKEN_GROWTHWAY'),
  ('housingdata', 'housingdata', 'IG_TOKEN_HOUSINGDATA');

-- Column-level read: the dashboard can read posts but never the upload token.
revoke select on public.posts from authenticated, anon;
grant select (id, account_id, title, caption, video_path, cover_path, source, status, scheduled_for, approved_at, container_id, ig_media_id, permalink, published_at, error, attempts, created_at, updated_at) on public.posts to authenticated;
revoke all on public.posts from anon;
