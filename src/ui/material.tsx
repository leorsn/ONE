import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { resolveMaterialAppearance, type MaterialRole } from '@/src/theme/editions';
import { useThemeContext } from '@/src/context/ThemeContext';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { neverMotion, neverRadius } from '@/src/theme/tokens';

function nativeGlassAvailable() {
  try { return Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable(); }
  catch { return false; }
}

export function selectionFeedback() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => undefined);
}

export function useReducedMotion() {
  return useThemeContext().reduceMotion;
}

// Glass is reserved for controls floating over content. Lists use quiet opaque surfaces.
export function NeverMaterial({ children, style, glass = false, role, focused = false }: { children?: ReactNode; style?: StyleProp<ViewStyle>; glass?: boolean; role?: MaterialRole; focused?: boolean }) {
  const theme = useTheme();
  const { resolvedMode, reduceTransparency: reduced } = useThemePreference();
  const materialRole = role ?? (glass ? 'input' : 'card');
  const material = theme.materials[materialRole];
  const appearance = resolveMaterialAppearance(theme, materialRole, { reduceTransparency: reduced, nativeGlass: nativeGlassAvailable(), focused });
  return (
    <View style={[styles.surface, style, appearance.style]}>
      {appearance.useGlass ? <GlassView pointerEvents="none" colorScheme={resolvedMode} tintColor={appearance.tint} glassEffectStyle="regular" style={[StyleSheet.absoluteFill, { borderRadius: material.radius, overflow: 'hidden' }]} /> : null}
      {theme.effects.texture ? <View pointerEvents="none" style={{ position: 'absolute', top: 1, left: 2, right: 2, bottom: 2, borderRadius: material.radius - 1, borderTopWidth: 1, borderBottomWidth: 1, borderTopColor: theme.glassBorder, borderBottomColor: theme.border }} /> : null}
      {children}
    </View>
  );
}

export function NeverPressable({ children, style, onPress, ...props }: PressableProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) { scale.stopAnimation(); scale.setValue(1); }
    return () => scale.stopAnimation();
  }, [reduced, scale]);
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
  surface: { borderRadius: neverRadius.xl, borderWidth: StyleSheet.hairlineWidth, borderCurve: 'continuous', overflow: 'visible' }
});
