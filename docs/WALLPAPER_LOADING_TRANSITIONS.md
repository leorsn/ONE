# Wallpaper loading and transitions — 1 October 2026

Branch: `design/never-material-worlds`. Base: `b0647a19cdda6896ed7b1c69832cdf8d7aa178fc`.

## Findings

The previous `NeverScreen` mounted a separate `ThemeBackdrop` per route. Its image used `key={theme.id}`; changing theme immediately removed the old native Image while the new image loaded. Basic/premium switching also conditionally removed the image. No preload or load-ready handoff existed. Root and navigator canvas colors changed immediately, making that gap visible.

The installed React Native iOS implementation (`Libraries/Image/RCTImageCache.mm`) limits individual decoded cache entries to 2 MiB and the cache total to 20 MiB. Each current wallpaper has about 6 MiB of source RGBA data. Its prefetch implementation requests a zero-size/stretched image, whereas rendering uses viewport-sized cover. A URL prefetch alone is not a reliable guarantee of a retained, correctly sized decoded bitmap here.

These are confirmed code-level loading/remount problems and explain a plausible flash/dip. No wallpaper scale animation was found. The precise physical-device deformation has not been profiled or reproduced in this environment; it must not be reported as conclusively diagnosed or accepted.

## Implementation

`WallpaperStage` is mounted once immediately beneath ThemeProvider, outside the loading/auth/subscription/navigation branches. It retains six full-screen native Images with static bundled sources for the application session. Mounting initiates native image loading/decoding; native `onLoad` marks each layer ready. Images are never replaced, re-keyed, or removed during theme/tab/route switching. This is resident native-image preloading, rather than an additional prefetch request that could decode the same asset twice. No new dependency or reduced-resolution asset is used.

Basic light/dark are two ready neutral color layers using the existing System theme colors, not image assets. Wallpaper identity includes `artwork === false`, so Basic cannot be confused with premium Platinum/Monolith even though their existing theme IDs share color semantics.

All layers use the same absolute-fill clipped root, explicit image width/height 100%, and cover. The six resident image views are warmed even when their parent opacity is zero. The active layer stays at opacity 1 until the incoming native Image is ready. Only the incoming layer animates from 0 to 1, using the native driver, 150 ms ease-out. No scale, layout, screen-opacity or navigation animation is added. Reduce Motion swaps ready layers without animation.

A small transition reducer keeps the latest request while a fade completes, skips superseded intermediate selections, ignores stale completion callbacks and retains the active wallpaper on load failure. Rapid taps do not tear down or restart the current fade. Readiness is not reset on selection. Once ready, a new selection needs no fetch/decode operation from this code. If a user selects an asset before initial warmup has completed, the old wallpaper stays visible until readiness; instantaneous cold decode is not claimed.

Routes and the Stack/Tab scene canvases become transparent so the single retained root wallpaper stays behind content, safe areas and navigation. Standalone `NeverScreen` rendering outside the stage keeps its existing fallback; appearance previews retain their existing implementation. Theme persistence, System resolution, navigation behavior, foreground palette tokens, styles and image files are unchanged. Context consumers still rerender when their theme colors change; screens are not remounted by theme keys.

## Validation

- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `npm test`: 253 pass, zero failures.
- Transition tests: delayed/out-of-order load, load failure, stale callbacks, latest-choice handling and 20 repeated Basic/Monolith/Tidal/Archive/System sequences.
- Render checks: one stage warms exactly six distinct images even with multiple route surfaces; all use cover, zero built-in fade and explicit 100% geometry. Existing System-basic and premium-preview checks pass.
- `npm run web:export`: pass.
- `npm run routes:check`: 51 literal targets / 26 route paths pass.
- `npm run native:release-check`: pass.
- `npm run native:backdrop-check`: pass; now checks the production resident stage and preview before native Yoga verification across seven viewport sizes.
- Assets, theme definitions, Archive/Tidal tokens, premium previews and screen foreground files have no diff from the base.

Physical iPhone verification: **not performed / acceptance pending**. Unit state sequences and React DOM rendering do not establish native timing, GPU behavior or actual peak memory. The six 853 × 1844 source RGBA images total about 36 MiB; native decode/resizing/GPU storage adds overhead. Check memory pressure, background/resume and orientation on the device. No quality reduction was made. A failed local image retains the last successfully visible wallpaper; no loading indicator or fallback world is shown during a switch.

## Changed files

- `app/_layout.tsx`: mount persistent stage, transparent loading/Stack canvas.
- `app/(tabs)/_layout.tsx`: transparent tab scenes; remove unneeded layout palette subscription.
- `src/ui/NeverScreen.tsx`: share root wallpaper, preserve standalone fallback.
- `src/ui/WallpaperStage.tsx`: resident local-image warming and opacity handoff.
- `src/theme/wallpaperTransition.ts`: ready/active/incoming/latest-request state.
- `tests/theme-render.test.mjs`: shared-stage and standalone geometry coverage.
- `tests/wallpaper-transition.test.mjs`: switching/race/failure/System coverage.
- `scripts/verify-backdrop-native-layout.mjs`: inspect resident geometry too.
- This report.

## Next physical iPhone verification

```sh
cd ~/ONE &&
git fetch origin &&
git switch design/never-material-worlds &&
git pull --ff-only origin design/never-material-worlds &&
NEVER_LOCAL_DEVICE_TEST=1 npx expo start --dev-client --clear
```

On the installed development client, repeat Basic light/dark → Monolith → Tidal → Archive → Basic and System → premium → System, including quick taps and returning immediately to Home. Switch iOS appearance while System is selected to check Basic light/dark. Repeat after cold launch and background/resume; inspect portrait/landscape and Reduce Motion. Record whether any flash, delayed replacement, resize, missing wallpaper or frame dip remains. Profile a device release build for final timing/memory acceptance; Metro development timing is not a release benchmark.
