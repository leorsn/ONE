import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { BrandHeader, EmptyState, IconTile, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
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

  function selectMode(next: SearchMode) {
    setMode(next);
    setAskError(null);
    if (next === 'quick') setAnswer(null);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BrandHeader />

        <View style={styles.intro}>
          <Text style={[styles.title, { color: theme.text }]}>Search</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Find anything in your memory.</Text>
        </View>

        <View style={[styles.modeSwitch, { backgroundColor: theme.fill, borderColor: theme.border }]}>
          <ModeButton label="Quick search" active={mode === 'quick'} onPress={() => selectMode('quick')} />
          <ModeButton label="Ask NEVER" active={mode === 'ask'} onPress={() => selectMode('ask')} />
        </View>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.surface,
              borderColor: query.trim() ? theme.fillStrong : theme.border,
              shadowColor: theme.shadow
            }
          ]}
        >
          <OneIcon name={mode === 'ask' ? icons.ask : icons.search} size={18} color={theme.chrome} />
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
              <OneIcon name={icons.close} size={14} color={theme.textTertiary} />
            </Pressable>
          ) : null}
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
                      if (index === 0) return;
                      setQuery(suggestion);
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
                <OneIcon name={icons.ask} size={17} color={theme.chrome} />
                <Text style={[styles.askBridgeTitle, { color: theme.text }]}>Ask NEVER about these results</Text>
                <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
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
                  style={({ pressed }) => [
                    styles.askButton,
                    { backgroundColor: query.trim() ? theme.chrome : theme.fillStrong, opacity: !query.trim() ? 0.55 : pressed ? 0.72 : 1 }
                  ]}
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

  function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={async () => {
          await Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          styles.modeButton,
          {
            backgroundColor: active ? theme.surfaceElevated : 'transparent',
            borderColor: active ? theme.border : 'transparent',
            opacity: pressed ? 0.65 : 1
          }
        ]}
      >
        <Text style={[styles.modeButtonText, { color: active ? theme.text : theme.textTertiary }]}>{label}</Text>
      </Pressable>
    );
  }

  function SearchRow({ item, reason }: { item: OneItem; reason?: string }) {
    const tone = item.type === 'document' ? 'info' : item.type === 'idea' ? 'memory' : 'neutral';
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.row, { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
      >
        <IconTile icon={iconForType(item.type)} tone={tone} size={38} />
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
                style={({ pressed }) => [styles.answerLink, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.6 : 1 }]}
              >
                <OneIcon name={icons.link} size={16} color={theme.sky} />
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
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                style={({ pressed }) => [styles.sourceRow, { opacity: pressed ? 0.58 : 1 }]}
              >
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

function previewFor(item: OneItem) {
  return item.summary || item.originalText || item.rawInput || item.url || item.extractedText || item.category || 'Saved in NEVER';
}

function reasonLabel(reasons: string[]) {
  if (reasons.includes('exact-title') || reasons.includes('title')) return 'Title';
  if (reasons.includes('context') || reasons.includes('exact-context')) return 'Context';
  if (reasons.includes('people') || reasons.includes('entities')) return 'Person / entity';
  if (reasons.includes('url')) return 'Link';
  if (reasons.includes('time-context')) return 'Time';
  if (reasons.includes('recent')) return 'Recent';
  return undefined;
}

function formatCaptured(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function extractHttpUrls(value?: string) {
  if (!value) return [];
  return Array.from(new Set((value.match(/https?:\/\/[^\s<>"')\]}]+/gi) || []).map((url) => url.replace(/[.,;:!?]+$/g, ''))));
}

function withoutStandaloneUrlLines(value?: string) {
  if (!value) return undefined;
  const remaining = value.split('\n').filter((line) => !/^https?:\/\/\S+$/i.test(line.trim())).join('\n').trim();
  return remaining || undefined;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  intro: { marginTop: -4 },
  title: { fontFamily: editorialFontFamily, fontSize: 34, lineHeight: 38, letterSpacing: -1.05 },
  subtitle: { marginTop: 4, fontSize: 12.75, lineHeight: 18.5 },
  modeSwitch: { alignSelf: 'flex-start', minHeight: 39, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 3, flexDirection: 'row', alignItems: 'center', gap: 3 },
  modeButton: { minHeight: 31, paddingHorizontal: 14, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  modeButtonText: { fontSize: 11.25, lineHeight: 14, fontWeight: '600' },
  searchBox: { minHeight: 58, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, paddingLeft: 16, paddingRight: 10, flexDirection: 'row', alignItems: 'center', gap: 10, shadowOpacity: 0.035, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 1 },
  inputDivider: { width: StyleSheet.hairlineWidth, height: 25 },
  input: { flex: 1, fontSize: 14.75, minHeight: 50, letterSpacing: -0.1 },
  clear: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  suggestions: { gap: 7, paddingRight: 20 },
  suggestion: { minHeight: 34, paddingHorizontal: 13, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  suggestionText: { fontSize: 11.25, fontWeight: '600' },
  resultsBlock: { gap: 10 },
  row: { minHeight: 80, paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600', letterSpacing: -0.15 },
  preview: { fontSize: 11.75, lineHeight: 16 },
  meta: { marginTop: 1, fontSize: 10.1, lineHeight: 13, fontWeight: '600' },
  askBridge: { minHeight: 50, paddingHorizontal: 4, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  askBridgeTitle: { flex: 1, fontSize: 12.25, fontWeight: '600' },
  askBlock: { gap: 12 },
  askIntro: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  askIntroTitle: { fontFamily: editorialFontFamily, fontSize: 20, lineHeight: 24 },
  askIntroBody: { marginTop: 4, fontSize: 11.5, lineHeight: 16.5 },
  askButton: { minHeight: 38, paddingHorizontal: 16, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  askButtonText: { fontSize: 12, fontWeight: '700' },
  answerCard: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 11 },
  answerHeader: { flexDirection: 'row', alignItems: 'center' },
  answerEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  answerMode: { marginLeft: 'auto', fontSize: 8.5, fontWeight: '700', letterSpacing: 0.8 },
  answerTitle: { fontFamily: editorialFontFamily, fontSize: 21, lineHeight: 25 },
  answerBody: { fontSize: 13.1, lineHeight: 20 },
  answerLinks: { gap: 7 },
  answerLink: { minHeight: 56, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  answerLinkLabel: { fontSize: 12.25, lineHeight: 15, fontWeight: '600' },
  answerLinkUrl: { marginTop: 2, fontSize: 10.3, lineHeight: 14 },
  answerMeta: { fontSize: 10.1, lineHeight: 14.5 },
  sources: { marginTop: 2, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 2 },
  sourcesLabel: { fontSize: 8.6, fontWeight: '700', letterSpacing: 1.05, marginBottom: 4 },
  sourceRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceTitle: { flex: 1, fontSize: 12.25, lineHeight: 16, fontWeight: '600' },
  continueButton: { minHeight: 42, marginTop: 3, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  continueText: { fontSize: 11.5, fontWeight: '600' },
  thinkingRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 10 },
  thinkingText: { fontSize: 12 },
  errorCard: { borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  errorText: { fontSize: 11.5, lineHeight: 17 }
});
