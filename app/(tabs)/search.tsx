import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { usePlan } from '@/src/context/PlanContext';
import { answerFromRetrievedItems } from '@/src/recall/service';
import { retrieveLocalOneItems, retrieveOneItems } from '@/src/search/retrieve';
import { searchSemantically } from '@/src/search/semantic';
import { iconForType } from '@/src/ui/OneItemRow';
import { BrandHeader, EmptyState, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';
import type { OneItem } from '@/src/types/item';

type SearchMode = 'quick' | 'ask';
type AskAnswer = {
  title: string;
  body: string;
  sourceIds: string[];
  meta?: string;
  mode?: 'ai' | 'deterministic';
};

const suggestions = ['Recent', 'Documents', 'Links', 'Ideas'];

export default function SearchScreen() {
  const theme = useTheme();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { session } = useAuth();
  const { items } = useItems();
  const { hasAi } = usePlan();
  const [mode, setMode] = useState<SearchMode>('quick');
  const [query, setQuery] = useState(typeof q === 'string' ? q : '');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof q === 'string' && q.trim()) setQuery(q);
  }, [q]);

  const results = useMemo(
    () => retrieveLocalOneItems(query, items, { limit: 18, recentWhenEmpty: true }),
    [query, items]
  );
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  async function askNever() {
    const clean = query.trim();
    if (!clean || asking) return;
    if (!hasAi) {
      router.push('/upgrade');
      return;
    }
    await Haptics.selectionAsync();
    setAsking(true);
    setAskError(null);
    try {
      const retrieval = await retrieveOneItems(clean, items, {
        limit: 12,
        semanticSearch: session?.user.id ? searchSemantically : undefined
      });
      const response = await answerFromRetrievedItems({
        query: clean,
        retrieval: retrieval.results,
        allItems: items,
        allowAI: Boolean(session?.user.id)
      });
      setAnswer({
        title: response.title,
        body: response.body,
        sourceIds: response.sourceIds,
        meta: [response.meta, retrieval.semanticError ? 'Semantic search unavailable' : undefined].filter(Boolean).join(' · '),
        mode: response.mode
      });
    } catch {
      setAskError('NEVER could not answer that right now. Your saved memories are unchanged.');
    } finally {
      setAsking(false);
    }
  }

  async function toggleMode() {
    await Haptics.selectionAsync();
    setAskError(null);
    if (mode === 'ask') {
      setMode('quick');
      setAnswer(null);
      return;
    }
    setMode('ask');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BrandHeader />

        <View style={styles.intro}>
          <Text style={[styles.title, { color: theme.text }]}>{mode === 'ask' ? 'Ask NEVER' : 'Search'}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {mode === 'ask' ? 'Ask a question grounded in what you saved.' : 'Find anything in your memory.'}
          </Text>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: query.trim() ? theme.fillStrong : theme.border }]}>
          <OneIcon name={mode === 'ask' ? icons.ask : icons.search} size={18.5} color={theme.chrome} />
          <View style={[styles.inputDivider, { backgroundColor: theme.border }]} />
          <TextInput
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              if (answer) setAnswer(null);
              setAskError(null);
            }}
            placeholder={mode === 'ask' ? 'Ask something about your memory…' : 'Search your memory…'}
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { color: theme.text }]}
            autoCorrect={false}
            returnKeyType={mode === 'ask' ? 'send' : 'search'}
            onSubmitEditing={mode === 'ask' ? askNever : undefined}
            accessibilityLabel={mode === 'ask' ? 'Ask NEVER' : 'Search NEVER'}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => {
                setQuery('');
                setAnswer(null);
                setAskError(null);
              }}
              style={({ pressed }) => [styles.clear, { opacity: pressed ? 0.58 : 1 }]}
            >
              <OneIcon name={icons.close} size={13.5} color={theme.textTertiary} />
            </Pressable>
          ) : null}
          <View style={[styles.modeDivider, { backgroundColor: theme.border }]} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === 'ask' ? 'Return to quick search' : 'Switch to Ask NEVER'}
            onPress={toggleMode}
            style={({ pressed }) => [styles.modeInline, { backgroundColor: theme.fill, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={mode === 'ask' ? icons.search : icons.ask} size={14} color={theme.chrome} />
            <Text style={[styles.modeInlineText, { color: theme.textSecondary }]}>{mode === 'ask' ? 'SEARCH' : 'ASK'}</Text>
          </Pressable>
        </View>

        {mode === 'quick' ? (
          <>
            {!query.trim() ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
                {suggestions.map((suggestion, index) => (
                  <Pressable
                    key={suggestion}
                    accessibilityRole="button"
                    accessibilityLabel={`Search ${suggestion}`}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      if (index > 0) setQuery(suggestion);
                    }}
                    style={({ pressed }) => [
                      styles.suggestion,
                      {
                        backgroundColor: index === 0 ? theme.chrome : theme.fill,
                        borderColor: index === 0 ? theme.chrome : theme.border,
                        opacity: pressed ? 0.62 : 1
                      }
                    ]}
                  >
                    <Text style={[styles.suggestionText, { color: index === 0 ? theme.onAccent : theme.textSecondary }]}>{suggestion}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            <View style={styles.resultsBlock}>
              <SectionHeader title={query.trim() ? 'Results' : 'Recent'} meta={`${results.length} ${results.length === 1 ? 'match' : 'matches'}`} />
              <Surface>
                {results.length ? results.map(({ item, reasons }) => (
                  <SearchRow key={item.id} item={item} reason={reasonLabel(reasons)} />
                )) : (
                  <EmptyState icon={icons.search} title="Nothing matched" body="Try another wording. NEVER only shows memories with a meaningful match." />
                )}
              </Surface>
            </View>

            {query.trim() ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ask NEVER about ${query.trim()}`}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setMode('ask');
                  setAnswer(null);
                }}
                style={({ pressed }) => [styles.askBridge, { borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
              >
                <OneIcon name={icons.ask} size={16.5} color={theme.chrome} />
                <Text style={[styles.askBridgeTitle, { color: theme.text }]}>Ask NEVER about these results</Text>
                <OneIcon name={icons.chevron} size={12.5} color={theme.textTertiary} />
              </Pressable>
            ) : null}
          </>
        ) : (
          <View style={styles.askBlock}>
            {!answer && !asking ? (
              <View style={[styles.askIntro, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.askIntroTitle, { color: theme.text }]}>Ask your own memory.</Text>
                  <Text style={[styles.askIntroBody, { color: theme.textSecondary }]}>Links, dates, documents, ideas and saved context — grounded in what you captured.</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={!query.trim()}
                  onPress={askNever}
                  style={({ pressed }) => [styles.askButton, { backgroundColor: query.trim() ? theme.chrome : theme.fillStrong, opacity: !query.trim() ? 0.55 : pressed ? 0.72 : 1 }]}
                >
                  <Text style={[styles.askButtonText, { color: query.trim() ? theme.onAccent : theme.textTertiary }]}>Ask</Text>
                </Pressable>
              </View>
            ) : null}

            {asking ? (
              <View style={[styles.answerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" />
                  <Text style={[styles.thinkingText, { color: theme.textSecondary }]}>Looking through your memory…</Text>
                </View>
              </View>
            ) : null}

            {askError ? (
              <View style={[styles.errorCard, { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}55` }]}>
                <Text style={[styles.errorText, { color: theme.danger }]}>{askError}</Text>
              </View>
            ) : null}

            {answer ? <AnswerCard answer={answer} /> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function SearchRow({ item, reason }: { item: OneItem; reason?: string }) {
    const previewUri = imagePreviewUri(item);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.row, { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
      >
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={[styles.previewImage, { backgroundColor: theme.fill, borderColor: theme.border }]} resizeMode="cover" />
        ) : (
          <View style={[styles.rowGlyph, { borderColor: theme.border }]}>
            <OneIcon name={iconForType(item.type)} size={18.5} color={typeColor(item, theme)} />
          </View>
        )}
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={1}>{previewFor(item)}</Text>
          <Text style={[styles.meta, { color: theme.textTertiary }]} numberOfLines={1}>{[reason, formatCaptured(item.capturedAt || item.createdAt)].filter(Boolean).join(' · ')}</Text>
        </View>
        <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
      </Pressable>
    );
  }

  function AnswerCard({ answer: current }: { answer: AskAnswer }) {
    const urls = extractHttpUrls(current.body);
    const body = withoutStandaloneUrlLines(current.body);
    const sources = current.sourceIds.map((id) => itemById.get(id)).filter((item): item is OneItem => Boolean(item)).slice(0, 5);
    return (
      <View style={[styles.answerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.answerHeader}>
          <Text style={[styles.answerEyebrow, { color: theme.textTertiary }]}>NEVER</Text>
          <Text style={[styles.answerMode, { color: theme.textTertiary }]}>{current.mode === 'ai' ? 'SYNTHESIZED' : 'GROUNDED'}</Text>
        </View>
        <Text style={[styles.answerTitle, { color: theme.text }]}>{current.title}</Text>
        {body ? <Text style={[styles.answerBody, { color: theme.textSecondary }]}>{body}</Text> : null}
        {urls.length ? (
          <View style={styles.answerLinks}>
            {urls.map((url) => (
              <Pressable
                key={url}
                accessibilityRole="link"
                onPress={async () => {
                  await Haptics.selectionAsync();
                  await Linking.openURL(url);
                }}
                style={({ pressed }) => [styles.answerLink, { borderTopColor: theme.border, opacity: pressed ? 0.6 : 1 }]}
              >
                <OneIcon name={icons.link} size={15} color={theme.sky} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.answerLinkLabel, { color: theme.text }]}>Open link</Text>
                  <Text style={[styles.answerLinkUrl, { color: theme.textSecondary }]} numberOfLines={1}>{url}</Text>
                </View>
                <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
              </Pressable>
            ))}
          </View>
        ) : null}
        {current.meta ? <Text style={[styles.answerMeta, { color: theme.textTertiary }]}>{current.meta}</Text> : null}
        {sources.length ? (
          <View style={[styles.sources, { borderTopColor: theme.border }]}>
            <Text style={[styles.sourcesLabel, { color: theme.textTertiary }]}>SOURCES</Text>
            {sources.map((item) => (
              <Pressable key={item.id} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.sourceRow, { opacity: pressed ? 0.58 : 1 }]}>
                <Text style={[styles.sourceTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
              </Pressable>
            ))}
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/ask', params: { q: query.trim() } })}
          style={({ pressed }) => [styles.continueButton, { borderTopColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
        >
          <Text style={[styles.continueText, { color: theme.textSecondary }]}>Continue conversation</Text>
          <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
        </Pressable>
      </View>
    );
  }
}

function imagePreviewUri(item: OneItem) {
  const candidate = item.localAttachmentUri || item.imageUrl;
  return candidate && /^(file|content|ph|https?):\/\//i.test(candidate) ? candidate : undefined;
}

function typeColor(item: OneItem, theme: ReturnType<typeof useTheme>) {
  if (item.type === 'document' || item.type === 'link') return theme.sky;
  if (item.type === 'idea' || item.type === 'note') return theme.plum;
  if (item.type === 'reminder' || item.type === 'task') return theme.warning;
  return theme.textSecondary;
}

function previewFor(item: OneItem) {
  return item.summary || item.userContext || item.originalText || item.extractedText || item.category || item.url || item.type;
}

function formatCaptured(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function reasonLabel(reasons?: string[]) {
  if (!reasons?.length) return undefined;
  if (reasons.some((reason) => reason.includes('exact'))) return 'Exact match';
  if (reasons.some((reason) => reason.includes('title'))) return 'Title match';
  return 'Relevant';
}

function extractHttpUrls(value: string) {
  const matches = value.match(/https?:\/\/[^\s)\]}>,]+/gi) || [];
  return Array.from(new Set(matches.map((url) => url.replace(/[.,;:!?]+$/, ''))));
}

function withoutStandaloneUrlLines(value: string) {
  return value.split('\n').filter((line) => !/^\s*https?:\/\/\S+\s*$/.test(line)).join('\n').trim();
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  intro: { marginTop: -2 },
  title: { fontFamily: editorialFontFamily, fontSize: 34, lineHeight: 38, fontWeight: '400', letterSpacing: -0.9 },
  subtitle: { marginTop: 6, fontSize: 12.5, lineHeight: 18 },
  searchBox: { minHeight: 56, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingLeft: 15, paddingRight: 7, flexDirection: 'row', alignItems: 'center', gap: 9 },
  inputDivider: { width: StyleSheet.hairlineWidth, height: 23 },
  input: { flex: 1, minHeight: 48, fontSize: 14, lineHeight: 18.5 },
  clear: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  modeDivider: { width: StyleSheet.hairlineWidth, height: 28 },
  modeInline: { minWidth: 50, minHeight: 32, borderRadius: 10, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  modeInlineText: { fontSize: 8.5, lineHeight: 11, fontWeight: '800', letterSpacing: 0.7 },
  suggestions: { gap: 7, paddingRight: 20 },
  suggestion: { minHeight: 32, paddingHorizontal: 13, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  suggestionText: { fontSize: 11, fontWeight: '600' },
  resultsBlock: { gap: 9 },
  row: { minHeight: 72, paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowGlyph: { width: 29, height: 38, borderLeftWidth: 2, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: 42, height: 42, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14.5, lineHeight: 17.5, fontWeight: '600', letterSpacing: -0.14 },
  preview: { marginTop: 3, fontSize: 11.2, lineHeight: 14.5 },
  meta: { marginTop: 3, fontSize: 9.8, lineHeight: 12.5, fontWeight: '600' },
  askBridge: { minHeight: 48, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  askBridgeTitle: { flex: 1, fontSize: 12.25, fontWeight: '600' },
  askBlock: { gap: 11 },
  askIntro: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  askIntroTitle: { fontFamily: editorialFontFamily, fontSize: 18.5, lineHeight: 22.5, fontWeight: '400' },
  askIntroBody: { marginTop: 5, fontSize: 11.25, lineHeight: 16 },
  askButton: { minWidth: 58, minHeight: 38, paddingHorizontal: 13, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  askButtonText: { fontSize: 11.75, fontWeight: '700' },
  answerCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, overflow: 'hidden', paddingTop: 16 },
  thinkingRow: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 9 },
  thinkingText: { fontSize: 11.75, lineHeight: 15.5 },
  errorCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 14 },
  errorText: { fontSize: 11.25, lineHeight: 15.5 },
  answerHeader: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  answerEyebrow: { fontSize: 8.25, fontWeight: '800', letterSpacing: 1.5 },
  answerMode: { fontSize: 7.8, fontWeight: '700', letterSpacing: 0.95 },
  answerTitle: { paddingHorizontal: 16, marginTop: 11, fontFamily: editorialFontFamily, fontSize: 20.5, lineHeight: 24.5 },
  answerBody: { paddingHorizontal: 16, marginTop: 8, fontSize: 12, lineHeight: 17.5 },
  answerLinks: { marginTop: 13 },
  answerLink: { minHeight: 56, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  answerLinkLabel: { fontSize: 11.75, fontWeight: '600' },
  answerLinkUrl: { marginTop: 2, fontSize: 10, lineHeight: 13 },
  answerMeta: { paddingHorizontal: 16, marginTop: 11, fontSize: 9.25, lineHeight: 13 },
  sources: { marginTop: 13, paddingTop: 11, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth },
  sourcesLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.15, marginBottom: 4 },
  sourceRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceTitle: { flex: 1, fontSize: 11.25, fontWeight: '600' },
  continueButton: { marginTop: 9, minHeight: 46, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 9 },
  continueText: { flex: 1, fontSize: 11.25, fontWeight: '600' }
});
