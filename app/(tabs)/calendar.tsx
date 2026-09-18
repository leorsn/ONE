import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { BrandHeader, EmptyState, NeverSignal, Surface, uiStyles } from '@/src/ui/primitives';
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
  const visibleItems = useMemo(() => filterForMode(datedItems, selectedDate, mode), [datedItems, selectedDate, mode]);
  const grouped = useMemo(() => groupByDate(visibleItems), [visibleItems]);

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
              }}
              style={({ pressed }) => [
                styles.todayButton,
                { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }
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
            <Text style={[styles.month, { color: theme.text }]}>
              {new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(selected)}
            </Text>
            <OneIcon name={icons.calendar} size={17} color={theme.textTertiary} />
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
                  <View style={[styles.dayNumberWrap, active && { backgroundColor: theme.chrome }]}>
                    <Text style={[styles.dayNumber, { color: active ? theme.onAccent : theme.text }]}>{day.number}</Text>
                  </View>
                  <View style={[styles.dot, { backgroundColor: hasItems ? theme.sky : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.modeSwitch, { backgroundColor: theme.fill, borderColor: theme.border }]}>
            {(['day', 'week', 'month'] as CalendarMode[]).map((entry) => (
              <Pressable
                key={entry}
                accessibilityRole="button"
                accessibilityState={{ selected: mode === entry }}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setMode(entry);
                }}
                style={[styles.modeButton, mode === entry && { backgroundColor: theme.chrome }]}
              >
                <Text style={[styles.modeText, { color: mode === entry ? theme.onAccent : theme.textSecondary }]}>
                  {entry.charAt(0).toUpperCase() + entry.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </Surface>

        <View style={styles.timelineBlock}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionLeft}>
              <NeverSignal compact />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{modeLabel(mode, selected, selectedDate === today)}</Text>
              <Text style={[styles.sectionMeta, { color: theme.textTertiary }]}>{visibleItems.length} items</Text>
            </View>
          </View>

          {visibleItems.length ? (
            <Surface>
              {grouped.map((group, groupIndex) => (
                <View key={group.date}>
                  {mode !== 'day' ? (
                    <View style={[styles.dateDivider, groupIndex > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                      <Text style={[styles.dateDividerText, { color: theme.textTertiary }]}>{prettyGroupDate(group.date)}</Text>
                    </View>
                  ) : null}
                  {group.items.map((item) => <TimelineRow key={item.id} item={item} />)}
                </View>
              ))}
            </Surface>
          ) : (
            <Surface>
              <EmptyState
                icon={icons.calendar}
                title={mode === 'day' ? 'No plans here' : 'Nothing scheduled'}
                body={mode === 'day' ? 'Choose another day or capture something with a date.' : 'Your schedule is clear for this view.'}
              />
            </Surface>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function TimelineRow({ item }: { item: OneItem }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.timelineRow, { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
      >
        <View style={styles.timeColumn}>
          <Text style={[styles.time, { color: theme.textTertiary }]}>{item.time || '—'}</Text>
          <View style={[styles.timelineDot, { backgroundColor: timelineColor(item, theme) }]} />
        </View>
        <View style={[styles.timelineSpine, { backgroundColor: theme.border }]} />
        <View style={styles.timelineCopy}>
          <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.itemMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {[item.location, item.summary, item.category].filter(Boolean).join(' · ') || item.type}
          </Text>
        </View>
        <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
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

function modeLabel(mode: CalendarMode, selected: Date, isToday: boolean) {
  if (mode === 'day') return isToday ? 'Today' : new Intl.DateTimeFormat('en', { weekday: 'long' }).format(selected);
  if (mode === 'week') return 'This week';
  return new Intl.DateTimeFormat('en', { month: 'long' }).format(selected);
}

function timelineColor(item: OneItem, theme: ReturnType<typeof useTheme>) {
  if (item.type === 'reminder' || item.type === 'task') return theme.danger;
  if (item.type === 'appointment' || item.type === 'event') return theme.sky;
  return theme.chrome;
}

function prettyGroupDate(iso: string) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${iso}T12:00:00`)).toUpperCase();
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
  todayButton: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  todayText: { fontSize: 11.75, fontWeight: '600' },
  intro: { marginTop: -2 },
  title: { fontFamily: editorialFontFamily, fontSize: 34, lineHeight: 38, fontWeight: '400', letterSpacing: -0.9 },
  subtitle: { marginTop: 7, fontSize: 13, lineHeight: 19 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontSize: 17.5, lineHeight: 22, fontWeight: '600', letterSpacing: -0.28 },
  dayStrip: { marginTop: 18, flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 39, alignItems: 'center' },
  weekday: { fontSize: 8.75, lineHeight: 11, fontWeight: '700', letterSpacing: 0.72 },
  dayNumberWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  dayNumber: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 6 },
  modeSwitch: { marginTop: 18, minHeight: 36, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 3, flexDirection: 'row' },
  modeButton: { flex: 1, minHeight: 29, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  modeText: { fontSize: 10.75, fontWeight: '600' },
  timelineBlock: { gap: 10 },
  sectionHeading: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, lineHeight: 21, fontWeight: '600', letterSpacing: -0.28 },
  sectionMeta: { fontSize: 10.5, fontWeight: '600' },
  dateDivider: { minHeight: 34, paddingHorizontal: 16, justifyContent: 'center' },
  dateDividerText: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.0 },
  timelineRow: { minHeight: 76, paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeColumn: { width: 42, alignItems: 'flex-end', justifyContent: 'center' },
  time: { fontSize: 9.75, fontWeight: '600', fontVariant: ['tabular-nums'] },
  timelineDot: { width: 5, height: 5, borderRadius: 3, marginTop: 6 },
  timelineSpine: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
  timelineCopy: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600', letterSpacing: -0.14 },
  itemMeta: { marginTop: 4, fontSize: 11.25, lineHeight: 15 }
});