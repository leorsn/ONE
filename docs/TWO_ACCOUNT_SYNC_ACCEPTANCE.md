# NEVER — Two-account cloud isolation acceptance

Status: NOT EXECUTED on physical device.

Prerequisites: use a development build with Supabase credentials and two disposable confirmed email accounts A/B. Do not use production personal records.

1. Log in to A, create a distinct test note `NEVER-A-ISOLATION-<date>`, wait for synced status, force-close and reopen app. Confirm note persists.
2. Sign out completely and log in to B on same phone. Confirm A note is not visible in Today, Search, Saved, Calendar or Ask NEVER. Create separate B note and confirm successful cloud sync.
3. Sign out from B and sign back into A. Confirm A note is present and B note absent. Repeat after airplane mode on/off.
4. With A signed in, delete only the A test note; verify B test note remains untouched when logging in to B.
5. Check no old account content flashes during transitions, even briefly. If it does, stop and record a screen capture; this is a release blocker.
6. Check offline capture in A; reconnect; verify exactly one cloud copy and no resurrected deletion.
7. Clean up both test notes and log out.

Verification: user-visible device results and screenshots must be recorded separately. Static CI and current Supabase RLS-policy inspection DO NOT substitute for this test.

Build SHA: _____ | Device/iOS: _____ | Account A outcome: _____ | Account B outcome: _____ | Offline/reconnect: _____ | Tester/date: _____
