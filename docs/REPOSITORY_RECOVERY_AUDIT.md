# ONE — Repository Recovery & Audit

Date: 2026-09-14

## Recovery result

The ONE application was not lost. The default `main` branch remains the initial baseline, while the complete active application is stored on `dev/foundation`.

Verified pre-audit remote HEAD:

`c8f37793f0f5d4aa91f7cafb4d3dfa498e3230bf`

This branch contains the Expo/React Native application source, routing, native share configuration, Supabase integration and migrations, tests, release scripts, documentation, `.env.example`, `.gitignore`, and CI quality workflow.

## Technical foundation

- Expo SDK 57 / React Native 0.86.3
- React 19.2.3
- TypeScript 6
- Expo Router with typed routes
- AsyncStorage local persistence
- Supabase JS client and committed database/storage migrations
- Supabase Auth/cloud synchronization architecture
- native Share-to-ONE intake via `expo-sharing`
- on-device OCR via `expo-ocr-kit`
- local notifications via `expo-notifications`
- RevenueCat client dependency for subscription plumbing
- automatic light/dark UI mode with explicit appearance settings
- EAS development-build configuration
- GitHub Actions quality gate

## User-facing routes present

- Home / Inbox
- Calendar
- Saved
- Settings
- Ask ONE
- Share intake
- Share handling
- Scan
- Inbox item detail
- Saved item detail/edit
- Onboarding
- Auth callback
- Password reset
- Appearance settings
- Notification settings
- Privacy settings
- Upgrade
- Native development verification route

## Feature audit

Status below distinguishes code-level implementation from physical-device acceptance.

| Area | Status |
| --- | --- |
| Home | WORKING at code level |
| Inbox / Capture | WORKING at code level |
| Share into ONE | WORKING at code level; physical iOS acceptance pending |
| Manual text capture | WORKING at code level |
| Image capture | WORKING at code level; physical permission/device acceptance pending |
| Screenshot capture | WORKING at code level; physical OCR acceptance pending |
| Link capture | WORKING at code level |
| Email/text interpretation | WORKING at parser/classification layer; real-world Mail share acceptance pending |
| Automatic classification | WORKING at code level |
| Folders / collections | PARTIAL — saved/context organization exists; full generalized folders UX is not treated as complete |
| Search | WORKING at code level |
| AI chat / Ask ONE | WORKING at code level |
| Semantic retrieval | WORKING at code level and grounded in stored accessible items |
| Reminders | WORKING at code level; real notification delivery/tap acceptance pending |
| Calendar/event extraction | WORKING at code level |
| Supabase persistence | WORKING architecture/migrations present; production project configuration still environment-dependent |
| Authentication | WORKING architecture present; on-device auth-link acceptance pending |
| Settings | WORKING at code level |
| Light/Dark Mode | WORKING at code/config level |
| iPhone layout | PARTIAL — implementation exists; physical small/large iPhone acceptance pending |
| iPad layout | PARTIAL — tablet support enabled; physical iPad acceptance pending |

## Verification model

The repository quality command is:

`npm run quality`

It includes:

1. TypeScript (`tsc --noEmit`)
2. Expo lint
3. Node tests
4. Expo dependency compatibility check
5. Expo Doctor
6. native release configuration verification
7. Expo native config introspection
8. web export

GitHub Actions runs the quality command on pushes to `dev/foundation` and verifies the checkout is clean afterwards.

## Secrets / exclusions

`.gitignore` excludes `.env`, `.env.*` (except `.env.example`), `node_modules`, Expo/build outputs and common local artifacts.

No API secret, Supabase service-role key, access token, build cache or `node_modules` should be committed.

## Native acceptance still required

CI is not a substitute for physical-device testing. Remaining native acceptance includes Share Extension visibility/handoff, Apple Vision OCR, permission recovery, notification delivery/taps, auth deep links, force-quit session restoration, real offline/reconnect behavior, iPhone safe-area/keyboard behavior and iPad layout.

## Recovery conclusion

The canonical development branch remains `dev/foundation`; creating a second foundation branch would duplicate an already valid active branch. No feature order is started by this recovery commit.
