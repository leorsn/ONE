import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { NeverMaterial } from '@/src/ui/material';
import { useNeverV5Palette } from '@/src/ui/appleV5';

export function NeverHeroSurface({
  children,
  style,
  compact = false,
  glass = false
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  glass?: boolean;
}) {
  const p = useNeverV5Palette();
  const theme = useTheme();
  return (
    <NeverMaterial glass={glass} style={[styles.hero, compact && styles.heroCompact, style]}>
      {theme.effects.reflection ? <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <View style={[styles.heroReflection, { backgroundColor: p.reflection }]} />
        <View
          style={[
            styles.heroGlow,
            { backgroundColor: theme.effects.light }
          ]}
        />
      </View> : null}
      {children}
    </NeverMaterial>
  );
}

export function NeverEyebrow({ children }: { children: ReactNode }) {
  const p = useNeverV5Palette();
  return <Text style={[styles.eyebrow, { color: p.tertiary }]}>{children}</Text>;
}

export function NeverMetric({
  value,
  label,
  style
}: {
  value: string;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const p = useNeverV5Palette();
  return (
    <View style={[styles.metric, style]}>
      <Text style={[styles.metricValue, { color: p.label }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: p.tertiary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 150,
    borderRadius: 30,
    overflow: 'hidden'
  },
  heroCompact: {
    minHeight: 0,
    borderRadius: 24
  },
  heroReflection: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 0,
    height: StyleSheet.hairlineWidth,
    opacity: 0.88
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -82,
    top: -104
  },
  eyebrow: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 1.35,
    textTransform: 'uppercase'
  },
  metric: {
    minWidth: 72,
    flexShrink: 1,
    gap: 1
  },
  metricValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.35
  },
  metricLabel: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: '500'
  }
});
