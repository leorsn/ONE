import { resolveMaterialAppearance } from '@/src/theme/editions';
import { NeverInput } from '@/src/ui/NeverInput';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverMaterial, NeverPressable, selectionFeedback } from '@/src/ui/material';
import { neverType, neverSpacing, neverRadius, neverControl } from '@/src/theme/tokens';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';

type IconName = (typeof icons)[keyof typeof icons];

export function useNeverV5Palette() {
  const { resolvedMode, reduceTransparency } = useThemePreference();
  const dark = resolvedMode === 'dark';
  const t = useTheme();
  const cardAppearance = resolveMaterialAppearance(t, 'card', { reduceTransparency });
  const inputAppearance = resolveMaterialAppearance(t, 'input', { reduceTransparency });
  const modalAppearance = resolveMaterialAppearance(t, 'modal', { reduceTransparency });
  return {
    dark, canvas: t.background, surface: cardAppearance.style.backgroundColor, elevated: modalAppearance.style.backgroundColor,
    fill: t.fillStrong, fillSoft: t.accentSoft, label: t.text, secondary: t.textSecondary,
    tertiary: t.textTertiary, separator: t.border, border: t.border, graphite: t.accent,
    chrome: t.chrome, chromeSoft: t.chromeSoft, warning: t.warning,
    success: t.success, danger: t.danger, glass: t.glassStrong,
    glassBorder: t.glassBorder, reflection: t.reflection, shadow: t.shadow,
    onAccent: t.onAccent, heading: t.typography.heading, wordmark: t.typography.wordmark,
    radius: t.radius, cardStyle: cardAppearance.style, inputStyle: inputAppearance.style,
    pageStyle: { paddingHorizontal: t.spacing.page, gap: t.spacing.section },
    rowHeight: t.spacing.row
  } as const;
}

export function V5Wordmark() {
  const p = useNeverV5Palette();
  return (
    <View style={styles.wordmarkRow}>
      <Text style={[styles.wordmark, p.wordmark, { color: p.label }]}>NEVER</Text>
      <View style={styles.signal}>
        <View style={[styles.signalLong, { backgroundColor: p.chrome }]} />
        <View style={[styles.signalShort, { backgroundColor: p.tertiary }]} />
      </View>
    </View>
  );
}

export function V5LargeHeader({
  eyebrow,
  title,
  subtitle,
  action
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const p = useNeverV5Palette();
  return (
    <View style={styles.largeHeader}>
      <View style={{ flex: 1, minWidth: 0 }}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: p.secondary }]}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" style={[styles.largeTitle, p.heading, { color: p.label }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: p.secondary }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function V5SectionHeader({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
  const p = useNeverV5Palette();
  return (
    <View style={styles.sectionHeader}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: p.label }]}>{title}</Text>
      <View style={styles.sectionRight}>
        {meta ? <Text style={[styles.sectionMeta, { color: p.tertiary }]}>{meta}</Text> : null}
        {action}
      </View>
    </View>
  );
}

export function V5Group({ children, style }: { children: ReactNode; style?: object }) {
  return <NeverMaterial style={style}>{children}</NeverMaterial>;
}

export function V5Glyph({ icon, filled = false, size = 36 }: { icon: IconName; filled?: boolean; size?: number }) {
  const p = useNeverV5Palette();
  return (
    <View style={[styles.glyph, {
      width: size,
      height: size,
      borderRadius: p.radius.icon,
      backgroundColor: filled ? p.graphite : p.fillSoft,
      borderColor: filled ? p.graphite : p.border
    }]}>
      <OneIcon name={icon} size={Math.round(size * 0.44)} color={filled ? p.onAccent : p.chrome} />
    </View>
  );
}

export function V5Chevron() {
  const p = useNeverV5Palette();
  return <OneIcon name={icons.chevron} size={11.5} color={p.tertiary} />;
}

