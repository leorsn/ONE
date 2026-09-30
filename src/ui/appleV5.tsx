import { resolveMaterialAppearance } from '@/src/theme/editions';
import { NeverInput } from '@/src/ui/NeverInput';
import { useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverMaterial, NeverPressable, selectionFeedback } from '@/src/ui/material';
import { neverType, neverSpacing, neverRadius, neverControl, pass3, archiveControls } from '@/src/theme/tokens';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';

type IconName = (typeof icons)[keyof typeof icons];

export function useNeverV5Palette() {
  const { resolvedMode, reduceTransparency } = useThemePreference();
  const dark = resolvedMode === 'dark';
  const t = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const lightEnvironmentInk = ['monolith', 'tactile', 'archive', 'orbit'].includes(t.id);
  const environmentText = {
    color: lightEnvironmentInk ? '#FCFDFD' : '#171D22',
    textShadowColor: lightEnvironmentInk ? '#071018B3' : '#FFFFFFB3',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8
  };
  const compact = width < 375 || fontScale > 1.3;
  const cardStyle = resolveMaterialAppearance(t, 'card', { reduceTransparency }).style;
  const inputStyle = resolveMaterialAppearance(t, 'input', { reduceTransparency }).style;
  return {
    archiveControls: t.id === 'archive' ? archiveControls : undefined,
    reduceTransparency,
    dark, canvas: t.background, surface: cardStyle.backgroundColor, elevated: t.surfaceElevated,
    fill: t.fillStrong, fillSoft: t.fill, label: t.text, secondary: t.textSecondary,
    tertiary: t.textTertiary, separator: t.border, border: t.border, graphite: t.accent,
    chrome: t.chrome, chromeSoft: t.chromeSoft, warning: t.warning,
    success: t.success, danger: t.danger, glass: t.glassStrong,
    glassBorder: t.glassBorder, reflection: t.reflection, shadow: t.shadow,
    onAccent: t.onAccent, heading: t.typography.heading, wordmark: t.typography.wordmark,
    radius: t.radius, cardStyle, inputStyle, environmentText,
    textSurface: { backgroundColor: reduceTransparency ? t.surface : t.materials.card.color, borderRadius: 10 },
    pageStyle: { paddingHorizontal: width < 375 ? 18 : width >= 430 ? 24 : t.spacing.page, gap: t.spacing.section },
    rowHeight: t.spacing.row,
    pass3Heading: compact ? { ...pass3.editorial, fontSize: 34, lineHeight: 39 } : pass3.editorial,
    compact, heroType: compact ? neverType.hero : { ...neverType.hero, fontSize: 40, lineHeight: 45 }
  } as const;
}

