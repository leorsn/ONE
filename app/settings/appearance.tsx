import { NeverSettingsSection, NeverNavigation } from '@/src/ui/utility';
import { lightTheme, darkTheme } from '@/src/theme/colors';
import { neverType } from '@/src/theme/tokens';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/src/theme/useTheme';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5LargeHeader, useNeverV5Palette } from '@/src/ui/appleV5';
import type { ThemePreference } from '@/src/context/ThemeContext';
import { getNeverAppIcon, setNeverAppIcon, supportsNeverAppIcons, type NeverAppIconName } from '@/modules/never-app-icon/src/NeverAppIcon';

const options: { value: ThemePreference; title: string; body: string }[] = [
  { value: 'system', title: 'Automatic', body: 'Follow your iPhone appearance.' },
  { value: 'light', title: 'Light', body: 'Neutral platinum canvas with bright grouped surfaces.' },
  { value: 'dark', title: 'Dark', body: 'Deep graphite with softly elevated silver details.' }
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
    void Haptics.selectionAsync().catch(() => undefined);
    await setPreference(value);
  }

  async function selectAppIcon(value: NeverAppIconName) {
    if (value === appIcon || !canSwitchAppIcon) return;
    void Haptics.selectionAsync().catch(() => undefined);
    setIconError(null);
    try {
      await setNeverAppIcon(value);
      setAppIcon(value);
    } catch {
      setIconError('NEVER could not change the app icon. Reopen the app and try again.');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <NeverNavigation title="Appearance" onBack={() => router.back()} />

        <V5LargeHeader title="Appearance" subtitle="Choose how NEVER looks on this iPhone." />

        <NeverSettingsSection title="Interface">
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
        </NeverSettingsSection>

        <NeverSettingsSection title="App Icon">
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
        </NeverSettingsSection>

        {!canSwitchAppIcon ? (
          <View style={styles.note}><OneIcon name={icons.appearance} size={12.5} color={p.chrome} /><Text style={[styles.noteText, { color: p.tertiary }]}>Icon switching becomes available in the installed iOS native build.</Text></View>
        ) : null}
        {iconError ? <Text style={[styles.errorText, { color: p.danger }]}>{iconError}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );



  function SelectionMark({ active }: { active: boolean }) {
    return (
      <View style={[styles.radio, { borderColor: active ? p.chrome : p.tertiary, backgroundColor: active ? p.chrome : 'transparent' }]}>
        {active ? <OneIcon name={icons.check} size={10} color={p.onAccent} /> : null}
      </View>
    );
  }
}

function previewBackground(mode: ThemePreference, current: string) {
  if (mode === 'light') return lightTheme.background;
  if (mode === 'dark') return darkTheme.background;
  return current;
}
function previewSurface(mode: ThemePreference, current: string) {
  if (mode === 'light') return lightTheme.surface;
  if (mode === 'dark') return darkTheme.surface;
  return current;
}
function previewText(mode: ThemePreference, current: string) {
  if (mode === 'light') return lightTheme.text;
  if (mode === 'dark') return darkTheme.text;
  return current;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34, gap: 18 },
  row: { minHeight: 72, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowCopy: { flex: 1, minWidth: 0 },
  preview: { width: 46, height: 46, borderRadius: 11, padding: 6 },
  previewHeader: { width: 14, height: 2.5, borderRadius: 2 },
  previewCard: { flex: 1, marginTop: 5, borderRadius: 6, padding: 5 },
  previewLine: { width: '70%', height: 2.5, borderRadius: 2, opacity: 0.6 },
  previewLineShort: { width: '45%', marginTop: 4, opacity: 0.25 },
  appIconPreview: { width: 46, height: 46, borderRadius: 11 },
  rowTitle: { fontSize: 15, lineHeight: 18, fontWeight: '600' },
  rowBody: { marginTop: 2, ...neverType.caption },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.25, alignItems: 'center', justifyContent: 'center' },
  note: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  noteText: { flex: 1, ...neverType.caption },
  errorText: { paddingHorizontal: 4, ...neverType.caption }
});
