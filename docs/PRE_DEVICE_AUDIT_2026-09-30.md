# NEVER pre-device audit — 30 September 2026

Branch: `design/never-material-worlds`
Starting visual-repair head: `8483a50c2f7a69773f408b130ac9f4fec7e37ff0`

## Scope

This pass is deliberately pre-device. It does not replace physical iPhone acceptance and does not free-redesign approved screens. The 29 September annotated iPhone feedback remains the visual source of truth.

## Preserved canon

- Six Material World backgrounds and current ThemeBackdrop/NeverScreen integration.
- Current Home hierarchy: wordmark, editorial greeting, Recall hero, capture, Scan / Link / Share, Today, Recent memory.
- Current Calendar structure from the 29 September repair pass.
- Capture, OCR, persistence, authentication, billing, search, routing and cloud behavior.

## Findings

### 1. Material shell geometry

`NeverMaterial` previously used its shape radius for the outer shell while texture overlays continued to use the raw material radius. Native glass also used JSX `pointerEvents`. This could produce mismatched edge geometry on hero/capsule surfaces and inconsistent clipping/texture borders.

Fixed on the current branch:
- compute one effective rendered radius from explicit style, shape, or material defaults;
- use that same radius for shell, glass and texture overlays;
- keep shape support required by the current visual-repair branch;
- use style-based pointer-events for decorative native glass;
- add reflection-edge support only when the active Material World enables reflection;
- hide decorative overlays from accessibility traversal.

Commit: `c91b2ff335e38d4ceac355540f22a188867a25cb`.

### 2. Do not merge the old theme-polish branch wholesale

`design/never-theme-polish-pass` and the current visual-repair branch have diverged. The polish branch is 11 commits behind the current visual-repair head and contains older screen structure. A wholesale merge could regress the 29 September Home/Calendar repairs and locally-added/UHD background work.

Safe strategy: port only individual shared-component improvements after checking them against the current source.

### 3. Shared-control consistency still deserves a focused pass

The current shared V5 layer still contains some fixed radii and opacity-only press feedback. Candidate improvements before device acceptance:
- let shared card/input geometry inherit Material World radii where this does not alter approved screen structure;
- use semantic fill/border press states for secondary controls instead of opacity alone;
- keep every interactive target at least 44pt;
- preserve quiet transparent controls on artwork-heavy Home surfaces.

These changes should be performed selectively, not by copying the older branch.

### 4. Calendar

Current Calendar is structurally aligned with the latest repair direction and should not be replaced with the older theme-polish implementation. Remaining checks are primarily physical-device checks: composited contrast, safe areas, Dynamic Type, horizontal date-strip behavior and native glass/material appearance.

### 5. Known quality debt

The existing acceptance report records five baseline Node-suite failures and 82 TypeScript diagnostics. These predate the latest visual repair. The Node failures are associated with module-resolution/import paths in intelligence-related test graphs; this should be fixed separately from visual work so UI acceptance is not coupled to intelligence refactoring.

### 6. Release-environment gates

The release environment checker requires at least:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- `EXPO_PUBLIC_SUPPORT_URL`

App Store / paid builds additionally require:
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- `EXPO_PUBLIC_TERMS_URL`

Legal URLs can be finalized after the NEVER GbR details are fixed.

## Remaining pre-device work

1. Audit shared V5 controls against current code and port only non-regressive polish.
2. Audit Search, Saved, Settings, Onboarding and secondary flows for local hard-coded geometry/typography.
3. Keep background assets and current Home/Calendar composition untouched unless a code-level defect is proven.
4. Separate intelligence/test-resolution cleanup from visual acceptance.
5. When the Mac/iPhone are available, run the clean personal-team device workflow and perform physical acceptance under all six Material Worlds.

## Device acceptance remains mandatory

Physical testing must still verify keyboard transitions, safe areas, native glass/background contrast, long content, Dynamic Type, VoiceOver, Reduce Transparency, Reduce Motion, empty/populated states and all six backgrounds. No production release acceptance is claimed by this pre-device audit.
