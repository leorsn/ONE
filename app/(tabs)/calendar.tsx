import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/useTheme';

const agenda = [
  ['15:00', 'Dentist appointment', 'Health Clinic · 1h'],
  ['18:00', 'Call Anna back', 'Personal'],
  ['All day', 'Package arrives', 'PostNord'],
  ['All day', 'Cancel Netflix', 'Subscription'],
  ['All day', 'Max birthday gift', 'Get something special'],
  ['08:20', 'Flight to Barcelona', 'Travel']
];

export default function CalendarScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.brand, { color: theme.text }]}>ONE</Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }]}>A calmer mind. A fuller life.</Text>

        <View style={[styles.calendar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.month, { color: theme.text }]}>September 2026</Text>
          <View style={styles.days}>
            {['15','16','17','18','19','20','21'].map((day) => (
              <View key={day} style={[styles.day, day === '18' && { backgroundColor: theme.accent }]}>
                <Text style={{ color: day === '18' ? '#fff' : theme.text }}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>Upcoming</Text>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {agenda.map(([time, title, subtitle]) => (
            <View key={title} style={[styles.row, { borderBottomColor: theme.border }]}>
              <Text style={[styles.time, { color: theme.textSecondary }]}>{time}</Text>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
  subtitle: { fontSize: 13, marginTop: 3 }
});
