import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { OneIcon } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

type IconName = (typeof import('@/src/ui/icons').icons)[keyof typeof import('@/src/ui/icons').icons];

export function PageHeader({
  title,
  subtitle,
  eyebrow = 'ONE',
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
        <Text style={[styles.eyebrow, { color: theme.accent }]}>{eyebrow}</Text>
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
        { backgroundColor: theme.surface, borderColor: theme.border },
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
    accent: [theme.accentSoft, theme.accent],
    neutral: [theme.fill, theme.textSecondary],
    success: [theme.fill, theme.success],
    danger: [theme.fill, theme.danger]
  } as const;
  const [background, color] = palette[tone];

  return (
    <View style={[styles.iconTile, { width: size, height: size, borderRadius: Math.round(size * 0.32), backgroundColor: background }]}>
      <OneIcon name={icon} size={Math.round(size * 0.5)} color={color} />
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
        { backgroundColor: filled ? theme.accent : theme.fill, opacity: pressed ? 0.68 : 1 }
      ]}
    >
      <OneIcon name={icon} size={18} color={filled ? '#FFFFFF' : theme.text} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <IconTile icon={icon} tone="neutral" size={44} />
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
        { backgroundColor: theme.accent, opacity: disabled ? 0.45 : pressed ? 0.78 : 1 }
      ]}
    >
      {icon ? <OneIcon name={icon} size={18} color="#FFFFFF" /> : null}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export const uiStyles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 120,
    gap: 24
  }
});

const styles = StyleSheet.create({
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4, marginBottom: 6 },
  pageTitle: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1.1 },
  pageSubtitle: { marginTop: 7, maxWidth: 330, fontSize: 14, lineHeight: 20 },
  sectionHeader: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.35 },
  sectionMeta: { fontSize: 12, fontWeight: '600' },
  surface: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, overflow: 'hidden' },
  surfacePadded: { padding: 16 },
  iconTile: { alignItems: 'center', justifyContent: 'center' },
  roundButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  emptyState: { minHeight: 148, paddingHorizontal: 24, paddingVertical: 26, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 12, fontSize: 15, fontWeight: '700' },
  emptyBody: { marginTop: 5, maxWidth: 250, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  primaryButton: { minHeight: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }
});
