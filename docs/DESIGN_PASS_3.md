# NEVER Design Pass 3 — Spatial Worlds

## Objective

Pass 3 evolves NEVER from a collection of glass cards into a personal information space. It preserves the existing Material World architecture, capture/recall behavior, accessibility contracts, and native integrations while tightening hierarchy, material restraint, and screen identity.

## Principles

1. **World first, material second.** Background worlds provide atmosphere. Glass/material is reserved for interactive or semantically grouped surfaces.
2. **Content over containers.** Saved memories, events, results, and actions should read as information first and cards second.
3. **One system, multiple worlds.** Geometry, contrast, chrome, and atmospheric treatment may vary by world, but navigation and interaction semantics remain stable.
4. **No fake raster UI.** Background/texture assets may be rasterized; controls, typography, lists, calendar, search, and navigation remain native React Native UI.
5. **Accessibility remains structural.** Reduce Transparency, Reduce Motion, Dynamic Type, minimum targets, contrast, and semantic roles remain first-class.

## World registry

The visual system must support the existing worlds plus Pass 3 presentation aliases:

- Platinum / Home — platinum mountain / neutral silver
- Aurora / Ask — liquid chrome / icy pearl
- Archive / Saved — mineral stone / cool graphite
- Orbit / Calendar — light-flow / deep-space variants
- Tactile / Nature — warm earth / sand
- Monolith / Settings — graphite minimal / classic black
- Clean — classic white
- Night — deep space
- City — urban reflections
- Abstract — ethereal light
- System — maps to the appropriate accessible light/dark world

The aliases are presentation choices, not a second theme engine.

## Shared composition

Every primary screen follows:

`WorldBackground -> Atmosphere -> Content -> InteractiveMaterial -> FloatingNavigation`

### Level 0 — World
Full-bleed visual identity. It must never contain baked-in UI or text.

### Level 1 — Atmosphere
Contrast/legibility treatment: scrim, blur, gradient, grain, or local vignette. It should be subtle and accessibility-aware.

### Level 2 — Content
Typography, memories, events, results, and labels. Prefer separators and whitespace over card shells.

### Level 3 — Interactive material
Inputs, buttons, selected controls, modals, sheets, and elements that need a tactile boundary.

### Level 4 — Navigation
Floating tab bar and capture affordance. Navigation must remain legible independent of the underlying world.

## Home V6

Home is not a dashboard. It is the entry point into the user's information space.

Order:

1. Compact NEVER/date utility header.
2. Large contextual greeting with no surrounding card.
3. Primary Ask NEVER command surface.
4. `CONTINUE` with at most three contextually useful items rendered as low-chrome rows.
5. `CAPTURE` with compact Note, Link, Scan and More actions.
6. Floating navigation.

Ask NEVER receives stronger visual priority than secondary shortcuts. Large generic dashboard cards are prohibited.

## Ask NEVER V6

Ask is the signature intelligence surface, not a generic chatbot.

- Keep the world visually open.
- Conversation chrome is minimal.
- User prompts and grounded answers use differentiated but restrained material roles.
- Source/memory references remain inspectable.
- The composer is the dominant interactive surface.
- Avoid AI gradients, robot iconography, neon glows, and decorative assistant avatars.

## Saved / Archive V6

Saved content behaves like a premium native library.

- Search and filters remain compact.
- Rows dominate; repeated large cards do not.
- Metadata hierarchy is explicit.
- Archive uses cooler mineral/graphite structure and must remain visibly distinct from warm Tactile/Nature.
- Selection and bulk actions use native semantic affordances.

## Calendar V6

Calendar prioritizes information density and actionability.

- Month/week navigation is compact.
- Selected dates use world accent rather than generic blue.
- Agenda items use separators and restrained material grouping.
- Event creation/editing remains native and readable under all worlds.

## Search V6

Search should feel immediate.

- Search field is the primary material surface.
- Results appear as content rows with only necessary grouping.
- Empty and no-result states may use dedicated illustration assets but never replace useful guidance.

## Settings V6

Settings uses the quietest visual world.

- Prefer native grouped-list rhythm.
- Material World previews remain visual but compact.
- Account, privacy, notifications, appearance, membership, and support remain clearly separated.
- Classic Black and Classic White are explicit visual options/aliases where compatible with the existing appearance model.

## Capture

The center capture affordance opens a compact radial/sheet action set for Note, Link, Scan/Photo, and additional capture routes. It is a native control, not a raster asset.

## Navigation

Primary model:

`Home | Saved | Capture | Calendar | Search`

Ask NEVER remains accessible as a primary command surface and intelligence layer rather than requiring a permanent tab. Existing route compatibility must be preserved during migration.

## Asset contract

Expected optional raster assets:

```
assets/worlds/
  home-platinum.*
  ask-liquid-chrome.*
  saved-stone-archive.*
  calendar-light-flow.*
  search-fog-depth.*
  settings-graphite.*
  classic-black.*
  classic-white.*
  night-deep-space.*
  nature-warm-earth.*
  city-reflections.*
  abstract-ethereal.*

assets/materials/
  platinum-noise.*
  chrome-reflection.*
  atmosphere-soft.*
  grain-subtle.*
```

Missing optional imagery must gracefully fall back to the existing token/gradient world. No required route may fail because an image is absent.

## Motion

Entry choreography is restrained: approximately 4–10 px translation plus opacity, staggered across major hierarchy layers. Respect Reduce Motion. Avoid bouncing cards and decorative perpetual motion.

## Acceptance gates

- No regression to capture, OCR, share import, search, recall, calendar, auth, sync, billing, or notifications.
- Existing theme tests remain green.
- Add coverage for world aliases/fallbacks and Pass 3 composition primitives.
- 44pt minimum targets retained.
- Reduce Transparency produces opaque semantic surfaces.
- Reduce Motion removes nonessential entry choreography.
- Every screen remains usable with all optional raster world assets absent.
- Physical iPhone acceptance remains required before merge/release.
