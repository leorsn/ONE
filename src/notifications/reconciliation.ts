import { isRemindable } from './policy';
import type { OneItem } from '../types/item';

export type ReminderReconciliationAction = 'clear' | 'keep' | 'schedule';

export type ScheduledItemNotificationSnapshot = {
  identifier: string;
  itemId?: string;
};

export function reminderReconciliationAction(
  item: Pick<OneItem, 'type' | 'date' | 'completed' | 'notificationId'>,
  scheduledIds: ReadonlySet<string> | null
): ReminderReconciliationAction {
  if (!isRemindable(item)) return 'clear';
  if (!item.notificationId) return 'schedule';
  if (scheduledIds === null) return 'keep';
  return scheduledIds.has(item.notificationId) ? 'keep' : 'schedule';
}

export function orphanedScheduledNotificationIds(
  scheduled: ScheduledItemNotificationSnapshot[],
  items: Pick<OneItem, 'id' | 'type' | 'date' | 'completed' | 'notificationId'>[]
) {
  const expectedByItemId = new Map<string, string>();

  for (const item of items) {
    if (isRemindable(item) && item.notificationId) {
      expectedByItemId.set(item.id, item.notificationId);
    }
  }

  return scheduled
    .filter((entry) => entry.itemId && expectedByItemId.get(entry.itemId) !== entry.identifier)
    .map((entry) => entry.identifier);
}
