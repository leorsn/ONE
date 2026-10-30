# NEVER P04 — Local iPhone testing without an Expo account

Date: 30 October 2026. Pilot window: 8–10 November 2026. Cost ceiling: €0 additional.

## Decision

The owner has no Expo account and does not want to create one for this work. **Do not attempt EAS account creation, EAS environment setup, hosted EAS builds or app submission.** EAS is not necessary for Supabase project consolidation or for the KENTON HQ web pilot.

Expo's official local development-build route uses `npx expo run:ios --device` with Xcode on macOS. It does not require an Expo account; a personal Apple development team can sign a local development build. The existing `NEVER_LOCAL_DEVICE_TEST=1` configuration intentionally excludes Push Notifications and App Groups capabilities for that restricted test mode. This cannot replace App Store/TestFlight release acceptance.

## Current local code evidence

- The default mobile client project is `https://nywfoprcwbnsxybdqpma.supabase.co` with a public publishable key, and does not use the legacy `uuehozwygopldwcbkfci` URL.
- P04 adds a fail-closed check for `NEVER_LOCAL_DEVICE_TEST=1`: any explicitly supplied `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must match the approved NEVER destination. Missing overrides use approved code defaults.
- `tests/p04-local-device-no-eas.test.mjs` checks the account-free default, stale ONE URL denial, wrong key denial and exact matching values.
- Complete local verification after P04: `EXPO_NO_TELEMETRY=1 npm test` **282/282 passing**, `npm run typecheck` passing, `EXPO_NO_TELEMETRY=1 npm run lint` passing. These are local checks, not a signed iOS runtime acceptance.
- No real iPhone build, Auth login, password reset, attachment upload or cross-user exchange was performed in the agent's Linux workspace.

## Procedure for the owner's Mac (only after local readiness)

1. Have Xcode and its command-line tools installed. Connect the iPhone via USB and enable Developer Mode; use a working local Apple signing team. Verify enough disk space.
2. Obtain the isolated NEVER source branch (`ops/never-p03-functions-hardening-20261030`), not the repository's README-only `main` branch. Preserve existing local projects and worktrees.
3. Install locked dependencies with `npm ci`; run `EXPO_NO_TELEMETRY=1 npm test`, `npm run typecheck` and `EXPO_NO_TELEMETRY=1 npm run lint`.
4. Check that stale shell `.env` values cannot override the approved public Supabase target. Never set any service-role key or third-party AI secret in `EXPO_PUBLIC_*` variables.
5. For an isolated physical-device development build, run `NEVER_LOCAL_DEVICE_TEST=1 npx expo run:ios --device` (the existing `npm run ios:device:test` command is equivalent). Do **not** use the destructive `ios:device:test:clean` shortcut unless its native directory effects have been reviewed and approved.
6. Only with explicitly authorized disposable Auth accounts, test login, email recovery/deep links, own items, private attachment access, other-account denial, and logout/relogin. No original passwords or imported users' real data should be used for trial deletion.
7. Document device, iOS version, signing method, log redactions and pass/fail evidence. Do not claim App Store or KENTON pilot acceptance from a local iPhone test.

## Separate remaining gates

- **NEVER:** five P03 functions remain undeployed; server-side API secrets, remote model consent/transparency, real Auth and Storage isolation tests still require authorization.
- **KENTON HQ:** hosted web and PostgreSQL/CI acceptance remains its own workstream, independent of Expo account creation. The pilot is NO-GO until its own real workflows pass.

Official Expo reference: <https://docs.expo.dev/develop/development-builds/introduction/>.
