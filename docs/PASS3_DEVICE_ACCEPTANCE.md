# Pass 3 device acceptance preparation

29 September 2026 · branch `design/never-material-worlds` · PR #4
Baseline: `d20c4601e689bc16b6b2066882ce1e651c953015`.

**READY FOR PHYSICAL IPHONE VISUAL ACCEPTANCE**

This Linux environment has no connected iPhone or iOS simulator. No after-build
physical screenshots were captured or reviewed. Native layout geometry and
component render checks are evidence of readiness, not physical-device acceptance.

## Locked canon

IMG_2826 and HomePass3 at `3e1294311dd38dba9a06011ebd8191792759aee6` remain
canonical. The reference was visually inspected again. Wordmark, YOUR MEMORY,
editorial greeting, original subtitle, large Recall hero, standalone capture,
Scan / Link / Share, Today, Recent memory and floating navigation remain in order.

The greeting remains native regular 42/44 (34/39 on compact/large-text layouts),
with the existing 8-point eyebrow and 12-point subtitle offsets. The hero retains
22-point padding, 26-point corners, minimum height 224, 28/31 title and original
copy. It grows with text. Capture retains its 58-point minimum capsule and
44-point actions. Negative space, graphite save controls and blue recall/selection
are unchanged. No global opacity, blur, artwork, theme ID or tint changed.

## Precise adjustments

| File | Adjustment and reason |
| --- | --- |
| src/screens/HomeV5.tsx | See All now has a real 44×44 minimum layout target; hitSlop alone could be constrained by its small parent. Shortcut columns retain equal 44-point widths and allow label/row wrapping for enlarged text. Saving indicator has an accessible name and busy state. |
| src/screens/SearchV5.tsx | Clear recent searches receives a real 44×44 minimum target. Input-first hierarchy, filters, independent result surfaces and all search behavior remain unchanged. |
| app/(tabs)/_layout.tsx | Selected icon well uses a true 42×30 capsule with radius 15, matching the reference more closely. Labels are constrained to their tab width. Blue selection, 52-point minimum tab targets, material, placement and keyboard listeners remain unchanged. |
| tests/foreground-render.test.mjs | Production Home/Search/Calendar render matrix expanded to zero/one/30 memories, long title/body, exact requested portrait sizes and large fontScale inputs. Populated agenda and active search query now covered. |
| tests/pass3-device-readiness.test.mjs | Capture processing/error and Search Ask loading/error presentations; retained draft/query; native accessibility props; five tabs and selected semantics at portrait/landscape widths. |
| docs/PASS3_DEVICE_ACCEPTANCE.md | This acceptance record and device procedure. |

All event handlers, providers, routing, persistence, OCR, billing, authentication,
cloud, intelligence, item models and personal-team build files remain unchanged.
Calendar receives no production changes after its audit. All six PNG files and
ThemeBackdrop/NeverScreen are byte-for-byte unchanged from the baseline.

## Checks and evidence

- Focused set: 68 passing checks (foreground, device-readiness, themes, preview,
  material contrast, backdrop hierarchy and assets).
- Render matrix: all six worlds; 320×568/scale 2, 375×812/scale 1,
  390×844/scales 1 and 2, 428×926/scale 1, 430×932/scale 2. Scale here means
  the mocked fontScale input; React DOM does not simulate native Dynamic Type.
- Processing/error tests inject presentation state into actual components. They
  verify visible feedback and retained draft/query, not real backend execution.
- Native Yoga C++ backdrop check passes 375×812, 390×844, 428×926, 430×932,
  plus 320×568, 926×428 and 156×280. Corrected artwork fills both axes at zero
  origin; the old intrinsic-size failure remains reproduced by the regression.
- Navigation test inspects production native props and minimum target heights;
  available five-tab widths remain above 44 points. It is not a UIKit layout test.
- ESLint, web export, 52 literal navigation targets / 26 routes, native release
  verification and Expo introspection pass. Store assets and release-script
  syntax checks pass, with the existing missing explicit splash-image warning.
- Full Node suite: 167 pass, five baseline failing suites. Baseline: 138 pass,
  the same five failures. Failures are extensionless intelligence-module imports
  in capture-enrichment, core-workflows, design-foundation,
  po003-recall-search-share and universal-capture.
- TypeScript: 82 diagnostics, identical to this pass's exact d20c460 baseline.
  Existing intelligence test globals and recovery processingStatus typing remain.
- React review: no new hooks, network work, handlers, component remount patterns,
  dependencies or data behavior. Reduce Motion/Transparency paths retained.

## Personal Apple Team workflow

Both production and `NEVER_LOCAL_DEVICE_TEST=1` Expo introspection were checked.
Production retains Push Notifications and App Groups. Personal mode excludes the
notification/share plugins. Expo still emits aps-environment in introspection;
the existing clean script's post-prebuild stripper is therefore necessary.
That unchanged stripper was exercised in an isolated temporary ios directory
using the actual personal-mode entitlement output and representative capability
records. Unsupported capability markers were removed. No production config edited.
This does not verify signing, provisioning, Xcode compilation or device install.

From the existing ONE repository directory on the Mac, with the iPhone connected
and unlocked:

```sh
git fetch origin &&
git switch design/never-material-worlds &&
git pull --ff-only origin design/never-material-worlds &&
npm ci &&
NEVER_LOCAL_DEVICE_TEST=1 npm run ios:device:test:clean
```

The package script expands to:

```sh
NEVER_LOCAL_DEVICE_TEST=1 expo prebuild --clean --platform ios &&
node scripts/strip-personal-team-ios-capabilities.mjs &&
NEVER_LOCAL_DEVICE_TEST=1 expo run:ios --device
```

Select the connected LR iPhone. The clean prebuild regenerates ios/. A Personal
Team build intentionally cannot accept production Push/App Group capabilities;
production push and system Share Extension acceptance require the production team.

## Remaining device acceptance

No claim that native text cannot clip or that all glass/background contrast is
accepted until fresh physical screenshots and interaction results are reviewed.

1. At 375×812, 390×844, 428×926 and 430×932 where devices are available, capture
   Home/Search/Calendar under all six worlds; compare Home with IMG_2826.
2. Confirm artwork reaches every edge behind status bar, scroll and navigation;
   rotate to landscape and check side safe areas and home indicator clearance.
3. Open/close the keyboard in capture and search. Confirm tab bar hides/returns,
   draft/query survives and the focused field stays visible while scrolling.
4. Exercise zero/one/many memories, very long titles/body, capture processing,
   save failure/retry, populated/no-match search and populated/empty agenda.
5. Check largest Dynamic Type, VoiceOver labels/selected tab, Reduce Transparency
   and Reduce Motion. Verify shortcut labels and navigation labels remain usable.
6. Inspect bare heading contrast while scrolling through each artwork and native
   glass over its brightest/darkest areas. Token contrast tests cannot certify
   composited native glass or text shadows against arbitrary artwork regions.

Other known limits: approved source crops remain 336×744; the pass preserves them.
The five Node suite failures, 82 TypeScript diagnostics and splash warning above
are still open. No merge, deployment or production-release acceptance is implied.
