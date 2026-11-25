-- What a post is and how it was made (learning loop, A/B tests), carousels, comments, audience hours, token expiry.
alter table public.posts
  add column kind text not null default 'reel' check (kind in ('reel','carousel')),
  add column media jsonb,
  add column format text,
  add column hook text,
  add column variant_group uuid,
  add column variant text check (variant in ('A','B'));
grant select (kind, media, format, hook, variant_group, variant) on public.posts to authenticated;
grant update (format, hook) on public.posts to authenticated;

alter table public.ig_accounts add column best_hours jsonb, add column data_access_expires date;
update public.ig_accounts set data_access_expires = '2027-02-23' where handle = 'growthway.ca';

create or replace view public.post_stats with (security_invoker = on) as
select p.id, p.account_id, p.kind, p.format, p.hook, p.variant_group, p.variant, p.trial, p.title, p.permalink, p.published_at,
       m.views, m.reach, m.likes, m.comments, m.saves, m.shares, m.total_interactions, m.captured_at
from public.posts p
left join lateral (select * from public.post_metrics x where x.post_id = p.id order by captured_at desc limit 1) m on true
where p.status = 'published';
grant select on public.post_stats to authenticated, service_role;

create table public.comments (
  id text primary key, account_id uuid not null references public.ig_accounts(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null, ig_media_id text not null, permalink text,
  username text, text text, posted_at timestamptz, like_count int,
  status text not null default 'new' check (status in ('new','replied','ignored')),
  draft text, reply_text text, replied_at timestamptz, created_at timestamptz not null default now()
);
create index comments_status on public.comments (status, posted_at desc);
alter table public.comments enable row level security;
create policy comments_admin on public.comments for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
grant all on public.comments to service_role;
grant select, update on public.comments to authenticated;

select cron.schedule('poster-engage', '29 */2 * * *', $$select public.call_fn('engage')$$);
