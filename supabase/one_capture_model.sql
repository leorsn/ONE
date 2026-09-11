-- ONE PO044 canonical capture lifecycle metadata.
-- Additive only: existing item identity, ownership and RLS policies remain unchanged.

alter table public.items
  add column if not exists kind text,
  add column if not exists summary text,
  add column if not exists people text[] not null default '{}',
  add column if not exists destination text,
  add column if not exists review_status text,
  add column if not exists ambiguities text[] not null default '{}',
  add column if not exists understanding_confidence text;

update public.items
set kind = case
  when document_kind = 'receipt' then 'receipt'
  when type = 'document' then 'document'
  when type in ('appointment', 'event') then 'event'
  when type = 'reminder' then 'reminder'
  when type = 'link' then 'link'
  when source_type in ('screenshot', 'photo') then 'image'
  else 'note'
end
where kind is null;

update public.items
set destination = case
  when type in ('appointment', 'event', 'reminder') then 'calendar'
  when type = 'task' and item_date is not null then 'calendar'
  when type = 'task' then 'inbox'
  else 'saved'
end
where destination is null;

update public.items
set
  summary = coalesce(nullif(summary, ''), title),
  review_status = coalesce(review_status, 'ready'),
  understanding_confidence = coalesce(understanding_confidence, 'medium');

alter table public.items
  alter column kind set default 'unknown',
  alter column kind set not null,
  alter column destination set default 'inbox',
  alter column destination set not null,
  alter column review_status set default 'ready',
  alter column review_status set not null,
  alter column understanding_confidence set default 'medium',
  alter column understanding_confidence set not null;

alter table public.items
  drop constraint if exists items_kind_check,
  add constraint items_kind_check
    check (kind in ('note','event','reminder','document','receipt','image','link','unknown')),
  drop constraint if exists items_destination_check,
  add constraint items_destination_check
    check (destination in ('inbox','calendar','saved')),
  drop constraint if exists items_review_status_check,
  add constraint items_review_status_check
    check (review_status in ('ready','needs_review','reviewed')),
  drop constraint if exists items_understanding_confidence_check,
  add constraint items_understanding_confidence_check
    check (understanding_confidence in ('high','medium','low'));

create index if not exists items_user_destination_updated_idx
  on public.items (user_id, destination, updated_at desc);

create index if not exists items_user_kind_updated_idx
  on public.items (user_id, kind, updated_at desc);
