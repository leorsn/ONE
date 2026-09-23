import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { themes, type NeverTheme, type ThemePreference } from '@/src/theme/editions';
import { ThemeBackdrop } from './ThemeBackdrop';
import { editorialFontFamily } from '@/src/theme/typography';

/** A lightweight live material swatch, drawn from the same registry as the app. */
export const ThemePreview = memo(function ThemePreview({ preference }: { preference: ThemePreference }) {
  if (preference === 'system') return <View style={styles.system}>
    <Miniature theme={themes.platinum} half />
    <Miniature theme={themes.monolith} half />
    <View style={styles.systemLabel}><Text allowFontScaling={false} style={{ color: themes.platinum.text, fontSize: 11, fontWeight: '600' }}>Light / Dark</Text></View>
  </View>;
  return <Miniature theme={themes[preference]} />;
});

function Miniature({ theme: t, half = false }: { theme: NeverTheme; half?: boolean }) {
  return <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.preview, half && { flex: 1 }, { backgroundColor: t.background }]}>
    <ThemeBackdrop theme={t} preview />
    <Text allowFontScaling={false} style={[styles.brand, { color: t.text, letterSpacing: half ? 1 : 3 }]}>NEVER</Text>
    <Text allowFontScaling={false} numberOfLines={2} style={[styles.greeting, { color: t.text, ...t.typography.heading }]}>Capture today.</Text>
    <View style={[styles.capture, {
      backgroundColor: t.materials.input.color,
      borderColor: t.materials.input.border,
      borderRadius: Math.max(5, t.materials.input.radius / 2),
      ...t.materials.input.shadow
    }]}>
      <View style={[styles.captureButton, { borderRadius: Math.min(9, t.radius.icon), backgroundColor: t.accent }]}>
        <Text allowFontScaling={false} style={{ color: t.onAccent, fontSize: 14, lineHeight: 16 }}>+</Text>
      </View>
      {!half ? <View style={[styles.line, { backgroundColor: t.textSecondary, width: '58%' }]} /> : null}
    </View>
    <View style={styles.tiles}>{[0, 1].map((key) => <View key={key} style={[styles.tile, {
      borderRadius: Math.max(4, t.materials.card.radius / 2),
      backgroundColor: t.materials.card.color,
      borderColor: t.materials.card.border,
      ...t.materials.card.shadow
    }]}>
      <View style={[styles.tileGlyph, { borderRadius: t.radius.icon === 999 ? 9 : 3, backgroundColor: t.accentSoft, borderColor: t.border }]} />
      <View style={[styles.line, { backgroundColor: t.textSecondary, width: '60%' }]} />
    </View>)}</View>
    <View style={[styles.list, { borderColor: t.border }]}><View style={[styles.thumbnail, { backgroundColor: t.fillStrong }]} /><View style={[styles.line, { backgroundColor: t.textSecondary }]} /></View>
    <View style={[styles.dock, {
      backgroundColor: t.materials.navigation.color,
      borderColor: t.materials.navigation.border,
      borderRadius: Math.max(5, t.materials.navigation.radius / 2)
    }]}>
      {[0, 1, 2, 3].map((key) => <View key={key} style={[styles.dockDot, { borderRadius: t.radius.icon === 999 ? 6 : 2, backgroundColor: key === 0 ? t.accent : t.textTertiary }]} />)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  preview: { height: 244, padding: 14, gap: 9, overflow: 'hidden' },
  brand: { fontSize: 9, fontWeight: '600' },
  greeting: { fontSize: 18, lineHeight: 21, fontFamily: editorialFontFamily, marginTop: 4 },
  capture: { minHeight: 31, borderWidth: 0.5, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  captureButton: { width: 21, height: 21, alignItems: 'center', justifyContent: 'center' },
  line: { height: 2, width: '45%', opacity: 0.55, borderRadius: 2 },
  tiles: { flexDirection: 'row', gap: 6 },
  tile: { flex: 1, height: 39, padding: 8, gap: 7, borderWidth: 0.5 },
  tileGlyph: { width: 12, height: 12, borderWidth: 0.5 },
  list: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 5, borderBottomWidth: 0.5 },
  thumbnail: { width: 18, height: 18, borderRadius: 3 },
  dock: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', height: 22, borderWidth: 0.5, marginTop: 'auto' },
  dockDot: { width: 6, height: 6 },
  system: { flexDirection: 'row', height: 244, overflow: 'hidden' },
  systemLabel: {
    position: 'absolute', alignSelf: 'center', left: '20%', right: '20%', bottom: 44,
    alignItems: 'center', padding: 6, borderRadius: 12,
    backgroundColor: themes.platinum.materials.card.color
  }
});