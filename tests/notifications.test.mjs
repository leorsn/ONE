import test from 'node:test';
import assert from 'node:assert/strict';

import { getReminderDate } from '../src/notifications/reminderDate.ts';
import { isRemindable } from '../src/notifications/policy.ts';

test('timed reminder keeps local wall-clock time and subtracts lead minutes', () => {
  const reminder = getReminderDate({ date: '2026-09-23', time: '18:00' }, 30);
  assert.ok(reminder);
  assert.equal(reminder.getFullYear(), 2026);
  assert.equal(reminder.getMonth(), 8);
  assert.equal(reminder.getDate(), 23);
  assert.equal(reminder.getHours(), 17);
  assert.equal(reminder.getMinutes(), 30);
});

test('day-only reminder defaults to 09:00 and does not apply lead time', () => {
  const reminder = getReminderDate({ date: '2026-09-23', time: undefined }, 60);
  assert.ok(reminder);
  assert.equal(reminder.getHours(), 9);
  assert.equal(reminder.getMinutes(), 0);
});

test('invalid calendar dates are rejected instead of normalized by JavaScript', () => {
  assert.equal(getReminderDate({ date: '2026-02-31', time: '12:00' }, 10), null);
  assert.equal(getReminderDate({ date: '2026-13-01', time: '12:00' }, 10), null);
  assert.equal(getReminderDate({ date: 'not-a-date', time: '12:00' }, 10), null);
});

test('invalid wall-clock times are rejected before native scheduling', () => {
  assert.equal(getReminderDate({ date: '2026-09-23', time: '24:00' }, 10), null);
  assert.equal(getReminderDate({ date: '2026-09-23', time: '18:75' }, 10), null);
  assert.equal(getReminderDate({ date: '2026-09-23', time: '6pm' }, 10), null);
});

test('invalid lead values never move a reminder into an unexpected direction', () => {
  const negative = getReminderDate({ date: '2026-09-23', time: '18:00' }, -30);
  const nonFinite = getReminderDate({ date: '2026-09-23', time: '18:00' }, Number.NaN);
  assert.ok(negative);
  assert.ok(nonFinite);
  assert.equal(negative.getHours(), 18);
  assert.equal(negative.getMinutes(), 0);
  assert.equal(nonFinite.getHours(), 18);
  assert.equal(nonFinite.getMinutes(), 0);
});

test('notification policy rejects invalid date and time values before reconciliation', () => {
  assert.equal(isRemindable({ type: 'reminder', date: '2026-09-23', time: '18:00', completed: false }), true);
  assert.equal(isRemindable({ type: 'reminder', date: '2026-02-31', time: '18:00', completed: false }), false);
  assert.equal(isRemindable({ type: 'reminder', date: '2026-09-23', time: '25:00', completed: false }), false);
  assert.equal(isRemindable({ type: 'note', date: '2026-09-23', time: '18:00', completed: false }), false);
  assert.equal(isRemindable({ type: 'reminder', date: '2026-09-23', time: '18:00', completed: true }), false);
});
