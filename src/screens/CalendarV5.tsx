import { useLocalDay } from '@/src/ui/useLocalDay';
import { getReminderDate } from '@/src/notifications/reminderDate';
import { shiftCalendarMonth } from '@/src/ui/calendarPresentation';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { useItems } from '@/src/context/ItemsContext';
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverEyebrow, NeverHeroSurface, NeverMetric } from '@/src/ui/neverVisual';
import {
  V5Chevron,
  V5Group,
  V5SectionHeader,
  V5Segmented,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import type { OneItem } from '@/src/types/item';

type CalendarMode = 'Day' | 'Week' | 'Month';

export default function CalendarV5() {
  const p = useNeverV5Palette();
  const { items } = useItems();
  const today = useLocalDay();
  const [chosenDate, setSelectedDate] = useState<string | null>(null);
  const selectedDate = chosenDate ?? today;
  const [mode, setMode] = useState<CalendarMode>('Day');

  const datedItems = useMemo(
    () => items.filter((item) => getReminderDate({ date: item.date }, 0) && !item.completed).sort((a, b) => `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`)),
    [items]
  );
  const selected = new Date(`${selectedDate}T12:00:00`);
  const strip = getDays(selected, 7);
  const selectedItems = useMemo(() => datedItems.filter((item) => item.date === selectedDate), [datedItems, selectedDate]);
  const nextDate = useMemo(() => addDaysIso(selectedDate, 1), [selectedDate]);
  const nextItems = useMemo(() => datedItems.filter((item) => item.date === nextDate), [datedItems, nextDate]);
  const visibleItems = useMemo(() => filterForMode(datedItems, selectedDate, mode), [datedItems, selectedDate, mode]);
  const grouped = useMemo(() => groupByDate(visibleItems), [visibleItems]);
  const monthName = new Intl.DateTimeFormat('en', { month: 'long' }).format(selected);
  const weekdayName = new Intl.DateTimeFormat('en', { weekday: 'long' }).format(selected);

  async function moveMonth(delta: number) {
    void Haptics.selectionAsync().catch(() => undefined);
    setSelectedDate(shiftCalendarMonth(selectedDate, delta));
  }

  async function jumpToday() {
    void Haptics.selectionAsync().catch(() => undefined);
    setSelectedDate(null);
    setMode('Day');
  }

  return (
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.content, p.pageStyle]} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCopy}>
          <NeverEyebrow>Time intelligence</NeverEyebrow>
          <Text accessibilityRole="header" style={[styles.heroTitle, p.heading, { color: p.label }]}>Calendar.</Text>
          <Text style={[styles.heroSubtitle, { color: p.secondary }]}>Dates, reminders and plans extracted from what you save.</Text>
        </View>

        <NeverHeroSurface style={styles.calendarStage}>
          <View style={styles.dateHero}>
            <View style={styles.dateNumberBlock}>
              <Text style={[styles.dateNumber, { color: p.label }]}>{selected.getDate()}</Text>
              <Text style={[styles.dateWeekday, { color: p.secondary }]}>{weekdayName}</Text>
            </View>
            <View style={styles.dateMeta}>
              <NeverEyebrow>{selectedDate === today ? 'Today' : 'Selected date'}</NeverEyebrow>
              <Text style={[styles.monthTitle, { color: p.label }]}>{monthName}</Text>
              <Text style={[styles.yearText, { color: p.tertiary }]}>{selected.getFullYear()}</Text>
            </View>
            <View style={styles.dateActions}>
              <NeverMetric value={`${selectedItems.length}`} label={selectedDate === today ? 'today' : 'on date'} />
              <Pressable accessibilityRole="button" onPress={jumpToday} style={({ pressed }) => [styles.todayButton, { borderRadius: p.radius.chip, backgroundColor: p.fillSoft, opacity: pressed ? 0.62 : 1 }]}>
                <Text style={[styles.todayText, { color: p.chrome }]}>Now</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.monthControls}>
            <Pressable accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => moveMonth(-1)} style={({ pressed }) => [styles.monthArrow, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft, opacity: pressed ? 0.5 : 1 }]}>
              <OneIcon name={icons.chevronLeft} size={13.5} color={p.chrome} />
            </Pressable>
            <Text style={[styles.monthControlLabel, { color: p.secondary }]}>{monthName} {selected.getFullYear()}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => moveMonth(1)} style={({ pressed }) => [styles.monthArrow, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft, opacity: pressed ? 0.5 : 1 }]}>
              <OneIcon name={icons.chevron} size={13.5} color={p.chrome} />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
            {strip.map((day) => {
              const active = day.iso === selectedDate;
              const hasItems = datedItems.some((item) => item.date === day.iso);
              return (
                <Pressable accessibilityRole="button"
                  accessibilityLabel={prettyGroupDate(day.iso)} accessibilityState={{ selected: active }} key={day.iso}
                  onPress={async () => { void Haptics.selectionAsync().catch(() => undefined); setSelectedDate(day.iso); }}
                  style={({ pressed }) => [styles.day, { opacity: pressed ? 0.55 : 1 }]}
                >
                  <Text style={[styles.weekday, { color: active ? p.label : p.tertiary }]}>{day.weekday}</Text>
                  <View style={[styles.dayNumberWrap, { borderRadius: p.radius.chip, backgroundColor: active ? p.graphite : p.fillSoft, borderColor: active ? p.graphite : p.glassBorder }]}>
                    <Text style={[styles.dayNumberSmall, { color: active ? p.onAccent : p.label }]}>{day.number}</Text>
                  </View>
                  <View style={[styles.dot, { backgroundColor: hasItems ? p.chrome : 'transparent' }]} />
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[styles.segmentWrap, { borderTopColor: p.separator }]}>
            <V5Segmented options={['Day', 'Week', 'Month']} selected={mode} onSelect={(value) => setMode(value as CalendarMode)} />
          </View>
        </NeverHeroSurface>

        {mode === 'Day' ? (
          <>
            <AgendaSection
              title={selectedDate === today ? 'Today' : weekdayName}
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
            <V5SectionHeader title={mode === 'Week' ? 'This Week' : monthName} meta={`${visibleItems.length}`} />
            {grouped.length ? grouped.map((group) => (
              <View key={group.date} style={styles.groupBlock}>
                <Text style={[styles.dateLabel, { color: p.tertiary }]}>{prettyGroupDate(group.date)}</Text>
                <View style={styles.agendaStack}>
                  {group.items.map((item) => <AgendaCard key={item.id} item={item} />)}
                </View>
              </View>
            )) : (
              <V5Group><EmptyAgenda title="Nothing scheduled" body="Your schedule is clear for this view." /></V5Group>
            )}
          </View>
        )}
      </ScrollView>
    </NeverScreen>
  );

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

function AgendaSection({ title, items: sectionItems, emptyTitle, emptyBody }: { title: string; items: OneItem[]; emptyTitle: string; emptyBody: string }) {
  return (
    <View style={styles.section}>
      <V5SectionHeader title={title} meta={`${sectionItems.length}`} />
      {sectionItems.length ? (
        <View style={styles.agendaStack}>
          {sectionItems.map((item) => <AgendaCard key={item.id} item={item} />)}
        </View>
      ) : (
        <V5Group><EmptyAgenda title={emptyTitle} body={emptyBody} /></V5Group>
      )}
    </View>
  );
}

function AgendaCard({ item }: { item: OneItem }) {
  const p = useNeverV5Palette();
  return (
    <Pressable accessibilityRole="button"
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => [styles.agendaCard, p.cardStyle, { backgroundColor: p.surface, borderColor: p.border, opacity: pressed ? 0.65 : 1 }]}
    >
      <View style={[styles.timeBadge, { backgroundColor: p.fillSoft }]}>
        <Text style={[styles.time, { color: p.chrome }]}>{item.time || 'Any'}</Text>
      </View>
      <View style={styles.agendaCopy}>
        <Text style={[styles.itemTitle, { color: p.label }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.itemMeta, { color: p.secondary }]} numberOfLines={1}>{[item.location, item.summary, item.category].filter(Boolean).join(' · ') || item.type}</Text>
      </View>
      <V5Chevron />
    </Pressable>
  );
}

function EmptyAgenda({ title, body }: { title: string; body: string }) {
  const p = useNeverV5Palette();
  return (
    <View style={styles.emptyRow}>
      <View style={[styles.emptyIcon, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft }]}><OneIcon name={icons.calendar} size={16} color={p.chrome} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.emptyTitle, { color: p.label }]}>{title}</Text>
        <Text style={[styles.emptyBody, { color: p.secondary }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 26, paddingBottom: 126, gap: 26 },
  heroCopy: { gap: 5 },
  heroTitle: { fontSize: 43, lineHeight: 47, fontFamily: 'Georgia', fontWeight: '400', letterSpacing: -1.35 },
  heroSubtitle: { maxWidth: 430, fontSize: 14.5, lineHeight: 20 },
  calendarStage: { padding: 16, gap: 14 },
  dateHero: { minHeight: 104, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 },
  dateNumberBlock: { minWidth: 88 },
  dateNumber: { fontSize: 56, lineHeight: 60, fontWeight: '300', letterSpacing: -2.5 },
  dateWeekday: { marginTop: -2, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  dateMeta: { flex: 1, minWidth: 100 },
  monthTitle: { marginTop: 4, fontSize: 21, lineHeight: 25, fontWeight: '600', letterSpacing: -0.45 },
  yearText: { marginTop: 1, fontSize: 11.5, lineHeight: 15 },
  dateActions: { alignItems: 'flex-end', gap: 8 },
  todayButton: { minHeight: 44, paddingHorizontal: 13, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  todayText: { fontSize: 11.5, lineHeight: 15, fontWeight: '600' },
  monthControls: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthArrow: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  monthControlLabel: { flex: 1, textAlign: 'center', paddingHorizontal: 6, fontSize: 11.5, lineHeight: 15, fontWeight: '600' },
  dayStrip: { flexGrow: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  day: { minWidth: 44, alignItems: 'center' },
  weekday: { fontSize: 9.5, lineHeight: 12, fontWeight: '700', letterSpacing: 0.25 },
  dayNumberWrap: { minWidth: 36, minHeight: 36, padding: 6, marginTop: 5, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  dayNumberSmall: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  segmentWrap: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  section: { gap: 10 },
  groupBlock: { gap: 7 },
  dateLabel: { paddingHorizontal: 4, fontSize: 11.5, lineHeight: 14, fontWeight: '600' },
  agendaStack: { gap: 8 },
  agendaCard: { minHeight: 72, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  timeBadge: { width: 50, minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
  agendaCopy: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  itemMeta: { marginTop: 2, fontSize: 12.5, lineHeight: 16 },
  emptyRow: { minHeight: 86, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  emptyIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  emptyBody: { marginTop: 2, fontSize: 12.5, lineHeight: 16 }
});
