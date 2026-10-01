# NEVER — App Store privacy data inventory

Status: conservative production draft based on the current `design/never-material-worlds` codebase and current third-party configuration assumptions.

This document is the source-of-truth worksheet for App Store Connect App Privacy answers. It is not legal advice and must be re-verified against the actual production Supabase, RevenueCat and OpenAI configurations immediately before submission.

## Apple collection rule used for this inventory

For App Store privacy disclosure, data is considered collected when it is transmitted off device and remains accessible to the developer or a third-party partner longer than required to service the request in real time.

Free-form text does not require declaring every possible sensitive fact a user might type. Generic free-form content should be represented as Other User Content; media types intentionally supported by an upload feature should be declared specifically.

## Current architecture relevant to privacy

NEVER currently uses:

- Supabase Auth for email/password accounts.
- Supabase Postgres for synced memory/item records.
- Supabase Storage for supported private attachments.
- Supabase Edge Functions for capture interpretation, semantic search, recall answers, embedding and account deletion.
- OpenAI Responses API from server-side Edge Functions for AI capture interpretation and grounded recall; the repository sends `store: false`.
- RevenueCat for subscription purchase/entitlement state.
- Apple StoreKit/App Store through RevenueCat.
- Local iOS notifications.
- On-device/local OCR flow plus synced extracted text where applicable.

The current repository contains no advertising SDK, attribution SDK, IDFA/ATT integration, general analytics SDK, crash-reporting SDK, contact-book integration, HealthKit integration or device-location API dependency.

Development-only native acceptance diagnostics are stored locally in AsyncStorage and return early outside `__DEV__`; they are not a production analytics pipeline.

## Recommended App Store Connect answer

### Do you or your third-party partners collect data from this app?

**Yes.**

## Data types to declare

### 1. Contact Info → Email Address

**Collected:** Yes  
**Linked to user:** Yes  
**Used for tracking:** No  
**Purposes:** App Functionality

Why:

- NEVER requires/provides email/password account authentication through Supabase Auth.
- Email is used for account creation, sign-in, confirmation and password recovery.

Do not mark email as advertising/marketing unless production behavior changes.

### 2. User Content → Other User Content

**Collected:** Yes  
**Linked to user:** Yes  
**Used for tracking:** No  
**Purposes:** App Functionality

Includes the synced memory model, such as:

- notes and free-form capture text
- document/PDF content and metadata
- titles and summaries
- extracted OCR text
- links/URLs intentionally saved by the user
- reminders/tasks/events entered or derived from saved content
- receipt/document metadata
- user context, tags, people/entities and other structured fields derived from a memory

Why linked:

- synced item rows are explicitly owned by the authenticated Supabase `user_id`.
- RLS isolates rows by account rather than anonymizing them.

AI note:

- selected saved content can be sent from authenticated Supabase Edge Functions to OpenAI for capture interpretation or grounded recall.
- current Responses API requests set `store: false`, but third-party abuse-monitoring retention must still be considered in the production privacy policy and App Store disclosure.

### 3. User Content → Photos or Videos

**Collected:** Yes — for photos/images; NEVER does not currently launch cloud support for video originals.  
**Linked to user:** Yes  
**Used for tracking:** No  
**Purposes:** App Functionality

Why:

- users can intentionally import/share supported images and screenshots.
- supported originals are persisted locally first and, for signed-in accounts, can be uploaded to the user's private Supabase Storage namespace.

Supported production attachment policy currently covers JPEG, PNG, WebP, HEIC/HEIF, GIF, TIFF and PDF. PDF belongs under Other User Content rather than Photos/Videos.

Do not select Audio Data based on the current launch feature set.

### 4. Purchases → Purchase History

**Collected:** Yes  
**Linked to user:** Yes  
**Used for tracking:** No  
**Purposes:** App Functionality + Analytics

Two independent reasons make this applicable:

1. RevenueCat processes Apple subscription purchase history for entitlement validation and its subscription dashboard/analytics.
2. NEVER can intentionally store user-provided receipt/purchase memories, including merchant/amount/currency metadata, as part of personal memory functionality.

RevenueCat's Apple privacy guidance requires Purchase History when RevenueCat is used and recommends App Functionality + Analytics for its standard entitlement/dashboard behavior.

Why linked:

- NEVER calls RevenueCat login with the authenticated NEVER/Supabase user ID, so subscription history is associated with a custom user identifier instead of remaining anonymous-only.

### 5. Identifiers → User ID

**Collected:** Yes  
**Linked to user:** Yes  
**Used for tracking:** No  
**Purposes:** App Functionality + Analytics

Why:

- Supabase assigns an authenticated user/account ID.
- cloud items/profiles are keyed to that account ID.
- RevenueCat is explicitly identified with the NEVER/Supabase user ID so subscription state follows the correct account across devices.

Do not select Device ID based on the current code. The repository does not call RevenueCat device-identifier collection helpers and contains no IDFA/ATT integration. Reassess immediately if attribution/advertising integrations are added.

### 6. Search History

**Conservative production selection:** Yes  
**Linked to user:** Yes  
**Used for tracking:** No  
**Purposes:** App Functionality

Why:

