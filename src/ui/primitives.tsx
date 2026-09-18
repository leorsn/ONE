import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { OneIcon } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';

type IconName = (typeof import('@/src/ui/icons').icons)[keyof typeof import('@/src/ui/icons').icons];
type IconTone = 'accent' | 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'memory';

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

export function BrandHeader({ action }: { action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.brandHeader}>
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

export function PageHeader({
  title,
  subtitle,
  eyebrow = 'NEVER',
  action,
  editorial = true
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  editorial?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>{eyebrow}</Text>
        <Text style={[styles.pageTitle, editorial && styles.editorialTitle, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function SectionHeader({
  title,
  meta,
  action,
  signal = false
}: {
  title: string;
  meta?: string;
  action?: ReactNode;
  signal?: boolean;
}) {
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
    <View
      style={[
        styles.surface,
        {
          backgroundColor: dark ? `${theme.surface}FA` : `${theme.surface}F7`,
          borderColor: dark ? '#FFFFFF10' : '#0000000A',
          shadowColor: theme.shadow,
          shadowOpacity: dark ? 0.22 : 0.09,
          elevation: dark ? 1 : 4
        },
        padded && styles.surfacePadded
      ]}
    >
      <View pointerEvents="none" style={[styles.surfaceHighlight, { backgroundColor: dark ? '#FFFFFF12' : '#FFFFFFE8' }]} />
      {children}
    </View>
  );
}

export function IconTile({
  icon,
  tone = 'accent',
  size = 38
}: {
  icon: IconName;
  tone?: IconTone;
  size?: number;
}) {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  const palette = {
    accent: [theme.accentSoft, theme.chrome],
    neutral: [theme.fill, theme.textSecondary],
    success: [theme.successSoft, theme.success],
    danger: [theme.dangerSoft, theme.danger],
    warning: [theme.warningSoft, theme.warning],
    info: [theme.skySoft, theme.sky],
    memory: [theme.plumSoft, theme.plum]
  } as const;
  const [background, color] = palette[tone];

  return (
    <View
      style={[
        styles.iconTile,
        {
          width: size,
          height: size,
          borderRadius: Math.max(11, Math.round(size * 0.28)),
          backgroundColor: dark ? `${background}B8` : `${background}F0`,
          borderColor: dark ? '#FFFFFF10' : '#00000008',
          shadowColor: theme.shadow,
          shadowOpacity: dark ? 0.08 : 0.06
        }
      ]}
    >
      <OneIcon name={icon} size={Math.round(size * 0.42)} color={color} />
    </View>
  );
}

export function RoundIconButton({
  icon,
  onPress,
  accessibilityLabel,
  filled = false
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  filled?: boolean;
}) {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  return (
    <Pressable
      onPress={async () => {
        await Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.roundButton,
        {
          backgroundColor: filled ? theme.chrome : dark ? `${theme.surfaceElevated}F0` : '#FFFFFFF2',
          borderColor: filled ? `${theme.chrome}B8` : dark ? '#FFFFFF14' : '#0000000C',
          shadowColor: theme.shadow,
          shadowOpacity: dark ? 0.2 : 0.12,
          opacity: pressed ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.965 : 1 }]
        }
      ]}
    >
      <View pointerEvents="none" style={[styles.roundHighlight, { backgroundColor: dark ? '#FFFFFF10' : '#FFFFFFE8' }]} />
      <OneIcon name={icon} size={17} color={filled ? theme.onAccent : theme.chrome} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: `${theme.fill}A8` }]}>
        <OneIcon name={icon} size={19} color={theme.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>{body}</Text>
    </View>
  );
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled = false
}: {
  label: string;
  icon?: IconName;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await onPress();
      }}
      style={({ pressed }) => [
        styles.primaryButton,
        {
          backgroundColor: theme.chrome,
          borderColor: `${theme.chrome}D8`,
          shadowColor: theme.shadow,
          opacity: disabled ? 0.42 : pressed ? 0.78 : 1,
          transform: [{ scale: pressed ? 0.988 : 1 }]
        }
      ]}
    >
      {icon ? <OneIcon name={icon} size={15.5} color={theme.onAccent} /> : null}
      <Text style={[styles.primaryButtonText, { color: theme.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export const uiStyles = StyleSheet.create({
  screenContent: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 118,
    gap: 22
  }
});

const styles = StyleSheet.create({
  brandHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingTop: 2 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordmark: { fontSize: 18, lineHeight: 22, fontWeight: '700', letterSpacing: 5.5 },
  brandLine: { marginTop: 8, fontSize: 8.2, lineHeight: 11.5, fontWeight: '700', letterSpacing: 1.55 },
  signal: { height: 4, width: 49, flexDirection: 'row', alignItems: 'center', gap: 3 },
  signalCompact: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
  signalGraphite: { width: 24, height: 4, borderRadius: 2 },
  signalBlue: { width: 12, height: 4, borderRadius: 2 },
  signalRed: { width: 7, height: 4, borderRadius: 2 },
  sectionAccent: { width: 7, height: 21, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  sectionAccentBlue: { width: 3, height: 21, borderRadius: 2 },
  sectionAccentRed: { width: 2, height: 10, borderRadius: 2 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingTop: 2 },
  eyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  pageTitle: { fontSize: 31, lineHeight: 36, fontWeight: '700', letterSpacing: -1 },
  editorialTitle: { fontFamily: editorialFontFamily, fontWeight: '400', letterSpacing: -0.8 },
  pageSubtitle: { marginTop: 6, maxWidth: 440, fontSize: 12.75, lineHeight: 18.5 },
  sectionHeader: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16.5, lineHeight: 20.5, fontWeight: '700', letterSpacing: -0.3 },
  sectionMeta: { fontSize: 10.25, fontWeight: '600', letterSpacing: 0.08 },
  surface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    overflow: 'hidden',
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 }
  },
  surfaceHighlight: { position: 'absolute', top: 0, left: 22, right: 22, height: StyleSheet.hairlineWidth, zIndex: 2 },
  surfacePadded: { padding: 18 },
  iconTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4
  },
  roundHighlight: { position: 'absolute', top: 0, left: 10, right: 10, height: StyleSheet.hairlineWidth },
  emptyState: { minHeight: 118, paddingHorizontal: 24, paddingVertical: 22, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 11, fontSize: 14.25, fontWeight: '600', letterSpacing: -0.12 },
  emptyBody: { marginTop: 5, maxWidth: 280, fontSize: 11.75, lineHeight: 17.25, textAlign: 'center' },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3
  },
  primaryButtonText: { fontSize: 13.75, fontWeight: '700', letterSpacing: -0.04 }
});
