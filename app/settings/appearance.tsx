import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { IconTile, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import type { ThemePreference } from '@/src/context/ThemeContext';

const options: Array<{
  value: ThemePreference;
  title: string;
  body: string;
}> = [
  { value: 'system', title: 'System', body: 'Follow your iPhone appearance automatically.' },
  { value: 'light', title: 'Light', body: 'Always use ONE in light mode.' },
  { value: 'dark', title: 'Dark', body: 'Always use ONE in dark mode.' }
];

export default function AppearanceScreen() {
  const theme = useTheme();
  const { preference, setPreference } = useThemePreference();

  async function select(value: ThemePreference) {
    await Haptics.selectionAsync();
    await setPreference(value);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Appearance</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <IconTile icon={icons.appearance} size={50} />
          <Text style={[styles.title, { color: theme.text }]}>Choose how ONE looks.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            System is the default and follows your iPhone automatically.
          </Text>
        </View>

        <Surface>
          {options.map((option, index) => {
            const active = preference === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => select(option.value)}
                style={({ pressed }) => [
                  styles.row,
                  index < options.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                  { opacity: pressed ? 0.64 : 1 }
                ]}
              >
                <View style={[styles.preview, { backgroundColor: previewBackground(option.value, theme.background, theme.surface) }]}>
                  <View style={[styles.previewBar, { backgroundColor: previewSurface(option.value, theme.surface, theme.fillStrong) }]} />
                  <View style={[styles.previewLine, { backgroundColor: previewText(option.value, theme.text, theme.textSecondary) }]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.text }]}>{option.title}</Text>
                  <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{option.body}</Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor: active ? theme.accent : theme.fillStrong,
                      backgroundColor: active ? theme.accent : 'transparent'
                    }
                  ]}
                >
                  {active ? <View style={styles.radioInner} /> : null}
                </View>
              </Pressable>
            );
          })}
        </Surface>
      </View>
    </SafeAreaView>
  );
}

function previewBackground(mode: ThemePreference, current: string, surface: string) {
  if (mode === 'light') return '#F5F6F8';
  if (mode === 'dark') return '#0B0C0E';
  return current;
}

function previewSurface(mode: ThemePreference, current: string, fallback: string) {
  if (mode === 'light') return '#FFFFFF';
  if (mode === 'dark') return '#202328';
  return current || fallback;
}

function previewText(mode: ThemePreference, current: string, secondary: string) {
  if (mode === 'light') return '#111318';
  if (mode === 'dark') return '#F7F8FA';
  return current || secondary;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8, gap: 24 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  hero: { alignItems: 'center', paddingTop: 12 },
  title: { marginTop: 14, fontSize: 27, lineHeight: 32, fontWeight: '800', letterSpacing: -0.7, textAlign: 'center' },
  subtitle: { marginTop: 8, maxWidth: 320, fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  row: { minHeight: 88, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  preview: { width: 52, height: 52, borderRadius: 14, padding: 8 },
  previewBar: { height: 8, borderRadius: 4 },
  previewLine: { width: '64%', height: 5, borderRadius: 3, marginTop: 9 },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowBody: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }
});
