import { neverControl, neverRadius, neverType } from '@/src/theme/tokens';
import { NeverMaterial, selectionFeedback } from '@/src/ui/material';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

type IconName = (typeof icons)[keyof typeof icons];
type GlassTone = 'quiet' | 'default' | 'strong';

export function NeverGlass({
  children,
  tone = 'default',
  padded = false,
  style
}: {
  children: ReactNode;
  tone?: GlassTone;
  padded?: boolean;
  style?: object;
}) {
  return <NeverMaterial glass={tone === 'strong'} style={[padded && styles.groupPadded, style]}>{children}</NeverMaterial>;
}

export function NeverSectionLabel({
  children,
  meta
}: {
  children: ReactNode;
  meta?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionLabelRow}>
      <Text style={[styles.sectionLabel, { color: theme.text }]}>{children}</Text>
      {meta ? <Text style={[styles.sectionMeta, { color: theme.textTertiary }]}>{meta}</Text> : null}
    </View>
  );
}

export function NeverCommandBar({
  label = 'Ask NEVER',
  hint = 'Find anything you saved',
  onPress
}: {
  label?: string;
  hint?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={async () => {
        selectionFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.commandBar,
        {
          backgroundColor: theme.materials.card.color,
          borderColor: theme.materials.card.border,
          borderRadius: theme.radius.card,
          opacity: pressed ? 0.62 : 1
        }
      ]}
    >
      <View style={[styles.commandGlyph, { backgroundColor: theme.accentSoft, borderColor: theme.border, borderRadius: theme.radius.icon }]}>
        <OneIcon name={icons.ask} size={15} color={theme.chrome} />
      </View>
      <View style={styles.commandCopy}>
        <Text style={[styles.commandLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.commandHint, { color: theme.textSecondary }]} numberOfLines={1}>{hint}</Text>
      </View>
      <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
    </Pressable>
  );
}

export function NeverChromeButton({
  label,
  icon,
  onPress,
  disabled = false,
  compact = false,
  busy = false
}: {
  label: string;
  icon?: IconName;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  compact?: boolean;
  busy?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={async () => {
        selectionFeedback();
        await onPress();
      }}
      style={({ pressed }) => [
        styles.primaryButton,
        compact && styles.primaryButtonCompact,
        {
          backgroundColor: theme.accent,
          borderColor: theme.mode === 'dark' ? theme.glassBorder : theme.accent,
          borderRadius: theme.radius.button,
          opacity: disabled || busy ? 0.32 : pressed ? 0.72 : 1
        }
      ]}
    >
      {busy ? <ActivityIndicator color={theme.onAccent} /> : icon ? <OneIcon name={icon} size={20} color={theme.onAccent} /> : null}
      <Text style={[styles.primaryButtonText, { color: theme.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

export function NeverIconButton({
  icon,
  accessibilityLabel,
  onPress,
  filled = false
}: {
  icon: IconName;
  accessibilityLabel: string;
  onPress: () => void;
  filled?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={async () => {
        selectionFeedback();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        {
          borderRadius: theme.radius.icon,
          backgroundColor: filled ? theme.accent : theme.accentSoft,
          borderColor: filled ? theme.accent : theme.border,
          opacity: pressed ? 0.58 : 1
        }
      ]}
    >
      <OneIcon name={icon} size={16} color={filled ? theme.onAccent : theme.chrome} />
    </Pressable>
  );
}

export function NeverHairline() {
  const theme = useTheme();
  return <View style={[styles.hairline, { backgroundColor: theme.border }]} />;
}

export function NeverWordmark({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.wordmarkRow}>
      <Text style={[compact ? styles.wordmarkCompact : styles.wordmark, theme.typography.wordmark, { color: theme.text }]}>NEVER</Text>
      <View style={styles.signal}>
        <View style={[styles.signalLong, { backgroundColor: theme.chrome }]} />
        <View style={[styles.signalShort, { backgroundColor: theme.textTertiary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupPadded: { padding: 16 },
  sectionLabelRow: {
    minHeight: 28,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionLabel: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.35
  },
  sectionMeta: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500'
  },
  commandBar: {
    minHeight: 68,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  commandGlyph: {
    width: 40,
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  commandCopy: { flex: 1, minWidth: 0 },
  commandLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: -0.15
  },
  commandHint: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 17
  },
  primaryButton: {
    minHeight: neverControl.primary,
    paddingVertical: 12,
    borderRadius: neverRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryButtonCompact: {
    minHeight: neverControl.minimum,
    paddingHorizontal: 14,
    borderRadius: 12
  },
  primaryButtonText: { ...neverType.bodyStrong, flexShrink: 1, textAlign: 'center' },
  iconButton: {
    width: 44,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    width: '100%'
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9
  },
  wordmark: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 5.1
  },
  wordmarkCompact: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 4.5
  },
  signal: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  signalLong: { width: 16, height: 2.5, borderRadius: 2 },
  signalShort: { width: 6, height: 2.5, borderRadius: 2 }
});
