-- Inspiration library: reels and posts saved from personal feeds (dashboard → Inspiration), enriched by the
-- "inspire" edge function (author followers, views, likes, caption when the author is a business/creator account).
create table public.inspirations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.ig_accounts(id) on delete set null,
  url text not null unique,
  shortcode text,
  media_type text,
  author text,
  category text,
  notes text,
  status text not null default 'new' check (status in ('new','used','archived')),
  caption text,
  posted_at timestamptz,
  view_count bigint,
  like_count bigint,
  comments_count bigint,
  author_followers bigint,
  thumbnail_url text,
  fetched_at timestamptz,
  fetch_error text,
  created_at timestamptz not null default now()
);
alter table public.inspirations enable row level security;
create policy inspirations_admin on public.inspirations for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.inspirations to authenticated;
grant all on public.inspirations to service_role;
create index inspirations_created on public.inspirations (created_at desc);
