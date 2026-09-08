import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { searchOneItems } from '@/src/search/searchItems';
import { searchSemantically, type SemanticMatch } from '@/src/search/semantic';
import { useTheme } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

type SearchMode = 'keywords' | 'searching' | 'hybrid' | 'fallback';

type CombinedResult = {
  item: OneItem;
  score: number;
  semanticSimilarity?: number;
};

export default function AskOneScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { items } = useItems();
  const [query, setQuery] = useState('');
  const [semanticMatches, setSemanticMatches] = useState<SemanticMatch[]>([]);
  const [searchMode, setSearchMode] = useState<SearchMode>('keywords');

  const lexicalResults = useMemo(() => searchOneItems(query, items), [query, items]);

  useEffect(() => {
    const clean = query.trim();

    if (!session || clean.length < 3) {
      setSemanticMatches([]);
      setSearchMode('keywords');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchMode('searching');

      try {
        const matches = await searchSemantically(clean);
        if (cancelled) return;
        setSemanticMatches(matches);
        setSearchMode('hybrid');
      } catch (error) {
        if (cancelled) return;
        console.warn('ONE semantic recall failed', error);
        setSemanticMatches([]);
        setSearchMode('fallback');
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, session?.user.id]);

  const results = useMemo(
    () => combineResults(items, lexicalResults, semanticMatches),
    [items, lexicalResults, semanticMatches]
  );

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
          Search across your saved context, notes, links, screenshots and shared items.
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
            <View style={styles.answerRow}>
              <Text style={[styles.answer, { color: theme.text }]}>
                {results.length
                  ? `I found ${results.length} relevant ${results.length === 1 ? 'item' : 'items'}.`
                  : searchMode === 'searching'
                    ? 'Searching your memory…'
                    : 'I could not find a matching memory yet.'}
              </Text>
              {searchMode === 'searching' ? <ActivityIndicator size="small" /> : null}
            </View>

            <Text style={[styles.mode, { color: theme.textSecondary }]}>
              {modeLabel(searchMode, Boolean(session))}
            </Text>

            <View style={styles.results}>
              {results.map(({ item, semanticSimilarity }) => (
                <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.meta, { color: theme.textSecondary }]}>
                      {[item.userContext, item.category, item.date, item.time, item.location].filter(Boolean).join(' · ')}
                    </Text>

                    {semanticSimilarity ? (
                      <Text style={[styles.semantic, { color: theme.accent }]}>
                        Semantic match · {Math.round(semanticSimilarity * 100)}%
                      </Text>
                    ) : null}

                    {(item.extractedText || item.originalText) ? (
                      <Text style={[styles.snippet, { color: theme.textSecondary }]} numberOfLines={3}>
                        {item.extractedText || item.originalText}
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

function combineResults(
  items: OneItem[],
  lexical: ReturnType<typeof searchOneItems>,
  semantic: SemanticMatch[]
): CombinedResult[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const combined = new Map<string, CombinedResult>();

  for (const result of lexical) {
    combined.set(result.item.id, {
      item: result.item,
      score: result.score
    });
  }

  for (const match of semantic) {
    const item = itemById.get(match.itemId);
    if (!item) continue;

    const existing = combined.get(item.id);
    combined.set(item.id, {
      item,
      score: (existing?.score ?? 0) + match.similarity * 12,
      semanticSimilarity: match.similarity
    });
  }

  return Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

function modeLabel(mode: SearchMode, signedIn: boolean) {
  if (!signedIn) return 'Keyword recall · Sign in for semantic recall';
  if (mode === 'searching') return 'Meaning + keywords';
  if (mode === 'hybrid') return 'Meaning + keywords';
  if (mode === 'fallback') return 'Keyword fallback · Semantic service unavailable';
  return 'Keyword recall';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 18, fontWeight: '800' },
  heading: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7, marginTop: 8 },
  subheading: { fontSize: 14, lineHeight: 20, marginTop: -6 },
  input: { minHeight: 56, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, fontSize: 16 },
  answerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  answer: { fontSize: 18, fontWeight: '700', marginTop: 6, flex: 1 },
  mode: { fontSize: 12, marginTop: -8 },
  results: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row' },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 4 },
  semantic: { fontSize: 12, fontWeight: '600', marginTop: 7 },
  snippet: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  examples: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10, paddingTop: 18, gap: 10 },
  examplesTitle: { fontSize: 16, fontWeight: '700' },
  example: { fontSize: 14, lineHeight: 20 }
});
