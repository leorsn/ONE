-- ONE PO004 — authentication, ownership and cloud persistence hardening.
-- The existing denormalized items table remains authoritative to avoid parallel models.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_sync_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.items enable row level security;

revoke all on table public.items from anon, authenticated;
grant select, insert, update, delete on table public.items to authenticated;

revoke all on table public.profiles from anon, authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
on public.profiles for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists items_user_updated_idx on public.items(user_id, updated_at desc);

comment on table public.profiles is 'Minimal private ONE account profile. Auth identity remains authoritative in auth.users.';
comment on column public.profiles.last_sync_at is 'Advisory successful cloud-sync timestamp; never used for authorization.';
