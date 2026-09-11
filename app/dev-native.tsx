import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import {
  clearNativeAcceptanceLog,
  loadLastNativeError,
  loadNativeAcceptanceEvents,
  recordLastNativeError,
  recordNativeAcceptanceEvent,
  type NativeAcceptanceEvent
} from '@/src/native/acceptance';
import { mapNativePermissionState, permissionStateLabel } from '@/src/native/permissions';
import { supabase } from '@/src/supabase/client';
import { PrimaryButton, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

type Diagnostics = {
  camera: string;
  photos: string;
  notifications: string;
  scheduledNotifications: number;
  localPersistence: string;
  cloud: string;
  lastError: string | null;
  events: NativeAcceptanceEvent[];
};

const PROBE_KEY = '@one/native-acceptance/storage-probe';

export default function NativeAcceptanceScreen() {
  const theme = useTheme();
  const { probe } = useLocalSearchParams<{ probe?: string }>();
  const { session, configured } = useAuth();
  const { items, hydrated, cloudSyncing } = useItems();
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);

  const pending = useMemo(() => items.filter((item) => item.syncState === 'pending').length, [items]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [camera, photos, notificationPermission, scheduled, lastError, events] = await Promise.all([
        ImagePicker.getCameraPermissionsAsync(),
        ImagePicker.getMediaLibraryPermissionsAsync(),
        Platform.OS === 'web' ? Promise.resolve(null) : Notifications.getPermissionsAsync(),
        Platform.OS === 'web' ? Promise.resolve([]) : Notifications.getAllScheduledNotificationsAsync(),
        loadLastNativeError(),
        loadNativeAcceptanceEvents()
      ]);

      const marker = `${Date.now()}`;
      await AsyncStorage.setItem(PROBE_KEY, marker);
      const localPersistence = await AsyncStorage.getItem(PROBE_KEY);
      await AsyncStorage.removeItem(PROBE_KEY);

      let cloud = configured ? 'Configured · signed out' : 'Not configured';
      if (session?.user.id) {
        try {
          const { error } = await supabase.from('items').select('id').limit(1);
          cloud = error ? `Unavailable · ${error.message}` : 'Connected with authenticated RLS';
        } catch (error) {
          cloud = 'Unavailable · local data remains usable';
          await recordLastNativeError('acceptance-cloud-probe', error);
        }
      }

      setDiagnostics({
        camera: permissionStateLabel(mapNativePermissionState(camera)),
        photos: permissionStateLabel(mapNativePermissionState(photos)),
        notifications: notificationPermission
          ? permissionStateLabel(mapNativePermissionState(notificationPermission))
          : 'Unsupported',
        scheduledNotifications: scheduled.length,
        localPersistence: localPersistence === marker ? 'Passed' : 'Failed',
        cloud,
        lastError,
        events
      });
    } catch (error) {
      await recordLastNativeError('acceptance-refresh', error);
      Alert.alert('Diagnostics failed', error instanceof Error ? error.message : 'Unable to read native diagnostics.');
    } finally {
      setLoading(false);
    }
  }, [configured, session?.user.id]);

  useEffect(() => {
    if (probe) void recordNativeAcceptanceEvent('deep_link_received', 'acceptance-probe');
    void refresh();
  }, [probe, refresh]);

  if (!__DEV__) return <Redirect href="/(tabs)" />;

  async function requestCamera() {
    await ImagePicker.requestCameraPermissionsAsync();
    await refresh();
  }

  async function requestPhotos() {
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    await refresh();
  }

  async function requestNotifications() {
    if (Platform.OS === 'web') return;
    await Notifications.requestPermissionsAsync();
    await refresh();
  }

  async function scheduleTestNotification() {
    if (Platform.OS === 'web') return;
    const permission = await Notifications.getPermissionsAsync();
    const granted = permission.granted ? permission : await Notifications.requestPermissionsAsync();
    if (!granted.granted) {
      Alert.alert('Notifications not enabled', 'The acceptance notification was not scheduled.');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ONE native acceptance',
        body: 'Local notification delivery is working on this device.',
        data: { acceptanceTest: true }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5
      }
    });
    await recordNativeAcceptanceEvent('notification_scheduled', 'acceptance-test');
    await refresh();
    Alert.alert('Scheduled', 'A local acceptance notification should appear in about 5 seconds.');
  }

  async function openDeepLinkProbe() {
    const url = `one://dev-native?probe=${Date.now()}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Scheme unavailable', 'This build did not report the ONE URL scheme as available.');
      return;
    }
    await Linking.openURL(url);
  }

  async function clearLog() {
    await clearNativeAcceptanceLog();
    await refresh();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]} accessibilityRole="button" accessibilityLabel="Go back">
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Native Acceptance</Text>
          <Pressable onPress={() => void refresh()} style={[styles.navButton, { backgroundColor: theme.fill }]} accessibilityRole="button" accessibilityLabel="Refresh native diagnostics">
            {loading ? <ActivityIndicator size="small" /> : <OneIcon name={icons.settings} size={17} color={theme.text} />}
          </Pressable>
        </View>

        <Text style={[styles.lead, { color: theme.text }]}>Real-device verification</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>Development only. Green CI does not count as proof for Share Extension, Apple Vision OCR, permissions, notification delivery or native deep links.</Text>

        <Surface>
          <DiagnosticRow label="Platform" value={`${Platform.OS} · ${Constants.expoConfig?.version || 'unknown version'}`} />
          <DiagnosticRow label="Authentication" value={session ? 'Signed in' : 'Signed out'} />
          <DiagnosticRow label="Supabase" value={diagnostics?.cloud || 'Checking…'} />
          <DiagnosticRow label="Local persistence" value={diagnostics?.localPersistence || 'Checking…'} />
          <DiagnosticRow label="Item hydration" value={hydrated ? 'Ready' : 'Loading'} />
          <DiagnosticRow label="Sync" value={cloudSyncing ? 'Syncing' : `${pending} pending`} />
          <DiagnosticRow label="Camera" value={diagnostics?.camera || 'Checking…'} />
          <DiagnosticRow label="Photos" value={diagnostics?.photos || 'Checking…'} />
          <DiagnosticRow label="Notifications" value={diagnostics?.notifications || 'Checking…'} />
          <DiagnosticRow label="Scheduled" value={String(diagnostics?.scheduledNotifications ?? 0)} last />
        </Surface>

        <View style={styles.actions}>
          <PrimaryButton label="Request camera access" icon={icons.scan} onPress={requestCamera} />
          <PrimaryButton label="Request photo access" icon={icons.screenshot} onPress={requestPhotos} />
          <PrimaryButton label="Request notification access" icon={icons.bell} onPress={requestNotifications} />
          <PrimaryButton label="Schedule 5s notification" icon={icons.reminder} onPress={scheduleTestNotification} />
          <PrimaryButton label="Test ONE deep link" icon={icons.link} onPress={openDeepLinkProbe} />
          <PrimaryButton label="Open scan flow" icon={icons.scan} onPress={() => router.push('/scan')} />
        </View>

        <Surface padded>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Share-to-ONE acceptance</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>From Safari, Mail or Photos: Share → ONE. Confirm that Capture Review opens once, the original attachment is preserved, then return here and inspect the latest events.</Text>
        </Surface>

        <Surface padded>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Last native error</Text>
          <Text selectable style={[styles.mono, { color: diagnostics?.lastError ? theme.danger : theme.textSecondary }]}>{diagnostics?.lastError || 'None recorded'}</Text>
        </Surface>

        <View style={styles.eventHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent native events</Text>
          <Pressable onPress={() => void clearLog()} accessibilityRole="button" accessibilityLabel="Clear native acceptance log">
            <Text style={[styles.clear, { color: theme.accent }]}>Clear</Text>
          </Pressable>
        </View>
        <Surface>
          {diagnostics?.events.length ? diagnostics.events.slice(0, 16).map((event, index) => (
            <View key={event.id} style={[styles.eventRow, index < Math.min(diagnostics.events.length, 16) - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.eventKind, { color: theme.text }]}>{event.kind}</Text>
                <Text style={[styles.eventDetail, { color: theme.textSecondary }]}>{event.detail || '—'}</Text>
              </View>
              <Text style={[styles.eventTime, { color: theme.textTertiary }]}>{new Date(event.at).toLocaleTimeString()}</Text>
            </View>
          )) : (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>No native acceptance events recorded yet.</Text>
          )}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );

  function DiagnosticRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
    return (
      <View style={[styles.row, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: theme.text }]} numberOfLines={2}>{value}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, gap: 16 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  lead: { marginTop: 6, fontSize: 26, fontWeight: '800', letterSpacing: -0.7 },
  body: { fontSize: 12.5, lineHeight: 18 },
  row: { minHeight: 54, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { width: 112, fontSize: 12, fontWeight: '700' },
  rowValue: { flex: 1, textAlign: 'right', fontSize: 12.5, fontWeight: '600' },
  actions: { gap: 9 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  mono: { marginTop: 8, fontSize: 11.5, lineHeight: 16 },
  eventHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clear: { fontSize: 12.5, fontWeight: '700' },
  eventRow: { minHeight: 58, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventKind: { fontSize: 12.5, fontWeight: '800' },
  eventDetail: { marginTop: 2, fontSize: 10.5 },
  eventTime: { fontSize: 10.5 },
  empty: { padding: 18, textAlign: 'center', fontSize: 12 }
});
