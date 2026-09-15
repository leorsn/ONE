# ONE — V1 Release Blocker Register

Status is intentionally conservative. A green repository does not count as physical iOS acceptance or external-service acceptance.

## BLOCKER

### Before physical iPhone acceptance

No known repository-code blocker remains after the Master Release hardening pass, subject to the final CI gate.

Physical testing cannot begin until the external Apple/EAS signing prerequisites below are available. Those are classified as **EXTERNAL CONFIGURATION**, not code defects.

### Before TestFlight

- **DEVICE ACCEPTANCE:** complete the critical physical-iPhone matrix in `docs/DEVICE_TEST_PLAN.md`, including Share Sheet, camera, Apple Vision OCR, notifications, notification taps, auth links, session restore, offline/reconnect and account isolation.
- **EXTERNAL CONFIGURATION:** create/verify the Apple application and signing configuration for `app.one.mobile`, the Share Extension `app.one.mobile.ShareExtension`, App Group `group.app.one.mobile`, and required provisioning/capability assignments.
- **EXTERNAL CONFIGURATION:** link/configure the EAS project and produce a signed production/TestFlight build.
- **EXTERNAL CONFIGURATION:** verify Supabase Auth redirect URLs and production email delivery/templates for `one://auth/callback` and `one://auth/reset-password`.
- **EXTERNAL CONFIGURATION:** configure production RevenueCat/App Store products and entitlement mapping before distributing a build that requires paid access.
- **EXTERNAL CONFIGURATION:** configure the production ONE AI server secret/model if ONE AI is included in the TestFlight acceptance scope.

### Before App Store release

All TestFlight blockers above, plus:

- **DEVICE ACCEPTANCE:** no unresolved release-critical physical-device failures.
- **EXTERNAL CONFIGURATION:** App Store purchase/trial/restore flows accepted with real StoreKit/App Store Connect/RevenueCat configuration.
- **EXTERNAL CONFIGURATION:** production privacy policy, terms, support URL and App Store privacy disclosures completed from the technical data inventory.
- **EXTERNAL CONFIGURATION:** final App Store Connect metadata, age rating, screenshots and release settings completed.
- **EXTERNAL CONFIGURATION:** production secrets and EAS production environment verified; no development-only entitlement or diagnostics behavior present in the submitted binary.

## EXTERNAL CONFIGURATION

Tracked in detail in `docs/EXTERNAL_CONFIGURATION_CHECKLIST.md`.

Current repository state establishes identifiers and integration contracts but cannot prove the corresponding external accounts are configured:

- Apple Developer Team / certificates / provisioning
- main bundle ID and Share Extension bundle ID registration
- App Group capability assignment
- EAS project link and build credentials
- Supabase Auth redirect allow-list and production SMTP/template behavior
- RevenueCat project, iOS public SDK key, entitlements, offerings and products
- App Store Connect products/trial eligibility configuration
- ONE AI Edge Function secret `OPENAI_API_KEY` and optional `ONE_RECALL_MODEL`
- public privacy policy / terms / support URLs
- App Store privacy disclosures

## DEVICE ACCEPTANCE

Repository code/config is ready to be exercised, but the following are **not accepted** until a real iPhone test records a pass:

- Share Sheet visibility and Safari/Photos/PDF/file handoff
- cold/warm share routing
- camera permission and capture
- Photos permission and selection
- Apple Vision OCR execution, cancellation/background races and receipt behavior
- local notification permission, delivery, edit/reschedule/cancel and tap routing
- auth confirmation and password-reset deep links
- force-quit session restoration
- real offline/reconnect transitions
- account-switch notification/data privacy regression
- safe-area/keyboard behavior

## NON-BLOCKING

- Supabase performance advisor currently reports unused indexes only. Do not remove them merely to silence an informational advisor; usage data is still immature.
- Existing ESLint warnings that do not fail the repository gate remain non-blocking unless a later audit ties one to a concrete defect.
- Semantic embeddings can become temporarily stale if embedding refresh fails; retrieval still intersects results with the active account-scoped item set and falls back to local lexical search. A failed embedding refresh should be monitored but does not make local ONE unusable.
- Incoming iOS share receiving in the current Expo Sharing implementation is experimental; this is a platform/library risk requiring device acceptance, not a reason to build a parallel share architecture before evidence of failure.

## FUTURE

Not V1 release blockers:

- HTTPS Universal Links/Associated Domains replacing or complementing the current custom `one://` auth callbacks.
- broader collaboration, shared accounts, desktop/browser clients or new automation systems.
- speculative vector/search redesigns without a measured V1 defect.

## Release gates

1. **Physical iPhone acceptance:** repository CI green + Apple/EAS development signing configured + device plan executable.
2. **TestFlight:** physical critical-path acceptance passed + production signing + auth + billing/AI configuration appropriate to the build.
3. **App Store:** TestFlight gate passed + real purchase/restore acceptance + privacy/legal/App Store disclosures complete + no unresolved release-critical defects.
