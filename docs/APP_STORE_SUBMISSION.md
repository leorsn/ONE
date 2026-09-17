# NEVER — App Store Submission Dossier

Last reviewed: 2026-09-17

This file is the working source of truth for TestFlight/App Store preparation. It deliberately separates drafted copy from external values that still need to be supplied in App Store Connect or production environment configuration.

## 1. App identity

- **App name:** NEVER
- **Bundle ID:** `app.one.mobile` (legacy technical identifier; do not rename during release hardening)
- **Share Extension bundle ID:** `app.one.mobile.ShareExtension`
- **App Group:** `group.app.one.mobile`
- **Current app version:** `0.1.0`
- **Current build number:** managed by EAS for production; local config starts at `1`
- **Primary category — draft:** Productivity
- **Secondary category — draft:** Utilities

## 2. Store metadata — draft

### Name

NEVER

### Subtitle — draft

Your private memory

### Promotional text — draft

Capture anything. Find it when it matters. NEVER keeps your notes, screenshots, documents, reminders and saved details in one private memory layer.

### Description — draft

NEVER is a private memory app for the things you do not want to lose.

Capture information from everyday life, keep it organized automatically, and find it again when you need it.

Core features:
- Share text, links, screenshots and files into NEVER from other apps.
- Scan receipts and documents and keep the recognized text searchable.
- Save notes, reminders, dates, places and useful context in one place.
- Search your saved information without digging through folders.
- Keep your data synced to your authenticated account while retaining a local-first fallback.
- Export your saved data from the app.

NEVER AI adds optional semantic recall and grounded answers based on the information you have saved. AI answers are designed to use your saved sources rather than invent personal facts.

Your private information stays scoped to your account. Privacy, support and account-deletion controls are available from Settings.

### Keywords — draft

memory,organizer,notes,reminders,scanner,receipts,search,documents,archive,private

### Copyright

`2026 [LEGAL OWNER / ENTITY]`

**OPEN:** replace the bracketed owner with the actual rights holder before submission.

## 3. URLs

The app reads these public release URLs from environment variables:

