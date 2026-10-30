# NEVER migration readiness — updated 30 October 2026

**Status: DATABASE + AUTH + PRIVATE STORAGE MIGRATED; MOBILE APP CUTOVER AND SERVER FUNCTIONS PENDING.** Do not point production clients to the target until every acceptance check passes.

## Scope and identity

- Source: paused legacy `ONE App` (`uuehozwygopldwcbkfci`), natively transferred from KENTON Pro to the NEVER organization on 30 October 2026 (P02). The project ID and region were preserved; do not delete or resume it without a separate decision.
- Destination: new `NEVER` (`nywfoprcwbnsxybdqpma`) in NEVER Free.
- Separate system: KENTON Pro's `FOUNDER'S MANUAL` (`yvosncmtxdwksoxhksgw`). Do **not** merge NEVER user data into that project.
- Source backup verified locally: compressed PostgreSQL cluster export and storage archive. **Never commit either archive or personal row data to GitHub.**
- Source inventory: 3 Auth users (2 confirmed, 1 not confirmed), 3 email identities, 2 profiles, 8 items owned by 2 users, 1 bucket, 4 objects and 4 file blobs.
- Destination after migration: 3 Auth users (2 confirmed, 1 unconfirmed), 2 app tables, pgvector, 2 profiles, 8 items and 4 private Storage files. Old passwords, sessions and MFA were intentionally not copied.
- GitHub `leorsn/ONE` default `main` contains only README; full app code was recovered on `audit/never-final-release-gates-2026-10-11` and copied to the isolated migration branch.

## Verified schema

`ops/never-schema-tested.sql` was reconstructed from the source cluster backup, tested, and then applied to the approved, initially empty destination. The schema contains `items` and `profiles`, 4 constraints, 9 indexes, pgvector, 8 owner-only RLS policies, explicit grants and `match_one_items`. Four additional owner-scoped Storage policies were verified. This is backend verification, **not signed iPhone acceptance**.

The owner authorized the target access policies. Anonymous read denial and cross-user table/Storage isolation were tested with independent Auth contexts.

## Safe ordered cutover checklist

1. [x] Schema/RLS/grants applied; 2 tables + 8 policies, no anonymous item/profile read.
2. [x] Three Auth accounts recreated, matching confirmed/unconfirmed posture without original passwords/sessions.
3. [x] Auth UUID mapping verified privately, never committed.
4. [x] Restored 2 profiles and 8 items with remapped owners; verified cross-user read isolation.
5. [x] Restored 4 private Storage objects with owner policies, corrected attachment paths and total 11,911,578 bytes.
6. [ ] Inspect edge functions, triggers, third-party integrations, cron jobs, URL configurations, OAuth providers, redirect allowlists, email templates and any required secrets; restore only intentionally needed services with minimal privileges.
7. [ ] Test authentication and account recovery on iPhone; test each user's own list/search, item attachment retrieval and denial of cross-user access.
8. [ ] Only after all checks pass, change application API URL and publishable key to NEVER project; build, test and deploy app. Preserve old source/backup until owner signs off; do not delete source.
9. [ ] Record documented acceptance results and cutover timestamp.

## KENTON separation

KENTON should continue in its Pro organization, with AI agents primary and AI telephony a separately paid optional module. Its `office-identity` target function is presently guarded (private POST returns HTTP 503) pending full contemporary V20C authentication, membership, MFA, and Groq environment verification. No production KENTON traffic should be redirected yet. Outbound Groq execution is user-approved in principle, but `GROQ_API_KEY` must be configured directly in KENTON's secret manager; never paste it into a chat or commit it.

## Storage migration evidence and remaining blockers

Storage migration completed: the private target bucket contains 4 objects with byte total matching the archive, four owner-scoped rules and corrected item paths. The old source and backups are unchanged. Post-migration test verified owner access to 4 objects and unrelated user's access to 0 objects. No anonymous public access.

The mobile source was recovered from branch `audit/never-final-release-gates-2026-10-11` (GitHub default `main` contained only README). New isolated branch `ops/never-backend-cutover-20261029` uses that full release source and updates the app's **default** Supabase URL and publishable key to NEVER (`nywfoprcwbnsxybdqpma`). **No build or app release has been deployed.** External `EXPO_PUBLIC_SUPABASE_URL` / key variables in EAS can still override code defaults; the new release guards block builds until both values match the destination.

Auth redirects `never://auth/callback` and `never://auth/reset-password` were added in NEVER Auth URL Configuration and verified in dashboard (2 saved URLs). The default Site URL remains `http://localhost:3000` and needs a deliberate production setting when the public app/website URL is decided. Default Supabase recovery email subject is `Reset your password`; editing templates currently requires custom SMTP, which was not configured. Required next steps: verify password reset/confirmation emails and deep links on a signed iPhone build, deploy and test required Edge Functions using server-only secrets, reconfigure EAS credentials, perform two-account sync and document physical acceptance. The source app's original passwords cannot be reused after new Auth accounts were provisioned; make users reset them only after redirect URLs are correct.

