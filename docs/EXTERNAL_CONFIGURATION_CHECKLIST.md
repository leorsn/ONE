# NEVER — External Configuration Checklist

This file separates repository completion from configuration that lives in Apple, Expo/EAS, Supabase, RevenueCat, OpenAI and App Store Connect.

Status vocabulary:

- **CODE COMPLETE** — repository contract/config exists.
- **EXTERNALLY CONFIGURED** — verify in the named external service; do not infer from code.
- **PHYSICALLY TESTED** — verify only on an appropriately signed physical-device/TestFlight build.

## Final public identity

The retired ONE namespace is not part of the launch candidate.

- App name: `NEVER`
- Expo slug: `never-app`
- Deep-link scheme: `never`
- iOS bundle ID: `app.never.mobile`
- Android package: `app.never.mobile`
- Share Extension: `app.never.mobile.ShareExtension`
- App Group: `group.app.never.mobile`

## Apple Developer / iOS

| Requirement | Code state | External action | Physical acceptance |
| --- | --- | --- | --- |
| Display name `NEVER` | CODE COMPLETE | Verify final App Store Connect name | Installed app/system surfaces show NEVER |
| Main bundle ID `app.never.mobile` | CODE COMPLETE | Register identifier and signing team | Install signed build |
| Share Extension `app.never.mobile.ShareExtension` | CODE COMPLETE | Register extension identifier/credentials | Share Sheet shows NEVER |
| App Group `group.app.never.mobile` | CODE COMPLETE | Assign group to required targets/profiles | Share payload handoff succeeds |
| URL scheme `never` | CODE COMPLETE | Included in signed binary | Auth/reset links open NEVER |
| Notifications integration | CODE COMPLETE | Enable required production capability/signing | Local delivery/tap/cancel |
| Camera/Photos permission copy | CODE COMPLETE | Generated through Expo config | Permission flows show NEVER copy |
| iPad support | CODE COMPLETE | Keep App Store device support aligned | Critical flows + resize/layout pass |
| Privacy manifest | CODE COMPLETE | Inspect final archive aggregation | No unresolved privacy-manifest warning |

The repository now declares `ios.privacyManifests` explicitly and the CI privacy contract keeps it aligned with the App Store privacy inventory. Do not add tracking, analytics, ads or crash SDKs without intentionally revisiting those disclosures.

## Expo / EAS

- [ ] Link the repository to the intended Expo/EAS project and verify project owner.
- [ ] Verify EAS credentials for the Apple Developer Team.
- [ ] Development profile uses the `development` environment and a development client.
- [ ] Preview profile uses `preview` and no development-client tooling.
- [ ] Production profile uses `production`, no development-client tooling, and auto-increments the build number.
- [ ] Set production values for:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `EXPO_PUBLIC_PRIVACY_POLICY_URL`
  - `EXPO_PUBLIC_TERMS_URL`
  - `EXPO_PUBLIC_SUPPORT_URL`
  - `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- [ ] Run `npm run release:testflight-check` before a billing-capable TestFlight build.
- [ ] Run `npm run release:appstore-check` before App Store submission.
- [ ] Build from the exact accepted SHA.

Do not print secret values into CI logs or tickets. Server-side secrets do not belong in `EXPO_PUBLIC_*` values.

## Supabase

### Repository contract

- private user data is protected by RLS;
- ownership policies scope records to `auth.uid()`;
- attachment Storage is private and user-path scoped;
- account deletion, semantic search, embedding, capture intelligence and grounded recall functions are represented in the production deployment manifest;
- client auth uses PKCE.

### External configuration still required

- [ ] Auth → URL Configuration allows `never://auth/callback`.
- [ ] Auth → URL Configuration allows `never://auth/reset-password`.
- [ ] Remove/review obsolete `one://` redirect entries once no migration bridge is needed.
- [ ] Production confirmation/password-reset email delivery works.
- [ ] Sender name/subject/body use NEVER branding.
- [ ] Customized templates preserve the supplied redirect target.
- [ ] Deploy SQL/functions in `docs/SUPABASE_DEPLOYMENT_MANIFEST_2026-09-30.md` to the dedicated NEVER project.
- [ ] Verify RLS and Storage isolation with two separate test accounts.
- [ ] Verify account deletion removes cloud data and auth user.
- [ ] Keep `OPENAI_API_KEY` server-side only.

## RevenueCat / App Store billing

Launch contract:

### NEVER
- Product: `app.never.mobile.monthly`
- RevenueCat package: `never_monthly`
- Entitlement: `never`
- Target price: €2.99/month
- Level 2
- 7-day introductory trial target

### NEVER AI
- Product: `app.never.mobile.ai.monthly`
- RevenueCat package: `never_ai_monthly`
- Entitlement: `never_ai`
- Target price: €4.99/month
- Level 1
- no planned launch trial

External actions:

- [ ] Create the RevenueCat iOS app with bundle ID `app.never.mobile`.
- [ ] Create/import both exact Apple product IDs.
- [ ] Create entitlements `never` and `never_ai`.
- [ ] Create offering `default`.
- [ ] Map packages `never_monthly` and `never_ai_monthly` to the correct products.
- [ ] Configure NEVER's introductory trial in App Store Connect.
- [ ] Set the RevenueCat public iOS SDK key in the EAS production environment.
- [ ] Sandbox/TestFlight-test purchase, cancellation, restore, upgrade/downgrade, network failure and account switching.
- [ ] Confirm no release build receives development beta access when billing is unavailable.

See `docs/APP_STORE_REVENUECAT_PRODUCTION.md` for the exact setup contract.

## NEVER AI / OpenAI server boundary

- [ ] Store `OPENAI_API_KEY` only as a Supabase Edge Function secret.
- [ ] Never create `EXPO_PUBLIC_OPENAI_*` secrets.
- [ ] Run authenticated end-to-end Ask NEVER against real user-scoped test memories.
- [ ] Verify model failure returns a safe fallback rather than fabricated success.
- [ ] Verify grounded answers cite only saved evidence supplied through the authenticated path.

## App Store Connect / policy

Before submission:

- [ ] App record bundle identifier is exactly `app.never.mobile`.
- [ ] Privacy Policy URL is final/public HTTPS.
- [ ] Support URL is final/public HTTPS.
- [ ] Terms URL is final/public HTTPS.
- [ ] App Privacy answers match `docs/APP_STORE_PRIVACY_DATA_INVENTORY.md` and the final production vendor configuration.
- [ ] Subscription metadata, localizations, prices and reviewer screenshots are complete.
- [ ] App description, keywords, age rating, review information and screenshots are complete.
- [ ] Final icon passes `npm run release:asset-check`.
- [ ] Required iPhone and iPad screenshot sets are complete because iPad support remains enabled.
- [ ] Account deletion is physically tested; active subscribers are warned that Apple subscription cancellation is separate.

See `docs/APP_STORE_METADATA_DRAFT.md`, `docs/APP_STORE_SUBMISSION.md`, and `docs/TESTFLIGHT_ACCEPTANCE_2026-09-30.md`.

## Technical data inventory

NEVER may process, depending on user behavior and enabled features:

- account email/authentication identifiers;
- user-created memory text and structured metadata;
- images/documents and OCR-derived text;
- private cloud records and Storage attachments;
- local notification/reminder data;
- subscription/customer state through RevenueCat;
- bounded saved-memory context and user recall queries through the authenticated NEVER AI server path.

The launch disclosure baseline is maintained in `docs/APP_STORE_PRIVACY_DATA_INVENTORY.md` and enforced by the repository privacy gate.