export function V5Wordmark() {
  const p = useNeverV5Palette();
  return (
    <View style={styles.wordmarkRow}>
      <Text style={[styles.wordmark, p.wordmark, p.environmentText]}>NEVER</Text>
      <View style={styles.signal}>
        <View style={[styles.signalLong, { backgroundColor: p.environmentText.color }]} />
        <View style={[styles.signalShort, { backgroundColor: p.environmentText.color }]} />
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
        {eyebrow ? <Text style={[styles.eyebrow, p.environmentText]}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" style={[styles.largeTitle, p.heroType, p.heading, p.environmentText]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, p.environmentText]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function V5SectionHeader({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
  const p = useNeverV5Palette();
  return (
    <View style={styles.sectionHeader}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, p.environmentText]}>{title}</Text>
      <View style={styles.sectionRight}>
        {meta ? <Text style={[styles.sectionMeta, p.environmentText]}>{meta}</Text> : null}
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
    <View style={[styles.glyph, { width: size, height: size, borderRadius: p.radius.icon, backgroundColor: filled ? p.graphite : p.fillSoft }]}>
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
  const inputRef = useRef<TextInput>(null);
  return (
    <NeverMaterial role="input" focused={focused} style={styles.searchField}>
      <OneIcon name={ask ? icons.ask : icons.search} size={16} color={p.secondary} />
      <NeverInput
        ref={inputRef}
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
        <Pressable accessibilityRole="button" accessibilityLabel="Clear" onPress={() => { onChangeText(''); inputRef.current?.focus(); }} style={styles.clearButton} hitSlop={8}>
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
  onSelect,
  contained = false
}: {
  options: string[];
  selected: string;
  contained?: boolean;
  onSelect: (value: string) => void;
}) {
  const p = useNeverV5Palette();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.segmented} keyboardShouldPersistTaps="handled">
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
              { backgroundColor: active ? p.inputStyle.backgroundColor : 'transparent' },
              { opacity: pressed ? 0.65 : 1 }
            ]}
          >
            <Text style={[styles.segmentText, !active && !contained && p.environmentText, { color: active ? p.label : contained ? p.secondary : p.environmentText.color, fontWeight: active ? '600' : '500' }]}>{option}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function V5IconButton({ icon, onPress, accessibilityLabel, disabled = false, quiet = false }: { icon: IconName; onPress: () => void; accessibilityLabel: string; disabled?: boolean; quiet?: boolean }) {
  const p = useNeverV5Palette();
  return (
    <NeverPressable disabled={disabled} accessibilityState={{ disabled }} accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [styles.iconButton, { borderRadius: p.radius.icon, backgroundColor: quiet ? 'transparent' : p.fillSoft, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}>
      <OneIcon name={icon} size={quiet ? 17 : 20} color={quiet ? p.environmentText.color : p.label} />
    </NeverPressable>
  );
}

const styles = StyleSheet.create({
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  wordmark: { fontSize: 13, lineHeight: 16, fontWeight: '800', letterSpacing: 4.5 },
  signal: { alignItems: 'flex-start', gap: 2 },
  signalLong: { width: 11, height: 1.5, borderRadius: 2 },
  signalShort: { width: 7, height: 1.5, borderRadius: 2 },
  largeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '600', marginBottom: 4 },
  largeTitle: { ...neverType.hero },
  subtitle: { marginTop: 5, maxWidth: 520, fontSize: 14, lineHeight: 19 },
  sectionHeader: { flexWrap: 'wrap', minHeight: 24, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { ...neverType.section, flexShrink: 1 },
  sectionRight: { flexWrap: 'wrap', flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionMeta: { fontSize: 12, lineHeight: 15, fontWeight: '500' },
  group: { borderRadius: neverRadius.lg },
  glyph: { alignItems: 'center', justifyContent: 'center', marginLeft: 13 },
  row: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  rowContent: { flex: 1, minHeight: 58, marginLeft: 11, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowText: { flex: 1, minWidth: 0, paddingVertical: 9 },
  rowTitleLine: { flexWrap: 'wrap', flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontSize: 15.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.12 },
  rowSubtitle: { marginTop: 2, fontSize: 13, lineHeight: 18 },
  rowMeta: { maxWidth: 110, fontSize: 12, lineHeight: 16, textAlign: 'right' },
  searchField: { minHeight: 52, borderRadius: 15, paddingHorizontal: neverSpacing.lg, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, minHeight: 44, fontSize: 16, lineHeight: 20, paddingVertical: 0 },
  clearButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  clearCircle: { width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  filterScroll: { flexGrow: 0, alignSelf: 'flex-start', borderRadius: 12 },
  segmented: { paddingHorizontal: 0, minHeight: neverControl.minimum, flexDirection: 'row', alignItems: 'center', gap: neverSpacing.sm },
  segment: { paddingVertical: 6, minHeight: neverControl.minimum, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  segmentText: { ...neverType.caption },
  iconButton: { width: neverControl.minimum, height: neverControl.minimum, borderRadius: neverRadius.pill, alignItems: 'center', justifyContent: 'center' }
});
