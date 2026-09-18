import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { OneIcon } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
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
  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: `${theme.surface}E8`,
          borderColor: `${theme.text}14`,
          shadowColor: theme.shadow
        },
        padded && styles.surfacePadded
      ]}
    >
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
  const palette = {
    accent: [theme.accentSoft, theme.chrome, `${theme.chrome}22`],
    neutral: [theme.fill, theme.textSecondary, theme.border],
    success: [theme.successSoft, theme.success, `${theme.success}28`],
    danger: [theme.dangerSoft, theme.danger, `${theme.danger}28`],
    warning: [theme.warningSoft, theme.warning, `${theme.warning}28`],
    info: [theme.skySoft, theme.sky, `${theme.sky}28`],
    memory: [theme.plumSoft, theme.plum, `${theme.plum}28`]
  } as const;
  const [background, color, border] = palette[tone];

  return (
    <View
      style={[
        styles.iconTile,
        {
          width: size,
          height: size,
          borderRadius: Math.max(8, Math.round(size * 0.18)),
          backgroundColor: `${background}D9`,
          borderColor: `${color}24`
        }
      ]}
    >
      <OneIcon name={icon} size={Math.round(size * 0.43)} color={color} />
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
          backgroundColor: filled ? `${theme.chrome}E8` : `${theme.surfaceElevated}D9`,
          borderColor: filled ? `${theme.chrome}88` : `${theme.text}18`,
          shadowColor: theme.shadow,
          opacity: pressed ? 0.64 : 1
        }
      ]}
    >
      <OneIcon name={icon} size={16.5} color={filled ? theme.onAccent : theme.chrome} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <OneIcon name={icon} size={21} color={theme.textTertiary} />
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
          backgroundColor: `${theme.chrome}E8`,
          borderColor: `${theme.text}22`,
          shadowColor: theme.shadow,
          opacity: disabled ? 0.42 : pressed ? 0.76 : 1
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
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 110,
    gap: 19
  }
});

const styles = StyleSheet.create({
  brandHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingTop: 2 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  wordmark: { fontSize: 17.5, lineHeight: 21, fontWeight: '700', letterSpacing: 5.4 },
  brandLine: { marginTop: 7, fontSize: 8.1, lineHeight: 11.5, fontWeight: '700', letterSpacing: 1.5 },
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
  pageTitle: { fontSize: 30, lineHeight: 35, fontWeight: '600', letterSpacing: -1 },
  editorialTitle: { fontFamily: editorialFontFamily, fontWeight: '400', letterSpacing: -0.78 },
  pageSubtitle: { marginTop: 6, maxWidth: 440, fontSize: 12.5, lineHeight: 18 },
  sectionHeader: { minHeight: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16.25, lineHeight: 20, fontWeight: '600', letterSpacing: -0.24 },
  sectionMeta: { fontSize: 10.25, fontWeight: '600', letterSpacing: 0.12 },
  surface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 17,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  surfacePadded: { padding: 16 },
  iconTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3
  },
  emptyState: { minHeight: 104, paddingHorizontal: 24, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 9, fontSize: 14.1, fontWeight: '600', letterSpacing: -0.1 },
  emptyBody: { marginTop: 5, maxWidth: 270, fontSize: 11.75, lineHeight: 17.25, textAlign: 'center' },
  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3
  },
  primaryButtonText: { fontSize: 13.75, fontWeight: '700', letterSpacing: -0.04 }
});
