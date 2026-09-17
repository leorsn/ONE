import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import type { ThemePreference } from '@/src/context/ThemeContext';
import {
  getNeverAppIcon,
  setNeverAppIcon,
  supportsNeverAppIcons,
  type NeverAppIconName,
} from '@/modules/never-app-icon/src/NeverAppIcon';

const options: {
  value: ThemePreference;
  title: string;
  body: string;
}[] = [
  { value: 'system', title: 'System', body: 'Follow your device appearance automatically.' },
  { value: 'light', title: 'Light', body: 'Use the platinum NEVER light appearance.' },
  { value: 'dark', title: 'Dark', body: 'Use the graphite NEVER dark appearance.' }
];

const iconOptions: {
  value: NeverAppIconName;
  title: string;
  body: string;
  source: number;
}[] = [
  {
    value: 'nature',
    title: 'Nature',
    body: 'Default NEVER app icon.',
    source: require('../../assets/icons/never-nature.png')
  },
  {
    value: 'wordmark',
    title: 'Wordmark',
    body: 'Minimal NEVER wordmark.',
    source: require('../../assets/icons/never-wordmark.png')
  }
];

export default function AppearanceScreen() {
  const theme = useTheme();
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
          <Text style={[styles.eyebrow, { color: theme.chrome }]}>APPEARANCE</Text>
          <Text style={[styles.title, { color: theme.text }]}>Make NEVER feel at home.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Choose the interface and Home Screen icon without changing how your memory works.</Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Interface" />
          <Surface>
            {options.map((option, index) => {
              const active = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.title} appearance${active ? ', selected' : ''}`}
                  accessibilityState={{ checked: active }}
                  onPress={() => select(option.value)}
                  style={({ pressed }) => [
                    styles.row,
                    index < options.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    { opacity: pressed ? 0.58 : 1 }
                  ]}
                >
                  <View style={[styles.preview, { backgroundColor: previewBackground(option.value, theme.background), borderColor: theme.border }]}>
                    <View style={[styles.previewHeader, { backgroundColor: previewText(option.value, theme.text) }]} />
                    <View style={[styles.previewCard, { backgroundColor: previewSurface(option.value, theme.surface) }]}>
                      <View style={[styles.previewLine, { backgroundColor: previewText(option.value, theme.text) }]} />
                      <View style={[styles.previewLine, styles.previewLineShort, { backgroundColor: previewText(option.value, theme.text) }]} />
                    </View>
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{option.title}</Text>
                    <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{option.body}</Text>
                  </View>
                  <SelectionMark active={active} />
                </Pressable>
              );
            })}
          </Surface>
        </View>

        <View style={styles.section}>
          <SectionHeader title="App icon" />
          <Surface>
            {iconOptions.map((option, index) => {
              const active = appIcon === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.title} app icon${active ? ', selected' : ''}`}
                  accessibilityState={{ checked: active, disabled: !canSwitchAppIcon }}
                  disabled={!canSwitchAppIcon}
                  onPress={() => selectAppIcon(option.value)}
                  style={({ pressed }) => [
                    styles.row,
                    index < iconOptions.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    { opacity: !canSwitchAppIcon ? 0.55 : pressed ? 0.58 : 1 }
                  ]}
                >
                  <Image source={option.source} style={[styles.appIconPreview, { borderColor: theme.border }]} />
                  <View style={styles.rowCopy}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{option.title}</Text>
                    <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{option.body}</Text>
                  </View>
                  <SelectionMark active={active} />
                </Pressable>
              );
            })}
          </Surface>

          {!canSwitchAppIcon ? (
            <View style={[styles.note, { borderTopColor: theme.border }]}>
              <OneIcon name={icons.appearance} size={13} color={theme.chrome} />
              <Text style={[styles.noteText, { color: theme.textTertiary }]}>Icon switching becomes available in the installed iOS native build.</Text>
            </View>
          ) : null}
          {iconError ? <Text style={[styles.errorText, { color: theme.danger }]}>{iconError}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function SelectionMark({ active }: { active: boolean }) {
    return (
      <View style={[styles.radio, { borderColor: active ? theme.chrome : theme.fillStrong, backgroundColor: active ? theme.chrome : 'transparent' }]}>
        {active ? <View style={[styles.radioInner, { backgroundColor: theme.background }]} /> : null}
      </View>
    );
  }
}

function previewBackground(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#F1F3F5';
  if (mode === 'dark') return '#080A0C';
  return current;
}

function previewSurface(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#FAFBFC';
  if (mode === 'dark') return '#171B1F';
  return current;
}

function previewText(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#101214';
  if (mode === 'dark') return '#F4F6F7';
  return current;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 36, gap: 26 },
  nav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 11, fontWeight: '600', letterSpacing: 3.2 },
  hero: { paddingTop: 10, paddingBottom: 3 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.1 },
  title: { marginTop: 11, maxWidth: 520, fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  subtitle: { marginTop: 9, maxWidth: 500, fontSize: 13, lineHeight: 19.5 },
  section: { gap: 10 },
  row: { minHeight: 86, paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 13 },
  rowCopy: { flex: 1, minWidth: 0 },
  preview: { width: 52, height: 52, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, padding: 7 },
  previewHeader: { width: 18, height: 3, borderRadius: 2, opacity: 0.72 },
  previewCard: { flex: 1, marginTop: 7, borderRadius: 7, padding: 6 },
  previewLine: { width: '72%', height: 3, borderRadius: 2, opacity: 0.65 },
  previewLineShort: { width: '48%', marginTop: 5, opacity: 0.28 },
  appIconPreview: { width: 52, height: 52, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth },
  rowTitle: { fontSize: 14.25, lineHeight: 18, fontWeight: '600', letterSpacing: -0.1 },
  rowBody: { marginTop: 4, fontSize: 11.25, lineHeight: 16 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 1.4, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 7, height: 7, borderRadius: 4 },
  note: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteText: { flex: 1, fontSize: 10.5, lineHeight: 15 },
  errorText: { paddingHorizontal: 2, fontSize: 10.75, lineHeight: 15 }
});