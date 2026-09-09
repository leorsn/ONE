# ONE

ONE is a universal personal inbox and personal digital memory for tasks, reminders, appointments, links, screenshots, documents, ideas and semantic recall.

## Product principle

Capture first. Organize automatically. Recall by asking ONE.

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
- automatic + user-selectable light/dark mode
- onboarding
- Inbox
- Calendar
- Saved
- Settings
- Item detail/edit
- local reminders
- Supabase Auth + cloud sync
- native Share to ONE intake
- on-device screenshot OCR
- semantic Ask ONE recall
- private attachments
- GitHub Actions quality checks
- EAS development-build configuration

The current branch passes:

- TypeScript typecheck
- Expo dependency compatibility check
- Expo Doctor

## Product tiers

Planned:

- ONE — 2.99 EUR/month
- ONE AI — 4.99 EUR/month

See `docs/PRODUCT_STRATEGY.md` for the current product and monetization decisions.

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

ONE runs in local/offline mode when Supabase environment variables are absent.

To enable accounts and cloud sync:

1. Use the dedicated ONE Supabase project.
2. Apply the committed ONE migrations.
3. Set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Never place a Supabase secret/service-role key in the mobile app.

The schema enables Row Level Security and restricts each item to its owning authenticated user.

## Native share + OCR

ONE can receive shared text, URLs, screenshots and supported documents through the native share sheet.

Screenshot OCR runs on-device:

- iOS: Apple Vision
- Android: ML Kit

Because share receiving and OCR use native modules, test them with a development/native build rather than Expo Go.

Authenticated users store attachments privately in the `one-attachments` Supabase bucket with per-user RLS policies.
