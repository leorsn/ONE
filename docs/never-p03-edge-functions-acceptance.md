# NEVER P03 — Edge Function code hardening (30 October 2026)

## Scope and boundary

This is an isolated code-only preparation step based on `ops/never-backend-cutover-20261029` in `leorsn/ONE`. No Supabase function was deployed; no project, EAS environment, production key, account, or Storage record was changed. The 8–10 November pilot remains **NO-GO** pending hosted acceptance.

Target NEVER Supabase project: `nywfoprcwbnsxybdqpma` (NEVER organization, eu-west-1). At the start of P03 this project had zero deployed Edge Functions and no configured custom function secrets. Do not interpret code readiness as a deployed service.

## Changes

| Function | Code changes |
|---|---|
| `semantic-search` | POST-only; rejects absent/expired bearer tokens via `auth.getUser` before embedding; generic errors. Existing `match_one_items` SQL is `SECURITY INVOKER` and contains an `auth.uid()` owner predicate. |
| `embed-one-item` | POST-only; validates user before inference; owner-scoped read and update; checks that an update actually matched a row; generic errors. |
| `answer-one-recall` | POST-only; validates user before reading private memories or invoking the external model; owner-scopes item retrieval; does not echo upstream/DB errors. Existing citation allow-list checks remain in place. |
| `interpret-one-capture` | Strict bearer format, rejects non-object request bodies, removes invalid upstream error expression and masks upstream messages. Existing `store:false` remains. |
| `delete-account` | Strict bearer format; masks internal errors and logs no user data; removes nested private Storage objects; verifies removal progress; refuses to delete the Auth user if Storage cleanup fails. |

## Local verification

- New executable mocked-runtime tests in `tests/never-edge-functions-security.test.mjs`: unauthorized/expired tokens do not trigger inference or data access; all four AI/search functions reject non-POST methods; owner filters are present; deletion of nested files precedes Auth deletion; no-op Storage deletion fails closed.
- Existing auth, recall-grounding and account-deletion tests are retained (account-deletion static assertion adjusted to recursive Storage traversal).
- Targeted security tests: **PASS**.
- `npm run typecheck`: **PASS**.
- `EXPO_NO_TELEMETRY=1 npm run lint`: **PASS**. Telemetry must be disabled in restricted workspaces where `/root/.expo` is not writable.
- Full `EXPO_NO_TELEMETRY=1 npm test`: **279/279 tests passed** when run with permission to launch child processes. An initial restricted run reported 36 passing and 3 failed test files because the release-script child processes were denied with `spawnSync ... EPERM`, not because an assertion failed in the source. The controlled rerun with child-process execution permitted passed all tests; no application code changes were required to resolve these environmental failures.

## P04 EAS preflight (read-only, 30 October 2026)

- `eas.json`: `preview` and `partner-preview` use the preview environment; `production` uses the production environment. All three require `NEVER_REQUIRE_TARGET_SUPABASE=1`.
- `app.config.js`: those build profiles reject a Supabase URL or publishable key that does not exactly match the new NEVER destination. `scripts/verify-release-env.mjs` separately rejects stale/foreign Supabase hostnames and missing legal/billing release variables.
- The runner has no `eas` CLI binary or EAS/Expo environment variables configured. The Expo web dashboard opened in signed-out state; no hosted EAS variable values were read or changed. Owner sign-in or a properly scoped authenticated EAS CLI session is required to verify actual preview/production variable names and values.
- No signed iOS build or hosted function execution has occurred. **P04 hosted acceptance remains blocked.**

## P04 no-Expo alternative

The owner confirmed that no Expo account exists and does not want one created. Local macOS/Xcode device builds are the chosen alternative; existing `NEVER_LOCAL_DEVICE_TEST=1` now also rejects stale explicit Supabase overrides. The account-free device procedure and evidence limits are documented in `docs/never-p04-no-expo-local-device.md`. Hosted EAS variable validation is deferred, not secretly assumed to pass. KENTON HQ web acceptance does not depend on EAS.

## Remaining gates (not authorized by P03)

1. Review processing of personal memories by third-party AI services and provide the appropriate user-facing transparency/consent and privacy documentation before activating the two outbound OpenAI functions.
2. Decide how to configure the server-only `OPENAI_API_KEY`, and test with a disposable account; do not expose any service-role/secret key in Expo public variables or the repository.
3. Review deletion and RLS on disposable isolated accounts, including nested attachments, cross-account access and session expiry/revocation behavior.
4. Independently verify EAS production/preview Supabase endpoint and redirect configuration, then run physical-iPhone email login, reset, sharing, storage and two-account isolation checks.
5. Only after owner authorization, deploy functions to the explicitly selected NEVER project and run hosted smoke tests. Do not deploy to the legacy ONE App project or KENTON.

**Status: P03 code preparation complete; NEVER hosted integration not yet accepted.**
