# NEVER Supabase production deployment manifest — 30 September 2026

This document is the release-order source of truth for deploying the repository state to the dedicated NEVER Supabase project.

Do **not** apply this manifest to any unrelated Supabase project.

## 1. Preconditions

Before changing the live project:

- Confirm the project URL/ref matches the NEVER mobile configuration in `src/supabase/project.ts` / production environment.
- Confirm a database backup or point-in-time recovery path exists.
- Confirm the production mobile app uses only the Supabase publishable key. Never place a service-role/secret key in `EXPO_PUBLIC_*` variables.
- Keep `OPENAI_API_KEY` server-side in Supabase Edge Function secrets only.
- Do not change the native app identity (`app.one.mobile`, scheme/app group) as part of this database deployment.

## 2. SQL deployment order

Apply the SQL files in this order. The order matters because later migrations depend on columns introduced by earlier ones.

1. `supabase/one_schema.sql`
   - canonical `public.items` table
   - ownership foreign key to `auth.users`
   - core indexes
   - RLS and authenticated CRUD policies

2. `supabase/one_cloud_foundation.sql`
   - `public.profiles`
   - profile RLS
   - authenticated grants
   - ownership policies and sync timestamp foundation

3. `supabase/one_documents.sql`
   - document/receipt metadata and current type constraints
   - document-kind and currency constraints/index

4. `supabase/one_capture_model.sql`
   - canonical capture lifecycle fields (`kind`, `summary`, `destination`, review/confidence metadata)
   - backfill and constraints

5. `supabase/one_universal_capture_intelligence.sql`
   - processing state
   - AI/confidence metadata
   - task/event intent
   - extracted dates/times/URLs
   - captured timestamp

6. `supabase/one_inbox_triage.sql`
   - triage state
   - executed actions
   - processed/archive/deferred timestamps
   - triage indexes

7. `supabase/one_semantic_recall.sql`
   - pgvector extension
   - 384-dimensional item embedding
   - HNSW index
   - `match_one_items(...)` RPC
   - authenticated-only execution

8. `supabase/one_attachments.sql`
   - private `one-attachments` bucket
   - 10 MB object limit
   - launch-supported image/PDF MIME types
   - per-user folder ownership policies for SELECT/INSERT/UPDATE/DELETE

All SQL files are designed to be additive/idempotent where practical, but production execution must still be observed for errors. Do not continue past a failed step without resolving it.

## 3. Edge Functions to deploy

Deploy these functions after the SQL layer is current:

1. `interpret-one-capture`
   - authenticated capture interpretation
   - requires `OPENAI_API_KEY`
   - optional `ONE_CAPTURE_MODEL`; repository default is `gpt-5.6-luna`

2. `embed-one-item`
   - authenticated per-item embedding generation
   - depends on the semantic-recall SQL/embedding column

3. `semantic-search`
   - authenticated semantic query embedding
   - depends on `match_one_items(...)`

4. `answer-one-recall`
   - authenticated grounded answer generation
   - requires `OPENAI_API_KEY`
   - optional `ONE_RECALL_MODEL`; repository default is `gpt-5.6-luna`

5. `delete-account`
   - authenticated irreversible account deletion
   - removes private attachments
   - deletes owned `items`
   - deletes the authenticated Supabase user
   - uses the Supabase runtime service-role credential server-side only

## 4. Required server-side secrets / runtime values

Expected server-side values:

- `OPENAI_API_KEY` — required by capture interpretation and grounded recall
- `ONE_CAPTURE_MODEL` — optional override
- `ONE_RECALL_MODEL` — optional override
- Supabase-provided runtime values such as `SUPABASE_URL`, publishable/anon key metadata and service-role credentials

Never mirror `OPENAI_API_KEY`, a Supabase service-role key, `sb_secret_*`, private-key material, or any admin/server credential into Expo public environment variables.

## 5. Post-deployment database verification

Verify on the real NEVER project:

### Ownership / RLS

- Anonymous role cannot read `public.items` or `public.profiles`.
- Authenticated user A can CRUD only rows where `user_id = auth.uid()`.
- User A cannot insert/update a row with user B's `user_id`.
- User A cannot read, update or delete user B's rows.

### Storage

- `one-attachments` is private.
- A user can access only objects whose first path segment equals their auth UID.
- Upload/overwrite/delete work for the supported launch MIME set.
- Another authenticated account cannot create a signed URL for a different user's object.

### Semantic recall

- pgvector extension is present.
- `items.embedding` is 384 dimensions.
- `match_one_items` is executable by authenticated users only.
- RPC results are restricted to the current authenticated user's rows.

### Account deletion

With a disposable test account:

1. create items and at least one private attachment;
2. invoke `delete-account` while authenticated;
3. confirm the function returns success;
4. confirm auth user is removed;
5. confirm owned `items`/`profiles` no longer remain;
6. confirm the user's attachment objects are gone;
7. confirm the old session can no longer access private data.

## 6. Edge Function smoke tests

Using a disposable authenticated production/test account:

- `interpret-one-capture`: valid capture returns a structured interpretation; missing auth returns 401; missing model configuration fails closed without inventing data.
- `embed-one-item`: owned item receives an embedding; another account's item cannot be embedded/read.
- `semantic-search`: returns only owned item IDs and respects query/count bounds.
- `answer-one-recall`: answers only from supplied accessible item IDs; inaccessible IDs do not bypass RLS; unsupported evidence returns a grounded/no-evidence response rather than fabrication.
- `delete-account`: passes the deletion flow above.

## 7. Supabase dashboard checks before TestFlight

Run the real project's security and performance advisors after deployment. Resolve any new RLS/security warning before TestFlight unless it is explicitly reviewed and documented.

Also verify:

- Auth email confirmation/reset redirects point to the production NEVER scheme/configuration selected for release.
- Email templates use NEVER branding.
- Production redirect allow-list includes only the intended NEVER callbacks.
- No development/test origins or credentials are unintentionally enabled.

## 8. Release gate

Supabase is considered TestFlight-ready only when all of the following are true:

- SQL deployment completed with no unresolved errors.
- All five Edge Functions are deployed from the same reviewed repository revision.
- Required server secrets are present.
- RLS cross-account tests pass.
- Attachment isolation tests pass.
- Capture, embedding, semantic search and grounded recall smoke tests pass.
- Account deletion end-to-end test passes.
- Supabase security advisor has no unresolved release-blocking findings.

Repository CI passing is necessary, but does not prove the live Supabase project matches this manifest.
