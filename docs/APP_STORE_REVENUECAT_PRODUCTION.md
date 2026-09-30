# NEVER — App Store Connect + RevenueCat production setup

Status: production configuration contract for the current iOS launch candidate.

This document does not change the app UI. It defines the external Store configuration that must match the repository before TestFlight/App Store release.

## 1. Native identity decision first

Current iOS bundle identifier in the repository:

`app.one.mobile`

Current subscription product IDs intentionally inherit that namespace:

- `app.one.mobile.one.monthly`
- `app.one.mobile.oneai.monthly`

Before creating production App Store records, make one explicit decision:

1. retain `app.one.mobile` for the first NEVER release and set `NEVER_ALLOW_LEGACY_IDENTIFIERS=1` only after that decision is intentional, or
2. migrate the native app identity before creating final App Store products/provisioning.

Do not create final subscription products under one namespace and then rename the app identifiers casually afterward.

## 2. Apple account prerequisites

Before App Store subscription testing:

- Apple Developer Program membership must be active.
- The Paid Applications Agreement must be accepted in App Store Connect.
- Required tax forms must be completed.
- Banking information must be added and cleared.
- The App Store Connect app record bundle identifier must match the Xcode/Expo bundle identifier used for production.

## 3. App Store subscription group

Create one auto-renewable Subscription Group.

Reference name:

`NEVER Membership`

Add at least one localization to the subscription group before review submission.

Recommended English display name:

`NEVER Membership`

German localization can be added before submission if Germany is a launch storefront.

## 4. Product A — NEVER

Reference name:

`NEVER Monthly`

Product ID:

`app.one.mobile.one.monthly`

Duration:

`1 Month`

Approved launch price target:

`€2.99 / month` in the German storefront, using Apple's closest available price point.

Subscription level:

`Level 2`

Reason: NEVER AI offers the higher service tier and therefore occupies Level 1 in the same group.

Introductory offer target:

- Free Trial
- 7 days
- Apple ultimately determines customer eligibility.

Repository mapping:

- RevenueCat package ID: `one_monthly`
- RevenueCat entitlement: `one`
- App plan: `one`

## 5. Product B — NEVER AI

Reference name:

`NEVER AI Monthly`

Product ID:

`app.one.mobile.oneai.monthly`

Duration:

`1 Month`

Approved launch price target:

`€4.99 / month` in the German storefront, using Apple's closest available price point.

Subscription level:

`Level 1`

Reason: Level 1 is the higher service tier in an Apple subscription group. NEVER AI includes NEVER plus the AI/semantic-recall feature set.

Introductory offer target:

`None` for the initial launch configuration.

Repository mapping:

- RevenueCat package ID: `one_ai_monthly`
- RevenueCat entitlement: `one_ai`
- App plan: `one_ai`

## 6. Subscription upgrade/downgrade contract

The two products must remain in the same Apple subscription group.

Expected path:

- NEVER → NEVER AI = upgrade to Level 1.
- NEVER AI → NEVER = downgrade to Level 2.

The app does not invent entitlement state locally. Access is resolved from RevenueCat CustomerInfo after purchase/restore/refresh.

## 7. App Store product metadata required before review

For both subscription products configure:

- localization/display name
- subscription description
- price
- availability/storefronts
- review screenshot showing the actual NEVER Membership screen
- optional review notes if needed

Suggested reviewer note:

`The Membership screen is available after account sign-in. NEVER is the base subscription. NEVER AI is the higher tier and includes grounded AI recall over the user's saved memory. Restore Purchases is available on the Membership screen.`

## 8. RevenueCat project

Create/connect the NEVER iOS app using the same production App Store bundle identifier.

Import/link both Apple products exactly:

- `app.one.mobile.one.monthly`
- `app.one.mobile.oneai.monthly`

Create entitlements exactly:

- `one`
- `one_ai`

Attach products:

- `app.one.mobile.one.monthly` → entitlement `one`
- `app.one.mobile.oneai.monthly` → entitlement `one_ai`

Create offering:

`default`

Add packages exactly:

- `one_monthly` → NEVER product
- `one_ai_monthly` → NEVER AI product

The app accepts either the configured package ID or exact Apple product ID when locating a package, but the approved production configuration should use the package IDs above.

## 9. RevenueCat public SDK key

Configure the iOS public SDK key in the EAS production environment as:

`EXPO_PUBLIC_REVENUECAT_IOS_KEY`

This is a client/public RevenueCat SDK key. Never place RevenueCat secret API keys in an `EXPO_PUBLIC_*` variable or in the repository.

## 10. Required sandbox/TestFlight matrix

Before App Store submission, run all of these with a StoreKit sandbox/TestFlight account:

1. Fresh account with no subscription → Membership paywall shown.
2. Buy NEVER → base access active.
3. Relaunch app → NEVER entitlement remains active.
4. Restore Purchases → NEVER restored correctly.
5. Upgrade NEVER → NEVER AI → AI access becomes active.
6. Relaunch → NEVER AI remains active.
7. Downgrade/switch to NEVER through Apple's subscription management flow → final entitlement follows Apple/RevenueCat state.
8. Restore with no active subscription → app reports that no active NEVER subscription was found.
9. Cancel purchase sheet → no error entitlement and no false success message.
10. Network interruption during purchase/refresh → no locally fabricated paid access.
11. Sign out and sign into a different NEVER account → RevenueCat identity is changed before paid state is reused.
12. Verify Apple's Manage Subscription URL opens from the active subscription state.

## 11. Release commands

Static Store contract:

```sh
npm run release:store-subscription-check
```

Full App Store release gate after production environment variables and native identity are final:

```sh
NEVER_ALLOW_LEGACY_IDENTIFIERS=1 npm run release:appstore-check
```

Only set `NEVER_ALLOW_LEGACY_IDENTIFIERS=1` if retaining the legacy native identifiers is an explicit production decision. Otherwise migrate them first.

## 12. External evidence still required

Repository checks cannot prove App Store Connect or RevenueCat dashboard state. Before submission, manually confirm:

- both exact products exist and are Ready to Submit/approved as appropriate
- subscription group levels are correct
- offering `default` exposes both packages
- each entitlement is attached to the correct product
- RevenueCat iOS public SDK key belongs to the NEVER production project/app
- paid agreements/tax/banking are complete
- product reviewer screenshots are attached
- TestFlight purchase/restore matrix above passes
