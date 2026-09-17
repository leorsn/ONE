# NEVER — Physical iPhone & iPad V1 Acceptance Plan

This is the sequential physical-device acceptance package for NEVER V1. CI, web export, Expo Go, simulator-only behavior and static config inspection do **not** count as physical-device acceptance.

## Test target

- Repository: `leorsn/ONE`
- Branch: `dev/foundation`
- Test SHA: record the exact accepted SHA before building.
- Consumer display name: `NEVER`
- Bundle identifier: `app.one.mobile`
- Share Extension: `app.one.mobile.ShareExtension`
- App Group: `group.app.one.mobile`
- URL scheme: `one`
- Primary orientation: portrait
- First target: physical iPhone; iPad follows the critical iPhone smoke test.

The technical `one` identifiers are intentionally retained for native compatibility. They are not the consumer-facing brand.

Record for every run: device model, iOS/iPadOS version, build profile, build number, Git SHA, account used, network state and tester.

## 0 — Prerequisites and installation

Before creating a signed acceptance build:

```bash
npm ci --no-audit --no-fund
npm run quality
npm run release:env-check
npm run release:asset-check
```

`release:env-check` must use the intended production-like environment. `release:asset-check` is expected to block until the final NEVER App Store icon/assets are configured.

For a signed physical-device build, the Apple Developer configuration, identifiers, App Group and signing credentials must be available externally.

Then build:

```bash
npx eas-cli@latest build --platform ios --profile development
```

Install the resulting signed development build on the registered iPhone. Start Metro for the development client when needed:

```bash
npx expo start --dev-client
```

**Expected:** build signs successfully, installs, launches as NEVER and reports the intended app/version. The Share Extension target is included in the signed build.

**Failure:** signing/capability error, wrong bundle ID, wrong display name, missing extension target, app cannot install/launch, release gate failure, or build SHA cannot be identified.

**Diagnostic:** EAS build log plus `npm run native:release-check`. Apple/EAS configuration issues belong in `docs/V1_RELEASE_BLOCKERS.md`.

## 1 — Development-only diagnostics baseline

Open:

`one://dev-native?probe=1`

**Expected:** only a development build shows Native Acceptance. Platform is iOS; local persistence passes; auth state is truthful; permission states are truthful; sync is not permanently stuck. No captured memory text, passwords, auth codes or credentials appear in the event log.

**Failure:** production/preview binary exposes diagnostics, diagnostics contain private captured content/credentials, persistence fails, or the screen reports a capability as passed without actually exercising it.

**Diagnostic:** refresh the Native Acceptance screen and preserve the event/error summary without copying user memory contents.

## 2 — Onboarding and authentication

### 2.1 Fresh launch

Fresh-install NEVER and complete/skip onboarding as offered.

**Expected:** deterministic onboarding → auth/app route; no stale prior-account content flashes; platinum/chrome visual language is consistent; paging remains correct after device rotation/resize where the platform changes the available window size.

**Failure:** route loop, blank screen, previous-account data flash, broken paging, clipped content or onboarding cannot complete.

**Diagnostic:** Native Acceptance auth/hydration rows plus screen recording if layout-related.

### 2.2 Sign-up and confirmation

Create a new test account and open its confirmation email on the same iPhone.

**Expected:** `one://auth/callback` opens NEVER, PKCE exchange completes, authenticated state appears, and no auth code is logged.

**Failure:** browser dead-end, wrong route, raw code displayed/logged, indefinite spinner, or wrong account appears.

**Diagnostic:** Native Acceptance deep-link event plus Supabase Auth logs/dashboard.

### 2.3 Login, logout and restore

Sign in, force-quit, reopen, sign out, force-quit again and reopen.

**Expected:** signed-in session restores after force quit; signed-out state remains signed out; user content disappears immediately on logout.

**Failure:** session oscillation, account data visible while signed out, or route guard trap.

**Diagnostic:** Native Acceptance Authentication, Item hydration and Sync rows.

### 2.4 Password reset

Request reset, open the email, return through `one://auth/reset-password`, set a new password, then sign in with it.

**Expected:** reset route opens as NEVER, password update succeeds, new password works.

**Failure:** reset link cannot return to NEVER, code/session error is hidden, or wrong route/account appears.

**Diagnostic:** deep-link event plus Supabase Auth logs.

## 3 — Manual capture and canonical identity

Create at least:

- `Dentist Thursday 15:00`
- `Remind me tomorrow at 18:00 to call Paul`
- `Gift idea for Dad: silver watch`
- a normal HTTPS URL
- a plain note

**Expected:** capture saves locally first; classification/date/time remain reviewable where uncertain; one logical capture produces one `OneItem`; edits are reflected consistently in Inbox, Calendar, Saved, Search and Ask NEVER where applicable.

**Failure:** capture disappears because enrichment/network fails, duplicate logical objects appear across surfaces, or unsupported details are fabricated.

