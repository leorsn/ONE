import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { OneItemRow } from '@/src/ui/OneItemRow';
import { BrandHeader, EmptyState, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
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
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                  opacity: pressed ? 0.62 : 1
                }
              ]}
            >
              <Text style={[styles.todayText, { color: theme.text }]}>Today</Text>
            </Pressable>
          }
        />

        <View style={styles.intro}>
          <Text style={[styles.title, { color: theme.text }]}>Calendar</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Everything with a date, without the clutter.</Text>
        </View>

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
            <View style={[styles.calendarMark, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
              <OneIcon name={icons.calendar} size={17} color={theme.chrome} />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
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
                        backgroundColor: active ? theme.accent : 'transparent',
                        borderColor: active ? theme.accent : 'transparent'
                      }
                    ]}
                  >
                    <Text style={[styles.dayNumber, { color: active ? theme.onAccent : theme.text }]}>{day.number}</Text>
                  </View>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: hasItems
                          ? active
                            ? theme.textTertiary
                            : theme.chrome
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
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.025,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  todayText: { fontSize: 11.75, fontWeight: '600', letterSpacing: -0.03 },
  intro: { marginTop: -4 },
  title: { fontSize: 31, lineHeight: 35, fontWeight: '600', letterSpacing: -1.05 },
  subtitle: { marginTop: 7, maxWidth: 420, fontSize: 13, lineHeight: 19 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  month: { fontSize: 17.5, lineHeight: 22, fontWeight: '600', letterSpacing: -0.28 },
  selectedLabel: { marginTop: 4, fontSize: 11.75, lineHeight: 16 },
  calendarMark: { width: 38, height: 38, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  dayStrip: { paddingTop: 19, gap: 7, paddingRight: 4 },
  day: { width: 45, minHeight: 70, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  weekday: { fontSize: 9, lineHeight: 12, fontWeight: '600', letterSpacing: 0.72, textTransform: 'uppercase' },
  dayNumberWrap: { width: 34, height: 34, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  dayNumber: { fontSize: 15.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.16 },
  dot: { width: 3.5, height: 3.5, borderRadius: 2, marginTop: 7 },
  block: { gap: 10 }
});
