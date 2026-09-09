import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { searchOneItems } from '@/src/search/searchItems';
import { searchSemantically, type SemanticMatch } from '@/src/search/semantic';
import { iconForType } from '@/src/ui/OneItemRow';
import { EmptyState, IconTile, SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { usePlan } from '@/src/context/PlanContext';
import type { OneItem } from '@/src/types/item';

type SearchMode = 'keywords' | 'searching' | 'hybrid' | 'fallback';
type CombinedResult = { item: OneItem; score: number; semanticSimilarity?: number };

const examples = [
  'Which ideas did I save for Dad’s birthday?',
  'When was the dentist appointment?',
  'What did I save for Barcelona?'
];

export default function AskOneScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { items } = useItems();
  const { hasAi } = usePlan();
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

  if (!hasAi) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <View style={styles.hero}>
            <IconTile icon={icons.crown} size={52} />
            <Text style={[styles.heading, { color: theme.text }]}>Ask ONE is part of ONE AI.</Text>
            <Text style={[styles.subheading, { color: theme.textSecondary }]}>
              Upgrade to search your personal memory by meaning and ask natural-language questions.
            </Text>
          </View>
          <Pressable onPress={() => router.push('/upgrade')} style={[styles.lockedButton, { backgroundColor: theme.accent }]}>
            <Text style={styles.lockedButtonText}>View ONE AI</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.lockedBack}>
            <Text style={[styles.lockedBackText, { color: theme.textSecondary }]}>Not now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Ask ONE</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <IconTile icon={icons.ask} size={50} />
          <Text style={[styles.heading, { color: theme.text }]}>What do you want to remember?</Text>
          <Text style={[styles.subheading, { color: theme.textSecondary }]}>
            Ask naturally. ONE searches context, screenshots, notes, links and meaning.
          </Text>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <OneIcon name={icons.search} size={19} color={theme.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ask your memory"
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { color: theme.text }]}
            autoFocus
            returnKeyType="search"
          />
          {searchMode === 'searching' ? <ActivityIndicator size="small" /> : query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <OneIcon name={icons.close} size={16} color={theme.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        <View style={[styles.modePill, { backgroundColor: theme.fill }]}>
          <View style={[styles.modeDot, { backgroundColor: searchMode === 'fallback' ? theme.warning : theme.success }]} />
          <Text style={[styles.modeText, { color: theme.textSecondary }]}>{modeLabel(searchMode, Boolean(session))}</Text>
        </View>

        {query.trim() ? (
          <View style={styles.resultsBlock}>
            <SectionHeader title={results.length ? 'Best matches' : 'Results'} meta={String(results.length)} />
            {results.length ? (
              <Surface>
                {results.map(({ item, semanticSimilarity }) => (
                  <Pressable
                    key={item.id}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      router.push({ pathname: '/item/[id]', params: { id: item.id } });
                    }}
                    style={({ pressed }) => [
                      styles.resultRow,
                      { borderBottomColor: theme.border, opacity: pressed ? 0.62 : 1 }
                    ]}
                  >
                    <IconTile icon={iconForType(item.type)} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.resultMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                        {[item.userContext, item.category, item.date, item.time].filter(Boolean).join(' · ') || item.type}
                      </Text>
                      {(item.extractedText || item.originalText) ? (
                        <Text style={[styles.snippet, { color: theme.textTertiary }]} numberOfLines={2}>
                          {item.extractedText || item.originalText}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.matchSide}>
                      {semanticSimilarity ? (
                        <View style={[styles.matchBadge, { backgroundColor: theme.accentSoft }]}>
                          <Text style={[styles.matchText, { color: theme.accent }]}>{Math.round(semanticSimilarity * 100)}%</Text>
                        </View>
                      ) : null}
                      <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
                    </View>
                  </Pressable>
                ))}
              </Surface>
            ) : searchMode === 'searching' ? (
              <Surface padded>
                <View style={styles.searchingState}>
                  <ActivityIndicator />
                  <Text style={[styles.searchingText, { color: theme.textSecondary }]}>Searching your memory…</Text>
                </View>
              </Surface>
            ) : (
              <Surface>
                <EmptyState icon={icons.search} title="No matching memory" body="Try another phrasing, or save more context to ONE." />
              </Surface>
            )}
          </View>
        ) : (
          <View style={styles.resultsBlock}>
            <SectionHeader title="Try asking" />
            <Surface>
              {examples.map((example) => (
                <Pressable
                  key={example}
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    setQuery(example);
                  }}
                  style={({ pressed }) => [
                    styles.exampleRow,
                    { borderBottomColor: theme.border, opacity: pressed ? 0.62 : 1 }
                  ]}
                >
                  <IconTile icon={icons.ask} tone="neutral" size={36} />
                  <Text style={[styles.exampleText, { color: theme.text }]}>{example}</Text>
                  <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
                </Pressable>
              ))}
            </Surface>

            <View style={[styles.privacyNote, { backgroundColor: theme.accentSoft }]}>
              <OneIcon name={icons.shield} size={17} color={theme.accent} />
              <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
                Semantic recall is scoped to your authenticated ONE account.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function combineResults(items: OneItem[], lexical: ReturnType<typeof searchOneItems>, semantic: SemanticMatch[]): CombinedResult[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const combined = new Map<string, CombinedResult>();

  for (const result of lexical) combined.set(result.item.id, { item: result.item, score: result.score });

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

  return Array.from(combined.values()).sort((a, b) => b.score - a.score).slice(0, 12);
}

function modeLabel(mode: SearchMode, signedIn: boolean) {
  if (!signedIn) return 'Keyword recall · Sign in for meaning search';
  if (mode === 'searching' || mode === 'hybrid') return 'Meaning + keywords';
  if (mode === 'fallback') return 'Keyword fallback';
  return 'Private memory search';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 18 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  hero: { alignItems: 'center', paddingTop: 10 },
  heading: { marginTop: 14, maxWidth: 330, textAlign: 'center', fontSize: 30, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8 },
  subheading: { marginTop: 8, maxWidth: 330, textAlign: 'center', fontSize: 13.5, lineHeight: 19 },
  searchBox: { minHeight: 56, borderWidth: StyleSheet.hairlineWidth, borderRadius: 19, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 16 },
  modePill: { alignSelf: 'center', minHeight: 30, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  modeDot: { width: 6, height: 6, borderRadius: 3 },
  modeText: { fontSize: 11.5, fontWeight: '600' },
  resultsBlock: { gap: 10, marginTop: 4 },
  resultRow: { minHeight: 82, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  resultTitle: { fontSize: 15, fontWeight: '700' },
  resultMeta: { marginTop: 3, fontSize: 12 },
  snippet: { marginTop: 5, fontSize: 11.5, lineHeight: 16 },
  matchSide: { alignItems: 'flex-end', gap: 9 },
  matchBadge: { minHeight: 25, borderRadius: 9, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  matchText: { fontSize: 10.5, fontWeight: '800' },
  searchingState: { minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: 10 },
  searchingText: { fontSize: 13 },
  exampleRow: { minHeight: 66, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  exampleText: { flex: 1, fontSize: 13.5, lineHeight: 18, fontWeight: '600' },
  privacyNote: { minHeight: 54, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 17 }
});
