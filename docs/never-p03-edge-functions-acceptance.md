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
- Full `npm test`: **36 test files passed, 3 failed** in this workspace (`alternate-app-icon`, `release-gates`, `release-revenuecat-env`). These tests exercise release scripts, not the five modified Edge Functions; the failures were not fixed or classified as hosted acceptance. Investigate the subprocess output expectations/environment separately before claiming a green release suite.

## Remaining gates (not authorized by P03)

1. Review processing of personal memories by third-party AI services and provide the appropriate user-facing transparency/consent and privacy documentation before activating the two outbound OpenAI functions.
2. Decide how to configure the server-only `OPENAI_API_KEY`, and test with a disposable account; do not expose any service-role/secret key in Expo public variables or the repository.
3. Review deletion and RLS on disposable isolated accounts, including nested attachments, cross-account access and session expiry/revocation behavior.
4. Independently verify EAS production/preview Supabase endpoint and redirect configuration, then run physical-iPhone email login, reset, sharing, storage and two-account isolation checks.
5. Only after owner authorization, deploy functions to the explicitly selected NEVER project and run hosted smoke tests. Do not deploy to the legacy ONE App project or KENTON.

**Status: P03 code preparation complete; NEVER hosted integration not yet accepted.**