export function V5Row({
  icon,
  title,
  subtitle,
  meta,
  onPress,
  last = false,
  accessory,
  destructive = false
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  last?: boolean;
  accessory?: ReactNode;
  destructive?: boolean;
}) {
  const p = useNeverV5Palette();
  const body = (
    <>
      {icon ? <V5Glyph icon={icon} size={36} /> : null}
      <View style={[styles.rowContent, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={[styles.rowTitle, { color: destructive ? p.danger : p.label }]} numberOfLines={2}>{title}</Text>
            {meta ? <Text style={[styles.rowMeta, { color: p.tertiary }]} numberOfLines={1}>{meta}</Text> : null}
          </View>
          {subtitle ? <Text style={[styles.rowSubtitle, { color: p.secondary }]} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        {accessory ?? (onPress ? <V5Chevron /> : null)}
      </View>
    </>
  );

  if (!onPress) return <View style={[styles.row, { minHeight: p.rowHeight }]}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, { minHeight: p.rowHeight, backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
      {body}
    </Pressable>
  );
}

export function V5SearchField({
  value,
  onChangeText,
  placeholder,
  onSubmit,
  ask = false
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onSubmit?: () => void;
  ask?: boolean;
}) {
  const p = useNeverV5Palette();
  const [focused, setFocused] = useState(false);
  return (
    <NeverMaterial role="input" focused={focused} style={styles.searchField}>
      <OneIcon name={ask ? icons.ask : icons.search} size={16} color={p.chrome} />
      <NeverInput
        accessibilityLabel={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        selectionColor={p.chrome}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={p.tertiary}
        style={[styles.searchInput, { color: p.label }]}
        autoCorrect={false}
        returnKeyType={ask ? 'send' : 'search'}
        onSubmitEditing={onSubmit}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear" onPress={() => onChangeText('')} style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.68 : 1 }]} hitSlop={8}>
          <View style={[styles.clearCircle, { borderRadius: Math.min(9, p.radius.icon), backgroundColor: p.graphite }]}>
            <OneIcon name={icons.close} size={9} color={p.onAccent} />
          </View>
        </Pressable>
      ) : null}
    </NeverMaterial>
  );
}

export function V5Segmented({
  options,
  selected,
  onSelect
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const p = useNeverV5Palette();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmented} keyboardShouldPersistTaps="handled">
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => { selectionFeedback(); onSelect(option); }}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: active ? p.graphite : pressed ? p.fill : p.fillSoft,
                borderColor: active ? p.graphite : pressed ? p.chrome : p.border,
                borderRadius: p.radius.chip,
                opacity: pressed ? 0.9 : 1
              }
            ]}
          >
            <Text style={[styles.segmentText, { color: active ? p.onAccent : p.secondary, fontWeight: active ? '600' : '500' }]}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function V5IconButton({ icon, onPress, accessibilityLabel, disabled = false }: { icon: IconName; onPress: () => void; accessibilityLabel: string; disabled?: boolean }) {
  const p = useNeverV5Palette();
  return (
    <NeverPressable
      disabled={disabled}
      accessibilityState={{ disabled }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, {
        borderRadius: p.radius.icon,
        backgroundColor: pressed ? p.fill : p.fillSoft,
        borderColor: pressed ? p.chrome : p.border,
        opacity: disabled ? 0.4 : 1
      }]}
    >
      <OneIcon name={icon} size={20} color={p.chrome} />
    </NeverPressable>
  );
}

const styles = StyleSheet.create({
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  wordmark: { fontSize: 13, lineHeight: 16, fontWeight: '800', letterSpacing: 4.5 },
  signal: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  signalLong: { width: 15, height: 2.5, borderRadius: 2 },
  signalShort: { width: 5.5, height: 2.5, borderRadius: 2 },
  largeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '600', marginBottom: 4 },
  largeTitle: { ...neverType.hero },
  subtitle: { marginTop: 5, maxWidth: 520, fontSize: 14, lineHeight: 19 },
  sectionHeader: { minHeight: 24, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { ...neverType.section, flexShrink: 1 },
  sectionRight: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionMeta: { fontSize: 12, lineHeight: 15, fontWeight: '500' },
  glyph: { alignItems: 'center', justifyContent: 'center', marginLeft: 13, borderWidth: StyleSheet.hairlineWidth },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  rowContent: { flex: 1, minHeight: 58, marginLeft: 11, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowText: { flex: 1, minWidth: 0, paddingVertical: 9 },
  rowTitleLine: { flexWrap: 'wrap', flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontSize: 15.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.12 },
  rowSubtitle: { marginTop: 2, fontSize: 13, lineHeight: 18 },
  rowMeta: { maxWidth: 110, fontSize: 11.5, lineHeight: 14, textAlign: 'right' },
  searchField: { minHeight: neverControl.input, paddingHorizontal: neverSpacing.lg, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, minHeight: 44, fontSize: 16, lineHeight: 20, paddingVertical: 0 },
  clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  clearCircle: { width: 17, height: 17, alignItems: 'center', justifyContent: 'center' },
  segmented: { minHeight: neverControl.minimum, flexDirection: 'row', alignItems: 'center', gap: neverSpacing.sm },
  segment: { minHeight: neverControl.minimum, paddingHorizontal: 17, borderRadius: neverRadius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 12, lineHeight: 14 },
  iconButton: { width: neverControl.minimum, height: neverControl.minimum, borderRadius: neverRadius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }
});