- Privacy Policy: `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- Terms: `EXPO_PUBLIC_TERMS_URL`
- Support: `EXPO_PUBLIC_SUPPORT_URL`

Before TestFlight/App Store submission:

1. URLs must use HTTPS.
2. They must not contain placeholder values.
3. Privacy and Support must resolve publicly without authentication.
4. The same production URLs must be entered in App Store Connect.
5. Run `npm run release:env-check` against the intended release environment.

## 4. Screenshot plan

The repository currently declares both iPhone and iPad support.

### iPhone — primary set

Use a current accepted 6.9-inch portrait size, preferably **1320 × 2868 px**.

Target set: **6 screenshots**

1. **Home / Today** — clean populated state showing NEVER’s premium platinum/chrome visual system.
2. **Universal capture** — share/scan flow with realistic content and clear context extraction.
3. **Saved memory** — polished detail view with date, location, context and source.
4. **Search / Recall** — search result or Ask NEVER grounded answer with source items visible.
5. **Calendar / Reminders** — useful schedule state with realistic saved items.
6. **Privacy / Sync** — account, privacy and sync value proposition; never expose real personal data.

### iPad — required while `supportsTablet: true`

Use a current accepted 13-inch portrait size, preferably **2064 × 2752 px** or **2048 × 2732 px**.

Target set: **3–5 screenshots** using the same product story as iPhone but validating tablet layout quality rather than merely enlarging phone UI.

### Screenshot rules for our capture pass

- Use production-like demo data only.
- No developer diagnostics, beta banners, test emails or secret/config values.
- No clipped text, keyboard overlap or accidental system alerts.
- Light and dark screenshots may be mixed only if the sequence remains visually coherent.
- No transparency/alpha in final uploaded screenshot files.
- Run `docs/NEVER_VISUAL_QA.md` and the iPad section of `docs/DEVICE_TEST_PLAN.md` before capturing store assets.

## 5. App Review information

### Contact

**OPEN:** App Review contact name, email and phone number.

Use an international-format phone number in App Store Connect.

### Review account

**OPEN:** create a dedicated review account if authentication remains required for the submitted build.

Do not use a personal account. Seed the review account with realistic non-sensitive demo memories so Apple can exercise search, recall, documents and reminders.

### Review notes — draft

NEVER is a private personal-memory organizer.

Recommended review path:
1. Sign in with the supplied review account.
2. Open Home and Saved to view seeded demo memories.
3. Use Search to retrieve saved information.
4. Open Ask NEVER to test grounded recall from seeded sources if NEVER AI is enabled in this build.
5. Use Scan to test camera/photo import and OCR.
6. From Safari, Photos or Files, use the iOS Share Sheet and choose NEVER to test the Share Extension.
7. Open Settings → Notifications to test local reminder permission and scheduling.
8. Open Settings → Privacy to view privacy/support links, data export and privacy controls.
9. In Settings → Account, choose Delete Account to verify in-app account deletion.

Important implementation notes:
- Core data is scoped to the authenticated Supabase user.
- Incoming share handling uses the NEVER Share Extension.
- OCR is performed through the app’s native OCR integration.
- Local notifications are used for saved reminder items.
- NEVER AI, when enabled, answers from retrieved saved source items through the server-side recall function.

## 6. App Privacy working inventory

This section is a technical inventory, not legal advice and not a substitute for the final App Store privacy questionnaire.

### Data visibly handled by the current product

- **Account/contact information:** email address used for authentication.
- **User content:** notes, titles, summaries, dates, times, locations, tags, saved text, URLs and user-entered context.
- **Documents/media:** screenshots, images and shared files stored as user attachments when captured.
- **Derived user content:** OCR/extracted text, document metadata and locally/externally generated recall data derived from user-supplied content.
- **Subscription state:** entitlement/purchase state through RevenueCat when production billing is configured.
- **App/user identifiers:** authenticated user identifier used for account scoping and RevenueCat identity linking.

### Third-party/service paths to disclose and verify

- **Supabase:** authentication, database, storage and Edge Functions.
- **RevenueCat:** subscription entitlement/purchase state when enabled.
- **OpenAI via Supabase Edge Function:** selected retrieved memory source content and the user’s recall query when NEVER AI is used.

### Current package-manifest observation

No dedicated advertising SDK is present in the current dependency manifest. No dedicated analytics SDK is obvious in the current dependency manifest. Re-check the final release lockfile and native dependency graph before answering App Store privacy questions.

### iOS privacy-manifest verification

The repository intentionally does not guess Apple Required-Reason API declarations before inspecting the shipped native archive.

For the actual production-like `.xcarchive`, run:

```bash
npm run release:privacy-check -- /path/to/NEVER.xcarchive
```

The command verifies that `PrivacyInfo.xcprivacy` files are present in the generated archive and lists their locations. Presence alone is not enough: compare the final archive/App Store diagnostics with actual app and SDK API usage. Add an app-level `ios.privacyManifests` declaration only when a verified approved reason is required and accurately describes the shipped behavior.

### Required privacy-policy topics before public release

The public policy should accurately cover:
- what data NEVER collects/processes,
- why it is processed,
- where/how it is stored,
- service providers/third parties,
- retention and deletion,
- account deletion,
- user data export/privacy choices,
- AI processing when NEVER AI is used,
- contact/support details.

## 7. Subscription submission

Current intended visible plans:

- NEVER — €2.99/month, 7-day trial for eligible new subscribers.
- NEVER AI — €4.99/month, no trial.

Legacy technical product/entitlement identifiers are intentionally preserved in code for compatibility.

Before paid App Store release:

- RevenueCat iOS SDK key configured in production.
- App Store Connect products created and matched to the existing product IDs.
- RevenueCat offering and entitlement mapping verified.
- Trial eligibility/configuration verified in App Store Connect.
- Purchase, upgrade/downgrade, restore and subscription-management flows tested on a real Apple sandbox/TestFlight account.
- Run `NEVER_RELEASE_SCOPE=appstore npm run release:env-check`.

## 8. Release assets

Before TestFlight:

- final NEVER app icon created and configured in `app.json`,
- icon source file committed to the repository,
- icon visually checked on light and dark Home Screen backgrounds,
- native launch experience visually accepted,
- no legacy ONE brand visible in app icon, launch UI or system permission copy.

Run:

```bash
npm run release:asset-check
```

The check is expected to fail until the final app icon is actually configured.

## 9. Submission gates

### TestFlight gate

- `npm run quality` passes.
- `npm run release:env-check` passes against the TestFlight environment.
- `npm run release:asset-check` passes.
- `npm run release:privacy-check -- /path/to/NEVER.xcarchive` finds the generated privacy manifests and manual Required-Reason review is complete.
- critical real-device matrix passes.
- visual iPhone/iPad acceptance passes.
- production-like Supabase auth redirects/email flows verified.
- no development-only diagnostics visible in the submitted build.

### App Store gate

Everything above, plus:

- real billing/restore flows pass,
- privacy policy/support URLs are public and final,
- App Privacy questionnaire matches actual production behavior,
- no unresolved privacy-manifest/Required-Reason warning remains for the submitted archive,
- screenshots uploaded for iPhone and iPad,
- review contact + review account supplied,
- age rating/category/content-rights/DSA and other required App Store Connect fields completed,
- final release notes and release settings reviewed.

## 10. Current hard blockers owned outside repository code

- Paid Apple Developer/App Store Connect configuration and signing.
- Final public legal/support URLs and published content.
- Final NEVER app icon/launch asset.
- Privacy-manifest/Required-Reason verification on the real production-like iOS archive.
- Production RevenueCat/App Store products if paid access is included.
- Final App Store screenshots after accepted iPhone/iPad layouts.
- Review contact and, if required, dedicated review-account credentials.
