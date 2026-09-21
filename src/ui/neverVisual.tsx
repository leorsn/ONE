import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { NeverMaterial } from '@/src/ui/material';
import { useNeverV5Palette } from '@/src/ui/appleV5';

export function NeverBackdrop() {
  const p = useNeverV5Palette();
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <View
        style={[
          styles.ambientOrb,
          styles.ambientOrbTop,
          { backgroundColor: p.dark ? '#DDE7EE0D' : '#FFFFFFA6' }
        ]}
      />
      <View
        style={[
          styles.ambientOrb,
          styles.ambientOrbBottom,
          { backgroundColor: p.dark ? '#91A5B20B' : '#AEB9C326' }
        ]}
      />
      <View style={[styles.ambientLine, { backgroundColor: p.dark ? '#FFFFFF12' : '#FFFFFFB8' }]} />
    </View>
  );
}

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
  return (
    <NeverMaterial glass={glass} style={[styles.hero, compact && styles.heroCompact, style]}>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <View style={[styles.heroReflection, { backgroundColor: p.reflection }]} />
        <View
          style={[
            styles.heroGlow,
            { backgroundColor: p.dark ? '#D7E3EA0D' : '#FFFFFF8F' }
          ]}
        />
      </View>
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
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
    transform: [{ rotate: '-14deg' }]
  },
  ambientOrbTop: {
    width: 360,
    height: 250,
    right: -175,
    top: 22
  },
  ambientOrbBottom: {
    width: 420,
    height: 260,
    left: -255,
    bottom: 140
  },
  ambientLine: {
    position: 'absolute',
    top: 126,
    right: 26,
    width: 86,
    height: StyleSheet.hairlineWidth,
    opacity: 0.72
  },
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
