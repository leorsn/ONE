import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { CoreBackdrop, EmptyState, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

type CalendarMode = 'day' | 'week' | 'month';

export default function CalendarScreen() {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  const { items } = useItems();
  const today = toIsoDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState<CalendarMode>('day');

  const datedItems = useMemo(
    () => items.filter((item) => item.date && !item.completed).sort((a, b) => `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`)),
    [items]
  );
  const selected = new Date(`${selectedDate}T12:00:00`);
  const strip = getDays(selected, 7);
  const selectedItems = useMemo(() => datedItems.filter((item) => item.date === selectedDate), [datedItems, selectedDate]);
  const nextDate = useMemo(() => addDaysIso(selectedDate, 1), [selectedDate]);
  const nextItems = useMemo(() => datedItems.filter((item) => item.date === nextDate), [datedItems, nextDate]);
  const visibleItems = useMemo(() => filterForMode(datedItems, selectedDate, mode), [datedItems, selectedDate, mode]);
  const grouped = useMemo(() => groupByDate(visibleItems), [visibleItems]);

  async function moveMonth(delta: number) {
    await Haptics.selectionAsync();
    const value = new Date(`${selectedDate}T12:00:00`);
    value.setMonth(value.getMonth() + delta);
    setSelectedDate(toIsoDate(value));
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <CoreBackdrop />
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>SCHEDULE</Text>
            <Text style={[styles.title, { color: theme.text }]}>Calendar</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>See your plans in context.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Jump to today"
            onPress={async () => { await Haptics.selectionAsync(); setSelectedDate(today); setMode('day'); }}
            style={({ pressed }) => [styles.todayButton, { backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE', borderColor: dark ? '#FFFFFF16' : '#FFFFFF', opacity: pressed ? 0.65 : 1 }]}
          >
            <Text style={[styles.todayText, { color: theme.accent }]}>Today</Text>
          </Pressable>
        </View>

        <View style={[styles.calendarPanel, {
          backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE',
          borderColor: dark ? '#FFFFFF16' : '#FFFFFF',
          shadowColor: dark ? '#000000' : '#7A8394'
        }]}>
          <View style={styles.monthRow}>
            <Pressable onPress={() => moveMonth(-1)} style={({ pressed }) => [styles.monthArrow, { backgroundColor: theme.fill, opacity: pressed ? 0.6 : 1 }]} accessibilityRole="button" accessibilityLabel="Previous month">
              <OneIcon name={icons.chevronLeft} size={13} color={theme.textSecondary} />
            </Pressable>
            <View style={styles.monthCopy}>
              <Text style={[styles.month, { color: theme.text }]}>{new Intl.DateTimeFormat('en', { month: 'long' }).format(selected)}</Text>
              <Text style={[styles.year, { color: theme.textTertiary }]}>{selected.getFullYear()}</Text>
            </View>
            <Pressable onPress={() => moveMonth(1)} style={({ pressed }) => [styles.monthArrow, { backgroundColor: theme.fill, opacity: pressed ? 0.6 : 1 }]} accessibilityRole="button" accessibilityLabel="Next month">
              <OneIcon name={icons.chevron} size={13} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.dayStrip}>
            {strip.map((day) => {
              const active = day.iso === selectedDate;
              const hasItems = datedItems.some((item) => item.date === day.iso);
              return (
                <Pressable key={day.iso} onPress={async () => { await Haptics.selectionAsync(); setSelectedDate(day.iso); }} style={({ pressed }) => [styles.day, { opacity: pressed ? 0.55 : 1 }]}>
                  <Text style={[styles.weekday, { color: active ? theme.text : theme.textTertiary }]}>{day.weekday}</Text>
                  <View style={[styles.dayNumberWrap, active && { backgroundColor: theme.accent, shadowColor: theme.accent }]}>
                    <Text style={[styles.dayNumber, { color: active ? '#FFFFFF' : theme.text }]}>{day.number}</Text>
                  </View>
                  <View style={[styles.dot, { backgroundColor: hasItems ? theme.danger : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.modeSwitch, { backgroundColor: dark ? '#2C2C2EB0' : '#ECEEF3' }]}>
            {(['day', 'week', 'month'] as CalendarMode[]).map((entry) => {
              const active = mode === entry;
              return (
                <Pressable
                  key={entry}
                  onPress={async () => { await Haptics.selectionAsync(); setMode(entry); }}
                  style={[styles.modeButton, active && { backgroundColor: dark ? '#49494DDC' : '#FFFFFF', shadowColor: theme.shadow, shadowOpacity: dark ? 0.2 : 0.12 }]}
                >
                  <Text style={[styles.modeText, { color: active ? theme.text : theme.textSecondary }]}>{entry.charAt(0).toUpperCase() + entry.slice(1)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {mode === 'day' ? (
          <View style={styles.agendaStack}>
            <AgendaSection title={selectedDate === today ? 'Today' : new Intl.DateTimeFormat('en', { weekday: 'long' }).format(selected)} items={selectedItems} emptyTitle="No plans here" emptyBody="Capture something with a date and it will appear here." />
            <AgendaSection title={selectedDate === today ? 'Tomorrow' : prettyNextLabel(nextDate)} items={nextItems} emptyTitle="Nothing ahead" emptyBody="The next day is clear." />
          </View>
        ) : (
          <View style={styles.timelineBlock}>
            <SectionHeader title={mode === 'week' ? 'This week' : new Intl.DateTimeFormat('en', { month: 'long' }).format(selected)} meta={`${visibleItems.length} ${visibleItems.length === 1 ? 'item' : 'items'}`} />
            {visibleItems.length ? (
              <View style={styles.timelineStack}>
                {grouped.map((group) => (
                  <View key={group.date} style={styles.groupBlock}>
                    <Text style={[styles.dateDividerText, { color: theme.textTertiary }]}>{prettyGroupDate(group.date)}</Text>
                    {group.items.map((item) => <TimelineCard key={item.id} item={item} />)}
                  </View>
                ))}
              </View>
            ) : <Surface><EmptyState icon={icons.calendar} title="Nothing scheduled" body="Your schedule is clear for this view." /></Surface>}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function AgendaSection({ title: sectionTitle, items: sectionItems, emptyTitle, emptyBody }: { title: string; items: OneItem[]; emptyTitle: string; emptyBody: string }) {
    return (
      <View style={styles.timelineBlock}>
        <SectionHeader title={sectionTitle} meta={`${sectionItems.length} ${sectionItems.length === 1 ? 'item' : 'items'}`} />
        {sectionItems.length ? <View style={styles.timelineStack}>{sectionItems.map((item) => <TimelineCard key={item.id} item={item} />)}</View> : (
          <View style={[styles.emptyCard, { backgroundColor: dark ? '#1C1C1ED8' : '#FFFFFFE4', borderColor: dark ? '#FFFFFF12' : '#FFFFFF' }]}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.fill }]}><OneIcon name={icons.clock} size={17} color={theme.textTertiary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>{emptyTitle}</Text>
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]} numberOfLines={2}>{emptyBody}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  function TimelineCard({ item }: { item: OneItem }) {
    const tint = timelineColor(item, theme);
    return (
      <Pressable onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.timelineCard, { backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE', borderColor: dark ? '#FFFFFF14' : '#FFFFFF', opacity: pressed ? 0.7 : 1 }]}>
        <View style={[styles.timeBadge, { backgroundColor: `${tint}${dark ? '24' : '12'}` }]}>
          <Text style={[styles.time, { color: tint }]}>{item.time || '—'}</Text>
        </View>
        <View style={styles.timelineCopy}>
          <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.itemMeta, { color: theme.textSecondary }]} numberOfLines={1}>{[item.location, item.summary, item.category].filter(Boolean).join(' · ') || item.type}</Text>
        </View>
        <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
      </Pressable>
    );
  }
}

function filterForMode(items: OneItem[], selectedDate: string, mode: CalendarMode) {
  if (mode === 'day') return items.filter((item) => item.date === selectedDate);
  const selected = new Date(`${selectedDate}T12:00:00`);
  if (mode === 'week') {
    const day = selected.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const start = new Date(selected);
    start.setDate(selected.getDate() + mondayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startIso = toIsoDate(start);
    const endIso = toIsoDate(end);
    return items.filter((item) => item.date && item.date >= startIso && item.date <= endIso);
  }
  const prefix = selectedDate.slice(0, 7);
  return items.filter((item) => item.date?.startsWith(prefix));
}

function groupByDate(items: OneItem[]) {
  const map = new Map<string, OneItem[]>();
  for (const item of items) {
    if (!item.date) continue;
    const group = map.get(item.date) || [];
    group.push(item);
    map.set(item.date, group);
  }
  return Array.from(map.entries()).map(([date, groupedItems]) => ({ date, items: groupedItems }));
}

function timelineColor(item: OneItem, theme: ReturnType<typeof useTheme>) {
  if (item.type === 'reminder' || item.type === 'task') return theme.danger;
  if (item.type === 'appointment' || item.type === 'event') return theme.sky;
  return theme.chrome;
}

function prettyGroupDate(iso: string) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${iso}T12:00:00`)).toUpperCase();
}

function prettyNextLabel(iso: string) {
  return new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date(`${iso}T12:00:00`));
}

function addDaysIso(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function getDays(center: Date, count: number) {
  const start = new Date(center);
  start.setDate(center.getDate() - 3);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { iso: toIsoDate(date), weekday: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).slice(0, 2).toUpperCase(), number: date.getDate() };
  });
}

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingTop: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  eyebrow: { fontSize: 8.2, lineHeight: 11, fontWeight: '800', letterSpacing: 1.55 },
  title: { marginTop: 6, fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -1.3 },
  subtitle: { marginTop: 6, fontSize: 13.25, lineHeight: 18.5 },
  todayButton: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  todayText: { fontSize: 11.5, fontWeight: '700' },
  calendarPanel: { borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 16, shadowOpacity: 0.14, shadowRadius: 28, shadowOffset: { width: 0, height: 13 }, elevation: 4 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthArrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  monthCopy: { alignItems: 'center' },
  month: { fontSize: 18, lineHeight: 21, fontWeight: '800', letterSpacing: -0.35 },
  year: { marginTop: 1, fontSize: 9.5, fontWeight: '600' },
  dayStrip: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 40, alignItems: 'center' },
  weekday: { fontSize: 8.3, lineHeight: 11, fontWeight: '700', letterSpacing: 0.6 },
  dayNumberWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 6, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  dayNumber: { fontSize: 15.2, lineHeight: 18, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 5 },
  modeSwitch: { marginTop: 18, minHeight: 44, borderRadius: 16, padding: 4, flexDirection: 'row', gap: 2 },
  modeButton: { flex: 1, minHeight: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  modeText: { fontSize: 10.75, fontWeight: '600' },
  agendaStack: { gap: 18 },
  timelineBlock: { gap: 10 },
  timelineStack: { gap: 9 },
  groupBlock: { gap: 8 },
  dateDividerText: { fontSize: 8.2, fontWeight: '800', letterSpacing: 1 },
  timelineCard: { minHeight: 72, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  timeBadge: { minWidth: 52, minHeight: 34, paddingHorizontal: 9, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 10, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timelineCopy: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14.3, lineHeight: 18, fontWeight: '700', letterSpacing: -0.14 },
  itemMeta: { marginTop: 3, fontSize: 10.8, lineHeight: 14.3 },
  emptyCard: { minHeight: 88, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyIcon: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 13.3, fontWeight: '700' },
  emptyBody: { marginTop: 3, fontSize: 10.7, lineHeight: 14.5 }
});
