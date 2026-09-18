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

export function SectionHeader({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <NeverSignal compact />
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
          backgroundColor: theme.surface,
          borderColor: theme.border,
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
    accent: [theme.accentSoft, theme.chrome, `${theme.chrome}26`],
    neutral: [theme.fill, theme.textSecondary, theme.border],
    success: [theme.successSoft, theme.success, `${theme.success}2C`],
    danger: [theme.dangerSoft, theme.danger, `${theme.danger}2C`],
    warning: [theme.warningSoft, theme.warning, `${theme.warning}2C`],
    info: [theme.skySoft, theme.sky, `${theme.sky}2C`],
    memory: [theme.plumSoft, theme.plum, `${theme.plum}2C`]
  } as const;
  const [background, color, border] = palette[tone];

  return (
    <View
      style={[
        styles.iconTile,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
          backgroundColor: background,
          borderColor: border
        }
      ]}
    >
      <OneIcon name={icon} size={Math.round(size * 0.44)} color={color} />
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
          backgroundColor: filled ? theme.chrome : theme.fill,
          borderColor: filled ? theme.chrome : theme.border,
          shadowColor: theme.shadow,
          opacity: pressed ? 0.64 : 1
        }
      ]}
    >
      <OneIcon name={icon} size={17} color={filled ? theme.onAccent : theme.chrome} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <OneIcon name={icon} size={24} color={theme.textTertiary} />
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
          borderColor: theme.chrome,
          opacity: disabled ? 0.42 : pressed ? 0.76 : 1
        }
      ]}
    >
      {icon ? <OneIcon name={icon} size={16} color={theme.onAccent} /> : null}
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
    paddingTop: 12,
    paddingBottom: 126,
    gap: 24
  }
});

const styles = StyleSheet.create({
  brandHeader: { minHeight: 72, flexDirection: 'row', alignItems: 'flex-start', gap: 18, paddingTop: 2 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordmark: { fontSize: 18, lineHeight: 22, fontWeight: '700', letterSpacing: 5.6 },
  brandLine: { marginTop: 8, fontSize: 8.25, lineHeight: 12, fontWeight: '700', letterSpacing: 1.55 },
  signal: { height: 4, width: 49, flexDirection: 'row', alignItems: 'center', gap: 3 },
  signalCompact: { transform: [{ scaleX: 0.82 }, { scaleY: 0.82 }] },
  signalGraphite: { width: 24, height: 4, borderRadius: 2 },
  signalBlue: { width: 12, height: 4, borderRadius: 2 },
  signalRed: { width: 7, height: 4, borderRadius: 2 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 18, paddingTop: 2 },
  eyebrow: { fontSize: 8.75, fontWeight: '700', letterSpacing: 2.05, marginBottom: 9 },
  pageTitle: { fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  editorialTitle: { fontFamily: editorialFontFamily, fontWeight: '400', letterSpacing: -0.8 },
  pageSubtitle: { marginTop: 6, maxWidth: 440, fontSize: 12.75, lineHeight: 18.5 },
  sectionHeader: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, lineHeight: 21, fontWeight: '600', letterSpacing: -0.28 },
  sectionMeta: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.16 },
  surface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOpacity: 0.045,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 1
  },
  surfacePadded: { padding: 18 },
  iconTile: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.04,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 }
  },
  emptyState: { minHeight: 140, paddingHorizontal: 28, paddingVertical: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 12, fontSize: 14.5, fontWeight: '600', letterSpacing: -0.12 },
  emptyBody: { marginTop: 6, maxWidth: 270, fontSize: 12.25, lineHeight: 18, textAlign: 'center' },
  primaryButton: { minHeight: 50, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontSize: 14, fontWeight: '700', letterSpacing: -0.05 }
});
