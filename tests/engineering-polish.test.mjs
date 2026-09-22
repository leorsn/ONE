import assert from 'node:assert/strict';
import test from 'node:test';
import { applyItemResult, rebaseItemSnapshot } from '../src/sync/inFlight.ts';
import { decodeStoredItems } from '../src/storage/validation.ts';
import { safeMemoryUrl } from '../src/ui/linkPolicy.ts';
import { resolveOneNativePath } from '../src/native/deepLinks.ts';
import { groupDocumentsByMonth } from '../src/documents/analytics.ts';

function memory(overrides = {}) {
  return { id: 'one', title: 'Original', type: 'note', sourceType: 'manual', saved: true, completed: false, tags: [], entities: [], createdAt: '2026-09-22T09:00:00Z', updatedAt: '2026-09-22T09:00:00Z', ...overrides };
}

test('late upload success or failure cannot overwrite an edit or recreate a deleted memory', () => {
  const submitted = memory();
  const edited = { ...submitted, title: 'New edit' };
  for (const syncState of ['synced', 'error']) {
    const result = { ...submitted, syncState };
    assert.equal(applyItemResult([submitted], submitted, result)[0], result);
    assert.equal(applyItemResult([edited], submitted, result)[0], edited);
    assert.deepEqual(applyItemResult([], submitted, result), []);
  }
});

test('async reconciliation preserves additions, edits and deletions made while waiting', () => {
  const original = memory();
  const removed = memory({ id: 'removed' });
  const edited = { ...original, title: 'Edited during sync' };
  const added = memory({ id: 'added' });
  const remote = memory({ id: 'remote' });
  const result = rebaseItemSnapshot([original, removed], [{ ...original, notificationId: 'scheduled' }, removed, remote], [edited, added]);
  assert.deepEqual(new Set(result.map((item) => item.id)), new Set(['one', 'added', 'remote']));
  assert.equal(result.find((item) => item.id === 'one'), edited);
});

test('remote deletion only removes an unchanged local revision', () => {
  const original = memory();
  assert.deepEqual(rebaseItemSnapshot([original], [], [original]), []);
  const edited = { ...original, title: 'Keep this edit' };
  assert.deepEqual(rebaseItemSnapshot([original], [], [edited]), [edited]);
});

test('unreadable stored data throws instead of being replaced with an empty collection', () => {
  for (const raw of ['{', 'null', '{}', '[null]', JSON.stringify([memory({ title: 3 })]), JSON.stringify([memory({ tags: [42] })]), JSON.stringify([memory(), memory()])]) {
    assert.throws(() => decodeStoredItems(raw));
  }
  assert.deepEqual(decodeStoredItems('[]'), []);
  assert.deepEqual(decodeStoredItems(JSON.stringify([memory()])), [memory()]);
  const legacy = memory(); delete legacy.tags; delete legacy.entities;
  assert.deepEqual(decodeStoredItems(JSON.stringify([legacy]))[0].tags, []);
});

test('captured web links preserve fragments and exact host; executable and credential URLs are blocked', () => {
  assert.equal(safeMemoryUrl('https://www.example.com/path/#chapter'), 'https://www.example.com/path/#chapter');
  for (const value of ['javascript:alert(1)', 'file:///private/data', 'one://auth/callback', 'data:text/html,test', 'https://user:password@example.com', 'not a link']) assert.equal(safeMemoryUrl(value), undefined);
});

test('native handoff rejects malformed encoding and oversized input before route parsing', () => {
  for (const path of ['one://auth/callback?code=%E0%A4', 'one://x?value=' + '%41'.repeat(10000), '/search?x=\u0000']) assert.equal(resolveOneNativePath(path).kind, 'invalid');
  assert.equal(resolveOneNativePath('one://auth/callback?code=valid%20code').route, '/auth/callback?code=valid%20code');
});

test('document grouping remains usable for imported invalid dates', () => {
  const groups = groupDocumentsByMonth([memory({ type: 'document', date: 'invalid-date', createdAt: 'invalid-date' })]);
  assert.equal(groups[0].label, 'Date unavailable');
});

// Native extensions may deliver several independent files in one handoff.
const { selectPendingShareCandidate } = await import('../src/native/sharePayload.ts');
test('saving one attachment keeps the remaining native share candidates addressable', () => {
  const payloads = [{ shareType: 'image', value: 'first' }, { shareType: 'image', value: 'second' }, { shareType: 'url', value: 'https://example.com' }];
  const resolved = [{ contentType: 'image', contentUri: 'file:///first' }, { contentType: 'image', contentUri: 'file:///second' }];
  const completed = [];
  for (let index = 0; index < 3; index++) {
    const candidate = selectPendingShareCandidate(payloads, resolved, completed);
    assert.equal(candidate.index, index);
    completed.push(candidate.index);
  }
  assert.equal(selectPendingShareCandidate(payloads, resolved, completed), undefined);
});
