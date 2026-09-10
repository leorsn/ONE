# ONE — Native Device Test Plan

This checklist is for the first real iPhone/iPad development build.

## Build target

- Branch: `dev/foundation`
- Use an Expo development build, not Expo Go.
- Test on a physical iPhone first.
- Test iPad layout after the iPhone smoke test.

## 1. Launch and onboarding

- Fresh install opens onboarding.
- Light and dark mode render correctly.
- Skip and Continue work.
- Completing onboarding routes into ONE during beta.
- Production billing build with no entitlement routes to the plans screen.

## 2. Inbox capture

Test these inputs:

- `Dentist Thursday 15:00`
- `Call Anna tomorrow`
- `Cancel Netflix on the 23rd`
- `Gift idea for Dad: Rolex book`
- a normal URL

Verify title, type, date, time, category and saved state before and after save.

## 3. Calendar and reminders

- Dated items appear on the correct day.
- Opening an item from Calendar works.
- Date and time editing use native device pickers on iOS/Android.
- Date and time remain optional and can be cleared.
- Notification permission is requested only when needed.
- Reminder timing follows Settings.
- Completing/deleting an item cancels its notification.

## 4. Scan to ONE

Test at least:

- supermarket receipt
- clothing receipt
- invoice
- ticket/reservation
- document with poor lighting

Verify:

- camera permission
- photo library import
- OCR text
- document kind
- merchant
- date
- amount
- currency
- manual correction before save
- image remains available after app restart

## 5. Documents hub

- Saved > Documents opens.
- Monthly captured total is correct.
- Receipt/invoice counts are correct.
- Largest purchase is correct.
- Filters work.
- Merchant/date/amount appear on rows.
- Empty-state works after removing all test documents.

## 6. Share to ONE

From Safari, Photos and another app:

- share text
- share URL
- share screenshot
- share image
- share PDF if supported by the current native target

Verify context input, OCR where relevant, attachment persistence and Saved destination.

## 7. Ask ONE / ONE AI

Test:

- `How much did I spend this month?`
- `Show me invoices over €500`
- `Which was the largest?`
- `How much in total?`
- `Show me the receipts`
- `When was the dentist appointment?`

Verify direct answers, supporting memories and follow-up context.

## 8. Account and cloud sync

- Create account / sign in.
- Confirm the account email from the same iPhone and verify the deep link returns to ONE.
- Sign out, tap `Forgot password?`, open the reset email on the same iPhone and set a new password.
- Sign out again and confirm the new password works and the old password no longer works.
- Add an item while signed in.
- Restart app and confirm persistence.
- Confirm cloud sync status.
- Confirm private attachment can be reopened.
- Delete a cloud-backed item while online and confirm it stays deleted.
- Delete a cloud-backed item while offline, restart, reconnect and confirm it does not return.
- Confirm deferred cloud attachment cleanup completes after reconnect.
- Confirm built-in development seed items never appear in the authenticated cloud account.
- Delete the ONE account from Settings and confirm cloud items, attachments, local items and scheduled notifications are removed.

### Account isolation regression test

1. Signed out, create an anonymous capture called `Anonymous transfer test`.
2. Sign in to user A and verify that real anonymous capture transfers into user A exactly once.
3. Create `User A private item` while signed in.
4. Sign out and verify `User A private item` is no longer visible.
5. Sign in to a different user B and verify neither user A item nor user A cloud data appears.
6. Create `User B private item`, sign out, then sign back in to user A.
7. Verify user A sees user A data and not user B data.
8. Sign back in to user B and verify user B data is restored independently.
9. Confirm development seed/demo memories never migrate into either authenticated account.
10. Repeat an offline delete under user A and verify its tombstone cannot affect user B.

## 9. Privacy and data control

- Privacy screen opens.
- `Export my data` creates a JSON export through the native share sheet.
- Export contains the current account/scope items only.
- Temporary export file is cleaned up after sharing.
- Account deletion remains available in-app.

## 10. Subscription UI

Beta build without RevenueCat keys:

- ONE AI remains unlocked.
- Plans screen clearly states beta billing is disabled.

Store-connected sandbox build:

- no entitlement => hard paywall after onboarding
- auth confirmation/password-reset deep links remain reachable even while the paywall is active
- ONE purchase => base access
- ONE AI purchase => Ask ONE access
- Restore Purchases works
- Manage Subscription opens the RevenueCat/App Store management destination
- returning from background refreshes entitlement state
- introductory offer copy does not promise eligibility to every user
- deleting a ONE account does not falsely claim that the App Store subscription was cancelled

## 11. iPad

- App installs and launches on iPad.
- Tab bar is usable.
- No clipped content.
- Forms and chat composer remain readable with keyboard visible.
- Scan and document screens remain usable in portrait.
- Native date/time controls remain usable at iPad size.

## Exit criteria

The first beta passes when there are no blocker crashes and the following work end-to-end on a physical iPhone:

- onboarding
- capture
- calendar
- notifications
- native date/time editing
- Scan to ONE
- Documents
- Share to ONE
- Ask ONE
- account confirmation
- password recovery
- account/cloud persistence
- multi-account local isolation
- offline delete reconciliation
- data export
- account deletion
- subscription management

Log every issue with screen, exact action, expected result, actual result and screenshot when possible.
