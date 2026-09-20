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
import { EmptyState, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverWordmark } from '@/src/ui/never';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

type SearchMode = 'quick' | 'ask';
type AskAnswer = { title: string; body: string; sourceIds: string[]; meta?: string; mode?: 'ai' | 'deterministic' };
const suggestions = ['Recent', 'Documents', 'Links', 'Ideas'];

export default function SearchV4() {
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

  useEffect(() => { if (typeof q === 'string' && q.trim()) setQuery(q); }, [q]);
  const results = useMemo(() => retrieveLocalOneItems(query, items, { limit: 18, recentWhenEmpty: true }), [query, items]);
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  async function askNever() {
    const clean = query.trim();
    if (!clean || asking) return;
    if (!hasAi) { router.push('/upgrade'); return; }
    await Haptics.selectionAsync();
    setAsking(true);
    setAskError(null);
    try {
      const retrieval = await retrieveOneItems(clean, items, { limit: 12, semanticSearch: session?.user.id ? searchSemantically : undefined });
      const response = await answerFromRetrievedItems({ query: clean, retrieval: retrieval.results, allItems: items, allowAI: Boolean(session?.user.id) });
      setAnswer({ title: response.title, body: response.body, sourceIds: response.sourceIds, meta: [response.meta, retrieval.semanticError ? 'Semantic search unavailable' : undefined].filter(Boolean).join(' · '), mode: response.mode });
    } catch {
      setAskError('NEVER could not answer that right now. Your saved memories are unchanged.');
    } finally {
      setAsking(false);
    }
  }

  async function toggleMode() {
    await Haptics.selectionAsync();
    setAskError(null);
    setAnswer(null);
    setMode((current) => current === 'quick' ? 'ask' : 'quick');
  }

  function applySuggestion(suggestion: string, index: number) {
    void Haptics.selectionAsync();
    setQuery(index === 0 ? '' : suggestion);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <NeverWordmark compact />
          <Pressable onPress={toggleMode} style={({ pressed }) => [styles.modeButton, { backgroundColor: mode === 'ask' ? (dark ? '#E8ECEF' : '#171B20') : theme.glass, borderColor: theme.glassBorder, opacity: pressed ? 0.7 : 1 }]}>
            <OneIcon name={mode === 'ask' ? icons.search : icons.ask} size={13.5} color={mode === 'ask' ? (dark ? '#11161B' : '#FFFFFF') : theme.chrome} />
            <Text style={[styles.modeButtonText, { color: mode === 'ask' ? (dark ? '#11161B' : '#FFFFFF') : theme.textSecondary }]}>{mode === 'ask' ? 'SEARCH' : 'ASK'}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>{mode === 'ask' ? 'MEMORY INTELLIGENCE' : 'MEMORY RETRIEVAL'}</Text>
          <Text style={[styles.title, { color: theme.text }]}>{mode === 'ask' ? 'Ask your memory.' : 'Search your memory.'}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{mode === 'ask' ? 'Ask a question grounded only in what you saved.' : 'Find documents, links, ideas and context without digging.'}</Text>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.glassStrong, borderColor: query.trim() ? theme.chromeSoft : theme.glassBorder, shadowColor: theme.shadow }]}>
          <View style={[styles.searchGlyph, { backgroundColor: theme.platinumSoft }]}>
            <OneIcon name={mode === 'ask' ? icons.ask : icons.search} size={17} color={theme.chrome} />
          </View>
          <TextInput
            value={query}
            onChangeText={(value) => { setQuery(value); setAnswer(null); setAskError(null); }}
            placeholder={mode === 'ask' ? 'Ask about your memory…' : 'Search your memory…'}
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { color: theme.text }]}
            autoCorrect={false}
            returnKeyType={mode === 'ask' ? 'send' : 'search'}
            onSubmitEditing={mode === 'ask' ? askNever : undefined}
          />
          {query ? <Pressable onPress={() => { setQuery(''); setAnswer(null); setAskError(null); }} style={styles.clear}><OneIcon name={icons.close} size={12} color={theme.textTertiary} /></Pressable> : null}
          {mode === 'ask' ? (
            <Pressable disabled={!query.trim()} onPress={askNever} style={[styles.send, { backgroundColor: query.trim() ? theme.chrome : theme.platinumSoft, opacity: query.trim() ? 1 : 0.5 }]}>
              <OneIcon name={icons.chevron} size={12} color={query.trim() ? theme.background : theme.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        {mode === 'quick' ? (
          <>
            {!query.trim() ? (
              <View style={styles.chips}>
                {suggestions.map((suggestion, index) => (
                  <Pressable key={suggestion} onPress={() => applySuggestion(suggestion, index)} style={({ pressed }) => [styles.chip, { backgroundColor: index === 0 ? theme.platinumSoft : 'transparent', borderColor: index === 0 ? theme.glassBorder : theme.border, opacity: pressed ? 0.65 : 1 }]}>
                    <Text style={[styles.chipText, { color: index === 0 ? theme.text : theme.textTertiary }]}>{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.resultsHeader}>
              <View>
                <Text style={[styles.resultsEyebrow, { color: theme.textTertiary }]}>{query.trim() ? 'MATCHED MEMORY' : 'RECENT MEMORY'}</Text>
                <Text style={[styles.resultsTitle, { color: theme.text }]}>{query.trim() ? 'Results' : 'Recently saved'}</Text>
              </View>
              <Text style={[styles.resultsMeta, { color: theme.textTertiary }]}>{results.length} {results.length === 1 ? 'match' : 'matches'}</Text>
            </View>

            {results.length ? (
              <View style={[styles.resultsGroup, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
                {results.map(({ item, reasons }, index) => <SearchRow key={item.id} item={item} reason={reasonLabel(reasons)} last={index === results.length - 1} />)}
              </View>
            ) : <Surface><EmptyState icon={icons.search} title="Nothing matched" body="Try another wording. NEVER only shows memories with a meaningful match." /></Surface>}

            {query.trim() ? (
              <Pressable onPress={async () => { await Haptics.selectionAsync(); setMode('ask'); setAnswer(null); }} style={({ pressed }) => [styles.askBridge, { backgroundColor: dark ? '#E8ECEF' : '#171B20', opacity: pressed ? 0.75 : 1 }]}>
                <View style={[styles.askBridgeGlyph, { backgroundColor: dark ? '#171B20' : '#FFFFFF12' }]}><OneIcon name={icons.ask} size={14} color="#F5F7F9" /></View>
                <View style={{ flex: 1 }}><Text style={[styles.askBridgeTitle, { color: dark ? '#11161B' : '#FFFFFF' }]}>Ask NEVER about this search</Text><Text style={[styles.askBridgeBody, { color: dark ? '#5E6872' : '#A7B0B9' }]} numberOfLines={1}>{query.trim()}</Text></View>
                <OneIcon name={icons.chevron} size={11} color={dark ? '#11161B' : '#DDE2E6'} />
              </Pressable>
            ) : null}
          </>
        ) : (
          <View style={styles.askBlock}>
            {!answer && !asking ? (
              <View style={[styles.askIntro, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}>
                <View style={[styles.askIntroIcon, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.ask} size={20} color={theme.chrome} /></View>
                <Text style={[styles.askIntroTitle, { color: theme.text }]}>Grounded recall</Text>
                <Text style={[styles.askIntroBody, { color: theme.textSecondary }]}>NEVER searches your saved information first. If the evidence is not there, it should say so.</Text>
              </View>
            ) : null}
            {asking ? <View style={[styles.answerCard, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}><ActivityIndicator size="small" color={theme.chrome} /><Text style={[styles.thinking, { color: theme.textSecondary }]}>Looking through your memory…</Text></View> : null}
            {askError ? <View style={[styles.errorCard, { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}55` }]}><Text style={[styles.errorText, { color: theme.danger }]}>{askError}</Text></View> : null}
            {answer ? <AnswerCard answer={answer} /> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function SearchRow({ item, reason, last }: { item: OneItem; reason?: string; last: boolean }) {
    const previewUri = imagePreviewUri(item);
    const tint = typeColor(item, theme);
    return (
      <Pressable onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.resultRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }, { backgroundColor: pressed ? theme.fill : 'transparent' }]}>
        {previewUri ? <Image source={{ uri: previewUri }} style={[styles.previewImage, { backgroundColor: theme.fill }]} resizeMode="cover" /> : <View style={[styles.rowGlyph, { backgroundColor: `${tint}${dark ? '20' : '12'}` }]}><OneIcon name={iconForType(item.type)} size={17} color={tint} /></View>}
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
            {reason ? <Text style={[styles.reason, { color: theme.textTertiary }]}>{reason}</Text> : null}
          </View>
          <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={1}>{previewFor(item)}</Text>
          <Text style={[styles.meta, { color: theme.textTertiary }]}>{formatCaptured(item.capturedAt || item.createdAt)}</Text>
        </View>
        <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
      </Pressable>
    );
  }

  function AnswerCard({ answer: current }: { answer: AskAnswer }) {
    const urls = extractHttpUrls(current.body);
    const body = withoutStandaloneUrlLines(current.body);
    const sources = current.sourceIds.map((id) => itemById.get(id)).filter((item): item is OneItem => Boolean(item)).slice(0, 5);
    return (
      <View style={[styles.answerPanel, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}>
        <View style={styles.answerHeader}><View style={[styles.answerBadge, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.ask} size={13} color={theme.chrome} /></View><Text style={[styles.answerMode, { color: theme.textTertiary }]}>{current.mode === 'ai' ? 'SYNTHESIZED' : 'GROUNDED'}</Text></View>
        <Text style={[styles.answerTitle, { color: theme.text }]}>{current.title}</Text>
        {body ? <Text style={[styles.answerBody, { color: theme.textSecondary }]}>{body}</Text> : null}
        {urls.length ? <View style={styles.answerLinks}>{urls.map((url) => <Pressable key={url} onPress={async () => { await Haptics.selectionAsync(); await Linking.openURL(url); }} style={[styles.answerLink, { borderTopColor: theme.border }]}><OneIcon name={icons.link} size={13} color={theme.chrome} /><Text style={[styles.answerLinkUrl, { color: theme.textSecondary }]} numberOfLines={1}>{url}</Text><OneIcon name={icons.chevron} size={11} color={theme.textTertiary} /></Pressable>)}</View> : null}
        {current.meta ? <Text style={[styles.answerMeta, { color: theme.textTertiary }]}>{current.meta}</Text> : null}
        {sources.length ? <View style={[styles.sources, { borderTopColor: theme.border }]}><Text style={[styles.sourcesLabel, { color: theme.textTertiary }]}>SOURCES</Text>{sources.map((item) => <Pressable key={item.id} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={styles.sourceRow}><Text style={[styles.sourceTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text><OneIcon name={icons.chevron} size={11} color={theme.textTertiary} /></Pressable>)}</View> : null}
      </View>
    );
  }
}

function imagePreviewUri(item: OneItem) {
  const candidate = item.localAttachmentUri || item.imageUrl;
  return candidate && /^(file|content|ph|https?):\/\//i.test(candidate) ? candidate : undefined;
}
function typeColor(item: OneItem, theme: ReturnType<typeof useTheme>) {
  if (item.type === 'document' || item.type === 'link') return theme.chrome;
  if (item.type === 'idea' || item.type === 'note') return theme.plum;
  if (item.type === 'reminder' || item.type === 'task') return theme.warning;
  return theme.textSecondary;
}
function previewFor(item: OneItem) { return item.summary || item.userContext || item.originalText || item.extractedText || item.category || item.url || item.type; }
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
function extractHttpUrls(value: string) { return Array.from(new Set((value.match(/https?:\/\/[^\s)\]}>,]+/gi) || []).map((url) => url.replace(/[.,;:!?]+$/, '')))); }
function withoutStandaloneUrlLines(value: string) { return value.split('\n').filter((line) => !/^\s*https?:\/\/\S+\s*$/.test(line)).join('\n').trim(); }

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 112, gap: 22 },
  topRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeButton: { minHeight: 30, paddingHorizontal: 11, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeButtonText: { fontSize: 7.5, fontWeight: '800', letterSpacing: 0.9 },
  hero: { paddingTop: 6 },
  eyebrow: { fontSize: 8.4, lineHeight: 11, fontWeight: '800', letterSpacing: 1.65 },
  title: { marginTop: 7, fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -1.15 },
  subtitle: { marginTop: 7, maxWidth: 480, fontSize: 13, lineHeight: 18.5 },
  searchBox: { minHeight: 61, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 9, shadowOpacity: 0.08, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  searchGlyph: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 48, fontSize: 14.8, lineHeight: 19 },
  clear: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  send: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: 7 },
  chip: { flex: 1, minHeight: 36, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 9.8, fontWeight: '700' },
  resultsHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  resultsEyebrow: { fontSize: 8, lineHeight: 10, fontWeight: '800', letterSpacing: 1.55 },
  resultsTitle: { marginTop: 5, fontSize: 21, lineHeight: 25, fontWeight: '700', letterSpacing: -0.5 },
  resultsMeta: { fontSize: 9.8, lineHeight: 13, fontWeight: '600' },
  resultsGroup: { borderRadius: 23, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', shadowOpacity: 0.07, shadowRadius: 22, shadowOffset: { width: 0, height: 9 }, elevation: 3 },
  resultRow: { minHeight: 84, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowGlyph: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: 48, height: 48, borderRadius: 15 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowTitle: { flex: 1, fontSize: 14.1, lineHeight: 18, fontWeight: '700', letterSpacing: -0.15 },
  reason: { fontSize: 7.3, lineHeight: 10, fontWeight: '700', letterSpacing: 0.45 },
  preview: { marginTop: 3, fontSize: 10.8, lineHeight: 14 },
  meta: { marginTop: 4, fontSize: 9.2, lineHeight: 12, fontWeight: '600' },
  askBridge: { minHeight: 61, borderRadius: 20, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  askBridgeGlyph: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  askBridgeTitle: { fontSize: 12.2, lineHeight: 16, fontWeight: '700' },
  askBridgeBody: { marginTop: 2, fontSize: 9.8, lineHeight: 13 },
  askBlock: { gap: 12 },
  askIntro: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  askIntroIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  askIntroTitle: { marginTop: 14, fontSize: 18.5, lineHeight: 23, fontWeight: '700', letterSpacing: -0.35 },
  askIntroBody: { marginTop: 6, fontSize: 12, lineHeight: 17.5 },
  answerCard: { minHeight: 64, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  thinking: { fontSize: 11.5 },
  errorCard: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  errorText: { fontSize: 11.2, lineHeight: 15.5 },
  answerPanel: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingTop: 16, overflow: 'hidden' },
  answerHeader: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  answerBadge: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  answerMode: { fontSize: 7.5, fontWeight: '800', letterSpacing: 0.9 },
  answerTitle: { paddingHorizontal: 16, marginTop: 12, fontSize: 19, lineHeight: 23, fontWeight: '700' },
  answerBody: { paddingHorizontal: 16, marginTop: 7, fontSize: 12, lineHeight: 17.5 },
  answerLinks: { marginTop: 12 },
  answerLink: { minHeight: 52, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 9 },
  answerLinkUrl: { flex: 1, fontSize: 10.5, lineHeight: 14 },
  answerMeta: { paddingHorizontal: 16, marginTop: 10, fontSize: 9.2, lineHeight: 13 },
  sources: { marginTop: 12, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth },
  sourcesLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.05, marginBottom: 3 },
  sourceRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 8 },
  sourceTitle: { flex: 1, fontSize: 11.2, lineHeight: 15, fontWeight: '600' }
});