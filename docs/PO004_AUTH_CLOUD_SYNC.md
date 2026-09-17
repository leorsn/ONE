# NEVER PO004 — Authentication, Cloud Sync & Personal Memory Infrastructure

## Starting point

PO004 started from `46fe1f185b171e1615f11f16a2889c8d34ae0e29` on `dev/foundation`.
No newer commits existed after the completed PO003 work.

PO004 extends the existing architecture. It does not introduce a second item model or replace the local-first capture pipeline.

## Authentication

Authentication remains centralized around Supabase Auth:

- `src/auth/service.ts` owns direct Auth API calls.
- `AuthContext` owns the authoritative client session and auth-state subscription.
- session persistence continues through the configured React Native Supabase storage adapter.
- `app/_layout.tsx` protects the application after onboarding when Supabase is configured.
- `app/auth/sign-in.tsx` provides the minimal email sign-in/create-account surface.
- auth callback and password-reset routes remain reachable while a session is being established or recovered.

The auth service boundary is provider-agnostic enough to add Apple Sign In later without moving authentication calls into UI screens.

## Cloud data model

NEVER intentionally keeps the PO002/PO003 `items` row as the authoritative persisted memory record. Tags, contexts, entities, extracted dates/tasks and retrieval metadata remain fields on that canonical record rather than being normalized into duplicate feature-specific models.

PO004 adds only `public.profiles`:

- `user_id` references `auth.users(id)` with `ON DELETE CASCADE`
- `created_at`
- `updated_at`
- `last_sync_at`

`profiles` is private and user-owned. Auth identity remains authoritative in `auth.users`.

## RLS and grants

`items` and `profiles` have RLS enabled.

Private application tables expose CRUD only to the `authenticated` role. The `anon` role has no direct table privileges for NEVER memories or profiles.

Per-user policies enforce ownership using `auth.uid()` for:

- SELECT
- INSERT
- UPDATE
- DELETE

The pre-existing private `one-attachments` bucket remains protected through `storage.objects` RLS and a first-path-component user ID boundary. The bucket name is a legacy technical identifier and is intentionally preserved.

The mobile application uses only the public client-safe Supabase configuration. Service-role credentials stay server-side in the existing account-deletion Edge Function.

## Local-first sync

The local item store remains the immediate interaction layer.

The production flow is:

`user action → local persistence → durable sync state → cloud attempt → retry or synced state`

PO004 does not create a parallel queue database. Instead:

- unsynced item rows persist `pending` / `error` state locally,
- delete operations persist as deletion tombstones,
- retries use bounded exponential backoff,
- automatic retry stops after a fixed attempt ceiling,
- a user-visible retry action can restart retryable failures,
- app activation also wakes the sync engine,
- a process restart reloads the same local item/tombstone state.

Normal capture never waits for cloud latency before becoming available locally.

## Conflict strategy

Normal metadata follows timestamp-based last-write-wins when it is safe.

A special preservation rule applies when a device has an unsynced meaningful local edit but the cloud already contains a newer divergent version:

- the local state is kept on-device,
- the cloud state is left untouched,
- automatic upload is stopped,
- the local item is marked with an internal conflict state.

This avoids silently destroying either version. A richer conflict-resolution surface is future work rather than a PO004 requirement.

For an equal timestamp with divergent pending local content, the pending local version wins deterministically and is uploaded.

## Existing local-data migration

PO004 replaces the previous destructive anonymous-to-account transfer behavior.

Migration is now:

- ID-preserving,
- account-bound,
- persisted,
- resumable,
- duplicate-resistant,
- non-destructive.

Anonymous source data remains as a local backup after it is copied into the authenticated scope. It is not automatically deleted after sign-in. Migration is only marked complete after transferred data and deletion work have drained from sync.

A persisted migration ownership record prevents a second account from silently claiming a backup already associated with another account.

Explicit account deletion clears the authenticated local scope, the retained anonymous migration backup and migration metadata after server-side deletion succeeds.

## Attachments

The existing private Supabase Storage architecture is preserved.

New attachment uploads use a deterministic per-item private object key. This makes retries idempotent: if a file upload succeeds but the database upsert fails, the retry replaces the same private object instead of creating repeated orphan objects.

Item deletion attempts cleanup of both the recorded cloud path and the deterministic per-item path. Full account deletion continues to remove the user's complete attachment folder server-side.

## Search and recall

PO003 local search remains the primary offline path.

Semantic search and AI recall continue to run under the authenticated caller's JWT/RLS context. PO004 does not add a separate retrieval ownership model. Cross-device data synchronizes into the same canonical items used by local search and grounded recall.

## Sync UX

The UI exposes only consumer-facing states:

- Synced
- Syncing
- Saved on device
- Sync problem

A sync problem can be retried from Settings. Internal retry counts, queue entries and ownership identifiers remain hidden.

## Account lifecycle

The existing account-deletion Edge Function remains the server-side deletion boundary. It deletes:

- private attachments,
- item rows (including embeddings/retrieval metadata stored on those rows),
- the Auth user.

The new profile row is removed through its `ON DELETE CASCADE` relationship to `auth.users`.

## Native acceptance still required

PO004 automated verification can validate TypeScript, lint, tests, Expo configuration and web export, plus live Supabase schema/RLS structure.

It does not claim physical-device validation. Before public release, a signed iOS development/production build must still verify:

- fresh account creation and email confirmation,
- session restoration after process restart,
- expired-session behavior,
- sign out,
- account deletion,
- offline capture followed by reconnect,
- interrupted attachment upload,
- cross-device create/update/delete behavior,
- Share Extension behavior while signed out and after session restoration.
