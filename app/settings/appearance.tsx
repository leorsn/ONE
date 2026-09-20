import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/src/theme/useTheme';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Group, V5IconButton, V5LargeHeader, useNeverV5Palette } from '@/src/ui/appleV5';
import type { ThemePreference } from '@/src/context/ThemeContext';
import { getNeverAppIcon, setNeverAppIcon, supportsNeverAppIcons, type NeverAppIconName } from '@/modules/never-app-icon/src/NeverAppIcon';

const options: { value: ThemePreference; title: string; body: string }[] = [
  { value: 'system', title: 'Automatic', body: 'Follow your iPhone appearance.' },
  { value: 'light', title: 'Light', body: 'Neutral platinum canvas with bright grouped surfaces.' },
  { value: 'dark', title: 'Dark', body: 'True black canvas with elevated graphite surfaces.' }
];

const iconOptions: { value: NeverAppIconName; title: string; body: string; source: number }[] = [
  { value: 'nature', title: 'Nature', body: 'Default NEVER app icon.', source: require('../../assets/icons/never-nature.png') },
  { value: 'wordmark', title: 'Wordmark', body: 'Minimal NEVER wordmark.', source: require('../../assets/icons/never-wordmark.png') }
];

export default function AppearanceScreen() {
  const p = useNeverV5Palette();
  const { preference, setPreference } = useThemePreference();
  const [appIcon, setAppIcon] = useState<NeverAppIconName>(() => getNeverAppIcon());
  const [iconError, setIconError] = useState<string | null>(null);
  const canSwitchAppIcon = supportsNeverAppIcons();

  async function select(value: ThemePreference) {
    await Haptics.selectionAsync();
    await setPreference(value);
  }

  async function selectAppIcon(value: NeverAppIconName) {
    if (value === appIcon || !canSwitchAppIcon) return;
    await Haptics.selectionAsync();
    setIconError(null);
    try {
      await setNeverAppIcon(value);
      setAppIcon(value);
    } catch {
      setIconError('NEVER could not change the app icon. Reopen the app and try again.');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <V5IconButton icon={icons.chevronLeft} accessibilityLabel="Go back" onPress={() => router.back()} />
          <Text style={[styles.navTitle, { color: p.label }]}>Appearance</Text>
          <View style={{ width: 38 }} />
        </View>

        <V5LargeHeader title="Appearance" subtitle="Choose how NEVER looks on this iPhone." />

        <SettingsBlock title="Interface">
          {options.map((option, index) => {
            const active = preference === option.value;
            return (
              <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: active }} onPress={() => select(option.value)} style={({ pressed }) => [styles.row, index < options.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
                <View style={[styles.preview, { backgroundColor: previewBackground(option.value, p.canvas) }]}>
                  <View style={[styles.previewHeader, { backgroundColor: previewText(option.value, p.label) }]} />
                  <View style={[styles.previewCard, { backgroundColor: previewSurface(option.value, p.surface) }]}>
                    <View style={[styles.previewLine, { backgroundColor: previewText(option.value, p.label) }]} />
                    <View style={[styles.previewLine, styles.previewLineShort, { backgroundColor: previewText(option.value, p.label) }]} />
                  </View>
                </View>
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: p.label }]}>{option.title}</Text>
                  <Text style={[styles.rowBody, { color: p.secondary }]}>{option.body}</Text>
                </View>
                <SelectionMark active={active} />
              </Pressable>
            );
          })}
        </SettingsBlock>

        <SettingsBlock title="App Icon">
          {iconOptions.map((option, index) => {
            const active = appIcon === option.value;
            return (
              <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: active, disabled: !canSwitchAppIcon }} disabled={!canSwitchAppIcon} onPress={() => selectAppIcon(option.value)} style={({ pressed }) => [styles.row, index < iconOptions.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }, { backgroundColor: pressed ? p.fillSoft : 'transparent', opacity: !canSwitchAppIcon ? 0.55 : 1 }]}>
                <Image source={option.source} style={styles.appIconPreview} />
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: p.label }]}>{option.title}</Text>
                  <Text style={[styles.rowBody, { color: p.secondary }]}>{option.body}</Text>
                </View>
                <SelectionMark active={active} />
              </Pressable>
            );
          })}
        </SettingsBlock>

        {!canSwitchAppIcon ? (
          <View style={styles.note}><OneIcon name={icons.appearance} size={12.5} color={p.chrome} /><Text style={[styles.noteText, { color: p.tertiary }]}>Icon switching becomes available in the installed iOS native build.</Text></View>
        ) : null}
        {iconError ? <Text style={[styles.errorText, { color: p.danger }]}>{iconError}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );

  function SettingsBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return <View style={styles.section}><Text style={[styles.groupTitle, { color: p.secondary }]}>{title}</Text><V5Group>{children}</V5Group></View>;
  }

  function SelectionMark({ active }: { active: boolean }) {
    return (
      <View style={[styles.radio, { borderColor: active ? p.chrome : p.tertiary, backgroundColor: active ? p.chrome : 'transparent' }]}>
        {active ? <OneIcon name={icons.check} size={10} color={p.dark ? '#111113' : '#FFFFFF'} /> : null}
      </View>
    );
  }
}

function previewBackground(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#F5F5F7';
  if (mode === 'dark') return '#000000';
  return current;
}
function previewSurface(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#FFFFFF';
  if (mode === 'dark') return '#1C1C1E';
  return current;
}
function previewText(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#111113';
  if (mode === 'dark') return '#F5F5F7';
  return current;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34, gap: 18 },
  nav: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: 16.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.18 },
  section: { gap: 6 },
  groupTitle: { paddingHorizontal: 4, fontSize: 12.5, lineHeight: 16, fontWeight: '500' },
  row: { minHeight: 72, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowCopy: { flex: 1, minWidth: 0 },
  preview: { width: 46, height: 46, borderRadius: 11, padding: 6 },
  previewHeader: { width: 14, height: 2.5, borderRadius: 2 },
  previewCard: { flex: 1, marginTop: 5, borderRadius: 6, padding: 5 },
  previewLine: { width: '70%', height: 2.5, borderRadius: 2, opacity: 0.6 },
  previewLineShort: { width: '45%', marginTop: 4, opacity: 0.25 },
  appIconPreview: { width: 46, height: 46, borderRadius: 11 },
  rowTitle: { fontSize: 15, lineHeight: 18, fontWeight: '600' },
  rowBody: { marginTop: 2, fontSize: 12, lineHeight: 15.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.25, alignItems: 'center', justifyContent: 'center' },
  note: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  noteText: { flex: 1, fontSize: 10.5, lineHeight: 14.5 },
  errorText: { paddingHorizontal: 4, fontSize: 10.5, lineHeight: 14.5 }
});