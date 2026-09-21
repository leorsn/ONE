import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { neverMaterial, neverMotion, neverRadius } from '@/src/theme/tokens';

function nativeGlassAvailable() {
  try { return Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable(); }
  catch { return false; }
}

export function selectionFeedback() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => undefined);
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (alive) setReduced(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { alive = false; listener.remove(); };
  }, []);
  return reduced;
}

// Glass is reserved for controls floating over content. Lists use quiet opaque surfaces.
export function NeverMaterial({ children, style, glass = false }: { children?: ReactNode; style?: StyleProp<ViewStyle>; glass?: boolean }) {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const [reduced, setReduced] = useState(Platform.OS === 'ios');
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => { if (alive) setReduced(value); });
    const listener = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduced);
    return () => { alive = false; listener.remove(); };
  }, []);
  const nativeGlass = glass && !reduced && nativeGlassAvailable();
  return (
    <View style={[styles.surface, {
      backgroundColor: nativeGlass ? 'transparent' : glass && !reduced ? theme.glassStrong : theme.surface,
      borderColor: glass ? theme.glassBorder : theme.border,
      ...(glass ? { shadowColor: theme.shadow, shadowOpacity: neverMaterial.shadowOpacity, shadowRadius: neverMaterial.shadowRadius, shadowOffset: neverMaterial.shadowOffset } : {})
    }, style]}>
      {nativeGlass ? <GlassView pointerEvents="none" colorScheme={resolvedMode} glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: neverRadius.xl }]} /> : null}
      {children}
    </View>
  );
}

export function NeverPressable({ children, style, onPress, ...props }: PressableProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  function animate(toValue: number) {
    if (reduced) { scale.setValue(1); return; }
    Animated.spring(scale, { toValue, ...neverMotion.spring, useNativeDriver: true }).start();
  }
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable {...props} accessibilityRole={props.accessibilityRole ?? 'button'} style={style}
        onPressIn={(event) => { animate(neverMotion.pressScale); props.onPressIn?.(event); }}
        onPressOut={(event) => { animate(1); props.onPressOut?.(event); }}
        onPress={(event) => { selectionFeedback(); onPress?.(event); }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  surface: { borderRadius: neverRadius.xl, borderWidth: StyleSheet.hairlineWidth, borderCurve: 'continuous', overflow: 'hidden' }
});
