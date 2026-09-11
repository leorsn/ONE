import type { OneItem } from '@/src/types/item';

export function notificationDeliveryLabel(item: Pick<OneItem, 'notificationStatus'>) {
  if (item.notificationStatus === 'scheduled') return 'Reminder on';
  if (item.notificationStatus === 'permission_denied') return 'Notifications off';
  if (item.notificationStatus === 'unsupported') return 'Notifications unavailable';
  if (item.notificationStatus === 'error') return 'Reminder failed';
  if (item.notificationStatus === 'not_scheduled') return 'Reminder not scheduled';
  return undefined;
}

export function notificationSaveWarning(
  item: Pick<OneItem, 'type' | 'date' | 'notificationStatus'>
) {
  const actionable = ['task', 'reminder', 'appointment', 'event'].includes(item.type) && Boolean(item.date);
  if (!actionable) return undefined;

  if (item.notificationStatus === 'permission_denied') {
    return 'Saved to ONE, but notification permission is off. You can enable reminders in Settings.';
  }
  if (item.notificationStatus === 'unsupported') {
    return 'Saved to ONE. Local reminder delivery is not available on this platform.';
  }
  if (item.notificationStatus === 'error') {
    return 'Saved to ONE, but the local reminder could not be scheduled.';
  }
  if (item.notificationStatus === 'not_scheduled') {
    return 'Saved to ONE, but there is no future notification scheduled for this item.';
  }
  return undefined;
}
