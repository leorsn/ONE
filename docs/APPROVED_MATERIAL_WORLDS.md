# Approved Material Worlds integration — 28 September 2026

Branch: `design/never-material-worlds`, existing PR #4.

## Canon and mapping

Primary source: Image A, `ChatGPT-Bild 28. Sept. 2026, 13_00_43-3.png`
(2048 × 748). Images B and C were inspected as support only. All shipped pixels
come from Image A. Each crop is 336 × 744, y=2, with dividers excluded. No
resampling, generation, recoloring or distortion was applied to the assets.

| World / display name | Stored ID | Asset under `assets/material-worlds/` | Crop x |
| --- | --- | --- | --- |
| Platinum / Dune | platinum | platinum.png | 2 |
| Monolith | monolith | monolith.png | 344 |
| Archive / Garden | archive | archive.png | 685 |
| Aurora / Glass Horizon | aurora | aurora.png | 1027 |
| Canyon / Ember | tactile | canyon.png | 1368 |
| Tidal / Ice | orbit | tidal.png | 1710 |

Existing stored IDs remain compatible; canyon/tidal aliases are also accepted.
System continues to follow device appearance: Platinum light / Monolith dark.
Archive now uses the light palette and sage artwork, distinct from Monolith.

## Implementation and readability

`materialWorlds.ts` statically registers six separate Metro assets. `ThemeBackdrop`
uses native Image cover sizing in a clipped container; no manual zoom, sprite
coordinates, blur or cross-panel sampling remain. Preview and page use the same
asset registry/component. Page tint is 8%; preview tint 2.5%. Actual cover crop
varies with viewport aspect ratio without changing image proportions.

Appearance offers named, accessible radio choices, selected check/border, real
portrait previews, existing persistence/rollback behavior, and compact/large-text
single-column fallback. No new dependency was added.

One neutral light/dark control system replaces per-world geometry. Card/input
surfaces have an 86% tint for local legibility; navigation 94%, modals 96%.
Native glass retains the same underlying legibility floor. Reduce Transparency
makes material surfaces opaque. Titles and navigation receive localized readable
surfaces, leaving the environment visible outside content. Primary buttons stay
graphite in every world. Native system heading hierarchy, 52 pt actions, 15 pt
input/action radii, 20 pt cards, 24 pt heroes and responsive 18/20/24 pt margins
follow the supplied PDF. No account, routing or data behavior was changed.

## Verification scope

Code paths reviewed: Home, Search, Saved, Calendar, Ask, Settings, Appearance,
onboarding, sign-in, callback, password recovery, Share, item detail/missing item,
tab navigation, startup loading, notices and route error recovery. These use the
shared backdrop/material contract; runtime/native interaction acceptance is not
claimed. Assets were visually inspected individually, and every output pixel was
compared against its exact Image A crop with Pillow.

- Theme suite: 25 passing tests, including production React/web component render,
  asset selection/cover props, six distinct PNG dimensions/hashes, stored selection,
  aliases, system mode, reduced transparency, focus and contrast.
- Body/secondary/tertiary text meets 4.5:1 on shared materials composited over both
  black and white extremes. This is token verification, not native-glass pixel testing.
- ESLint, routes check (54 literal targets / 26 paths), native release config,
  store asset check, release script syntax and Expo web export pass.
- Full Node suite: 124 pass, 5 pre-existing suite failures from extensionless
  intelligence-module imports. No tests were disabled. The obsolete sprite layout
  tests were replaced by asset and production cover-render checks.
- TypeScript: 82 existing diagnostics, identical to the comparison baseline;
  missing test-runner globals in intelligence tests and a recovery processingStatus
  type mismatch. No additional diagnostics in this integration.

## Remaining acceptance limits

The supplied sheet yields only 336 × 744 pixels per world. These are faithful
source crops, significantly better than the former 150 × 325 sprite tiles, but
are not Retina-resolution iPhone assets. Higher-resolution originals are still
needed for final asset quality acceptance; upscaling was not misrepresented as
new detail. Compact/large iPhone cover behavior relies on the native image layout
contract and still needs visual device inspection.

No iPhone simulator/device was available. Local browser navigation was blocked
by the browser environment (`ERR_BLOCKED_BY_CLIENT`), so there is no browser
screenshot or native acceptance claim. Auth callbacks, keyboard, scrolling,
Dynamic Type and native Liquid Glass need device acceptance. The existing store
check also notes that no explicit splash image is configured.

## Changed areas

Assets: six PNGs above. Theme: editions, materialWorlds, typography; removed
backgroundLayout and themeBackgroundSprite. UI: ThemeBackdrop, ThemePreview,
appleV5, material, never, neverVisual, NeverInput, NeverNotice, RouteError, utility.
Routes: root/tab layouts, onboarding, auth sign-in/callback/reset-password,
appearance, item detail. Screens: HomeV5, SearchV5, SavedV5, CalendarV5, AskV5,
SettingsV5. Tests: themes, theme-render, material-world-assets; removed obsolete
background-layout tests. Documentation: this report and NEVER_DESIGN_BIBLE.
