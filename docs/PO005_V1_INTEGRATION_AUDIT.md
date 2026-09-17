# NEVER PO005 — V1 Integration Audit, Native Readiness & Defect Closure

## Starting point

- Repository: `leorsn/ONE` (legacy repository name)
- Branch: `dev/foundation`
- Actual starting SHA: `e5b9b191e869924077af8b6a0dbb6b16de7ca95a`
- Starting commit: `fix(sync): register migration acceptance events`
- No newer commit existed when PO005 began.

Historical PO045/PO046 documents were treated only as technical context. `docs/DEVICE_TEST_PLAN.md` remains authoritative for physical-device acceptance.

## Audit summary

PO005 audited the existing V1 path rather than replacing it. The authoritative `OneItem` continues to flow through Inbox, Calendar, Saved, Search, Ask NEVER, notifications and cloud sync. `OneItem` is a legacy technical type name; no second event, task, document or recall database was introduced.

### Capture and understanding

Verified code paths:

- manual capture uses the shared deterministic capture interpreter and canonical item builder;
- native sharing normalizes text, URL, image and file metadata into one ingestion contract;
- share attachments are copied into NEVER local document storage before the temporary OS URI is relied upon;
- Scan to NEVER persists the original image locally before OCR;
- stale scan OCR work is revision-guarded and cannot replace a newer scan;
- manually reviewed share fields are preserved when late OCR text arrives;
- receipt/invoice amount extraction accepts only explicitly labelled totals such as Total/Gesamt/Summe/Amount Due rather than arbitrary monetary lines;
- low-confidence capture remains reviewable instead of creating unsupported consequential actions.

Native Share Sheet visibility, actual PDF/file handoff and Apple Vision OCR still require physical iOS acceptance.

### Organization and action

Verified:

- Inbox triage mutates the canonical item through `ItemsContext.update`;
- event/reminder actions require a date and reject low-confidence consequential automation;
- Calendar reads the same canonical items and uses local wall-clock `YYYY-MM-DD`/`HH:MM` fields;
- clearing a date makes the item non-remindable and removes Calendar placement;
- completion cancels reminder state through the existing notification transition;
- edit of reminder date/time/title/location reschedules rather than adding a second canonical memory;
- delete cancels the native notification, removes local attachment state and creates a durable cloud tombstone when authenticated.

Physical notification delivery, taps and permission recovery remain native acceptance work.

### Search and Ask NEVER

Verified:

- local search covers title, summary, people, context, raw/original/OCR text, category, tags, entities, type/kind/document kind, merchant, URL, extracted dates/times and amount/currency;
- pending local items remain searchable and empty search intentionally returns recent memories;
- semantic results are merged only when the returned item ID exists in the currently loaded local/account scope;
- Ask NEVER retrieves first, sends at most six item IDs to the server boundary, and validates returned source IDs;
- the recall Edge Function re-fetches those IDs under the authenticated caller JWT/RLS context and sends bounded fields to the model;
- AI failure falls back to grounded local recall; no evidence returns an explicit no-result answer.

### Authentication, migration and sync

Verified:

- Supabase Auth is centralized behind the auth service/provider;
- app readiness waits for auth restoration and item hydration;
- account-scoped storage prevents stale async cloud results from applying after a scope change;
- anonymous migration is ID-preserving, resumable and bound to one account;
- local writes persist before cloud completion;
- pending/error item state and delete tombstones survive restart;
- automatic retries are bounded;
- divergent newer cloud data does not silently erase an unsynced local edit;
- attachment cloud paths are deterministic per user/item and retry idempotently.

### Supabase and privacy

Live project verification during PO005 confirmed:

- RLS enabled on `public.items` and `public.profiles`;
- authenticated SELECT/INSERT/UPDATE/DELETE policies use `auth.uid() = user_id`;
- `one-attachments` is private;
- Storage SELECT/INSERT/UPDATE/DELETE policies require the first path component to equal the authenticated user ID;
- Supabase Security Advisor returned zero findings.

`one-attachments` remains a legacy technical resource name and is intentionally preserved.