- semantic search sends the user's query to an authenticated Supabase Edge Function.
- grounded Ask NEVER sends the question plus selected saved evidence through server-side AI processing.
- the repository itself does not persist a server-side search-history table, but third-party/server logging and AI abuse-monitoring retention mean the launch disclosure should not assume all queries are purely ephemeral unless production retention is independently verified and contractually configured otherwise.

If production infrastructure is changed to verifiable zero-retention for these queries and no server logs retain them beyond real-time servicing, this selection can be re-evaluated against Apple's collection definition.

## Data types currently not indicated by repository behavior

The following should remain **not collected** unless the production implementation or third-party dashboard configuration changes:

- Name — NEVER does not require a real name for account creation; optional auth metadata should be rechecked if later collected intentionally.
- Phone Number.
- Physical Address.
- Contacts / address book.
- Health & Fitness.
- Sensitive Info as a specifically requested field. Users may place arbitrary facts in free-form memory; Apple treats generic free-form input as Other User Content rather than requiring every possible category the user could type.
- Precise Location / Coarse Location from device sensors. NEVER can store a user-entered/extracted event location, but the current app does not request device geolocation.
- Audio Data.
- Browsing History. Saving a URL into NEVER is a deliberate user-content capture, not a browser-history collection feature.
- Device ID, subject to final RevenueCat/attribution dashboard verification.
- Advertising Data.
- Product Interaction / Other Usage Data as general product analytics; no production analytics SDK is present in the repository.
- Crash Data / Performance Data / Other Diagnostics as a developer analytics service; current diagnostic acceptance logs are development-only/local. Reassess if Sentry, Crashlytics or similar is added.

## Tracking / ATT conclusion

### Does NEVER currently use data to track users across apps/websites for advertising or share it with data brokers?

**Repository-based answer: No.**

Current code has:

- no advertising SDK
- no attribution SDK
- no IDFA collection
- no ATT permission flow
- no data-broker integration

RevenueCat does not inherently use purchase history for cross-app advertising tracking. This answer must be rechecked if RevenueCat attribution integrations, ad networks, device-identifier collection, analytics forwarding or marketing SDKs are enabled in dashboards even without a repository code change.

## Third-party processor inventory

### Supabase

Role in NEVER:

- authentication
- account identifiers/profile row
- cloud memory storage
- private attachment storage
- Edge Function execution

User-linked data handled:

- email/account identity
- account ID
- synced user content
- supported attachments

Production verification required:

- RLS/policies deployed exactly as repository manifest
- storage bucket remains private
- logging/retention settings reviewed
- region/project ownership documented in privacy policy

### RevenueCat

Role in NEVER:

- product/offering retrieval
- purchase/restore
- entitlement status
- subscription management URL

Data relevant to App Store privacy:

- Purchase History: required disclosure
- User ID: required for NEVER because the SDK is logged into the authenticated account ID
- App Functionality + Analytics purposes for standard RevenueCat purchase/entitlement/dashboard behavior

Production verification required:

- no attribution integration that introduces device/ad identifiers unless separately disclosed
- no optional customer attributes such as email/name unless privacy inventory is updated
- no unexpected analytics forwarding/integrations

### OpenAI API

Role in NEVER:

- server-side capture interpretation
- grounded recall answer generation

Repository controls:

- API key is server-side only
- `store: false`
- requests are made from Supabase Edge Functions rather than directly from the mobile client
- recall prompts are constrained to selected saved evidence

Data that may be transmitted:

- capture text / saved user content
- Ask NEVER question/search text
- selected saved evidence and derived metadata

Production verification required:

- confirm current OpenAI API data controls/retention for the production organization
- document subprocessors/processing as required by the final privacy policy
- if Zero Data Retention or other approved retention controls are enabled later, update this inventory only after verifying effective configuration

## Privacy policy content that must match the product

The final public privacy policy should explicitly explain, in plain language:

- account email/authentication
- local-first and cloud-sync behavior
- what personal memory content is stored in Supabase
- supported attachment storage
- AI processing of selected captures/questions/evidence
- RevenueCat/Apple subscription processing
- local notifications
- data export
- in-app account deletion
- retention/deletion behavior
- service providers/subprocessors
- contact method for privacy requests

It must not claim that all data stays only on-device because signed-in sync, attachment storage, RevenueCat and AI processing are off-device features.

## App Store privacy submission checklist

Immediately before publishing App Privacy answers:

1. Confirm production Supabase project and deployed functions match the release SHA.
2. Confirm RevenueCat production app has no additional attribution/analytics integrations beyond the documented configuration.
3. Confirm no optional RevenueCat contact attributes are being set externally.
4. Confirm OpenAI production organization retention/data-control settings.
5. Confirm final TestFlight binary contains no new analytics/crash/ads SDK added after this inventory.
6. Confirm App Store Connect selections at minimum include:
   - Email Address
   - Other User Content
   - Photos or Videos
   - Purchase History
   - User ID
   - Search History (conservative launch selection unless zero-retention is verified)
7. Mark the above as linked to the user where specified.
8. Mark tracking as No only if no external dashboard/integration changes introduce tracking.
9. Publish the final HTTPS Privacy Policy URL in App Store Connect and in the app's production environment.
10. Re-run the repository release gates for the exact TestFlight/App Store SHA.
