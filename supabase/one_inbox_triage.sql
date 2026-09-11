-- ONE PO045 unified Inbox triage metadata.
-- Additive only: one canonical item identity is preserved and existing RLS remains unchanged.

alter table public.items
  add column if not exists triage_state text,
  add column if not exists executed_actions text[] not null default '{}',
  add column if not exists processed_at timestamptz,
  add column if not exists archived_at timestamptz,
  add column if not exists deferred_until timestamptz;

update public.items
set triage_state = case
  when archived_at is not null then 'archived'
  when processed_at is not null or coalesce(array_length(executed_actions, 1), 0) > 0 then 'processed'
  when review_status = 'needs_review' or understanding_confidence = 'low' then 'needs_review'
  when destination <> 'inbox' then 'processed'
  when kind in ('event', 'reminder', 'receipt', 'document') then 'actionable'
  when type = 'task' and item_date is not null then 'actionable'
  else 'new'
end
where triage_state is null;

alter table public.items
  alter column triage_state set default 'new',
  alter column triage_state set not null;

alter table public.items
  drop constraint if exists items_triage_state_check,
  add constraint items_triage_state_check
    check (triage_state in ('new','needs_review','actionable','processed','archived'));

create index if not exists items_user_triage_updated_idx
  on public.items (user_id, triage_state, updated_at desc);

create index if not exists items_user_deferred_until_idx
  on public.items (user_id, deferred_until)
  where deferred_until is not null;
