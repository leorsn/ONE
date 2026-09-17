# NEVER — V1 Release Blocker Register

Status is intentionally conservative. A green repository does not count as physical iOS acceptance, visual acceptance, signing acceptance or external-service acceptance.

Technical compatibility identifiers such as `app.one.mobile`, `one://`, `one_ai`, existing RevenueCat product IDs and Supabase function names may remain legacy-named until a deliberate migration is planned. Consumer-facing product identity is NEVER / NEVER AI.

## BLOCKER

### Before physical iPhone acceptance

No known repository-code blocker prevents the next physical iPhone pass after the current redesign/hardening work, subject to the latest CI gate.

Physical acceptance still depends on Apple/Xcode signing prerequisites. Signing limitations are **EXTERNAL CONFIGURATION**, not UI defects.

The next device pass must use both:
- `docs/DEVICE_TEST_PLAN.md` for functional/native acceptance;
- `docs/NEVER_VISUAL_QA.md` for premium visual acceptance.

### Before TestFlight

- **DEVICE ACCEPTANCE:** complete the critical physical-iPhone matrix, including Share Sheet, camera, Apple Vision OCR, notifications, notification taps, auth links, session restore, offline/reconnect and account isolation.
- **VISUAL ACCEPTANCE:** complete the NEVER visual QA matrix on a real iPhone in light and dark mode; resolve all P0/P1 defects before TestFlight distribution.
- **BRAND ASSETS:** configure and verify final NEVER App Icon and launch/splash presentation in the production iOS build. No generic Expo/default asset may ship.
- **EXTERNAL CONFIGURATION:** create/verify the Apple application and signing configuration for `app.one.mobile`, the Share Extension `app.one.mobile.ShareExtension`, App Group `group.app.one.mobile`, and required provisioning/capability assignments.
- **EXTERNAL CONFIGURATION:** link/configure the EAS project and produce a signed production/TestFlight build.
- **EXTERNAL CONFIGURATION:** verify Supabase Auth redirect URLs and production email delivery/templates for `one://auth/callback` and `one://auth/reset-password`.
- **EXTERNAL CONFIGURATION:** verify that auth email templates, sender identity and any hosted confirmation pages show NEVER rather than the legacy product name.
- **EXTERNAL CONFIGURATION:** configure production RevenueCat/App Store products and entitlement mapping before distributing a build that requires paid access. Consumer product names must be NEVER and NEVER AI even where compatibility IDs remain `one` / `one_ai`.
- **EXTERNAL CONFIGURATION:** configure the production NEVER AI server secret/model if AI recall is included in the TestFlight acceptance scope. The existing env key `ONE_RECALL_MODEL` may remain for compatibility.

### Before App Store release

All TestFlight blockers above, plus:

- **DEVICE ACCEPTANCE:** no unresolved release-critical physical-device failures.
- **VISUAL ACCEPTANCE:** no unresolved P0/P1 visual defects and no legacy consumer-facing ONE branding.
- **EXTERNAL CONFIGURATION:** App Store purchase/trial/restore flows accepted with real StoreKit/App Store Connect/RevenueCat configuration.
- **LEGAL:** production privacy policy, terms, support URL and App Store privacy disclosures completed from the technical data inventory.
- **STORE ASSETS:** final App Store Connect metadata, age rating, screenshots, app description, subtitle, keywords, privacy/support URLs and release settings completed.
- **BRAND ASSETS:** final App Icon, screenshots and any promotional artwork match the NEVER design canon.
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
- NEVER AI Edge Function secret `OPENAI_API_KEY` and optional compatibility env key `ONE_RECALL_MODEL`
- public privacy policy / terms / support URLs
- App Store privacy disclosures
- final NEVER App Icon / launch presentation / App Store artwork

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
- light/dark mode switching across core screens
- branded launch/loading transition without white/blue flash
- final app icon presentation on the iOS Home Screen

## VISUAL ACCEPTANCE

`docs/NEVER_VISUAL_QA.md` is the source of truth.

At minimum, the physical review must cover:
- launch/root loader;
- onboarding;
- auth and recovery;
- Inbox/Home;
- manual capture and review;
- Ask NEVER;
- Search;
- Saved/Documents;
- Calendar;
- Item Detail;
- Scan/OCR;
- native Share flow;
- Settings, Appearance, Notifications and Privacy;
- NEVER / NEVER AI plans;
- empty, loading, permission, error and offline states.

P0 and P1 visual defects block TestFlight acceptance. P2 defects should be cleared before App Store submission unless explicitly deferred with rationale.

## BRAND SAFETY

The repository includes a NEVER consumer-brand regression test. It intentionally distinguishes between:
- **consumer-facing identity:** MUST use NEVER / NEVER AI;
- **compatibility identifiers:** may retain internal `one` naming to avoid unnecessary migrations.

Do not rename bundle IDs, URL schemes, Supabase RPC/function identifiers, database objects, entitlement IDs or StoreKit/RevenueCat product IDs merely for cosmetic consistency. Migrate them only as a separately planned compatibility change.

## NON-BLOCKING

- Supabase performance advisor currently reports unused indexes only. Do not remove them merely to silence an informational advisor; usage data is still immature.
- Existing ESLint warnings that do not fail the repository gate remain non-blocking unless a later audit ties one to a concrete defect.
- Semantic embeddings can become temporarily stale if embedding refresh fails; retrieval still intersects results with the active account-scoped item set and falls back to local lexical search. A failed embedding refresh should be monitored but does not make local NEVER unusable.
- Incoming iOS share receiving in the current Expo Sharing implementation is experimental; this is a platform/library risk requiring device acceptance, not a reason to build a parallel share architecture before evidence of failure.

## FUTURE

Not V1 release blockers:

- HTTPS Universal Links/Associated Domains replacing or complementing the current compatibility `one://` auth callbacks.
- optional migration from legacy technical `one` identifiers to NEVER-named identifiers after V1 stability.
- broader collaboration, shared accounts, desktop/browser clients or new automation systems.
- speculative vector/search redesigns without a measured V1 defect.

## Release gates

1. **Physical iPhone acceptance:** repository CI green + Apple/Xcode development signing available + functional and visual device plans executable.
2. **TestFlight:** critical native paths passed + P0/P1 visual issues cleared + final icon/launch assets + production signing/auth/billing/AI configuration appropriate to the build.
3. **App Store:** TestFlight gate passed + real purchase/restore acceptance + privacy/legal/store disclosures complete + final store assets + no unresolved release-critical defects.
