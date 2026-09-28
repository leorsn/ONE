# Foreground hierarchy and native material pass

28 September 2026. Branch: `design/never-material-worlds`, existing PR #4.
Builds on `1e298245cb94cb9b7555ef598d1eb682ae912ae2`, preserving the personal-team
iOS build fix. No backend, data-provider, capture/search/recall logic, dependency,
Material World asset, registry, or backdrop changes.

## Physical-device reference review

Inspected the supplied IMG_2845.png (Aurora Home), IMG_2846.png (Platinum Home),
IMG_2848.jpeg (Archive Home), and IMG_2847.jpeg (Platinum Search). These document
the previous build, not this pass running on a device.

The dominant defects were four consecutive full-width surfaces before Home's
content, a large wordmark container, a nested capture input/hero and four square
action wells, separate Today cards, and Search's duplicated category dashboard.
The tab bar's opaque backing and dark selected icon well added more visual mass.

| Screenshot problem | Foreground correction |
| --- | --- |
| Wordmark and greeting each occupy a white card | Bare wordmark row and editorial greeting; no enclosing material |
| Capture dominates the screen | One input material, 52 pt composer plus 44 pt compact action toolbar; no metrics, inner card or action wells |
| Ask competes as another hero | Compact uncontained row, graphite glyph, title and supporting text |
| Today consists of separate cards | Single list group with row separators |
| Recent memories appear as tiles | Existing MemoryRow component in one group, preserving detail navigation |
| Search mode and counters precede the input | Editorial title and subordinate mode action, then input and filters |
| Explore repeats filter categories as cards | Duplicate dashboard removed; all four filters remain |
| Search recent content / prompts are grids | Recent content and suggestions use list/group presentation |
| Heavy selected tab and tall material | 54 pt minimum bar, 48 pt minimum tab targets, subtle selected tint and reduced shadow |

Shared large/section headers have no full-width white backing. The same heading
correction is applied to Saved, Calendar, Settings, Ask and Appearance. Loading
and onboarding wordmarks no longer sit in a standalone panel. Existing editing,
review, auth and modal surfaces remain where they provide meaningful grouping.

## Material and readability decisions

One light/dark UI system remains. List groups use approximately 78% fallback tint,
hero content 82%, inputs 85%, navigation 72% light / 80% dark, and modals 96%.
The hero role is a small addition to the existing material token contract.
Primary graphite action tokens are unchanged.

Supported native input/navigation glass no longer stacks the high-opacity fallback
under its own optical material: its backing is 8%, with 27% tint. Unsupported
platforms retain the readable fallback; Reduce Transparency restores opaque
surfaces. This native glass appearance still requires device acceptance.

Editorial environment text switches only foreground ink/soft localized shadow:
light ink on Monolith, Canyon, Archive and Tidal, dark ink on Platinum and Aurora.
It does not add a panel or alter the artwork. Contrast of these free-standing
headings across scrolling artwork is not certified by the fallback material test.
Shared fallback body, secondary and tertiary text meets 4.5:1 when composited
over black and white extremes; secondary colors were strengthened for thinner fills.

## Functionality and validation

Capture input, save/review state, Scan, Link, Note, Share, Ask, settings, Today,
recent details and review actions remain. Search query, filters, mode switch,
recent searches, retrieval/answer handling and error states remain. No callback,
provider or data-service logic was rewritten. Removed route literals belonged
to duplicated tile implementations; shared MemoryRow retains those destinations.

- 38 focused tests pass: existing theme/assets/render checks, native material
  backing regression, and 12 production Home/Search render checks across all six
  worlds with empty/populated storage, compact/large dimensions, large font
  configuration and reduced transparency. Providers/native-only modules are
  stubbed; these are not native layout screenshots or end-to-end interaction tests.
- Full Node suite: 137 pass, five existing failures from extensionless intelligence
  imports (capture-enrichment, core-workflows, design-foundation,
  po003-recall-search-share, universal-capture).
- TypeScript: the same 82 intelligence test-global/recovery diagnostics as the
  baseline. No UI diagnostics.
- ESLint, Expo web export, 52 literal navigation targets / 26 route paths, native
  release config, store assets, release-script syntax, and git whitespace check pass.
- Git comparison confirms assets, ThemeBackdrop, materialWorlds, and data modules
  unchanged. All existing Material World files retain their exact bytes.

No new physical-iPhone screenshot or native-glass acceptance is claimed. The
previous local browser attempt was environment-blocked; this pass uses supplied
device references and production component rendering. On-device follow-up should
check headings over each world while scrolling, native glass contrast, expanded
capture review, keyboard, large Dynamic Type, tab labels and search results.

## Files

Foreground: HomeV5, SearchV5, SavedV5, CalendarV5, AskV5, SettingsV5; shared appleV5,
neverVisual and utility components; edition materials and control dimensions;
tab/root layouts, onboarding and Appearance. Tests: theme-render, themes, shared
render helper, foreground-render. This report records the current foreground
rules and supersedes the local-header-card guidance in the earlier integration report.
