import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { OneIcon } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

type IconName = (typeof import('@/src/ui/icons').icons)[keyof typeof import('@/src/ui/icons').icons];

export function BrandHeader({ action }: { action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.brandHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
        <Text style={[styles.brandLine, { color: theme.textTertiary }]}>CAPTURE TODAY.\nREMEMBER TOMORROW.</Text>
      </View>
      {action}
    </View>
  );
}

export function PageHeader({
  title,
  subtitle,
  eyebrow = 'NEVER',
  action
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color: theme.chrome }]}>{eyebrow}</Text>
        <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>
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
          backgroundColor: theme.surfaceElevated,
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
  tone?: 'accent' | 'neutral' | 'success' | 'danger';
  size?: number;
}) {
  const theme = useTheme();
  const palette = {
    accent: [theme.chromeSoft, theme.chrome],
    neutral: [theme.fill, theme.textSecondary],
    success: [theme.fill, theme.success],
    danger: [theme.fill, theme.danger]
  } as const;
  const [background, color] = palette[tone];

  return (
    <View
      style={[
        styles.iconTile,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.26),
          backgroundColor: background,
          borderColor: theme.border
        }
      ]}
    >
      <OneIcon name={icon} size={Math.round(size * 0.46)} color={color} />
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
          backgroundColor: filled ? theme.accent : theme.surfaceElevated,
          borderColor: filled ? theme.accent : theme.border,
          shadowColor: theme.shadow,
          opacity: pressed ? 0.64 : 1
        }
      ]}
    >
      <OneIcon name={icon} size={18} color={filled ? theme.onAccent : theme.text} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <IconTile icon={icon} tone="neutral" size={42} />
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
          backgroundColor: theme.accent,
          borderColor: theme.accent,
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 124,
    gap: 28
  }
});

const styles = StyleSheet.create({
  brandHeader: { minHeight: 74, flexDirection: 'row', alignItems: 'flex-start', gap: 18, paddingTop: 2 },
  wordmark: { fontSize: 20, lineHeight: 23, fontWeight: '600', letterSpacing: 5.4 },
  brandLine: { marginTop: 9, fontSize: 8.75, lineHeight: 12.5, fontWeight: '600', letterSpacing: 1.55 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 18, paddingTop: 2 },
  eyebrow: { fontSize: 9.5, fontWeight: '700', letterSpacing: 2.35, marginBottom: 10 },
  pageTitle: { fontSize: 31, lineHeight: 35, fontWeight: '600', letterSpacing: -1.05 },
  pageSubtitle: { marginTop: 8, maxWidth: 420, fontSize: 13, lineHeight: 19 },
  sectionHeader: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  sectionTitle: { fontSize: 17, lineHeight: 21, fontWeight: '600', letterSpacing: -0.28 },
  sectionMeta: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.18 },
  surface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 19,
    overflow: 'hidden',
    shadowOpacity: 0.045,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1
  },
  surfacePadded: { padding: 18 },
  iconTile: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.035,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  emptyState: { minHeight: 146, paddingHorizontal: 28, paddingVertical: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 13, fontSize: 14.5, fontWeight: '600', letterSpacing: -0.12 },
  emptyBody: { marginTop: 6, maxWidth: 260, fontSize: 12.25, lineHeight: 18, textAlign: 'center' },
  primaryButton: { minHeight: 50, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontSize: 14, fontWeight: '600', letterSpacing: -0.05 }
});
