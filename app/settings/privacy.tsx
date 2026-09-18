import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { exportOneData } from '@/src/export/exportOneData';
import { NeverSignal, SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL?.trim();
const SUPPORT_URL = process.env.EXPO_PUBLIC_SUPPORT_URL?.trim();

const protections = [
  { icon: icons.lock, title: 'Your account, your memory', body: 'Synced memories are scoped to the signed-in account that owns them.' },
  { icon: icons.screenshot, title: 'Private attachments', body: 'Shared screenshots and documents are stored within your private account space.' },
  { icon: icons.ask, title: 'Grounded recall', body: 'Ask NEVER answers from memories retrieved from your own saved information.' },
  { icon: icons.cloud, title: 'Useful without the cloud', body: 'Core capture and local recall can continue when cloud services are unavailable.' }
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
          <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>PRIVACY</Text>
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
                <MemoryGlyph icon={protection.icon} color={index % 2 === 0 ? theme.sky : theme.textSecondary} />
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
              <MemoryGlyph icon={icons.upload} color={theme.sky} />
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
              style={({ pressed }) => [styles.controlRow, styles.controlRowLast, { opacity: pressed ? 0.58 : 1 }]}
            >
              <MemoryGlyph icon={icons.delete} color={theme.danger} />
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
            <OneIcon name={icons.shield} size={14} color={theme.warning} />
            <Text style={[styles.devNoticeText, { color: theme.textSecondary }]}>Development: privacy policy and support URLs are not fully configured.</Text>
          </View>
        ) : null}

        <Text style={[styles.footer, { color: theme.textTertiary }]}>N E V E R   ·   YOUR INFORMATION, UNDER YOUR CONTROL</Text>
      </ScrollView>
    </SafeAreaView>
  );

  function MemoryGlyph({ icon, color }: { icon: (typeof icons)[keyof typeof icons]; color: string }) {
    return (
      <View style={[styles.memoryGlyph, { borderColor: theme.border }]}>
        <OneIcon name={icon} size={16.5} color={color} />
      </View>
    );
  }

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
        <MemoryGlyph icon={icon} color={theme.textSecondary} />
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
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 38,
    gap: 22
  },
  nav: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 38, height: 38, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark: { fontSize: 10.75, fontWeight: '700', letterSpacing: 3.2 },
  hero: { paddingTop: 8, paddingBottom: 2 },
  eyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 2 },
  title: { marginTop: 10, fontFamily: editorialFontFamily, fontSize: 31, lineHeight: 35, fontWeight: '400', letterSpacing: -0.8 },
  subtitle: { marginTop: 8, maxWidth: 510, fontSize: 12.5, lineHeight: 18.5 },
  block: { gap: 9 },
  row: { minHeight: 70, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  memoryGlyph: { width: 27, height: 34, borderLeftWidth: 2, alignItems: 'center', justifyContent: 'center' },
  controlRow: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  controlRowLast: { borderBottomWidth: 0 },
  linkRow: { minHeight: 66, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowTitle: { fontSize: 13.75, lineHeight: 17.5, fontWeight: '600', letterSpacing: -0.07 },
  rowBody: { marginTop: 3, fontSize: 11, lineHeight: 15.5 },
  devNotice: { minHeight: 50, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  devNoticeText: { flex: 1, fontSize: 10.5, lineHeight: 14.5 },
  footer: { textAlign: 'center', fontSize: 8.35, fontWeight: '600', letterSpacing: 1.08 }
});
