import { isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { OneIcon } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';

type IconName = (typeof import('@/src/ui/icons').icons)[keyof typeof import('@/src/ui/icons').icons];
type IconTone = 'accent' | 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'memory';

export function CoreBackdrop() {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.ambientOrb, styles.ambientTop, { backgroundColor: dark ? `${theme.sky}16` : `${theme.sky}10`, shadowColor: theme.sky }]} />
      <View style={[styles.ambientOrb, styles.ambientMid, { backgroundColor: dark ? `${theme.plum}12` : `${theme.plum}0B`, shadowColor: theme.plum }]} />
      <View style={[styles.ambientOrb, styles.ambientBottom, { backgroundColor: dark ? '#FFFFFF08' : '#FFFFFFA8', shadowColor: '#FFFFFF' }]} />
    </View>
  );
}

export function NeverSignal({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.signal, compact && styles.signalCompact]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.signalGraphite, { backgroundColor: theme.chrome }]} />
      <View style={[styles.signalBlue, { backgroundColor: theme.sky }]} />
      <View style={[styles.signalRed, { backgroundColor: theme.danger }]} />
    </View>
  );
}

export function SectionAccent() {
  const theme = useTheme();
  return (
    <View style={styles.sectionAccent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.sectionAccentBlue, { backgroundColor: theme.sky }]} />
      <View style={[styles.sectionAccentRed, { backgroundColor: theme.danger }]} />
    </View>
  );
}

export function BrandHeader({ action, showTagline = false }: { action?: ReactNode; showTagline?: boolean }) {
  const theme = useTheme();
  const homeHeader = showTagline || (isValidElement(action) && action.type === RoundIconButton);
  if (!homeHeader) return action ? <View style={styles.utilityHeader}>{action}</View> : null;
  return (
    <View style={[styles.brandHeader, styles.brandHeaderWithTagline]}>
      <View style={{ flex: 1 }}>
        <View style={styles.wordmarkRow}>
          <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
          <NeverSignal compact />
        </View>
        <Text style={[styles.brandLine, { color: theme.textTertiary }]}>CAPTURE TODAY. REMEMBER TOMORROW.</Text>
      </View>
      {action}
    </View>
  );
}

