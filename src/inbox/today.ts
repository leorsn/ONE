import { isInboxActive, triageStateForItem } from './triage.ts';
import type { OneItem } from '../types/item';

export type TodayReason = 'overdue' | 'today_reminder' | 'today_event' | 'actionable' | 'needs_review';

export type TodayEntry = {
  item: OneItem;
  reason: TodayReason;
  priority: number;
};

export function buildTodayEntries(items: OneItem[], now = new Date()): TodayEntry[] {
  const today = toIsoDate(now);
  const entries = new Map<string, TodayEntry>();

  function add(item: OneItem, reason: TodayReason, priority: number) {
    const current = entries.get(item.id);
    if (!current || priority < current.priority) entries.set(item.id, { item, reason, priority });
  }

  for (const item of items) {
    if (item.completed || triageStateForItem(item) === 'archived') continue;

    const reminderLike = item.kind === 'reminder' || item.type === 'reminder' || item.type === 'task';
    const eventLike = item.kind === 'event' || item.type === 'appointment' || item.type === 'event';

    if (reminderLike && item.date && item.date < today) add(item, 'overdue', 0);
    else if (reminderLike && item.date === today) add(item, 'today_reminder', 1);
    else if (eventLike && item.date === today) add(item, 'today_event', 2);

    if (isInboxActive(item, now)) {
      const state = triageStateForItem(item);
      if (state === 'needs_review') add(item, 'needs_review', 3);
      else if (state === 'actionable') add(item, 'actionable', 4);
    }
  }

  return Array.from(entries.values()).sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const aTime = `${a.item.date || today}T${a.item.time || '23:59'}`;
    const bTime = `${b.item.date || today}T${b.item.time || '23:59'}`;
    if (aTime !== bTime) return aTime.localeCompare(bTime);
    return new Date(b.item.updatedAt).getTime() - new Date(a.item.updatedAt).getTime();
  });
}

export function todayReasonLabel(reason: TodayReason) {
  if (reason === 'overdue') return 'Overdue';
  if (reason === 'today_reminder') return 'Reminder today';
  if (reason === 'today_event') return 'Today';
  if (reason === 'needs_review') return 'Needs review';
  return 'Actionable';
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
