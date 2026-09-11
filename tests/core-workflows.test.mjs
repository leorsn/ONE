import test from 'node:test';
import assert from 'node:assert/strict';

import { interpretCapture, applyUserContextPriority } from '../src/capture/core.ts';
import { buildItemFromCapture } from '../src/capture/buildItem.ts';
import { resolveOneNativePath } from '../src/native/deepLinks.ts';
import { mapNativePermissionState } from '../src/native/permissions.ts';
import { selectShareCandidate, shouldPreventDuplicateShare } from '../src/native/sharePayload.ts';
import { notificationTransition } from '../src/notifications/policy.ts';
import { buildGroundedRecallAnswer } from '../src/search/grounded.ts';
import { itemStorageScope } from '../src/storage/scope.ts';
import { canApplyScopedSyncResult, resolveCloudSnapshot } from '../src/sync/merge.ts';

const NOW = new Date('2026-09-10T10:00:00Z');

function makeItem(overrides = {}) {
  return {
    id: overrides.id || 'item-1',
    title: overrides.title || 'Memory',
    type: overrides.type || 'note',
    completed: overrides.completed ?? false,
    saved: overrides.saved ?? true,
    sourceType: overrides.sourceType || 'manual',
    tags: overrides.tags || [],
    entities: overrides.entities || [],
    createdAt: overrides.createdAt || '2026-09-10T08:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-09-10T08:00:00.000Z',
    ...overrides
  };
}

test('appointment email extracts structured date, time and location without inventing fields', () => {
  const draft = interpretCapture({
    rawText: [
      'Subject: Dentist appointment confirmation',
      'Date: September 18, 2026',
      'Time: 15:00',
      'Location: 123 Health Clinic',
      'Confirmation: DENT-8472'
    ].join('\n'),
    sourceType: 'email',
    now: NOW
  });

  assert.equal(draft.captureKind, 'appointment');
  assert.equal(draft.itemType, 'appointment');
  assert.equal(draft.date, '2026-09-18');
  assert.equal(draft.time, '15:00');
  assert.equal(draft.location, '123 Health Clinic');
  assert.ok(draft.entities.includes('reference:DENT-8472'));
});

test('simple reminder parses day-only date as medium-confidence future date', () => {
  const draft = interpretCapture({ rawText: 'Cancel Netflix on the 23rd', sourceType: 'manual', now: NOW });
  assert.equal(draft.captureKind, 'reminder');
  assert.equal(draft.date, '2026-09-23');
  assert.equal(draft.fieldConfidence.date, 'medium');
  assert.ok(draft.needsReview.includes('date'));
});

test('day after tomorrow is not misread as tomorrow', () => {
  const draft = interpretCapture({ rawText: 'Call Anna day after tomorrow at 14:00', sourceType: 'manual', now: NOW });
  assert.equal(draft.date, '2026-09-12');
  assert.equal(draft.time, '14:00');
});

test('explicit screenshot note Gift Dad overrides uncertain automatic document classification', () => {
  const automatic = interpretCapture({ extractedText: 'RECEIPT\nSHOP NAME\nTOTAL 49.90 EUR', sourceType: 'screenshot', isImage: true, now: NOW });
  assert.equal(automatic.captureKind, 'receipt');
  const prioritized = applyUserContextPriority(automatic, 'Gift Dad');
  assert.equal(prioritized.captureKind, 'idea');
  assert.equal(prioritized.itemType, 'idea');
  assert.equal(prioritized.fieldConfidence.type, 'high');
  assert.ok(prioritized.tags.includes('gift'));
  assert.ok(prioritized.tags.includes('dad'));
});

test('receipt extraction does not fabricate total from arbitrary line-item prices', () => {
  const draft = interpretCapture({ extractedText: 'RECEIPT\nIKEA\nDesk 499.00 EUR\nChair 799.00 EUR\nThank you', sourceType: 'scan', isImage: true, now: NOW });
  assert.equal(draft.documentKind, 'receipt');
  assert.equal(draft.captureKind, 'receipt');
  assert.equal(draft.amount, undefined);
  assert.equal(draft.currency, undefined);
});

