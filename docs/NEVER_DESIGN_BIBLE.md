# NEVER — Design foundation, pass 1

Status: implementation notes from 21 September 2026, amended 28 September 2026.

The user-supplied `NEVER_UI_Design_Bible(1).pdf` takes precedence over older
specifications below. The approved Image A Material Worlds supersede the older
background restrictions and theme explorations. See `APPROVED_MATERIAL_WORLDS.md`.
The latest user instruction supersedes the rejected foreground pass: the physical
IMG_2826 reference and HomePass3 at `3e1294311dd38dba9a06011ebd8191792759aee6`
are the foreground canon. See `PASS3_VISUAL_RESTORATION.md`. Restore the large
blue/graphite Ask hero, standalone capture capsule, three shortcuts and negative
space while retaining current functionality and the approved six Material Worlds.
The Pass 3 blue recall hero and selected navigation well are intentional exceptions
to older neutral-only guidance; routine primary actions remain graphite.
Home, Search and Calendar use native regular editorial headings (42/44 pt, 34/39
on compact layouts). Other shared controls retain the current design-bible tokens.
Backgrounds belong outside content safe areas and fill both axes explicitly.
The historical palette table below describes the original base tokens; active
material/contrast overrides live in `src/theme/editions.ts`.
Replaces the V5.3 palette and typography specification. The V5 screen/component
names remain compatibility entry points; they do not define a second design system.

## Intent and references

The supplied five-screen Light Mode NEVER board is the primary reference:
compact spaced wordmark, personal editorial greeting, platinum canvas, restrained
translucent capture control, clear content rows, and compact bottom navigation.
The second board contributes the quiet hierarchy of Monolith and Archive, not
Aurora's colored scenery, Orbit's space imagery, or Tactile's paper simulation.
No reference's example names, content, avatar, subscription status, or statistics
are inserted into the application. All content comes from existing providers.

Identity: platinum, silver, graphite; material and typography carry the brand.
No core blue accent, chrome gradients, neon, ornamental backgrounds, or grids of
unrelated dashboard cards. Readability is the first material constraint.

## Source of truth

| Concern | Canonical implementation |
| --- | --- |
| Light/dark semantic colors | `src/theme/colors.ts` |
| Type, spacing, radii | `src/theme/typography.ts` |
| Control, icon, material and motion dimensions | `src/theme/tokens.ts` |
| Native material and interaction | `src/ui/material.tsx` |
| Headers, groups, search, filters, row and icon controls | `src/ui/appleV5.tsx` |
| Memory content rows | `src/ui/MemoryRow.tsx` |
| Existing reusable action buttons | `src/ui/never.tsx` |

`useNeverV5Palette()` maps existing names onto `useTheme()`; it contains no color
literals. `NeverGlass` and legacy `Surface` now delegate to `NeverMaterial`.
Do not introduce per-screen theme palettes.

Palette synchronized with the preserved pass 1.5 baseline during pass 2.

## Color and material

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#E6E9EC` | `#11161B` |
| Content surface | `#F4F6F7` | `#1C232A` |
| Elevated surface | `#FCFDFD` | `#252E36` |
| Primary text | `#171D22` | `#F4F6F7` |
| Secondary text | `#5E6872` | `#B8C1C8` |
| Tertiary text | `#5F6A74` | `#8F9BA5` |
| Primary control | `#313B45` | `#DCE4EA` |
| On primary control | `#FBFCFD` | `#172028` |
| Separator | `#CDD4DA` | `#333E48` |

Opaque content groups use one subtle perimeter and inset row separators, without
individual row shadows. Native glass is limited to the capture composer, search
field, and floating navigation. On supported iOS builds these use Expo GlassView;
other platforms and unavailable native APIs use the shared material fallback.
Reduce Transparency selects opaque material. Native blur is controlled by iOS;
the 24-point blur token is reserved for future fallback renderers, not a simulated
iOS effect. Light/dark preference is passed explicitly to the glass view.

Shadows are shallow (opacity .09, radius 16, vertical offset 6), only on floating
controls. Material borders and subtle reflected edges replace visible gradients.
Text contrast tests cover primary/secondary/tertiary text on the three opaque
surfaces and the primary-action label. Translucent compositing still needs device QA.

