begin; do $guard$ begin if to_regclass('public.items') is not null or to_regclass('public.profiles') is not null then raise exception 'NEVER_APP_SCHEMA_ALREADY_PRESENT'; end if; end $guard$; create extension if not exists vector with schema extensions;
CREATE TABLE public.items (
    id text NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    raw_input text,
    type text NOT NULL,
    item_date date,
    item_time time without time zone,
    reminder_at timestamp with time zone,
    category text,
    location text,
    url text,
    notes text,
    completed boolean DEFAULT false NOT NULL,
    saved boolean DEFAULT false NOT NULL,
    source_type text NOT NULL,
    source_app text,
    original_text text,
    attachment_url text,
    image_url text,
    extracted_text text,
    user_context text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    entities text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    embedding extensions.vector(384),
    document_kind text,
    merchant text,
    amount numeric(12,2),
    currency text,
    kind text DEFAULT 'unknown'::text NOT NULL,
    summary text,
    people text[] DEFAULT '{}'::text[] NOT NULL,
    destination text DEFAULT 'inbox'::text NOT NULL,
    review_status text DEFAULT 'ready'::text NOT NULL,
    ambiguities text[] DEFAULT '{}'::text[] NOT NULL,
    understanding_confidence text DEFAULT 'medium'::text NOT NULL,
    triage_state text DEFAULT 'new'::text NOT NULL,
    executed_actions text[] DEFAULT '{}'::text[] NOT NULL,
    processed_at timestamp with time zone,
    archived_at timestamp with time zone,
    deferred_until timestamp with time zone,
    captured_at timestamp with time zone DEFAULT now() NOT NULL,
    processing_status text DEFAULT 'ready'::text NOT NULL,
    confidence_metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    ai_metadata jsonb,
    task_intent boolean DEFAULT false NOT NULL,
    event_intent boolean DEFAULT false NOT NULL,
    task_due_at timestamp with time zone,
    extracted_dates text[] DEFAULT '{}'::text[] NOT NULL,
    extracted_times text[] DEFAULT '{}'::text[] NOT NULL,
    extracted_urls text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT items_currency_check CHECK (((currency IS NULL) OR (currency ~ '^[A-Z]{3}$'::text))),
    CONSTRAINT items_destination_check CHECK ((destination = ANY (ARRAY['inbox'::text, 'calendar'::text, 'saved'::text]))),
    CONSTRAINT items_document_kind_check CHECK (((document_kind IS NULL) OR (document_kind = ANY (ARRAY['receipt'::text, 'invoice'::text, 'ticket'::text, 'reservation'::text, 'letter'::text, 'contract'::text, 'business_card'::text, 'other'::text])))),
    CONSTRAINT items_kind_check CHECK ((kind = ANY (ARRAY['note'::text, 'event'::text, 'reminder'::text, 'document'::text, 'receipt'::text, 'image'::text, 'link'::text, 'unknown'::text]))),
    CONSTRAINT items_processing_status_check CHECK ((processing_status = ANY (ARRAY['received'::text, 'normalized'::text, 'classified'::text, 'enriched'::text, 'stored'::text, 'ready'::text, 'needs_attention'::text, 'failed_enrichment'::text]))),
    CONSTRAINT items_review_status_check CHECK ((review_status = ANY (ARRAY['ready'::text, 'needs_review'::text, 'reviewed'::text]))),
    CONSTRAINT items_source_type_check CHECK ((source_type = ANY (ARRAY['manual'::text, 'share'::text, 'scan'::text, 'email'::text, 'screenshot'::text, 'photo'::text, 'link'::text, 'system'::text]))),
    CONSTRAINT items_triage_state_check CHECK ((triage_state = ANY (ARRAY['new'::text, 'needs_review'::text, 'actionable'::text, 'processed'::text, 'archived'::text]))),
    CONSTRAINT items_type_check CHECK ((type = ANY (ARRAY['task'::text, 'reminder'::text, 'appointment'::text, 'event'::text, 'note'::text, 'link'::text, 'idea'::text, 'travel'::text, 'shopping'::text, 'document'::text]))),
    CONSTRAINT items_understanding_confidence_check CHECK ((understanding_confidence = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])))
);
CREATE TABLE public.profiles (
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_sync_at timestamp with time zone
);
ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX items_embedding_hnsw_idx ON public.items USING hnsw (embedding extensions.vector_cosine_ops);
CREATE INDEX items_user_date_idx ON public.items USING btree (user_id, item_date);
CREATE INDEX items_user_deferred_until_idx ON public.items USING btree (user_id, deferred_until) WHERE (deferred_until IS NOT NULL);
CREATE INDEX items_user_destination_updated_idx ON public.items USING btree (user_id, destination, updated_at DESC);
CREATE INDEX items_user_document_kind_idx ON public.items USING btree (user_id, document_kind) WHERE (document_kind IS NOT NULL);
CREATE INDEX items_user_kind_updated_idx ON public.items USING btree (user_id, kind, updated_at DESC);
CREATE INDEX items_user_processing_captured_idx ON public.items USING btree (user_id, processing_status, captured_at DESC);
CREATE INDEX items_user_triage_updated_idx ON public.items USING btree (user_id, triage_state, updated_at DESC);
CREATE INDEX items_user_updated_idx ON public.items USING btree (user_id, updated_at DESC);
alter table public.items enable row level security;
alter table public.profiles enable row level security;
revoke all on public.items,public.profiles from public,anon,authenticated;
grant select,insert,update,delete on public.items,public.profiles to authenticated;
grant all on public.items,public.profiles to service_role;
CREATE POLICY "Users can delete own items" ON public.items FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can insert own items" ON public.items FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can read own items" ON public.items FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can update own items" ON public.items FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE FUNCTION public.match_one_items(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.52, match_count integer DEFAULT 12) RETURNS TABLE(item_id text, similarity double precision)
    LANGUAGE sql STABLE
    SET search_path TO ''
    AS $$
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
revoke all on function public.match_one_items(extensions.vector,double precision,integer) from public,anon,authenticated;
grant execute on function public.match_one_items(extensions.vector,double precision,integer) to authenticated;

commit;
