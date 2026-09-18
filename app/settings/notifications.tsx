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
import { NeverSignal, SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';

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
            style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.chevronLeft} size={16} color={theme.text} />
          </Pressable>
          <View style={styles.navBrand}>
            <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
            <NeverSignal compact />
          </View>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>NOTIFICATIONS</Text>
          <Text style={[styles.title, { color: theme.text }]}>Useful, not noisy.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>NEVER only reminds you about information that has a date. You stay in control of when those reminders arrive.</Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Access" />
          <View style={[styles.permissionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.memoryGlyph, { borderColor: theme.border }]}>
              <OneIcon name={icons.bell} size={17} color={theme.sky} />
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
                style={({ pressed }) => [styles.enableButton, { backgroundColor: theme.chrome, opacity: pressed ? 0.72 : 1 }]}
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
                  <View style={[styles.memoryGlyph, { borderColor: theme.border }]}>
                    <OneIcon name={icons.clock} size={16} color={active ? theme.sky : theme.textSecondary} />
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

          <View style={styles.note}>
            <OneIcon name={icons.bell} size={12.5} color={theme.sky} />
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
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 36,
    gap: 22
  },
  nav: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 38, height: 38, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark: { fontSize: 10.75, fontWeight: '700', letterSpacing: 3.2 },
  hero: { paddingTop: 8, paddingBottom: 2 },
  eyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 2 },
  title: { marginTop: 10, maxWidth: 520, fontFamily: editorialFontFamily, fontSize: 31, lineHeight: 35, fontWeight: '400', letterSpacing: -0.8 },
  subtitle: { marginTop: 8, maxWidth: 530, fontSize: 12.5, lineHeight: 18.5 },
  section: { gap: 9 },
  permissionCard: {
    minHeight: 76,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11
  },
  memoryGlyph: { width: 27, height: 34, borderLeftWidth: 2, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontSize: 13.75, lineHeight: 17.5, fontWeight: '600', letterSpacing: -0.07 },
  permissionBody: { marginTop: 3, fontSize: 11, lineHeight: 15.5 },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10.5, fontWeight: '600' },
  enableButton: { minHeight: 32, borderRadius: 10, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  enableText: { fontSize: 11.25, fontWeight: '600' },
  optionRow: { minHeight: 66, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionLabel: { fontSize: 13.5, lineHeight: 17, fontWeight: '600' },
  optionDetail: { marginTop: 3, fontSize: 10.5, lineHeight: 14.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.35, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 6.5, height: 6.5, borderRadius: 4 },
  note: { paddingTop: 2, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteText: { flex: 1, fontSize: 10.25, lineHeight: 14.5 }
});
