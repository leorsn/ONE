# NEVER — Visual QA & Premium iPhone Acceptance

This document is the visual acceptance contract for NEVER. It complements `docs/NEVER_DESIGN_BIBLE.md` and the functional device test plan. A screen is not visually accepted because it merely works; it must feel coherent, native, restrained and premium on a real iPhone.

## 1. Design canon

`docs/NEVER_DESIGN_BIBLE.md` is the canonical visual specification. The approved NEVER App Store mockup campaign is the visual reference for atmosphere, hierarchy, platinum treatment, whitespace and restraint.

The core comparison question for every device screenshot is:

> Would this screen look natural inside the App Store campaign we approved?

NEVER should read as a private, high-end personal memory product — not as a template, dashboard generator or generic AI application.

### Palette
- Platinum, titanium, graphite, gunmetal and chrome are the primary visual language.
- Blue is not a brand color.
- Chrome is an accent, not a fill applied everywhere.
- Light mode should feel mineral and softly metallic rather than sterile white.
- Dark mode should feel black/graphite rather than navy.
- Success, warning and danger colors are functional only.

### Typography
- Prefer calm iOS-like editorial hierarchy over dashboard typography.
- Headlines should be confident but not excessively heavy.
- Avoid unnecessary all-caps except compact status/eyebrow labels.
- Body copy must remain readable at native device scale.
- No text should clip at standard Dynamic Type settings.

### Geometry
- Cards and controls use restrained radii; avoid excessive pill-shaped UI.
- Consistent horizontal screen margins.
- Repeated components must share the same radius, padding and border behavior.
- Hairline borders and subtle elevation are preferred over heavy shadows.

### Motion & haptics
- Motion should clarify state changes, never decorate them.
- Avoid bouncy or exaggerated transitions.
- Haptics should be light and purposeful for save, selection and confirmation.
- Loading states must not flash or jump between layouts.

## 2. Hardware review order

Run the following sequence on a real iPhone after pulling the latest `dev/foundation` branch.

### A. Launch / root loading
- Cold launch from terminated state.
- NEVER wordmark loader is centered, stable and visually quiet.
- No white or blue flash before the theme loads.
- Status bar matches light/dark mode.
- Transition from loader to destination has no layout jump.

### B. Onboarding
- Review all three slides in light and dark mode.
- CAPTURE, SHARE and RECALL product vignettes must feel like miniature NEVER interfaces, not abstract illustrations.
- The vignettes must match the platinum/card language used in the real app.
- Copy hierarchy remains readable without looking like a landing page.
- Swipe paging feels native and remains aligned after orientation/window-size changes.
- Active pagination indicator is visible but restrained.
- Final CTA is clearly primary without looking oversized.

### C. Authentication
- Sign in and create-account states.
- NEVER wordmark, editorial headline and form surface feel like the same product as onboarding.
- Keyboard does not cover the active field or CTA.
- Error messages are readable and not visually dominant.
- Password-reset and auth-callback states use the same design language.

### D. Inbox / Home
- This is the primary product-quality checkpoint.
- NEVER wordmark header and capture field establish the hierarchy immediately.
- Capture field must read as the main action.
- Scan / Share / Ask actions must not compete with capture.
- Today, Inbox, Upcoming and Saved sections have clear but calm hierarchy.
- Empty states look intentional rather than unfinished.
- Long titles and metadata truncate cleanly.
- Triage actions remain understandable without turning rows into button clusters.

### E. Manual capture & review
- Test a simple note, reminder, appointment and ambiguous capture.
- “Recognized and organized” / review state should feel like an intelligent assistant, not a form generator.
- Type options and destination controls remain restrained; selected states should use elevation/neutral contrast rather than loud dark pills.
- Confidence should read as supporting evidence, not as a gamified score.
- Review warnings are noticeable without feeling alarming.
- Keyboard navigation and scrolling remain smooth.

### F. Ask NEVER
- Empty Ask state feels premium and useful.
- Suggested questions do not look like generic AI prompt chips.
- User and NEVER turns are visually distinguishable without chat-bubble clutter.
- Sources/evidence remain readable and secondary to the answer.
- Loading state is quiet and stable.
- Test deterministic recall, AI recall and AI-unavailable fallback.
- No answer or metadata should refer to the product as ONE.

### G. Search
- Search field receives immediate visual focus without a blue ring.
- Recent suggestions remain secondary.
- Results have strong title/preview/meta hierarchy.
- No-result state looks deliberate.
- Test long queries and keyboard dismissal.

### H. Saved / Documents
- Saved memory should feel like a private archive, not a file-manager template.
- The “Document memory” summary must read as context, not a finance dashboard.
- Filters use quiet neutral selected states.
- Document totals, merchant, date and metadata remain aligned.
- Image/document previews crop correctly.
- Empty Saved and Documents states share the same visual grammar.

### I. Calendar
- Selected date uses metallic/chrome emphasis, not legacy blue.
- Month navigation is easy to scan.
- Dense days do not feel cramped.
- Event rows align with Inbox/Saved row language.

