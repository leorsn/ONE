# NEVER pre-device product audit — 30 September 2026

Branch: `design/never-material-worlds`

## Scope

Code-only product/UX review performed without claiming physical iPhone acceptance. Visual canon, Material Worlds artwork, Home hierarchy and Calendar structure remain locked for device review.

## Verified product flows

### Search / recall
- Search supports empty discovery, filtered results, no-match state and result reasons.
- Ask NEVER has loading, recoverable error and source presentation.
- Search/Ask request versioning prevents stale async answers from replacing newer user intent.
- Recent searches now persist locally across reloads, deduplicate case-insensitively and cap at five entries.
- Clearing recent searches removes both UI state and local persistence.

### Saved
- Library exposes Documents, Images, Links and Ideas without forcing a file-manager hierarchy.
- Empty and no-match states are distinct.
- Documents have type filtering, month grouping and document summary metrics.
- Shared `MemoryRow` now inherits active Material World geometry and press treatment.

### Scan
- Camera and Photos permissions distinguish denied/re-requestable states.
- A selected image is copied into private local app storage before NEVER claims it as saved.
- Replaced/abandoned temporary attachments are cleaned up.
- OCR empty, OCR failure and attachment failure remain recoverable states.
- Late OCR results do not overwrite user-edited content.
- Save failure keeps the local attachment available while the screen remains open.

### Auth / account
- Session restore and auth-state subscription both converge on one session source.
- Profile bootstrap failure is non-destructive and no longer emits legacy ONE product wording.
- Auth callback and password-reset URLs derive from the configured Expo scheme instead of a duplicated hardcoded `one://` value.

### Notifications
- Permission denied, unsupported platform, scheduling error and unscheduled reminder states are explicit.
- Background reconciliation does not trigger the system permission prompt.
- Settings re-check permission when returning from iOS Settings.

### Billing
- Missing RevenueCat configuration fails closed for paid access outside development beta behavior.
- Purchase and restore flows are protected against concurrent taps.
- Account identity changes are checked before applying purchase results.
- App Store release check now includes monetization configuration validation.

## Intentionally preserved legacy identifiers

The following are not renamed during this audit because changing them can break persisted data, provisioning, share extensions, subscriptions or existing development installs:

- internal `OneItem` / `OnePlan` TypeScript names
- existing AsyncStorage keys beginning with `@one/`
- current native bundle/package identifiers and App Group
- current App Store product identifiers

They should only change as part of an explicit production identity migration.

## Device-only acceptance still required

- Material World image sharpness and composited contrast on a physical iPhone
- Dynamic Type and VoiceOver visual/interaction acceptance
- keyboard + tab-bar behavior
- local notification delivery
- system Share Extension
- auth email/deep-link round trip
- App Store purchase/restore sandbox flow
- production signing/provisioning

## Next code-only opportunities

1. Continue capture/share edge-case audit.
2. Reduce remaining legacy product wording in logs/comments where it cannot affect persisted compatibility.
3. Add CI so `quality` and `release:appstore-check` run automatically on the active PR.
4. Freeze the product surface after device acceptance; avoid another free-form visual redesign.
