-- Location tags and trial reels.
create table public.locations (
  id text primary key,            -- Facebook Page ID with location data
  name text not null,
  city text, state text, country text,
  created_at timestamptz not null default now()
);
alter table public.locations enable row level security;
create policy locations_admin on public.locations for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
grant all on public.locations to service_role;
grant select, insert, update, delete on public.locations to authenticated;

alter table public.ig_accounts add column default_location_id text references public.locations(id) on delete set null,
  add column default_trial text check (default_trial in ('MANUAL','SS_PERFORMANCE'));
alter table public.posts add column location_id text references public.locations(id) on delete set null,
  add column trial text check (trial in ('MANUAL','SS_PERFORMANCE'));
grant select (location_id, trial), update (location_id, trial) on public.posts to authenticated;
grant update (default_location_id, default_trial) on public.ig_accounts to authenticated;

-- New posts pick up the account's defaults (location, trial) unless set explicitly.
create or replace function public.posts_defaults() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.location_id is null then select default_location_id into new.location_id from public.ig_accounts where id = new.account_id; end if;
  if new.trial is null then select default_trial into new.trial from public.ig_accounts where id = new.account_id; end if;
  return new;
end $$;
create trigger posts_defaults before insert on public.posts for each row execute function public.posts_defaults();

insert into public.locations (id, name, city, state, country) values ('1494640160393867', 'Growthway', 'Toronto', 'ON', 'Canada');
update public.ig_accounts set default_location_id = '1494640160393867' where handle = 'growthway.ca';
