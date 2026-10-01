# NEVER — six material worlds

Implemented incrementally on `quality/never-pre-device`, which contains the existing pass-2 redesign and subsequent engineering fixes. Branch: `design/never-material-worlds`. No existing product flow, backend integration, native capability or account data format was replaced.

## Appearance architecture

`src/theme/editions.ts` extends the existing `OneTheme` color contract rather than introducing a competing screen-specific palette. It supplies the six named editions, complete semantic colors, card/input/navigation/modal materials, shadow values, radii, spacing, heading and wordmark treatments, and background effects. Existing `useTheme()` and V5 palette consumers receive the selected edition. Platinum retains the exact original light color tokens.

| Edition | Material behavior |
| --- | --- |
| Monolith | Near-black metal, narrow rounded black-glass surfaces, restrained reflections, chrome selection |
| Aurora | Pale atmospheric silver/blue/lavender, translucent inputs/navigation, softer 26-point surfaces and diffuse shadows |
| Archive | Ivory/stone, 8-point corners, opaque surfaces, no card shadows, squared chips and editorial spacing |
| Orbit | Midnight graphite, cool illuminated orb edge, translucent controls, circular icon wells and rounded surfaces |
| Tactile | Warm paper/stone, subtle procedural fibers, inset paper edges, 11-point corners and short physical shadows; no glass |
| Platinum | Existing cool platinum palette, restrained reflections and glass controls, quiet grouped lists |
| System | Resolves to Platinum in light appearance and Monolith in dark appearance |

`ThemeContext` owns selection and persistence. Fresh, invalid or unreadable preferences fall back to Platinum. Existing `light` and `dark` values migrate to Platinum and Monolith; existing System preferences remain System. The existing device storage key remains `@one/theme/v1`, independent of accounts. Selection updates immediately; disk writes are serialized, and a failed latest write restores the last committed selection. No theme-dependent navigation key or provider replacement is used.

Native appearance and keyboard/status-bar mode follow the selected edition. System removes the native override (`unspecified` in the installed React Native API). Reduce Transparency is observed once at provider level; native glass uses opaque fallback surfaces when enabled. No additional package or large image asset was added.

## Shared components and screen coverage

`NeverScreen` now provides the safe-area shell and `ThemeBackdrop` for every concrete route. The existing edges, keyboard avoidance and scrolling settings are retained. Backdrops are static geometry; Aurora and Orbit also use the installed React Native background-image API for subtle atmospheric gradients, with CSS gradients on web. No screenshots or mockups are used as application UI.

`NeverMaterial`, V5 headers/groups/search/segments/icon buttons, shared buttons, inputs, notices and manual core-card compositions consume semantic materials and geometry. Native system dialogs follow the selected light/dark mode; they remain native dialogs, not custom replicas.

Appearance now has six actual miniature material previews and a split System preview, descriptors, selection checks and accessible radio semantics. Labels scale; decorative miniature text does not. The grid becomes one column for narrow screens or larger text. Existing native app-icon switching remains separate and functional where supported.

Source-level route audit:

| Screens / states | Theme integration reviewed |
| --- | --- |
| Home, capture composer, recent/today cards | Screen background, hero, input, card geometry, typography, actions |
| Search, filters, Ask bridge/results | Background, search focus surface, segments, result materials |
| Calendar, day selection, agenda | Background, material header, selected contrast, agenda cards |
| Saved, document summaries/library | Background, grouped surfaces, card shapes and editorial titles |
| Settings, profile/membership/preferences | Background, profile surface, preference cards and current theme label |
| Ask, locked/loading/error/answer/composer | Background, hero surfaces, controls; request/data behavior unchanged |
| Inbox/list/review, Item Detail/edit/date controls | Background, grouped forms, title, sources/links and native dialogs |
| Scan, Share help, incoming-share review | Background, media/form surfaces and actions; import/OCR logic retained |
| Sign-in, reset, callback, onboarding, upgrade | Background, headings, forms, button geometry and native alerts |
| Appearance, notification/privacy preferences, diagnostics | Background, grouped controls and errors |
| Root loading/storage failure, missing route/item, route error | Selected palette; error boundary can use last resolved theme if providers fail |
| Tab navigation | Edition navigation material, icon geometry, selected labels and contrast |

There is no separate Connected Apps route in this repository. Existing settings behavior is retained; this pass does not invent an integration workflow. Literal hex/RGBA UI colors were removed from screen and shared-UI files; canonical colors/effects live in the registry. The original color exports remain for compatibility and regression tests.

## Validation and limits

Update 2026-09-23: the icon blocker is resolved; see [Icon pipeline repair](ICON_PIPELINE_REPAIR.md) for current native validation and device commands. The appearance-pass results below remain historical.

