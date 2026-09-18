import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { NeverSignal, SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { editorialFontFamily } from '@/src/theme/typography';
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
  { value: 'system', title: 'Automatic', body: 'Use Core Light or Core Dark with your device.' },
  { value: 'light', title: 'Core Light', body: 'Soft aluminium, paper surfaces and graphite structure.' },
  { value: 'dark', title: 'Core Dark', body: 'Smoked graphite, quiet contrast and muted signals.' }
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
          <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>APPEARANCE</Text>
          <Text style={[styles.title, { color: theme.text }]}>Choose how Core feels.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Light and Dark share the same NEVER Core structure. Only the material and contrast change.</Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Core interface" />
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
                    <View style={styles.previewSignal}>
                      <View style={[styles.previewSignalLong, { backgroundColor: previewText(option.value, theme.text) }]} />
                      <View style={styles.previewSignalBlue} />
                      <View style={styles.previewSignalRed} />
                    </View>
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
            <View style={styles.note}>
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
  if (mode === 'light') return '#F2F4F5';
  if (mode === 'dark') return '#080A0C';
  return current;
}

function previewSurface(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#FAFBFC';
  if (mode === 'dark') return '#171B1F';
  return current;
}

function previewText(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#111418';
  if (mode === 'dark') return '#F3F4F4';
  return current;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 34, gap: 24 },
  nav: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 38, height: 38, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark: { fontSize: 10.75, fontWeight: '700', letterSpacing: 3.2 },
  hero: { paddingTop: 8, paddingBottom: 2 },
  eyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 2 },
  title: { marginTop: 10, maxWidth: 520, fontFamily: editorialFontFamily, fontSize: 31, lineHeight: 35, fontWeight: '400', letterSpacing: -0.8 },
  subtitle: { marginTop: 8, maxWidth: 500, fontSize: 12.5, lineHeight: 18.5 },
  section: { gap: 9 },
  row: { minHeight: 82, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowCopy: { flex: 1, minWidth: 0 },
  preview: { width: 50, height: 50, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, padding: 7 },
  previewSignal: { height: 3, flexDirection: 'row', alignItems: 'center', gap: 2 },
  previewSignalLong: { width: 13, height: 2.5, borderRadius: 2 },
  previewSignalBlue: { width: 7, height: 2.5, borderRadius: 2, backgroundColor: '#7197B4' },
  previewSignalRed: { width: 4, height: 2.5, borderRadius: 2, backgroundColor: '#BE7077' },
  previewCard: { flex: 1, marginTop: 6, borderRadius: 6, padding: 6 },
  previewLine: { width: '72%', height: 3, borderRadius: 2, opacity: 0.62 },
  previewLineShort: { width: '46%', marginTop: 5, opacity: 0.25 },
  appIconPreview: { width: 50, height: 50, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth },
  rowTitle: { fontSize: 14, lineHeight: 17.5, fontWeight: '600', letterSpacing: -0.08 },
  rowBody: { marginTop: 4, fontSize: 11, lineHeight: 15.5 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.35, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 6.5, height: 6.5, borderRadius: 4 },
  note: { paddingTop: 2, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteText: { flex: 1, fontSize: 10.25, lineHeight: 14.5 },
  errorText: { paddingHorizontal: 2, fontSize: 10.5, lineHeight: 14.5 }
});
