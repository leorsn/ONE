# ONE — Physical iPhone V1 Acceptance Plan

This is the sequential acceptance package for the first real ONE V1 iPhone build. CI, web export, Expo Go, simulator-only behavior and static config inspection do **not** count as physical-device acceptance.

## Test target

- Repository: `leorsn/ONE`
- Branch: `dev/foundation`
- Test SHA: record the exact accepted SHA before building.
- Bundle identifier: `app.one.mobile`
- Share Extension: `app.one.mobile.ShareExtension`
- App Group: `group.app.one.mobile`
- URL scheme: `one`
- Primary orientation: portrait
- First target: physical iPhone; iPad follows the critical iPhone smoke test.

Record for every run: device model, iOS version, build profile, build number, Git SHA, account used, network state and tester.

## 0 — Prerequisites and installation

From a clean checkout:

```bash
npm ci --no-audit --no-fund
npm run quality
npx eas-cli@latest build --platform ios --profile development
```

Install the resulting signed development build on the registered iPhone. Then start Metro for the development client when needed:

```bash
npx expo start --dev-client
```

**Expected:** build signs successfully, installs, launches and reports the intended app/version. The Share Extension target is included in the signed build.

**Failure:** signing/capability error, wrong bundle ID, missing extension target, app cannot install/launch, or build SHA cannot be identified.

**Diagnostic:** EAS build log plus `npm run native:release-check`. Apple/EAS configuration issues belong in `docs/V1_RELEASE_BLOCKERS.md`.

## 1 — Development-only diagnostics baseline

Open:

`one://dev-native?probe=1`

**Expected:** only a development build shows Native Acceptance. Platform is iOS; local persistence passes; auth state is truthful; permission states are truthful; sync is not permanently stuck. No captured memory text, passwords, auth codes or credentials appear in the event log.

**Failure:** production/preview binary exposes diagnostics, diagnostics contain private captured content/credentials, persistence fails, or the screen reports a capability as passed without actually exercising it.

**Diagnostic:** refresh the Native Acceptance screen and preserve the event/error summary without copying user memory contents.

## 2 — Onboarding and authentication

### 2.1 Fresh launch

Fresh-install ONE and complete/skip onboarding as offered.

**Expected:** deterministic onboarding → auth/app route; no stale prior-account content flashes.

**Failure:** route loop, blank screen, previous-account data flash, or onboarding cannot complete.

**Diagnostic:** Native Acceptance auth/hydration rows.

### 2.2 Sign-up and confirmation

Create a new test account and open its confirmation email on the same iPhone.

**Expected:** `one://auth/callback` opens ONE, PKCE exchange completes, authenticated state appears, and no auth code is logged.

**Failure:** browser dead-end, wrong route, raw code displayed/logged, indefinite spinner, or wrong account appears.

**Diagnostic:** Native Acceptance deep-link event plus Supabase Auth logs/dashboard.

### 2.3 Login, logout and restore

Sign in, force-quit, reopen, sign out, force-quit again and reopen.

**Expected:** signed-in session restores after force quit; signed-out state remains signed out; user content disappears immediately on logout.

**Failure:** session oscillation, account data visible while signed out, or route guard trap.

**Diagnostic:** Native Acceptance Authentication, Item hydration and Sync rows.

### 2.4 Password reset

Request reset, open the email, return through `one://auth/reset-password`, set a new password, then sign in with it.

**Expected:** reset route opens, password update succeeds, new password works.

**Failure:** reset link cannot return to ONE, code/session error is hidden, or wrong route/account appears.

**Diagnostic:** deep-link event plus Supabase Auth logs.

## 3 — Manual capture and canonical identity

Create at least:

- `Dentist Thursday 15:00`
- `Remind me tomorrow at 18:00 to call Paul`
- `Gift idea for Dad: silver watch`
- a normal HTTPS URL
- a plain note

**Expected:** capture saves locally first; classification/date/time remain reviewable where uncertain; one logical capture produces one `OneItem`; edits are reflected consistently in Inbox, Calendar, Saved, Search and Ask ONE where applicable.

**Failure:** capture disappears because enrichment/network fails, duplicate logical objects appear across surfaces, or unsupported details are fabricated.

**Diagnostic:** item detail plus Native Acceptance sync state.

## 4 — Camera, Photos and Scan to ONE

### 4.1 Permission matrix

Test Camera and Photos from not-determined → allow, then repeat after denying in iOS Settings.

**Expected:** truthful permission state, clear recovery path, cancellation changes nothing.

**Failure:** blank screen, crash, success claim after denial, or existing data changes.

**Diagnostic:** Native Acceptance Camera/Photos rows.

### 4.2 OCR matrix

Test screenshot/photo/document/receipt, including poor lighting and an image with no readable text.

**Expected:** original attachment is copied into ONE private local storage before OCR is trusted; success/empty/failure states are distinct; raw OCR evidence is preserved where applicable; OCR failure does not destroy the image.

**Failure:** image lost, empty OCR presented as success, or OCR error blocks manual save indefinitely.

