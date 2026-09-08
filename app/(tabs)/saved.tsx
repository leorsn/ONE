import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { useTheme } from '@/src/theme/useTheme';

const filters = ['All', 'Links', 'Ideas', 'Shopping', 'Travel'] as const;

export default function SavedScreen() {
  const theme = useTheme();
  const { items } = useItems();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');

  const savedItems = useMemo(() => {
    const base = items.filter((item) => item.saved || ['link', 'idea', 'shopping', 'travel'].includes(item.type));
    if (filter === 'All') return base;
    if (filter === 'Links') return base.filter((item) => item.type === 'link');
    if (filter === 'Ideas') return base.filter((item) => item.type === 'idea');
    if (filter === 'Shopping') return base.filter((item) => item.type === 'shopping' || item.category === 'Gift idea');
    return base.filter((item) => item.type === 'travel');
  }, [items, filter]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.brand, { color: theme.text }]}>ONE</Text>
        <Text style={[styles.title, { color: theme.text }]}>Saved</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Links, ideas, shopping and more — all in one place.
        </Text>

        <View style={styles.filters}>
          {filters.map((name) => {
            const active = name === filter;
            return (
              <Pressable
                key={name}
                onPress={() => setFilter(name)}
                style={[styles.filter, { backgroundColor: active ? theme.accent : theme.surface, borderColor: theme.border }]}
              >
                <Text style={{ color: active ? '#fff' : theme.text }}>{name}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {savedItems.length ? savedItems.map((item) => (
            <View key={item.id} style={[styles.row, { borderBottomColor: theme.border }]}>
              <View style={[styles.thumb, { backgroundColor: theme.accentSoft }]}>
                <Text style={{ color: theme.accent }}>{iconFor(item.type)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {[item.category, item.url, item.userContext].filter(Boolean).join(' · ') || formatType(item.type)}
                </Text>
              </View>
              <Text style={{ color: theme.textSecondary }}>•••</Text>
            </View>
          )) : (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>Nothing in this category yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function iconFor(type: string) {
  if (type === 'link') return '↗';
  if (type === 'travel') return '✈';
  if (type === 'shopping') return '◫';
  return '◇';
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
  thumb: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  itemMeta: { fontSize: 13, marginTop: 4 },
  empty: { padding: 18, fontSize: 14 }
});
