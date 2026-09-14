import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeSharedCapture, isLikelyDuplicateSharedCapture } from '../src/sharing/contract.ts';
import { searchOneItems } from '../src/search/searchItems.ts';
import { retrieveLocalOneItems, retrieveOneItems } from '../src/search/retrieve.ts';
import { buildGroundedFallback, noEvidenceAnswer, validateRecallModelPayload } from '../src/recall/grounding.ts';

const NOW = new Date('2026-09-14T12:00:00Z');

function makeItem(overrides = {}) {
  return {
    id: overrides.id || Math.random().toString(36).slice(2),
    title: overrides.title || 'Memory',
    type: overrides.type || 'note',
    completed: overrides.completed ?? false,
    saved: overrides.saved ?? true,
    sourceType: overrides.sourceType || 'manual',
    tags: overrides.tags || [],
    entities: overrides.entities || [],
    people: overrides.people || [],
    createdAt: overrides.createdAt || '2026-09-14T08:00:00.000Z',
    capturedAt: overrides.capturedAt || overrides.createdAt || '2026-09-14T08:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-09-14T08:00:00.000Z',
    ...overrides
  };
}

test('exact title match outranks a raw-text-only match', () => {
  const exact = makeItem({ id: 'exact', title: 'Geschenk für Papa' });
  const raw = makeItem({ id: 'raw', title: 'Random note', rawInput: 'Geschenk für Papa' });
  const results = searchOneItems('Geschenk für Papa', [raw, exact], { now: NOW });
  assert.equal(results[0]?.item.id, 'exact');
});

test('search covers tags context entities URLs raw text and extracted dates', () => {
  const item = makeItem({
    id: 'rich',
    title: 'Reference',
    userContext: 'Studium',
    tags: ['uni'],
    entities: ['person:Max'],
    rawInput: 'Seminar notes',
    url: 'https://example.com/reading-list',
    extractedDates: ['2026-09-22']
  });
  for (const query of ['Studium', 'uni', 'Max', 'reading list', 'Seminar', '2026-09-22']) {
    assert.equal(searchOneItems(query, [item], { now: NOW })[0]?.item.id, 'rich');
  }
});

test('simple plural variation still retrieves the singular saved term', () => {
  const item = makeItem({ id: 'gift', title: 'Geschenk für Papa' });
  assert.equal(searchOneItems('Geschenke Papa', [item], { now: NOW })[0]?.item.id, 'gift');
});

test('empty search returns recent local items and pending sync items stay visible', () => {
  const older = makeItem({ id: 'old', capturedAt: '2026-09-12T08:00:00.000Z' });
  const pending = makeItem({ id: 'pending', syncState: 'pending', capturedAt: '2026-09-14T10:00:00.000Z' });
  const results = retrieveLocalOneItems('', [older, pending], { now: NOW });
  assert.equal(results[0]?.item.id, 'pending');
});

test('time-aware retrieval finds what was saved yesterday', () => {
  const yesterday = makeItem({ id: 'yesterday', capturedAt: '2026-09-13T16:00:00.000Z' });
  const today = makeItem({ id: 'today', capturedAt: '2026-09-14T09:00:00.000Z' });
  const results = retrieveLocalOneItems('Was habe ich gestern gespeichert?', [today, yesterday], { now: NOW });
  assert.equal(results[0]?.item.id, 'yesterday');
});

test('semantic results are accepted only when the item exists in the current local scope', async () => {
  const own = makeItem({ id: 'own', title: 'Hamburg note' });
  const response = await retrieveOneItems('Hamburg', [own], {
    now: NOW,
    semanticSearch: async () => [
      { itemId: 'foreign-user-item', similarity: 0.99 },
      { itemId: 'own', similarity: 0.8 }
    ]
  });
  assert.deepEqual(response.results.map((result) => result.item.id), ['own']);
});

test('shared text, URL and image metadata normalize into one ingestion contract', () => {
  const text = normalizeSharedCapture({ sharedText: '  Gift for Papa  ', rawPayload: { shareType: 'text' } }, NOW);
  assert.equal(text.ingestionSource, 'share_extension');
  assert.equal(text.kind, 'text');
  assert.equal(text.sharedText, 'Gift for Papa');

  const url = normalizeSharedCapture({ sharedUrl: 'HTTPS://WWW.Example.com/path/' }, NOW);
  assert.equal(url.kind, 'url');
  assert.equal(url.normalizedUrl, 'https://example.com/path');

  const image = normalizeSharedCapture({ mimeType: 'image/png', originalName: 'shot.png' }, NOW);
  assert.equal(image.kind, 'image');
  assert.equal(image.unavailableReason, 'missing_file_uri');
});

test('malformed shared URL is preserved as text rather than discarded', () => {
  const envelope = normalizeSharedCapture({ sharedUrl: 'not a valid url' }, NOW);
  assert.equal(envelope.kind, 'text');
  assert.equal(envelope.sharedText, 'not a valid url');
  assert.equal(envelope.normalizedUrl, undefined);
});

test('normalized duplicate URL detection blocks only the close duplicate', () => {
  const first = normalizeSharedCapture({ sharedUrl: 'https://www.example.com/a/' }, new Date('2026-09-14T12:00:00Z'));
  const second = normalizeSharedCapture({ sharedUrl: 'https://example.com/a' }, new Date('2026-09-14T12:00:20Z'));
  const later = normalizeSharedCapture({ sharedUrl: 'https://example.com/a' }, new Date('2026-09-14T12:10:00Z'));
  assert.equal(first.fingerprint, second.fingerprint);
  assert.equal(isLikelyDuplicateSharedCapture(first, second, 30_000), true);
  assert.equal(isLikelyDuplicateSharedCapture(first, later, 30_000), false);
});

test('unsupported share payload remains explicit instead of silently disappearing', () => {
  const envelope = normalizeSharedCapture({ rawPayload: { strange: true } }, NOW);
  assert.equal(envelope.kind, 'unsupported');
  assert.equal(envelope.unavailableReason, 'unsupported_payload');
  assert.deepEqual(envelope.rawPayload, { strange: true });
});

test('grounded recall returns no fabricated answer when there is no evidence', () => {
  const answer = noEvidenceAnswer();
  assert.equal(answer.sourceIds.length, 0);
  assert.match(answer.body, /couldn't find anything saved/i);
});

test('grounded fallback exposes real source item ids for multi-item synthesis', () => {
  const items = [
    makeItem({ id: 'razor', title: 'Braun razor', userContext: 'Papa', tags: ['papa', 'gift'] }),
    makeItem({ id: 'book', title: 'Architecture book', userContext: 'Papa', tags: ['papa', 'gift'] })
  ];
  const answer = buildGroundedFallback('What ideas did I save for Papa?', items, NOW);
  assert.ok(answer.sourceIds.length >= 1);
  assert.equal(answer.sourceIds.every((id) => items.some((item) => item.id === id)), true);
});

test('AI recall schema rejects source references outside retrieved evidence', () => {
  assert.equal(validateRecallModelPayload({
    title: 'Answer',
    body: 'Saved fact',
    sourceIds: ['foreign'],
    evidence: 'saved'
  }, ['own']), undefined);

  assert.deepEqual(validateRecallModelPayload({
    title: 'Answer',
    body: 'Saved fact',
    sourceIds: ['own'],
    evidence: 'saved'
  }, ['own'])?.sourceIds, ['own']);
});
