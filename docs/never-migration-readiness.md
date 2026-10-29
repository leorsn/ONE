# NEVER migration readiness — 29 October 2026

**Status: DATABASE + AUTH + PRIVATE STORAGE MIGRATED; MOBILE APP CUTOVER AND SERVER FUNCTIONS PENDING.** Do not point production clients to the target until every acceptance check passes.

## Scope and identity

- Source: paused `ONE App` (`uuehozwygopldwcbkfci`), preserved read-only in KENTON Pro.
- Destination: new `NEVER` (`nywfoprcwbnsxybdqpma`) in NEVER Free.
- Separate system: KENTON Pro's `FOUNDER'S MANUAL` (`yvosncmtxdwksoxhksgw`). Do **not** merge NEVER user data into that project.
- Source backup verified locally: compressed PostgreSQL cluster export and storage archive. **Never commit either archive or personal row data to GitHub.**
- Source inventory: 3 Auth users (2 confirmed, 1 not confirmed), 3 email identities, 2 profiles, 8 items owned by 2 users, 1 bucket, 4 objects and 4 file blobs.
- Destination as last inspected: 0 Auth users, 0 app tables, no pgvector.
- Source app repository `leorsn/ONE` currently only contains README; production app code was not found there. Do not infer app client credentials from the database backup.

## Verified schema

`ops/never-schema-tested.sql` was reconstructed from the source cluster backup and successfully dry-run in the destination SQL Editor inside an explicit `BEGIN … ROLLBACK` transaction. It contains original `items` and `profiles` tables, 4 constraints, 9 indexes, pgvector extension, 8 owner-only RLS policies, explicit grants and `match_one_items` function. **Dry run does not imply migration was applied.**

Apply to the empty target only after explicit action-time owner approval for permissions and access-policy changes. Verify no target schema collision before executing the committed SQL and retest RLS with separate authenticated sessions.

## Safe ordered cutover checklist

1. [ ] Owner approves target schema/RLS/grants application. Save SQL run result and confirm 2 tables + 8 policies, no anon item/profile access.
2. [ ] Owner approves creating the three destination Auth accounts. Do not copy old password hashes, refresh tokens, MFA state or old active sessions. Use official managed Auth user creation/invite flow; preserve the unconfirmed account's verification posture.
3. [ ] Privately build and validate mapping of every source Auth UUID to its matching new destination Auth UUID. Never disclose names/emails/mapping in public documentation.
4. [ ] Restore 2 `profiles` and 8 `items` with remapped `user_id`. Preserve original item IDs and content. Verify per-user row counts, foreign keys and read/write isolation; never use service-role secrets in mobile client.
5. [ ] Restore the source Storage bucket with its access controls, 4 object metadata entries and 4 file blobs. Validate size, key, MIME type, checksums where possible, download authorization and bucket policy. Do not make private buckets public.
6. [ ] Inspect edge functions, triggers, third-party integrations, cron jobs, URL configurations, OAuth providers, redirect allowlists, email templates and any required secrets; restore only intentionally needed services with minimal privileges.
7. [ ] Test authentication and account recovery on iPhone; test each user's own list/search, item attachment retrieval and denial of cross-user access.
8. [ ] Only after all checks pass, change application API URL and publishable key to NEVER project; build, test and deploy app. Preserve old source/backup until owner signs off; do not delete source.
9. [ ] Record documented acceptance results and cutover timestamp.

## KENTON separation

KENTON should continue in its Pro organization, with AI agents primary and AI telephony a separately paid optional module. Its `office-identity` target function is presently guarded (private POST returns HTTP 503) pending full contemporary V20C authentication, membership, MFA, and Groq environment verification. No production KENTON traffic should be redirected yet. Outbound Groq execution is user-approved in principle, but `GROQ_API_KEY` must be configured directly in KENTON's secret manager; never paste it into a chat or commit it.

## Storage migration evidence and remaining blockers

Storage migration completed: the private target bucket contains 4 objects with byte total matching the archive, four owner-scoped rules and corrected item paths. The old source and backups are unchanged. Post-migration test verified owner access to 4 objects and unrelated user's access to 0 objects. No anonymous public access.\n\nThe mobile source was recovered from branch `audit/never-final-release-gates-2026-10-11` (GitHub default `main` contained only README). New isolated branch `ops/never-backend-cutover-20261029` uses that full release source and updates the app's **default** Supabase URL and publishable key to NEVER (`nywfoprcwbnsxybdqpma`). **No build or app release has been deployed.** External `EXPO_PUBLIC_SUPABASE_URL` / key variables in EAS can still override code defaults; validate/change those at build time before shipping.\n\nAuth redirects `never://auth/callback` and `never://auth/reset-password` were added in NEVER Auth URL Configuration and verified in dashboard (2 saved URLs). The default Site URL remains `http://localhost:3000` and needs a deliberate production setting when the public app/website URL is decided. Default Supabase recovery email subject is `Reset your password`; editing templates currently requires custom SMTP, which was not configured. Required next steps: verify password reset/confirmation emails and deep links on a signed iPhone build, deploy and test required Edge Functions using server-only secrets, reconfigure EAS credentials, perform two-account sync and document physical acceptance. The source app's original passwords cannot be reused after new Auth accounts were provisioned; make users reset them only after redirect URLs are correct.\n\nNever commit personal backups, Auth UUID maps or extracted attachments to GitHub.\n
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
