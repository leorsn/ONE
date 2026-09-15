# ONE — Billing Architecture

## Launch products

Both products should be configured as auto-renewable subscriptions in one App Store subscription group.

### ONE

- Product ID: `app.one.mobile.one.monthly`
- Price: 2.99 EUR/month
- Subscription level: 2
- Introductory offer: 7-day free trial
- Auto-renewal: enabled
- Billing starts automatically after the trial unless the customer cancels

### ONE AI

- Product ID: `app.one.mobile.oneai.monthly`
- Price: 4.99 EUR/month
- Subscription level: 1
- Introductory offer: none
- Charged immediately on purchase
- Auto-renewal: enabled

## Upgrade behavior

ONE AI is ranked above ONE in the same subscription group.

This means a move from ONE to ONE AI is an upgrade and should take effect immediately according to App Store subscription-group rules.

A move from ONE AI down to ONE should take effect at the next renewal boundary.

## Purchase stack

Production architecture:

1. App Store Connect defines the actual products, prices, free trial and subscription group.
2. StoreKit performs the purchase and Apple payment sheet.
3. RevenueCat is the entitlement/subscription-state layer used by the mobile client.
4. ONE reads the active entitlement and maps it to `one` or `one_ai`.
5. Existing feature gates enable or disable Ask ONE / semantic AI capabilities.

## Trial rules

The seven-day trial belongs only to ONE.

ONE AI deliberately has no trial.

The UI must never hard-code trial eligibility as guaranteed. Eligibility must come from StoreKit/RevenueCat because Apple determines whether the App Store account can receive an introductory offer.

## Development beta

`BETA_PLAN` remains `one_ai` so development clients can exercise the complete product without live App Store purchases.

This fallback is development-only. A preview or production bundle without RevenueCat configuration resolves to no paid entitlement and is routed to the upgrade surface. Missing billing configuration must never silently unlock ONE or ONE AI in a release build.

## RevenueCat mobile integration

The app-side RevenueCat layer is implemented with `react-native-purchases`.

Environment variables:

- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

RevenueCat configuration expected:

- Entitlement `one`
- Entitlement `one_ai`
- Offering `default`
- Package `one_monthly` -> `app.one.mobile.one.monthly`
- Package `one_ai_monthly` -> `app.one.mobile.oneai.monthly`

Real purchase testing still requires a native Expo development/TestFlight build and correctly configured App Store/RevenueCat products. Restore and management state must be accepted against the real App Store environment before release.
