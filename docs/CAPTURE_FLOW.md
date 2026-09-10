# ONE Capture → Recall Flow

## Product invariant

ONE follows one core path:

**Capture → Understand → Review → Save locally → Sync when possible → Recall from stored data**

The basic app must remain useful without ONE AI and without a network connection.

## 1. Capture sources

ONE currently accepts:

- manual quick capture
- native Share to ONE text and URLs
- shared screenshots/images
- document/receipt scans from camera or photo library

Native share receiving and OCR require a native/development build. Expo Go is not considered validation for these paths.

## 2. Deterministic understanding

`src/capture/core.ts` is the shared deterministic interpretation boundary.

Supported capture classifications include:

- task
- note
- reminder
- appointment
- event
- link
- screenshot
- document
- receipt
- idea

The persisted cloud `type` model remains intentionally small. `receipt` persists as a `document`; `screenshot` can persist as a `note` with `sourceType=screenshot`. This avoids unnecessary database-type expansion while preserving source and document semantics.

ONE Basic uses deterministic rules first. ONE AI may enhance recall/organization later, but Basic capture must not depend on an AI response.

## 3. User context priority

Explicit user context outranks uncertain automatic classification.

Example:

- OCR looks receipt-like
- user writes `Gift Dad`
- capture classification becomes `idea`
- `gift` and `dad` become durable recall context
- the original screenshot and OCR text are preserved

This does not mean ONE invents additional details. User context only changes what the user explicitly indicated.

## 4. Confidence and no-fabrication rules

Extracted fields carry `high`, `medium`, or `low` confidence where applicable.

Current rules include:

- explicit named/full dates: high confidence
- relative dates such as tomorrow: high confidence
- day-only phrases such as `on the 23rd`: medium confidence and review requested
- explicit labeled location (`Location:`, `Ort:`, `Address:`): high confidence
- missing location: blank
- receipt total: only accepted automatically from an explicit total/balance line
- arbitrary line-item prices are **not** promoted to receipt total
- currency remains blank when it was not explicit
- uncertain fields remain editable in review

Review is designed around: **correct only what ONE got wrong**.

## 5. Share review

Shared content is resolved and, for supported images, OCR is attempted on-device.

The review screen allows editing:

- type/classification
- title
- date
- time
- location
- merchant
- amount
- currency
- user context
- tags
- extracted text

OCR failure does not prevent preserving and saving the original screenshot/image.

Malformed or partially resolved share payloads show a truthful fallback state instead of silently discarding the raw input.

## 6. Scan review

Camera/photo scans use the same interpretation and review rules as Share to ONE.

The original image is preserved locally before ONE attempts cloud synchronization.

For receipts/invoices, ONE may prefill merchant/date/amount/currency where deterministic extraction supports it. Missing or uncertain values stay blank/reviewable.

## 7. Local-first persistence

A capture is considered safely captured only after its local item state and, where applicable, a persistent local attachment copy exist.

Sync states are device-local metadata:

- `local` — stored on this device
- `pending` — authenticated item has cloud work to retry
- `synced` — last successful cloud snapshot/upsert

Local notification IDs, local attachment URIs and sync state are not cloud database fields.

When Supabase is unavailable:

1. capture remains stored locally
2. item remains visible
3. sync state remains pending for an authenticated user
4. foregrounding ONE retries synchronization

A cloud error must not erase the local capture.

## 8. Attachment synchronization

Device-local paths such as `file://` and `content://` are never written into Supabase item rows.

For authenticated users:

1. original attachment remains available locally
2. sync uploads it to the private `one-attachments` bucket
3. only the private storage path is written to the cloud item
4. the local URI remains device-only for local preview/fallback

Attachment upload failure leaves the item pending rather than discarding it.

## 9. Merge and deletion behavior

Cloud merge is deterministic by `updatedAt`, with device-only state preserved locally.

Rules:

- newer local pending edit beats older cloud version and is re-uploaded
- newer cloud item beats older local content
- notification ID stays local even when cloud content wins
- local attachment URI stays local even when cloud content wins
- a `synced` local item missing from a successful complete cloud snapshot is treated as remotely deleted
- a `pending`/new local item missing from cloud is considered unsynced and must be uploaded, not deleted
- explicit local deletions use account-scoped tombstones until cloud delete succeeds
- stale sync results are ignored after account scope changes

## 10. Account isolation

Local item storage is partitioned into:

- `anonymous`
- `user:<supabase-user-id>`

A sync result for Account A cannot apply after the active scope has switched to Account B.

When leaving an authenticated account, its scheduled reminders are suspended so private lock-screen content does not leak into the signed-out or next-account session.

## 11. Notifications

Only dated actionable item types are remindable:

- task
- reminder
- appointment
- event

Notes, screenshots and documents do not receive a reminder merely because OCR found a date.

Changing title/date/time/location/type can reschedule an existing reminder. Completing/removing the item cancels it. Notification permission state remains controlled by the OS and is exposed separately in Settings.

## 12. Inbox and Calendar

Inbox expresses lifecycle rather than acting as a generic database list:

- New
- Upcoming
- Saved
- Completed

Future appointments/reminders/events/dated tasks remain visible under Upcoming even if the capture is also marked saved.

ONE Calendar shows ONE's own dated items. **No Apple Calendar or Google Calendar synchronization is claimed.** External calendar integrations remain future architecture only.

## 13. Saved / durable memory

Saved is the durable memory layer for content such as:

- ideas
- screenshots
- links
- documents
- receipts
- reference material

ONE preserves user context, extracted text, structured document fields, created/updated timestamps and attachment references where available.

## 14. Ask ONE grounding

Ask ONE searches ONE's stored items. Semantic search may augment lexical retrieval for ONE AI, but the answer layer must use actual stored fields.

Grounded direct-answer examples include:

- `When was my dentist appointment?`
- `Where was it?`
- `What gift ideas did I save for Dad?`
- `Which receipt was from IKEA?`
- `What did I save about the hotel in Paris?`

If the best stored item has no requested location/date, ONE says that the field is not stored. If retrieval returns no item, ONE says it could not find that in ONE. Generic chatbot knowledge must not be presented as personal memory.

## 15. Error behavior

Expected truthful fallbacks:

- OCR unavailable/failed → preserve original capture and allow manual review
- local attachment persistence failed → do not claim save succeeded; allow retry
- attachment upload failed → local item remains pending
- cloud item save failed → local item remains pending
- notification permission denied → item saves; notification is not scheduled
- malformed share → show unresolved/raw-content state
- incomplete day-only date → medium confidence and review
- remote deletion → remove only items previously known as synced
- account switch mid-sync → stale result is discarded

## 16. Known native limitations

The following require physical-device/native development-build validation and must not be inferred from TypeScript/web CI:

- iOS share extension/intake behavior
- Apple Vision OCR through `expo-ocr-kit`
- Android ML Kit OCR
- camera/photo permissions
- private local attachment persistence from share-provider URIs
- local notification scheduling/taps
- email/deep-link round trips
- RevenueCat/StoreKit sandbox behavior

CI validates code, tests, dependency compatibility and the web build only.
