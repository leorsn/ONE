# NEVER — Product polish, pass 2

Baseline: the existing pass 1 foundation plus the newer `design/never-pass-1-5`
commit `29d14b7ba19a8d029a54236ca3ec2d4ec44cf665`, discovered during the final
repository comparison. Its updated palette, hero compositions, library map,
search discovery, settings and navigation are preserved. The second pass adds
interaction, accessibility and recovery improvements to that latest visual work.
No new backend, dependency, product tier or mocked content.

## Product review and implementation

- **Home:** calmer row spacing, wrapping context/title text, consistently sized
  actions; stable quick-action and agenda components; recent-item sorting cached.
- **Capture / scan / incoming share:** stable review field component identities
  preserve native focus while typing. Empty titles remain strings. Decimal and
  tag punctuation remain editable while normalized capture data stays current.
  Inputs use shared keyboard appearance, selection color and focus treatment.
  Scanned originals fit their preview rather than cropping. Share cancellation
  cannot delete an attachment during its save. Existing OCR/late-result logic kept.
- **Inbox:** independent open/action targets, immediate duplicate-action guard,
  progress and recoverable errors, wrapping titles and correct final separators.
  Review detail uses the same image-only preview rules as the library.
- **Search / Ask:** shared memory source rows, selectable answer text, 44-point send
  target, accessible composer, explicit retry state, protected submission and
  route-change response invalidation. Chat scrolling respects a person reading
  earlier messages and Reduce Motion. Semantic/network fallback behavior retained.
- **Saved:** shared document rows retain merchant/kind/date/amount metadata; totals
  wrap without truncating money. Category grouping no longer repeatedly copies
  arrays; document sections remain mounted while editing search.
- **Item detail:** shared input treatment, adaptive metadata rows for small screens
  and large text, larger clear targets, recoverable save/delete errors, resilient
  date labels and source expansion. Background sync still preserves edits.
- **Calendar:** larger month controls and accessible selected days; horizontal day
  strip accommodates narrow layouts; month-end navigation clamps to the target
  month instead of accidentally skipping February. Existing Day/Week/Month kept.
- **Account/auth/onboarding:** shared editorial hierarchy and readable body copy,
  scrollable small-screen/large-text layouts, non-blocking feedback, honest
  recovery/connection errors and submission locks. Onboarding pages retain full
  safe-area-adjusted width and advance with Reduce Motion enabled.
- **Settings / privacy / notifications / membership / share guide / diagnostics:**
  consistent utility headers, sections, type scale, action label colors and hit
  targets. Appearance previews use the actual canonical palettes. Notification
  timing shows persisted selection, busy state and retryable errors. Purchase,
  restore, account deletion confirmations and legal links remain intact.
- **Navigation/material:** side safe areas applied in landscape; floating bar
  respects horizontal insets and keyboard state. Startup uses correct status-bar
  contrast and a branded loading state. Opaque surfaces do not subscribe to
  transparency events; native glass is opt-in for capture/search and floating controls, rather than
  repeated throughout every hero and chat message.
- Removed obsolete style definitions. Existing primary-button compatibility
  wrapper now delegates to the shared NEVER button. Added reusable input, notice,
  utility navigation and grouped settings primitives only where actually reused.

## States reviewed

Startup hydration uses an honest branded progress indicator, not fabricated
content/skeletons. Capture recognition, saving, notification persistence and AI
retrieval have explicit progress. Existing empty/first-use views remain themed;
errors retain drafts or provide retry. Missing image files fall back to type
icons. Invalid imported timestamps show `Date unavailable` instead of crashing.
Local/cloud availability uses existing sync and retrieval state; no invented
network detector or connectivity claims were added.

## Verification

- All 136 tests passed (132 existing plus 4 calendar/date presentation regressions).
- Existing onboarding layout guard retained unchanged and passing.
- TypeScript and lint pass.
- Web and iOS Hermes JavaScript/assets export pass.
- Native release configuration, Expo introspection, store assets and release script syntax pass.
- Offline installed-dependency check passes (Expo notes offline validation is limited).
- TestFlight environment gate remains blocked: Supabase URL/public key, privacy
  policy URL and support URL are absent in this checkout. No secrets were added.
  Terms URL and RevenueCat iOS key are also not configured.
- Store asset check flags the existing missing explicit splash image for device review.
- No tests disabled, dependencies added or service/storage schemas rewritten.

These are code/configuration/bundle checks. A signed Xcode build, native simulator
or physical iPhone visual/gesture/performance acceptance has **not** been run here.
The earlier local preview was blocked by the available cloud browser. No screenshot
or live device approval is implied by this report.

## Device acceptance still required

| Layout / state | Code handling | Native check |
| --- | --- | --- |
| Small phone, 320–375 pt | Scrollable first-use/utility views; adaptive detail fields; scrollable chips/day strip | Confirm keyboard focus, full page width and no clipping |
| Standard / Pro Max | Bounded content columns; fluid rows and previews | Review density, sheet/date-picker placement and safe areas |
| Landscape | Left/right insets; onboarding pager width adjusted | Rotate mid-page and with keyboard visible |
| Large text | Flexible content heights and wrapping metadata; utility labels readable | Check 200% text and VoiceOver traversal |
| Tab labels | Labels capped at 1.3× only in compact tab bar; full accessibility labels retained | Confirm all five targets and selection announcements |
| Accessibility materials | Reduce Motion and Reduce Transparency supported | Confirm real iOS glass, contrast and haptics |
| Capture / retrieval | Existing real services retained, regressions passing | Scan/share, edit, save, reopen, search, offline sync retry |
| Account / billing | Existing service calls/confirmations preserved | Test recovery links and sandbox restore/purchase on device |

Private-beta readiness still depends on this device acceptance and the existing
signing/release environment. This polish pass does not change Apple capabilities,
provisioning, notification entitlements or app identity.
