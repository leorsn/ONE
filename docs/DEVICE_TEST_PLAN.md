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
- Add an item while signed in.
- Restart app and confirm persistence.
- Confirm cloud sync status.
- Confirm private attachment can be reopened.
- Delete a cloud-backed item and confirm it does not reappear immediately.

Known V1 item to watch: offline deletion tombstones are still a separate hardening task.

## 9. Subscription UI

Beta build without RevenueCat keys:

- ONE AI remains unlocked.
- Plans screen clearly states beta billing is disabled.

Store-connected sandbox build:

- no entitlement => hard paywall after onboarding
- ONE purchase => base access
- ONE AI purchase => Ask ONE access
- Restore Purchases works
- returning from background refreshes entitlement state
- introductory offer copy does not promise eligibility to every user

## 10. iPad

- App installs and launches on iPad.
- Tab bar is usable.
- No clipped content.
- Forms and chat composer remain readable with keyboard visible.
- Scan and document screens remain usable in portrait.

## Exit criteria

The first beta passes when there are no blocker crashes and the following work end-to-end on a physical iPhone:

- onboarding
- capture
- calendar
- notifications
- Scan to ONE
- Documents
- Share to ONE
- Ask ONE
- account/cloud persistence

Log every issue with screen, exact action, expected result, actual result and screenshot when possible.
