# NEVER — Controlled design pass 1

Base: `dev/foundation` at `004ad9c9b2c31181ac9cf3cec1665bacb5bf76c3`.
Work branch: `design/never-pass-1`.

## Audit

Expo 57 / React Native 0.86, Expo Router with five tab wrappers delegating to the
V5 screen implementations. Stack routes provide Ask, scan, incoming share, share
instructions, inbox/review, editable item details, onboarding, auth, subscription
and settings subpages. Native SF Symbols and the Expo UI date picker are retained.

Root providers own Theme, Onboarding, Auth, Plan and Items. ItemsContext handles
account-scoped AsyncStorage, cloud queue/merge, tombstones, attachments and
notification reconciliation. Capture interpretation/review, OCR enrichment and
share ingestion are separate modules. Search has local retrieval, optional
semantic retrieval, grounded answer synthesis and subscription gating. None of
these services or schemas were replaced or modified.

Findings: duplicated color literals in appleV5 and theme/colors; pure-black dark
canvas; opaque components named Glass; multiple independent memory-row renderers;
32–34-point icon targets; custom tab bar did not implement keyboard hiding; nested
editable detail components could remount on each keypress; type filters vanished
while entering a search. Baseline: all 127 existing tests passed.

## Implemented

- One shared platinum/graphite palette with tested text contrast.
- Editorial title system plus native utility typography.
- Shared native glass/fallback material, control/motion tokens and memory rows.
- Home capture-first hierarchy and real save feedback; existing capture tools kept.
- Search suggestions, session recent searches, filters while typing, correct
  category filtering before retrieval limits, and stale-answer display protection.
- Saved category grouping with existing document filters and analytics preserved.
- Inbox navigation, bigger action targets and non-bubbling triage actions.
- Detail content grouping, disclosed OCR, shared Done action and stable form fields.
- Larger navigation controls, keyboard hiding and accessibility material fallbacks.

No new backend, mocked production data, route replacement or native identity change.
`expo-glass-effect` 57.0.2 was already a locked transitive dependency of Expo Router;
it is now declared directly because the design system imports it.

## Verification

Final gate outcomes are recorded below. Automated tests are not a
claim that live cloud credentials, subscription purchases or hardware were tested.

- Baseline tests: 127 passed. Final suite: **132 passed, 0 failed**.
- TypeScript: passed.
- Lint: passed, no errors or warnings in the final run.
- Web export: passed. Expo printed a shutdown-time forced-exit notice after successfully writing the export.
- iOS Hermes bundle export: passed (JavaScript/assets, not a signed Xcode build).
- Native release configuration, Expo introspection and release-script syntax: passed.
- Regression coverage: existing suite plus text contrast, PDF thumbnail handling,
  filtering beyond the recent-item limit, and note/link filter semantics.
- Web preview attempt: local preview URL rejected by the available cloud browser
  (`ERR_BLOCKED_BY_CLIENT`). No interactive or screenshot visual pass is claimed.
- Native iPhone build, VoiceOver, camera/OCR hardware, haptics and live glass:
  require device verification; this environment does not have Xcode.

## Device review before pass 2

1. Check out this branch and run the existing development build workflow.
2. Inspect Home, Search, Saved, Inbox and a long item in Light and Dark.
3. Capture a note and link, scan/import, review, edit metadata/notes, reopen and search.
4. Confirm date controls, reminder status, source opening and review actions.
5. Test keyboard, 200% text, Reduce Motion and Reduce Transparency.
6. Supply current iPhone screenshots for pass 2's final spacing/material polish.
