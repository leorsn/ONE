# ONE

ONE is a universal personal inbox for tasks, reminders, appointments, links, screenshots, ideas and later semantic recall.

## Product principle

Capture first. Organize automatically. Recall by asking ONE.

Examples:

- "Dentist Thursday 15:00" → appointment
- "Cancel Netflix on the 23rd" → reminder
- Share a screenshot with "Gift Dad" → saved in the relevant context
- Forward an appointment email → structured appointment
- Ask later: "When was the appointment and where?" or "Which ideas did I save for Dad's birthday?"

## Current status

Production Order 001 — Foundation

- Expo SDK 57
- React Native 0.86
- TypeScript
- Expo Router
- automatic system light/dark mode
- foundational Inbox / Calendar / Saved / Settings screens
- future-proof ONE item model including share-source and extracted-content fields

## Branch strategy

- `main`: stable
- `dev/foundation`: current development foundation

## Local development

```bash
npm install
npm run start
```

Node.js 22.13+ is recommended for Expo SDK 57.

## Cloud configuration

ONE runs fully in local/offline mode when Supabase environment variables are absent.

To enable accounts and cloud sync:

1. Create a dedicated Supabase project for ONE.
2. Apply `supabase/one_schema.sql`.
3. Set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Never place a Supabase secret/service-role key in the mobile app.

The schema enables Row Level Security and restricts each item to its owning authenticated user.
