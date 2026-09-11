# ONE — Native iOS Device Acceptance Plan

This checklist is for the first real iPhone/iPad development build. Passing CI, web export, Expo Go, or a browser preview does **not** count as native acceptance.

## Build target

- Repository: `leorsn/ONE`
- Branch: `dev/foundation`
- Bundle identifier: `app.one.mobile`
- URL scheme: `one`
- Share extension bundle: `app.one.mobile.ShareExtension`
- App Group: `group.app.one.mobile`
- Use an Expo **development build**, not Expo Go.
- Test on a physical iPhone first; test iPad layout after the iPhone smoke test.

The development EAS profile is already configured with `developmentClient: true` and internal distribution.

## Development-only Native Acceptance screen

In a development build, open:

`one://dev-native?probe=1`

The route is hidden from production builds and reports device/runtime state for:

- authentication
- authenticated Supabase/RLS connectivity
- local AsyncStorage persistence
- item hydration
- pending sync
- camera permission
- photo-library permission
- notification permission
- count of scheduled local notifications
- Share-to-ONE receipt events
- OCR outcomes
- local attachment persistence
- native deep-link receipt
- latest native error

It also provides actions to request permissions, schedule a five-second local notification, test the ONE URL scheme, and open Scan to ONE.

Diagnostics are development-only and must not contain shared content, passwords, auth codes, or privileged credentials.

## 1. Install and first launch

- Install a fresh EAS development build on the iPhone.
- iOS 16+ Developer Mode is enabled if required by the development build.
- Fresh install opens onboarding.
- Light and dark mode render correctly.
- Skip and Continue work.
- Complete onboarding and enter ONE during beta.
- Kill ONE completely, reopen it, and confirm onboarding/session state is restored correctly.

## 2. Native Acceptance baseline

Open `one://dev-native?probe=1` and verify:

- Platform reports iOS.
- Local persistence reports Passed.
- Camera/Photos/Notifications report truthful permission states.
- Signed-in state matches reality.
- Supabase reports authenticated RLS connectivity when signed in.
- Sync does not remain permanently stuck.
- `Test ONE deep link` returns to the same development route.

Do not mark a native capability as passed merely because the row exists.

## 3. Inbox capture

Test:

- `Dentist Thursday 15:00`
- `Remind me tomorrow at 18:00 to call Paul`
- `Cancel Netflix on the 23rd`
- `Gift idea for Dad: silver watch`
- a normal URL
- a plain note

Verify classification, ambiguity/review state, title, date, time, destination and save state. Confirm only one canonical item is created and edits appear consistently in Inbox/Calendar/Saved.

## 4. Notifications and reminders

From Native Acceptance:

- Request notification access.
- Schedule the five-second acceptance notification.
- Confirm actual delivery on the physical iPhone.

Then test a real ONE reminder:

- Save a future reminder.
- Confirm it has a truthful scheduled/denied state.
- Edit title/date/time and confirm the old schedule is not left active.
- Complete the reminder and confirm its scheduled notification is removed.
- Reopen it where supported and confirm scheduling behavior remains coherent.
- Delete a reminder and confirm its notification is removed.
- Kill/restart ONE and confirm the reminder does not duplicate.
- Sign out and confirm private reminder notifications from that account are suspended.
- Sign in as a different user and confirm no previous-account reminder content appears.
- Tap a notification and confirm ONE opens the corresponding existing item.
- Delete the item before tapping an older delivered notification and confirm ONE does not route into a stale missing-item detail screen.

Date/time should behave as local wall-clock time on the device. Repeat one test across a different device timezone if practical.

## 5. Scan to ONE

Test at least:

- supermarket receipt
- clothing receipt
- invoice
- ticket/reservation
- document with poor lighting

Permission tests:

- camera not requested
- camera allowed
- camera denied, including Open Settings recovery
- photo library not requested
- photo library allowed
- photo library denied
- user cancels camera/photo picker

Flow acceptance:

1. Acquire image.
2. Confirm the original is copied into ONE's private local storage before OCR completes.
3. Background ONE while OCR is running; return to it.
4. Confirm the capture/review is still usable.
5. Confirm OCR success, empty OCR and OCR-failure states are truthful.
6. Confirm a late OCR result does not overwrite manual edits already made in Capture Review.
7. For receipts, confirm arbitrary line-item values are never promoted to `Total`.
8. Save and restart ONE; confirm attachment remains available.
9. Sign in/offline/reconnect and confirm the item remains local while cloud upload is pending.

Apple Vision OCR through `expo-ocr-kit` is considered accepted only after this physical-device test.

## 6. Share to ONE — native Share Extension

A development build is required after changes to `app.json`; Expo Go cannot validate the extension.

Test from Safari, Mail, Photos and Files where available:

- selected/plain text
- URL/web page
- screenshot
- image
- PDF/file
- another supported document attachment

Expected flow:

**Share → ONE → main ONE app → Capture Review → Save → normal ONE destination**

Verify:

