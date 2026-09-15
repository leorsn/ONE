import assert from 'node:assert/strict';
import test from 'node:test';

import {
  orphanedScheduledNotificationIds,
  reminderReconciliationAction
} from '../src/notifications/reconciliation.ts';
import { notificationTransition } from '../src/notifications/policy.ts';
import { fallbackPlanForRuntime, isDevelopmentBetaAccess } from '../src/subscription/access.ts';
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

test('editing reminder wall-clock data reschedules while completion cancels the same canonical reminder', () => {
  const previous = {
    type: 'reminder',
    date: '2026-09-15',
    time: '14:00',
    location: 'Office',
    title: 'Call Max',
    completed: false,
    notificationId: 'native-1'
  };
  assert.equal(notificationTransition(previous, { ...previous, time: '15:00' }), 'reschedule');
  assert.equal(notificationTransition(previous, { ...previous, completed: true }), 'cancel');
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

test('missing RevenueCat configuration unlocks ONE AI only in development clients', () => {
  assert.equal(fallbackPlanForRuntime(true), 'one_ai');
  assert.equal(isDevelopmentBetaAccess(true, false), true);
  assert.equal(fallbackPlanForRuntime(false), 'none');
  assert.equal(isDevelopmentBetaAccess(false, false), false);
});
