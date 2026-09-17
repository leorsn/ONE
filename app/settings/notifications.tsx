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
import { SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const leadOptions: { value: ReminderLeadMinutes; label: string; detail: string }[] = [
  { value: 0, label: 'At time', detail: 'Notify when the item starts.' },
  { value: 10, label: '10 minutes before', detail: 'A short heads-up.' },
  { value: 30, label: '30 minutes before', detail: 'More time to prepare.' },
  { value: 60, label: '1 hour before', detail: 'Best for travel and appointments.' }
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
            style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.chevronLeft} size={17} color={theme.text} />
          </Pressable>
          <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.chrome }]}>NOTIFICATIONS</Text>
          <Text style={[styles.title, { color: theme.text }]}>Useful, not noisy.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>NEVER only reminds you about information that has a date. You stay in control of when those reminders arrive.</Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Access" />
          <View style={[styles.permissionCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={[styles.permissionIcon, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
              <OneIcon name={icons.bell} size={18} color={theme.chrome} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permissionTitle, { color: theme.text }]}>Notification access</Text>
              <Text style={[styles.permissionBody, { color: theme.textSecondary }]}>{permissionDescription(permission)}</Text>
            </View>

            {permission === 'loading' ? (
              <ActivityIndicator size="small" />
            ) : permission === 'granted' ? (
              <View style={styles.statusWrap}>
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>On</Text>
              </View>
            ) : permission !== 'unsupported' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={permission === 'denied' ? 'Open system notification settings' : 'Enable notifications'}
                onPress={() => void handlePermissionAction()}
                style={({ pressed }) => [styles.enableButton, { backgroundColor: theme.accent, opacity: pressed ? 0.72 : 1 }]}
              >
                <Text style={[styles.enableText, { color: theme.onAccent }]}>{permission === 'denied' ? 'Settings' : 'Enable'}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Default timing" />
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
                  <View style={[styles.clockTile, { backgroundColor: theme.fill, borderColor: theme.border }]}>
                    <OneIcon name={icons.clock} size={15} color={active ? theme.chrome : theme.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, { color: theme.text }]}>{option.label}</Text>
                    <Text style={[styles.optionDetail, { color: theme.textSecondary }]}>{option.detail}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: active ? theme.chrome : theme.fillStrong, backgroundColor: active ? theme.chrome : 'transparent' }]}>
                    {active ? <View style={[styles.radioInner, { backgroundColor: theme.background }]} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </Surface>

          <View style={[styles.note, { borderTopColor: theme.border }]}>
            <OneIcon name={icons.bell} size={13} color={theme.chrome} />
            <Text style={[styles.noteText, { color: theme.textTertiary }]}>This timing is applied when a reminder is newly scheduled or edited. Individual items can still use their own reminder details.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function permissionDescription(permission: PermissionState) {
  if (permission === 'loading') return 'Checking access…';
  if (permission === 'granted') return 'NEVER can schedule local reminders on this device.';
  if (permission === 'denied') return 'Access is off in system settings. Open Settings to turn it back on.';
  if (permission === 'unsupported') return 'Notifications are not available on this platform.';
  return 'Enable access whenever you want NEVER to remind you.';
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
  nav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 11, fontWeight: '600', letterSpacing: 3.2 },
  hero: { paddingTop: 10, paddingBottom: 3 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.1 },
  title: { marginTop: 11, maxWidth: 520, fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  subtitle: { marginTop: 9, maxWidth: 530, fontSize: 13, lineHeight: 19.5 },
  section: { gap: 10 },
  permissionCard: {
    minHeight: 84,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOpacity: 0.03,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1
  },
  permissionIcon: { width: 38, height: 38, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontSize: 14, lineHeight: 18, fontWeight: '600', letterSpacing: -0.08 },
  permissionBody: { marginTop: 4, fontSize: 11.25, lineHeight: 16 },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10.75, fontWeight: '600' },
  enableButton: { minHeight: 34, borderRadius: 13, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  enableText: { fontSize: 11.5, fontWeight: '600' },
  optionRow: { minHeight: 72, paddingHorizontal: 15, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 11 },
  clockTile: { width: 34, height: 34, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontSize: 13.75, lineHeight: 17.5, fontWeight: '600' },
  optionDetail: { marginTop: 3, fontSize: 10.75, lineHeight: 15 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.4, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 7, height: 7, borderRadius: 4 },
  note: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteText: { flex: 1, fontSize: 10.5, lineHeight: 15 }
});