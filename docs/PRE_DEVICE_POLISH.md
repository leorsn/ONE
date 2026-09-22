# NEVER pre-device engineering and product polish

Date: 2026-09-22. Baseline: approved design/pass-2 tree, local commit `22df35a`; branch `quality/never-pre-device`. This is an incremental pass, not a replacement design.

## Implementation

The existing Expo Router / React Native application, Theme/Items/Auth/Plan providers, V5 compositions, platinum and graphite tokens, Supabase integration and RevenueCat integration remain in place. Existing primary destinations and product features are retained.

- Storage: malformed collections now stop hydration with a NEVER-styled retry state. Original bytes are retained rather than replaced with an empty collection. Older optional arrays normalize safely.
- Sync: delayed responses only replace the revision submitted to them. Collection refresh rebases over edits, additions and deletions made while requests are running; account changes invalidate local completion handlers. These guards do not make concurrent server writes transactional.
- Startup and billing: restoration failures release loading; foreground entitlement refresh retains mounted navigation and drafts. Stale refreshes and purchase/restore completions after account changes are ignored. Duplicate purchase actions are guarded.
- Capture/share: duplicate submission is guarded immediately; unresolved or missing attachment files cannot be saved as successful imports. Existing multi-file input is reviewed sequentially instead of discarding remaining payloads. Cleanup and dedup-marker failures no longer misreport a committed capture as a failed save. Interrupted batches still need device acceptance.
- Notifications: hydration and reconciliation check authorization without prompting. Explicit reminder saves can request permission. Invalid or past reminders do not trigger unnecessary prompts. Notification callback failures are caught.
- Navigation and recovery: utility back actions have a Home fallback; unknown routes and route errors use NEVER typography and colors. Memory links accept only HTTP(S), without embedded credentials. Native deep links reject malformed percent encoding, control characters and excessive length.
- Product details: calendar and Home refresh at local midnight / foreground; imported invalid dates are grouped safely. Appearance saves are serialized, disabled while pending and show errors. Late Ask responses are ignored after navigation away.
- Native module: added the missing local app-icon Podspec. Expo autolinking now resolves `NeverAppIcon`. Bundle identifiers, App Group, sharing activation rules and notification capabilities are preserved.
- Server: `interpret-one-capture` validates the bearer token with Supabase before model invocation; unsupported methods fail closed. Errors avoid upstream response disclosure. This change is source-only and has not been deployed.
- Diagnostics: raw error objects are not emitted to production console logs by the changed handlers.
- Dependencies: SDK 57 patch versions aligned with Expo, Reanimated 4.5.1 and Worklets 0.10.1 made explicit, existing ESLint tools declared reproducibly. No forced SDK downgrade.

## Verification

| Check | Result |
| --- | --- |
| TypeScript and ESLint | Passed |
| Node tests | 147 passed; none skipped or disabled |
| Literal navigation audit | 54 targets checked against 26 routes |
| Native release configuration | Passed; pinned expectations updated to installed SDK patches |
| Expo config introspection | Passed |
| Expo Doctor | 21/21 passed |
| Expo dependency check | Up to date (offline comparison; online Doctor also passed) |
| npm dependency tree | No invalid dependency errors |
| Web export | Passed |
| iOS Hermes JavaScript export | Passed; this is not a native iOS build |
| App-icon autolinking | Local module resolved with Podspec |
| Asset integrity | **Failed: two existing corrupt PNG sources** |
| Isolated iOS prebuild | **Failed: icon decoder `Unrecognised filter type - 93`** |
| Xcode build, signing, simulator, device | Not run: Linux host, no Xcode |
| Visual layout / VoiceOver / native materials | Requires simulator and physical-device review |
| Live backend / RLS / Edge Function / billing | Not run or deployed |

Tests include stale sync completions, concurrent collection changes, storage corruption, safe URLs, malformed deep links, invalid dates, sequential share selection, authenticated model invocation and corrupt image detection. The PNG test fixtures now contain actual encoded image data and checksums instead of header-only stubs.

## Native build blocker: original icon files required

Both checked-in PNGs are damaged. The GitHub pass-2 Nature blob matches the local blob; history has only the original addition, so there is no intact historical version in that branch to restore.

- `assets/icons/never-nature.png`: truncated image data; blob `1db832e1c61862d19950e69f05a899e385380e92`.
- `assets/icons/never-wordmark.png`: invalid PLTE checksum; blob `80b4f8ff0d814c3fe93887b5d7c341f7bde9fb75`.

The original artwork is preserved. Replace these with intact exports of the approved icons (opaque 1024×1024 PNG) before native prebuild. The asset check now verifies chunk checksums, compressed image data and non-interlaced pixel rows, so a plausible header can no longer hide this blocker. No fabricated icon or disabled plugin was used to obtain a green build.

## Security and dependency limits

`npm audit` reports 14 moderate affected dependency entries, from two underlying advisories; zero high/critical. This is not a clean security audit.

- GHSA-vcc3-ghjq-m6fr: `decode-uri-component` via Expo Router/query-string, malformed decoding denial of service. Native ingress validation reduces exposure in the app's handler but does not cover every router/web entry. Upstream major-version ESM changes are not safely interchangeable with the current CommonJS dependency; a supported upstream upgrade remains necessary.
- GHSA-w5hq-g745-h8pq: `uuid` optional output buffer bounds in v3/v5/v6 via Xcode tooling. The inspected Xcode generator calls v4; still tracked as an unresolved transitive advisory.

No `npm audit fix --force` or SDK downgrade was applied. Existing Supabase ownership policies and private attachment ownership paths were inspected in source, not validated against the deployed project. Session and local memory persistence still use AsyncStorage; this is not an encrypted vault. Secure-storage migration, live RLS validation, model endpoint deployment and backend rate limits need separate controlled acceptance.

## Mac commands

Run from the existing repository. Preserve any local edits before switching branches; do not use `git reset --hard` or `prebuild --clean`.

```sh
git fetch origin
git switch quality/never-pre-device
npm ci
npm run typecheck
npm run lint
npm test
npm run routes:check
npm run native:release-check
npm run release:asset-check
```

**Stop if the asset check fails.** Restore the two approved icon sources first. After it passes:

```sh
npx expo-doctor
npx expo prebuild --platform ios
npx pod-install ios
npx expo run:ios --device
```

For simulator acceptance use `npx expo run:ios` on the Mac. If signing needs configuration, open `ios/NEVER.xcworkspace` in Xcode, choose the correct development team for both app and Share Extension, and retain App Groups and notification capabilities. A personal/free team cannot substitute for supported provisioning of the full capability set. Do not remove working capabilities to bypass signing errors.

Production environment values, privacy/support URLs, billing setup and privacy manifests retain their existing dedicated release gates. No TestFlight upload, deployment, merge or App Store readiness claim is part of this pass.