**Diagnostic:** item detail plus Native Acceptance sync state.

## 4 — Camera, Photos and Scan to NEVER

### 4.1 Permission matrix

Test Camera and Photos from not-determined → allow, then repeat after denying in iOS Settings.

**Expected:** truthful permission state, clear recovery path, cancellation changes nothing. Permanently denied access offers an Open Settings recovery path.

**Failure:** blank screen, crash, success claim after denial, dead-end permission state, or existing data changes.

**Diagnostic:** Native Acceptance Camera/Photos rows.

### 4.2 OCR matrix

Test screenshot/photo/document/receipt, including poor lighting and an image with no readable text.

**Expected:** original attachment is copied into NEVER private local storage before OCR is trusted; success/empty/failure states are distinct; raw OCR evidence is preserved where applicable; OCR failure does not destroy the image.

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

**Expected:** NEVER appears in the iOS Share Sheet; share opens the main NEVER Capture Review path; multiple iOS representations resolve to one primary capture; attachment is secured locally before temporary OS URLs can disappear; malformed/empty payloads are not silently saved; signed-out/offline shares remain local.

**Failure:** NEVER missing from Share Sheet, duplicate captures from one handoff, temporary attachment lost, unsupported payload silently saved, or share requires network to preserve the capture.

**Diagnostic:** Native Acceptance `share_intent`, `share_received`, attachment and OCR events. Incoming sharing must be accepted on the signed physical build.

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

### 8.1 Permission and recovery

Open Settings → Notifications with permission initially undetermined, allow it, then disable notifications from iOS Settings and return to NEVER.

**Expected:** permission state refreshes when the app becomes active again. When permanently denied, the control says `Open Settings` and opens the system settings page rather than re-requesting an impossible prompt.

**Failure:** stale permission status, repeated dead permission prompt, misleading `On` state or no recovery path.

### 8.2 Physical delivery

From Native Acceptance request notification permission and schedule the five-second test notification.

**Expected:** permission state is truthful and the notification physically arrives when allowed.

**Failure:** app claims delivery merely because scheduling API returned, or denial is shown as success.

**Diagnostic:** Notifications row and scheduled counts.

### 8.3 Reminder lifecycle

Create a future reminder, edit title/date/time, reschedule, complete, create another and delete it. Restart after each major state. Also test an imported/corrupt invalid date/time fixture in a non-production test account if available.

**Expected:** one active native notification per applicable item; edits replace the old schedule; completion/deletion cancels; restart does not duplicate; invalid calendar/time data is treated as not schedulable rather than repeatedly retried.

**Failure:** duplicate schedules, stale notification after completion/delete, incorrect content/time or repeated schedule errors from invalid stored dates.

**Diagnostic:** Scheduled NEVER items count plus item notification status.

### 8.4 Tap routing and privacy

Tap a live reminder notification. Then test a delivered notification after deleting its item. Finally sign out from account A and sign into account B.

**Expected:** live tap opens the accessible item; stale tap never opens a missing/foreign item detail; account A private reminder content is not left active for account B.

**Failure:** cross-account content, stale item route, or another user's reminder remains scheduled/visible.

**Diagnostic:** `notification_opened` / `notification_stale` events and scheduled counts.

## 9 — Search

Test exact title, OCR text, URL, tag/context, person/entity, date, receipt merchant/amount and multiple matches. Then disable network.

**Expected:** relevant exact results rank strongly; pending local items are discoverable; empty query intentionally shows recent items; offline lexical search remains usable; deleted items do not appear.

**Failure:** network loss disables ordinary search, foreign/deleted item appears, or exact match is buried without reason.

**Diagnostic:** compare Search results with active account item list.

## 10 — Ask NEVER / NEVER AI

With known test memories ask:

- a question with one clear answer;
- a question requiring two saved items;
- an ambiguous question;
- a nonexistent-memory question.

Open every source card.

**Expected:** answer uses only accessible saved memories; source IDs open real accessible items; insufficient evidence returns uncertainty/no result; multiple-item answer remains source-backed. Consumer-visible AI identity is NEVER, not ONE.

**Failure:** fabricated memory/source, deleted/foreign item source, generic factual answer presented as user memory, old consumer branding or AI/network failure masquerades as successful recall.

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

## 13 — Attachments, privacy and legal links

Save an image/document, restart, go offline, reconnect, then delete the item. Exercise Export My Data and Delete Account on dedicated test accounts.

Then open Settings → Privacy and test:

- Privacy Policy
- Terms of Use
- Support

**Expected:** local attachment survives restart; cloud object is private/user-scoped; retry path is safe; deletion cleans associated data as designed; export contains only active scope; account deletion does not claim App Store subscription cancellation; configured public legal/support links open successfully.

**Failure:** public attachment URL, foreign-account access, missing attachment after normal restart, export leakage, false cancellation claim, placeholder/missing production legal URL or broken external link.

**Diagnostic:** Supabase Storage under the test user path plus app UI. Never use a service-role key in the mobile client.