**Diagnostic:** `attachment_persisted`, `ocr_success`, `ocr_empty`, `ocr_failed` events.

### 4.3 Late OCR race

Start OCR and immediately edit title and recognized-text fields before OCR completes. Background/foreground once during the run.

**Expected:** late OCR never overwrites newer manual edits. If recognized text itself was manually edited, the late OCR result must not replace it.

**Failure:** any manual correction is reverted by a late asynchronous result.

**Diagnostic:** reproduce with the same image and record screen/video; no memory text in diagnostic log.

### 4.4 Receipt safety

Use a receipt with multiple line-item prices and one explicit `Total/Gesamt/Amount due`.

**Expected:** only an explicitly labelled supported total is promoted; ambiguous/no-total receipts remain reviewable; currency is not invented without evidence.

**Failure:** arbitrary line-item price becomes confirmed total.

**Diagnostic:** Capture Review fields and confidence/review state.

## 5 — Share Sheet

Use Safari, Photos, Files and another text-capable app where available. Test:

- selected/plain text
- URL/web page
- screenshot
- image
- PDF/file

Run both cold-start and warm-start shares.

**Expected:** ONE appears in the iOS Share Sheet; share opens the main ONE Capture Review path; multiple iOS representations resolve to one primary capture; attachment is secured locally before temporary OS URLs can disappear; malformed/empty payloads are not silently saved; signed-out/offline shares remain local.

**Failure:** ONE missing from Share Sheet, duplicate captures from one handoff, temporary attachment lost, unsupported payload silently saved, or share requires network to preserve the capture.

**Diagnostic:** Native Acceptance `share_intent`, `share_received`, attachment and OCR events. Current Expo incoming sharing is experimental, so this physical result is mandatory evidence.

### 5.1 Duplicate protection

Share the same payload twice quickly.

**Expected:** accidental replay is blocked; explicit `Save again` still permits an intentional duplicate.

**Failure:** replay silently creates a second item or intentional duplicate cannot be saved.

**Diagnostic:** `share_duplicate_blocked` event.

## 6 — Inbox and triage

Exercise open, edit, save/process, schedule, reminder, delete and undo where the UI supports it. Rapidly tap an action twice.

**Expected:** one canonical item changes state; double taps do not create duplicate reminders/items; destructive actions are clear.

**Failure:** duplicate object, duplicate action, stale item route, or UI claims save after failure.

**Diagnostic:** compare the same item ID across Inbox/Calendar/Saved/Search.

## 7 — Calendar

Schedule a dated item, add/remove time, move date, clear date, complete it and reopen from Calendar.

**Expected:** correct local wall-clock day; time optional; edits update immediately; clearing date removes Calendar placement; Calendar opens the same canonical item.

**Failure:** wrong day/timezone drift, stale duplicate event, or Calendar opens a different logical copy.

**Diagnostic:** item detail date/time and Calendar day.

## 8 — Notifications and reminders

### 8.1 Permission and delivery

From Native Acceptance request notification permission and schedule the five-second test notification.

**Expected:** permission state is truthful and the notification physically arrives when allowed.

**Failure:** app claims delivery merely because scheduling API returned, or denial is shown as success.

**Diagnostic:** Notifications row and scheduled counts.

### 8.2 Reminder lifecycle

Create a future reminder, edit title/date/time, reschedule, complete, create another and delete it. Restart after each major state.

**Expected:** one active native notification per applicable item; edits replace the old schedule; completion/deletion cancels; restart does not duplicate.

**Failure:** duplicate schedules, stale notification after completion/delete, or incorrect content/time.

**Diagnostic:** Scheduled ONE items count plus item notification status.

### 8.3 Tap routing and privacy

Tap a live reminder notification. Then test a delivered notification after deleting its item. Finally sign out from account A and sign into account B.

**Expected:** live tap opens the accessible item; stale tap never opens a missing/foreign item detail; account A private reminder content is not left active for account B.

**Failure:** cross-account content, stale item route, or another user's reminder remains scheduled/visible.

**Diagnostic:** `notification_opened` / `notification_stale` events and scheduled counts.

## 9 — Search

Test exact title, OCR text, URL, tag/context, person/entity, date, receipt merchant/amount and multiple matches. Then disable network.

**Expected:** relevant exact results rank strongly; pending local items are discoverable; empty query intentionally shows recent items; offline lexical search remains usable; deleted items do not appear.

**Failure:** network loss disables ordinary search, foreign/deleted item appears, or exact match is buried without reason.

**Diagnostic:** compare Search results with active account item list.

## 10 — Ask ONE / ONE AI

With known test memories ask:

- a question with one clear answer;
- a question requiring two saved items;
- an ambiguous question;
- a nonexistent-memory question.

Open every source card.

**Expected:** answer uses only accessible saved memories; source IDs open real accessible items; insufficient evidence returns uncertainty/no result; multiple-item answer remains source-backed.

**Failure:** fabricated memory/source, deleted/foreign item source, generic factual answer presented as user memory, or AI/network failure masquerades as successful recall.