### J. Memory / Item detail
- The screen reads first as a memory object and second as an editor.
- Identity, editable title and structured sections have one clear hierarchy.
- Date/time native controls fit the NEVER styling around them.
- Context, notes and recognized text are visually separated.
- Saved/completed controls are easy to understand.
- Delete action is clearly destructive but not visually overemphasized or duplicated.

### K. Scan / OCR
- Camera and Photos permission flows are tested on real hardware.
- Empty state communicates “paper into memory,” not a generic scanner utility.
- Preview image radius and crop are correct.
- OCR reading/ready/no-text/failed states do not cause layout jumps.
- “Recognized and organized” Capture Review matches manual/share review.
- Original-file security message remains secondary.

### L. Native Share Extension / Incoming Share Review
- Test from Safari, Mail and Photos.
- Share-to-NEVER entry uses correct visible app name in the OS.
- Share flow opens once and does not duplicate.
- Incoming review follows the visual story Original → NEVER recognition → Review → Save.
- Attachment securing, OCR and save states are visually coherent.
- No old ONE wording appears in alerts, labels or fallback states.

### M. Settings
- Account summary, membership, preferences and account controls use consistent spacing.
- Settings should feel designed, not like an unmodified system table.
- Secondary settings do not look like disconnected mini-apps.
- Sign-out and destructive actions are correctly de-emphasized/emphasized.

### N. Appearance
- System, Light and Dark previews clearly communicate the choice.
- Nature and Wordmark app icons appear sharp, correctly rounded and visually balanced.
- Switching mode does not produce flashes or stale colors.
- Verify all core screens after changing mode while the app is running.
- Test native alternate-icon switching on the installed iOS build.

### O. Notifications
- Permission status is accurate.
- Enable/open-settings state and reminder timing selection are visually clear.
- Test a real local notification.
- Notification fallback text must say NEVER where the product is named.

### P. Privacy / Export
- Privacy page feels credible, editorial and restrained.
- User-facing copy must avoid internal architecture jargon and unverified security claims.
- Export action is understandable.
- Exported JSON filename and share-sheet title use NEVER.
- Privacy Policy, Terms and Support rows open the configured production URLs.
- Missing URL configuration may be shown only in development; distributed consumer builds must not expose release-engineering instructions.

### Q. Plans
- NEVER and NEVER AI use the same premium visual system; AI must not become a purple/blue “featured SaaS card.”
- Storefront price and introductory-offer truth remain readable and secondary to plan value.
- Disabled billing states look intentionally unavailable, not broken.
- Restore purchase and beta messaging are readable.
- Consumer builds must not expose RevenueCat/configuration instructions.
- Visible product names are NEVER and NEVER AI; technical product IDs may remain legacy-compatible internally.

### R. Rotation / iPad width sanity
- Rotate iPhone where supported and verify no clipped titles, broken previews or stale pager positions.
- On iPad / Split View, primary content stays bounded rather than stretching edge-to-edge.
- Onboarding paging realigns after width changes.
- No “desktop dashboard” layout appears simply because more width is available.

## 3. Cross-screen visual defect checklist

For every screen inspect:
- inconsistent left/right margins;
- mismatched card radii;
- accidental pure-white controls in dark mode;
- legacy blue values;
- hard-coded `#FFFFFF` used where `theme.onAccent` is required;
- excessive font weight;
- orphaned labels or uneven vertical rhythm;
- clipped text;
- poor contrast;
- keyboard overlap;
- safe-area collisions;
- scroll content hidden behind the tab bar;
- inconsistent icon sizes;
- excessive shadows;
- abrupt loading-state layout changes;
- excessive pills/badges;
- dashboard-like KPI blocks;
- old ONE product wording;
- internal engineering or release-configuration copy visible to consumers.

## 4. Premium acceptance threshold

A screen is accepted only when all of the following are true:
1. It looks coherent with the approved NEVER App Store campaign without explanation.
2. No element immediately reads as a default template component.
3. The primary action or primary information is obvious within roughly one second.
4. Secondary information is visually quieter than primary content.
5. Light and dark modes both look intentionally designed.
6. No legacy blue or visible ONE branding remains.
7. Native controls do not visually clash with custom components.
8. Touch targets feel comfortable on-device.
9. Long/empty/error/loading states still look finished.
10. Product copy is truthful and contains no internal implementation language.
11. The screen would be acceptable in a private TestFlight beta without a redesign disclaimer.

## 5. Device-test capture protocol

During the next physical iPhone session, capture screenshots of:
- cold-launch loader;
- each onboarding product vignette;
- sign-in and create-account;
- password reset / callback if practical;
- Inbox with data and empty Inbox;
- Capture Review with a confident and ambiguous item;
- Inbox review / proposed action state;
- Ask NEVER empty, loading and answered states;
- Search results and no-results;
- Saved and Documents;
- Calendar;
- Memory / Item Detail;
- Scan empty, reading and result;
- native Share flow and incoming review;
- Settings;
- Appearance in light/dark and both app icons;
- Notifications permission state;
- Privacy;
- Plans.

For each screenshot classify defects as:
- **P0** — blocks use or makes the product look broken;
- **P1** — clearly harms premium perception or consistency;
- **P2** — polish issue worth fixing before App Store submission;
- **P3** — optional refinement.

No new product feature should be added during this visual acceptance pass unless it is required to fix a P0/P1 usability problem.
