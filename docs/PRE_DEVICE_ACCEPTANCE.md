# NEVER physical-device acceptance

Every entry below is pending. Automated unit checks and JavaScript exports do not establish these results. Test a small supported iPhone and a large Pro Max, light/dark/system appearances, normal and accessibility text sizes. Use a development build, not Expo Go, for native modules.

1. TEST: Install and cold-launch with the approved icons; repeat after force quit and offline.
   EXPECTED RESULT: Native launch completes, correct icon appears, no indefinite spinner; saved content persists.
   STATUS: NOT TESTED

2. TEST: Complete onboarding, sign in/out, restore an expired session, change accounts while requests run.
   EXPECTED RESULT: Appropriate recovery UI, no other account's content or entitlements, no unexpected navigation reset.
   STATUS: NOT TESTED

3. TEST: Review Home, Capture/Inbox, Search, Saved/collections and every item detail type in both appearances.
   EXPECTED RESULT: Consistent NEVER hierarchy and materials, readable contrast, correct empty/loading/error/populated states.
   STATUS: NOT TESTED

4. TEST: Review profile, settings, notifications, privacy, appearance, account, upgrade, Ask, sheets and forms.
   EXPECTED RESULT: Matching typography, surfaces and controls; valid back navigation even when directly opened.
   STATUS: NOT TESTED

5. TEST: Use long titles, paragraphs, URLs, unusual imported dates and large text on small/large phones and supported iPad resizing.
   EXPECTED RESULT: No clipping or overlapping controls; content remains reachable and metadata does not crash rendering.
   STATUS: NOT TESTED

6. TEST: Capture with the keyboard visible, switch apps and return, submit rapidly twice; dismiss keyboard and sheets.
   EXPECTED RESULT: Draft survives foreground refresh, actions remain reachable, one submission, predictable focus and safe-area spacing.
   STATUS: NOT TESTED

7. TEST: Share Safari URLs, text, Photos images, Files documents and a multi-file batch into NEVER, warm and cold.
   EXPECTED RESULT: Each selected attachment is secured before saving; remaining files are reviewed sequentially; no silent batch loss.
   STATUS: NOT TESTED

8. TEST: Cancel a share, deny access, supply an unreadable file, interrupt a batch, repeat a previously handled share, edit during OCR.
   EXPECTED RESULT: Clear retry/duplicate choices; preserved user edits; no false success, unintended temporary-file loss or duplicate save.
   STATUS: NOT TESTED

9. TEST: Save/edit/delete offline, reconnect, edit while sync is delayed, delete while an upload is pending, change accounts mid-sync.
   EXPECTED RESULT: Current local revisions survive; deleted records do not reappear; errors remain retryable and account-isolated.
   STATUS: NOT TESTED

10. TEST: Create reminders with permission undecided/denied/allowed; relaunch, reschedule, complete/delete; tap foreground and cold-start notifications.
    EXPECTED RESULT: Prompts follow explicit user intent, never hydration; valid scheduling, no stale duplicate reminders, correct destination.
    STATUS: NOT TESTED

11. TEST: Search/filter with no results and long results; Ask with success, unavailable service, delayed answer and navigation away.
    EXPECTED RESULT: Clear states, responsive controls, no stale answer overwriting a newer request or unmounted screen.
    STATUS: NOT TESTED

12. TEST: Switch theme and alternate icon repeatedly, including during a persistence failure.
    EXPECTED RESULT: One operation at a time, accurate error feedback, native icon changes persist across relaunch.
    STATUS: NOT TESTED

13. TEST: Purchase, cancel and restore with StoreKit sandbox; background app; change accounts while a response is delayed.
    EXPECTED RESULT: Correct account entitlement, no duplicate transaction attempts, no draft loss on foreground, cancellation is recoverable.
    STATUS: NOT TESTED

14. TEST: Exercise VoiceOver, Reduce Motion, larger text, haptics, swipe/context actions and scroll through a large library.
    EXPECTED RESULT: Useful labels and reading order, adequate touch targets, subtle motion, no noticeable scrolling stalls.
    STATUS: NOT TESTED

15. TEST: Leave Calendar/Home open over midnight; change timezone; open valid/invalid item links and unknown routes.
    EXPECTED RESULT: Correct local day and selected-day behavior; safe external links; branded recovery with usable navigation.
    STATUS: NOT TESTED

16. TEST: In a controlled backend environment, verify owner/other-user RLS, private attachment access, account deletion and unauthenticated model requests.
    EXPECTED RESULT: Ownership enforcement, no model invocation without verified auth, correct deletion; no sensitive production logs.
    STATUS: NOT TESTED

17. TEST: Build Release, inspect privacy manifests and capability entitlements, then verify launch on a provisioned device.
    EXPECTED RESULT: Both targets sign correctly with App Group and notification capability intact; no debug-only bypass or diagnostics UI leaks.
    STATUS: NOT TESTED
