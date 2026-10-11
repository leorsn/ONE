# NEVER — Launch acceptance ledger (11 October 2026)

**Release status: NOT READY FOR APP STORE.** Do not confuse a passing GitHub CI workflow with store authorization, paid subscription verification, or final iPhone visual acceptance.

## Completed with actual evidence
- Membership annual/monthly UI switching tested on physical iPhone by product owner; code merged to `design/never-material-worlds` in PR #10.
- Two-account data visibility isolation tested on physical iPhone by product owner; supplemental owner-filter queries merged in PR #11. Not a penetration test.
- User reports correct AI recall answers and sources on physical device. Not a quantitative quality or cross-account data leakage audit.
- GitHub Quality #849 passed for synchronization hardening. Later design work is kept isolated in PR #12.

## Release blockers (P0)
- **Apple Developer / App Store Connect:** verify paid Apple Developer enrollment, app records, bundle identifiers and App Group/Share Extension signing.
- **Real Apple subscriptions:** create or verify monthly and yearly NEVER + NEVER AI auto-renewable products in one subscription group; correct tier levels, storefront prices and trial terms; attach to Apple-backed RevenueCat iOS application, offering and entitlements. Current Test Store products do not satisfy this.
- **Billing sandbox:** purchase ×4, restore, cancel, product unavailable, upgrades/downgrades and account-switch entitlements; collect StoreKit/TestFlight evidence.
- **Production environment:** configure true public Supabase, Apple-backed `appl_` RevenueCat key, privacy/support/terms HTTPS URLs, EAS signing and App Store metadata, then execute `npm run release:testflight-check` / `npm run release:appstore-check` with credentials in protected CI/environment (never commit secrets).
- **Privacy/security:** resolve leaked-password-protection advisor warning if available for project tier; verify RLS, storage ownership, account deletion and personal-data export on signed build.
- **iPhone final visual signoff:** Light/Dark redesign on PR #12 was explicitly postponed until tomorrow. **Do not merge** until wallpapers, all screens and device QA are accepted.

## Remaining functional device matrix (P1)
- Offline capture, reconnect without duplicates, deletion tombstones stay deleted, pagination, Account A/B switching without content flash.
- Share Sheet extension, OCR/scan permissions, notifications/reminders and time zones.
- Cold-start, reinstall, keyboard/Dynamic Type, low connectivity and iPad if included in deployment targets.
- Source-backed Recall negative cases: no result, conflicting notes, deleted note and account changes.

## Recommended sequencing
1. Keep approved visuals on separate PR #12; do not change app look tonight.
2. Harden automated release contracts (four monthly/annual products), run full CI.
3. Configure external Apple products/signing when the user has a developer account.
4. Perform sandbox purchases, device QA, privacy checks and capture evidence.
5. Merge signed-off design, run final CI and produce TestFlight build; only then consider App Store submission.
