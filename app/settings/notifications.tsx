import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ensureNotificationPermissions, getNotificationPermissionStatus } from '@/src/notifications/localNotifications';
import { loadNotificationPreferences, saveNotificationPreferences, type ReminderLeadMinutes } from '@/src/storage/preferences';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Group, V5IconButton, V5LargeHeader, useNeverV5Palette } from '@/src/ui/appleV5';

const leadOptions: { value: ReminderLeadMinutes; label: string; detail: string }[] = [
  { value: 0, label: 'At time', detail: 'Notify when the item starts.' },
  { value: 10, label: '10 minutes before', detail: 'A short heads-up.' },
  { value: 30, label: '30 minutes before', detail: 'More time to prepare.' },
  { value: 60, label: '1 hour before', detail: 'Best for travel and appointments.' }
];

type PermissionState = 'loading' | 'granted' | 'undetermined' | 'denied' | 'unsupported';

export default function NotificationSettingsScreen() {
  const p = useNeverV5Palette();
  const [permission, setPermission] = useState<PermissionState>('loading');
  const [leadMinutes, setLeadMinutes] = useState<ReminderLeadMinutes>(10);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      const [status, preferences] = await Promise.all([getNotificationPermissionStatus(), loadNotificationPreferences()]);
      if (cancelled) return;
      setPermission(status);
      setLeadMinutes(preferences.leadMinutes);
    }
    async function refreshPermission() {
      const status = await getNotificationPermissionStatus();
      if (!cancelled) setPermission(status);
    }
    void loadSettings();
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void refreshPermission(); });
    return () => { cancelled = true; subscription.remove(); };
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
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <V5IconButton icon={icons.chevronLeft} accessibilityLabel="Go back" onPress={() => router.back()} />
          <Text style={[styles.navTitle, { color: p.label }]}>Notifications</Text>
          <View style={{ width: 38 }} />
        </View>

        <V5LargeHeader title="Notifications" subtitle="Useful reminders, without the noise." />

        <SettingsBlock title="Access">
          <View style={styles.permissionRow}>
            <View style={[styles.rowIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.bell} size={15} color={p.chrome} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permissionTitle, { color: p.label }]}>Notification Access</Text>
              <Text style={[styles.permissionBody, { color: p.secondary }]}>{permissionDescription(permission)}</Text>
            </View>
            {permission === 'loading' ? (
              <ActivityIndicator size="small" />
            ) : permission === 'granted' ? (
              <View style={styles.statusWrap}><View style={[styles.statusDot, { backgroundColor: p.success }]} /><Text style={[styles.statusText, { color: p.secondary }]}>On</Text></View>
            ) : permission !== 'unsupported' ? (
              <Pressable onPress={() => void handlePermissionAction()} style={({ pressed }) => [styles.enableButton, { backgroundColor: p.fill, opacity: pressed ? 0.62 : 1 }]}>
                <Text style={[styles.enableText, { color: p.label }]}>{permission === 'denied' ? 'Settings' : 'Enable'}</Text>
              </Pressable>
            ) : null}
          </View>
        </SettingsBlock>

        <SettingsBlock title="Default Timing">
          {leadOptions.map((option, index) => {
            const active = leadMinutes === option.value;
            return (
              <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => void chooseLead(option.value)} style={({ pressed }) => [styles.optionRow, index < leadOptions.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
                <View style={[styles.rowIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.clock} size={15} color={p.chrome} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: p.label }]}>{option.label}</Text>
                  <Text style={[styles.optionDetail, { color: p.secondary }]}>{option.detail}</Text>
                </View>
                <View style={[styles.radio, { borderColor: active ? p.chrome : p.tertiary, backgroundColor: active ? p.chrome : 'transparent' }]}>
                  {active ? <View style={[styles.radioInner, { backgroundColor: p.dark ? '#111113' : '#FFFFFF' }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </SettingsBlock>

        <View style={styles.note}><OneIcon name={icons.bell} size={12.5} color={p.chrome} /><Text style={[styles.noteText, { color: p.tertiary }]}>This timing is applied when a reminder is newly scheduled or edited. Individual items can still use their own reminder details.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );

  function SettingsBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return <View style={styles.section}><Text style={[styles.groupTitle, { color: p.secondary }]}>{title}</Text><V5Group>{children}</V5Group></View>;
  }
}

function permissionDescription(permission: PermissionState) {
  if (permission === 'loading') return 'Checking access…';
  if (permission === 'granted') return 'NEVER can schedule local reminders on this device.';
  if (permission === 'denied') return 'Access is off in iOS Settings.';
  if (permission === 'unsupported') return 'Notifications are not available on this platform.';
  return 'Enable access whenever you want NEVER to remind you.';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34, gap: 18 },
  nav: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: 16.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.18 },
  section: { gap: 6 },
  groupTitle: { paddingHorizontal: 4, fontSize: 12.5, lineHeight: 16, fontWeight: '500' },
  permissionRow: { minHeight: 72, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontSize: 15, lineHeight: 18, fontWeight: '600' },
  permissionBody: { marginTop: 2, fontSize: 12, lineHeight: 15.5 },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
  enableButton: { minHeight: 30, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  enableText: { fontSize: 11.5, lineHeight: 14, fontWeight: '600' },
  optionRow: { minHeight: 62, paddingHorizontal: 13, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionLabel: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  optionDetail: { marginTop: 1, fontSize: 11.5, lineHeight: 15 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.25, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 6, height: 6, borderRadius: 3 },
  note: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  noteText: { flex: 1, fontSize: 10.5, lineHeight: 14.5 }
});