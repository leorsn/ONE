import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { recordLastNativeError, recordNativeAcceptanceEvent } from '@/src/native/acceptance';
import type { ScheduledItemNotificationSnapshot } from '@/src/notifications/reconciliation';
import { getReminderDate } from '@/src/notifications/reminderDate';
import { loadNotificationPreferences } from '@/src/storage/preferences';
import type { OneItem, OneNotificationStatus } from '@/src/types/item';

export { getReminderDate } from '@/src/notifications/reminderDate';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export type NotificationScheduleResult = {
  status: OneNotificationStatus;
  notificationId?: string;
};

export async function getNotificationPermissionStatus() {
  if (Platform.OS === 'web') return 'unsupported' as const;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted' as const;
  if (current.canAskAgain) return 'undetermined' as const;
  return 'denied' as const;
}

export async function ensureNotificationPermissions() {
  if (Platform.OS === 'web') return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function getScheduledItemNotifications(): Promise<ScheduledItemNotificationSnapshot[] | null> {
  if (Platform.OS === 'web') return [];
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.map((entry) => ({
      identifier: entry.identifier,
      itemId:
        typeof entry.content.data?.itemId === 'string' && entry.content.data.itemId
          ? entry.content.data.itemId
          : undefined
    }));
  } catch (error) {
    await recordLastNativeError('notifications-list', error);
    return null;
  }
}

export async function getScheduledNotificationIds() {
  const scheduled = await getScheduledItemNotifications();
  return scheduled ? new Set(scheduled.map((entry) => entry.identifier)) : null;
}

export async function scheduleItemNotification(item: OneItem): Promise<NotificationScheduleResult> {
  if (!item.date) return { status: 'not_scheduled' };
  if (Platform.OS === 'web') return { status: 'unsupported' };

  try {
    const granted = await ensureNotificationPermissions();
    if (!granted) {
      await recordNativeAcceptanceEvent('notification_denied', item.type);
      return { status: 'permission_denied' };
    }

    const preferences = await loadNotificationPreferences();
    const triggerDate = getReminderDate(item, preferences.leadMinutes);
    if (!triggerDate || triggerDate.getTime() <= Date.now()) return { status: 'not_scheduled' };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title:
          item.time && preferences.leadMinutes > 0
            ? `${item.title} soon`
            : item.title,
        body: item.time
          ? `Starts at ${item.time}${item.location ? ` · ${item.location}` : ''}`
          : item.location || item.category || 'Saved in NEVER',
        data: {
          itemId: item.id
        }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate
      }
    });

    await recordNativeAcceptanceEvent('notification_scheduled', item.type);
    return { status: 'scheduled', notificationId };
  } catch (error) {
    console.warn('NEVER local reminder scheduling failed', error);
    await recordLastNativeError('notification-schedule', error);
    return { status: 'error' };
  }
}

export async function cancelItemNotification(notificationId?: string) {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    await recordNativeAcceptanceEvent('notification_cancelled');
  } catch (error) {
    console.warn('NEVER local reminder cancellation failed', error);
    await recordLastNativeError('notification-cancel', error);
  }
}
