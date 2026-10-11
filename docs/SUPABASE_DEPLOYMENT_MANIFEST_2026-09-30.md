# NEVER Supabase production deployment manifest — 30 September 2026

This document is the release-order source of truth for deploying the repository state to the dedicated NEVER Supabase project.

Do **not** apply this manifest to any unrelated Supabase project.

## 1. Preconditions

Before changing the live project:

- Confirm the project URL/ref matches the NEVER mobile production configuration.
- Confirm a database backup or point-in-time recovery path exists.
- Confirm the mobile app uses only the Supabase publishable key.
- Keep `OPENAI_API_KEY` and all service-role/admin credentials server-side only.
- Native identity is already finalized separately as `app.never.mobile` with scheme `never`; this database deployment must not revert or recreate the retired ONE native namespace.
- Supabase Auth Additional Redirect URLs must ultimately contain:
  - `never://auth/callback`
  - `never://auth/reset-password`

## 2. SQL deployment order

Apply the SQL files in this order. Internal `one_*` filenames/table helpers are repository implementation names and do not define the public NEVER app identity.

1. `supabase/one_schema.sql`
   - canonical `public.items`
   - ownership foreign key to `auth.users`
   - core indexes
   - RLS and authenticated CRUD policies

2. `supabase/one_cloud_foundation.sql`
   - `public.profiles`
   - profile RLS
   - authenticated grants
   - ownership policies and sync timestamp foundation

3. `supabase/one_documents.sql`
   - document/receipt metadata and constraints

4. `supabase/one_capture_model.sql`
   - canonical capture lifecycle fields
   - backfills/constraints

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
   - pgvector
   - 384-dimensional item embedding
   - HNSW index
   - `match_one_items(...)` RPC
   - authenticated-only execution

8. `supabase/one_attachments.sql`
   - private `one-attachments` bucket
   - 10 MB object limit
   - launch-supported image/PDF MIME types
   - per-user path ownership policies for SELECT/INSERT/UPDATE/DELETE

Do not continue past a failed migration without resolving it.

## 3. Edge Functions to deploy

Deploy after SQL is current:

1. `interpret-one-capture`
   - authenticated capture interpretation
   - requires `OPENAI_API_KEY`
   - optional internal model override

2. `embed-one-item`
   - authenticated per-item embedding generation
   - depends on semantic schema

3. `semantic-search`
   - authenticated semantic query
   - depends on `match_one_items(...)`

4. `answer-one-recall`
   - authenticated grounded answer generation
   - requires `OPENAI_API_KEY`

5. `delete-account`
   - authenticated irreversible account deletion
   - removes private attachments and owned data
   - deletes the authenticated Supabase user
   - uses server-side service-role capability only inside the function runtime

## 4. Required server-side values

Expected server-side values include:

- `OPENAI_API_KEY`
- optional model overrides used by the current function code
- Supabase-provided runtime values such as URL, public key metadata and service-role credentials

Never mirror `OPENAI_API_KEY`, service-role keys, `sb_secret_*`, private-key material or admin credentials into Expo public environment values.

## 5. Post-deployment database verification

### Ownership / RLS

- Anonymous role cannot read private app tables.
- Authenticated user A can CRUD only rows where ownership resolves to user A.
- User A cannot insert/update/read/delete user B's rows.

### Storage

- `one-attachments` is private.
- A user can access only objects whose first path segment equals their auth UID.
- Supported upload/overwrite/delete flows work.
- Another authenticated account cannot obtain access to another user's object.

### Semantic recall

- pgvector is present.
- item embeddings use the expected dimensions.
- `match_one_items` is authenticated-only.
- results are restricted to current-user rows.

### Account deletion

With a disposable account:

1. create items and at least one attachment;
2. invoke account deletion while authenticated;
3. confirm success;
4. confirm auth user is removed;
5. confirm owned rows are removed;
6. confirm owned attachment objects are removed;
7. confirm old session cannot access private data.

## 6. Edge Function smoke tests

Using a disposable authenticated account:

- capture interpretation returns structured output and rejects missing auth;
- embedding can process owned items only;
- semantic search returns only owned item IDs;
- grounded recall cannot bypass RLS and does not fabricate unsupported saved facts;
- account deletion passes the end-to-end deletion flow.

## 7. Auth/deep-link production checks

In Supabase Auth → URL Configuration:

- add `never://auth/callback`;
- add `never://auth/reset-password`;
- review/remove obsolete `one://` redirect entries if no deliberate migration bridge is required;
- verify email templates preserve the requested redirect target;
- verify all sender/body copy uses NEVER branding.

Then physically test both confirmation and password-reset links from the TestFlight build.

## 8. Dashboard/security checks

After deployment:

- run Supabase security advisor;
- run performance advisor;
- resolve release-blocking findings;
- review backups/retention/project ownership;
- verify no test credentials/origins are unintentionally enabled.

## 9. Release gate

Supabase is TestFlight-ready only when:

- SQL deployment has no unresolved errors;
- all required Edge Functions are deployed from the accepted repository revision;
- server secrets are present;
- RLS cross-account tests pass;
- attachment isolation passes;
- capture/embedding/search/recall smoke tests pass;
- account deletion passes;
- `never://` auth callbacks work on the signed build;
- no unresolved release-blocking security finding remains.

Repository CI passing is necessary, but does not prove the live Supabase project matches this manifest.
