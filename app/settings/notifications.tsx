import { goBackOrHome } from '@/src/ui/navigation';
import { NeverNotice } from '@/src/ui/NeverNotice';
import { NeverSettingsSection, NeverNavigation } from '@/src/ui/utility';
import { neverType } from '@/src/theme/tokens';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ensureNotificationPermissions, getNotificationPermissionStatus } from '@/src/notifications/localNotifications';
import { loadNotificationPreferences, saveNotificationPreferences, type ReminderLeadMinutes } from '@/src/storage/preferences';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5LargeHeader, useNeverV5Palette } from '@/src/ui/appleV5';

const leadOptions: { value: ReminderLeadMinutes; label: string; detail: string }[] = [
  { value: 0, label: 'At time', detail: 'Notify when the item starts.' },
  { value: 10, label: '10 minutes before', detail: 'A short heads-up.' },
  { value: 30, label: '30 minutes before', detail: 'More time to prepare.' },
  { value: 60, label: '1 hour before', detail: 'Best for travel and appointments.' }
];

type PermissionState = 'loading' | 'granted' | 'undetermined' | 'denied' | 'unsupported' | 'error';

export default function NotificationSettingsScreen() {
  const p = useNeverV5Palette();
  const [permission, setPermission] = useState<PermissionState>('loading');
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [leadMinutes, setLeadMinutes] = useState<ReminderLeadMinutes>(10);

  useEffect(() => {
    let cancelled = false;
    async function loadSettings() {
      const [status, preferences] = await Promise.all([getNotificationPermissionStatus(), loadNotificationPreferences()]);
      if (cancelled) return;
      setPermission(status);
      setLeadMinutes(preferences.leadMinutes);
      setPreferencesReady(true);
    }
    async function refreshPermission() {
      const status = await getNotificationPermissionStatus();
      if (!cancelled) setPermission(status);
    }
    void loadSettings().catch(() => { if (!cancelled) { setPermission('error'); setError('Could not load notification preferences. Please try again.'); } });
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void refreshPermission().catch(() => { if (!cancelled) setError('Could not check notification access. Please try again.'); }); });
    return () => { cancelled = true; subscription.remove(); };
  }, [reload]);

  async function handlePermissionAction() {
    void Haptics.selectionAsync().catch(() => undefined);
    setError(null);
    try {
    if (permission === 'denied') {
      await Linking.openSettings();
      return;
    }
    const granted = await ensureNotificationPermissions();
    setPermission(granted ? 'granted' : await getNotificationPermissionStatus());
    } catch { setError('Could not open notification settings. Please try again.'); }
  }

  async function chooseLead(value: ReminderLeadMinutes) {
    void Haptics.selectionAsync().catch(() => undefined);
    if (saving || !preferencesReady) return;
    setSaving(true);
    setError(null);
    try { await saveNotificationPreferences({ leadMinutes: value }); setLeadMinutes(value); }
    catch { setError('Could not save reminder timing. Your previous setting is unchanged.'); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <NeverNavigation title="Notifications" onBack={() => goBackOrHome()} />

        <V5LargeHeader title="Notifications" subtitle="Useful reminders, without the noise." />

        {error ? <NeverNotice tone="error" title="Notifications need attention" body={error} action="Try again" onAction={() => { setError(null); setPermission('loading'); setReload((value) => value + 1); }} /> : null}
        <NeverSettingsSection title="Access">
          <View style={styles.permissionRow}>
            <View style={[styles.rowIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.bell} size={15} color={p.chrome} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.permissionTitle, { color: p.label }]}>Notification Access</Text>
              <Text style={[styles.permissionBody, { color: p.secondary }]}>{permissionDescription(permission)}</Text>
            </View>
            {permission === 'loading' ? (
              <ActivityIndicator size="small" color={p.chrome} />
            ) : permission === 'granted' ? (
              <View style={styles.statusWrap}><View style={[styles.statusDot, { backgroundColor: p.success }]} /><Text style={[styles.statusText, { color: p.secondary }]}>On</Text></View>
            ) : permission !== 'unsupported' ? (
              <Pressable accessibilityRole="button" onPress={() => void handlePermissionAction()} style={({ pressed }) => [styles.enableButton, { backgroundColor: p.fill, opacity: pressed ? 0.62 : 1 }]}>
                <Text style={[styles.enableText, { color: p.label }]}>{permission === 'denied' ? 'Settings' : 'Enable'}</Text>
              </Pressable>
            ) : null}
          </View>
        </NeverSettingsSection>

        {saving ? <NeverNotice tone="busy" title="Saving reminder timing…" /> : null}
        <NeverSettingsSection title="Default Timing">
          {leadOptions.map((option, index) => {
            const active = leadMinutes === option.value;
            return (
              <Pressable key={option.value} accessibilityRole="radio" disabled={saving || !preferencesReady} accessibilityState={{ checked: active, disabled: saving || !preferencesReady, busy: saving }} onPress={() => void chooseLead(option.value)} style={({ pressed }) => [styles.optionRow, index < leadOptions.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
                <View style={[styles.rowIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.clock} size={15} color={p.chrome} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: p.label }]}>{option.label}</Text>
                  <Text style={[styles.optionDetail, { color: p.secondary }]}>{option.detail}</Text>
                </View>
                <View style={[styles.radio, { borderColor: active ? p.chrome : p.tertiary, backgroundColor: active ? p.chrome : 'transparent' }]}>
                  {active ? <View style={[styles.radioInner, { backgroundColor: p.onAccent }]} /> : null}
                </View>
              </Pressable>
            );
          })}
        </NeverSettingsSection>

        <View style={styles.note}><OneIcon name={icons.bell} size={12.5} color={p.chrome} /><Text style={[styles.noteText, { color: p.tertiary }]}>This timing is applied when a reminder is newly scheduled or edited. Individual items can still use their own reminder details.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );


}

function permissionDescription(permission: PermissionState) {
  if (permission === 'error') return 'Notification access could not be checked.';
  if (permission === 'loading') return 'Checking access…';
  if (permission === 'granted') return 'NEVER can schedule local reminders on this device.';
  if (permission === 'denied') return 'Access is off in iOS Settings.';
  if (permission === 'unsupported') return 'Notifications are not available on this platform.';
  return 'Enable access whenever you want NEVER to remind you.';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34, gap: 18 },
  permissionRow: { minHeight: 72, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontSize: 15, lineHeight: 18, fontWeight: '600' },
  permissionBody: { marginTop: 2, ...neverType.caption },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...neverType.caption, fontWeight: '600' },
  enableButton: { minHeight: 44, borderRadius: 14, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  enableText: { ...neverType.caption, fontWeight: '600' },
  optionRow: { minHeight: 62, paddingHorizontal: 13, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionLabel: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  optionDetail: { marginTop: 1, ...neverType.caption },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.25, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 6, height: 6, borderRadius: 3 },
  note: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  noteText: { flex: 1, ...neverType.caption }
});
