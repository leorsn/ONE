# NEVER — App Store metadata draft

Status: first submission draft. Product UI remains unchanged.

The copy below is intentionally conservative and should only be changed for positioning/marketing reasons, not during functional launch hardening.

## App information

### Name

`NEVER`

Apple limit: 30 characters.

### Subtitle

`Capture. Remember. Recall.`

Apple limit: 30 characters.

### Primary category

Proposed: `Productivity`

### Secondary category

Proposed: `Utilities`

Final category selection is an App Store Connect decision and does not affect the app binary.

## Promotional text

`Save notes, links, screenshots, documents and reminders in one private memory. Find what matters later with fast search and grounded NEVER AI recall.`

Apple limit: 170 characters.

## Description

`NEVER is a private place for the information you do not want to lose.

Capture notes, links, screenshots, documents, receipts, reminders and ideas. NEVER organizes what you save so it can be found again when you actually need it.

CAPTURE FROM ANYWHERE
Save text and links directly in NEVER. Use the iOS Share Sheet for supported screenshots, photos and PDFs. Review what NEVER understood before a memory is saved.

FIND WHAT YOU SAVED
Search across your personal memory, browse recent captures, review saved documents and use the calendar for dated information and reminders.

PRIVATE ACCOUNT SYNC
Your synced memories and supported attachments are scoped to your NEVER account. Core local capture remains useful when the network is unavailable, and sync can continue when connectivity returns.

REMINDERS THAT STAY USEFUL
Turn dated memories into local reminders and control notification timing from NEVER settings.

NEVER AI
With NEVER AI, ask questions about information you previously saved. Answers are grounded in retrieved memories and link back to the saved evidence used for the response. If NEVER does not have enough saved evidence, it should not invent an answer.

MEMBERSHIP
NEVER and NEVER AI are optional auto-renewable monthly subscriptions. Available products, prices and introductory offers are shown from the current App Store storefront before purchase. Eligibility for introductory offers is determined by Apple.

Subscriptions automatically renew unless cancelled according to your App Store subscription settings. You can restore purchases and manage an active subscription from within NEVER.

Your information stays under your control with data export and in-app account deletion controls.`

Apple limit: 4,000 characters.

## Keywords

`memory,notes,organizer,documents,receipts,reminders,search,calendar,knowledge,personal`

Apple limit: 100 bytes total.

Do not add `NEVER`, `capture`, `remember` or `recall` unless the final App Store name/subtitle changes; Apple search guidance recommends avoiding duplication of terms already present in the name/subtitle.

## URLs

These must be final HTTPS production pages before submission:

- Privacy Policy: `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- Support URL: `EXPO_PUBLIC_SUPPORT_URL`
- Terms of Use: `EXPO_PUBLIC_TERMS_URL`

The Support URL must lead to usable support/contact information rather than a placeholder landing page.

## Subscription metadata

### Subscription Group

Reference name:

`NEVER Membership`

Suggested localized display name:

`NEVER Membership`

### NEVER

Reference name:

`NEVER Monthly`

Product ID:

`app.one.mobile.one.monthly`

Suggested display name:

`NEVER`

Suggested subscription description:

`Capture, organize, sync and find your personal memory.`

Duration:

`1 month`

Target German storefront price:

`€2.99/month` using Apple's available price point.

Introductory offer target:

`7-day free trial for eligible new subscribers.`

Apple subscription level:

`Level 2`

### NEVER AI

Reference name:

`NEVER AI Monthly`

Product ID:

`app.one.mobile.oneai.monthly`

Suggested display name:

`NEVER AI`

Suggested subscription description:

`Everything in NEVER plus grounded AI recall across your saved memory.`

Duration:

`1 month`

Target German storefront price:

`€4.99/month` using Apple's available price point.

Introductory offer target:

`None for initial launch.`

Apple subscription level:

`Level 1`

## App Review notes — draft

`NEVER is a personal memory and organization app. Users can create an email/password account, capture notes/links/documents, sync supported data and optionally purchase NEVER or NEVER AI through Apple in-app subscriptions.

The Membership screen contains current storefront pricing, Restore Purchases, Terms of Use and Privacy Policy links. NEVER AI adds grounded recall over the user's own saved information.

Account deletion is available in Settings. If the user has an active Apple subscription, NEVER explicitly explains that deleting the account does not cancel the App Store subscription and provides a Manage Subscription action.

The Share Extension and notifications require the production Apple provisioning capabilities used by the submitted/TestFlight build.`

## Reviewer screenshots required

Before subscription review, capture the final production/TestFlight Membership screen showing:

- NEVER plan
- NEVER AI plan
- actual localized App Store prices
- trial copy when Apple exposes an introductory offer
- Restore Purchases
- Terms of Use
- Privacy Policy

Do not use a development screenshot showing beta-access messaging or placeholder prices for the final review asset.

## Screenshot story — proposed order

The marketing screenshot set can be produced after TestFlight acceptance without changing the in-app design:

1. Home — capture and personal memory
2. Search / Ask NEVER — retrieve saved information
3. Calendar — reminders and dated memories
4. Saved — documents and organized memory
5. Material Worlds / personalization
6. Membership / NEVER AI only if useful for the final store narrative

## Final submission blockers for metadata

- final legal entity/seller details in App Store Connect
- final Privacy/Terms/Support HTTPS URLs
- final App Store category decision
- final age-rating questionnaire
- final data-collection/privacy answers based on the production backend
- final screenshots from the accepted TestFlight build
- reviewer subscription screenshot
