import test from 'node:test';
import assert from 'node:assert/strict';

import { authGateTarget } from '../src/auth/policy.ts';
import { completeMigration, planAnonymousMigration } from '../src/migration/policy.ts';
import {
  MAX_AUTO_SYNC_ATTEMPTS,
  buildSyncQueue,
  markDeletionFailure,
  markSyncFailure,
  markSyncSuccess,
  retryDelayMs,
  syncPresentationState
} from '../src/sync/queue.ts';
import { resolveCloudSnapshot } from '../src/sync/merge.ts';

function item(overrides = {}) {
  return {
    id: overrides.id || 'item-1',
    title: overrides.title || 'Memory',
    type: overrides.type || 'note',
    completed: overrides.completed ?? false,
    saved: overrides.saved ?? true,
    sourceType: overrides.sourceType || 'manual',
    tags: overrides.tags || [],
    entities: overrides.entities || [],
    createdAt: overrides.createdAt || '2026-09-14T10:00:00.000Z',
    updatedAt: overrides.updatedAt || '2026-09-14T10:00:00.000Z',
    ...overrides
  };
}

test('auth gate protects the application after onboarding and releases it after session restoration', () => {
  assert.equal(authGateTarget({ configured: true, sessionPresent: false, onboardingComplete: true, routeGroup: 'app' }), '/auth/sign-in');
  assert.equal(authGateTarget({ configured: true, sessionPresent: true, onboardingComplete: true, routeGroup: 'app' }), null);
  assert.equal(authGateTarget({ configured: true, sessionPresent: false, onboardingComplete: true, routeGroup: 'auth_signin' }), null);
});

test('auth recovery routes remain reachable while a recovery session is established', () => {
  assert.equal(authGateTarget({ configured: true, sessionPresent: false, onboardingComplete: true, routeGroup: 'auth_flow' }), null);
  assert.equal(authGateTarget({ configured: true, sessionPresent: true, onboardingComplete: true, routeGroup: 'auth_flow' }), null);
});

test('logout state returns a protected app route to sign in', () => {
  assert.equal(authGateTarget({ configured: true, sessionPresent: false, onboardingComplete: true, routeGroup: 'app' }), '/auth/sign-in');
});

test('anonymous migration preserves ids, is resumable and binds the source to one account', () => {
  const source = [item({ id: 'legacy', title: 'Legacy local memory', syncState: 'local' })];
  const first = planAnonymousMigration({ userId: 'user-a', anonymousItems: source, destinationItems: [], state: null, now: new Date('2026-09-14T12:00:00Z') });
  assert.equal(first.copied, true);
  assert.equal(first.items[0].id, 'legacy');
  assert.equal(first.items[0].syncState, 'pending');
  assert.equal(first.nextState?.ownerUserId, 'user-a');

  const resumed = planAnonymousMigration({ userId: 'user-a', anonymousItems: source, destinationItems: first.items, state: first.nextState });
  assert.equal(resumed.items.length, 1);
  assert.equal(resumed.blocked, false);

  const otherAccount = planAnonymousMigration({ userId: 'user-b', anonymousItems: source, destinationItems: [], state: first.nextState });
  assert.equal(otherAccount.blocked, true);
  assert.equal(otherAccount.items.length, 0);
});

test('migration only completes after cloud work has drained', () => {
  const state = {
    version: 1,
    ownerUserId: 'user-a',
    status: 'pending_cloud',
    sourceItemCount: 1,
    copiedAt: '2026-09-14T12:00:00.000Z'
  };
  assert.equal(completeMigration(state, 'user-a', 1)?.status, 'pending_cloud');
  assert.equal(completeMigration(state, 'user-a', 0, new Date('2026-09-14T12:05:00Z'))?.status, 'complete');
});

test('sync queue persists create/update and delete intent with deterministic retry backoff', () => {
  const failed = markSyncFailure(item({ id: 'pending', syncState: 'pending' }), new Date('2026-09-14T12:00:00Z'));
  assert.equal(failed.syncState, 'error');
  assert.equal(failed.syncAttemptCount, 1);
  assert.equal(retryDelayMs(1), 5000);
  assert.equal(buildSyncQueue([failed], [], new Date('2026-09-14T12:00:04Z')).length, 0);
  assert.deepEqual(buildSyncQueue([failed], [], new Date('2026-09-14T12:00:05Z')), [{ kind: 'upsert', itemId: 'pending', attempt: 1 }]);

  const deletion = markDeletionFailure({ id: 'gone', userId: 'user-a', deletedAt: '2026-09-14T12:00:00Z', attachmentPaths: [] }, new Date('2026-09-14T12:00:00Z'));
  assert.equal(buildSyncQueue([], [deletion], new Date('2026-09-14T12:00:05Z'))[0]?.kind, 'delete');
});

test('automatic retry stops at the bounded attempt ceiling', () => {
  const exhausted = item({
    id: 'exhausted',
    syncState: 'error',
    syncAttemptCount: MAX_AUTO_SYNC_ATTEMPTS,
    syncRetryAt: '2026-09-14T12:00:00.000Z'
  });
  assert.equal(buildSyncQueue([exhausted], [], new Date('2026-09-14T13:00:00Z')).length, 0);
});

test('sync success clears failure metadata and presentation remains truthful', () => {
  const failed = markSyncFailure(item({ syncState: 'pending' }));
  assert.equal(syncPresentationState([failed], false), 'problem');
  const synced = markSyncSuccess(failed);
  assert.equal(synced.syncState, 'synced');
  assert.equal(synced.syncErrorAt, undefined);
  assert.equal(syncPresentationState([synced], false), 'saved');
});

test('equal-timestamp divergent local pending content is preserved and uploaded instead of silently discarded', () => {
  const local = item({ id: 'conflict', title: 'Local user text', syncState: 'pending', updatedAt: '2026-09-14T12:00:00.000Z' });
  const cloud = item({ id: 'conflict', title: 'Cloud user text', syncState: 'synced', updatedAt: '2026-09-14T12:00:00.000Z' });
  const resolution = resolveCloudSnapshot([local], [cloud]);
  assert.equal(resolution.merged[0]?.title, 'Local user text');
  assert.equal(resolution.localToUpload[0]?.id, 'conflict');
});

test('newer divergent cloud content does not erase an unsynced local user edit', () => {
  const local = item({ id: 'conflict', title: 'Local unsynced edit', syncState: 'pending', updatedAt: '2026-09-14T12:00:00.000Z' });
  const cloud = item({ id: 'conflict', title: 'Newer cloud edit', syncState: 'synced', updatedAt: '2026-09-14T12:01:00.000Z' });
  const resolution = resolveCloudSnapshot([local], [cloud]);
  assert.equal(resolution.merged[0]?.title, 'Local unsynced edit');
  assert.equal(resolution.merged[0]?.syncConflictDetected, true);
  assert.equal(resolution.localToUpload.length, 0);
});