test('explicit receipt total is extracted with currency', () => {
  const draft = interpretCapture({ extractedText: 'IKEA\nRECEIPT\nDesk 49.00 EUR\nTOTAL 59.90 EUR', sourceType: 'scan', isImage: true, now: NOW });
  assert.equal(draft.amount, 59.9);
  assert.equal(draft.currency, 'EUR');
  assert.equal(draft.fieldConfidence.amount, 'high');
});

test('capture save preserves original local attachment and starts local-first', () => {
  const draft = interpretCapture({ extractedText: 'Birthday gift idea: architecture book', userContext: 'Gift Dad', sourceType: 'screenshot', isImage: true, now: NOW });
  const item = buildItemFromCapture({ draft, sourceType: 'screenshot', rawInput: draft.extractedText, localAttachmentUri: 'file:///one-attachments/gift.png', attachmentMimeType: 'image/png', attachmentName: 'gift.png', now: NOW });
  assert.equal(item.type, 'idea');
  assert.equal(item.userContext, 'Gift Dad');
  assert.equal(item.localAttachmentUri, 'file:///one-attachments/gift.png');
  assert.equal(item.imageUrl, 'file:///one-attachments/gift.png');
  assert.equal(item.syncState, 'local');
});

test('new offline local item remains visible and is selected for later cloud upload', () => {
  const local = makeItem({ id: 'offline', syncState: 'pending' });
  const result = resolveCloudSnapshot([local], []);
  assert.deepEqual(result.remoteDeleted, []);
  assert.equal(result.merged[0]?.id, 'offline');
  assert.equal(result.localToUpload[0]?.id, 'offline');
});

test('newer local edit wins merge and is queued for upload', () => {
  const local = makeItem({ id: 'shared', title: 'Local edit', syncState: 'pending', updatedAt: '2026-09-10T10:00:00.000Z' });
  const cloud = makeItem({ id: 'shared', title: 'Old cloud', syncState: 'synced', updatedAt: '2026-09-10T09:00:00.000Z' });
  const result = resolveCloudSnapshot([local], [cloud]);
  assert.equal(result.merged[0]?.title, 'Local edit');
  assert.equal(result.localToUpload[0]?.id, 'shared');
});

test('previously synced item missing from a successful cloud snapshot is treated as remote deletion', () => {
  const local = makeItem({ id: 'deleted-remotely', syncState: 'synced' });
  const result = resolveCloudSnapshot([local], []);
  assert.equal(result.merged.length, 0);
  assert.equal(result.localToUpload.length, 0);
  assert.equal(result.remoteDeleted[0]?.id, 'deleted-remotely');
});

test('account storage scopes do not overlap and stale sync cannot apply after account switch', () => {
  const accountA = itemStorageScope('user-a');
  const accountB = itemStorageScope('user-b');
  assert.equal(accountA, 'user:user-a');
  assert.equal(accountB, 'user:user-b');
  assert.notEqual(accountA, accountB);
  assert.equal(canApplyScopedSyncResult(accountA, accountB), false);
  assert.equal(canApplyScopedSyncResult(accountB, accountB), true);
});

test('Ask ONE returns grounded appointment location and supporting item id', () => {
  const dentist = makeItem({ id: 'dentist', title: 'Dentist appointment', type: 'appointment', date: '2026-09-18', time: '15:00', location: '123 Health Clinic' });
  const answer = buildGroundedRecallAnswer('Where was my dentist appointment?', [dentist], dentist);
  assert.equal(answer?.title, '123 Health Clinic');
  assert.deepEqual(answer?.itemIds, ['dentist']);
});

