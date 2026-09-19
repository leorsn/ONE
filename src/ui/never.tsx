import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { neverRadius, neverType } from '@/src/theme/typography';

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
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';

  const background = tone === 'quiet'
    ? (dark ? '#0E1013B8' : '#FFFFFFB8')
    : tone === 'strong'
      ? theme.glassStrong
      : theme.glass;

  return (
    <View
      style={[
        styles.glass,
        {
          backgroundColor: background,
          borderColor: theme.glassBorder,
          shadowColor: theme.shadow,
          shadowOpacity: dark ? 0.28 : 0.1
        },
        padded && styles.glassPadded,
        style
      ]}
    >
      <View pointerEvents="none" style={[styles.glassReflection, { backgroundColor: theme.reflection }]} />
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
      <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>{children}</Text>
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
          backgroundColor: theme.glassStrong,
          borderColor: theme.glassBorder,
          shadowColor: theme.shadow,
          opacity: pressed ? 0.78 : 1,
          transform: [{ scale: pressed ? 0.993 : 1 }]
        }
      ]}
    >
      <View style={[styles.commandGlyph, { backgroundColor: theme.platinumSoft, borderColor: theme.border }]}>
        <OneIcon name={icons.ask} size={16} color={theme.chrome} />
      </View>
      <View style={styles.commandCopy}>
        <Text style={[styles.commandLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.commandHint, { color: theme.textTertiary }]} numberOfLines={1}>{hint}</Text>
      </View>
      <View style={[styles.commandAction, { backgroundColor: theme.chrome, borderColor: theme.reflection }]}>
        <OneIcon name={icons.chevron} size={13} color={theme.background} />
      </View>
      <View pointerEvents="none" style={[styles.commandReflection, { backgroundColor: theme.reflection }]} />
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
        styles.chromeButton,
        compact && styles.chromeButtonCompact,
        {
          backgroundColor: theme.chrome,
          borderColor: theme.reflection,
          shadowColor: theme.shadow,
          opacity: disabled ? 0.38 : pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.988 : 1 }]
        }
      ]}
    >
      {icon ? <OneIcon name={icon} size={15} color={theme.background} /> : null}
      <Text style={[styles.chromeButtonText, { color: theme.background }]}>{label}</Text>
      <View pointerEvents="none" style={[styles.chromeReflection, { backgroundColor: '#FFFFFF42' }]} />
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
          backgroundColor: filled ? theme.chrome : theme.glass,
          borderColor: filled ? theme.reflection : theme.glassBorder,
          opacity: pressed ? 0.68 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }]
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
        <View style={[styles.signalShort, { backgroundColor: theme.sky }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: neverRadius.xl,
    overflow: 'hidden',
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 4
  },
  glassPadded: { padding: 18 },
  glassReflection: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: StyleSheet.hairlineWidth
  },
  sectionLabelRow: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  sectionLabel: {
    ...neverType.eyebrow,
    textTransform: 'uppercase'
  },
  sectionMeta: {
    ...neverType.caption,
    fontWeight: '600'
  },
  commandBar: {
    minHeight: 72,
    borderRadius: neverRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4
  },
  commandGlyph: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  commandCopy: { flex: 1, minWidth: 0 },
  commandLabel: {
    ...neverType.bodyStrong,
    fontSize: 15
  },
  commandHint: {
    ...neverType.caption,
    marginTop: 2
  },
  commandAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  commandReflection: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: StyleSheet.hairlineWidth
  },
  chromeButton: {
    minHeight: 50,
    borderRadius: neverRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 9 },
    elevation: 4
  },
  chromeButtonCompact: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 13
  },
  chromeButtonText: {
    ...neverType.bodyStrong,
    fontSize: 13.5
  },
  chromeReflection: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: StyleSheet.hairlineWidth
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    width: '100%'
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  wordmark: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '800',
    letterSpacing: 5.8
  },
  wordmarkCompact: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 4.6
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
