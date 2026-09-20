import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { exportOneData } from '@/src/export/exportOneData';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Chevron, V5Group, V5IconButton, V5LargeHeader, useNeverV5Palette } from '@/src/ui/appleV5';

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
  const p = useNeverV5Palette();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <V5IconButton icon={icons.chevronLeft} accessibilityLabel="Go back" onPress={() => router.back()} />
          <Text style={[styles.navTitle, { color: p.label }]}>Privacy</Text>
          <View style={{ width: 38 }} />
        </View>

        <V5LargeHeader title="Privacy" subtitle="Your personal memory stays under your control." />

        <SettingsBlock title="How NEVER Protects Your Memory">
          {protections.map((protection, index) => (
            <View key={protection.title} style={[styles.row, index < protections.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <MemoryGlyph icon={protection.icon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: p.label }]}>{protection.title}</Text>
                <Text style={[styles.rowBody, { color: p.secondary }]}>{protection.body}</Text>
              </View>
            </View>
          ))}
        </SettingsBlock>

        <SettingsBlock title="Your Controls">
          <Pressable disabled={exporting} onPress={() => void runExport()} style={({ pressed }) => [styles.controlRow, { borderBottomColor: p.separator, backgroundColor: pressed ? p.fillSoft : 'transparent', opacity: exporting ? 0.58 : 1 }]}>
            <MemoryGlyph icon={icons.upload} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: p.label }]}>Export Your Data</Text>
              <Text style={[styles.rowBody, { color: p.secondary }]}>Export {items.length} {items.length === 1 ? 'memory' : 'memories'} as structured JSON.</Text>
            </View>
            {exporting ? <ActivityIndicator size="small" /> : <V5Chevron />}
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)/settings')} style={({ pressed }) => [styles.controlRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
            <MemoryGlyph icon={icons.delete} danger />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: p.label }]}>Delete Your Account</Text>
              <Text style={[styles.rowBody, { color: p.secondary }]}>Account deletion and subscription guidance are available in Settings.</Text>
            </View>
            <V5Chevron />
          </Pressable>
        </SettingsBlock>

        <SettingsBlock title="Legal & Support">
          <PolicyRow label="Privacy Policy" detail="How NEVER describes data handling publicly." url={PRIVACY_POLICY_URL} icon={icons.shield} />
          <PolicyRow label="Terms of Use" detail="The terms that apply when you use NEVER." url={TERMS_URL} icon={icons.document} />
          <PolicyRow label="Support" detail="Get help or contact NEVER support." url={SUPPORT_URL} icon={icons.more} last />
        </SettingsBlock>

        {__DEV__ && !legalReady ? (
          <View style={[styles.devNotice, { backgroundColor: p.fillSoft }]}>
            <OneIcon name={icons.shield} size={13} color={p.warning} />
            <Text style={[styles.devNoticeText, { color: p.secondary }]}>Development: privacy policy and support URLs are not fully configured.</Text>
          </View>
        ) : null}

        <Text style={[styles.footer, { color: p.tertiary }]}>NEVER · YOUR INFORMATION, UNDER YOUR CONTROL</Text>
      </ScrollView>
    </SafeAreaView>
  );

  function SettingsBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return <View style={styles.block}><Text style={[styles.groupTitle, { color: p.secondary }]}>{title}</Text><V5Group>{children}</V5Group></View>;
  }

  function MemoryGlyph({ icon, danger = false }: { icon: (typeof icons)[keyof typeof icons]; danger?: boolean }) {
    return <View style={[styles.memoryGlyph, { backgroundColor: danger ? p.danger + '18' : p.fillSoft }]}><OneIcon name={icon} size={15} color={danger ? p.danger : p.chrome} /></View>;
  }

  function PolicyRow({ label, detail, url, icon, last = false }: { label: string; detail: string; url?: string; icon: (typeof icons)[keyof typeof icons]; last?: boolean }) {
    return (
      <Pressable onPress={() => void openExternal(label, url)} style={({ pressed }) => [styles.linkRow, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
        <MemoryGlyph icon={icon} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: p.label }]}>{label}</Text>
          <Text style={[styles.rowBody, { color: p.secondary }]}>{url ? detail : 'Not configured in this build.'}</Text>
        </View>
        <V5Chevron />
      </Pressable>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 18 },
  nav: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: 16.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.18 },
  block: { gap: 6 },
  groupTitle: { paddingHorizontal: 4, fontSize: 12.5, lineHeight: 16, fontWeight: '500' },
  row: { minHeight: 66, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  memoryGlyph: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  controlRow: { minHeight: 64, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  linkRow: { minHeight: 62, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  rowBody: { marginTop: 2, fontSize: 11.5, lineHeight: 15.5 },
  devNotice: { minHeight: 48, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  devNoticeText: { flex: 1, fontSize: 10.5, lineHeight: 14.5 },
  footer: { textAlign: 'center', fontSize: 8.5, fontWeight: '600', letterSpacing: 0.9 }
});