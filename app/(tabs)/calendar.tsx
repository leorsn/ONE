import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { useTheme } from '@/src/theme/useTheme';

export default function CalendarScreen() {
  const theme = useTheme();
  const { items } = useItems();

  const datedItems = items
    .filter((item) => item.date && !item.completed)
    .sort((a, b) => `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`));

  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date());

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.brand, { color: theme.text }]}>ONE</Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }]}>A calmer mind. A fuller life.</Text>

        <View style={[styles.calendar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.month, { color: theme.text }]}>{monthLabel}</Text>
          <View style={styles.days}>
            {getWeekDays(new Date()).map(({ iso, day, active }) => (
              <View key={iso} style={[styles.day, active && { backgroundColor: theme.accent }]}>
                <Text style={{ color: active ? '#fff' : theme.text }}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>Upcoming</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {datedItems.length ? datedItems.map((item) => (
            <View key={item.id} style={[styles.row, { borderBottomColor: theme.border }]}>
              <Text style={[styles.time, { color: theme.textSecondary }]}>{item.time || 'All day'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  {[formatDate(item.date!), item.location || item.category].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
          )) : (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>No dated items yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getWeekDays(now: Date) {
  const start = new Date(now);
  start.setDate(now.getDate() - 3);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toIsoDate(date);
    return { iso, day: String(date.getDate()), active: iso === toIsoDate(now) };
  });
}

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDate(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 14 },
  brand: { fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  tagline: { fontSize: 13, marginTop: -10, marginBottom: 8 },
  calendar: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 18 },
  month: { fontSize: 18, fontWeight: '700' },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 22, fontWeight: '700', marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  row: { minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', gap: 16, alignItems: 'center' },
  time: { width: 58, fontSize: 13 },
  title: { fontSize: 16, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 3 },
  empty: { padding: 18, fontSize: 14 }
});
