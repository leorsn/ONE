import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OneIcon, icons } from '@/src/ui/icons';
import { useThemePreference } from '@/src/theme/useTheme';

type IconName = (typeof icons)[keyof typeof icons];

export function useNeverV5Palette() {
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  return {
    dark,
    canvas: dark ? '#000000' : '#F2F2F7',
    surface: dark ? '#1C1C1E' : '#FFFFFF',
    elevated: dark ? '#2C2C2E' : '#FFFFFF',
    fill: dark ? '#2C2C2E' : '#E9E9EE',
    fillSoft: dark ? '#242426' : '#F5F5F7',
    label: dark ? '#FFFFFF' : '#000000',
    secondary: dark ? '#EBEBF599' : '#3C3C4399',
    tertiary: dark ? '#EBEBF54D' : '#3C3C434D',
    separator: dark ? '#54545899' : '#3C3C4329',
    graphite: dark ? '#F2F2F7' : '#1C1C1E',
    chrome: dark ? '#D1D1D6' : '#6E7681',
    chromeSoft: dark ? '#3A3A3C' : '#E5E5EA',
    warning: '#C5892F',
    success: '#34C759',
    danger: '#FF453A'
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
        <Text style={[styles.largeTitle, { color: p.label }]}>{title}</Text>
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
      <Text style={[styles.sectionTitle, { color: p.label }]}>{title}</Text>
      <View style={styles.sectionRight}>
        {meta ? <Text style={[styles.sectionMeta, { color: p.tertiary }]}>{meta}</Text> : null}
        {action}
      </View>
    </View>
  );
}

export function V5Group({ children, style }: { children: ReactNode; style?: object }) {
  const p = useNeverV5Palette();
  return <View style={[styles.group, { backgroundColor: p.surface }, style]}>{children}</View>;
}

export function V5Glyph({ icon, filled = false, size = 36 }: { icon: IconName; filled?: boolean; size?: number }) {
  const p = useNeverV5Palette();
  return (
    <View style={[styles.glyph, { width: size, height: size, borderRadius: Math.round(size * 0.3), backgroundColor: filled ? p.graphite : p.fillSoft }]}>
      <OneIcon name={icon} size={Math.round(size * 0.45)} color={filled ? (p.dark ? '#111113' : '#FFFFFF') : p.chrome} />
    </View>
  );
}

export function V5Chevron() {
  const p = useNeverV5Palette();
  return <OneIcon name={icons.chevron} size={12} color={p.tertiary} />;
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
      {icon ? <V5Glyph icon={icon} size={38} /> : null}
      <View style={[styles.rowContent, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={[styles.rowTitle, { color: destructive ? p.danger : p.label }]} numberOfLines={1}>{title}</Text>
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
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
  return (
    <View style={[styles.searchField, { backgroundColor: p.surface }]}>
      <OneIcon name={ask ? icons.ask : icons.search} size={17} color={p.secondary} />
      <TextInput
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
        <Pressable onPress={() => onChangeText('')} style={styles.clearButton} hitSlop={8}>
          <View style={[styles.clearCircle, { backgroundColor: p.tertiary }]}>
            <OneIcon name={icons.close} size={9} color={p.canvas} />
          </View>
        </Pressable>
      ) : null}
    </View>
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
    <View style={[styles.segmented, { backgroundColor: p.fill }]}> 
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={({ pressed }) => [
              styles.segment,
              active && [styles.segmentActive, { backgroundColor: p.surface }],
              { opacity: pressed ? 0.65 : 1 }
            ]}
          >
            <Text style={[styles.segmentText, { color: active ? p.label : p.secondary, fontWeight: active ? '600' : '500' }]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function V5IconButton({ icon, onPress, accessibilityLabel }: { icon: IconName; onPress: () => void; accessibilityLabel: string }) {
  const p = useNeverV5Palette();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [styles.iconButton, { backgroundColor: p.surface, opacity: pressed ? 0.6 : 1 }]}>
      <OneIcon name={icon} size={16} color={p.label} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark: { fontSize: 15, lineHeight: 18, fontWeight: '800', letterSpacing: 5.1 },
  signal: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  signalLong: { width: 18, height: 3, borderRadius: 2 },
  signalShort: { width: 7, height: 3, borderRadius: 2 },
  largeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  eyebrow: { fontSize: 11, lineHeight: 15, fontWeight: '600', marginBottom: 5 },
  largeTitle: { fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1.05 },
  subtitle: { marginTop: 6, maxWidth: 520, fontSize: 15, lineHeight: 21 },
  sectionHeader: { minHeight: 28, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontSize: 20, lineHeight: 24, fontWeight: '700', letterSpacing: -0.35 },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionMeta: { fontSize: 13, lineHeight: 16, fontWeight: '500' },
  group: { borderRadius: 20, overflow: 'hidden' },
  glyph: { alignItems: 'center', justifyContent: 'center', marginLeft: 14 },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center' },
  rowContent: { flex: 1, minHeight: 62, marginLeft: 12, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { flex: 1, minWidth: 0, paddingVertical: 10 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { flex: 1, fontSize: 16, lineHeight: 20, fontWeight: '600', letterSpacing: -0.15 },
  rowSubtitle: { marginTop: 2, fontSize: 13, lineHeight: 17 },
  rowMeta: { maxWidth: 112, fontSize: 12, lineHeight: 15, textAlign: 'right' },
  searchField: { minHeight: 50, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, minHeight: 48, fontSize: 17, lineHeight: 21, paddingVertical: 0 },
  clearButton: { width: 28, height: 40, alignItems: 'center', justifyContent: 'center' },
  clearCircle: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmented: { height: 34, borderRadius: 9, padding: 2, flexDirection: 'row', gap: 2 },
  segment: { flex: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segmentText: { fontSize: 12.5, lineHeight: 15 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }
});