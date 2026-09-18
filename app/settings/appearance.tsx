import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { NeverSignal, Surface } from '@/src/ui/primitives';
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
  { value: 'system', title: 'Automatic', body: 'Follow your iPhone appearance.' },
  { value: 'light', title: 'Core Light', body: 'Silver system canvas with bright grouped surfaces.' },
  { value: 'dark', title: 'Core Dark', body: 'True black canvas with elevated graphite surfaces.' }
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
  const { preference, resolvedMode, setPreference } = useThemePreference();
  const dark = resolvedMode === 'dark';
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
            style={({ pressed }) => [
              styles.navButton,
              {
                backgroundColor: dark ? '#1C1C1EF2' : '#FFFFFFF2',
                borderColor: dark ? '#FFFFFF12' : '#0000000A',
                opacity: pressed ? 0.65 : 1
              }
            ]}
          >
            <OneIcon name={icons.chevronLeft} size={16} color={theme.text} />
          </Pressable>
          <View style={styles.navBrand}>
            <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
            <NeverSignal compact />
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <Text style={[styles.title, { color: theme.text }]}>Appearance</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Choose how NEVER Core looks on this iPhone.</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>CORE INTERFACE</Text>
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
                    index < options.length - 1 && { borderBottomColor: `${theme.text}0D`, borderBottomWidth: StyleSheet.hairlineWidth },
                    { backgroundColor: pressed ? `${theme.fill}42` : 'transparent' }
                  ]}
                >
                  <View style={[styles.preview, { backgroundColor: previewBackground(option.value, theme.background) }]}>
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
          <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>APP ICON</Text>
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
                    index < iconOptions.length - 1 && { borderBottomColor: `${theme.text}0D`, borderBottomWidth: StyleSheet.hairlineWidth },
                    { backgroundColor: pressed ? `${theme.fill}42` : 'transparent', opacity: !canSwitchAppIcon ? 0.55 : 1 }
                  ]}
                >
                  <Image source={option.source} style={styles.appIconPreview} />
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
              <OneIcon name={icons.appearance} size={13} color={theme.sky} />
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
      <View style={[styles.radio, { borderColor: active ? theme.sky : theme.fillStrong, backgroundColor: active ? theme.sky : 'transparent' }]}>
        {active ? <OneIcon name={icons.check} size={10.5} color="#FFFFFF" /> : null}
      </View>
    );
  }
}

function previewBackground(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#F2F2F7';
  if (mode === 'dark') return '#000000';
  return current;
}

function previewSurface(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#FFFFFF';
  if (mode === 'dark') return '#1C1C1E';
  return current;
}

function previewText(mode: ThemePreference, current: string) {
  if (mode === 'light') return '#111114';
  if (mode === 'dark') return '#F5F5F7';
  return current;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34, gap: 24 },
  nav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark: { fontSize: 10.75, fontWeight: '700', letterSpacing: 3.2 },
  hero: { paddingTop: 8, paddingBottom: 2 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1.1 },
  subtitle: { marginTop: 7, maxWidth: 500, fontSize: 13, lineHeight: 18.5 },
  section: { gap: 7 },
  groupTitle: { paddingHorizontal: 7, fontSize: 8.5, lineHeight: 12, fontWeight: '700', letterSpacing: 1.15 },
  row: { minHeight: 82, paddingHorizontal: 15, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowCopy: { flex: 1, minWidth: 0 },
  preview: { width: 52, height: 52, borderRadius: 12, padding: 7 },
  previewSignal: { height: 3, flexDirection: 'row', alignItems: 'center', gap: 2 },
  previewSignalLong: { width: 13, height: 2.5, borderRadius: 2 },
  previewSignalBlue: { width: 7, height: 2.5, borderRadius: 2, backgroundColor: '#6E94AE' },
  previewSignalRed: { width: 4, height: 2.5, borderRadius: 2, backgroundColor: '#C26F79' },
  previewCard: { flex: 1, marginTop: 6, borderRadius: 7, padding: 6 },
  previewLine: { width: '72%', height: 3, borderRadius: 2, opacity: 0.62 },
  previewLineShort: { width: '46%', marginTop: 5, opacity: 0.25 },
  appIconPreview: { width: 52, height: 52, borderRadius: 12 },
  rowTitle: { fontSize: 14, lineHeight: 17.5, fontWeight: '600', letterSpacing: -0.08 },
  rowBody: { marginTop: 4, fontSize: 11, lineHeight: 15.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.35, alignItems: 'center', justifyContent: 'center' },
  note: { paddingHorizontal: 7, paddingTop: 2, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteText: { flex: 1, fontSize: 10.25, lineHeight: 14.5 },
  errorText: { paddingHorizontal: 7, fontSize: 10.5, lineHeight: 14.5 }
});
