import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ensureNotificationPermissions,
  getNotificationPermissionStatus
} from '@/src/notifications/localNotifications';
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  type ReminderLeadMinutes
} from '@/src/storage/preferences';
import { IconTile, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const leadOptions: Array<{ value: ReminderLeadMinutes; label: string }> = [
  { value: 0, label: 'At time' },
  { value: 10, label: '10 min before' },
  { value: 30, label: '30 min before' },
  { value: 60, label: '1 hour before' }
];

type PermissionState = 'loading' | 'granted' | 'undetermined' | 'denied' | 'unsupported';

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const [permission, setPermission] = useState<PermissionState>('loading');
  const [leadMinutes, setLeadMinutes] = useState<ReminderLeadMinutes>(10);

  useEffect(() => {
    Promise.all([getNotificationPermissionStatus(), loadNotificationPreferences()]).then(
      ([status, preferences]) => {
        setPermission(status);
        setLeadMinutes(preferences.leadMinutes);
      }
    );
  }, []);

  async function requestPermission() {
    await Haptics.selectionAsync();
    const granted = await ensureNotificationPermissions();
    setPermission(granted ? 'granted' : await getNotificationPermissionStatus());
  }

  async function chooseLead(value: ReminderLeadMinutes) {
    await Haptics.selectionAsync();
    setLeadMinutes(value);
    await saveNotificationPreferences({ leadMinutes: value });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <IconTile icon={icons.bell} size={50} />
          <Text style={[styles.title, { color: theme.text }]}>Useful, not noisy.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            ONE only schedules reminders for items that have a date.
          </Text>
        </View>

        <Surface padded>
          <View style={styles.permissionRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permissionTitle, { color: theme.text }]}>Notification access</Text>
              <Text style={[styles.permissionBody, { color: theme.textSecondary }]}>
                {permissionDescription(permission)}
              </Text>
            </View>

            {permission === 'loading' ? (
              <ActivityIndicator size="small" />
            ) : permission === 'granted' ? (
              <View style={[styles.statusPill, { backgroundColor: theme.accentSoft }]}>
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.statusText, { color: theme.accent }]}>On</Text>
              </View>
            ) : permission !== 'unsupported' ? (
              <Pressable onPress={requestPermission} style={[styles.enableButton, { backgroundColor: theme.accent }]}>
                <Text style={styles.enableText}>Enable</Text>
              </Pressable>
            ) : null}
          </View>
        </Surface>

        <View style={styles.block}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Default timing</Text>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>
            Used when ONE schedules a reminder for a timed item.
          </Text>

          <Surface>
            {leadOptions.map((option, index) => {
              const active = leadMinutes === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => chooseLead(option.value)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    index < leadOptions.length - 1 && {
                      borderBottomColor: theme.border,
                      borderBottomWidth: StyleSheet.hairlineWidth
                    },
                    { opacity: pressed ? 0.62 : 1 }
                  ]}
                >
                  <OneIcon name={icons.clock} size={18} color={active ? theme.accent : theme.textSecondary} />
                  <Text style={[styles.optionLabel, { color: theme.text }]}>{option.label}</Text>
                  <View
                    style={[
                      styles.radio,
                      {
                        borderColor: active ? theme.accent : theme.fillStrong,
                        backgroundColor: active ? theme.accent : 'transparent'
                      }
                    ]}
                  >
                    {active ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </Surface>

          <Text style={[styles.note, { color: theme.textTertiary }]}>
            This preference applies when reminders are newly scheduled or edited.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function permissionDescription(permission: PermissionState) {
  if (permission === 'loading') return 'Checking access…';
  if (permission === 'granted') return 'ONE can schedule local reminders.';
  if (permission === 'denied') return 'Access is off in system settings.';
  if (permission === 'unsupported') return 'Notifications are not available on this platform.';
  return 'Enable access when you want ONE to remind you.';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8, gap: 24 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  hero: { alignItems: 'center', paddingTop: 10 },
  title: { marginTop: 14, fontSize: 27, lineHeight: 32, fontWeight: '800', letterSpacing: -0.7, textAlign: 'center' },
  subtitle: { marginTop: 8, maxWidth: 320, fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  permissionRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  permissionTitle: { fontSize: 15, fontWeight: '700' },
  permissionBody: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  statusPill: { minHeight: 30, borderRadius: 11, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  enableButton: { minHeight: 34, borderRadius: 12, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  enableText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  block: { gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionBody: { fontSize: 12.5, lineHeight: 18, marginBottom: 3 },
  optionRow: { minHeight: 58, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11 },
  optionLabel: { flex: 1, fontSize: 14.5, fontWeight: '600' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  note: { marginTop: 2, fontSize: 11.5, lineHeight: 16 }
});
