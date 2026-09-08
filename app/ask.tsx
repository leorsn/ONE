import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { searchOneItems } from '@/src/search/searchItems';
import { useTheme } from '@/src/theme/useTheme';

export default function AskOneScreen() {
  const theme = useTheme();
  const { items } = useItems();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchOneItems(query, items), [query, items]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: theme.accent }}>Back</Text>
          </Pressable>
          <Text style={[styles.brand, { color: theme.text }]}>Ask ONE</Text>
          <View style={{ width: 34 }} />
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>What do you want to remember?</Text>
        <Text style={[styles.subheading, { color: theme.textSecondary }]}>
          Search across your saved context, notes, links and shared items.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Which gift ideas did I save for Dad?"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
          autoFocus
        />

        {query.trim() ? (
          <>
            <Text style={[styles.answer, { color: theme.text }]}>
              {results.length
                ? `I found ${results.length} relevant ${results.length === 1 ? 'item' : 'items'}.`
                : 'I could not find a matching memory yet.'}
            </Text>

            <View style={styles.results}>
              {results.map(({ item }) => (
                <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>
                      {[item.userContext, item.category, item.date, item.time, item.location].filter(Boolean).join(' · ')}
                    </Text>
                    {item.originalText && item.originalText !== item.title ? (
                      <Text style={[styles.snippet, { color: theme.textSecondary }]} numberOfLines={3}>
                        {item.originalText}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={[styles.examples, { borderColor: theme.border }]}>
            <Text style={[styles.examplesTitle, { color: theme.text }]}>Try asking</Text>
            <Text style={[styles.example, { color: theme.textSecondary }]}>“Which ideas did I save for Dad’s birthday?”</Text>
            <Text style={[styles.example, { color: theme.textSecondary }]}>“When was the dentist appointment?”</Text>
            <Text style={[styles.example, { color: theme.textSecondary }]}>“What did I save for Barcelona?”</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 18, fontWeight: '800' },
  heading: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7, marginTop: 8 },
  subheading: { fontSize: 14, lineHeight: 20, marginTop: -6 },
  input: { minHeight: 56, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, fontSize: 16 },
  answer: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  results: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row' },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 4 },
  snippet: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  examples: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10, paddingTop: 18, gap: 10 },
  examplesTitle: { fontSize: 16, fontWeight: '700' },
  example: { fontSize: 14, lineHeight: 20 }
});
