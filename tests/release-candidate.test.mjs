import assert from 'node:assert/strict';
import test from 'node:test';

import {
  orphanedScheduledNotificationIds,
  reminderReconciliationAction
} from '../src/notifications/reconciliation.ts';
import { canApplyScopedSyncResult } from '../src/sync/merge.ts';

function reminder(overrides = {}) {
  return {
    id: 'reminder-1',
    type: 'reminder',
    date: '2026-09-15',
    completed: false,
    notificationId: 'native-1',
    ...overrides
  };
}

test('restart reconciliation keeps a reminder only when the native scheduler still owns its identifier', () => {
  assert.equal(
    reminderReconciliationAction(reminder(), new Set(['native-1'])),
    'keep'
  );
  assert.equal(
    reminderReconciliationAction(reminder(), new Set()),
    'schedule'
  );
});

test('scheduler lookup failure does not blindly replace an existing notification identifier', () => {
  assert.equal(reminderReconciliationAction(reminder(), null), 'keep');
});

test('completed or undated items clear obsolete native reminder state', () => {
  assert.equal(
    reminderReconciliationAction(reminder({ completed: true }), new Set(['native-1'])),
    'clear'
  );
  assert.equal(
    reminderReconciliationAction(reminder({ date: undefined }), new Set(['native-1'])),
    'clear'
  );
});

test('orphan cleanup removes stale, duplicate and previous-scope ONE notifications only', () => {
  const scheduled = [
    { identifier: 'native-1', itemId: 'reminder-1' },
    { identifier: 'native-duplicate', itemId: 'reminder-1' },
    { identifier: 'old-account', itemId: 'user-a-item' },
    { identifier: 'acceptance-test' }
  ];

  assert.deepEqual(
    orphanedScheduledNotificationIds(scheduled, [reminder()]).sort(),
    ['native-duplicate', 'old-account'].sort()
  );
});

test('account-scoped async work cannot apply after the active scope changes', () => {
  assert.equal(canApplyScopedSyncResult('user:user-a', 'user:user-a'), true);
  assert.equal(canApplyScopedSyncResult('user:user-a', 'user:user-b'), false);
  assert.equal(canApplyScopedSyncResult('user:user-a', 'anonymous'), false);
  assert.equal(canApplyScopedSyncResult('user:user-a', null), false);
});
