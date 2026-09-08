-- ONE semantic recall: pgvector + per-user similarity search.

create extension if not exists vector with schema extensions;

alter table public.items
  add column if not exists embedding extensions.vector(384);

create index if not exists items_embedding_hnsw_idx
  on public.items
  using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.match_one_items(
  query_embedding extensions.vector(384),
  match_threshold double precision default 0.52,
  match_count integer default 12
)
returns table (
  item_id text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    i.id as item_id,
    1 - (i.embedding OPERATOR(extensions.<=>) query_embedding) as similarity
  from public.items as i
  where
    i.user_id = (select auth.uid())
    and i.embedding is not null
    and 1 - (i.embedding OPERATOR(extensions.<=>) query_embedding) > match_threshold
  order by i.embedding OPERATOR(extensions.<=>) query_embedding
  limit greatest(1, least(match_count, 50));
$$;

revoke all on function public.match_one_items(extensions.vector, double precision, integer)
from public, anon;

grant execute on function public.match_one_items(extensions.vector, double precision, integer)
to authenticated;