test('Ask ONE returns only Dad gift memories for Dad gift query', () => {
  const dad = makeItem({ id: 'dad', title: 'Rolex book', type: 'idea', userContext: 'Gift Dad', tags: ['gift', 'dad'] });
  const mom = makeItem({ id: 'mom', title: 'Flowers', type: 'idea', userContext: 'Gift Mom', tags: ['gift', 'mom'] });
  const answer = buildGroundedRecallAnswer("What gift ideas did I save for Dad's birthday?", [dad, mom], dad);
  assert.deepEqual(answer?.itemIds, ['dad']);
  assert.match(answer?.body || '', /Rolex book/);
  assert.doesNotMatch(answer?.body || '', /Flowers/);
});

test('Ask ONE unknown/no-result path returns no fabricated answer', () => {
  const answer = buildGroundedRecallAnswer('Where was the unknown appointment?', [], undefined);
  assert.equal(answer, undefined);
});

test('notification policy reschedules edited reminder and cancels completed reminder', () => {
  const previous = makeItem({ type: 'reminder', title: 'Cancel Netflix', date: '2026-09-23', time: '09:00', notificationId: 'notification-1' });
  assert.equal(notificationTransition(previous, { ...previous, time: '10:00' }), 'reschedule');
  assert.equal(notificationTransition(previous, { ...previous, completed: true }), 'cancel');
});

test('native share normalization prefers an attachment representation and remains deterministic', () => {
  const payloads = [{ shareType: 'text', value: 'Screenshot from Photos' }, { shareType: 'image', value: '' }];
  const resolved = [{ contentType: 'text' }, { contentType: 'image', contentUri: 'file:///tmp/photo.png', contentMimeType: 'image/png', originalName: 'photo.png' }];
  const selected = selectShareCandidate(payloads, resolved);
  assert.equal(selected?.index, 1);
  assert.equal(selected?.representationCount, 2);
  assert.match(selected?.fingerprint || '', /^share-[0-9a-f]{8}$/);
  assert.equal(selectShareCandidate(payloads, resolved)?.fingerprint, selected?.fingerprint);
});

test('empty or malformed native share payload does not create a candidate', () => {
  assert.equal(selectShareCandidate([], []), undefined);
  assert.equal(selectShareCandidate([{ shareType: 'text', value: '   ' }], []), undefined);
});

test('duplicate native share protection blocks only the same recent fingerprint', () => {
  assert.equal(shouldPreventDuplicateShare({ previousFingerprint: 'share-a', previousHandledAt: 1000, nextFingerprint: 'share-a', now: 20000 }), true);
  assert.equal(shouldPreventDuplicateShare({ previousFingerprint: 'share-a', previousHandledAt: 1000, nextFingerprint: 'share-b', now: 20000 }), false);
  assert.equal(shouldPreventDuplicateShare({ previousFingerprint: 'share-a', previousHandledAt: 1000, nextFingerprint: 'share-a', now: 200000 }), false);
});

test('ONE native deep links route auth, reset, acceptance and share intents', () => {
  assert.deepEqual(resolveOneNativePath('one://auth/callback?code=abc123'), { route: '/auth/callback?code=abc123', kind: 'auth_callback' });
  assert.deepEqual(resolveOneNativePath('one://auth/reset-password?code=xyz456'), { route: '/auth/reset-password?code=xyz456', kind: 'password_reset' });
  assert.deepEqual(resolveOneNativePath('one://dev-native?probe=1'), { route: '/dev-native?probe=1', kind: 'acceptance' });
  assert.deepEqual(resolveOneNativePath('expo-sharing://incoming'), { route: '/handle-share', kind: 'share' });
  assert.equal(resolveOneNativePath('%%%').kind, 'invalid');
});

test('native permission mapping distinguishes granted, not-requested, denied and unavailable', () => {
  assert.equal(mapNativePermissionState({ granted: true, status: 'granted', canAskAgain: true }), 'granted');
  assert.equal(mapNativePermissionState({ granted: false, status: 'undetermined', canAskAgain: true }), 'not_requested');
  assert.equal(mapNativePermissionState({ granted: false, status: 'denied', canAskAgain: false }), 'denied');
  assert.equal(mapNativePermissionState(null), 'unavailable');
});
