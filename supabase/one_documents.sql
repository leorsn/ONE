-- ONE document and receipt intelligence.
-- Adds structured scan metadata without changing ownership or RLS behavior.

alter table public.items
  add column if not exists document_kind text,
  add column if not exists merchant text,
  add column if not exists amount numeric(12,2),
  add column if not exists currency text;

alter table public.items
  drop constraint if exists items_type_check;

alter table public.items
  add constraint items_type_check
  check (type in ('task','reminder','appointment','event','note','link','idea','travel','shopping','document'));

alter table public.items
  drop constraint if exists items_source_type_check;

alter table public.items
  add constraint items_source_type_check
  check (source_type in ('manual','share','scan','email','screenshot','photo','link','system'));

alter table public.items
  drop constraint if exists items_document_kind_check;

alter table public.items
  add constraint items_document_kind_check
  check (
    document_kind is null or
    document_kind in ('receipt','invoice','ticket','reservation','letter','contract','business_card','other')
  );

alter table public.items
  drop constraint if exists items_currency_check;

alter table public.items
  add constraint items_currency_check
  check (currency is null or currency ~ '^[A-Z]{3}$');

create index if not exists items_user_document_kind_idx
  on public.items (user_id, document_kind)
  where document_kind is not null;