- ONE appears in the iOS Share Sheet after the native build is installed.
- Cold-start share opens the Capture Review path.
- Warm-start share opens the same path.
- Multiple iOS representations of one share resolve to one primary capture.
- Original attachment is persisted locally before the cloud is trusted.
- OCR runs for supported images without blocking Save indefinitely.
- Empty/malformed share payload is not silently saved.
- Sharing the same payload twice in quick succession triggers duplicate protection rather than creating an accidental duplicate.
- Explicit `Save again` still allows an intentional duplicate.
- Signed-out share remains local.
- Offline signed-in share remains local/pending and syncs after reconnect.
- Return to Native Acceptance and verify share/attachment/OCR events were recorded without the shared content itself being logged.

Current Expo SDK 57 iOS share receiving is experimental and opens the main app target. Treat physical-device behavior as mandatory acceptance evidence.

## 7. Calendar and item editing

- Dated ONE items appear on the correct day.
- Opening an item from Calendar works.
- Date/time editing uses native controls on iOS.
- Date/time remains optional and can be cleared.
- Edits update the same canonical item shown in all views.
- Keyboard does not obscure important inputs or Save controls on a small iPhone.

## 8. Ask ONE / ONE AI

Test:

- `When is my dentist appointment?`
- `Where is it?`
- `What gift idea did I save for Dad?`
- `How much was the receipt from IKEA?`
- `What reminder do I have tomorrow?`
- an intentionally unknown question
- a query with multiple plausible appointments

Verify concise grounded answers, tappable supporting memories, truthful no-result behavior and multiple-match behavior. Turn off network and confirm local/keyword fallback does not claim semantic cloud recall succeeded.

## 9. Account, deep links and session restoration

Supabase Auth URL configuration must allow at minimum:

- `one://auth/callback`
- `one://auth/reset-password`

Test on the same physical iPhone:

- Create account.
- Open confirmation email and confirm `one://auth/callback` returns to ONE.
- Test callback while ONE is already running.
- Test an expired/invalid confirmation link and confirm a truthful error.
- Sign out.
- Request Forgot Password.
- Open reset link and confirm `one://auth/reset-password` returns to ONE.
- Set a new password and sign in with it.
- Kill/restart while logged in and confirm session restoration.
- Kill/restart while logged out and confirm ONE remains logged out.
- Temporarily disable networking and confirm existing local data remains usable.
- Re-enable networking and confirm sync resumes without duplicate items.

If a session is expired/revoked server-side, confirm the authoritative Supabase auth state eventually signs ONE out rather than showing another account's cloud data.

## 10. Background / foreground regression

Exercise these deliberately:

- background during OCR
- background during attachment upload
- background during cloud sync
- background immediately after save
- foreground after several minutes
- cold-start from Share Sheet
- cold-start from notification tap
- cold-start from auth deep link

Verify no duplicate capture, duplicate reminder, lost local attachment or cross-account data appears.

## 11. Account isolation regression

1. Signed out, create an anonymous capture named `Anonymous transfer test`.
2. Sign in to user A and verify the real anonymous capture transfers into user A exactly once.
3. Create `User A private item`.
4. Sign out and verify it is no longer visible and its private scheduled notifications are suspended.
5. Sign in to user B and verify user A data does not appear.
6. Create `User B private item`, sign out, return to user A.
7. Verify each account restores only its own data.
8. Confirm development seed/demo memories never migrate into authenticated cloud accounts.
9. Perform an offline delete under user A and verify its tombstone cannot affect user B.

## 12. Privacy / data controls

- Private cloud attachments cannot be opened as public URLs.
- `Export my data` exports only the active account/scope.
- Delete Account removes account-scoped cloud/local data as designed.
- Account deletion does not falsely claim an App Store subscription was cancelled.
- No service-role secret exists in the mobile bundle.

## 13. iPhone layout / keyboard

Test at least one small and one larger iPhone viewport when available:

- no important control under notch/Dynamic Island
- bottom actions clear the home indicator
- tab bar remains usable
- Capture Review scrolls while keyboard is open
- Share Review scrolls while keyboard is open
- Scan Review scrolls while keyboard is open
- password reset inputs remain visible
- destructive confirmations are reachable

Portrait is the configured primary orientation.

## 14. iPad

- App installs and launches.
- Tab bar remains usable.
- No clipped content.
- Forms/chat composer remain readable with keyboard visible.
- Scan/document screens remain usable in portrait.
- Native date/time controls remain usable at iPad size.

## Exit criteria

PO044 native acceptance is complete only after a real development build passes the critical physical-iPhone flow:

**Share something → ONE receives it → Capture Review → Save → optional reminder → restart/background/reconnect → retrieve through ONE**

At minimum physically accept:

- onboarding / restart
- camera + photo permissions
- Scan + Apple Vision OCR
- Share Extension from Safari and Photos
- PDF/file share where exposed by iOS
- notification permission + delivery + edit/cancel + tap
- auth confirmation and password-reset deep links
- session restoration
- offline capture / reconnect
- account isolation
- safe-area / keyboard usability

For every failure record: screen, exact action, expected result, actual result, device/iOS version and screenshot when useful.
