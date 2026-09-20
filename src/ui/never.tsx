import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
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
  const theme = useTheme();
  const backgroundColor = tone === 'quiet'
    ? theme.surface
    : tone === 'strong'
      ? theme.surfaceElevated
      : theme.surface;

  return (
    <View
      style={[
        styles.group,
        { backgroundColor },
        padded && styles.groupPadded,
        style
      ]}
    >
      {children}
    </View>
  );
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
        await Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.commandBar,
        {
          backgroundColor: theme.surface,
          opacity: pressed ? 0.62 : 1
        }
      ]}
    >
      <View style={[styles.commandGlyph, { backgroundColor: theme.fill }]}>
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
  compact = false
}: {
  label: string;
  icon?: IconName;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={async () => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await onPress();
      }}
      style={({ pressed }) => [
        styles.primaryButton,
        compact && styles.primaryButtonCompact,
        {
          backgroundColor: theme.text,
          opacity: disabled ? 0.32 : pressed ? 0.72 : 1
        }
      ]}
    >
      {icon ? <OneIcon name={icon} size={15} color={theme.background} /> : null}
      <Text style={[styles.primaryButtonText, { color: theme.background }]}>{label}</Text>
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
        await Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: filled ? theme.text : theme.surface,
          opacity: pressed ? 0.58 : 1
        }
      ]}
    >
      <OneIcon name={icon} size={16} color={filled ? theme.background : theme.text} />
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
      <Text style={[compact ? styles.wordmarkCompact : styles.wordmark, { color: theme.text }]}>NEVER</Text>
      <View style={styles.signal}>
        <View style={[styles.signalLong, { backgroundColor: theme.chrome }]} />
        <View style={[styles.signalShort, { backgroundColor: theme.textTertiary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: 20,
    overflow: 'hidden'
  },
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
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  commandGlyph: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  primaryButtonCompact: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 12
  },
  primaryButtonText: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600'
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    letterSpacing: 4.3
  },
  signal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  signalLong: {
    width: 18,
    height: 3,
    borderRadius: 2
  },
  signalShort: {
    width: 7,
    height: 3,
    borderRadius: 2
  }
});
