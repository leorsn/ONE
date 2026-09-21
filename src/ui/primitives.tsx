import { neverType } from '@/src/theme/tokens';
import { NeverMaterial } from '@/src/ui/material';
import { isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { OneIcon } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

type IconName = (typeof import('@/src/ui/icons').icons)[keyof typeof import('@/src/ui/icons').icons];
type IconTone = 'accent' | 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'memory';

export function CoreBackdrop() {
  return null;
}

export function NeverSignal({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.signal, compact && styles.signalCompact]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.signalGraphite, { backgroundColor: theme.chrome }]} />
      <View style={[styles.signalPlatinum, { backgroundColor: theme.platinum }]} />
      <View style={[styles.signalLight, { backgroundColor: theme.textTertiary }]} />
    </View>
  );
}

export function SectionAccent() {
  const theme = useTheme();
  return <View style={[styles.sectionAccent, { backgroundColor: theme.chrome }]} />;
}

export function BrandHeader({ action, showTagline = false }: { action?: ReactNode; showTagline?: boolean }) {
  const theme = useTheme();
  const homeHeader = showTagline || (isValidElement(action) && action.type === RoundIconButton);
  if (!homeHeader) return action ? <View style={styles.utilityHeader}>{action}</View> : null;
  return (
    <View style={styles.brandHeader}>
      <View style={{ flex: 1 }}>
        <View style={styles.wordmarkRow}>
          <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
          <NeverSignal compact />
        </View>
        {showTagline ? <Text style={[styles.brandLine, { color: theme.textTertiary }]}>Capture once. Find it again.</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function PageHeader({ title, subtitle, eyebrow = 'NEVER', action }: { title: string; subtitle?: string; eyebrow?: string; action?: ReactNode; editorial?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>{eyebrow}</Text> : null}
        <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SectionHeader({ title, meta, action, signal = false }: { title: string; meta?: string; action?: ReactNode; signal?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        {signal ? <SectionAccent /> : null}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={styles.sectionRight}>
        {meta ? <Text style={[styles.sectionMeta, { color: theme.textTertiary }]}>{meta}</Text> : null}
        {action}
      </View>
    </View>
  );
}

export function Surface({ children, padded = false }: { children: ReactNode; padded?: boolean }) {
  return <NeverMaterial style={padded && styles.surfacePadded}>{children}</NeverMaterial>;
}

export function IconTile({ icon, tone = 'accent', size = 38 }: { icon: IconName; tone?: IconTone; size?: number }) {
  const theme = useTheme();
  const palette = {
    accent: [theme.platinumSoft, theme.chrome],
    neutral: [theme.fill, theme.textSecondary],
    success: [theme.successSoft, theme.success],
    danger: [theme.dangerSoft, theme.danger],
    warning: [theme.warningSoft, theme.warning],
    info: [theme.chromeSoft, theme.chrome],
    memory: [theme.platinumSoft, theme.platinum]
  } as const;
  const [background, color] = palette[tone];
  return (
    <View style={[styles.iconTile, { width: size, height: size, borderRadius: Math.round(size * 0.29), backgroundColor: background }]}>
      <OneIcon name={icon} size={Math.round(size * 0.42)} color={color} />
    </View>
  );
}

export function RoundIconButton({ icon, onPress, accessibilityLabel, filled = false }: { icon: IconName; onPress: () => void; accessibilityLabel: string; filled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={async () => { await Haptics.selectionAsync(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.roundButton,
        { backgroundColor: filled ? theme.text : theme.surface, opacity: pressed ? 0.58 : 1 }
      ]}
    >
      <OneIcon name={icon} size={16.5} color={filled ? theme.background : theme.text} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.fill }]}><OneIcon name={icon} size={18} color={theme.chrome} /></View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>{body}</Text>
    </View>
  );
}

export function PrimaryButton({ label, icon, onPress, disabled = false }: { label: string; icon?: IconName; onPress: () => void | Promise<void>; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={async () => { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); await onPress(); }}
      style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.text, opacity: disabled ? 0.35 : pressed ? 0.72 : 1 }]}
    >
      {icon ? <OneIcon name={icon} size={15.5} color={theme.background} /> : null}
      <Text style={[styles.primaryButtonText, { color: theme.background }]}>{label}</Text>
    </Pressable>
  );
}

export const uiStyles = StyleSheet.create({
  screenContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 118, gap: 20 }
});

const styles = StyleSheet.create({
  utilityHeader: { minHeight: 38, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  brandHeader: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 16 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark: { fontSize: 15, lineHeight: 18, fontWeight: '800', letterSpacing: 5.1 },
  brandLine: { marginTop: 6, fontSize: 11, lineHeight: 14, fontWeight: '500' },
  signal: { height: 4, width: 49, flexDirection: 'row', alignItems: 'center', gap: 3 },
  signalCompact: { transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] },
  signalGraphite: { width: 24, height: 3, borderRadius: 2 },
  signalPlatinum: { width: 12, height: 3, borderRadius: 2 },
  signalLight: { width: 7, height: 3, borderRadius: 2 },
  sectionAccent: { width: 3, height: 17, borderRadius: 2 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  eyebrow: { fontSize: 11, lineHeight: 15, fontWeight: '600', marginBottom: 5 },
  pageTitle: { ...neverType.hero },
  pageSubtitle: { marginTop: 6, maxWidth: 480, fontSize: 15, lineHeight: 21 },
  sectionHeader: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 20, lineHeight: 24, fontWeight: '700', letterSpacing: -0.35 },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionMeta: { fontSize: 13, lineHeight: 16, fontWeight: '500' },
  surfacePadded: { padding: 16 },
  iconTile: { alignItems: 'center', justifyContent: 'center' },
  roundButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyState: { minHeight: 150, paddingHorizontal: 24, paddingVertical: 22, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 11, fontSize: 17, lineHeight: 21, fontWeight: '600' },
  emptyBody: { marginTop: 4, maxWidth: 280, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  primaryButton: { minHeight: 50, borderRadius: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontSize: 15, lineHeight: 19, fontWeight: '600' }
});
