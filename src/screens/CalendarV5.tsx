import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { OneIcon, icons } from '@/src/ui/icons';
import {
  V5Chevron,
  V5Group,
  V5LargeHeader,
  V5SectionHeader,
  V5Segmented,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import type { OneItem } from '@/src/types/item';

type CalendarMode = 'Day' | 'Week' | 'Month';

export default function CalendarV5() {
  const p = useNeverV5Palette();
  const { items } = useItems();
  const today = toIsoDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState<CalendarMode>('Day');

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

  async function jumpToday() {
    await Haptics.selectionAsync();
    setSelectedDate(today);
    setMode('Day');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <V5LargeHeader
          title="Calendar"
          subtitle="Dates and reminders from everything you've saved."
          action={(
            <Pressable onPress={jumpToday} style={({ pressed }) => [styles.todayButton, { backgroundColor: p.surface, opacity: pressed ? 0.62 : 1 }]}>
              <Text style={[styles.todayText, { color: p.chrome }]}>Today</Text>
            </Pressable>
          )}
        />

        <V5Group>
          <View style={styles.monthRow}>
            <Pressable onPress={() => moveMonth(-1)} style={({ pressed }) => [styles.monthArrow, { opacity: pressed ? 0.5 : 1 }]}>
              <OneIcon name={icons.chevronLeft} size={13.5} color={p.chrome} />
            </Pressable>
            <View style={styles.monthCopy}>
              <Text style={[styles.month, { color: p.label }]}>{new Intl.DateTimeFormat('en', { month: 'long' }).format(selected)}</Text>
              <Text style={[styles.year, { color: p.tertiary }]}>{selected.getFullYear()}</Text>
            </View>
            <Pressable onPress={() => moveMonth(1)} style={({ pressed }) => [styles.monthArrow, { opacity: pressed ? 0.5 : 1 }]}>
              <OneIcon name={icons.chevron} size={13.5} color={p.chrome} />
            </Pressable>
          </View>

          <View style={styles.dayStrip}>
            {strip.map((day) => {
              const active = day.iso === selectedDate;
              const hasItems = datedItems.some((item) => item.date === day.iso);
              return (
                <Pressable
                  key={day.iso}
                  onPress={async () => { await Haptics.selectionAsync(); setSelectedDate(day.iso); }}
                  style={({ pressed }) => [styles.day, { opacity: pressed ? 0.55 : 1 }]}
                >
                  <Text style={[styles.weekday, { color: active ? p.label : p.tertiary }]}>{day.weekday}</Text>
                  <View style={[styles.dayNumberWrap, { backgroundColor: active ? p.graphite : 'transparent' }]}>
                    <Text style={[styles.dayNumber, { color: active ? (p.dark ? '#111113' : '#FFFFFF') : p.label }]}>{day.number}</Text>
                  </View>
                  <View style={[styles.dot, { backgroundColor: hasItems ? p.chrome : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.segmentWrap, { borderTopColor: p.separator }]}>
            <V5Segmented options={['Day', 'Week', 'Month']} selected={mode} onSelect={(value) => setMode(value as CalendarMode)} />
          </View>
        </V5Group>

        {mode === 'Day' ? (
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
          <View style={styles.section}>
            <V5SectionHeader title={mode === 'Week' ? 'This Week' : new Intl.DateTimeFormat('en', { month: 'long' }).format(selected)} meta={`${visibleItems.length}`} />
            {grouped.length ? grouped.map((group) => (
              <View key={group.date} style={styles.groupBlock}>
                <Text style={[styles.dateLabel, { color: p.tertiary }]}>{prettyGroupDate(group.date)}</Text>
                <V5Group>
                  {group.items.map((item, index) => <AgendaRow key={item.id} item={item} last={index === group.items.length - 1} />)}
                </V5Group>
              </View>
            )) : (
              <V5Group><EmptyAgenda title="Nothing scheduled" body="Your schedule is clear for this view." /></V5Group>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function AgendaSection({ title, items: sectionItems, emptyTitle, emptyBody }: { title: string; items: OneItem[]; emptyTitle: string; emptyBody: string }) {
    return (
      <View style={styles.section}>
        <V5SectionHeader title={title} meta={`${sectionItems.length}`} />
        <V5Group>
          {sectionItems.length ? sectionItems.map((item, index) => <AgendaRow key={item.id} item={item} last={index === sectionItems.length - 1} />) : <EmptyAgenda title={emptyTitle} body={emptyBody} />}
        </V5Group>
      </View>
    );
  }

  function AgendaRow({ item, last }: { item: OneItem; last: boolean }) {
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.agendaRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
      >
        <View style={[styles.timeBadge, { backgroundColor: p.fillSoft }]}>
          <Text style={[styles.time, { color: p.chrome }]}>{item.time || '—'}</Text>
        </View>
        <View style={[styles.agendaContent, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.itemTitle, { color: p.label }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.itemMeta, { color: p.secondary }]} numberOfLines={1}>{[item.location, item.summary, item.category].filter(Boolean).join(' · ') || item.type}</Text>
          </View>
          <V5Chevron />
        </View>
      </Pressable>
    );
  }

  function EmptyAgenda({ title, body }: { title: string; body: string }) {
    return (
      <View style={styles.emptyRow}>
        <View style={[styles.emptyIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.calendar} size={16} color={p.chrome} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.emptyTitle, { color: p.label }]}>{title}</Text>
          <Text style={[styles.emptyBody, { color: p.secondary }]}>{body}</Text>
        </View>
      </View>
    );
  }
}

function filterForMode(items: OneItem[], selectedDate: string, mode: CalendarMode) {
  if (mode === 'Day') return items.filter((item) => item.date === selectedDate);
  const selected = new Date(`${selectedDate}T12:00:00`);
  if (mode === 'Week') {
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
function prettyGroupDate(iso: string) { return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(`${iso}T12:00:00`)); }
function prettyNextLabel(iso: string) { return new Intl.DateTimeFormat('en', { weekday: 'long' }).format(new Date(`${iso}T12:00:00`)); }
function addDaysIso(iso: string, days: number) { const date = new Date(`${iso}T12:00:00`); date.setDate(date.getDate() + days); return toIsoDate(date); }
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
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 118, gap: 18 },
  todayButton: { minHeight: 32, paddingHorizontal: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  todayText: { fontSize: 13.5, lineHeight: 17, fontWeight: '600' },
  monthRow: { minHeight: 52, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthArrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthCopy: { alignItems: 'center' },
  month: { fontSize: 16.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.2 },
  year: { marginTop: 1, fontSize: 11.5, lineHeight: 14 },
  dayStrip: { paddingHorizontal: 7, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 40, alignItems: 'center' },
  weekday: { fontSize: 9.5, lineHeight: 12, fontWeight: '600' },
  dayNumberWrap: { width: 34, height: 34, marginTop: 4, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayNumber: { fontSize: 14.5, lineHeight: 17, fontWeight: '600' },
  dot: { width: 3.5, height: 3.5, borderRadius: 2, marginTop: 3 },
  segmentWrap: { padding: 8, borderTopWidth: StyleSheet.hairlineWidth },
  section: { gap: 7 },
  groupBlock: { gap: 5 },
  dateLabel: { paddingHorizontal: 4, fontSize: 11.5, lineHeight: 14, fontWeight: '600' },
  agendaRow: { minHeight: 62, paddingLeft: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  timeBadge: { width: 44, minHeight: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 11.5, lineHeight: 14, fontWeight: '600' },
  agendaContent: { flex: 1, minHeight: 62, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  itemTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  itemMeta: { marginTop: 1, fontSize: 12.5, lineHeight: 16 },
  emptyRow: { minHeight: 78, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  emptyIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  emptyBody: { marginTop: 1, fontSize: 12.5, lineHeight: 16 }
});