Never commit personal backups, Auth UUID maps or extracted attachments to GitHub.

### Update 29 October 2026 — redirect acceptance

Confirmed two allowed native Auth redirects saved in new NEVER project. This is an authorization allowlist change, not proof that email deliveries or iPhone deep links work. No recovery mails have been sent to the three migrated accounts. Existing EAS environment variables can override the new default client URL/key; do not deploy before checking EAS production/preview values and testing the new Supabase key. All prior accounts, rows, and attachments remain in target.

### Source-validation evidence — 29 October 2026

The isolated release-derived branch `ops/never-backend-cutover-20261029` was fetched to a clean verification worktree; dependencies installed with `npm ci --ignore-scripts` and exact lockfile. On that branch:

- `npm test` — **261 passing, 0 failing** (the restricted sandbox initially prevented child-process tests with EPERM; full suite passed in authorized execution).
- `npm run typecheck` — passed.
- `EXPO_NO_TELEMETRY=1 npm run lint` — passed.
- `npm run release:script-check` — passed.
- All five Supabase Edge Function imports pinned to `@supabase/supabase-js@2.115.0`.

The project has **0 deployed Edge Functions and 0 custom function secrets**. Functions may not yet be activated without reviewing auth/security and configuring server-only `OPENAI_API_KEY` where required. Do not send private memories to OpenAI without explicit owner authorization. Deploying deletion functionality additionally requires a disposable-account deletion acceptance test.

NEVER Supabase Advisor: 0 security errors, 1 warning (`Leaked Password Protection Disabled`); performance: 0 errors/warnings and 8 informational unused-index notices on the new database. No index deletion performed.

Device/TestFlight tests and EAS-production-environment verification are still **pending**; these local test results do not establish live product release readiness.

### Update 29 October 2026 — EAS build guard

`app.config.js` now rejects preview/partner-preview/production builds unless EAS provides the approved NEVER project URL **and** corresponding publishable key. `eas.json` explicitly enables this guard for all three profiles. `scripts/verify-release-env.mjs` independently detects stale or unrelated target URLs. The source suite passed **264/264** including deliberate wrong-project and wrong-key checks (superseding the prior 261-test run). No EAS variables were changed and no signed build was deployed. Coordinate public-key rotation with both guards. The mobile app still requires real-device login, reset, cross-user and attachment acceptance.

### Update 30 October 2026 — P02 transfer and P03 function preparation

P02 verified the native organization transfer of the paused legacy `ONE App` project into NEVER and preserved pre/post backup evidence. It is distinct from the newly migrated NEVER destination project. KENTON retains `FOUNDER'S MANUAL` on Pro. No automatic code or live traffic transfer follows solely from organization membership.

P03 prepared all five source Edge Functions on the isolated `ops/never-p03-functions-hardening-20261030` branch. The functions were **not deployed** to either NEVER project. The new tests, local typecheck and lint pass; the complete suite passed **279/279** after resolving the test runner's child-process permission barrier. P04 confirmed the local EAS profile cutover guard, but the Expo Dashboard is signed out here and actual hosted environment variables remain unverified. Details: `docs/never-p03-edge-functions-acceptance.md`. Never merge or activate solely on the strength of mocked tests.
