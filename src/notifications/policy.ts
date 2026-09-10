import type { OneItem } from '../types/item';

export type NotificationTransition = 'none' | 'cancel' | 'schedule' | 'reschedule';

export function isRemindable(item: Pick<OneItem, 'type' | 'date' | 'completed'>) {
  return Boolean(
    item.date &&
    !item.completed &&
    ['task', 'reminder', 'appointment', 'event'].includes(item.type)
  );
}

export function notificationTransition(
  previous: Pick<OneItem, 'type' | 'date' | 'time' | 'location' | 'title' | 'completed' | 'notificationId'>,
  next: Pick<OneItem, 'type' | 'date' | 'time' | 'location' | 'title' | 'completed'>
): NotificationTransition {
  const had = Boolean(previous.notificationId);
  const shouldHave = isRemindable(next);

  if (had && !shouldHave) return 'cancel';
  if (!had && shouldHave) return 'schedule';
  if (!had && !shouldHave) return 'none';

  const changed =
    previous.type !== next.type ||
    previous.date !== next.date ||
    previous.time !== next.time ||
    previous.location !== next.location ||
    previous.title !== next.title ||
    previous.completed !== next.completed;

  return changed ? 'reschedule' : 'none';
}