export function PageHeader({ title, subtitle, eyebrow = 'NEVER', action }: { title: string; subtitle?: string; eyebrow?: string; action?: ReactNode; editorial?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>{eyebrow}</Text>
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
        {meta ? <Text style={[styles.sectionMeta, { color: theme.textTertiary }]}>{meta}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Surface({ children, padded = false }: { children: ReactNode; padded?: boolean }) {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  return (
    <View style={[styles.surface, {
      backgroundColor: dark ? '#1C1C1ECC' : '#FFFFFFD6',
      borderColor: dark ? '#FFFFFF17' : '#FFFFFFE8',
      shadowColor: dark ? '#000000' : '#8790A5',
      shadowOpacity: dark ? 0.32 : 0.13
    }, padded && styles.surfacePadded]}>
      <View pointerEvents="none" style={[styles.surfaceHighlight, { backgroundColor: dark ? '#FFFFFF16' : '#FFFFFF' }]} />
      {children}
    </View>
  );
}

export function IconTile({ icon, tone = 'accent', size = 38 }: { icon: IconName; tone?: IconTone; size?: number }) {
  const theme = useTheme();
  const palette = {
    accent: [theme.accentSoft, theme.accent],
    neutral: [theme.fill, theme.textSecondary],
    success: [theme.successSoft, theme.success],
    danger: [theme.dangerSoft, theme.danger],
    warning: [theme.warningSoft, theme.warning],
    info: [theme.skySoft, theme.sky],
    memory: [theme.plumSoft, theme.plum]
  } as const;
  const [background, color] = palette[tone];
  return (
    <View style={[styles.iconTile, { width: size, height: size, borderRadius: Math.round(size * 0.3), backgroundColor: background, borderColor: `${color}1F` }]}>
      <OneIcon name={icon} size={Math.round(size * 0.42)} color={color} />
    </View>
  );
}

export function RoundIconButton({ icon, onPress, accessibilityLabel, filled = false }: { icon: IconName; onPress: () => void; accessibilityLabel: string; filled?: boolean }) {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  return (
    <Pressable
      onPress={async () => { await Haptics.selectionAsync(); onPress(); }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.roundButton, {
        backgroundColor: filled ? theme.accent : dark ? '#FFFFFF10' : '#FFFFFFB8',
        borderColor: filled ? `${theme.accent}88` : dark ? '#FFFFFF20' : '#FFFFFFEE',
        shadowColor: dark ? '#000000' : '#6D7485',
        opacity: pressed ? 0.72 : 1,
        transform: [{ scale: pressed ? 0.95 : 1 }]
      }]}
    >
      <View pointerEvents="none" style={[styles.roundHighlight, { backgroundColor: dark ? '#FFFFFF12' : '#FFFFFF' }]} />
      <OneIcon name={icon} size={16.5} color={filled ? theme.onAccent : theme.text} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.fill }]}><OneIcon name={icon} size={18} color={theme.textTertiary} /></View>
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
      style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.accent, borderColor: `${theme.accent}CC`, shadowColor: theme.accent, opacity: disabled ? 0.42 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.988 : 1 }] }]}
    >
      {icon ? <OneIcon name={icon} size={15.5} color={theme.onAccent} /> : null}
      <Text style={[styles.primaryButtonText, { color: theme.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export const uiStyles = StyleSheet.create({
  screenContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 128, gap: 22 }
});

const styles = StyleSheet.create({
  ambientOrb: { position: 'absolute', borderRadius: 999, shadowRadius: 82, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.18 },
  ambientTop: { width: 240, height: 240, top: -125, right: -95 },
  ambientMid: { width: 210, height: 210, top: 330, left: -145 },
  ambientBottom: { width: 180, height: 180, bottom: 70, right: -115 },
  utilityHeader: { minHeight: 38, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  brandHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingTop: 2 },
  brandHeaderWithTagline: { minHeight: 56 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  wordmark: { fontSize: 17, lineHeight: 21, fontWeight: '800', letterSpacing: 5.8 },
  brandLine: { marginTop: 8, fontSize: 8, lineHeight: 11, fontWeight: '700', letterSpacing: 1.55 },
  signal: { height: 4, width: 49, flexDirection: 'row', alignItems: 'center', gap: 3 },
  signalCompact: { transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] },
  signalGraphite: { width: 24, height: 4, borderRadius: 2 },
  signalBlue: { width: 12, height: 4, borderRadius: 2 },
  signalRed: { width: 7, height: 4, borderRadius: 2 },
  sectionAccent: { width: 7, height: 20, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  sectionAccentBlue: { width: 3, height: 20, borderRadius: 2 },
  sectionAccentRed: { width: 2, height: 9, borderRadius: 2 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingTop: 2 },
  eyebrow: { fontSize: 8.2, fontWeight: '700', letterSpacing: 1.9, marginBottom: 7 },
  pageTitle: { fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1.15 },
  pageSubtitle: { marginTop: 5, maxWidth: 440, fontSize: 12.5, lineHeight: 18.5 },
  sectionHeader: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16.1, lineHeight: 20, fontWeight: '700', letterSpacing: -0.3 },
  sectionMeta: { fontSize: 10.1, fontWeight: '600', letterSpacing: 0.05 },
  surface: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 22, overflow: 'hidden', shadowRadius: 30, shadowOffset: { width: 0, height: 15 }, elevation: 4 },
  surfaceHighlight: { position: 'absolute', top: 0, left: 22, right: 22, height: StyleSheet.hairlineWidth, zIndex: 2 },
  surfacePadded: { padding: 18 },
  iconTile: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  roundButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', shadowOpacity: 0.15, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  roundHighlight: { position: 'absolute', top: 0, left: 9, right: 9, height: StyleSheet.hairlineWidth },
  emptyState: { minHeight: 112, paddingHorizontal: 24, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 14.2, fontWeight: '600', letterSpacing: -0.12 },
  emptyBody: { marginTop: 5, maxWidth: 280, fontSize: 11.75, lineHeight: 17.25, textAlign: 'center' },
  primaryButton: { minHeight: 50, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  primaryButtonText: { fontSize: 13.75, fontWeight: '700', letterSpacing: -0.04 }
});
