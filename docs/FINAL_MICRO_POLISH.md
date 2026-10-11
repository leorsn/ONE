# Final micro polish — 30 September 2026

Base: current `design/never-material-worlds` at `89808e1`.

- System preview only: plain neutral light/dark miniatures with no artwork, gradients or glass. Existing card dimensions, labels, radio controls and selection/persistence stay intact. Runtime System resolution and entitlement logic are unchanged; this pass does not introduce paid-theme gating.
- Archive only: Home recall hero uses Deep Moss with Off White/Soft Bone text and a Sage Mist icon disc. Capture uses translucent Forest Slate with a Warm Sand edge and light text; Reduce Transparency uses solid Forest Slate. Scan/Link/Share discs use Earth Bark. The selected tab well uses the same moss accent. All layout, spacing and handlers remain intact.
- Other worlds, all six artwork files, premium previews and theme definitions remain unchanged. Optional native glass tint is supplied only for Archive's Home capture surface.

Validation: TypeScript, ESLint, all 232 tests, web export, 51 literal navigation targets/26 routes and native release configuration pass. Updated System-preview render check verifies that it loads no artwork. Hero text contrast is 5.47:1, secondary hero text 4.85:1, shortcut icons 8.11:1; capture text against the fallback composited over white is 5.33:1. Native glass optical contrast still needs device inspection. No physical-device acceptance claimed.

The capture fallback uses 88% opacity to keep off-white text readable over bright artwork; the requested 72% was an example rather than a fixed requirement. React component review: no added effects/state/listeners, no new dependency, accessibility and existing interaction semantics retained.

For the installed development client, pull this branch and restart Metro:

```sh
cd ~/ONE &&
git fetch origin &&
git switch design/never-material-worlds &&
git pull --ff-only origin design/never-material-worlds &&
NEVER_LOCAL_DEVICE_TEST=1 npx expo start --dev-client --clear
```

Inspect System's light/dark preview; Archive Home hero, capture (idle/typing/saving), shortcuts and selected tab; confirm the other five worlds are unchanged. Check Reduce Transparency on/off. No native dependency or build-configuration change was made.
