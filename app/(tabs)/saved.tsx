import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/useTheme';

const saved = [
  ['Restaurant idea', 'Nice Italian place · Food'],
  ['Summer shoes', 'Saved link · Shopping'],
  ['Rolex book for dad', 'Gift idea · Shopping'],
  ['Barcelona flight', 'Travel'],
  ['Interior inspiration', 'Saved link'],
  ['Gift ideas', '3 notes']
];

export default function SavedScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.brand, { color: theme.text }]}>ONE</Text>
        <Text style={[styles.title, { color: theme.text }]}>Saved</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Links, ideas, shopping and more — all in one place.</Text>

        <View style={styles.filters}>
          {['All', 'Links', 'Ideas', 'Shopping', 'Travel'].map((filter, index) => (
            <View key={filter} style={[styles.filter, { backgroundColor: index === 0 ? theme.accent : theme.surface, borderColor: theme.border }]}>
              <Text style={{ color: index === 0 ? '#fff' : theme.text }}>{filter}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {saved.map(([name, meta]) => (
            <View key={name} style={[styles.row, { borderBottomColor: theme.border }]}>
              <View style={[styles.thumb, { backgroundColor: theme.accentSoft }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{name}</Text>
                <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>{meta}</Text>
              </View>
              <Text style={{ color: theme.textSecondary }}>•••</Text>
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
  title: { fontSize: 30, fontWeight: '800', marginTop: 8 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 4 },
  filter: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  row: { minHeight: 78, borderBottomWidth: StyleSheet.hairlineWidth, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 50, height: 50, borderRadius: 12 },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemMeta: { fontSize: 13, marginTop: 4 }
});
