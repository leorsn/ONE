import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_KEY = '@one/notifications/v1';

export type ReminderLeadMinutes = 0 | 10 | 30 | 60;

export type NotificationPreferences = {
  leadMinutes: ReminderLeadMinutes;
};

const defaults: NotificationPreferences = {
  leadMinutes: 10
};

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  const raw = await AsyncStorage.getItem(NOTIFICATION_KEY);
  if (!raw) return defaults;

  try {
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    const leadMinutes =
      parsed.leadMinutes === 0 ||
      parsed.leadMinutes === 10 ||
      parsed.leadMinutes === 30 ||
      parsed.leadMinutes === 60
        ? parsed.leadMinutes
        : defaults.leadMinutes;

    return { leadMinutes };
  } catch {
    return defaults;
  }
}

export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  await AsyncStorage.setItem(NOTIFICATION_KEY, JSON.stringify(preferences));
}
