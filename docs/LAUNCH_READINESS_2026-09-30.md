# NEVER launch readiness — 30 September 2026

Branch: `design/never-material-worlds`

## Code gates completed in this pass

- Material/Glass geometry hardened without changing the approved Home/Calendar structure.
- Shared MemoryRow and NeverInput now inherit Material World geometry instead of legacy fixed values.
- Pre-device regression coverage added for core-screen typography, touch targets, loading/error states and onboarding.
- Intelligence runtime imports are being normalized for Node `--experimental-strip-types` compatibility.
- App Store-specific release gate added for environment, brand/native identity, assets, privacy manifests and native configuration.

## Supabase architecture audit

Repository SQL enables RLS on `public.items` and `public.profiles` and grants access only to `authenticated`. Ownership policies use `(select auth.uid()) = user_id`. Update policies include both `USING` and `WITH CHECK`. This is the correct ownership pattern for the current single-user data model.

The mobile client uses a Supabase publishable key, not a service-role/secret key. `service_role` keys must never be added to Expo public configuration.

Live database verification was not performed in this pass because the Supabase connection available to the agent does not expose the project ref configured in the NEVER repository (`uuehozwygopldwcbkfci`). Before release, run security and performance advisors on the actual NEVER project and verify deployed schema/functions match the repository SQL.

## Production blockers / explicit decisions

### 1. Native identity migration

The visible product is NEVER, while native identifiers are still inherited from ONE:

- scheme: `one`
- iOS bundle: `app.one.mobile`
- Android package: `app.one.mobile`
- Share Extension: `app.one.mobile.ShareExtension`
- App Group: `group.app.one.mobile`

Do not casually rename these after production provisioning. Before App Store submission, make an explicit decision:

A. retain legacy identifiers intentionally (and document this), or
B. migrate to NEVER identifiers before production certificates, App Groups, universal/deep links and Store records are finalized.

`npm run release:appstore-check` now fails on unresolved legacy identity unless `NEVER_ALLOW_LEGACY_IDENTIFIERS=1` is deliberately set.

### 2. Public production environment

Required for release:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- `EXPO_PUBLIC_SUPPORT_URL`
- `EXPO_PUBLIC_TERMS_URL` for App Store scope
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` for paid iOS access

All public URLs must be HTTPS and final. Secret/service-role/OpenAI keys remain server-only.

### 3. RevenueCat / StoreKit

Code already fails closed when billing is not configured: preview/production must not grant paid access from a missing RevenueCat configuration. Before release verify real App Store products, entitlements, offerings, restore purchases and subscription-management URL on a sandbox/TestFlight account.

### 4. Notifications and Share Extension

Production configuration includes Notifications and Share Extension/App Group capabilities. Personal Team device mode intentionally strips unsupported capabilities and therefore cannot certify production push/share behavior. Verify these with the production Apple team/TestFlight provisioning.

### 5. Physical iPhone acceptance

Still required after the current visual repair pass:

- all six Material Worlds on Home/Search/Calendar/Saved/Settings
- keyboard transitions and scroll-to-focused-input
- Dynamic Type and VoiceOver
- Reduce Transparency / Reduce Motion
- status-bar/home-indicator/safe-area behavior
- native Liquid Glass against brightest/darkest artwork regions
- Share Extension import
- local notification permission/scheduling

## Release commands

General quality:

```sh
npm run quality
```

App Store gate after final environment and identity decisions:

```sh
npm run release:appstore-check
```

Physical personal-team visual test:

```sh
NEVER_LOCAL_DEVICE_TEST=1 npm run ios:device:test:clean
```

A successful repository gate is necessary but does not replace TestFlight/device acceptance.
