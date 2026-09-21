import { NeverInput } from '@/src/ui/NeverInput';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverMaterial, NeverPressable, selectionFeedback } from '@/src/ui/material';
import { neverType, neverSpacing, neverRadius, neverControl } from '@/src/theme/tokens';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';

type IconName = (typeof icons)[keyof typeof icons];

export function useNeverV5Palette() {
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  const t = useTheme();
  return {
    dark, canvas: t.background, surface: t.surface, elevated: t.surfaceElevated,
    fill: t.fillStrong, fillSoft: t.fill, label: t.text, secondary: t.textSecondary,
    tertiary: t.textTertiary, separator: t.border, border: t.border, graphite: t.accent,
    chrome: t.chrome, chromeSoft: t.chromeSoft, warning: t.warning,
    success: t.success, danger: t.danger, glass: t.glassStrong,
    glassBorder: t.glassBorder, reflection: t.reflection, shadow: t.shadow,
    onAccent: t.onAccent
  } as const;
}

export function V5Wordmark() {
  const p = useNeverV5Palette();
  return (
    <View style={styles.wordmarkRow}>
      <Text style={[styles.wordmark, { color: p.label }]}>NEVER</Text>
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
        <Text accessibilityRole="header" style={[styles.largeTitle, { color: p.label }]}>{title}</Text>
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
  return <NeverMaterial style={[styles.group, style]}>{children}</NeverMaterial>;
}

export function V5Glyph({ icon, filled = false, size = 36 }: { icon: IconName; filled?: boolean; size?: number }) {
  const p = useNeverV5Palette();
  return (
    <View style={[styles.glyph, { width: size, height: size, borderRadius: Math.round(size * 0.28), backgroundColor: filled ? p.graphite : p.fillSoft }]}>
      <OneIcon name={icon} size={Math.round(size * 0.44)} color={filled ? (p.onAccent) : p.chrome} />
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

  if (!onPress) return <View style={styles.row}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
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
    <NeverMaterial glass style={[styles.searchField, { borderColor: focused ? p.chrome : p.glassBorder }]}>
      <OneIcon name={ask ? icons.ask : icons.search} size={16} color={p.secondary} />
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
        <Pressable accessibilityRole="button" accessibilityLabel="Clear" onPress={() => onChangeText('')} style={styles.clearButton} hitSlop={8}>
          <View style={[styles.clearCircle, { backgroundColor: p.tertiary }]}>
            <OneIcon name={icons.close} size={9} color={p.canvas} />
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
              { backgroundColor: active ? p.graphite : p.fillSoft },
              { opacity: pressed ? 0.65 : 1 }
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
    <NeverPressable disabled={disabled} accessibilityState={{ disabled }} accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: p.fillSoft, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}>
      <OneIcon name={icon} size={20} color={p.label} />
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
  group: { borderRadius: neverRadius.lg },
  glyph: { alignItems: 'center', justifyContent: 'center', marginLeft: 13 },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  rowContent: { flex: 1, minHeight: 58, marginLeft: 11, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowText: { flex: 1, minWidth: 0, paddingVertical: 9 },
  rowTitleLine: { flexWrap: 'wrap', flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontSize: 15.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.12 },
  rowSubtitle: { marginTop: 2, fontSize: 13, lineHeight: 18 },
  rowMeta: { maxWidth: 110, fontSize: 11.5, lineHeight: 14, textAlign: 'right' },
  searchField: { minHeight: neverControl.input, borderRadius: neverRadius.lg, paddingHorizontal: neverSpacing.lg, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, minHeight: 44, fontSize: 16, lineHeight: 20, paddingVertical: 0 },
  clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  clearCircle: { width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmented: { minHeight: neverControl.minimum, flexDirection: 'row', alignItems: 'center', gap: neverSpacing.sm },
  segment: { minHeight: neverControl.minimum, paddingHorizontal: 17, borderRadius: neverRadius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 12, lineHeight: 14 },
  iconButton: { width: neverControl.minimum, height: neverControl.minimum, borderRadius: neverRadius.pill, alignItems: 'center', justifyContent: 'center' }
});
