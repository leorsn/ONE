# NEVER icon pipeline repair — 2026-09-23

Scope: replace the two supplied icon sources and harden their native generation on `design/never-material-worlds` / PR #4. No application UI, Material Worlds, native capability, dependency or bundle identifier changed. Generated iOS files are not committed.

## Files changed

- `assets/icons/never-nature.png`
- `assets/icons/never-wordmark.png`
- `plugins/with-never-app-icons.js`
- `scripts/png-integrity.mjs`
- `tests/icon-pipeline.test.mjs`
- `docs/MATERIAL_WORLDS.md`
- `docs/ICON_PIPELINE_REPAIR.md`

## Source validation

Both replacements are byte-identical to the supplied uploads: actual PNG, 1024 × 1024, 8-bit RGB, opaque, fully decodable. PNG signature, IHDR, chunk CRCs, compressed pixel data and complete decoding pass. Pillow verify/load and Expo's actual jimp-compact decoder pass. Neither file is truncated or a mislabeled JPEG/WebP.

| Source | Bytes | SHA-256 |
| --- | ---: | --- |
| never-nature.png | 36140 | 206621e9ac5881e808bf5fbffc8f18d617bf8604a5439c07bdcb167db00cfee7 |
| never-wordmark.png | 36812 | e9d63670c9445d5794c28533f046b5ec2be8aea3eb59dc0c46602a1e8ce8526f |

`app.json` is unchanged: primary icon is `./assets/icons/never-nature.png`. The alternate plugin remains enabled. The plugin now validates source bytes before changing a good existing catalog, requires 1024 × 1024, and writes those same validated bytes. Invalid or missing inputs fail loudly. Regeneration removes the alternate catalog first, clearing stale images.

The generated Contents.json uses the same single universal iOS 1024 × 1024 schema as the installed Expo primary icon generator. Both application Debug and Release settings contain `ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES = "NeverWordmark"` and `ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS = YES`.

## Verification

| Check | Result |
| --- | --- |
| TypeScript / ESLint | PASS |
| Node tests | 173 PASS, 0 failures, 0 skipped |
| release:asset-check | PASS; existing optional splash-image warning remains |
| native:release-check / native:config | PASS |
| routes:check | PASS: 54 targets / 26 routes |
| Web export | PASS |
| iOS JavaScript/Hermes export | PASS; not an Xcode build |
| Clean iOS prebuild | PASS: `npx expo prebuild --clean --platform ios` |
| Repeat iOS prebuild | PASS after intentionally corrupting generated primary/alternate PNGs and adding a stale alternate PNG |
| Native module autolinking | NeverAppIcon resolves |
| CocoaPods / Xcode / physical iPhone | NOT RUN: Linux host lacks CocoaPods and Xcode |

Native generation was performed in an isolated copy of the repository inputs with installed dependencies. Repeated generation restored both catalogs to their exact original file/hash maps and removed stale content. Both generated images fully decode as 1024 × 1024 RGB. No Jimp/image processing errors remain. Expo skips pod installation on Linux; Podfile and Xcode project generation succeeded. Actual Xcode asset compilation, signing and installation require macOS.

App bundle `app.one.mobile`, Share Extension `app.one.mobile.ShareExtension`, App Group `group.app.one.mobile`, notifications and the alternate-icon native module are retained. Monolith, Aurora, Archive, Orbit, Tactile, Platinum and System are unchanged; their persistence/accessibility tests remain included in the passing suite.

## Physical iPhone on a Mac

Use the actual checkout path if it differs from `~/ONE`. First inspect `git status` and preserve uncommitted work. Clean prebuild regenerates ios; the backup below preserves existing ignored native files/signing edits for reference. Do not restore stale icons or remove capabilities to work around provisioning.

```sh
cd ~/ONE
git status
git fetch origin
git switch design/never-material-worlds
git pull --ff-only origin design/never-material-worlds
npm ci
npm run release:asset-check
if [ -d ios ]; then cp -R ios "../NEVER-ios-backup-$(date +%Y%m%d-%H%M%S)"; fi
npx expo prebuild --clean --platform ios
npx pod-install ios
npx expo run:ios --device
```

Connect/unlock/trust the iPhone and enable Developer Mode. If signing requires setup, open `ios/NEVER.xcworkspace`, select a suitable development team for NEVER and ShareExtension, retain App Groups/notification capabilities, select the connected iPhone and run. No Xcode/device build has been claimed by the Linux validation.

Review both app icons and every Material World, System appearance changes, persistence after restart, large text, VoiceOver, Reduce Transparency, Reduce Motion, keyboard forms and navigation. Those device visual/interaction checks remain outstanding.
