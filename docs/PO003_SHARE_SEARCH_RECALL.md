# ONE PO003 — Share Extension, Search & Grounded Recall

## Product loop

PO003 extends the existing ONE foundation without creating parallel item models:

`share / capture → normalize → understand → store → retrieve → answer`

The same `OneItem` model and PO002 capture interpretation remain authoritative.

## Share ingestion

`src/sharing/contract.ts` defines the application-side share contract. Every incoming share is normalized into an envelope with:

- `ingestionSource = share_extension`
- source application when available
- text and/or normalized HTTP(S) URL
- file URI where available
- MIME/content type
- original file name
- capture timestamp
- raw payload reference
- deterministic duplicate fingerprint
- truthful unavailable/unsupported state

`src/sharing/ingest.ts` maps the envelope back into the existing PO002 capture pipeline. Shared content is stored as `sourceType = share`; its classification (Link, Image, Event, Note, etc.) remains separate from the ingestion channel.

The existing native handoff route (`+native-intent.ts` → `/handle-share`) and attachment persistence are preserved.

## iOS Share Extension boundary

The current Expo config already declares:

- app bundle: `app.one.mobile`
- extension bundle: `app.one.mobile.ShareExtension`
- App Group: `group.app.one.mobile`
- text, web URL/page, image, file and attachment activation rules

`expo-sharing` generates the native target through Continuous Native Generation/prebuild. A new native binary is therefore required after config/plugin changes; Expo Go is not a substitute for final Share Sheet acceptance.

Important: Expo currently documents incoming native sharing as experimental. On iOS its implementation opens the main app target for processing rather than completing the entire workflow inside a custom Share Extension view controller. Physical-device acceptance must therefore verify cold-start and warm-start handoff, Photos, Safari, Mail/Messages text, App Group entitlements, attachment persistence and repeated-share behavior.

No signing certificates, provisioning profiles or secrets are committed.

## Search

`src/search/searchItems.ts` remains the deterministic lexical scorer and now indexes:

- title
- summary
- raw/original/OCR text
- URL and extracted URLs
- tags
- context
- people and entities
- classification/document kind
- extracted dates/times
- merchant/category/money fields

Ranking prioritizes exact title, context/person/entity matches, then summary/raw text and recency. Lightweight German/English plural normalization is included.

`src/search/retrieve.ts` is the authoritative retrieval combiner for Search and Ask ONE. It provides:

- local-first retrieval
- recent items for empty Search
- time-aware retrieval for today/yesterday/upcoming questions
- optional semantic matches
- semantic-ID intersection with the current local item scope
- pending-sync item inclusion
- local fallback when semantic search fails

The Search tab never depends on network access.

## Ask ONE / AI recall

Ask ONE uses retrieval first. The client sends only the top retrieved item IDs to `answer-one-recall`.

The Edge Function:

1. requires an authenticated Supabase JWT,
2. creates a user-scoped Supabase client,
3. reloads only those item IDs under RLS,
4. limits the context to six items and selected fields,
5. sends that bounded context to the model,
6. requests strict structured output,
7. rejects any source ID that was not actually retrieved.

The client validates the output again. If AI or semantic retrieval is unavailable, local Search and deterministic grounded recall continue to work.

The model request uses `store: false`. Saved item content is explicitly treated as untrusted data rather than model instructions.

## Server-only AI configuration

The mobile application contains no model secret.

Configure these as Supabase Edge Function secrets, never `EXPO_PUBLIC_*` variables:

- `OPENAI_API_KEY`
- optional `ONE_RECALL_MODEL` (defaults to `gpt-5.6-luna`)

Without `OPENAI_API_KEY`, `answer-one-recall` returns `ai_not_configured`; the app falls back to grounded deterministic recall instead of hiding sources or fabricating an answer.

## Privacy boundary

- Local storage remains account-scoped through the existing ItemsContext storage scope.
- Supabase item reads remain protected by existing ownership RLS.
- Semantic search runs under the caller's JWT/RLS context.
- Recall generation reloads source rows under the caller's JWT/RLS context.
- No service-role key is bundled in the app or required by recall.
- The complete user database is never sent to the model.

## Acceptance still required

Physical iOS/iPad acceptance remains necessary for:

- actual Share Sheet visibility
- App Group entitlement/signing
- Safari URL share
- Photos image/screenshot share
- Mail/Messages text share
- attachment URI lifetime across extension handoff
- cold/warm app launch behavior
- small/large iPhone layout
- iPad portrait/landscape layout

PO003 does not claim those physical-device checks until they are run on a development/production build.
