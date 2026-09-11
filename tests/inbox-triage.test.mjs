import test from 'node:test';
import assert from 'node:assert/strict';

import {
  captureFingerprint,
  confirmReviewChanges,
  deferReviewChanges,
  findLikelyDuplicate,
  isInboxActive,
  proposedActionsForItem,
  triageActionChanges,
  triageStateForItem
} from '../src/inbox/triage.ts';
import { buildTodayEntries } from '../src/inbox/today.ts';
import { notificationTransition } from '../src/notifications/policy.ts';
import { buildGroundedRecallAnswer } from '../src/search/grounded.ts';

const NOW = new Date('2026-09-11T10:00:00Z');

function makeItem(overrides = {}) {
  return {
    id: overrides.id || 'item-1',
    title: overrides.title || 'Captured item',
    type: overrides.type || 'note',
    kind: overrides.kind || 'note',
    destination: overrides.destination || 'inbox',
    reviewStatus: overrides.reviewStatus || 'ready',
    understandingConfidence: overrides.understandingConfidence || 'high',
    ambiguities: overrides.ambiguities || [],
    executedActions: overrides.executedActions || [],
    completed: overrides.completed ?? false,
    saved: overrides.saved ?? false,
    sourceType: overrides.sourceType || 'manual',
    tags: overrides.tags || [],
    entities: overrides.entities || [],
    createdAt: overrides.createdAt || '2026-09-11T09:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-09-11T09:00:00.000Z',
    ...overrides
  };
}

test('Inbox states distinguish new, review, actionable, processed and archived', () => {
  assert.equal(triageStateForItem(makeItem()), 'new');
  assert.equal(triageStateForItem(makeItem({ reviewStatus: 'needs_review', understandingConfidence: 'low' })), 'needs_review');
  assert.equal(triageStateForItem(makeItem({ kind: 'event', type: 'appointment', date: '2026-09-12' })), 'actionable');
  assert.equal(triageStateForItem(makeItem({ destination: 'saved' })), 'processed');
  assert.equal(triageStateForItem(makeItem({ triageState: 'archived' })), 'archived');
});

test('low-confidence event never proposes a consequential calendar or reminder action', () => {
  const item = makeItem({
    kind: 'event',
    type: 'appointment',
    date: '2026-09-12',
    reviewStatus: 'needs_review',
    understandingConfidence: 'low'
  });
  const actions = proposedActionsForItem(item).map((action) => action.id);
  assert.doesNotMatch(actions.join(','), /add_to_calendar|create_reminder/);
  assert.ok(actions.includes('save_reference'));
});

test('high-confidence appointment proposes a real calendar action first', () => {
  const item = makeItem({ kind: 'event', type: 'appointment', date: '2026-09-12', time: '14:30' });
  const actions = proposedActionsForItem(item);
  assert.equal(actions[0]?.id, 'add_to_calendar');
  assert.equal(actions[0]?.primary, true);
});

test('confirming review removes ambiguity without inventing fields', () => {
  const item = makeItem({
    reviewStatus: 'needs_review',
    understandingConfidence: 'low',
    ambiguities: ['Possible date'],
    date: undefined,
    time: undefined
  });
  const changes = confirmReviewChanges(item);
  assert.equal(changes.reviewStatus, 'reviewed');
  assert.deepEqual(changes.ambiguities, []);
  assert.equal(changes.date, undefined);
  assert.equal(changes.time, undefined);
});

test('calendar execution updates one canonical item instead of creating a duplicate record', () => {
  const item = makeItem({ id: 'dentist', kind: 'event', type: 'appointment', date: '2026-09-18', time: '14:30' });
  const changes = triageActionChanges(item, 'add_to_calendar', NOW);
  assert.ok(changes);
  const updated = { ...item, ...changes };
  assert.equal(updated.id, 'dentist');
  assert.equal(updated.destination, 'calendar');
  assert.equal(updated.triageState, 'processed');
});

