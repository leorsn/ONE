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
import { EmptyState, SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

type SearchMode = 'quick' | 'ask';
type AskAnswer = { title: string; body: string; sourceIds: string[]; meta?: string; mode?: 'ai' | 'deterministic' };

const suggestions = ['Recent', 'Documents', 'Links', 'Ideas'];

export default function SearchV3() {
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
    if (mode === 'ask') { setMode('quick'); setAnswer(null); return; }
    setMode('ask');
  }

  function applySuggestion(suggestion: string, index: number) {
    void Haptics.selectionAsync();
    if (index === 0) setQuery('');
    else setQuery(suggestion);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.searchConsole, { shadowColor: '#000000' }]}>
          <View pointerEvents="none" style={styles.consoleOrb} />
          <View pointerEvents="none" style={styles.consoleChromeLine} />
          <View style={styles.consoleTopRow}>
            <View style={styles.consoleBrandRow}>
              <Text style={styles.consoleWordmark}>NEVER</Text>
              <View style={styles.consoleSignal}><View style={styles.signalLong} /><View style={styles.signalShort} /></View>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={mode === 'ask' ? 'Switch to search' : 'Switch to Ask NEVER'} onPress={toggleMode} style={({ pressed }) => [styles.modeSwitch, { opacity: pressed ? 0.7 : 1 }]}>
              <OneIcon name={mode === 'ask' ? icons.search : icons.ask} size={15} color="#F5F7F9" />
              <Text style={styles.modeSwitchText}>{mode === 'ask' ? 'SEARCH' : 'ASK'}</Text>
            </Pressable>
          </View>

          <Text style={styles.consoleEyebrow}>{mode === 'ask' ? 'GROUNDED INTELLIGENCE' : 'MEMORY RETRIEVAL'}</Text>
          <Text style={styles.consoleTitle}>{mode === 'ask' ? 'Ask your memory.' : 'Find anything.'}</Text>
          <Text style={styles.consoleSubtitle}>{mode === 'ask' ? 'Answers are grounded in what you actually saved.' : 'Documents, links, ideas and moments — instantly.'}</Text>

          <View style={[styles.consoleSearch, { borderColor: query.trim() ? '#FFFFFF4C' : '#FFFFFF22' }]}>
            <View style={styles.consoleSearchIcon}><OneIcon name={mode === 'ask' ? icons.ask : icons.search} size={17} color="#E8EBEE" /></View>
            <TextInput
              value={query}
              onChangeText={(value) => { setQuery(value); if (answer) setAnswer(null); setAskError(null); }}
              placeholder={mode === 'ask' ? 'Ask about your memory…' : 'Search your memory…'}
              placeholderTextColor="#77828C"
              style={styles.consoleInput}
              autoCorrect={false}
              returnKeyType={mode === 'ask' ? 'send' : 'search'}
              onSubmitEditing={mode === 'ask' ? askNever : undefined}
            />
            {query ? <Pressable onPress={() => { setQuery(''); setAnswer(null); setAskError(null); }} style={styles.clear}><OneIcon name={icons.close} size={12} color="#87929C" /></Pressable> : null}
            {mode === 'ask' ? (
              <Pressable disabled={!query.trim()} onPress={askNever} style={({ pressed }) => [styles.sendPuck, { opacity: !query.trim() ? 0.35 : pressed ? 0.7 : 1 }]}>
                <OneIcon name={icons.chevron} size={13} color="#11161B" />
              </Pressable>
            ) : null}
          </View>

          {mode === 'quick' && !query.trim() ? (
            <View style={styles.consoleSegments}>
              {suggestions.map((suggestion, index) => (
                <Pressable key={suggestion} onPress={() => applySuggestion(suggestion, index)} style={({ pressed }) => [styles.consoleSegment, index === 0 && styles.consoleSegmentActive, { opacity: pressed ? 0.65 : 1 }]}>
                  <Text style={[styles.consoleSegmentText, index === 0 && styles.consoleSegmentTextActive]}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {mode === 'quick' ? (
          <>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={[styles.resultsEyebrow, { color: theme.textTertiary }]}>{query.trim() ? 'MATCHED MEMORY' : 'RECENT MEMORY'}</Text>
                <Text style={[styles.resultsTitle, { color: theme.text }]}>{query.trim() ? 'Results' : 'Recently saved'}</Text>
              </View>
              <View style={[styles.countPill, { backgroundColor: theme.platinumSoft, borderColor: theme.glassBorder }]}><Text style={[styles.countText, { color: theme.textSecondary }]}>{results.length} {results.length === 1 ? 'MATCH' : 'MATCHES'}</Text></View>
            </View>

            {results.length ? (
              <View style={styles.resultStack}>
                {results.map(({ item, reasons }, index) => <SearchCard key={item.id} item={item} reason={reasonLabel(reasons)} index={index} />)}
              </View>
            ) : (
              <Surface><EmptyState icon={icons.search} title="Nothing matched" body="Try another wording. NEVER only shows memories with a meaningful match." /></Surface>
            )}

            {query.trim() ? (
              <Pressable onPress={async () => { await Haptics.selectionAsync(); setMode('ask'); setAnswer(null); }} style={({ pressed }) => [styles.askBridge, { backgroundColor: dark ? '#151B20' : '#151A1F', opacity: pressed ? 0.75 : 1 }]}>
                <View style={styles.askBridgeIcon}><OneIcon name={icons.ask} size={15} color="#F4F6F8" /></View>
                <View style={{ flex: 1 }}><Text style={styles.askBridgeTitle}>Ask NEVER about these results</Text><Text style={styles.askBridgeBody} numberOfLines={1}>{query.trim()}</Text></View>
                <View style={styles.askBridgeAction}><OneIcon name={icons.chevron} size={12} color="#11161B" /></View>
              </Pressable>
            ) : null}
          </>
        ) : (
          <View style={styles.askBlock}>
            {!answer && !asking ? (
              <View style={[styles.askIntro, { backgroundColor: dark ? '#151B20' : '#FAFBFC', borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
                <View style={[styles.askHeroIcon, { backgroundColor: dark ? '#262D34' : '#E5E9EC' }]}><OneIcon name={icons.ask} size={22} color={theme.chrome} /></View>
                <Text style={[styles.askIntroTitle, { color: theme.text }]}>Ask from what you know.</Text>
                <Text style={[styles.askIntroBody, { color: theme.textSecondary }]}>NEVER searches your own saved context first. It does not invent a memory that is not there.</Text>
              </View>
            ) : null}
            {asking ? <View style={[styles.answerCard, { backgroundColor: dark ? '#151B20' : '#FAFBFC', borderColor: theme.glassBorder }]}><View style={styles.thinkingRow}><ActivityIndicator size="small" /><Text style={[styles.thinkingText, { color: theme.textSecondary }]}>Looking through your memory…</Text></View></View> : null}
            {askError ? <View style={[styles.errorCard, { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}55` }]}><Text style={[styles.errorText, { color: theme.danger }]}>{askError}</Text></View> : null}
            {answer ? <AnswerCard answer={answer} /> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function SearchCard({ item, reason, index }: { item: OneItem; reason?: string; index: number }) {
    const previewUri = imagePreviewUri(item);
    const tint = typeColor(item, theme);
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.resultCard, { backgroundColor: dark ? '#14191EED' : '#FAFBFC', borderColor: theme.glassBorder, shadowColor: theme.shadow, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.989 : 1 }] }]}>
        <View style={[styles.resultIndex, { backgroundColor: index < 3 ? theme.chrome : theme.platinumSoft }]}><Text style={[styles.resultIndexText, { color: index < 3 ? (dark ? '#0B0E11' : '#FFFFFF') : theme.textSecondary }]}>{String(index + 1).padStart(2, '0')}</Text></View>
        {previewUri ? <Image source={{ uri: previewUri }} style={[styles.previewImage, { backgroundColor: theme.fill }]} resizeMode="cover" /> : <View style={[styles.rowGlyph, { backgroundColor: `${tint}${dark ? '24' : '16'}` }]}><OneIcon name={iconForType(item.type)} size={18} color={tint} /></View>}
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}><Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>{reason ? <View style={[styles.reasonBadge, { backgroundColor: theme.platinumSoft }]}><Text style={[styles.reasonText, { color: theme.textTertiary }]}>{reason}</Text></View> : null}</View>
          <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={1}>{previewFor(item)}</Text>
          <Text style={[styles.meta, { color: theme.textTertiary }]} numberOfLines={1}>{formatCaptured(item.capturedAt || item.createdAt)}</Text>
        </View>
        <View style={[styles.rowArrow, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.chevron} size={11} color={theme.chrome} /></View>
      </Pressable>
    );
  }

  function AnswerCard({ answer: current }: { answer: AskAnswer }) {
    const urls = extractHttpUrls(current.body);
    const body = withoutStandaloneUrlLines(current.body);
    const sources = current.sourceIds.map((id) => itemById.get(id)).filter((item): item is OneItem => Boolean(item)).slice(0, 5);
    return (
      <View style={[styles.answerCard, { backgroundColor: dark ? '#151B20' : '#FAFBFC', borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
        <View style={styles.answerHeader}><View style={[styles.answerBadge, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.ask} size={14} color={theme.chrome} /></View><Text style={[styles.answerMode, { color: theme.textTertiary }]}>{current.mode === 'ai' ? 'SYNTHESIZED' : 'GROUNDED'}</Text></View>
        <Text style={[styles.answerTitle, { color: theme.text }]}>{current.title}</Text>
        {body ? <Text style={[styles.answerBody, { color: theme.textSecondary }]}>{body}</Text> : null}
        {urls.length ? <View style={styles.answerLinks}>{urls.map((url) => <Pressable key={url} accessibilityRole="link" onPress={async () => { await Haptics.selectionAsync(); await Linking.openURL(url); }} style={({ pressed }) => [styles.answerLink, { borderTopColor: theme.border, opacity: pressed ? 0.6 : 1 }]}><View style={[styles.answerLinkIcon, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.link} size={13} color={theme.chrome} /></View><View style={{ flex: 1 }}><Text style={[styles.answerLinkLabel, { color: theme.text }]}>Open link</Text><Text style={[styles.answerLinkUrl, { color: theme.textSecondary }]} numberOfLines={1}>{url}</Text></View><OneIcon name={icons.chevron} size={12} color={theme.textTertiary} /></Pressable>)}</View> : null}
        {current.meta ? <Text style={[styles.answerMeta, { color: theme.textTertiary }]}>{current.meta}</Text> : null}
        {sources.length ? <View style={[styles.sources, { borderTopColor: theme.border }]}><Text style={[styles.sourcesLabel, { color: theme.textTertiary }]}>SOURCES</Text>{sources.map((item) => <Pressable key={item.id} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.sourceRow, { opacity: pressed ? 0.58 : 1 }]}><Text style={[styles.sourceTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text><OneIcon name={icons.chevron} size={12} color={theme.textTertiary} /></Pressable>)}</View> : null}
        <Pressable onPress={() => router.push({ pathname: '/ask', params: { q: query.trim() } })} style={({ pressed }) => [styles.continueButton, { borderTopColor: theme.border, opacity: pressed ? 0.62 : 1 }]}><Text style={[styles.continueText, { color: theme.textSecondary }]}>Continue conversation</Text><OneIcon name={icons.chevron} size={12} color={theme.textTertiary} /></Pressable>
      </View>
    );
  }
}

function imagePreviewUri(item: OneItem) { const candidate = item.localAttachmentUri || item.imageUrl; return candidate && /^(file|content|ph|https?):\/\//i.test(candidate) ? candidate : undefined; }
function typeColor(item: OneItem, theme: ReturnType<typeof useTheme>) { if (item.type === 'document' || item.type === 'link') return theme.chrome; if (item.type === 'idea' || item.type === 'note') return theme.platinum; if (item.type === 'reminder' || item.type === 'task') return theme.warning; return theme.textSecondary; }
function previewFor(item: OneItem) { return item.summary || item.userContext || item.originalText || item.extractedText || item.category || item.url || item.type; }
function formatCaptured(value?: string) { if (!value) return 'Saved memory'; const date = new Date(value); if (Number.isNaN(date.getTime())) return 'Saved memory'; return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date); }
function reasonLabel(reasons?: string[]) { if (!reasons?.length) return undefined; if (reasons.some((reason) => reason.includes('exact'))) return 'Exact'; if (reasons.some((reason) => reason.includes('title'))) return 'Title'; return 'Relevant'; }
function extractHttpUrls(value: string) { const matches = value.match(/https?:\/\/[^\s)\]}>,]+/gi) || []; return Array.from(new Set(matches.map((url) => url.replace(/[.,;:!?]+$/, '')))); }
function withoutStandaloneUrlLines(value: string) { return value.split('\n').filter((line) => !/^\s*https?:\/\/\S+\s*$/.test(line)).join('\n').trim(); }

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 132, gap: 18 },
  searchConsole: { borderRadius: 32, backgroundColor: '#11161B', padding: 22, paddingTop: 19, overflow: 'hidden', shadowOpacity: 0.23, shadowRadius: 30, shadowOffset: { width: 0, height: 15 }, elevation: 8 },
  consoleOrb: { position: 'absolute', width: 270, height: 270, borderRadius: 135, right: -125, top: -145, backgroundColor: '#FFFFFF0A', borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF12' },
  consoleChromeLine: { position: 'absolute', top: 0, left: 36, right: 36, height: 1, backgroundColor: '#FFFFFF72' },
  consoleTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  consoleBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  consoleWordmark: { color: '#F7F8FA', fontSize: 14.5, fontWeight: '800', letterSpacing: 5 },
  consoleSignal: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  signalLong: { width: 19, height: 3, borderRadius: 2, backgroundColor: '#E5E9ED' },
  signalShort: { width: 7, height: 3, borderRadius: 2, backgroundColor: '#7D8893' },
  modeSwitch: { minHeight: 30, paddingHorizontal: 10, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF21', backgroundColor: '#FFFFFF0B', flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeSwitchText: { color: '#9DA7B0', fontSize: 7, fontWeight: '800', letterSpacing: 0.85 },
  consoleEyebrow: { marginTop: 34, color: '#7E8993', fontSize: 8, lineHeight: 11, fontWeight: '800', letterSpacing: 1.65 },
  consoleTitle: { marginTop: 7, color: '#F7F8FA', fontSize: 38, lineHeight: 41, fontWeight: '760', letterSpacing: -1.55 },
  consoleSubtitle: { marginTop: 7, maxWidth: 460, color: '#9AA4AD', fontSize: 12.2, lineHeight: 17.5 },
  consoleSearch: { minHeight: 68, marginTop: 26, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, backgroundColor: '#FFFFFF0A', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  consoleSearchIcon: { width: 42, height: 42, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF20', backgroundColor: '#FFFFFF0B', alignItems: 'center', justifyContent: 'center' },
  consoleInput: { flex: 1, minHeight: 50, color: '#F4F6F8', fontSize: 14.5, lineHeight: 19 },
  clear: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  sendPuck: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E7EBEE', alignItems: 'center', justifyContent: 'center' },
  consoleSegments: { marginTop: 15, flexDirection: 'row', gap: 6 },
  consoleSegment: { flex: 1, minHeight: 34, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF13', alignItems: 'center', justifyContent: 'center' },
  consoleSegmentActive: { backgroundColor: '#E7EBEE', borderColor: '#FFFFFFA8' },
  consoleSegmentText: { color: '#75808A', fontSize: 9.2, fontWeight: '700' },
  consoleSegmentTextActive: { color: '#151A1F' },
  resultsHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, paddingHorizontal: 2 },
  resultsEyebrow: { fontSize: 8, lineHeight: 11, fontWeight: '800', letterSpacing: 1.55 },
  resultsTitle: { marginTop: 5, fontSize: 23, lineHeight: 27, fontWeight: '750', letterSpacing: -0.65 },
  countPill: { minHeight: 25, paddingHorizontal: 9, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.75 },
  resultStack: { gap: 9 },
  resultCard: { minHeight: 92, borderRadius: 23, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  resultIndex: { width: 27, height: 27, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  resultIndexText: { fontSize: 7.5, fontWeight: '800', letterSpacing: 0.35 },
  rowGlyph: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: 50, height: 50, borderRadius: 16 },
  rowText: { flex: 1, minWidth: 0 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowTitle: { flex: 1, fontSize: 14.2, lineHeight: 18, fontWeight: '750', letterSpacing: -0.18 },
  reasonBadge: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9 },
  reasonText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.35 },
  preview: { marginTop: 4, fontSize: 10.8, lineHeight: 14 },
  meta: { marginTop: 4, fontSize: 9.2, lineHeight: 12, fontWeight: '650' },
  rowArrow: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  askBridge: { minHeight: 72, borderRadius: 23, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  askBridgeIcon: { width: 40, height: 40, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF22', backgroundColor: '#FFFFFF0A', alignItems: 'center', justifyContent: 'center' },
  askBridgeTitle: { color: '#F5F7F8', fontSize: 12.5, fontWeight: '750' },
  askBridgeBody: { marginTop: 3, color: '#89939C', fontSize: 9.5 },
  askBridgeAction: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E7EBEE', alignItems: 'center', justifyContent: 'center' },
  askBlock: { gap: 12 },
  askIntro: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 26, padding: 21, shadowOpacity: 0.09, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  askHeroIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  askIntroTitle: { marginTop: 17, fontSize: 21, lineHeight: 25, fontWeight: '760', letterSpacing: -0.5 },
  askIntroBody: { marginTop: 7, maxWidth: 430, fontSize: 12, lineHeight: 17.5 },
  answerCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 26, overflow: 'hidden', paddingTop: 18, shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 9 }, elevation: 3 },
  thinkingRow: { paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 9 },
  thinkingText: { fontSize: 11.5, lineHeight: 15.5 },
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
  answerLinkLabel: { fontSize: 11.75, fontWeight: '650' },
  answerLinkUrl: { marginTop: 2, fontSize: 10, lineHeight: 13 },
  answerMeta: { paddingHorizontal: 18, marginTop: 11, fontSize: 9.25, lineHeight: 13 },
  sources: { marginTop: 13, paddingTop: 11, paddingHorizontal: 18, borderTopWidth: StyleSheet.hairlineWidth },
  sourcesLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 1.15, marginBottom: 4 },
  sourceRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceTitle: { flex: 1, fontSize: 11.25, fontWeight: '650' },
  continueButton: { marginTop: 12, minHeight: 48, paddingHorizontal: 18, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  continueText: { fontSize: 11.25, fontWeight: '650' }
});
