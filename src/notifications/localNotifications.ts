import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { OneItem } from '@/src/types/item';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export async function ensureNotificationPermissions() {
  if (Platform.OS === 'web') return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export function getReminderDate(item: Pick<OneItem, 'date' | 'time'>) {
  if (!item.date) return null;

  const [year, month, day] = item.date.split('-').map(Number);
  const [hour, minute] = (item.time || '09:00').split(':').map(Number);
  const eventDate = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (item.time) {
    eventDate.setMinutes(eventDate.getMinutes() - 10);
  }

  return eventDate;
}

export async function scheduleItemNotification(item: OneItem) {
  if (Platform.OS === 'web') return undefined;

  const granted = await ensureNotificationPermissions();
  if (!granted) return undefined;

  const triggerDate = getReminderDate(item);
  if (!triggerDate || triggerDate.getTime() <= Date.now()) return undefined;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: item.time ? `${item.title} soon` : item.title,
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
}

export async function cancelItemNotification(notificationId?: string) {
  if (!notificationId || Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
