import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { BrandHeader, EmptyState, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';
import type { OneItem } from '@/src/types/item';

type CalendarMode = 'day' | 'week' | 'month';

export default function CalendarScreen() {
  const theme = useTheme();
  const { items } = useItems();
  const today = toIsoDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState<CalendarMode>('day');

  const datedItems = useMemo(
    () => items
      .filter((item) => item.date && !item.completed)
      .sort((a, b) => `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`)),
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
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false}>
        <BrandHeader
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Jump to today"
              onPress={async () => {
                await Haptics.selectionAsync();
                setSelectedDate(today);
                setMode('day');
              }}
              style={({ pressed }) => [
                styles.todayButton,
                {
                  backgroundColor: `${theme.surfaceElevated}C8`,
                  borderColor: `${theme.text}16`,
                  shadowColor: theme.shadow,
                  opacity: pressed ? 0.68 : 1
                }
              ]}
            >
              <Text style={[styles.todayText, { color: theme.text }]}>Today</Text>
            </Pressable>
          }
        />

        <View style={styles.intro}>
          <Text style={[styles.title, { color: theme.text }]}>Calendar</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>See your day in context.</Text>
        </View>

        <Surface padded>
          <View style={styles.monthRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous month"
              onPress={() => moveMonth(-1)}
              style={({ pressed }) => [styles.monthArrow, { backgroundColor: `${theme.fill}7D`, borderColor: `${theme.text}10`, opacity: pressed ? 0.6 : 1 }]}
            >
              <OneIcon name={icons.chevronLeft} size={13} color={theme.textTertiary} />
            </Pressable>
            <Text style={[styles.month, { color: theme.text }]}>
              {new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(selected)}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next month"
              onPress={() => moveMonth(1)}
              style={({ pressed }) => [styles.monthArrow, { backgroundColor: `${theme.fill}7D`, borderColor: `${theme.text}10`, opacity: pressed ? 0.6 : 1 }]}
            >
              <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
            </Pressable>
          </View>

          <View style={styles.dayStrip}>
            {strip.map((day) => {
              const active = day.iso === selectedDate;
              const hasItems = datedItems.some((item) => item.date === day.iso);
              return (
                <Pressable
                  key={day.iso}
                  accessibilityRole="button"
                  accessibilityLabel={`${day.weekday} ${day.number}${hasItems ? ', has items' : ''}`}
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    setSelectedDate(day.iso);
                  }}
                  style={({ pressed }) => [styles.day, { opacity: pressed ? 0.58 : 1 }]}
                >
                  <Text style={[styles.weekday, { color: active ? theme.text : theme.textTertiary }]}>{day.weekday}</Text>
                  <View
                    style={[
                      styles.dayNumberWrap,
                      {
                        backgroundColor: active ? `${theme.chrome}E2` : 'transparent',
                        borderColor: active ? `${theme.text}22` : 'transparent',
                        shadowColor: theme.shadow
                      }
                    ]}
                  >
                    <Text style={[styles.dayNumber, { color: active ? theme.onAccent : theme.text }]}>{day.number}</Text>
                  </View>
                  <View style={[styles.dot, { backgroundColor: hasItems ? theme.danger : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.modeSwitch, { backgroundColor: `${theme.fill}8A`, borderColor: `${theme.text}12` }]}>
            {(['day', 'week', 'month'] as CalendarMode[]).map((entry) => {
              const active = mode === entry;
              return (
                <Pressable
                  key={entry}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    setMode(entry);
                  }}
                  style={[
                    styles.modeButton,
                    active && {
                      backgroundColor: `${theme.surfaceElevated}E8`,
                      borderColor: `${theme.text}16`,
                      shadowColor: theme.shadow
                    }
                  ]}
                >
                  <Text style={[styles.modeText, { color: active ? theme.text : theme.textSecondary }]}>
                    {entry.charAt(0).toUpperCase() + entry.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Surface>

        {mode === 'day' ? (
          <>
            <AgendaSection
              title={selectedDate === today ? 'Today' : new Intl.DateTimeFormat('en', { weekday: 'long' }).format(selected)}
              items={selectedItems}
              emptyTitle="No plans here"
              emptyBody="Capture something with a date and it will appear here."
            />
            <AgendaSection
              title={selectedDate === today ? 'Tomorrow' : prettyNextLabel(nextDate)}
              items={nextItems}
              emptyTitle="Nothing ahead"
              emptyBody="The next day is clear."
            />
          </>
        ) : (
          <View style={styles.timelineBlock}>
            <SectionHeader
              signal
              title={mode === 'week' ? 'This week' : new Intl.DateTimeFormat('en', { month: 'long' }).format(selected)}
              meta={`${visibleItems.length} ${visibleItems.length === 1 ? 'item' : 'items'}`}
            />
            {visibleItems.length ? (
              <Surface>
                {grouped.map((group, groupIndex) => (
                  <View key={group.date}>
                    <View style={[styles.dateDivider, groupIndex > 0 && { borderTopColor: `${theme.text}10`, borderTopWidth: StyleSheet.hairlineWidth }]}>
                      <Text style={[styles.dateDividerText, { color: theme.textTertiary }]}>{prettyGroupDate(group.date)}</Text>
                    </View>
                    {group.items.map((item) => <TimelineRow key={item.id} item={item} />)}
                  </View>
                ))}
              </Surface>
            ) : (
              <Surface>
                <EmptyState icon={icons.calendar} title="Nothing scheduled" body="Your schedule is clear for this view." />
              </Surface>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function AgendaSection({
    title: sectionTitle,
    items: sectionItems,
    emptyTitle,
    emptyBody
  }: {
    title: string;
    items: OneItem[];
    emptyTitle: string;
    emptyBody: string;
  }) {
    return (
      <View style={styles.timelineBlock}>
        <SectionHeader signal title={sectionTitle} meta={`${sectionItems.length} ${sectionItems.length === 1 ? 'item' : 'items'}`} />
        <Surface>
          {sectionItems.length
            ? sectionItems.map((item) => <TimelineRow key={item.id} item={item} />)
            : <EmptyState icon={icons.clock} title={emptyTitle} body={emptyBody} />}
        </Surface>
      </View>
    );
  }

  function TimelineRow({ item }: { item: OneItem }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.timelineRow, { borderBottomColor: `${theme.text}10`, opacity: pressed ? 0.58 : 1 }]}
      >
        <View style={styles.timeColumn}>
          <Text style={[styles.time, { color: theme.textTertiary }]}>{item.time || '—'}</Text>
          <View style={[styles.timelineDot, { backgroundColor: timelineColor(item, theme), shadowColor: timelineColor(item, theme) }]} />
        </View>
        <View style={[styles.timelineSpine, { backgroundColor: `${theme.text}12` }]} />
        <View style={styles.timelineCopy}>
          <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.itemMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {[item.location, item.summary, item.category].filter(Boolean).join(' · ') || item.type}
          </Text>
        </View>
        <View style={[styles.rowArrow, { backgroundColor: `${theme.fill}72`, borderColor: `${theme.text}0E` }]}>
          <OneIcon name={icons.chevron} size={10.5} color={theme.textTertiary} />
        </View>
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
    return {
      iso: toIsoDate(date),
      weekday: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).slice(0, 2).toUpperCase(),
      number: date.getDate()
    };
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
  todayButton: { minHeight: 38, paddingHorizontal: 15, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  todayText: { fontSize: 11.5, fontWeight: '600' },
  intro: { marginTop: -2 },
  title: { fontFamily: editorialFontFamily, fontSize: 34, lineHeight: 38, fontWeight: '400', letterSpacing: -0.9 },
  subtitle: { marginTop: 6, fontSize: 12.75, lineHeight: 18.5 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthArrow: { width: 30, height: 30, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  month: { fontSize: 17, lineHeight: 21, fontWeight: '600', letterSpacing: -0.26 },
  dayStrip: { marginTop: 17, flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 39, alignItems: 'center' },
  weekday: { fontSize: 8.5, lineHeight: 11, fontWeight: '700', letterSpacing: 0.7 },
  dayNumberWrap: { width: 34, height: 34, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginTop: 6, shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  dayNumber: { fontSize: 15, lineHeight: 18, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 5 },
  modeSwitch: { marginTop: 17, minHeight: 40, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 4, flexDirection: 'row' },
  modeButton: { flex: 1, minHeight: 31, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  modeText: { fontSize: 10.5, fontWeight: '600' },
  timelineBlock: { gap: 10 },
  dateDivider: { minHeight: 30, paddingHorizontal: 15, justifyContent: 'center' },
  dateDividerText: { fontSize: 8.25, fontWeight: '700', letterSpacing: 0.95 },
  timelineRow: { minHeight: 72, paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 9 },
  timeColumn: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  time: { fontSize: 9.5, fontWeight: '600', fontVariant: ['tabular-nums'] },
  timelineDot: { width: 5, height: 5, borderRadius: 3, marginTop: 5, shadowOpacity: 0.35, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  timelineSpine: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  timelineCopy: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14.25, lineHeight: 18, fontWeight: '600', letterSpacing: -0.12 },
  itemMeta: { marginTop: 3, fontSize: 11, lineHeight: 14.5 },
  rowArrow: { width: 23, height: 23, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }
});