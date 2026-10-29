# NEVER migration readiness — 29 October 2026

**Status: PREPARED, NOT CUT OVER.** Do not point production clients to the target until every acceptance check passes.

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