**Diagnostic:** source cards plus local Search comparison. Turn network off and confirm safe fallback/no-result behavior.

## 11 — Local-first sync

### 11.1 Offline create/update/delete

Disable network. Create, edit and delete separate items; force-quit and reopen while still offline.

**Expected:** local state survives restart; pending state/tombstone survives; normal capture never waits for cloud.

**Failure:** local item disappears, deleted item resurrects immediately, or capture blocks on network.

**Diagnostic:** Native Acceptance Sync row and item state.

### 11.2 Reconnect

Re-enable network and wait for bounded retry/sync.

**Expected:** pending changes converge; no duplicate IDs; offline delete remains deleted; failure is retryable and truthful.

**Failure:** silent overwrite of newer local edit, item resurrection, endless retry loop or duplicate capture.

**Diagnostic:** Sync row/events and second authenticated session when available.

### 11.3 Large cloud set

If practical in a staging/test account, exceed 1,000 cloud items using generated non-sensitive test data and reopen/sync.

**Expected:** the client retrieves the complete paginated cloud set; items beyond the service's default response cap are not treated as remotely deleted.

**Failure:** item count truncates near a server page limit or local items disappear after pull.

**Diagnostic:** compare server count with local count; do not use production personal data for load generation.

## 12 — Account isolation and migration

1. Signed out, create `Anonymous transfer test`.
2. Sign in as account A; verify migration exactly once.
3. Create `User A private item` and a future reminder.
4. Sign out.
5. Sign in as account B.
6. Create `User B private item`.
7. Return to account A.

**Expected:** A and B never see each other's items; A notifications are suspended outside A; anonymous migration does not duplicate or silently migrate to two accounts; development seed content never becomes cloud user data.

**Failure:** any cross-account item/notification/attachment, duplicate migration, or stale account flash.

**Diagnostic:** Native Acceptance auth/scheduled rows plus account-specific Search.

## 13 — Attachments and privacy controls

Save an image/document, restart, go offline, reconnect, then delete the item. Exercise Export My Data and Delete Account on dedicated test accounts.

**Expected:** local attachment survives restart; cloud object is private/user-scoped; retry path is safe; deletion cleans associated data as designed; export contains only active scope; account deletion does not claim App Store subscription cancellation.

**Failure:** public attachment URL, foreign-account access, missing attachment after normal restart, export leakage or false cancellation claim.

**Diagnostic:** Supabase Storage under the test user path plus app UI. Never use a service-role key in the mobile client.

## 14 — Billing gates

### Development build without RevenueCat configuration

**Expected:** explicit development beta behavior may unlock ONE AI for internal acceptance only.

**Failure:** UI misrepresents this as a real App Store purchase.

### Preview/production-like build without RevenueCat configuration

**Expected:** paid entitlement fails closed; billing-unavailable state is truthful; no back-navigation loop; paid/AI access is not granted.

**Failure:** unrestricted paid access, navigation loop, false purchase state or false cancellation state.

### Configured sandbox billing

When App Store Connect/RevenueCat is ready, test purchase, cancel sheet, failed purchase, restore and entitlement refresh.

**Expected:** cancellation is not an error purchase; restore reflects RevenueCat/App Store truth; ONE remains usable according to the real entitlement; ONE AI gate matches entitlement.

**Failure:** entitlement granted on missing config, cancelled purchase reported as success, or restore invents state.

**Diagnostic:** RevenueCat sandbox dashboard/logs plus paywall state. Do not print customer secrets.

## 15 — Layout, keyboard and accessibility

Test light/dark mode, a small iPhone and a larger iPhone where available. Enable larger text and VoiceOver for a smoke pass.

**Expected:** important controls clear safe areas/home indicator; Capture/Share/Scan review scrolls with keyboard; tappable controls have usable labels/targets; destructive actions remain reachable; disabled/error states remain distinguishable.

**Failure:** clipped primary action, keyboard trap, unlabeled critical control, unreadable state or layout prevents completion.

**Diagnostic:** screenshot/screen recording with device model and text-size setting.

## 16 — iPad follow-up

After iPhone critical acceptance, install the same accepted SHA on iPad.

**Expected:** no clipped content; tab bar/forms/chat composer/Scan remain usable; keyboard and native date/time controls remain workable in supported orientation.

**Failure:** layout blocks a V1 critical flow.

## 17 — Exit criteria

Mark **READY FOR TESTFLIGHT** only after all critical physical-device rows above pass or have an explicitly accepted non-blocking disposition, required external configuration for the TestFlight build is complete, and the exact tested SHA has a green repository quality gate.

Critical iPhone acceptance chain:

**Share or capture → local preservation → Capture Review → canonical item → optional Calendar/reminder → restart/offline/reconnect → Search/Ask ONE retrieval → logout/account switch privacy**

For every failure record:

- Git SHA/build number
- device/iOS
- exact action
- expected result
- actual result
- network/auth state
- relevant diagnostic event (without private memory content)
- screenshot/video when useful
- blocker classification from `docs/V1_RELEASE_BLOCKERS.md`
