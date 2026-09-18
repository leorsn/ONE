import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { CoreBackdrop, EmptyState, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
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
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
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

  const results = useMemo(() => retrieveLocalOneItems(query, items, { limit: 18, recentWhenEmpty: true }), [query, items]);
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
      const retrieval = await retrieveOneItems(clean, items, { limit: 12, semanticSearch: session?.user.id ? searchSemantically : undefined });
      const response = await answerFromRetrievedItems({ query: clean, retrieval: retrieval.results, allItems: items, allowAI: Boolean(session?.user.id) });
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
      <CoreBackdrop />
      <ScrollView contentContainerStyle={uiStyles.screenContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>{mode === 'ask' ? 'NEVER INTELLIGENCE' : 'MEMORY RETRIEVAL'}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{mode === 'ask' ? 'Ask NEVER' : 'Search'}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{mode === 'ask' ? 'Ask a question grounded only in what you saved.' : 'Find anything you captured, instantly.'}</Text>
          </View>
          <Pressable onPress={toggleMode} accessibilityRole="button" style={({ pressed }) => [styles.modeOrb, { backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE', borderColor: dark ? '#FFFFFF16' : '#FFFFFF', opacity: pressed ? 0.65 : 1 }]}>
            <OneIcon name={mode === 'ask' ? icons.search : icons.ask} size={19} color={mode === 'ask' ? theme.chrome : theme.accent} />
          </Pressable>
        </View>

        <View style={[styles.searchBox, {
          backgroundColor: dark ? '#1C1C1EEC' : '#FFFFFFF2',
          borderColor: query.trim() ? `${theme.accent}52` : dark ? '#FFFFFF18' : '#FFFFFF',
          shadowColor: dark ? '#000000' : '#7A8293'
        }]}>
          <View style={[styles.searchIconWell, { backgroundColor: mode === 'ask' ? `${theme.accent}${dark ? '26' : '14'}` : theme.fill }]}>
            <OneIcon name={mode === 'ask' ? icons.ask : icons.search} size={18} color={mode === 'ask' ? theme.accent : theme.chrome} />
          </View>
          <TextInput
            value={query}
            onChangeText={(value) => {
              setQuery(value);
              if (answer) setAnswer(null);
              setAskError(null);
            }}
            placeholder={mode === 'ask' ? 'Ask about your memory…' : 'Search your memory…'}
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { color: theme.text }]}
            autoCorrect={false}
            returnKeyType={mode === 'ask' ? 'send' : 'search'}
            onSubmitEditing={mode === 'ask' ? askNever : undefined}
          />
          {query ? (
            <Pressable onPress={() => { setQuery(''); setAnswer(null); setAskError(null); }} style={styles.clear} accessibilityRole="button" accessibilityLabel="Clear search">
              <OneIcon name={icons.close} size={13} color={theme.textTertiary} />
            </Pressable>
          ) : null}
          {mode === 'ask' ? (
            <Pressable disabled={!query.trim()} onPress={askNever} style={({ pressed }) => [styles.askSend, { backgroundColor: query.trim() ? theme.accent : theme.fillStrong, opacity: !query.trim() ? 0.5 : pressed ? 0.7 : 1 }]}>
              <OneIcon name={icons.chevron} size={14} color={query.trim() ? '#FFFFFF' : theme.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        {mode === 'quick' ? (
          <>
            {!query.trim() ? (
              <View style={styles.categoryRail}>
                {suggestions.map((suggestion, index) => (
                  <Pressable
                    key={suggestion}
                    onPress={async () => {
                      await Haptics.selectionAsync();
                      if (index > 0) setQuery(suggestion);
                    }}
                    style={({ pressed }) => [styles.categoryTab, { opacity: pressed ? 0.55 : 1 }]}
                  >
                    <Text style={[styles.categoryText, { color: index === 0 ? theme.text : theme.textTertiary }]}>{suggestion}</Text>
                    {index === 0 ? <View style={[styles.categoryUnderline, { backgroundColor: theme.accent }]} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.resultsBlock}>
              <SectionHeader title={query.trim() ? 'Results' : 'Recent'} meta={`${results.length} ${results.length === 1 ? 'match' : 'matches'}`} />
              {results.length ? (
                <View style={styles.resultStack}>
                  {results.map(({ item, reasons }) => <SearchCard key={item.id} item={item} reason={reasonLabel(reasons)} />)}
                </View>
              ) : (
                <Surface><EmptyState icon={icons.search} title="Nothing matched" body="Try another wording. NEVER only shows memories with a meaningful match." /></Surface>
              )}
            </View>

            {query.trim() ? (
              <Pressable onPress={async () => { await Haptics.selectionAsync(); setMode('ask'); setAnswer(null); }} style={({ pressed }) => [styles.askBridge, { backgroundColor: dark ? '#142235E8' : '#E9F3FFF0', borderColor: `${theme.accent}2F`, opacity: pressed ? 0.7 : 1 }]}>
                <View style={[styles.askBridgeIcon, { backgroundColor: `${theme.accent}${dark ? '28' : '18'}` }]}><OneIcon name={icons.ask} size={16} color={theme.accent} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.askBridgeTitle, { color: theme.text }]}>Ask NEVER about this search</Text>
                  <Text style={[styles.askBridgeBody, { color: theme.textSecondary }]} numberOfLines={1}>{query.trim()}</Text>
                </View>
                <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
              </Pressable>
            ) : null}
          </>
        ) : (
          <View style={styles.askBlock}>
            {!answer && !asking ? (
              <View style={[styles.askIntro, { backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE', borderColor: dark ? '#FFFFFF16' : '#FFFFFF', shadowColor: dark ? '#000000' : '#7B8495' }]}>
                <View style={[styles.askHeroIcon, { backgroundColor: `${theme.accent}${dark ? '24' : '12'}` }]}><OneIcon name={icons.ask} size={24} color={theme.accent} /></View>
                <Text style={[styles.askIntroTitle, { color: theme.text }]}>Ask your own memory.</Text>
                <Text style={[styles.askIntroBody, { color: theme.textSecondary }]}>Links, dates, documents, ideas and saved context — grounded in what you captured.</Text>
              </View>
            ) : null}

            {asking ? (
              <View style={[styles.answerCard, { backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE', borderColor: dark ? '#FFFFFF16' : '#FFFFFF' }]}>
                <View style={styles.thinkingRow}><ActivityIndicator size="small" /><Text style={[styles.thinkingText, { color: theme.textSecondary }]}>Looking through your memory…</Text></View>
              </View>
            ) : null}

            {askError ? <View style={[styles.errorCard, { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}55` }]}><Text style={[styles.errorText, { color: theme.danger }]}>{askError}</Text></View> : null}
            {answer ? <AnswerCard answer={answer} /> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function SearchCard({ item, reason }: { item: OneItem; reason?: string }) {
    const previewUri = imagePreviewUri(item);
    const tint = typeColor(item, theme);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.resultCard, {
          backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE',
          borderColor: dark ? '#FFFFFF16' : '#FFFFFF',
          shadowColor: dark ? '#000000' : '#7A8392',
          opacity: pressed ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.988 : 1 }]
        }]}
      >
        {previewUri ? <Image source={{ uri: previewUri }} style={[styles.previewImage, { backgroundColor: theme.fill }]} resizeMode="cover" /> : (
          <View style={[styles.rowGlyph, { backgroundColor: `${tint}${dark ? '22' : '12'}` }]}><OneIcon name={iconForType(item.type)} size={18} color={tint} /></View>
        )}
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
            {reason ? <View style={[styles.reasonBadge, { backgroundColor: dark ? '#FFFFFF0E' : '#F1F2F6' }]}><Text style={[styles.reasonText, { color: theme.textTertiary }]}>{reason}</Text></View> : null}
          </View>
          <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={1}>{previewFor(item)}</Text>
          <Text style={[styles.meta, { color: theme.textTertiary }]} numberOfLines={1}>{formatCaptured(item.capturedAt || item.createdAt)}</Text>
        </View>
        <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
      </Pressable>
    );
  }

  function AnswerCard({ answer: current }: { answer: AskAnswer }) {
    const urls = extractHttpUrls(current.body);
    const body = withoutStandaloneUrlLines(current.body);
    const sources = current.sourceIds.map((id) => itemById.get(id)).filter((item): item is OneItem => Boolean(item)).slice(0, 5);
    return (
      <View style={[styles.answerCard, { backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE', borderColor: dark ? '#FFFFFF16' : '#FFFFFF' }]}>
        <View style={styles.answerHeader}>
          <View style={[styles.answerBadge, { backgroundColor: `${theme.accent}${dark ? '24' : '12'}` }]}><OneIcon name={icons.ask} size={14} color={theme.accent} /></View>
          <Text style={[styles.answerMode, { color: theme.textTertiary }]}>{current.mode === 'ai' ? 'SYNTHESIZED' : 'GROUNDED'}</Text>
        </View>
        <Text style={[styles.answerTitle, { color: theme.text }]}>{current.title}</Text>
        {body ? <Text style={[styles.answerBody, { color: theme.textSecondary }]}>{body}</Text> : null}
        {urls.length ? (
          <View style={styles.answerLinks}>
            {urls.map((url) => (
              <Pressable key={url} accessibilityRole="link" onPress={async () => { await Haptics.selectionAsync(); await Linking.openURL(url); }} style={({ pressed }) => [styles.answerLink, { borderTopColor: `${theme.text}0D`, opacity: pressed ? 0.6 : 1 }]}>
                <View style={[styles.answerLinkIcon, { backgroundColor: `${theme.accent}${dark ? '24' : '12'}` }]}><OneIcon name={icons.link} size={13.5} color={theme.accent} /></View>
                <View style={{ flex: 1 }}><Text style={[styles.answerLinkLabel, { color: theme.text }]}>Open link</Text><Text style={[styles.answerLinkUrl, { color: theme.textSecondary }]} numberOfLines={1}>{url}</Text></View>
                <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
              </Pressable>
            ))}
          </View>
        ) : null}
        {current.meta ? <Text style={[styles.answerMeta, { color: theme.textTertiary }]}>{current.meta}</Text> : null}
        {sources.length ? (
          <View style={[styles.sources, { borderTopColor: `${theme.text}0D` }]}>
            <Text style={[styles.sourcesLabel, { color: theme.textTertiary }]}>SOURCES</Text>
            {sources.map((item) => (
              <Pressable key={item.id} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.sourceRow, { opacity: pressed ? 0.58 : 1 }]}>
                <Text style={[styles.sourceTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
              </Pressable>
            ))}
          </View>
        ) : null}
        <Pressable onPress={() => router.push({ pathname: '/ask', params: { q: query.trim() } })} style={({ pressed }) => [styles.continueButton, { borderTopColor: `${theme.text}0D`, opacity: pressed ? 0.62 : 1 }]}>
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
  if (!value) return 'Saved memory';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved memory';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function reasonLabel(reasons?: string[]) {
  if (!reasons?.length) return undefined;
  if (reasons.some((reason) => reason.includes('exact'))) return 'Exact';
  if (reasons.some((reason) => reason.includes('title'))) return 'Title';
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
  header: { paddingTop: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  eyebrow: { fontSize: 8.2, lineHeight: 11, fontWeight: '800', letterSpacing: 1.55 },
  title: { marginTop: 6, fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -1.3 },
  subtitle: { marginTop: 6, maxWidth: 460, fontSize: 13.25, lineHeight: 18.5 },
  modeOrb: { width: 46, height: 46, borderRadius: 23, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  searchBox: { minHeight: 68, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10, shadowOpacity: 0.16, shadowRadius: 32, shadowOffset: { width: 0, height: 15 }, elevation: 5 },
  searchIconWell: { width: 44, height: 44, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 50, fontSize: 15.5, lineHeight: 20 },
  clear: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  askSend: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  categoryRail: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingHorizontal: 3 },
  categoryTab: { minHeight: 38, justifyContent: 'center', position: 'relative' },
  categoryText: { fontSize: 11.75, fontWeight: '600' },
  categoryUnderline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2.5, borderRadius: 2 },
  resultsBlock: { gap: 11 },
  resultStack: { gap: 10 },
  resultCard: { minHeight: 84, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowOpacity: 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  rowGlyph: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: 48, height: 48, borderRadius: 15 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowTitle: { flex: 1, fontSize: 14.7, lineHeight: 18.5, fontWeight: '700', letterSpacing: -0.18 },
  reasonBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9 },
  reasonText: { fontSize: 7.5, fontWeight: '700', letterSpacing: 0.4 },
  preview: { marginTop: 4, fontSize: 11.2, lineHeight: 14.5 },
  meta: { marginTop: 4, fontSize: 9.6, lineHeight: 12, fontWeight: '600' },
  askBridge: { minHeight: 66, paddingHorizontal: 13, borderWidth: StyleSheet.hairlineWidth, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 11 },
  askBridgeIcon: { width: 38, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  askBridgeTitle: { fontSize: 12.5, fontWeight: '700' },
  askBridgeBody: { marginTop: 2, fontSize: 10.25 },
  askBlock: { gap: 12 },
  askIntro: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 26, padding: 22, alignItems: 'flex-start', shadowOpacity: 0.13, shadowRadius: 28, shadowOffset: { width: 0, height: 12 }, elevation: 4 },
  askHeroIcon: { width: 48, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  askIntroTitle: { marginTop: 18, fontSize: 21, lineHeight: 25, fontWeight: '800', letterSpacing: -0.45 },
  askIntroBody: { marginTop: 7, maxWidth: 420, fontSize: 12.2, lineHeight: 17.5 },
  answerCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 26, overflow: 'hidden', paddingTop: 18 },
  thinkingRow: { paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 9 },
  thinkingText: { fontSize: 11.75, lineHeight: 15.5 },
  errorCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 15 },
  errorText: { fontSize: 11.25, lineHeight: 15.5 },
  answerHeader: { paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  answerBadge: { width: 34, height: 34, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  answerMode: { fontSize: 7.8, fontWeight: '800', letterSpacing: 0.95 },
  answerTitle: { paddingHorizontal: 18, marginTop: 14, fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.4 },
  answerBody: { paddingHorizontal: 18, marginTop: 8, fontSize: 12, lineHeight: 17.5 },
  answerLinks: { marginTop: 13 },
  answerLink: { minHeight: 58, paddingHorizontal: 18, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  answerLinkIcon: { width: 30, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  answerLinkLabel: { fontSize: 11.75, fontWeight: '600' },
  answerLinkUrl: { marginTop: 2, fontSize: 10, lineHeight: 13 },
  answerMeta: { paddingHorizontal: 18, marginTop: 11, fontSize: 9.25, lineHeight: 13 },
  sources: { marginTop: 13, paddingTop: 11, paddingHorizontal: 18, borderTopWidth: StyleSheet.hairlineWidth },
  sourcesLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.15, marginBottom: 4 },
  sourceRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceTitle: { flex: 1, fontSize: 11.25, fontWeight: '600' },
  continueButton: { marginTop: 12, minHeight: 48, paddingHorizontal: 18, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  continueText: { fontSize: 11.25, fontWeight: '600' }
});
