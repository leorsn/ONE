import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { OneItemRow } from '@/src/ui/OneItemRow';
import { EmptyState, PageHeader, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

export default function CalendarScreen() {
  const theme = useTheme();
  const { items, toggleCompleted } = useItems();
  const today = toIsoDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const datedItems = useMemo(
    () =>
      items
        .filter((item) => item.date && !item.completed)
        .sort((a, b) => `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`)),
    [items]
  );

  const selectedItems = datedItems.filter((item) => item.date === selectedDate);
  const upcoming = datedItems.filter((item) => item.date! > selectedDate).slice(0, 8);
  const strip = getDays(new Date(), 9);
  const selected = new Date(`${selectedDate}T12:00:00`);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false}>
        <PageHeader
          title="Calendar"
          subtitle="Everything with a date, without the clutter."
          action={
            <Pressable
              onPress={async () => {
                await Haptics.selectionAsync();
                setSelectedDate(today);
              }}
              style={[styles.todayButton, { backgroundColor: theme.fill }]}
            >
              <Text style={[styles.todayText, { color: theme.text }]}>Today</Text>
            </Pressable>
          }
        />

        <Surface padded>
          <View style={styles.monthRow}>
            <View>
              <Text style={[styles.month, { color: theme.text }]}>
                {new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(selected)}
              </Text>
              <Text style={[styles.selectedLabel, { color: theme.textSecondary }]}>
                {new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(selected)}
              </Text>
            </View>
            <OneIcon name={icons.calendar} size={21} color={theme.accent} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
            {strip.map((day) => {
              const active = day.iso === selectedDate;
              const hasItems = datedItems.some((item) => item.date === day.iso);
              return (
                <Pressable
                  key={day.iso}
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    setSelectedDate(day.iso);
                  }}
                  style={[
                    styles.day,
                    {
                      backgroundColor: active ? theme.accent : theme.fill,
                      borderColor: active ? theme.accent : 'transparent'
                    }
                  ]}
                >
                  <Text style={[styles.weekday, { color: active ? '#FFFFFF' : theme.textSecondary }]}>
                    {day.weekday}
                  </Text>
                  <Text style={[styles.dayNumber, { color: active ? '#FFFFFF' : theme.text }]}>
                    {day.number}
                  </Text>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: hasItems
                          ? active
                            ? '#FFFFFF'
                            : theme.accent
                          : 'transparent'
                      }
                    ]}
                  />
                </Pressable>
              );
            })}
          </ScrollView>
        </Surface>

        <View style={styles.block}>
          <SectionHeader title="Selected day" meta={String(selectedItems.length)} />
          <Surface>
            {selectedItems.length ? (
              selectedItems.map((item) => (
                <OneItemRow key={item.id} item={item} onToggle={toggleCompleted} showDate={false} />
              ))
            ) : (
              <EmptyState icon={icons.calendar} title="No plans here" body="Choose another day or capture something with a date." />
            )}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Next up" meta={String(upcoming.length)} />
          <Surface>
            {upcoming.length ? (
              upcoming.map((item) => <OneItemRow key={item.id} item={item} onToggle={toggleCompleted} />)
            ) : (
              <EmptyState icon={icons.clock} title="Nothing ahead" body="Your upcoming schedule is clear." />
            )}
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getDays(now: Date, count: number) {
  const start = new Date(now);
  start.setDate(now.getDate() - 2);
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
  todayButton: {
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  todayText: { fontSize: 12.5, fontWeight: '700' },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontSize: 18, fontWeight: '700', letterSpacing: -0.25 },
  selectedLabel: { marginTop: 3, fontSize: 12.5 },
  dayStrip: { paddingTop: 18, gap: 8 },
  day: { width: 52, height: 72, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  weekday: { fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase' },
  dayNumber: { marginTop: 4, fontSize: 17, fontWeight: '800' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 6 },
  block: { gap: 10 }
});
