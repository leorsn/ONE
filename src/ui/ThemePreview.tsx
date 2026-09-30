import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { themes, type NeverTheme, type ThemePreference } from '@/src/theme/editions';
import { ThemeBackdrop } from './ThemeBackdrop';
import { uiFontFamily } from '@/src/theme/typography';

/** Real artwork and the same neutral controls used by the application. */
export const ThemePreview = memo(function ThemePreview({ preference }: { preference: ThemePreference }) {
  if (preference === 'system') return <View style={styles.system}>
    <BasicMiniature dark={false} />
    <BasicMiniature dark />
    <View style={styles.systemLabel}><Text allowFontScaling={false} style={{ color: themes.platinum.text, fontSize: 11, fontWeight: '600' }}>Light / Dark</Text></View>
  </View>;
  return <Miniature theme={themes[preference]} />;
});

// A plain light/dark swatch, deliberately separate from premium world previews.
function BasicMiniature({ dark }: { dark: boolean }) {
  const ink = dark ? '#F5F5F5' : '#242424';
  const surface = dark ? '#242424' : '#FFFFFF';
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.preview, { flex: 1, backgroundColor: dark ? '#151515' : '#F2F2F2' }]}>
    <View style={styles.copy}><Text allowFontScaling={false} style={[styles.brand, { color: ink, letterSpacing: 1 }]}>NEVER</Text></View>
    <View style={styles.space} />
    <View style={[styles.capture, { backgroundColor: surface, borderColor: dark ? '#393939' : '#DDDDDD' }]}>
      <Text allowFontScaling={false} style={{ color: ink, fontSize: 18 }}>+</Text>
    </View>
    <View style={[styles.dock, { backgroundColor: surface, borderColor: dark ? '#393939' : '#DDDDDD' }]}>
      {[0, 1, 2, 3, 4].map(key => <View key={key} style={{ width: 5, height: 5, borderRadius: 2, backgroundColor: ink }} />)}
    </View>
  </View>;
}

function Miniature({ theme: t, half = false }: { theme: NeverTheme; half?: boolean }) {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.preview, half && { flex: 1 }, { backgroundColor: t.background }]}>
    <ThemeBackdrop theme={t} preview />
    <View style={[styles.copy, { backgroundColor: t.materials.card.color }]}>
      <Text allowFontScaling={false} style={[styles.brand, { color: t.text, letterSpacing: half ? 1 : 3 }]}>NEVER</Text>
      {!half ? <Text allowFontScaling={false} style={[styles.greeting, { color: t.text }]}>Capture today.</Text> : null}
    </View>
    <View style={styles.space} />
    <View style={[styles.capture, { backgroundColor: t.materials.input.color, borderColor: t.materials.input.border }]}>
      <Text allowFontScaling={false} style={{ color: t.text, fontSize: 18 }}>+</Text>
      {!half ? <View style={[styles.line, { backgroundColor: t.textSecondary }]} /> : null}
    </View>
    <View style={[styles.dock, { backgroundColor: t.materials.navigation.color, borderColor: t.materials.navigation.border }]}>
      {[0, 1, 2, 3, 4].map((key) => <View key={key} style={{ width: 5, height: 5, borderRadius: 2, backgroundColor: key === 0 ? t.accent : t.textTertiary }} />)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  preview: { height: 280, padding: 12, gap: 8, overflow: 'hidden' },
  copy: { padding: 8, borderRadius: 10, gap: 8 },
  brand: { fontSize: 9, fontWeight: '600' },
  greeting: { fontSize: 16, lineHeight: 20, fontFamily: uiFontFamily, fontWeight: '600' },
  space: { flex: 1, minHeight: 80 },
  capture: { minHeight: 32, borderRadius: 8, borderWidth: 0.5, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  line: { height: 2, width: '58%', opacity: 0.55, borderRadius: 2 },
  dock: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 24, borderRadius: 10, borderWidth: 0.5 },
  system: { flexDirection: 'row', height: 280, overflow: 'hidden' },
  systemLabel: { position: 'absolute', alignSelf: 'center', left: '15%', right: '15%', bottom: 88, alignItems: 'center', padding: 8, borderRadius: 10, backgroundColor: themes.platinum.surface }
});
