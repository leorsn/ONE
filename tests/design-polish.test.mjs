import test from 'node:test';
import assert from 'node:assert/strict';
import { shiftCalendarMonth } from '../src/ui/calendarPresentation.ts';
import { memoryDateLabel } from '../src/ui/memoryPresentation.ts';

test('calendar month navigation clamps Jan 31 to February instead of skipping a month', () => {
  assert.equal(shiftCalendarMonth('2026-01-31', 1), '2026-02-28');
  assert.equal(shiftCalendarMonth('2024-01-31', 1), '2024-02-29');
});
test('calendar month navigation works backward and across year boundaries', () => {
  assert.equal(shiftCalendarMonth('2026-03-31', -1), '2026-02-28');
  assert.equal(shiftCalendarMonth('2026-12-31', 1), '2027-01-31');
  assert.equal(shiftCalendarMonth('2026-01-15', -1), '2025-12-15');
});
test('imported memories with missing or invalid timestamps still render a readable label', () => {
  for (const value of [undefined, '', 'not-a-date', '2026-99-99']) {
    assert.equal(memoryDateLabel(value), 'Date unavailable');
    assert.equal(memoryDateLabel(value, true), 'Date unavailable');
  }
});
test('date-only labels preserve the local calendar day', () => {
  assert.equal(memoryDateLabel('2026-09-21'), 'Sep 21');
  assert.match(memoryDateLabel('2026-09-21T12:00:00Z', true), /Sep 21/);
});
