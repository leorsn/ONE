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

Recommended production architecture:

1. App Store Connect defines the actual products, prices, free trial and subscription group.
2. StoreKit performs the purchase and Apple payment sheet.
3. RevenueCat can be used as the entitlement/subscription-state layer to simplify receipt validation, restore purchases, trial eligibility and cross-platform billing logic.
4. ONE reads the active entitlement and maps it to:
   - `one`
   - `one_ai`
5. Existing feature gates then enable or disable Ask ONE / semantic AI capabilities.

## Trial rules

The seven-day trial belongs only to ONE.

ONE AI deliberately has no trial.

The UI must never hard-code trial eligibility as guaranteed. It should read eligibility from StoreKit/RevenueCat because Apple determines whether the App Store account is eligible for an introductory offer.

## Beta

During development, `BETA_PLAN` remains set to `one_ai` so all features can be tested without live App Store purchases.
