# ONE — PO046 Native iOS Release Candidate Hardening

`docs/DEVICE_TEST_PLAN.md` remains the authoritative physical-device acceptance checklist. PO046 does not mark any physical iPhone requirement as passed.

## Code-ready / automatically verifiable

The release-candidate hardening in PO046 covers these code-level risks before device testing:

- startup waits for authoritative auth restoration before the main navigation is considered ready;
- notification response handling is registered once per ready app state instead of once per item mutation;
- duplicate notification responses are suppressed during one runtime;
- stale notification taps no longer navigate to a deleted item;
- persisted notification IDs are reconciled against the actual native scheduler after hydration/restart;
- stale and duplicate ONE item notifications are cancelled when they are no longer the active schedule;
- account-scope transitions remove orphaned item notifications left by an older scope;
- cloud/local sync failures remain local-first and are recorded safely in development diagnostics;
- Share-to-ONE attachments are copied into ONE private local storage before image OCR or final save;
- an attachment that could not be secured is never represented as successfully saved;
- Scan-to-ONE ignores late OCR results from an older scan operation;
- release configuration is automatically checked for bundle identifier, URL scheme, Share Extension identifier, App Group, native plugins and EAS development-client settings.

## Native identifiers guarded by CI

- Main app: `app.one.mobile`
- Share Extension: `app.one.mobile.ShareExtension`
- App Group: `group.app.one.mobile`
- URL scheme: `one`

The release-config check is intentionally static and credential-free. Expo config introspection remains part of the normal quality command.

## Data-safety invariants retained

- ONE continues to use one canonical `OneItem` identity.
- Triage actions mutate the canonical item rather than creating view-specific copies.
- Local changes remain scoped by account storage scope.
- Stale scoped cloud work cannot apply after an account switch.
- Notification IDs remain device-local state and are not treated as cloud truth.
- Attachment cloud paths remain private/account-scoped; PO046 does not weaken RLS or storage ownership.
- Ask ONE behavior remains grounded in stored accessible items.

## REQUIRES PHYSICAL DEVICE ACCEPTANCE

The following remain explicitly unaccepted until a real EAS development build is installed and exercised using `docs/DEVICE_TEST_PLAN.md`:

- Share Extension visibility and cold/warm handoff from Safari, Mail, Photos and Files;
- PDF/file share behavior exposed by iOS;
- Apple Vision OCR through `expo-ocr-kit`;
- camera and photo-library permission recovery;
- actual notification delivery, edit/cancel behavior and notification taps;
- auth confirmation and password-reset links on-device;
- session restoration after force quit;
- offline capture followed by reconnect under real network transitions;
- account-switch notification/privacy regression;
- small/large iPhone safe-area and keyboard behavior;
- iPad layout acceptance.

No CI, web export, simulator result or Expo Go result should be recorded as a substitute for these checks.
