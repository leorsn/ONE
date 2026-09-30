# NEVER — App Store Connect + RevenueCat production setup

Status: final production configuration contract for the current iOS launch candidate.

This document does not change the app UI. It defines the external Store configuration that must match the repository before TestFlight/App Store release.

## 1. Final native identity

The public NEVER namespace is final for the first release:

- Expo slug: `never-app`
- Deep-link scheme: `never`
- iOS bundle identifier: `app.never.mobile`
- Android package: `app.never.mobile`
- Share Extension bundle identifier: `app.never.mobile.ShareExtension`
- App Group: `group.app.never.mobile`

Supabase Auth callbacks:

- `never://auth/callback`
- `never://auth/reset-password`

Do not create new App Store, RevenueCat or Apple capability records under the retired `app.one.mobile` / `one://` namespace.

## 2. Apple account prerequisites

Before App Store subscription testing:

- Apple Developer Program membership must be active.
- The Paid Applications Agreement must be accepted in App Store Connect.
- Required tax forms must be completed.
- Banking information must be added and cleared.
- The App Store Connect app record must use bundle identifier `app.never.mobile`.
- Apple capabilities must be configured for `app.never.mobile`, `app.never.mobile.ShareExtension`, and `group.app.never.mobile` as required by the production build.

## 3. App Store subscription group

Create one auto-renewable Subscription Group.

Reference name:

`NEVER Membership`

Recommended English display name:

`NEVER Membership`

Add the required localization(s) before review submission.

## 4. Product A — NEVER

Reference name:

`NEVER Monthly`

Product ID:

`app.never.mobile.monthly`

Duration:

`1 Month`

Approved launch price target:

`€2.99 / month` in the German storefront, using Apple's available price point.

Subscription level:

`Level 2`

Introductory offer target:

- Free Trial
- 7 days
- Apple determines customer eligibility.

Repository mapping:

- RevenueCat package ID: `never_monthly`
- RevenueCat entitlement: `never`
- Internal app plan key: `one`

## 5. Product B — NEVER AI

Reference name:

`NEVER AI Monthly`

Product ID:

`app.never.mobile.ai.monthly`

Duration:

`1 Month`

Approved launch price target:

`€4.99 / month` in the German storefront, using Apple's available price point.

Subscription level:

`Level 1`

Introductory offer target:

`None` for the initial launch configuration.

Repository mapping:

- RevenueCat package ID: `never_ai_monthly`
- RevenueCat entitlement: `never_ai`
- Internal app plan key: `one_ai`

## 6. Upgrade/downgrade contract

The two products must remain in the same Apple subscription group.

Expected hierarchy:

- NEVER → NEVER AI = upgrade to Level 1.
- NEVER AI → NEVER = downgrade to Level 2.

The app does not invent entitlement state locally. Access is resolved from RevenueCat CustomerInfo after purchase, restore and refresh.

## 7. Product metadata required before review

For both subscription products configure:

- localization/display name
- subscription description
- price
- availability/storefronts
- review screenshot showing the actual NEVER Membership screen
- review notes where useful

Suggested reviewer note:

`The Membership screen is available after account sign-in. NEVER is the base subscription. NEVER AI is the higher tier and includes grounded AI recall over the user's saved memory. Restore Purchases and Manage Subscription are available in the app.`

## 8. RevenueCat production project

Create/connect the NEVER iOS app using bundle identifier:

`app.never.mobile`

Import/link both Apple products exactly:

- `app.never.mobile.monthly`
- `app.never.mobile.ai.monthly`

Create entitlements exactly:

- `never`
- `never_ai`

Attach products:

- `app.never.mobile.monthly` → entitlement `never`
- `app.never.mobile.ai.monthly` → entitlement `never_ai`

Create offering:

`default`

Add packages exactly:

- `never_monthly` → NEVER product
- `never_ai_monthly` → NEVER AI product

## 9. RevenueCat public SDK key

Configure the iOS public SDK key in the EAS production environment as:

`EXPO_PUBLIC_REVENUECAT_IOS_KEY`

This is a client/public RevenueCat SDK key. Never place RevenueCat secret API keys in an `EXPO_PUBLIC_*` variable or in the repository.

## 10. Supabase Auth redirect allowlist

Before TestFlight, add these exact Additional Redirect URLs to the dedicated NEVER Supabase project:

- `never://auth/callback`
- `never://auth/reset-password`

The production build no longer accepts the retired `one://` scheme.

## 11. Required sandbox/TestFlight matrix

Before App Store submission, run all of these with a StoreKit sandbox/TestFlight account:

1. Fresh account with no subscription → Membership paywall shown.
2. Buy NEVER → base access active.
3. Relaunch app → NEVER entitlement remains active.
4. Restore Purchases → NEVER restored correctly.
5. Upgrade NEVER → NEVER AI → AI access becomes active.
6. Relaunch → NEVER AI remains active.
7. Downgrade/switch through Apple's subscription management flow → final entitlement follows Apple/RevenueCat state.
8. Restore with no active subscription → app reports that no active NEVER subscription was found.
9. Cancel purchase sheet → no false success state.
10. Network interruption during purchase/refresh → no locally fabricated paid access.
11. Sign out and sign into a different NEVER account → RevenueCat identity changes before paid state is reused.
12. Verify Apple's Manage Subscription URL opens from the active subscription state.
13. Verify email confirmation opens `never://auth/callback` in NEVER.
14. Verify password reset opens `never://auth/reset-password` in NEVER.

## 12. Release commands

Static Store contract:

```sh
npm run release:store-subscription-check
```

Billing-ready TestFlight gate:

```sh
npm run release:testflight-check
```

Full App Store release gate:

```sh
npm run release:appstore-check
```

No legacy-identifier bypass is part of the final release flow.

## 13. External evidence still required

Repository checks cannot prove App Store Connect, RevenueCat, Apple Developer or Supabase dashboard state. Before submission, manually confirm:

- App Store record bundle ID is exactly `app.never.mobile`
- Share Extension and App Group capabilities use the final NEVER IDs
- both exact subscription products exist
- subscription group levels are correct
- offering `default` exposes both packages
- each entitlement is attached to the correct product
- RevenueCat iOS public SDK key belongs to the NEVER production app
- Supabase redirect allowlist contains both `never://` callbacks
- paid agreements/tax/banking are complete
- product reviewer screenshots are attached
- TestFlight purchase/restore/auth/share/notification matrix passes