## Typography and density

Current large titles and the Home greeting use the native system font. The older
Georgia exploration is superseded by the Pass 3 restoration. Utility text also
uses the native system font. No downloaded font or font-loading gate is added.

| Role | Size / line height | Weight |
| --- | --- | --- |
| Hero | 34 / 39 | Regular, editorial |
| Detail title | 32 / 37 | Regular, editorial |
| Section | 17 / 21 | Semibold, system |
| Memory title | 15 / 21 | Semibold, system |
| Body | 15 / 21 | Regular, system |
| Metadata | 12 / 16 | Medium, system |

Use the 4/8/12/16/20/24/32/40 spacing scale. Core screens use 20-point horizontal
insets and a 680-point maximum content width. Memory rows have a 76-point minimum,
46-point previews and two title lines; they grow with text. Primary icon buttons
and filters have a 44-point minimum. Search fields are 54 points minimum.
Tab icons are 21 points; text remains visible. Font scaling remains enabled.

## Core composition

- **Home:** wordmark/profile access, YOUR MEMORY eyebrow, real greeting and
  subtitle, large Ask hero, standalone capture bar, Scan / Link / Share, relevant
  Today entries, recent memories and conditional review items. Capture has pending, success and failure copy,
  with an immediate duplicate-submission guard. No invented suggestions.
- **Search:** editorial heading, material input, persistent type filters, category
  suggestions, real recent searches from this mounted session, results and the
  existing grounded/AI answer flow. Filters apply before retrieval limits so old
  documents remain discoverable. Recent searches are clearable and not persisted.
  Query edits and mode changes invalidate pending answer display.
- **Saved:** existing saved-item rules and document analytics, unified filters,
  real category grouping, shared content rows. Categories are existing metadata;
  this does not add a collection service or new storage schema.
- **Inbox:** explicit back/capture access, state labels and review actions. Inline
  actions stop propagation so a confirmation does not also open the row.
- **Detail:** original/source, editable memory content, organization, links,
  disclosed OCR text, state and actions. Done and Save Changes call the same save
  operation. The keyed form preserves in-progress edits across background sync;
  field components retain identity and keyboard focus while typing.
- **Shell:** the five existing tabs, floating material, selected icon well and
  labels; actual keyboard events hide the custom tab bar. Existing routes,
  deep links, notification entry points and native navigation remain intact.

## Interaction and accessibility

Use brief spring press feedback (damping 22, stiffness 320, mass .7) on shared icon
controls. Haptics must not block actions. Reduce Motion disables scale feedback
and stack animation. Use native stack transitions otherwise. Core editors/search
adjust scroll insets for the keyboard and allow interactive keyboard dismissal.
Actions need labels, filters need selected state, disclosures need expanded state.
No new gesture-only actions. Primary content remains accessible without glass.

## Pass 2 boundary

Do not revisit storage, auth, subscription or retrieval architecture for polish.
Validate and tune on iPhone first: material compositing, small and large Dynamic
Type, 320/390/430-point layouts, keyboard safe areas, reduced motion/transparency,
VoiceOver, long documents and real imported thumbnails. Then tune Calendar,
Settings, scan/share review and other secondary workflows using these foundations.

A web export is not evidence of native glass, keyboard, haptics or iOS build quality.
See `DESIGN_PASS_1.md` for completed gates and remaining device verification.

## Pass 2 implementation rules

Use `NeverInput` for editable controls to preserve native refs and unify focus,
selection and keyboard appearance. Define field/list components at module scope;
never recreate an input component type inside its parent render. Preserve raw
editing punctuation separately from normalized capture data where needed.

Use `NeverNavigation` for centered utility headers and `NeverSettingsSection` for
settings groups. `NeverNotice` provides real processing/error/retry feedback.
Memory/document/source lists share `MemoryRow`, including missing-thumbnail
fallbacks. Show full money values and wrap metadata before squeezing titles.

Haptics are best-effort and must never delay navigation or turn a successful save
into an error. Keep opaque groups free of transparency subscriptions. All screens
respect side safe areas because the app permits landscape. Details adapt for
small widths and large text; first-use and utility content must scroll.

See `DESIGN_PASS_2.md` for scope, verification and the remaining device acceptance.