- TypeScript, ESLint and all 170 Node tests pass (147 existing plus 23 theme/material/render checks), with none disabled or skipped.
- Tests cover all selections, System mapping, legacy/invalid defaults, complete semantic tokens, contrast ≥4.5:1 for primary/secondary/tertiary text on principal opaque surfaces and action labels, actual storage round trips, read failure, and ordered writes recovering after failure.
- Navigation audit: 54 literal targets / 26 route paths; native configuration gate passes.
- Web export and iOS Hermes export pass. The latter is a JavaScript build, not an Xcode/native build.
- All listed screen groups were inspected in source. **No native simulator or physical-device visual/interaction acceptance was performed on this Linux host.** This is not a claim of pixel-perfect match or device validation. In particular, native glass/gradient rendering, system appearance transitions, accessibility and keyboard behavior require the checks below.
- The formerly corrupted icon sources have now been replaced with the supplied approved PNG exports. Clean and repeat iOS prebuilds pass. Native provisioning requirements for App Groups/notifications remain.
- The engineering pass's existing backend/dependency limitations still apply; this appearance change does not deploy an Edge Function or modify Supabase.

## Test on a physical iPhone

In the existing Mac repository, first inspect local work:

```sh
cd ~/ONE
git status
```

If local modifications are present, preserve them before switching. For example:

```sh
git stash push --include-untracked -m "Local iPhone setup before material worlds"
```

Do not blindly reapply old `app.json` edits that remove capabilities. Then:

```sh
git fetch origin
git switch design/never-material-worlds
git pull --ff-only origin design/never-material-worlds
npm ci
npm run typecheck
npm run lint
npm test
npm run routes:check
npm run native:release-check
npm run release:asset-check
```

The repaired icons pass the asset gate. After it passes locally:

```sh
npx expo prebuild --platform ios
npx pod-install ios
npx expo run:ios --device
```

Keep App Groups, Share Extension and notification capabilities. Configure a suitable development team for both targets in `ios/NEVER.xcworkspace` if required. Do not use `prebuild --clean` or reset the repository to hide local configuration differences.

On device open Settings → Appearance and test all six editions on Home, Search, Calendar, Saved and Settings, then the secondary screens listed above. Check System while changing iOS appearance, restart, logout/login, background/foreground, rapid selections, large text, VoiceOver, Reduce Transparency, Reduce Motion, keyboard-visible forms and scroll-heavy libraries. Confirm drafts/search/filter state survive appearance updates. Device status for every combination remains **NOT TESTED** until actually exercised.

## Changed files

- `app/(tabs)/_layout.tsx`
- `app/+not-found.tsx`
- `app/_layout.tsx`
- `app/auth/callback.tsx`
- `app/auth/reset-password.tsx`
- `app/auth/sign-in.tsx`
- `app/dev-native.tsx`
- `app/handle-share.tsx`
- `app/inbox/[id].tsx`
- `app/inbox/index.tsx`
- `app/item/[id].tsx`
- `app/onboarding.tsx`
- `app/scan.tsx`
- `app/settings/appearance.tsx`
- `app/settings/notifications.tsx`
- `app/settings/privacy.tsx`
- `app/share.tsx`
- `app/upgrade.tsx`
- `docs/MATERIAL_WORLDS.md`
- `src/context/ThemeContext.tsx`
- `src/screens/AskV5.tsx`
- `src/screens/CalendarV5.tsx`
- `src/screens/HomeV5.tsx`
- `src/screens/SavedV5.tsx`
- `src/screens/SearchV5.tsx`
- `src/screens/SettingsV5.tsx`
- `src/theme/editions.ts`
- `src/theme/preference.ts`
- `src/theme/useTheme.ts`
- `src/ui/NeverInput.tsx`
- `src/ui/NeverNotice.tsx`
- `src/ui/NeverScreen.tsx`
- `src/ui/RouteError.tsx`
- `src/ui/ThemeBackdrop.tsx`
- `src/ui/ThemePreview.tsx`
- `src/ui/appleV5.tsx`
- `src/ui/material.tsx`
- `src/ui/never.tsx`
- `src/ui/neverVisual.tsx`
- `src/ui/primitives.tsx`
- `tests/themes.test.mjs`

## Follow-up polish — 2026-09-23

- Search discovery/result/prompt tiles now use edition card geometry; Home quick actions and calendar controls use the same icon/selection shapes.
- Capture metrics and calendar date headers can wrap on narrow devices and at larger text sizes. Month navigation text can shrink/wrap between its fixed 44-point buttons. Selected-date counts no longer say “today” when another date is selected.
- Preview swatches reserve sufficient height for two-line headings, and selection outlines keep constant width to avoid layout movement.
- A single provider subscription now handles Reduce Motion for navigation, onboarding, Ask and press animations. Enabling it cancels an active press spring immediately.
- `resolveMaterialAppearance` centralizes focus, opaque accessibility fallback and native glass tint. Form fields respect Reduce Transparency as well as standalone material surfaces. Monolith and Orbit glass use distinct subtle tint tokens.
- Added production-component render smoke checks using React's web server renderer, with native-only capabilities explicitly stubbed. These assert all six previews/materials/fields and the System preview render, but do not establish native behavior, browser layout measurements or draft retention across a live switch.
- Verification: 170 tests pass; TypeScript, lint, navigation and native configuration checks pass. Web/iOS JavaScript exports pass. Xcode compilation and physical-device validation remain outstanding; the subsequent icon repair resolves native prebuild failures.

For a first appearance test using an **already installed compatible NEVER development client**, after checking out this branch and running `npm ci`:

```sh
npx expo start --dev-client --clear
```

Open the development server in the installed NEVER client on the iPhone. Both devices should be on the same network. This loads the JavaScript update; it does not validate a fresh native build or replace the full device acceptance checklist.
