# ONE — Inbox Triage and Daily Control Surface

PO045 keeps one canonical `OneItem` identity across Inbox, Calendar, Saved and Ask ONE. Triage never creates a second copy of a capture.

## Triage states

- `new` — captured and ready for a lightweight decision.
- `needs_review` — low-confidence or ambiguous extraction. Consequential actions are not proposed until the user confirms/corrects the facts.
- `actionable` — grounded information supports a real ONE action such as calendar placement or reminder creation.
- `processed` — the user confirmed an action or deliberately marked the item processed.
- `archived` — removed from the active Inbox without deleting the underlying memory.

`deferred_until` temporarily hides an active Inbox item and allows it to return later without changing its canonical identity.

## Proposed actions

Actions are derived only from stored evidence:

- confirmed appointment/event + date → Add to Calendar; optionally Add reminder or Save reference.
- grounded reminder/task + date → Create/confirm reminder.
- receipt → Save purchase using only extracted merchant/amount values that actually exist.
- document/link/image → Save reference.
- note/idea → Save / Save idea.
- low-confidence structured content → safe Save reference only until reviewed.

Action execution updates the same `OneItem`. `executedActions` prevents accidental repeated execution.

## Today

The Inbox Today surface aggregates factual state only, in this order:

1. overdue reminders,
2. reminders due today,
3. events occurring today,
4. captures needing review,
5. actionable Inbox items.

Completed and archived items are excluded. Deferred Inbox decisions remain hidden until their defer time passes.

## Review flow

The canonical Inbox detail route is `/inbox/[id]`. It can show:

- source and capture time,
- attachment preview when locally accessible,
- ONE summary,
- confidence,
- unresolved ambiguities,
- extracted date/time/location/people/merchant/amount/category,
- evidence-based proposed actions,
- original capture via progressive disclosure,
- possible duplicate relationship,
- Review tomorrow / Mark processed / Archive.

Editing uses the existing canonical `/item/[id]` editor. Confirming review clears extraction ambiguity but does not invent missing fields.

## Duplicate protection

ONE uses a deterministic capture fingerprint across normalized source/title/raw/original/OCR/URL/document metadata. A recent matching fingerprint is surfaced as a possible duplicate. ONE never deletes or merges the item automatically.

## Offline and sync behavior

Triage mutations use the existing local-first `ItemsContext.update` path. Authenticated changes become `pending` until cloud sync succeeds. Existing account-scope and stale-sync guards remain authoritative.

Cloud triage metadata is stored on the existing `public.items` row:

- `triage_state`
- `executed_actions`
- `processed_at`
- `archived_at`
- `deferred_until`

Existing RLS ownership policies remain unchanged.

## Recall

Processed and archived items are not deleted from ONE memory. Existing lexical/semantic search and grounded Ask ONE continue to operate on the canonical item content and provenance.

## Known boundary

`Add to Calendar` means ONE's internal Calendar view. PO045 does not claim Apple Calendar or Google Calendar synchronization.
