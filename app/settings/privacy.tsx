import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { exportOneData } from '@/src/export/exportOneData';
import { IconTile, SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL?.trim();
const SUPPORT_URL = process.env.EXPO_PUBLIC_SUPPORT_URL?.trim();

const protections = [
  {
    icon: icons.lock,
    title: 'Your account, your memory',
    body: 'Synced memories are scoped to the signed-in account that owns them.'
  },
  {
    icon: icons.screenshot,
    title: 'Private attachments',
    body: 'Shared screenshots and documents are stored within your private account space.'
  },
  {
    icon: icons.ask,
    title: 'Grounded recall',
    body: 'Ask NEVER answers from memories retrieved from your own saved information.'
  },
  {
    icon: icons.cloud,
    title: 'Useful without the cloud',
    body: 'Core capture and local recall can continue when cloud services are unavailable.'
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
      Alert.alert(`${label} unavailable`, 'This build does not have this link configured.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(`${label} unavailable`, 'The link could not be opened on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(`${label} unavailable`, 'The link could not be opened on this device.');
    }
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
          <Text style={[styles.eyebrow, { color: theme.chrome }]}>PRIVACY</Text>
          <Text style={[styles.title, { color: theme.text }]}>Private by design.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Your personal memory should remain under your control. NEVER keeps privacy controls visible, understandable and reversible where possible.</Text>
        </View>

        <View style={styles.block}>
          <SectionHeader title="How NEVER handles your memory" />
          <Surface>
            {protections.map((protection, index) => (
              <View
                key={protection.title}
                style={[
                  styles.row,
                  index < protections.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }
                ]}
              >
                <IconTile icon={protection.icon} tone="neutral" size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{protection.title}</Text>
                  <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{protection.body}</Text>
                </View>
              </View>
            ))}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Your controls" />
          <Surface>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Export ${items.length} NEVER memories as JSON`}
              disabled={exporting}
              onPress={() => void runExport()}
              style={({ pressed }) => [styles.controlRow, { borderBottomColor: theme.border, opacity: pressed || exporting ? 0.58 : 1 }]}
            >
              <IconTile icon={icons.upload} tone="neutral" size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Export your data</Text>
                <Text style={[styles.rowBody, { color: theme.textSecondary }]}>
                  Export {items.length} {items.length === 1 ? 'memory' : 'memories'} as a structured JSON file.
                </Text>
              </View>
              {exporting ? <ActivityIndicator size="small" /> : <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open account settings to delete account"
              onPress={() => router.replace('/(tabs)/settings')}
              style={({ pressed }) => [styles.controlRow, { opacity: pressed ? 0.58 : 1 }]}
            >
              <IconTile icon={icons.delete} tone="danger" size={36} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>Delete your account</Text>
                <Text style={[styles.rowBody, { color: theme.textSecondary }]}>Account deletion and subscription guidance are available in Settings.</Text>
              </View>
              <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
            </Pressable>
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Legal & support" />
          <Surface>
            <PolicyRow label="Privacy policy" detail="How NEVER describes data handling publicly." url={PRIVACY_POLICY_URL} icon={icons.shield} />
            <PolicyRow label="Terms of use" detail="The terms that apply when you use NEVER." url={TERMS_URL} icon={icons.document} />
            <PolicyRow label="Support" detail="Get help or contact NEVER support." url={SUPPORT_URL} icon={icons.more} last />
          </Surface>
        </View>

        {__DEV__ && !legalReady ? (
          <View style={[styles.devNotice, { backgroundColor: theme.fill, borderColor: theme.border }]}>
            <OneIcon name={icons.shield} size={15} color={theme.warning} />
            <Text style={[styles.devNoticeText, { color: theme.textSecondary }]}>Development: privacy policy and support URLs are not fully configured.</Text>
          </View>
        ) : null}

        <Text style={[styles.footer, { color: theme.textTertiary }]}>N E V E R   ·   YOUR INFORMATION, UNDER YOUR CONTROL</Text>
      </ScrollView>
    </SafeAreaView>
  );

  function PolicyRow({ label, detail, url, icon, last = false }: {
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
        <IconTile icon={icon} tone="neutral" size={36} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{url ? detail : 'Not configured in this build.'}</Text>
        </View>
        <OneIcon name={icons.chevron} size={13} color={url ? theme.chrome : theme.textTertiary} />
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 42,
    gap: 26
  },
  nav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 11, fontWeight: '600', letterSpacing: 3.2 },
  hero: { paddingTop: 10, paddingBottom: 4 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.2 },
  title: { marginTop: 11, fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  subtitle: { marginTop: 9, maxWidth: 510, fontSize: 13, lineHeight: 19.5 },
  block: { gap: 10 },
  row: { minHeight: 78, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  controlRow: { minHeight: 76, paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  linkRow: { minHeight: 74, paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 14, lineHeight: 18, fontWeight: '600', letterSpacing: -0.08 },
  rowBody: { marginTop: 4, fontSize: 11.5, lineHeight: 16.5 },
  devNotice: { minHeight: 54, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  devNoticeText: { flex: 1, fontSize: 10.75, lineHeight: 15 },
  footer: { textAlign: 'center', fontSize: 8.5, fontWeight: '600', letterSpacing: 1.1 }
});