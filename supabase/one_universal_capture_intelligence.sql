-- ONE PO002 universal capture + intelligence metadata.
-- Additive only. Existing item identity, ownership and RLS policies remain unchanged.

alter table public.items
  add column if not exists captured_at timestamptz,
  add column if not exists processing_status text,
  add column if not exists confidence_metadata jsonb not null default '{}'::jsonb,
  add column if not exists ai_metadata jsonb,
  add column if not exists task_intent boolean not null default false,
  add column if not exists event_intent boolean not null default false,
  add column if not exists task_due_at timestamptz,
  add column if not exists extracted_dates text[] not null default '{}',
  add column if not exists extracted_times text[] not null default '{}',
  add column if not exists extracted_urls text[] not null default '{}';

update public.items
set
  captured_at = coalesce(captured_at, created_at),
  processing_status = coalesce(
    processing_status,
    case when review_status = 'needs_review' then 'needs_attention' else 'ready' end
  ),
  confidence_metadata = case
    when confidence_metadata = '{}'::jsonb then jsonb_build_object('understanding', understanding_confidence)
    else confidence_metadata
  end,
  task_intent = task_intent or type in ('task', 'reminder'),
  event_intent = event_intent or type in ('appointment', 'event'),
  extracted_dates = case
    when coalesce(array_length(extracted_dates, 1), 0) = 0 and item_date is not null then array[item_date::text]
    else extracted_dates
  end,
  extracted_times = case
    when coalesce(array_length(extracted_times, 1), 0) = 0 and item_time is not null then array[to_char(item_time, 'HH24:MI')]
    else extracted_times
  end,
  extracted_urls = case
    when coalesce(array_length(extracted_urls, 1), 0) = 0 and url is not null then array[url]
    else extracted_urls
  end;

alter table public.items
  alter column captured_at set default now(),
  alter column captured_at set not null,
  alter column processing_status set default 'ready',
  alter column processing_status set not null;

alter table public.items
  drop constraint if exists items_processing_status_check,
  add constraint items_processing_status_check
    check (processing_status in (
      'received','normalized','classified','enriched','stored','ready','needs_attention','failed_enrichment'
    ));

create index if not exists items_user_processing_captured_idx
  on public.items (user_id, processing_status, captured_at desc);
