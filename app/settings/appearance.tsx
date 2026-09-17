import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { IconTile, Surface } from '@/src/ui/primitives';
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
  { value: 'light', title: 'Light', body: 'Always use NEVER in light mode.' },
  { value: 'dark', title: 'Dark', body: 'Always use NEVER in dark mode.' }
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
    body: 'Default · atmospheric gradient.',
    source: require('../../assets/icons/never-nature.png')
  },
  {
    value: 'wordmark',
    title: 'Wordmark',
    body: 'Minimal black NEVER wordmark.',
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
            style={({ pressed }) => [styles.navButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Appearance</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <IconTile icon={icons.appearance} size={50} />
          <Text style={[styles.title, { color: theme.text }]}>Choose how NEVER looks.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>System is the default and follows your device automatically.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>Control the in-app light and dark appearance.</Text>
          </View>
          <Surface>
            {options.map((option, index) => {
              const active = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.title} appearance${active ? ', selected' : ''}`}
                  onPress={() => select(option.value)}
                  style={({ pressed }) => [
                    styles.row,
                    index < options.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    { opacity: pressed ? 0.58 : 1 }
                  ]}
                >
                  <View style={[styles.preview, { backgroundColor: previewBackground(option.value, theme.background) }]}>
                    <View style={[styles.previewBar, { backgroundColor: previewSurface(option.value, theme.surface) }]} />
                    <View style={[styles.previewLine, { backgroundColor: previewText(option.value, theme.text) }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{option.title}</Text>
                    <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{option.body}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: active ? theme.chrome : theme.fillStrong, backgroundColor: active ? theme.chrome : 'transparent' }]}>
                    {active ? <View style={[styles.radioInner, { backgroundColor: theme.background }]} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </Surface>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>App Icon</Text>
            <Text style={[styles.sectionBody, { color: theme.textSecondary }]}>Choose how NEVER appears on your Home Screen.</Text>
          </View>
          <Surface>
            {iconOptions.map((option, index) => {
              const active = appIcon === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.title} app icon${active ? ', selected' : ''}`}
                  accessibilityState={{ selected: active, disabled: !canSwitchAppIcon }}
                  disabled={!canSwitchAppIcon}
                  onPress={() => selectAppIcon(option.value)}
                  style={({ pressed }) => [
                    styles.row,
                    index < iconOptions.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                    { opacity: !canSwitchAppIcon ? 0.55 : pressed ? 0.58 : 1 }
                  ]}
                >
                  <Image source={option.source} style={styles.appIconPreview} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: theme.text }]}>{option.title}</Text>
                    <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{option.body}</Text>
                  </View>
                  <View style={[styles.radio, { borderColor: active ? theme.chrome : theme.fillStrong, backgroundColor: active ? theme.chrome : 'transparent' }]}>
                    {active ? <View style={[styles.radioInner, { backgroundColor: theme.background }]} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </Surface>
          {!canSwitchAppIcon ? (
            <Text style={[styles.iconNote, { color: theme.textSecondary }]}>Icon switching is available in the installed iOS native build.</Text>
          ) : null}
          {iconError ? <Text style={styles.errorText}>{iconError}</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 26 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.1 },
  hero: { alignItems: 'center', paddingTop: 14 },
  title: { marginTop: 15, fontSize: 27, lineHeight: 32, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { marginTop: 8, maxWidth: 320, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  section: { gap: 10 },
  sectionCopy: { paddingHorizontal: 2 },
  sectionTitle: { fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing: -0.1 },
  sectionBody: { marginTop: 2, fontSize: 11.5, lineHeight: 16 },
  row: { minHeight: 88, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 13 },
  preview: { width: 52, height: 52, borderRadius: 13, padding: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(127,127,127,0.18)' },
  previewBar: { height: 8, borderRadius: 4 },
  previewLine: { width: '64%', height: 5, borderRadius: 3, marginTop: 9, opacity: 0.72 },
  appIconPreview: { width: 52, height: 52, borderRadius: 13 },
  rowTitle: { fontSize: 14.5, fontWeight: '700' },
  rowBody: { marginTop: 4, fontSize: 11.75, lineHeight: 17 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4 },
  iconNote: { paddingHorizontal: 2, fontSize: 11.5, lineHeight: 16 },
  errorText: { paddingHorizontal: 2, color: '#C95A5A', fontSize: 11.5, lineHeight: 16 }
});
