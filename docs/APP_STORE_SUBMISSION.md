# NEVER — App Store Submission Dossier

Last reviewed: 2026-09-30

This is the working source of truth for TestFlight/App Store preparation. It separates repository-ready material from values and evidence that still must be supplied in Apple/production services.

## 1. Final app identity

- **App name:** NEVER
- **Expo slug:** `never-app`
- **URL scheme:** `never`
- **Bundle ID:** `app.never.mobile`
- **Share Extension bundle ID:** `app.never.mobile.ShareExtension`
- **App Group:** `group.app.never.mobile`
- **Current app version:** `0.1.0`
- **Production build number:** auto-incremented by EAS
- **Primary category — draft:** Productivity
- **Secondary category — draft:** Utilities

The old ONE technical namespace is retired from the public launch candidate.

## 2. Store metadata

The current copy source is `docs/APP_STORE_METADATA_DRAFT.md`.

Core positioning:

**Name:** NEVER

**Subtitle draft:** Your private memory

NEVER is a private memory app for capturing notes, screenshots, documents, reminders, links and useful context, then finding them again through search and optional grounded AI recall.

Before submission confirm:

- App name and subtitle are available in App Store Connect.
- Description and keywords match the final feature set.
- Copyright uses the actual rights holder/legal entity.
- No unsupported claims are introduced into Store copy.

## 3. Public URLs

The build reads:

- Privacy Policy: `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- Terms: `EXPO_PUBLIC_TERMS_URL`
- Support: `EXPO_PUBLIC_SUPPORT_URL`

Requirements:

1. HTTPS only.
2. No placeholders.
3. Privacy and Support resolve publicly without login.
4. The same production URLs are entered in App Store Connect.
5. Terms and Privacy are available from the subscription surface.

## 4. Screenshot plan

The repository supports both iPhone and iPad.

### iPhone story

Target 6 strong screenshots:

1. Home / Today
2. Universal capture / Share
3. Saved memory / document detail
4. Search / Ask NEVER grounded recall
5. Calendar / reminders
6. Privacy / sync / account controls

### iPad

Target 3–5 screenshots demonstrating genuine tablet layout quality.

Rules:

- production-like demo data only;
- no real personal data;
- no diagnostics, secret/config values or beta-only surfaces;
- no clipped text or accidental permission alerts;
- final accepted design only.

## 5. App Review information

### Contact

**OPEN:** final App Review contact name, email and phone number.

### Review account

**OPEN:** dedicated review account if authentication is required in the submitted build.

Seed only realistic non-sensitive demo memories.

### Reviewer path

1. Sign in with supplied review credentials.
2. Open Home and Saved.
3. Use Search.
4. Use Ask NEVER if NEVER AI is enabled for review.
5. Use Scan for image/document import and OCR.
6. From Safari/Photos/Files, use Share Sheet → NEVER.
7. Test local reminders/notifications.
8. Open Settings → Privacy for public links/export/privacy controls.
9. Open Membership for purchase/restore/management behavior.
10. Open Settings → Account → Delete Account.

Important implementation notes:

- core cloud data is scoped to the authenticated Supabase user;
- incoming sharing uses `app.never.mobile.ShareExtension` + `group.app.never.mobile`;
- local notifications are used for reminder items;
- NEVER AI answers from bounded retrieved saved-memory context through authenticated server functions;
- deleting the NEVER account does not itself cancel an Apple subscription, and the app warns active subscribers accordingly.

## 6. Authentication review path

Production callbacks:

- `never://auth/callback`
- `never://auth/reset-password`

Before submission physically verify:

- email confirmation opens NEVER and establishes the session;
- password-reset email opens NEVER and allows password replacement;
- old `one://` links are not part of the current launch path.

## 7. App Privacy

The detailed launch inventory is maintained in:

`docs/APP_STORE_PRIVACY_DATA_INVENTORY.md`

The repository also declares the corresponding `ios.privacyManifests` configuration and validates it in CI.

Current conservative disclosure baseline includes:

- Email Address
- Other User Content
- Photos or Videos
- Purchase History
- User ID
- Search History
- Tracking: No

Third-party/service paths include Supabase, RevenueCat and OpenAI through authenticated server-side functions where relevant.

Run the privacy contract and final archive checks before submission. Any new tracking, attribution, analytics, crash-reporting or ads SDK requires a deliberate privacy review rather than an incidental dependency change.

## 8. Subscriptions

### NEVER

- Product ID: `app.never.mobile.monthly`
- RevenueCat package: `never_monthly`
- Entitlement: `never`
- Level 2
- target €2.99/month
- 7-day introductory trial target

### NEVER AI

- Product ID: `app.never.mobile.ai.monthly`
- RevenueCat package: `never_ai_monthly`
- Entitlement: `never_ai`
- Level 1
- target €4.99/month
- no planned launch trial

Offering: `default`

Internal plan keys may remain `one` / `one_ai`; these are implementation details and not public Store identifiers.

See `docs/APP_STORE_REVENUECAT_PRODUCTION.md` for the exact external configuration contract.

## 9. Release assets

Before TestFlight/App Store submission:

- final NEVER icon remains configured and passes the asset gate;
- no legacy ONE brand appears in launch/system/permission surfaces;
- Share Sheet displays NEVER;
- screenshot sets are captured from the accepted build;
- archive privacy manifests are inspected.

## 10. TestFlight gate

From the exact candidate SHA:

```bash
npm ci --no-audit --no-fund
npm run quality
npm run release:testflight-check
```

Then verify the signed/TestFlight build against `docs/TESTFLIGHT_ACCEPTANCE_2026-09-30.md`.

Required external evidence includes:

- production Apple signing/capabilities;
- Supabase redirects and production backend deployment;
- RevenueCat/App Store product configuration;
- purchase + restore behavior;
- Share Extension/App Group handoff;
- notification behavior;
- auth/deep-link behavior;
- account deletion;
- iPhone/iPad acceptance.

## 11. App Store gate

Before submission:

```bash
npm run release:appstore-check
```

Everything from TestFlight must pass, plus:

- final public Privacy/Terms/Support URLs;
- App Privacy questionnaire aligned to production behavior;
- subscription localizations/prices/reviewer screenshots;
- final iPhone/iPad screenshots;
- review contact + review credentials;
- category, age rating, content rights and any required regional/compliance fields;
- no unresolved archive/privacy/signing warnings.

## 12. External blockers

Items that cannot be proven by repository CI alone:

- Apple Developer/App Store Connect registration for `app.never.mobile` and extension/App Group IDs;
- production EAS credentials/environment;
- production Supabase deployment + auth redirect allowlist;
- production RevenueCat/App Store subscription records;
- final published legal/support URLs;
- physical/TestFlight acceptance evidence;
- App Store screenshots and reviewer credentials.
