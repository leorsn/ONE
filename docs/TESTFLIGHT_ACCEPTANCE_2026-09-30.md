# NEVER — TestFlight acceptance matrix

This is the production acceptance checklist for the first Apple-team/TestFlight build. Design is frozen; failures here are functional/release issues only.

## Build identity

Record before testing:

- Git commit SHA
- EAS build ID
- app version
- build number
- iOS version
- test device
- Apple/TestFlight account used
- RevenueCat App User ID / NEVER user ID where relevant

Verify the installed build uses:

- bundle ID `app.never.mobile`
- URL scheme `never`
- Share Extension `app.never.mobile.ShareExtension`
- App Group `group.app.never.mobile`

Do not accept a build when its Git SHA cannot be mapped back to the release candidate or when any retired `app.one.mobile` / `one://` identifier is active.

## A. Install and lifecycle

- Fresh TestFlight install succeeds.
- First launch reaches onboarding/auth without crash.
- App relaunch from terminated state succeeds.
- Background → foreground succeeds after at least 5 minutes.
- Offline launch shows locally available memory instead of blocking on cloud.
- Reconnection resumes sync without duplicate captures.

## B. Account and authentication

- New email/password account can be created.
- Confirmation email deep link opens NEVER and completes the session.
- Existing account sign-in succeeds.
- Wrong password is handled without losing local data.
- Password reset email opens the reset-password route.
- New password works on subsequent sign-in.
- Sign-out removes authenticated UI state.
- Sign in as a different account does not expose the previous account's synced memory.

## C. Native deep links

Verify cold-start and warm-start for:

- `never://auth/callback`
- `never://auth/reset-password`

Also verify the retired `one://auth/callback` does not route as an accepted NEVER deep link.

Malformed or unrelated external URLs must not route into arbitrary NEVER screens.

## D. Capture and persistence

Create each capture type and force-quit/reopen after saving:

- note/text
- URL
- task
- dated reminder/event
- photo/screenshot
- PDF

Expected:

- item still exists after relaunch
- title/metadata preserved
- no duplicate item appears
- sync state eventually reaches saved/synced when online

Edit and delete at least one synced item, relaunch on two devices if available, and verify the change/deletion remains authoritative.

## E. Share Extension

Production Apple provisioning must include the Share Extension/App Group capabilities that personal-team builds intentionally strip.

Test from:

- Safari URL
- Notes text
- Photos JPEG/HEIC screenshot/photo
- Files PDF

Expected:

- NEVER appears in the Share Sheet
- extension is signed as `app.never.mobile.ShareExtension`
- handoff uses `group.app.never.mobile`
- shared payload opens review flow
- original supported attachment is secured locally before save
- supported attachment syncs to the signed-in account
- repeated iOS handoff does not silently create a duplicate

Unsupported audio/video/Office originals must not be represented as successfully cloud-synced supported attachments.

## F. Attachments and private storage

For JPEG, PNG, WebP, HEIC/HEIF, GIF, TIFF and PDF:

- upload succeeds
- attachment is private
- second user cannot read another user's storage path
- signed URL works only for an authorized path/request
- deleting the memory removes/dequeues cloud attachment cleanup
- deleting the account removes account attachments

## G. Notifications

Use a reminder at least 10 minutes in the future.

- App asks for notification permission only from a user-triggered scheduling/settings path.
- Permission allowed → notification schedules.
- Editing reminder time replaces the old scheduled notification.
- Deleting item cancels scheduled notification.
- Permission denied → item still saves and UI communicates reminder status.
- Settings button opens iOS Settings after permission is permanently denied.
- Background sync/hydration never triggers an unsolicited permission prompt.

## H. NEVER / NEVER AI subscriptions

Requires real App Store Connect products + RevenueCat production app configuration.

Products:

- NEVER: `app.never.mobile.monthly`, Apple group level 2
- NEVER AI: `app.never.mobile.ai.monthly`, Apple group level 1

RevenueCat:

- offering `default`
- package `never_monthly` → entitlement `never`
- package `never_ai_monthly` → entitlement `never_ai`

Acceptance:

- no-subscription account sees paywall
- NEVER purchase activates base access
- NEVER relaunch preserves base access
- Restore Purchases restores NEVER
- NEVER → NEVER AI activates AI access
- NEVER AI relaunch preserves AI access
- Apple management flow opens from active subscription
- downgrade/switch follows final Apple/RevenueCat entitlement state
- restore with no active product does not show false success
- cancelled purchase does not grant access
- temporary RevenueCat/network failure does not fabricate paid access
- switching NEVER accounts refreshes RevenueCat identity before paid state is reused

## I. Grounded AI / semantic recall

With NEVER AI active:

- save a unique factual memory and retrieve it through Ask NEVER
- answer cites/links only retrieved saved evidence
- ask for a fact that is not saved → no fabricated answer/source
- semantic search returns only current user's rows
- second account cannot retrieve first account's memory
- deleting the source prevents it from being used after sync catches up

## J. Account deletion

Use a disposable TestFlight account with at least:

- text memory
- attachment
- synced item
- active local notification

Then delete the account.

Verify:

- deletion UI completes once the server confirms deletion
- auth user can no longer sign in with the deleted identity unless a new account is created
- items are gone from cloud
- private attachments are gone
- local NEVER item state is cleared
- local scheduled notifications from that account are removed

Subscription cancellation itself remains managed by Apple; account deletion UI must not claim to cancel an App Store subscription automatically.

## K. Privacy / legal / support

Production build must open final HTTPS URLs for:

- Privacy Policy
- Terms of Use
- Support

Confirm the final archive contains the expected privacy manifest and the App Store privacy questionnaire matches `docs/APP_STORE_PRIVACY_DATA_INVENTORY.md`.

Data export:

- creates a JSON export through the native share sheet
- contains current user's visible memories
- temporary export file is cleaned up after sharing attempt

## L. Accessibility / native acceptance

Functional acceptance only; do not redesign.

Check:

- Dynamic Type at a larger size
- VoiceOver navigation on Home, Search, Calendar, Saved, Settings, Membership
- Reduce Motion
- Reduce Transparency
- keyboard focus/scroll on auth and capture forms
- safe areas on current iPhone hardware

Only fix actual clipping, inaccessible controls, broken focus or unreadable state. Do not reopen the approved visual system.

## M. Release acceptance rule

A TestFlight build is launch-eligible only when:

1. repository Quality gate is green for its exact SHA,
2. `npm run release:testflight-check` passes with the intended production/TestFlight environment,
3. `npm run release:appstore-check` passes before final App Store submission,
4. Supabase production deployment manifest has been applied to the actual NEVER project,
5. App Store/RevenueCat subscription configuration matches the final NEVER identifiers,
6. Apple signing/capabilities use the final bundle/extension/App Group identifiers,
7. all critical rows above pass on TestFlight,
8. there are no known data-loss, cross-account privacy, purchase-access, crash or account-deletion defects.

Cosmetic changes are explicitly outside this acceptance phase unless they are genuine usability/accessibility defects.
