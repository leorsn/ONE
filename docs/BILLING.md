# NEVER — Billing Architecture

## Launch products

Both products are auto-renewable subscriptions in one App Store subscription group: `NEVER Membership`.

### NEVER

- Product ID: `app.never.mobile.monthly`
- RevenueCat package: `never_monthly`
- RevenueCat entitlement: `never`
- Price target: 2.99 EUR/month
- Subscription level: 2
- Introductory offer: 7-day free trial
- Auto-renewal: enabled
- Billing starts automatically after the trial unless the customer cancels

### NEVER AI

- Product ID: `app.never.mobile.ai.monthly`
- RevenueCat package: `never_ai_monthly`
- RevenueCat entitlement: `never_ai`
- Price target: 4.99 EUR/month
- Subscription level: 1
- Introductory offer: none
- Charged immediately on purchase
- Auto-renewal: enabled

## Upgrade behavior

NEVER AI is ranked above NEVER in the same subscription group.

A move from NEVER to NEVER AI is an upgrade. A move from NEVER AI down to NEVER follows Apple's subscription-group downgrade behavior and final Store/RevenueCat state.

## Purchase stack

Production architecture:

1. App Store Connect defines the actual products, prices, free trial and subscription group.
2. StoreKit performs the purchase and Apple payment sheet.
3. RevenueCat is the entitlement/subscription-state layer used by the mobile client.
4. NEVER reads external entitlements `never` or `never_ai` and maps them to the existing internal app plan keys `one` or `one_ai`.
5. Existing feature gates enable or disable Ask NEVER / semantic AI capabilities.

The internal plan-key names are implementation details only. No public Store, bundle, deep-link, package or entitlement identifier uses the retired ONE namespace.

## Trial rules

The seven-day trial belongs only to NEVER.

NEVER AI deliberately has no planned launch trial.

The UI must never hard-code trial eligibility as guaranteed. Eligibility must come from StoreKit/RevenueCat because Apple determines whether the App Store account can receive an introductory offer.

## Development beta

`BETA_PLAN` may remain the internal value `one_ai` so development clients can exercise the complete feature set without live App Store purchases.

This fallback is development-only. A preview or production bundle without RevenueCat configuration resolves to no paid entitlement and is routed to the upgrade surface. Missing billing configuration must never silently unlock NEVER or NEVER AI in a release build.

## RevenueCat mobile integration

The app-side RevenueCat layer is implemented with `react-native-purchases`.

Environment variables:

- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

RevenueCat production configuration:

- Entitlement `never`
- Entitlement `never_ai`
- Offering `default`
- Package `never_monthly` → `app.never.mobile.monthly`
- Package `never_ai_monthly` → `app.never.mobile.ai.monthly`

Real purchase testing requires a native TestFlight build and correctly configured App Store/RevenueCat products. Purchase, restore, upgrade/downgrade, account switching and subscription management must pass the TestFlight acceptance matrix before submission.
