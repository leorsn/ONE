# NEVER launch readiness — 30 September 2026

Branch: `design/never-material-worlds`

## Product state

The physical iPhone visual pass has been accepted. The NEVER visual system is frozen until launch: no further Home/Search/Calendar/Saved/Settings, navigation, typography, spacing or Material World changes unless a genuine rendering/accessibility defect is discovered.

## Code gates completed

- Material/Glass geometry hardened without changing approved structure.
- System appearance uses true basic light/dark runtime surfaces without premium Material World artwork.
- Archive/Tidal world-specific control palettes are accepted.
- Search/Ask NEVER has explicit grounded/no-evidence behavior.
- Share handoffs are deduplicated and supported private attachments are secured before save.
- Supported cloud originals: JPEG, PNG, WebP, HEIC/HEIF, GIF, TIFF and PDF.
- Local add/edit/delete persistence is transactional.
- Account deletion treats confirmed server deletion as final and performs local cleanup best-effort.
- Native deep links use an allowlist.
- RevenueCat purchases/restores are checked against actual entitlements and account identity.
- Client-secret, EAS, Store-subscription, privacy and native-release gates are automated.
- App Store metadata, TestFlight matrix and privacy inventory exist in the repository.
- iOS privacy-manifest declarations are coupled to the privacy inventory through CI.

## Final native/public identity

The identity decision is complete. The public launch candidate uses ONLY the NEVER namespace:

- display name: `NEVER`
- Expo slug: `never-app`
- scheme: `never`
- iOS bundle: `app.never.mobile`
- Android package: `app.never.mobile`
- Share Extension: `app.never.mobile.ShareExtension`
- App Group: `group.app.never.mobile`

Authentication callbacks:

- `never://auth/callback`
- `never://auth/reset-password`

The previous `app.one.mobile`, `group.app.one.mobile`, `one-app` and `one://` public identifiers are retired from the release candidate. Internal code/domain names such as `OneItem` or internal plan keys `one`/`one_ai` may remain because they do not define public app identity.

## Subscription identity

### NEVER

- Apple product: `app.never.mobile.monthly`
- RevenueCat package: `never_monthly`
- RevenueCat entitlement: `never`
- Apple group level: 2
- target price: €2.99/month
- 7-day introductory trial target

### NEVER AI

- Apple product: `app.never.mobile.ai.monthly`
- RevenueCat package: `never_ai_monthly`
- RevenueCat entitlement: `never_ai`
- Apple group level: 1
- target price: €4.99/month
- no planned launch trial

Offering: `default`.

## Supabase architecture

Repository SQL enables user-scoped RLS on private application records. The private `one-attachments` bucket name and `one_*` SQL/function filenames are internal backend implementation identifiers and are not consumer/native app identity.

The mobile client uses a Supabase publishable key, never a service-role credential. Server secrets remain server-side.

Live production database verification still must occur on the dedicated NEVER Supabase project before TestFlight acceptance.

## Remaining production work

### 1. Apple Developer / signing

Register/configure:

- `app.never.mobile`
- `app.never.mobile.ShareExtension`
- `group.app.never.mobile`
- required notification and App Group capabilities

The Personal Apple Team local test path intentionally strips unsupported capabilities and cannot certify production signing.

### 2. Supabase production deployment

On the actual NEVER project:

- deploy the SQL manifest;
- deploy all required Edge Functions;
- add `never://auth/callback` and `never://auth/reset-password` to allowed redirects;
- verify confirmation/reset email flows;
- verify RLS and attachment isolation with two accounts;
- verify account deletion;
- run security/performance advisors.

See `docs/SUPABASE_DEPLOYMENT_MANIFEST_2026-09-30.md`.

### 3. RevenueCat / App Store Connect

Create the iOS app with bundle ID `app.never.mobile`, then configure the exact Store products, packages, entitlements and offering listed above.

Test on sandbox/TestFlight:

- purchase NEVER;
- restore NEVER;
- upgrade to NEVER AI;
- no-subscription restore;
- cancelled purchase;
- network failure;
- account switching;
- Manage Subscription.

See `docs/APP_STORE_REVENUECAT_PRODUCTION.md`.

### 4. Production environment / legal URLs

Required release values:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- `EXPO_PUBLIC_SUPPORT_URL`
- `EXPO_PUBLIC_TERMS_URL`
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`

Public URLs must be final HTTPS destinations. Server/admin/OpenAI secrets remain outside Expo public environment values.

### 5. Functional TestFlight acceptance

Design is frozen. Remaining device acceptance is functional:

- install/lifecycle;
- sign up / email confirmation / sign in / sign out;
- password reset;
- capture + edit + delete;
- offline capture then reconnect/sync;
- Search + Ask NEVER grounded/no-evidence behavior;
- export JSON;
- account deletion;
- RevenueCat sandbox purchase/restore;
- production Share Extension/App Group;
- notifications;
- iPhone + iPad accessibility/usability checks.

See `docs/TESTFLIGHT_ACCEPTANCE_2026-09-30.md`.

## Release commands

General quality:

```sh
npm run quality
```

Billing-ready TestFlight gate:

```sh
npm run release:testflight-check
```

Final App Store gate:

```sh
npm run release:appstore-check
```

Local Personal-Team physical build:

```sh
NEVER_LOCAL_DEVICE_TEST=1 npm run ios:device:test:clean
```

Because the bundle identifier changed, an already installed `app.one.mobile` development build is a different iOS application. The next local test of this migrated identity requires a fresh prebuild/install and will install as `app.never.mobile`.

Repository CI is necessary but does not replace external production configuration and TestFlight acceptance.
