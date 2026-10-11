# NEVER product polish — 28 September 2026

Target: existing PR #4, `design/never-material-worlds`.
Base reviewed: `cc1dcd73dc798c440045f31c5b6c7ae6f46aba9b`.
Work performed in an isolated checkout because the older local branch diverged from the active PR.

## Audit and implemented changes

The audit covered shared materials, input/buttons, typography, all six core screens,
root/tab navigation, onboarding/authentication, capture/share, inbox/detail,
appearance/notifications/privacy, upgrade and recovery routes at source level.
Train/Nutrition/Looks are absent from NEVER and were not added.

- Home, Search, Saved, Calendar, Ask and Settings now consume a shared responsive
  editorial title scale: 34/39 on compact widths or larger Dynamic Type, 40/45 otherwise.
  Section actions and metric groups wrap; normal font scaling remains enabled.
- Search and Saved lose an unnecessary outer card around their existing material
  input. Settings preferences use one native-style settings group instead of four tiles.
  Existing preference destinations, sync retry and account actions are retained.
- Eyebrows use quiet sentence case and larger type. Utility/status labels in detail,
  incoming share, share guidance, appearance, privacy, upgrade and callback screens
  are more readable. Tab labels grow to 11/14, can wrap and expose tab semantics.
- Search clear retains input focus. Explicitly surfaced inputs retain their complete
  focus border. Shared busy buttons keep their label/spinner contrast and prevent
  repeated presses; Home/Search use their busy state.
- Search invalidates outdated retrieval before calling the answer service, clears
  an old answer when a new request begins, and announces loading politely.
  Ask no longer shows an unconditional green live-status dot; answer provenance is
  sentence case. Semantic-search fallback copy is understandable.
- Calendar keeps its rolling seven-day strip and scrolls the active date into view
  on layout. Date labels announce existing plans; Today/selected-week labels are
  truthful and time badges can grow with text.
- Onboarding completion is guarded against repeated submissions and exposes busy
  state. Its sample memories are explicitly marked as examples.
- Callback/recovery screens no longer render raw provider errors or URL error text.
  Account-deletion exception copy offers a concrete recovery path.
- Deleted obsolete preference-tile component/styles and unused live indicator.

## Material Worlds: verified limitation

The committed JPEG sprite is **900 × 325**, containing six **150 × 325** panels.
Its bytes are unchanged. It contains no full-screen blur; low source resolution is
an inherent sharpness limit. New layout math covers each viewport using the panel's
actual aspect ratio instead of stretching it. Cropping stays within its own panel,
including phone landscape and appearance previews. No new generated artwork or
heavy rendering dependency was introduced. Subtle existing overlays remain.

High-resolution originals of these same six motifs are still needed for crisp
native backgrounds. This pass does not claim to restore detail absent from the file.

## Validation

- ESLint: passed.
- Web production export: passed.
- Navigation: 54 literal targets / 26 paths passed.
- Store assets: passed; existing missing explicit splash-image advisory remains.
- Native release configuration: passed (not an Xcode build).
- New background geometry tests: passed for 320×568, 390×844, 430×932,
  844×390 and 140×90 preview frames, all six worlds; zero-size layout checked.
- Existing component render tests for all six editions in both transparency modes
  and System: passed. These use React/web rendering with native capabilities stubbed.
- Whole test command: **124 pass, 5 failing suites**. On the unchanged base:
  **122 pass, the same 5 failing suites**. These fail to import extensionless
  Intelligence pipeline/retrieval modules before assertions run.
- TypeScript: **82 diagnostics, identical to the unchanged base; no new diagnostics**.
  Existing Intelligence tests reference unconfigured Jest globals; recovery.ts
  also widens processingStatus to string. Those independent failures remain.
- Diff whitespace check: passed.

## Remaining acceptance

Browser attempted to open the local exported app but returned ERR_BLOCKED_BY_CLIENT.
Therefore neither a browser screenshot review nor a physical iPhone/simulator review
was completed. The second review was of source/diffs, not rendered screen appearance.
Do not treat exports or component render tests as native visual acceptance.

Before release: resolve existing Intelligence type/test integration failures; supply
higher-resolution original Material Worlds; review all six editions on actual iPhone
including compact/large text, landscape, keyboard, Reduce Motion/Transparency and
VoiceOver. Exercise authenticated/cloud, OCR/share, billing, export and deletion
flows with an appropriate test account. No backend, data schema, native capabilities,
subscription entitlements, source images or storage identifiers were changed.

## Changed files

- `app/(tabs)/_layout.tsx`
- `app/auth/callback.tsx`
- `app/auth/reset-password.tsx`
- `app/handle-share.tsx`
- `app/item/[id].tsx`
- `app/onboarding.tsx`
- `app/settings/appearance.tsx`
- `app/settings/privacy.tsx`
- `app/share.tsx`
- `app/upgrade.tsx`
- `src/screens/AskV5.tsx`
- `src/screens/CalendarV5.tsx`
- `src/screens/HomeV5.tsx`
- `src/screens/SavedV5.tsx`
- `src/screens/SearchV5.tsx`
- `src/screens/SettingsV5.tsx`
- `src/ui/NeverInput.tsx`
- `src/ui/ThemeBackdrop.tsx`
- `src/ui/appleV5.tsx`
- `src/ui/never.tsx`
- `src/ui/neverVisual.tsx`
- `src/theme/backgroundLayout.ts`
- `tests/background-layout.test.mjs`
- `docs/FINAL_PRODUCT_POLISH.md`