## 14 — Billing gates

### Development build without RevenueCat configuration

**Expected:** explicit development beta behavior may unlock NEVER AI for internal acceptance only.

**Failure:** UI misrepresents this as a real App Store purchase.

### Preview/production-like build without RevenueCat configuration

**Expected:** paid entitlement fails closed; billing-unavailable state is truthful; no back-navigation loop; paid/AI access is not granted.

**Failure:** unrestricted paid access, navigation loop, false purchase state or false cancellation state.

### Configured sandbox billing

When App Store Connect/RevenueCat is ready, test purchase, cancel sheet, failed purchase, restore and entitlement refresh.

**Expected:** cancellation is not an error purchase; restore reflects RevenueCat/App Store truth; NEVER remains usable according to the real entitlement; NEVER AI gate matches entitlement.

**Failure:** entitlement granted on missing config, cancelled purchase reported as success, or restore invents state.

**Diagnostic:** RevenueCat sandbox dashboard/logs plus paywall state. Do not print customer secrets.

## 15 — Premium visual acceptance

Do this separately from functional acceptance. A screen may be functionally correct and still fail visual acceptance.

Test in both Light and Dark mode on at least one modern iPhone. Review these screens deliberately:

1. Onboarding
2. Sign in
3. Inbox/Home
4. Search
5. Calendar
6. Saved
7. Ask NEVER
8. Scan
9. Incoming Share Review
10. Inbox Detail
11. Item Detail
12. Settings
13. Appearance
14. Notifications
15. Privacy
16. NEVER Plans

For each screen check:

- platinum/chrome/graphite hierarchy is consistent;
- no legacy blue brand accents remain;
- no visible `ONE`, `Ask ONE`, `Saved to ONE` or similar consumer branding remains;
- typography feels deliberate rather than template-generated;
- cards, radii and shadows are restrained;
- active/inactive states have enough contrast in both modes;
- loading, empty, permission-denied and error states look intentional;
- no debug/development copy appears in release-facing screens;
- haptics are subtle and attached to meaningful actions;
- navigation does not jump visually between old and new design systems.

**Failure:** any screen feels visually from a different app, legacy brand/color is visible, content is clipped, controls look like generic generated UI, or critical hierarchy is unclear.

Use `docs/NEVER_VISUAL_QA.md` as the visual design authority where applicable.

## 16 — Layout, keyboard and accessibility

Test light/dark mode, a small iPhone and a larger iPhone where available. Enable larger text and VoiceOver for a smoke pass.

**Expected:** important controls clear safe areas/home indicator; Capture/Share/Scan review scrolls with keyboard; tappable controls have usable labels/targets; destructive actions remain reachable; disabled/error states remain distinguishable.

**Failure:** clipped primary action, keyboard trap, unlabeled critical control, unreadable state or layout prevents completion.

**Diagnostic:** screenshot/screen recording with device model and text-size setting.

## 17 — iPad and resize acceptance

After iPhone critical acceptance, install the exact same accepted SHA on a supported iPad. Test full-screen and at least one narrower multitasking/window size where available.

**Expected:** primary content stays centered and bounded rather than stretching edge-to-edge; onboarding paging follows the current window width; tab bar, forms, Ask composer, Scan, Privacy, Notifications, Paywall, Item Detail and incoming Share Review remain usable; native date/time controls remain workable.

**Failure:** stretched phone UI, clipped content, wrong onboarding page width after resize, keyboard trap, unusable composer or any V1 critical flow blocked by tablet layout.

For App Store screenshot acceptance, capture the required iPad screenshot set only after this section passes visually.

## 18 — Store/release asset acceptance

Before TestFlight candidate promotion:

- run `npm run release:asset-check`;
- verify the installed icon is the approved NEVER icon at all relevant system surfaces;
- verify launch/start state uses NEVER branding;
- verify App Store screenshots use the accepted production UI and no development diagnostics;
- verify display name is NEVER on Home Screen, Settings and system share surfaces.

**Failure:** placeholder/default icon, old ONE branding, debug screenshot, wrong display name or asset gate failure.

## 19 — Exit criteria

Mark **READY FOR TESTFLIGHT** only after all critical physical-device rows above pass or have an explicitly accepted non-blocking disposition, required external configuration for the TestFlight build is complete, both manual release gates pass, and the exact tested SHA has a green repository quality gate.

Critical acceptance chain:

**Share or capture → local preservation → Capture Review → canonical item → optional Calendar/reminder → restart/offline/reconnect → Search/Ask NEVER retrieval → logout/account switch privacy → visual acceptance → iPad acceptance**

For every failure record:

- Git SHA/build number
- device/iOS or iPadOS version
- exact action
- expected result
- actual result
- network/auth state
- relevant diagnostic event (without private memory content)
- screenshot/video when useful
- blocker classification from `docs/V1_RELEASE_BLOCKERS.md`
