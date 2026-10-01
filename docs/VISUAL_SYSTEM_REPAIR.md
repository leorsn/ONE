# Annotated iPhone visual repair — 29 September 2026

Branch: `design/never-material-worlds`. Baseline: `9100e4e2401fedd64d255ecf130a84fa6869c5cc`.

The latest annotated physical-iPhone references take precedence: green areas are preserved; red areas are repaired. The final Calendar reference supersedes the earlier sparse-calendar direction. Pass 3 Home composition remains the foreground canon.

## Changes

- Onboarding: keep all three example cards; replace the lower copy with shorter editorial text, a restrained 29/34 heading, narrower 15/22 body and deliberate inset spacing. Paging, completion and authentication routing remain intact.
- Home: preserve the large blue recall hero, greeting, section order and shortcuts. Integrate a circular graphite plus into the capture capsule. Today now uses the same thumbnail/title/metadata/chevron grammar as Recently captured; review status gets its own line instead of squeezing the title. Inbox routing remains intact.
- Search: retain search-first hierarchy and results. Shared filters use a quiet selected material with open inactive labels, retaining 44-point targets and horizontal scrolling. Shared rows truncate long titles at two lines and omit redundant plural category metadata.
- Calendar: consolidate large date, month/year, count, Today, month navigation, day strip and modes inside one central material surface. Agenda rows share MemoryRow; empty sections regain restrained surfaces. Existing date calculations and mode behavior remain intact.
- Saved: preserve search, categories and Library map. Match native editorial heading and subtitle typography to the other screens; inherit shared filter/row refinement.
- Settings: retain all groups and actions; align heading/subtitle typography and improve bare-background section/footer contrast.
- Backdrop: retain explicit full-width/full-height cover sizing outside safe areas. No sprite, stretch, blur or new dependency.

## Assets and remaining resolution limitation

All six PNGs were reconstructed with the built-in image generation/editing tool using their approved individual crops as references. These are newly rendered detail, not enlarged copies. Their actual dimensions are **853 × 1844**, replacing **336 × 744** (about 6.3 times as many pixels). The requested **1290 × 2796 minimum is not met**. Requests for 1440 × 3120 output did not change the tool's returned dimensions. No resampling was used to disguise this limitation. Full Retina fidelity remains an open deliverable and requires suitable source exports or higher-resolution generation.

| Display world | Persisted theme ID | Replaced path |
| --- | --- | --- |
| Platinum / Dune | platinum | assets/material-worlds/platinum.png |
| Monolith | monolith | assets/material-worlds/monolith.png |
| Archive / Garden | archive | assets/material-worlds/archive.png |
| Aurora / Glass Horizon | aurora | assets/material-worlds/aurora.png |
| Canyon / Ember | tactile | assets/material-worlds/canyon.png |
| Tidal / Ice | orbit | assets/material-worlds/tidal.png |

Generation direction: reconstruct each referenced composition at requested 1440 × 3120, with crisp surfaces, smooth transitions, calm text space, no text/UI/frame/noise. Per-world direction:

- Platinum: ivory/champagne translucent upper arc and flowing lower metallic dunes.
- Monolith: severe graphite/navy vertical stone mass, silver mist, deep mineral atmosphere.
- Archive: soft sage daylight, curved architecture left, foliage right and reflective floor.
- Aurora: blue/lilac/rose sky, translucent ribbons and glowing horizon reflection.
- Canyon: copper/terracotta curved stone and warm amber aperture.
- Tidal: cyan/aqua crystalline ice and cool reflective water in the lower quarter.

World selection, IDs, appearance previews and persistence still share the existing asset registry. New artwork needs physical-device acceptance for fidelity, crop, contrast and memory use.

## Validation

- `npm run lint`: pass.
- `npm run web:export`: pass, all six replacement assets bundled.
- `npm run routes:check`: pass, 51 literal targets against 26 route paths.
- `npm run native:release-check`: pass.
- `npm run native:config`: pass.
- `npm run native:backdrop-check`: pass, native Yoga geometry at compact/large iPhone, landscape and preview dimensions; explicit sizing fills both axes. This is geometry verification, not native screenshot acceptance.
- `node --experimental-strip-types --test tests/foreground-render.test.mjs`: 36/36 pass. Actual Home, Search, Calendar, Saved, Settings and Onboarding components render across six worlds and six viewport/content/font-scale cases with mocked native/provider boundaries. Does not verify actual Dynamic Type or touch interactions.
- `npm test`: 167 pass / 5 fail; the same five suites fail on the untouched baseline because of existing module-resolution problems.
- `npm run typecheck`: 82 diagnostics, identical to the untouched baseline. No added diagnostics.

No physical iPhone or simulator acceptance was performed in this environment. Auth, billing, cloud and intelligence were not retested end to end. Existing implementations and personal-team device configuration were preserved.

## Next physical iPhone test (on the Mac)

From the existing repository directory:

```sh
git fetch origin &&
git switch design/never-material-worlds &&
git pull --ff-only origin design/never-material-worlds &&
npm ci &&
NEVER_LOCAL_DEVICE_TEST=1 npm run ios:device:test:clean
```

For an already installed compatible development client, restart Metro after pulling:

```sh
NEVER_LOCAL_DEVICE_TEST=1 npx expo start --dev-client --clear
```

Inspect all six worlds edge-to-edge including status/tab bars, all three onboarding pages, long Today/Search titles and review status, Calendar Day/Week/Month and Today navigation, Saved Library map, Settings, and increased text size. Compare directly with the annotated references. Verify capture/scan/link/share, search, item opening and theme switching on device.
