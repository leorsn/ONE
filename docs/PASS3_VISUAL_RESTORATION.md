# Pass 3 visual restoration

28 September 2026 · `design/never-material-worlds` · PR #4

## Canon and scope

The supplied physical-iPhone IMG_2826 screenshot and historical
`src/screens/HomePass3.tsx` at `3e1294311dd38dba9a06011ebd8191792759aee6`
replace the rejected foreground direction in `FOREGROUND_NATIVE_POLISH.md`.
IMG_2852/2853/2850/2849 show the rejected Home, Search and Calendar plus the
exposed right/bottom canvas. These are reference images, not after-build captures.

Home restores the wordmark, YOUR MEMORY, regular editorial greeting and original
subtitle, large blue/graphite recall hero with the original copy, standalone
58-point capture capsule, Scan / Link / Share, Today and Recent memory. Pass 3
hero padding, typography, margins and shortcut arrangement guide the composition.
Newer capture review/save/error handling remains conditional and intact. Writing
notes remains available through the capture input. Primary save actions stay graphite.

Search retains input-first hierarchy and lightweight filters. Recent/results/source
rows have individual restrained material rather than one giant backing rectangle.
Empty results use environment-aware text. Calendar removes the oversized date,
metric and nested hero, retaining date navigation, month/day controls, Day/Week/Month
modes and agenda. Floating navigation restores the capsule and blue selected icon
well, preserving tab events, keyboard handling, labels and accessible touch targets.
No handlers, data models, providers, intelligence, auth or backend integrations were
reverted. The personal-team iPhone testing scripts remain unchanged.

## Full-screen background defect

React Native's installed `Image.ios.js` prepends the bundled image dimensions to
its style. `absoluteFill` alone did not override the explicit 336 × 744 dimensions:
Yoga therefore left the image at that size inside the 428 × 926 viewport. This
matches the supplied device screenshot's right and bottom exposed canvas.

ThemeBackdrop now explicitly sets both dimensions to 100%, retaining native cover
and clipping. NeverScreen places artwork outside the transparent SafeAreaView;
only content receives safe-area padding. No foreground masking layer was added.
The shared image sizing also applies to appearance previews and loading/error uses.

`npm run native:backdrop-check` compiles the actual Yoga C++ sources bundled with
React Native and uses the production image style plus source dimensions. Old and
corrected cases are exercised at 428×926, 320×568, 375×812, 390×844, 430×932,
926×428 and 156×280. All corrected cases fill the container, with zero left/top
origin offset. A render regression also checks that artwork is a sibling of the
transparent safe-area content. This verifies native layout geometry, not UIKit
rendering, native glass or physical-device visual acceptance.

## Material Worlds — unchanged

| World | Persisted theme ID | Existing asset |
| --- | --- | --- |
| Platinum / Dune | platinum | assets/material-worlds/platinum.png |
| Monolith | monolith | assets/material-worlds/monolith.png |
| Archive / Garden | archive | assets/material-worlds/archive.png |
| Aurora / Glass Horizon | aurora | assets/material-worlds/aurora.png |
| Canyon / Ember | tactile | assets/material-worlds/canyon.png |
| Tidal / Ice | orbit | assets/material-worlds/tidal.png |

No asset, theme registry, preference persistence or atmospheric tint changed.
Source crops are still 336×744; this pass corrects their layout, not source quality.

## Verification

- Home, Search and Calendar production render tests: six worlds, empty/populated
  data; restored hero/capture copy, shortcut presence/order and calendar controls.
- Theme previews, image cover/dimensions, material contrast, Reduce Transparency
  and safe-area hierarchy: included in 39 focused passing checks.
- Native Yoga backdrop regression: all seven sizes pass.
- ESLint, web export, 52 literal navigation targets / 26 routes, native release
  configuration and Expo introspection, store asset and release-script checks pass.
- Complete Node suite: 138 pass, five pre-existing module-resolution suite failures
  (capture-enrichment, core-workflows, design-foundation, po003-recall-search-share,
  universal-capture). The unchanged baseline fails the same five suites.
- TypeScript: 82 diagnostics, identical to the baseline: intelligence-test globals
  and recovery processingStatus typing. No new UI diagnostics.
- React review: no new conditional hooks, nested component definitions, dependencies,
  data requests or side effects. Existing event handlers and navigation retained.
- Background assets and protected capture/search/intelligence/provider/testing-fix
  paths have no diff. Whitespace validation passes.

Physical iPhone/simulator execution is unavailable here. The reference composition
was compared with the implementation, but fresh device screenshots, native glass,
scrolling text contrast, keyboard, VoiceOver and large Dynamic Type acceptance remain
open. Other routes inherit only the shared backdrop fix and existing primitives;
this pass does not claim new visual acceptance for auth, onboarding, Saved, Settings,
Appearance, Ask or detail/share. The store check retains its existing splash warning.

## Changed files

- `src/screens/HomeV5.tsx`, `SearchV5.tsx`, `CalendarV5.tsx`
- `src/ui/ThemeBackdrop.tsx`, `NeverScreen.tsx`, `MemoryRow.tsx`, `appleV5.tsx`, `material.tsx`
- `src/theme/tokens.ts`, `app/(tabs)/_layout.tsx`, `package.json`
- `scripts/verify-backdrop-native-layout.mjs`, `scripts/native-checks/backdrop-layout.cpp`
- `tests/foreground-render.test.mjs`, `tests/theme-render.test.mjs`
- `docs/PASS3_VISUAL_RESTORATION.md`, `NEVER_DESIGN_BIBLE.md`, `FOREGROUND_NATIVE_POLISH.md`
