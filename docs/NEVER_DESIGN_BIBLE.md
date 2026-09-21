# NEVER — Design foundation, pass 1

Status: canonical implementation specification, 21 September 2026.
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

## Color and material

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#E9EDF0` | `#191D22` |
| Content surface | `#F5F7F8` | `#242A31` |
| Elevated surface | `#FCFDFD` | `#303840` |
| Primary text | `#222930` | `#F1F4F6` |
| Secondary text | `#59636E` | `#B7C1CA` |
| Tertiary text | `#606A74` | `#A3AFBA` |
| Primary control | `#414D59` | `#DCE4EB` |
| On primary control | `#FAFCFD` | `#20272E` |
| Separator | `#CDD5DC` | `#404B56` |

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

Large titles and the Home greeting use the device's Georgia face (serif fallback
on Android/web), following the supplied concept. Utility text uses the native
system font. No downloaded font or font-loading gate is added.

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

- **Home:** wordmark/profile access, real greeting, capture composer and four
  existing capture actions, existing Ask entry, relevant Today entries, recent
  memories and real review items. Capture has pending, success and failure copy,
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
