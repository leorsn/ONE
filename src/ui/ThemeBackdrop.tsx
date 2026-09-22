import { memo } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import type { NeverTheme } from '@/src/theme/editions';

// Static geometry: no bitmaps, timers, continuous animation or full-screen blur.
export const ThemeBackdrop = memo(function ThemeBackdrop({ theme, preview = false }: { theme: NeverTheme; preview?: boolean }) {
  const e = theme.effects;
  const atmosphere: ViewStyle = Platform.OS === 'web' ? { backgroundImage: e.atmosphere } as ViewStyle : { experimental_backgroundImage: e.atmosphere };
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, styles.clip, atmosphere]}>
    {e.kind === 'orbit' ? <>
      <View style={[styles.orbitHalo, { backgroundColor: e.light, borderColor: e.edge }]} />
      <View style={[styles.orbit, { backgroundColor: theme.surfaceElevated, borderColor: theme.chrome }]} />
      <View style={[styles.orbitNight, { backgroundColor: theme.background }]} />
    </> : e.kind === 'aurora' ? <>
      <View style={[styles.atmosphere, { backgroundColor: e.shade }]} />
      <View style={[styles.mist, { backgroundColor: e.light }]} />
      <View style={[styles.ridge, { backgroundColor: e.shade, borderColor: e.edge }]} />
      <View style={[styles.ridge, styles.ridgeFront, { backgroundColor: e.light }]} />
    </> : e.kind === 'tactile' ? <>
      <View style={[styles.paperEdge, { borderColor: e.edge, backgroundColor: e.light }]} />
      {Array.from({ length: preview ? 9 : 24 }, (_, index) => <View key={index} style={{ position: 'absolute', top: `${(index * 37) % 100}%`, left: `${(index * 19) % 90}%`, width: 36 + (index % 5) * 11, height: 0.5, backgroundColor: e.shade, transform: [{ rotate: `${(index % 3) - 1}deg` }] }} />)}
    </> : e.kind === 'archive' ? <View style={[styles.archiveRule, { backgroundColor: theme.border }]} /> : <>
      <View style={[styles.metalArc, { borderColor: e.light, backgroundColor: e.shade }]} />
      <View style={[styles.metalArc, styles.metalArcInner, { borderColor: e.edge }]} />
      <View style={[styles.lowerReflection, { backgroundColor: e.light }]} />
    </>}
  </View>;
});
const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  metalArc: { position: 'absolute', width: '150%', height: '57%', right: '-65%', top: '-25%', borderRadius: 999, borderWidth: 1, transform: [{ rotate: '-24deg' }] },
  metalArcInner: { right: '-70%', top: '-24%', backgroundColor: 'transparent' },
  lowerReflection: { position: 'absolute', width: '75%', height: '38%', left: '-58%', bottom: '-10%', borderRadius: 999, transform: [{ rotate: '22deg' }] },
  orbitHalo: { position: 'absolute', width: '125%', aspectRatio: 1, right: '-51%', top: '7%', borderRadius: 999, borderWidth: 0.5 },
  orbit: { position: 'absolute', width: '113%', aspectRatio: 1, right: '-45%', top: '10%', borderRadius: 999, borderTopWidth: 2, borderRightWidth: 1, opacity: 0.6 },
  orbitNight: { position: 'absolute', width: '115%', aspectRatio: 1, right: '-39%', top: '14%', borderRadius: 999 },
  atmosphere: { position: 'absolute', width: '170%', height: '48%', top: '-22%', left: '-24%', borderRadius: 999 },
  mist: { position: 'absolute', width: '120%', height: '48%', top: '15%', right: '-72%', borderRadius: 999 },
  ridge: { position: 'absolute', width: '140%', height: '44%', bottom: '-15%', left: '-42%', borderRadius: 50, transform: [{ rotate: '-28deg' }], borderTopWidth: 1 },
  ridgeFront: { bottom: '-28%', left: '0%', transform: [{ rotate: '24deg' }] },
  paperEdge: { position: 'absolute', top: 14, bottom: 14, left: 9, right: 9, borderWidth: 0.5, borderRadius: 3 },
  archiveRule: { position: 'absolute', top: '23%', right: 0, width: '8%', height: 0.5 }
});
