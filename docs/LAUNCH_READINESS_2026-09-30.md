# NEVER launch readiness — 30 September 2026

Branch: `design/never-material-worlds`

## Product state

The physical iPhone visual pass has been accepted. The NEVER visual system is frozen until launch: no further Home/Search/Calendar/Saved/Settings, navigation, typography, spacing or Material World changes unless a genuine rendering defect is discovered.

## Code gates completed

- Material/Glass geometry hardened without changing the approved Home/Calendar structure.
- Shared MemoryRow and NeverInput inherit Material World geometry instead of legacy fixed values.
- System appearance now uses true basic light/dark runtime surfaces without premium Material World artwork.
- Archive and Tidal have their approved world-specific control palettes; other worlds remain unchanged.
- Search history persists locally and Ask NEVER now supports explicit no-evidence grounding instead of forcing irrelevant citations.
- Share handoffs are deduplicated and private attachments are copied locally before a capture is considered saved.
- Launch attachment policy is explicit: JPEG, PNG, WebP, HEIC/HEIF, GIF, TIFF and PDF originals are supported for private cloud sync. Unsupported audio/video/Office originals are rejected before they can enter permanent sync retry.
- Local add/edit/delete persistence is transactional: visible state is committed only after the local write succeeds; reminder/tombstone side effects are rolled back or deferred appropriately on failure.
- Account deletion treats confirmed server deletion as final even if post-delete local sign-out cleanup fails.
- Native deep links use an allowlist for NEVER auth/reset/share routes; arbitrary external schemes/URLs are rejected.
- RevenueCat purchase results are checked against the expected entitlement. Restore with no active NEVER subscription is reported accurately and clears stale local access state.
- CI runs on `main`, `dev/foundation` and `design/**`; repository quality, Expo/native and release configuration checks are automated.

## Supabase architecture audit

Repository SQL enables RLS on `public.items` and `public.profiles` and grants access only to `authenticated`. Ownership policies use `(select auth.uid()) = user_id`. Update policies include both `USING` and `WITH CHECK`.

The private `one-attachments` Storage bucket has per-user SELECT/INSERT/UPDATE/DELETE policies based on the first path segment matching `auth.uid()`. Repository policy now includes the launch-supported iPhone image formats plus PDF, with a 10 MB object limit.

The mobile client uses a Supabase publishable key, not a service-role/secret key. `service_role` keys must never be added to Expo public configuration.

Live database verification was not performed because the Supabase connection available to the agent does not expose the project ref configured in the NEVER repository (`uuehozwygopldwcbkfci`). Before release, deploy/verify the repository SQL and Edge Functions on the actual NEVER project and run Supabase security/performance advisors there.

## Production blockers / explicit decisions

### 1. Native identity

The visible product is NEVER, while native identifiers are still inherited from ONE:

- scheme: `one`
- iOS bundle: `app.one.mobile`
- Android package: `app.one.mobile`
- Share Extension: `app.one.mobile.ShareExtension`
- App Group: `group.app.one.mobile`

Before App Store submission make one explicit decision:

A. retain these legacy identifiers intentionally, or
B. migrate them before production certificates, App Groups, deep links and Store records are finalized.

Do not rename them casually after provisioning. `npm run release:appstore-check` intentionally fails on unresolved legacy identity unless `NEVER_ALLOW_LEGACY_IDENTIFIERS=1` is deliberately set.

### 2. Production environment and legal URLs

Required for release:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- `EXPO_PUBLIC_SUPPORT_URL`
- `EXPO_PUBLIC_TERMS_URL`
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`

All public URLs must be final HTTPS URLs. Secret/service-role/OpenAI keys remain server-only.

### 3. RevenueCat / App Store Connect

Code fails closed when billing is not configured and now validates the entitlement returned after purchase/restore. Before release still verify on a real sandbox/TestFlight account:

- App Store products exist with the expected product IDs
- RevenueCat entitlement IDs `one` and `one_ai`
- offering `default` exposes packages `one_monthly` and `one_ai_monthly`
- live localized prices/intro offers
- purchase NEVER
- upgrade to NEVER AI
- restore purchases
- no-subscription restore
- subscription-management URL

### 4. Supabase production deployment

Repository changes are not proof that production is deployed. On the actual NEVER Supabase project verify:

- items/profiles schema and RLS
- `one-attachments` bucket MIME policy including HEIC/HEIF
- `delete-account` Edge Function
- capture/AI functions and their server-only secrets
- semantic recall function/index
- security and performance advisors

### 5. Notifications and Share Extension

Production configuration includes Notifications and the Share Extension/App Group. `NEVER_LOCAL_DEVICE_TEST=1` intentionally strips unsupported capabilities for a Personal Apple Team, so the local personal-team build cannot certify production share/notification capabilities.

Verify on production-team/TestFlight provisioning:

- Share text
- Share URL
- Share JPEG/PNG/HEIC image
- Share PDF
- unsupported-file messaging
- local notification permission
- create/edit/cancel reminder
- notification tap opens the correct memory

### 6. Final functional iPhone acceptance

Visual acceptance is complete. The remaining physical acceptance pass is functional only:

- sign up / email confirmation / sign in / sign out
- password reset
- capture + edit + delete
- offline capture then reconnect/sync
- Search + Ask NEVER grounded/no-evidence cases
- export JSON
- account deletion
- RevenueCat sandbox purchase/restore once configured
- Share Extension and notifications once production capabilities are available

## Release commands

General quality:

```sh
npm run quality
```

App Store gate after final environment and identity decisions:

```sh
npm run release:appstore-check
```

Physical personal-team functional test:

```sh
NEVER_LOCAL_DEVICE_TEST=1 npm run ios:device:test:clean
```

A successful repository gate is necessary but does not replace production Supabase deployment, App Store Connect/RevenueCat configuration or TestFlight acceptance.
