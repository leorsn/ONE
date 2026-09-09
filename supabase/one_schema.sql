-- ONE cloud data model.
-- Apply to the dedicated ONE Supabase project, not to another product database.

create table if not exists public.items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  raw_input text,
  type text not null check (type in ('task','reminder','appointment','event','note','link','idea','travel','shopping','document')),
  item_date date,
  item_time time,
  reminder_at timestamptz,
  category text,
  location text,
  url text,
  notes text,
  completed boolean not null default false,
  saved boolean not null default false,
  source_type text not null check (source_type in ('manual','share','scan','email','screenshot','photo','link','system')),
  source_app text,
  original_text text,
  attachment_url text,
  image_url text,
  extracted_text text,
  user_context text,
  document_kind text check (document_kind is null or document_kind in ('receipt','invoice','ticket','reservation','letter','contract','business_card','other')),
  merchant text,
  amount numeric(12,2),
  currency text check (currency is null or currency ~ '^[A-Z]{3}
  entities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_user_updated_idx
  on public.items (user_id, updated_at desc);

create index if not exists items_user_date_idx
  on public.items (user_id, item_date);

alter table public.items enable row level security;

grant select, insert, update, delete on public.items to authenticated;

create policy "Users can read own items"
on public.items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own items"
on public.items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own items"
on public.items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own items"
on public.items
for delete
to authenticated
using ((select auth.uid()) = user_id);
),
  tags text[] not null default '{}',
  entities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_user_updated_idx
  on public.items (user_id, updated_at desc);

create index if not exists items_user_date_idx
  on public.items (user_id, item_date);

alter table public.items enable row level security;

grant select, insert, update, delete on public.items to authenticated;

create policy "Users can read own items"
on public.items
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own items"
on public.items
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own items"
on public.items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own items"
on public.items
for delete
to authenticated
using ((select auth.uid()) = user_id);
