# Final micro polish v2 — 30 September 2026

Base: `209f4ff81ca949ebbe5a86e3e989a7e909d81f48`, `design/never-material-worlds`.

Only two targets:

- Tidal Home uses Mist Cyan (`#B7DCE3`) for the recall hero, Ink Blue Grey (`#1F2B30`) text, Midnight Tide supporting ink/icon disc, Sea Glass (`#8CB8C2`, 96% fallback opacity) capture material with a Deep Aqua Slate edge, and Storm Teal (`#45636B`) shortcut discs with Soft White icons. Reduce Transparency uses solid Sea Glass. Palette activation is restricted to the existing `orbit` theme ID.
- System preview already used plain split light/dark panels in the base commit. Its remaining label colors are now independent neutral values, and explanatory copy no longer names Platinum/Monolith. No artwork is used by the System preview. The label, card dimensions, radio placement and app-icon section are preserved.

System still follows the device appearance using the existing runtime theme resolution. This request explicitly targets its preview; selection, persistence and entitlement behavior remain unchanged.

Approved Archive controls are unchanged. All artwork files, other worlds, premium previews, navigation, component hierarchy and spacing are unchanged. No dependency, effect or state was added.

Validation: 232/232 tests, TypeScript, ESLint, web export, routes and native release configuration pass. Existing render matrix covers all six worlds and System's preview test confirms zero artwork images. Contrast: hero 9.93:1, hero supporting text 6.78:1, shortcut icons 6.26:1; capture fallback text remains above 6:1 even composited over black. Native glass optical behavior still requires an iPhone check; no physical-device acceptance claimed.

To inspect in the installed development client:

```sh
cd ~/ONE &&
git fetch origin &&
git switch design/never-material-worlds &&
git pull --ff-only origin design/never-material-worlds &&
NEVER_LOCAL_DEVICE_TEST=1 npx expo start --dev-client --clear
```

Inspect Tidal Home (hero, typing/saving capture, shortcuts), Reduce Transparency on/off and System's split preview. Confirm Archive and the other approved worlds retain their prior appearance.
