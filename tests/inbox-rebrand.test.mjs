import test from 'node:test';
import assert from 'node:assert/strict';
import { proposedActionsForItem } from '../src/inbox/triage.ts';

function item(overrides = {}) {
  return {
    id: 'brand-check',
    title: 'Brand check',
    type: 'note',
    kind: 'note',
    destination: 'inbox',
    reviewStatus: 'ready',
    understandingConfidence: 'high',
    ambiguities: [],
    executedActions: [],
    completed: false,
    saved: false,
    sourceType: 'manual',
    tags: [],
    entities: [],
    createdAt: '2026-09-23T10:00:00.000Z',
    updatedAt: '2026-09-23T10:00:00.000Z',
    ...overrides
  };
}

test('Inbox action reasons use NEVER branding and never expose legacy ONE copy', () => {
  const samples = [
    item({ type: 'appointment', kind: 'event', date: '2026-09-24', time: '18:00' }),
    item({ type: 'idea', kind: 'note' }),
    item({ kind: 'unknown', reviewStatus: 'needs_review', understandingConfidence: 'low' })
  ];
  const copy = samples.flatMap((sample) => proposedActionsForItem(sample).map((action) => action.reason)).join('\n');
  assert.doesNotMatch(copy, /\bONE\b/);
  assert.match(copy, /NEVER/);
});
