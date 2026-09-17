# NEVER

NEVER is a universal personal inbox and private digital memory for tasks, reminders, appointments, links, screenshots, documents, ideas and semantic recall.

## Product principle

Capture first. Organize automatically. Recall by asking NEVER.

Examples:

- "Dentist Thursday 15:00" → appointment
- "Cancel Netflix on the 23rd" → reminder
- Share a screenshot with "Gift Dad" → saved in the relevant context
- Forward an appointment email → structured appointment
- Scan a receipt → extract merchant, date, amount and category
- Ask later: "When was the appointment and where?" or "Which ideas did I save for Dad's birthday?"

## Current development status

Current active development branch: `dev/foundation`.

The branch currently contains:

- Expo SDK 57
- React Native 0.86.3
- TypeScript 6
- Expo Router
- premium platinum/chrome light + dark design system
- automatic + user-selectable light/dark mode
- onboarding
- Inbox
- Calendar
- Saved/Documents
- Search
- Settings
- Item detail/edit
- local reminders
- Supabase Auth + local-first cloud sync
- native Share to NEVER intake
- on-device screenshot/document OCR
- semantic Ask NEVER recall
- private attachments
- NEVER / NEVER AI subscription gating
- iPhone and iPad layout support
- GitHub Actions `NEVER Quality` checks
- EAS development/preview/production build profiles
- manual release environment and store-asset gates

The repository quality gate covers:

- TypeScript typecheck
- ESLint
- unit/regression tests
- Expo dependency compatibility
- Expo Doctor
- native release-config assertions
- generated Expo config introspection
- web export
- clean-checkout verification in CI

Run locally with:

```bash
npm run quality
```

## Product tiers

Planned consumer-visible tiers:

- NEVER — 7-day eligible introductory trial, then 2.99 EUR/month auto-renewing
- NEVER AI — 4.99 EUR/month auto-renewing, no trial

See `docs/PRODUCT_STRATEGY.md` and `docs/BILLING.md` for current product and monetization decisions.

## Technical compatibility identifiers

The consumer product is **NEVER / NEVER AI**. Several internal identifiers intentionally retain the original `one` naming to avoid unnecessary V1 migrations, including:

- iOS bundle identifier `app.one.mobile`
- URL scheme `one://`
- Share Extension/App Group identifiers
- selected Supabase function/schema names
- RevenueCat/StoreKit product and entitlement identifiers

Do not rename these purely for cosmetic consistency. Any migration should be treated as a separate compatibility change.

## Branch strategy

- `main`: stable baseline
- `dev/foundation`: current active development branch

If GitHub appears to show only the initial version, verify that the selected branch is `dev/foundation` rather than `main`.

## Local development

```bash
npm install
npm run start
```

Node.js 22+ is recommended.

## Cloud configuration

NEVER runs in local/offline mode when Supabase environment variables are absent.

To enable accounts and cloud sync:

1. Use the intended Supabase project.
2. Apply the committed migrations.
3. Set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Never place a Supabase secret/service-role key in the mobile app.

The schema enables Row Level Security and restricts each item to its owning authenticated user.

## Native share + OCR

NEVER can receive shared text, URLs, screenshots and supported documents through the native share sheet.

Screenshot/document OCR runs on-device where supported by the native OCR integration. Share receiving and OCR use native modules, so they must be accepted on a signed native build rather than inferred from Expo Go or web behavior.

Authenticated users store attachments privately in the legacy technical `one-attachments` Supabase bucket with per-user RLS policies.

## Release gates

Before promoting a TestFlight/App Store candidate:

```bash
npm run quality
npm run release:env-check
npm run release:asset-check
```

The manual release gates intentionally remain blocked until real production URLs/configuration and the final NEVER store icon/assets are supplied.

See:

- `docs/DEVICE_TEST_PLAN.md`
- `docs/NEVER_VISUAL_QA.md`
- `docs/V1_RELEASE_BLOCKERS.md`
- `docs/EXTERNAL_CONFIGURATION_CHECKLIST.md`
- `docs/APP_STORE_SUBMISSION.md`

for the current acceptance and submission state.
