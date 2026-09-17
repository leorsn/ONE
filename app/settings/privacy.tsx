import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { exportOneData } from '@/src/export/exportOneData';
import { IconTile, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL?.trim();
const SUPPORT_URL = process.env.EXPO_PUBLIC_SUPPORT_URL?.trim();

const protections = [
  {
    icon: icons.lock,
    title: 'Private account data',
    body: 'Supabase Row Level Security limits synced items to the authenticated owner.'
  },
  {
    icon: icons.screenshot,
    title: 'Private attachments',
    body: 'Shared screenshots and documents live in a private per-user storage path.'
  },
  {
    icon: icons.ask,
    title: 'Scoped semantic recall',
    body: 'Meaning search only matches memories belonging to the signed-in NEVER account.'
  },
  {
    icon: icons.cloud,
    title: 'Local-first fallback',
    body: 'Core capture and recall continue locally when cloud services are unavailable.'
  }
] as const;

export default function PrivacyScreen() {
  const theme = useTheme();
  const { items } = useItems();
  const [exporting, setExporting] = useState(false);

  const legalReady = Boolean(PRIVACY_POLICY_URL && SUPPORT_URL);

  async function runExport() {
    if (exporting) return;

    setExporting(true);
    await Haptics.selectionAsync();
    try {
      const error = await exportOneData(items);
      if (error) Alert.alert('Export NEVER data', error);
    } finally {
      setExporting(false);
    }
  }

  async function openExternal(label: string, url?: string) {
    if (!url) {
      Alert.alert(`${label} unavailable`, 'This release build does not have this URL configured yet.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(`${label} unavailable`, 'The configured URL could not be opened on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(`${label} unavailable`, 'The configured URL could not be opened on this device.');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill, borderColor: theme.border }]}>
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Privacy</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <IconTile icon={icons.shield} size={52} />
          <Text style={[styles.title, { color: theme.text }]}>Private by default.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>NEVER is designed around personal memory. Access boundaries are part of the architecture, not an afterthought.</Text>
        </View>

        <Surface>
          {protections.map((protection, index) => (
            <View
              key={protection.title}
              style={[
                styles.row,
                index < protections.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }
              ]}
            >
              <IconTile icon={protection.icon} tone="neutral" size={38} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{protection.title}</Text>
                <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{protection.body}</Text>
              </View>
            </View>
          ))}
        </Surface>

        <Surface>
          <PolicyRow label="Privacy policy" detail={PRIVACY_POLICY_URL ? 'Read the public NEVER privacy policy.' : 'Not configured for this build.'} url={PRIVACY_POLICY_URL} icon={icons.shield} />
          <PolicyRow label="Terms of use" detail={TERMS_URL ? 'Read NEVER’s terms of use.' : 'Not configured for this build.'} url={TERMS_URL} icon={icons.document} />
          <PolicyRow label="Support" detail={SUPPORT_URL ? 'Get help or contact NEVER support.' : 'Not configured for this build.'} url={SUPPORT_URL} icon={icons.more} last />
        </Surface>

        <Surface>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Export ${items.length} NEVER memories as JSON`}
            disabled={exporting}
            onPress={() => void runExport()}
            style={({ pressed }) => [styles.exportRow, { opacity: pressed || exporting ? 0.58 : 1 }]}
          >
            <IconTile icon={icons.upload} tone="neutral" size={38} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: theme.text }]}>Export my data</Text>
              <Text style={[styles.rowBody, { color: theme.textSecondary }]}>
                Export {items.length} {items.length === 1 ? 'memory' : 'memories'} as a structured JSON file.
              </Text>
            </View>
            {exporting ? <ActivityIndicator size="small" /> : <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />}
          </Pressable>
        </Surface>

        <View style={[styles.notice, { backgroundColor: legalReady ? theme.chromeSoft : theme.fill, borderColor: theme.border }]}>
          <OneIcon name={legalReady ? icons.check : icons.shield} size={17} color={legalReady ? theme.chrome : theme.warning} />
          <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
            {legalReady
              ? 'Privacy and support URLs are configured in this build. Confirm their production content before App Store submission.'
              : 'Privacy policy and support URLs must be configured before TestFlight/App Store release.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function PolicyRow({
    label,
    detail,
    url,
    icon,
    last = false
  }: {
    label: string;
    detail: string;
    url?: string;
    icon: (typeof icons)[keyof typeof icons];
    last?: boolean;
  }) {
    return (
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${label}. ${url ? 'Open link' : 'Not configured'}`}
        onPress={() => void openExternal(label, url)}
        style={({ pressed }) => [
          styles.linkRow,
          !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
          { opacity: pressed ? 0.58 : 1 }
        ]}
      >
        <IconTile icon={icon} tone="neutral" size={38} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{detail}</Text>
        </View>
        <OneIcon name={icons.chevron} size={14} color={url ? theme.chrome : theme.textTertiary} />
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 20 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.1 },
  hero: { alignItems: 'center', paddingTop: 8 },
  title: { marginTop: 15, fontSize: 27, lineHeight: 32, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { marginTop: 8, maxWidth: 340, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  row: { minHeight: 82, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkRow: { minHeight: 76, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  exportRow: { minHeight: 76, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 14.25, fontWeight: '700' },
  rowBody: { marginTop: 4, fontSize: 11.75, lineHeight: 17 },
  notice: { minHeight: 62, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeText: { flex: 1, fontSize: 11.5, lineHeight: 16 }
});
