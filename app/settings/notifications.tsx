import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

const leadOptions: { value: ReminderLeadMinutes; label: string }[] = [
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
    let cancelled = false;

    async function loadSettings() {
      const [status, preferences] = await Promise.all([
        getNotificationPermissionStatus(),
        loadNotificationPreferences()
      ]);
      if (cancelled) return;
      setPermission(status);
      setLeadMinutes(preferences.leadMinutes);
    }

    async function refreshPermission() {
      const status = await getNotificationPermissionStatus();
      if (!cancelled) setPermission(status);
    }

    void loadSettings();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPermission();
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  async function handlePermissionAction() {
    await Haptics.selectionAsync();

    if (permission === 'denied') {
      await Linking.openSettings();
      return;
    }

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={[styles.navButton, { backgroundColor: theme.fill, borderColor: theme.border }]}
          >
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <IconTile icon={icons.bell} size={50} />
          <Text style={[styles.title, { color: theme.text }]}>Useful, not noisy.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>NEVER only schedules reminders for items that have a date.</Text>
        </View>

        <Surface padded>
          <View style={styles.permissionRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permissionTitle, { color: theme.text }]}>Notification access</Text>
              <Text style={[styles.permissionBody, { color: theme.textSecondary }]}>{permissionDescription(permission)}</Text>
            </View>

            {permission === 'loading' ? (
              <ActivityIndicator size="small" />
            ) : permission === 'granted' ? (
              <View style={[styles.statusPill, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.statusText, { color: theme.text }]}>On</Text>
              </View>
            ) : permission !== 'unsupported' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={permission === 'denied' ? 'Open system notification settings' : 'Enable notifications'}
                onPress={() => void handlePermissionAction()}
                style={({ pressed }) => [styles.enableButton, { backgroundColor: theme.accent, opacity: pressed ? 0.72 : 1 }]}
              >
                <Text style={[styles.enableText, { color: theme.onAccent }]}>{permission === 'denied' ? 'Open Settings' : 'Enable'}</Text>
              </Pressable>
            ) : null}
          </View>
        </Surface>

        <View style={styles.block}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Default timing</Text>
          <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>Used when NEVER schedules a reminder for a timed item.</Text>

          <Surface>
            {leadOptions.map((option, index) => {
              const active = leadMinutes === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={option.label}
                  onPress={() => void chooseLead(option.value)}
                  style={({ pressed }) => [
                    styles.optionRow,
                    index < leadOptions.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    { opacity: pressed ? 0.58 : 1 }
                  ]}
                >
                  <OneIcon name={icons.clock} size={18} color={active ? theme.chrome : theme.textSecondary} />
                  <Text style={[styles.optionLabel, { color: theme.text }]}>{option.label}</Text>
                  <View style={[styles.radio, { borderColor: active ? theme.chrome : theme.fillStrong, backgroundColor: active ? theme.chrome : 'transparent' }]}>
                    {active ? <View style={[styles.radioInner, { backgroundColor: theme.background }]} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </Surface>

          <Text style={[styles.note, { color: theme.textTertiary }]}>This preference applies when reminders are newly scheduled or edited.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function permissionDescription(permission: PermissionState) {
  if (permission === 'loading') return 'Checking access…';
  if (permission === 'granted') return 'NEVER can schedule local reminders.';
  if (permission === 'denied') return 'Access is off in system settings. Open Settings to turn it back on.';
  if (permission === 'unsupported') return 'Notifications are not available on this platform.';
  return 'Enable access when you want NEVER to remind you.';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    gap: 26
  },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.1 },
  hero: { alignItems: 'center', paddingTop: 12 },
  title: { marginTop: 15, fontSize: 27, lineHeight: 32, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { marginTop: 8, maxWidth: 360, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  permissionRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12 },
  permissionTitle: { fontSize: 14.5, fontWeight: '700' },
  permissionBody: { marginTop: 4, fontSize: 11.75, lineHeight: 17 },
  statusPill: { minHeight: 30, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  enableButton: { minHeight: 36, borderRadius: 18, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  enableText: { fontSize: 12, fontWeight: '700' },
  block: { gap: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.25 },
  sectionBody: { fontSize: 12.25, lineHeight: 18, marginBottom: 3 },
  optionRow: { minHeight: 60, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11 },
  optionLabel: { flex: 1, fontSize: 14.25, fontWeight: '600' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  note: { marginTop: 2, fontSize: 11.5, lineHeight: 16 }
});