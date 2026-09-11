import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { recordLastNativeError, recordNativeAcceptanceEvent } from '@/src/native/acceptance';
import { loadNotificationPreferences } from '@/src/storage/preferences';
import type { OneItem, OneNotificationStatus } from '@/src/types/item';

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

export async function getScheduledNotificationIds() {
  if (Platform.OS === 'web') return new Set<string>();
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return new Set(scheduled.map((entry) => entry.identifier));
  } catch (error) {
    await recordLastNativeError('notifications-list', error);
    return null;
  }
}

export function getReminderDate(
  item: Pick<OneItem, 'date' | 'time'>,
  leadMinutes = 10
) {
  if (!item.date) return null;

  const [year, month, day] = item.date.split('-').map(Number);
  const [hour, minute] = (item.time || '09:00').split(':').map(Number);
  // Deliberately uses the device's local timezone. ONE stores wall-clock date/time
  // separately so a user's 18:00 reminder remains 18:00 in the active locale.
  const eventDate = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (item.time && leadMinutes > 0) {
    eventDate.setMinutes(eventDate.getMinutes() - leadMinutes);
  }

  return eventDate;
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
          : item.location || item.category || 'Saved in ONE',
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
    console.warn('ONE local reminder scheduling failed', error);
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
    console.warn('ONE local reminder cancellation failed', error);
    await recordLastNativeError('notification-cancel', error);
  }
}