The 2026 Supabase Data API change makes explicit grants important for public-schema tables. PO004 already established explicit authenticated access and removed anonymous private-table CRUD; PO005 preserves that model.

Server-only OpenAI and service-role credentials remain in Supabase Edge Function secrets. The client environment example contains only public Supabase and RevenueCat SDK configuration.

## Defects found and closed

### 1. Current branch quality gate was red

The starting HEAD failed `npm run quality` because `AuthContext` synchronously called `setLoading(false)` inside an effect when Supabase was unconfigured. The initial state already represented that condition. PO005 removes the redundant effect update.

### 2. Release builds could inherit unrestricted beta access when RevenueCat was absent

Before PO005, missing RevenueCat configuration always selected `BETA_PLAN = one_ai`, and the root gate treated missing billing configuration as permission to enter the app. That was acceptable for development but unsafe as a release default.

PO005 makes the fallback explicit:

- development client: `one_ai` beta access;
- preview/production runtime: `none` when RevenueCat is unavailable;
- root navigation requires an actual base entitlement (or the development beta plan) before opening private memory surfaces.

This prevents a missing production RevenueCat key from silently shipping unrestricted NEVER AI access.

### 3. Billing documentation implied the unsafe fallback was universal

`.env.example` and `docs/BILLING.md` state that the beta fallback is development-only and that release builds without billing configuration do not unlock paid access.

## Architecture preserved

PO005 intentionally did not replace:

- canonical `OneItem` identity;
- PO002 capture pipeline;
- PO003 retrieval/grounded recall;
- PO004 local-first sync and migration;
- RevenueCat purchase/restore layer;
- notification reconciliation;
- native Share Extension config;
- private attachment storage;
- development-only native diagnostics.

The legacy technical `one://dev-native?probe=1` diagnostics route remains guarded by `__DEV__` and records only bounded diagnostic metadata, not saved memory bodies or credentials.

## Automated regression coverage

Existing tests remain authoritative for:

- auth gate and session routing;
- migration ownership;
- sync retry/backoff/attempt ceiling;
- conflict preservation;
- share normalization and duplicate protection;
- local search and semantic result scoping;
- grounded recall source validation;
- notification reconciliation and stale scoped work.

PO005 adds regression assertions for:

- reminder edit -> reschedule and completion -> cancel;
- development-only beta entitlement fallback;
- production runtime with missing RevenueCat -> no entitlement.

## Native configuration preserved

Static release configuration continues to require these legacy technical identifiers:

- URL scheme `one`;
- main bundle identifier `app.one.mobile`;
- Share Extension `app.one.mobile.ShareExtension`;
- App Group `group.app.one.mobile`;
- Share Extension text/image/file activation;
- notifications and image-picker plugins;
- EAS development client/internal distribution;
- production build-number auto increment.

## Remaining physical-device requirements

PO005 does **not** mark these passed:

- Share Sheet visibility;
- Safari/Mail/Photos sharing;
- PDF/file sharing;
- camera behavior and permission recovery;
- Apple Vision OCR;
- local notification delivery/edit/cancel;
- notification taps;
- auth confirmation deep links;
- password-reset deep links;
- force-quit session restoration;
- real offline/reconnect transitions;
- account-switch privacy regression;
- keyboard/safe-area behavior;
- iPad layout acceptance;
- real App Store/RevenueCat purchase, restore, trial eligibility and subscription management.

## External release configuration still required

Before App Store release:

- configure real RevenueCat public SDK keys and matching App Store products/entitlements;
- verify App Store Connect trial eligibility behavior for NEVER;
- configure/verify production Supabase Auth email delivery and deep-link redirects;
- set the server-side `OPENAI_API_KEY`/legacy `ONE_RECALL_MODEL` configuration if NEVER AI synthesis is enabled;
- complete the consumer privacy policy/legal disclosures referenced by the Privacy screen;
- perform the full `docs/DEVICE_TEST_PLAN.md` matrix on physical iOS hardware.

## Verification rule

PO005 is complete only after the repository `npm run quality` workflow passes on the final pushed SHA. Physical-device items above remain separate and must not be inferred from CI, Expo Doctor, web export, simulator output or static configuration.
