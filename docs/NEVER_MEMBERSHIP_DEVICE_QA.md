# NEVER Membership — physical-device visual acceptance

Status: **NOT YET ACCEPTED**. This is an execution checklist, not evidence of a physical device test.

## Target
- Build from the exact tested Git SHA on `audit/never-release-2026-10-11` after GitHub Quality passes, then record device model, iOS version, build number and tester.
- Compare against the app's existing Pass 3 / Material Worlds visual system; avoid redesigning other routes.

## Visual matrix (run on physical iPhone)
- Test **Platinum, Monolith, Archive, Aurora, Tactile, Orbit** in both yearly and monthly modes.
- Verify long features, smaller-screen iPhones, Dynamic Type and dark/light contrast; no text overlap, truncation, clipped borders, cut-off buttons, illegible badges or duplicated labels.
- Confirm NEVER AI chrome accent is restrained, remains readable against every material backdrop, and does not visually merge with an adjacent glass surface.
- Verify `Yearly` is initially selected and both buttons respond to `Yearly / Monthly` selection. Scroll to the legal disclosures and back on narrow screens.
- Verify annual discount/12-month equivalents display **only for configured preview fallback pricing**, not as unsupported assertions for unknown Apple storefront regional prices.

## Billing matrix (after real App Store Connect / RevenueCat iOS configuration)
- Check both tiers × both periods against current localized StoreKit price strings. No hardcoded planned EUR price should override store truth.
- Confirm unavailable packages disable their corresponding CTA; selecting another period does not allow purchase of an unavailable product.
- Confirm monthly and yearly selections route to exact Product ID and Package ID pair, never nearest available package.
- Test successful purchase, cancel, restore, existing subscriber status, upgrade/downgrade, renewal and account switching.
- Confirm Apple's subscription-group and intro-trial terms, no misleading savings, and renewal disclosure.

## Sign-off
- Build SHA: ______; iPhone: ______; iOS: ______; Tester: ______
- Material Worlds 6/6: ______; yearly/monthly 12/12: ______
- Billing 4/4: ______; screenshot evidence: ______; outstanding defects: ______
- **Do not mark passed without an actual signed iPhone build and screenshots.**
