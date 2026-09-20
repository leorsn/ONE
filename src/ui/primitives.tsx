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
      <View style={[styles.chromeHalo, styles.chromeHaloTop, { backgroundColor: dark ? '#DDE3EA10' : '#FFFFFFA8', borderColor: dark ? '#FFFFFF12' : '#FFFFFFD6' }]} />
      <View style={[styles.chromeHalo, styles.chromeHaloLeft, { backgroundColor: dark ? '#AAB3BF0A' : '#CDD3DA72', borderColor: dark ? '#FFFFFF0D' : '#FFFFFFB8' }]} />
      <View style={[styles.chromeHalo, styles.chromeHaloBottom, { backgroundColor: dark ? '#FFFFFF08' : '#FFFFFF94', borderColor: dark ? '#FFFFFF0C' : '#FFFFFFC4' }]} />
      <View style={[styles.metalRail, { backgroundColor: dark ? '#FFFFFF12' : '#FFFFFFD8' }]} />
      <View style={[styles.metalRailInner, { backgroundColor: dark ? '#FFFFFF08' : '#AEB6C13D' }]} />
      <View style={[styles.ambientOrb, styles.ambientTop, { backgroundColor: dark ? `${theme.platinum}13` : `${theme.platinum}1B`, shadowColor: theme.platinum }]} />
    </View>
  );
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
  return (
    <View style={styles.sectionAccent} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.sectionAccentMain, { backgroundColor: theme.chrome }]} />
      <View style={[styles.sectionAccentSoft, { backgroundColor: theme.platinum }]} />
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
      backgroundColor: dark ? '#161A1FD9' : '#F9FAFCE8',
      borderColor: dark ? '#FFFFFF1C' : '#FFFFFFF2',
      shadowColor: dark ? '#000000' : '#59616D',
      shadowOpacity: dark ? 0.38 : 0.16
    }, padded && styles.surfacePadded]}>
      <View pointerEvents="none" style={[styles.surfaceHighlight, { backgroundColor: dark ? '#FFFFFF22' : '#FFFFFF' }]} />
      <View pointerEvents="none" style={[styles.surfaceLowerHighlight, { backgroundColor: dark ? '#FFFFFF0C' : '#89929D24' }]} />
      {children}
    </View>
  );
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
    <View style={[styles.iconTile, { width: size, height: size, borderRadius: Math.round(size * 0.3), backgroundColor: background, borderColor: `${color}28` }]}>
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
        backgroundColor: filled ? theme.chrome : dark ? '#161B20E8' : '#F7F9FBEF',
        borderColor: filled ? theme.reflection : dark ? '#FFFFFF20' : '#FFFFFFF6',
        shadowColor: dark ? '#000000' : '#5D6570',
        opacity: pressed ? 0.72 : 1,
        transform: [{ scale: pressed ? 0.94 : 1 }]
      }]}
    >
      <View pointerEvents="none" style={[styles.roundHighlight, { backgroundColor: dark ? '#FFFFFF1D' : '#FFFFFF' }]} />
      <OneIcon name={icon} size={16.5} color={filled ? theme.background : theme.chrome} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.platinumSoft, borderColor: theme.glassBorder }]}><OneIcon name={icon} size={18} color={theme.chrome} /></View>
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
      style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.chrome, borderColor: theme.reflection, shadowColor: theme.shadow, opacity: disabled ? 0.42 : pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.986 : 1 }] }]}
    >
      {icon ? <OneIcon name={icon} size={15.5} color={theme.background} /> : null}
      <Text style={[styles.primaryButtonText, { color: theme.background }]}>{label}</Text>
      <View pointerEvents="none" style={[styles.primaryHighlight, { backgroundColor: '#FFFFFF52' }]} />
    </Pressable>
  );
}

export const uiStyles = StyleSheet.create({
  screenContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 132, gap: 20 }
});

const styles = StyleSheet.create({
  chromeHalo: { position: 'absolute', borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  chromeHaloTop: { width: 310, height: 310, top: -170, right: -105 },
  chromeHaloLeft: { width: 235, height: 235, top: 515, left: -165 },
  chromeHaloBottom: { width: 260, height: 260, bottom: -95, right: -145 },
  metalRail: { position: 'absolute', top: 94, right: -20, width: 190, height: 1, opacity: 0.75 },
  metalRailInner: { position: 'absolute', top: 98, right: 22, width: 108, height: 1, opacity: 0.58 },
  ambientOrb: { position: 'absolute', borderRadius: 999, shadowRadius: 90, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.22 },
  ambientTop: { width: 170, height: 170, top: -96, right: -36 },
  utilityHeader: { minHeight: 38, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  brandHeader: { minHeight: 34, flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingTop: 2 },
  brandHeaderWithTagline: { minHeight: 56 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontSize: 16.5, lineHeight: 21, fontWeight: '800', letterSpacing: 5.7 },
  brandLine: { marginTop: 8, fontSize: 7.8, lineHeight: 10, fontWeight: '700', letterSpacing: 1.65 },
  signal: { height: 4, width: 49, flexDirection: 'row', alignItems: 'center', gap: 3 },
  signalCompact: { transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] },
  signalGraphite: { width: 24, height: 4, borderRadius: 2 },
  signalPlatinum: { width: 12, height: 4, borderRadius: 2 },
  signalLight: { width: 7, height: 4, borderRadius: 2 },
  sectionAccent: { width: 8, height: 20, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  sectionAccentMain: { width: 3, height: 20, borderRadius: 2 },
  sectionAccentSoft: { width: 3, height: 11, borderRadius: 2 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingTop: 3 },
  eyebrow: { fontSize: 8.1, fontWeight: '800', letterSpacing: 2.05, marginBottom: 7 },
  pageTitle: { fontSize: 33, lineHeight: 38, fontWeight: '750', letterSpacing: -1.05 },
  pageSubtitle: { marginTop: 5, maxWidth: 440, fontSize: 12.5, lineHeight: 18.5 },
  sectionHeader: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15.8, lineHeight: 20, fontWeight: '700', letterSpacing: -0.28 },
  sectionMeta: { fontSize: 9.8, fontWeight: '700', letterSpacing: 0.1 },
  surface: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 24, overflow: 'hidden', shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 5 },
  surfaceHighlight: { position: 'absolute', top: 0, left: 22, right: 22, height: StyleSheet.hairlineWidth, zIndex: 2 },
  surfaceLowerHighlight: { position: 'absolute', bottom: 0, left: 52, right: 52, height: StyleSheet.hairlineWidth, zIndex: 2 },
  surfacePadded: { padding: 18 },
  iconTile: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  roundButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 9 }, elevation: 5 },
  roundHighlight: { position: 'absolute', top: 0, left: 9, right: 9, height: StyleSheet.hairlineWidth },
  emptyState: { minHeight: 112, paddingHorizontal: 24, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 38, height: 38, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 14.2, fontWeight: '600', letterSpacing: -0.12 },
  emptyBody: { marginTop: 5, maxWidth: 280, fontSize: 11.75, lineHeight: 17.25, textAlign: 'center' },
  primaryButton: { minHeight: 50, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', shadowOpacity: 0.24, shadowRadius: 17, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  primaryButtonText: { fontSize: 13.75, fontWeight: '700', letterSpacing: -0.04 },
  primaryHighlight: { position: 'absolute', top: 0, left: 24, right: 24, height: StyleSheet.hairlineWidth }
});
