import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { OneItemRow } from '@/src/ui/OneItemRow';
import { BrandHeader, EmptyState, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';

export default function CalendarScreen() {
  const theme = useTheme();
  const { items, toggleCompleted } = useItems();
  const today = toIsoDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const datedItems = useMemo(
    () => items
      .filter((item) => item.date && !item.completed)
      .sort((a, b) => `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`)),
    [items]
  );

  const selectedItems = datedItems.filter((item) => item.date === selectedDate);
  const upcoming = datedItems.filter((item) => item.date! > selectedDate).slice(0, 6);
  const strip = getDays(new Date(`${selectedDate}T12:00:00`), 7);
  const selected = new Date(`${selectedDate}T12:00:00`);

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
              style={({ pressed }) => [styles.todayButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
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
            <Text style={[styles.month, { color: theme.text }]}>{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(selected)}</Text>
            <OneIcon name={icons.calendar} size={17} color={theme.textTertiary} />
          </View>

          <View style={styles.weekStrip}>
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
                  <View style={[styles.dayNumberWrap, { backgroundColor: active ? theme.chrome : 'transparent' }]}>
                    <Text style={[styles.dayNumber, { color: active ? theme.onAccent : theme.text }]}>{day.number}</Text>
                  </View>
                  <View style={[styles.dot, { backgroundColor: hasItems ? (active ? theme.danger : theme.sky) : 'transparent' }]} />
                </Pressable>
              );
            })}
          </View>
        </Surface>

        <View style={styles.block}>
          <SectionHeader title={selectedDate === today ? 'Today' : 'Selected day'} meta={`${selectedItems.length} items`} />
          <Surface>
            {selectedItems.length ? selectedItems.map((item) => (
              <TimelineRow key={item.id} item={item} />
            )) : (
              <EmptyState icon={icons.calendar} title="No plans here" body="Choose another day or capture something with a date." />
            )}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Next up" meta={`${upcoming.length} items`} />
          <Surface>
            {upcoming.length ? upcoming.map((item) => <OneItemRow key={item.id} item={item} onToggle={toggleCompleted} />) : (
              <EmptyState icon={icons.clock} title="Nothing ahead" body="Your upcoming schedule is clear." />
            )}
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function TimelineRow({ item }: { item: (typeof items)[number] }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.timelineRow, { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
      >
        <Text style={[styles.time, { color: theme.textTertiary }]}>{item.time || '—'}</Text>
        <View style={styles.timelineMarkerWrap}>
          <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
          <View style={[styles.timelineDot, { backgroundColor: item.type === 'appointment' ? theme.danger : theme.sky }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.itemMeta, { color: theme.textSecondary }]} numberOfLines={1}>{[item.location, item.summary, item.category].filter(Boolean).join(' · ')}</Text>
        </View>
        <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
      </Pressable>
    );
  }
}

function getDays(center: Date, count: number) {
  const start = new Date(center);
  start.setDate(center.getDate() - 3);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      iso: toIsoDate(date),
      weekday: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date).slice(0, 2),
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
  todayButton: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  todayText: { fontSize: 11.5, fontWeight: '600' },
  intro: { marginTop: -4 },
  title: { fontFamily: editorialFontFamily, fontSize: 34, lineHeight: 38, letterSpacing: -1.05 },
  subtitle: { marginTop: 4, fontSize: 12.75, lineHeight: 18.5 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontSize: 17.25, lineHeight: 21, fontWeight: '600', letterSpacing: -0.24 },
  weekStrip: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between' },
  day: { flex: 1, minHeight: 70, alignItems: 'center', paddingTop: 2 },
  weekday: { fontSize: 8.75, lineHeight: 12, fontWeight: '600', letterSpacing: 0.7, textTransform: 'uppercase' },
  dayNumberWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  dayNumber: { fontSize: 15, lineHeight: 19, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 6 },
  block: { gap: 10 },
  timelineRow: { minHeight: 78, paddingHorizontal: 15, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  time: { width: 44, fontSize: 10.5, lineHeight: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  timelineMarkerWrap: { width: 14, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  timelineLine: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  timelineDot: { width: 6, height: 6, borderRadius: 3 },
  itemTitle: { fontSize: 14.25, lineHeight: 18, fontWeight: '600', letterSpacing: -0.12 },
  itemMeta: { marginTop: 3, fontSize: 11.1, lineHeight: 15 }
});
