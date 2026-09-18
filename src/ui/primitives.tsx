import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { OneIcon } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

type IconName = (typeof import('@/src/ui/icons').icons)[keyof typeof import('@/src/ui/icons').icons];
type IconTone = 'accent' | 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'memory';

export function BrandHeader({ action }: { action?: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.brandHeader}>
      <View style={{ flex: 1 }}>
        <View style={styles.wordmarkRow}>
          <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
          <View style={styles.brandSpectrum} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={[styles.spectrumSegment, { backgroundColor: theme.accent }]} />
            <View style={[styles.spectrumSegment, { backgroundColor: theme.sky }]} />
            <View style={[styles.spectrumSegment, { backgroundColor: theme.plum }]} />
            <View style={[styles.spectrumSegment, { backgroundColor: theme.success }]} />
          </View>
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
        <View style={[styles.sectionAccent, { backgroundColor: theme.accent }]} />
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
  tone?: IconTone;
  size?: number;
}) {
  const theme = useTheme();
  const palette = {
    accent: [theme.accentSoft, theme.accent, `${theme.accent}2F`],
    neutral: [theme.fill, theme.chrome, theme.border],
    success: [theme.successSoft, theme.success, `${theme.success}2F`],
    danger: [theme.dangerSoft, theme.danger, `${theme.danger}2F`],
    warning: [theme.warningSoft, theme.warning, `${theme.warning}2F`],
    info: [theme.skySoft, theme.sky, `${theme.sky}2F`],
    memory: [theme.plumSoft, theme.plum, `${theme.plum}2F`]
  } as const;
  const [background, color, border] = palette[tone];

  return (
    <View
      style={[
        styles.iconTile,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.3),
          backgroundColor: background,
          borderColor: border
        }
      ]}
    >
      <OneIcon name={icon} size={Math.round(size * 0.45)} color={color} />
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
          backgroundColor: filled ? theme.accent : theme.accentSoft,
          borderColor: filled ? theme.accent : `${theme.accent}2F`,
          shadowColor: filled ? theme.accent : theme.shadow,
          opacity: pressed ? 0.64 : 1
        }
      ]}
    >
      <OneIcon name={icon} size={18} color={filled ? theme.onAccent : theme.accent} />
    </Pressable>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <IconTile icon={icon} tone="accent" size={44} />
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
          shadowColor: theme.accent,
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
    paddingBottom: 132,
    gap: 26
  }
});

const styles = StyleSheet.create({
  brandHeader: { minHeight: 74, flexDirection: 'row', alignItems: 'flex-start', gap: 18, paddingTop: 2 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordmark: { fontSize: 21, lineHeight: 24, fontWeight: '700', letterSpacing: 5.2 },
  brandSpectrum: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingTop: 1 },
  spectrumSegment: { width: 9, height: 3, borderRadius: 2 },
  brandLine: { marginTop: 9, fontSize: 8.5, lineHeight: 12.5, fontWeight: '700', letterSpacing: 1.48 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 18, paddingTop: 2 },
  eyebrow: { fontSize: 9.5, fontWeight: '800', letterSpacing: 2.2, marginBottom: 10 },
  pageTitle: { fontSize: 32, lineHeight: 36, fontWeight: '600', letterSpacing: -1.12 },
  pageSubtitle: { marginTop: 8, maxWidth: 420, fontSize: 13, lineHeight: 19 },
  sectionHeader: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionAccent: { width: 3, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: 17, lineHeight: 21, fontWeight: '600', letterSpacing: -0.3 },
  sectionMeta: { fontSize: 10.5, fontWeight: '600', letterSpacing: 0.16 },
  surface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    overflow: 'hidden',
    shadowOpacity: 0.055,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2
  },
  surfacePadded: { padding: 18 },
  iconTile: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  emptyState: { minHeight: 150, paddingHorizontal: 28, paddingVertical: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 13, fontSize: 14.5, fontWeight: '600', letterSpacing: -0.12 },
  emptyBody: { marginTop: 6, maxWidth: 270, fontSize: 12.25, lineHeight: 18, textAlign: 'center' },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 2
  },
  primaryButtonText: { fontSize: 14, fontWeight: '700', letterSpacing: -0.05 }
});
