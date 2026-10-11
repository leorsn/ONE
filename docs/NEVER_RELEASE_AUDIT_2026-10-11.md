# NEVER — Release integration audit (2026-10-11)

## Scope
Repository: `leorsn/ONE`. This document records GitHub branch-history and source inspection only; it is **not** a claim that tests or physical-device checks have passed.

## Verified comparisons
- `design/never-material-worlds` -> `fix/never-revenuecat-package-safety-2026-10-08`: latter is 18 commits ahead, 0 behind.
- `design/never-material-worlds` -> `fix/never-release-docs-2026-10-08`: latter is 4 commits ahead, 0 behind.
- Release-docs branch vs RevenueCat branch: diverged (RevenueCat branch 18 commits ahead / 4 behind).
- `quality/never-pre-device` is 169 commits behind design branch.
- `feat/never-intelligence-v1` is 122 commits behind design branch.
These figures are directional GitHub compare results as of this audit, not equivalent to independent missing features.

## Selected integration baseline
`audit/never-release-2026-10-11` starts from `fix/never-revenuecat-package-safety-2026-10-08`, preserving the 18 RevenueCat-related commits. **Do not merge this audit branch into the production app solely on this report.** Before promotion, reconcile the 4 later release-documentation commits and verify no conflicting modifications.

## Findings and remaining acceptance gates
1. RevenueCat SDK package `react-native-purchases@10.9.0` is declared and `src/subscription/revenueCat.ts` implements configuration, purchase, restore and identity synchronization. Actual App Store Connect products/RevenueCat offering/entitlements and real StoreKit purchase flows remain externally unverified.
2. `package.json` contains `quality`, `release:testflight-check`, `release:appstore-check`, asset/privacy/subscription/native configuration checks. These checks were **not executed** in this connector audit; a successful GitHub source read is not a passing CI run.
3. Release blocker document specifies `app.never.mobile`, `app.never.mobile.ShareExtension`, `group.app.never.mobile`, and `never://` as intended external signing/link contracts. Confirm production native config and registrations before signed distribution.
4. Physical iPhone smoke tests, Share Sheet, OCR, auth deep links, notifications, account isolation, offline reconnect, visual QA and iPad acceptance are outstanding unless supported by signed-build test evidence.
5. Production Supabase settings, security policies, credentials, EAS, Apple Developer, App Store Connect, privacy manifests and public legal URLs are **not proven** by repository inspection.

## Immediate execution order
1. Reconcile `fix/never-release-docs-2026-10-08` into this integration branch (pay particular attention to `.github/workflows/quality.yml`, `docs/DEVICE_TEST_PLAN.md` and `docs/V1_RELEASE_BLOCKERS.md`).
2. On a clean checkout run `npm ci --no-audit --no-fund`, `npm run quality`, `npm run release:testflight-check` with appropriate protected staging credentials. Collect exit codes and CI SHA. Do not commit secrets.
3. Compare `app.json` / `app.config.js` to Apple bundle IDs, App Group, entitlements and Supabase redirect URLs.
4. Configure/verify RevenueCat products and App Store Connect subscriptions, then run real sandbox purchase/restore/cancel/account-switch testing.
5. Obtain signed physical iPhone build and record evidence against `docs/DEVICE_TEST_PLAN.md` and `docs/NEVER_VISUAL_QA.md`.
6. Close all P0/P1 issues and finally run App Store release gate.

## Safety constraints
Do not change the approved material-world design, consumer-facing NEVER branding or compatibility identifiers speculatively. Do not infer external configuration from local templates. Do not ship on passing unit tests alone.
