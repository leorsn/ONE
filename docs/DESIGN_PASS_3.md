# NEVER Design Pass 3 — Spatial Worlds

## Objective

Pass 3 evolves NEVER from a collection of glass cards into a personal information space. It preserves the existing Material World architecture, capture/recall behavior, accessibility contracts, and native integrations while tightening hierarchy, material restraint, and screen identity.

## Canonical designs

NEVER has exactly six user-facing design families. Pass 3 improves these six and must not introduce additional themes:

- **Basic** — classic minimal, system-aware black/white
- **Monolith** — graphite, architecture, dark metal and restrained chrome
- **Aurora** — flowing pearl, liquid light and subtle iridescence
- **Archive** — mineral stone, editorial structure and archival depth
- **Orbit** — deep space, orbital light and cool metallic accents
- **Tactile** — warm earth, organic material and softly physical surfaces

Names such as `Deep Space`, `Warm Earth`, `Stone Archive`, `Graphite Minimal`, `Classic White`, `Classic Black`, `Fog Depth` or `Light Flow` are internal asset/presentation variants only. They belong to one of the six designs and are never exposed as additional design choices.

## Principles

1. **World first, material second.** Background worlds provide atmosphere. Glass/material is reserved for interactive or semantically grouped surfaces.
2. **Content over containers.** Saved memories, events, results, and actions should read as information first and cards second.
3. **Six designs, one interaction system.** Geometry, contrast, chrome, atmosphere and density may vary by design, but navigation and interaction semantics remain stable.
4. **No fake raster UI.** Background/texture assets may be rasterized; controls, typography, lists, calendar, search, and navigation remain native React Native UI.
5. **Accessibility remains structural.** Reduce Transparency, Reduce Motion, Dynamic Type, minimum targets, contrast, and semantic roles remain first-class.

## Internal spatial assets

The visual system may use internal screen/asset variants such as platinum mountain, liquid chrome, mineral stone, light flow, fog depth, graphite, classic black/white, deep space, warm earth and ethereal light. These are resolved through the selected canonical design rather than through a second theme selector.

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
- Archive design uses mineral/editorial structure and remains distinct from warm Tactile.
- Selection and bulk actions use native semantic affordances.

## Calendar V6

Calendar prioritizes information density and actionability.

- Month/week navigation is compact.
- Selected dates use the active design accent rather than generic blue.
- Agenda items use separators and restrained material grouping.
- Event creation/editing remains native and readable under all six designs.

## Search V6

Search should feel immediate.

- Search field is the primary material surface.
- Results appear as content rows with only necessary grouping.
- Empty and no-result states may use dedicated illustration assets but never replace useful guidance.

## Settings V6

Settings uses the selected canonical design and provides the six-design selector.

- Prefer native grouped-list rhythm.
- Design previews remain visual but compact.
- Account, privacy, notifications, appearance, membership, and support remain clearly separated.
- Basic may resolve to classic white or black based on appearance/system mode; these are not separate themes.

## Capture

The center capture affordance opens a compact radial/sheet action set for Note, Link, Scan/Photo, and additional capture routes. It is a native control, not a raster asset.

## Navigation

Primary model:

`Home | Saved | Capture | Calendar | Search`

Ask NEVER remains accessible as a primary command surface and intelligence layer rather than requiring a permanent tab. Existing route compatibility must be preserved during migration.

## Asset contract

Raster assets are optional implementation details inside the six canonical designs. Missing imagery must gracefully fall back to existing design tokens/gradients. No required route may fail because an image is absent.

## Motion

Entry choreography is restrained: approximately 4–10 px translation plus opacity, staggered across major hierarchy layers. Respect Reduce Motion. Avoid bouncing cards and decorative perpetual motion.

## Acceptance gates

- Exactly six user-facing designs: Basic, Monolith, Aurora, Archive, Orbit, Tactile.
- No regression to capture, OCR, share import, search, recall, calendar, auth, sync, billing, or notifications.
- Existing theme tests remain green.
- Add coverage for design resolution/fallbacks and Pass 3 composition primitives.
- 44pt minimum targets retained.
- Reduce Transparency produces opaque semantic surfaces.
- Reduce Motion removes nonessential entry choreography.
- Every screen remains usable with all optional raster world assets absent.
- Physical iPhone acceptance remains required before merge/release.
