import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { OneIcon, icons } from '@/src/ui/icons';
import {
  V5Chevron,
  V5Group,
  V5IconButton,
  V5LargeHeader,
  V5SearchField,
  V5SectionHeader,
  V5Segmented,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import type { OneItem } from '@/src/types/item';

type SearchMode = 'quick' | 'ask';
type AskAnswer = { title: string; body: string; sourceIds: string[]; meta?: string; mode?: 'ai' | 'deterministic' };
type SearchCategory = 'Recent' | 'Documents' | 'Links' | 'Ideas';

const categories: SearchCategory[] = ['Recent', 'Documents', 'Links', 'Ideas'];

export default function SearchV5() {
  const p = useNeverV5Palette();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { session } = useAuth();
  const { items } = useItems();
  const { hasAi } = usePlan();
  const [mode, setMode] = useState<SearchMode>('quick');
  const [query, setQuery] = useState(typeof q === 'string' ? q : '');
  const [category, setCategory] = useState<SearchCategory>('Recent');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  useEffect(() => { if (typeof q === 'string' && q.trim()) setQuery(q); }, [q]);

  const retrieved = useMemo(
    () => retrieveLocalOneItems(query, items, { limit: 30, recentWhenEmpty: true }),
    [query, items]
  );

  const categoryItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return sorted.filter((item) => {
      if (category === 'Documents') return item.type === 'document';
      if (category === 'Links') return item.type === 'link' || Boolean(item.url);
      if (category === 'Ideas') return item.type === 'idea' || item.type === 'note';
      return true;
    }).slice(0, 18).map((item) => ({ item, reasons: [] as string[] }));
  }, [items, category]);

  const results = useMemo(() => {
    if (query.trim()) return retrieved.slice(0, 18);
    if (category === 'Recent') return retrieved.slice(0, 18);
    return categoryItems;
  }, [retrieved, categoryItems, category, query]);

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  async function askNever() {
    const clean = query.trim();
    if (!clean || asking) return;
    if (!hasAi) { router.push('/upgrade'); return; }
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
    setAnswer(null);
    setMode((current) => current === 'quick' ? 'ask' : 'quick');
  }

  function updateQuery(value: string) {
    setQuery(value);
    setAnswer(null);
    setAskError(null);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <V5LargeHeader
          title={mode === 'ask' ? 'Ask NEVER' : 'Search'}
          subtitle={mode === 'ask' ? 'Ask a question using only what you have saved.' : 'Find anything in your memory.'}
          action={(
            <V5IconButton
              icon={mode === 'ask' ? icons.search : icons.ask}
              accessibilityLabel={mode === 'ask' ? 'Switch to search' : 'Ask NEVER'}
              onPress={toggleMode}
            />
          )}
        />

        <V5SearchField
          value={query}
          onChangeText={updateQuery}
          placeholder={mode === 'ask' ? 'Ask about your memory' : 'Search'}
          ask={mode === 'ask'}
          onSubmit={mode === 'ask' ? askNever : undefined}
        />

        {mode === 'quick' ? (
          <>
            {!query.trim() ? (
              <V5Segmented
                options={categories}
                selected={category}
                onSelect={(value) => setCategory(value as SearchCategory)}
              />
            ) : null}

            <View style={styles.section}>
              <V5SectionHeader
                title={query.trim() ? 'Results' : category === 'Recent' ? 'Recent' : category}
                meta={`${results.length}`}
              />
              <V5Group>
                {results.length ? results.map(({ item, reasons }, index) => (
                  <SearchRow
                    key={item.id}
                    item={item}
                    reason={reasonLabel(reasons)}
                    last={index === results.length - 1}
                  />
                )) : (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: p.fillSoft }]}>
                      <OneIcon name={icons.search} size={18} color={p.chrome} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: p.label }]}>Nothing found</Text>
                    <Text style={[styles.emptyBody, { color: p.secondary }]}>Try another search or choose a different category.</Text>
                  </View>
                )}
              </V5Group>
            </View>

            {query.trim() ? (
              <Pressable
                onPress={async () => { await Haptics.selectionAsync(); setMode('ask'); setAnswer(null); }}
                style={({ pressed }) => [styles.askBridge, { backgroundColor: p.surface, opacity: pressed ? 0.65 : 1 }]}
              >
                <View style={[styles.askBridgeIcon, { backgroundColor: p.graphite }]}>
                  <OneIcon name={icons.ask} size={14} color={p.dark ? '#111113' : '#FFFFFF'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.askBridgeTitle, { color: p.label }]}>Ask NEVER about “{query.trim()}”</Text>
                  <Text style={[styles.askBridgeSubtitle, { color: p.secondary }]}>Answer from your saved information</Text>
                </View>
                <V5Chevron />
              </Pressable>
            ) : null}
          </>
        ) : (
          <View style={styles.askSection}>
            {!answer && !asking && !askError ? (
              <V5Group>
                <View style={styles.groundedRow}>
                  <View style={[styles.groundedIcon, { backgroundColor: p.fillSoft }]}>
                    <OneIcon name={icons.shield} size={17} color={p.chrome} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.groundedTitle, { color: p.label }]}>Grounded in your memory</Text>
                    <Text style={[styles.groundedBody, { color: p.secondary }]}>NEVER searches what you saved first and says when the evidence is not enough.</Text>
                  </View>
                </View>
              </V5Group>
            ) : null}

            {asking ? (
              <V5Group>
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={p.chrome} />
                  <Text style={[styles.loadingText, { color: p.secondary }]}>Looking through your memory…</Text>
                </View>
              </V5Group>
            ) : null}

            {askError ? (
              <View style={[styles.errorBox, { backgroundColor: p.surface }]}>
                <Text style={[styles.errorText, { color: p.danger }]}>{askError}</Text>
              </View>
            ) : null}

            {answer ? <AnswerPanel answer={answer} /> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function SearchRow({ item, reason, last }: { item: OneItem; reason?: string; last: boolean }) {
    const previewUri = imagePreviewUri(item);
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.resultRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
      >
        <View style={[styles.previewWrap, { backgroundColor: p.fillSoft }]}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <OneIcon name={iconForType(item.type)} size={17} color={p.chrome} />
          )}
        </View>
        <View style={[styles.resultContent, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.resultTitle, { color: p.label }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.resultSubtitle, { color: p.secondary }]} numberOfLines={1}>{previewFor(item)}</Text>
          </View>
          <View style={styles.resultAccessory}>
            {reason ? <Text style={[styles.reason, { color: p.tertiary }]}>{reason}</Text> : null}
            <Text style={[styles.resultDate, { color: p.tertiary }]}>{formatCaptured(item.capturedAt || item.createdAt)}</Text>
          </View>
          <V5Chevron />
        </View>
      </Pressable>
    );
  }

  function AnswerPanel({ answer: current }: { answer: AskAnswer }) {
    const urls = extractHttpUrls(current.body);
    const body = withoutStandaloneUrlLines(current.body);
    const sources = current.sourceIds.map((id) => itemById.get(id)).filter((item): item is OneItem => Boolean(item)).slice(0, 5);
    return (
      <View style={styles.answerStack}>
        <V5Group>
          <View style={styles.answerBodyWrap}>
            <View style={styles.answerHeader}>
              <View style={[styles.answerMark, { backgroundColor: p.graphite }]}>
                <OneIcon name={icons.ask} size={13} color={p.dark ? '#111113' : '#FFFFFF'} />
              </View>
              <Text style={[styles.answerMode, { color: p.tertiary }]}>{current.mode === 'ai' ? 'SYNTHESIZED' : 'GROUNDED'}</Text>
            </View>
            <Text style={[styles.answerTitle, { color: p.label }]}>{current.title}</Text>
            {body ? <Text style={[styles.answerText, { color: p.secondary }]}>{body}</Text> : null}
            {current.meta ? <Text style={[styles.answerMeta, { color: p.tertiary }]}>{current.meta}</Text> : null}
          </View>
          {urls.map((url) => (
            <Pressable
              key={url}
              onPress={async () => { await Haptics.selectionAsync(); await Linking.openURL(url); }}
              style={({ pressed }) => [styles.answerLink, { borderTopColor: p.separator, backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
            >
              <OneIcon name={icons.link} size={14} color={p.chrome} />
              <Text style={[styles.answerLinkText, { color: p.label }]} numberOfLines={1}>{url}</Text>
              <V5Chevron />
            </Pressable>
          ))}
        </V5Group>

        {sources.length ? (
          <View style={styles.section}>
            <V5SectionHeader title="Sources" meta={`${sources.length}`} />
            <V5Group>
              {sources.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                  style={({ pressed }) => [styles.sourceRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
                >
                  <View style={[styles.sourceIcon, { backgroundColor: p.fillSoft }]}>
                    <OneIcon name={iconForType(item.type)} size={15} color={p.chrome} />
                  </View>
                  <View style={[styles.sourceContent, index !== sources.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                    <Text style={[styles.sourceTitle, { color: p.label }]} numberOfLines={1}>{item.title}</Text>
                    <V5Chevron />
                  </View>
                </Pressable>
              ))}
            </V5Group>
          </View>
        ) : null}
      </View>
    );
  }
}

function imagePreviewUri(item: OneItem) {
  const candidate = item.localAttachmentUri || item.imageUrl;
  return candidate && /^(file|content|ph|https?):\/\//i.test(candidate) ? candidate : undefined;
}
function previewFor(item: OneItem) { return item.summary || item.userContext || item.originalText || item.extractedText || item.category || item.url || item.type; }
function formatCaptured(value?: string) {
  if (!value) return 'Saved';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved';
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
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 108, gap: 18 },
  section: { gap: 7 },
  resultRow: { minHeight: 68, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewWrap: { width: 44, height: 44, borderRadius: 11, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  previewImage: { width: '100%', height: '100%' },
  resultContent: { flex: 1, minHeight: 68, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  resultTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.12 },
  resultSubtitle: { marginTop: 2, fontSize: 12.5, lineHeight: 16 },
  resultAccessory: { alignItems: 'flex-end', gap: 1 },
  reason: { fontSize: 10.5, lineHeight: 13, fontWeight: '500' },
  resultDate: { fontSize: 10.5, lineHeight: 13 },
  emptyState: { minHeight: 156, padding: 22, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 16.5, lineHeight: 20, fontWeight: '600' },
  emptyBody: { marginTop: 4, maxWidth: 250, fontSize: 12.5, lineHeight: 17, textAlign: 'center' },
  askBridge: { minHeight: 62, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  askBridgeIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  askBridgeTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  askBridgeSubtitle: { marginTop: 2, fontSize: 11.5, lineHeight: 15 },
  askSection: { gap: 10 },
  groundedRow: { minHeight: 82, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  groundedIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  groundedTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  groundedBody: { marginTop: 3, fontSize: 12.5, lineHeight: 17 },
  loadingRow: { minHeight: 62, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13.5, lineHeight: 17 },
  errorBox: { borderRadius: 16, padding: 14 },
  errorText: { fontSize: 12.5, lineHeight: 17 },
  answerStack: { gap: 14 },
  answerBodyWrap: { padding: 15 },
  answerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  answerMark: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  answerMode: { fontSize: 9.5, lineHeight: 12, fontWeight: '700', letterSpacing: 0.65 },
  answerTitle: { marginTop: 12, fontSize: 19, lineHeight: 23, fontWeight: '700', letterSpacing: -0.3 },
  answerText: { marginTop: 6, fontSize: 14.5, lineHeight: 20 },
  answerMeta: { marginTop: 9, fontSize: 10.5, lineHeight: 14 },
  answerLink: { minHeight: 48, paddingHorizontal: 15, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 9 },
  answerLinkText: { flex: 1, fontSize: 12.5, lineHeight: 16 },
  sourceRow: { minHeight: 54, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sourceContent: { flex: 1, minHeight: 54, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceTitle: { flex: 1, fontSize: 14.5, lineHeight: 18, fontWeight: '500' }
});