test('reminder execution becomes schedulable and repeated execution is idempotent', () => {
  const item = makeItem({ id: 'paul', title: 'Call Paul', type: 'note', kind: 'note', date: '2026-09-12', time: '18:00' });
  const changes = triageActionChanges(item, 'create_reminder', NOW);
  assert.ok(changes);
  const updated = { ...item, ...changes };
  assert.equal(updated.type, 'reminder');
  assert.equal(notificationTransition(item, updated), 'schedule');
  assert.equal(triageActionChanges(updated, 'create_reminder', NOW), null);
});

test('archive removes an item from active Inbox without deleting the item', () => {
  const item = makeItem({ id: 'archive-me' });
  const changes = triageActionChanges(item, 'archive', NOW);
  assert.ok(changes);
  const archived = { ...item, ...changes };
  assert.equal(archived.id, 'archive-me');
  assert.equal(archived.triageState, 'archived');
  assert.equal(isInboxActive(archived, NOW), false);
});

test('defer review temporarily removes the item from active Inbox', () => {
  const item = makeItem({ reviewStatus: 'needs_review', triageState: 'needs_review' });
  const changes = deferReviewChanges(NOW, 24);
  const deferred = { ...item, ...changes };
  assert.equal(isInboxActive(deferred, NOW), false);
  assert.equal(isInboxActive(deferred, new Date('2026-09-12T11:00:00Z')), true);
});

test('duplicate protection identifies identical recent capture content but does not delete it', () => {
  const first = makeItem({ id: 'first', rawInput: 'Gift idea for Dad: leather weekend bag', createdAt: '2026-09-11T08:00:00.000Z' });
  const second = makeItem({ id: 'second', rawInput: 'Gift idea for Dad: leather weekend bag', createdAt: '2026-09-11T09:00:00.000Z' });
  assert.equal(captureFingerprint(first), captureFingerprint(second));
  assert.equal(findLikelyDuplicate(second, [first, second])?.id, 'first');
});

test('Today aggregation prioritizes overdue reminder, then today reminder/event, then Inbox decisions', () => {
  const entries = buildTodayEntries([
    makeItem({ id: 'overdue', kind: 'reminder', type: 'reminder', date: '2026-09-10', destination: 'calendar', triageState: 'processed' }),
    makeItem({ id: 'today-reminder', kind: 'reminder', type: 'reminder', date: '2026-09-11', destination: 'calendar', triageState: 'processed' }),
    makeItem({ id: 'today-event', kind: 'event', type: 'appointment', date: '2026-09-11', destination: 'calendar', triageState: 'processed' }),
    makeItem({ id: 'review', triageState: 'needs_review', reviewStatus: 'needs_review' }),
    makeItem({ id: 'tomorrow', kind: 'event', type: 'appointment', date: '2026-09-12', destination: 'calendar', triageState: 'processed' })
  ], NOW);
  assert.deepEqual(entries.map((entry) => entry.item.id), ['overdue', 'today-reminder', 'today-event', 'review']);
});

test('processed item remains grounded and retrievable through Ask ONE', () => {
  const item = makeItem({
    id: 'dentist',
    title: 'Dentist appointment',
    kind: 'event',
    type: 'appointment',
    date: '2026-09-18',
    time: '14:30',
    destination: 'calendar',
    triageState: 'processed'
  });
  const answer = buildGroundedRecallAnswer('When is my dentist appointment?', [item], item, NOW);
  assert.deepEqual(answer?.itemIds, ['dentist']);
  assert.match(answer?.title || '', /14:30/);
});

test('offline pending state survives local triage changes', () => {
  const item = makeItem({ syncState: 'pending' });
  const changes = triageActionChanges(item, 'save_note', NOW);
  const updated = { ...item, ...changes };
  assert.equal(updated.syncState, 'pending');
  assert.equal(updated.destination, 'saved');
});
