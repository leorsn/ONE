import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { usePlan } from '@/src/context/PlanContext';
import { answerFromRetrievedItems } from '@/src/recall/service';
import { retrieveLocalOneItems, retrieveOneItems } from '@/src/search/retrieve';
import { searchSemantically } from '@/src/search/semantic';
import { matchesMemoryCategory } from '@/src/ui/memoryPresentation';
import { MemoryRow } from '@/src/ui/MemoryRow';
import { NeverBackdrop, NeverEyebrow, NeverHeroSurface, NeverMetric } from '@/src/ui/neverVisual';
import { neverSpacing, neverType } from '@/src/theme/tokens';
import { NeverChromeButton } from '@/src/ui/never';
import { iconForType } from '@/src/ui/OneItemRow';
import { OneIcon, icons } from '@/src/ui/icons';
import {
  V5Chevron,
  V5Group,
  V5SearchField,
  V5SectionHeader,
  V5Segmented,
  V5Row,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import type { OneItem } from '@/src/types/item';

type SearchMode = 'quick' | 'ask';
type AskAnswer = { title: string; body: string; sourceIds: string[]; meta?: string; mode?: 'ai' | 'deterministic' };
type SearchCategory = 'All' | 'Documents' | 'Links' | 'Ideas';

const categories: SearchCategory[] = ['All', 'Documents', 'Links', 'Ideas'];

export default function SearchV5() {
  const p = useNeverV5Palette();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { session } = useAuth();
  const { items } = useItems();
  const { hasAi } = usePlan();
  const [mode, setMode] = useState<SearchMode>('quick');
  const [query, setQuery] = useState(typeof q === 'string' ? q : '');
  const [category, setCategory] = useState<SearchCategory>('All');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const requestVersion = useRef(0);
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  useEffect(() => { if (typeof q === 'string' && q.trim()) setQuery(q); }, [q]);

  const results = useMemo(() => {
    const filtered = items.filter((item) => matchesMemoryCategory(item, category));
    return retrieveLocalOneItems(query, filtered, { limit: 18, recentWhenEmpty: true });
  }, [query, items, category]);

  const counts = useMemo(() => ({
    Documents: items.filter((item) => matchesMemoryCategory(item, 'Documents')).length,
    Links: items.filter((item) => matchesMemoryCategory(item, 'Links')).length,
    Ideas: items.filter((item) => matchesMemoryCategory(item, 'Ideas')).length
  }), [items]);

  function rememberSearch(value = query) {
    const clean = value.trim();
    if (clean) setRecentSearches((current) => [clean, ...current.filter((entry) => entry !== clean)].slice(0, 5));
  }

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  async function askNeverFor(value: string) {
    const clean = value.trim();
    if (!clean || asking) return;
    if (!hasAi) { router.push('/upgrade'); return; }
    void Haptics.selectionAsync().catch(() => undefined);
    const version = ++requestVersion.current;
    rememberSearch(clean);
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
      if (version !== requestVersion.current) return;
      setAnswer({
        title: response.title,
        body: response.body,
        sourceIds: response.sourceIds,
        meta: [response.meta, retrieval.semanticError ? 'Semantic search unavailable' : undefined].filter(Boolean).join(' · '),
        mode: response.mode
      });
    } catch {
      if (version === requestVersion.current) setAskError('NEVER could not answer that right now. Your saved memories are unchanged.');
    } finally {
      if (version === requestVersion.current) setAsking(false);
    }
  }

  function askNever() {
    return askNeverFor(query);
  }

  async function setSearchMode(next: SearchMode) {
    if (next === mode) return;
    void Haptics.selectionAsync().catch(() => undefined);
    requestVersion.current += 1;
    setAsking(false);
    setAskError(null);
    setAnswer(null);
    setMode(next);
  }

  function updateQuery(value: string) {
    requestVersion.current += 1;
    setAsking(false);
    setQuery(value);
    setAnswer(null);
    setAskError(null);
  }

  const discovery = mode === 'quick' && !query.trim() && category === 'All';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <NeverBackdrop />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCopy}>
          <NeverEyebrow>{mode === 'ask' ? 'Grounded recall' : 'Memory index'}</NeverEyebrow>
          <Text accessibilityRole="header" style={[styles.heroTitle, { color: p.label }]}>
            {mode === 'ask' ? 'Ask NEVER.' : 'Search.'}
          </Text>
          <Text style={[styles.heroSubtitle, { color: p.secondary }]}>
            {mode === 'ask' ? 'Ask a question. NEVER answers from what you saved.' : 'Find anything you captured, even when you only remember part of it.'}
          </Text>
        </View>

        <NeverHeroSurface style={styles.searchStage}>
          <View style={styles.modeRow}>
            <View style={[styles.modeSwitch, { backgroundColor: p.dark ? '#FFFFFF0A' : '#FFFFFF66', borderColor: p.glassBorder }]}>
              <ModeButton label="Search" active={mode === 'quick'} onPress={() => void setSearchMode('quick')} />
              <ModeButton label="Ask" active={mode === 'ask'} onPress={() => void setSearchMode('ask')} />
            </View>
            <NeverMetric value={`${items.length}`} label="memories" />
          </View>

          <V5SearchField
            value={query}
            onChangeText={updateQuery}
            placeholder={mode === 'ask' ? 'Ask about your memory…' : 'Search your memory…'}
            ask={mode === 'ask'}
            onSubmit={mode === 'ask' ? askNever : () => rememberSearch()}
          />

          {mode === 'quick' ? (
            <V5Segmented
              options={categories}
              selected={category}
              onSelect={(value) => setCategory(value as SearchCategory)}
            />
          ) : (
            <View style={styles.askPromise}>
              <View style={[styles.askPromiseIcon, { backgroundColor: p.fillSoft }]}>
                <OneIcon name={icons.shield} size={15} color={p.chrome} />
              </View>
              <Text style={[styles.askPromiseText, { color: p.secondary }]}>Grounded in your saved evidence first.</Text>
            </View>
          )}
        </NeverHeroSurface>

        {mode === 'quick' ? (
          <>
            {discovery ? (
              <>
                <View style={styles.section}>
                  <V5SectionHeader title="Explore memory" />
                  <View style={styles.categoryGrid}>
                    <CategoryTile icon={icons.document} label="Documents" count={counts.Documents} copy="Scans & files" onPress={() => setCategory('Documents')} />
                    <CategoryTile icon={icons.link} label="Links" count={counts.Links} copy="Places to return" onPress={() => setCategory('Links')} />
                    <CategoryTile icon={icons.idea} label="Ideas" count={counts.Ideas} copy="Notes & thoughts" onPress={() => setCategory('Ideas')} />
                  </View>
                </View>

                {recentSearches.length ? (
                  <View style={styles.section}>
                    <V5SectionHeader title="Recent searches" action={<Pressable accessibilityRole="button" onPress={() => setRecentSearches([])} hitSlop={12}><Text style={{ color: p.chrome }}>Clear</Text></Pressable>} />
                    <V5Group>{recentSearches.map((entry, index) => <V5Row key={entry} icon={icons.clock} title={entry} onPress={() => updateQuery(entry)} last={index === recentSearches.length - 1} />)}</V5Group>
                  </View>
                ) : null}

                <View style={styles.section}>
                  <V5SectionHeader title="Recently captured" meta={`${results.length}`} />
                  {results.length ? (
                    <View style={styles.memoryGrid}>
                      {results.slice(0, 6).map(({ item }) => <MemoryTile key={item.id} item={item} />)}
                    </View>
                  ) : (
                    <V5Group><EmptyResults /></V5Group>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.section}>
                <V5SectionHeader
                  title={query.trim() ? 'Results' : category}
                  meta={`${results.length}`}
                />
                <V5Group>
                  {results.length ? results.map(({ item, reasons }, index) => (
                    <MemoryRow
                      key={item.id}
                      item={item}
                      reason={query.trim() ? reasonLabel(reasons) : undefined}
                      onPress={() => { rememberSearch(); router.push({ pathname: '/item/[id]', params: { id: item.id } }); }}
                      last={index === results.length - 1}
                    />
                  )) : <EmptyResults />}
                </V5Group>
              </View>
            )}

            {query.trim() ? (
              <NeverHeroSurface compact style={styles.askBridgeSurface}>
                <Pressable
                  onPress={() => void setSearchMode('ask')}
                  style={({ pressed }) => [styles.askBridge, { opacity: pressed ? 0.65 : 1 }]}
                >
                  <View style={[styles.askBridgeIcon, { backgroundColor: p.graphite }]}>
                    <OneIcon name={icons.ask} size={14} color={p.onAccent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.askBridgeTitle, { color: p.label }]}>Ask NEVER about “{query.trim()}”</Text>
                    <Text style={[styles.askBridgeSubtitle, { color: p.secondary }]}>Turn matching memories into an answer</Text>
                  </View>
                  <V5Chevron />
                </Pressable>
              </NeverHeroSurface>
            ) : null}
          </>
        ) : (
          <View style={styles.askSection}>
            <NeverChromeButton label={asking ? 'Searching your memory…' : 'Ask NEVER'} icon={icons.ask} onPress={askNever} disabled={asking || !query.trim()} />

            {!answer && !asking && !askError ? (
              <View style={styles.promptGrid}>
                <PromptTile text="What did I save today?" icon={icons.clock} />
                <PromptTile text="Find the link I saved" icon={icons.link} />
                <PromptTile text="What was that appointment?" icon={icons.calendar} />
                <PromptTile text="Show my recent ideas" icon={icons.idea} />
              </View>
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

  function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={onPress}
        style={({ pressed }) => [styles.modeButton, { backgroundColor: active ? p.graphite : 'transparent', opacity: pressed ? 0.62 : 1 }]}
      >
        <Text style={[styles.modeButtonText, { color: active ? p.onAccent : p.secondary, fontWeight: active ? '600' : '500' }]}>{label}</Text>
      </Pressable>
    );
  }

  function CategoryTile({ icon, label, count, copy, onPress }: { icon: (typeof icons)[keyof typeof icons]; label: SearchCategory; count: number; copy: string; onPress: () => void }) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.categoryTile, { backgroundColor: p.surface, borderColor: p.border, opacity: pressed ? 0.66 : 1 }]}
      >
        <View style={styles.categoryTop}>
          <View style={[styles.categoryIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icon} size={18} color={p.chrome} /></View>
          <Text style={[styles.categoryCount, { color: p.tertiary }]}>{count}</Text>
        </View>
        <Text style={[styles.categoryTitle, { color: p.label }]}>{label}</Text>
        <Text style={[styles.categoryCopy, { color: p.secondary }]} numberOfLines={2}>{copy}</Text>
      </Pressable>
    );
  }

  function MemoryTile({ item }: { item: OneItem }) {
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.memoryTile, { backgroundColor: p.surface, borderColor: p.border, opacity: pressed ? 0.66 : 1 }]}
      >
        <View style={styles.memoryTileTop}>
          <View style={[styles.memoryTileIcon, { backgroundColor: p.fillSoft }]}>
            <OneIcon name={iconForType(item.type)} size={17} color={p.chrome} />
          </View>
          <V5Chevron />
        </View>
        <Text style={[styles.memoryTileTitle, { color: p.label }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.memoryTileMeta, { color: p.secondary }]} numberOfLines={1}>{item.category || item.type}</Text>
      </Pressable>
    );
  }

  function EmptyResults() {
    return (
      <View style={styles.emptyState}>
        <View style={[styles.emptyIcon, { backgroundColor: p.fillSoft }]}>
          <OneIcon name={icons.search} size={18} color={p.chrome} />
        </View>
        <Text style={[styles.emptyTitle, { color: p.label }]}>{query.trim() || category !== 'All' ? 'No matching memories' : 'Your memory is ready'}</Text>
        <Text style={[styles.emptyBody, { color: p.secondary }]}>{query.trim() ? 'Try a name, a phrase or another category.' : 'Capture a note, document or link to find it here.'}</Text>
      </View>
    );
  }

  function PromptTile({ text, icon }: { text: string; icon: (typeof icons)[keyof typeof icons] }) {
    return (
      <Pressable
        onPress={() => { updateQuery(text); void askNeverFor(text); }}
        style={({ pressed }) => [styles.promptTile, { backgroundColor: p.surface, borderColor: p.border, opacity: pressed ? 0.66 : 1 }]}
      >
        <View style={[styles.promptIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icon} size={15} color={p.chrome} /></View>
        <Text style={[styles.promptText, { color: p.label }]}>{text}</Text>
      </Pressable>
    );
  }

  function AnswerPanel({ answer: current }: { answer: AskAnswer }) {
    const urls = extractHttpUrls(current.body);
    const body = withoutStandaloneUrlLines(current.body);
    const sources = current.sourceIds.map((id) => itemById.get(id)).filter((item): item is OneItem => Boolean(item)).slice(0, 5);
    return (
      <View style={styles.answerStack}>
        <NeverHeroSurface compact>
          <View style={styles.answerBodyWrap}>
            <View style={styles.answerHeader}>
              <View style={[styles.answerMark, { backgroundColor: p.graphite }]}>
                <OneIcon name={icons.ask} size={13} color={p.onAccent} />
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
        </NeverHeroSurface>

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
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 126, gap: 26 },
  heroCopy: { gap: 5 },
  heroTitle: { fontSize: 43, lineHeight: 47, fontFamily: neverType.hero.fontFamily, fontWeight: '400', letterSpacing: -1.35 },
  heroSubtitle: { maxWidth: 430, fontSize: 14.5, lineHeight: 20 },
  searchStage: { padding: 17, gap: 14 },
  modeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  modeSwitch: { padding: 3, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  modeButton: { minWidth: 68, minHeight: 34, paddingHorizontal: 13, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeButtonText: { fontSize: 11.5, lineHeight: 15 },
  askPromise: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 9 },
  askPromiseIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  askPromiseText: { flex: 1, fontSize: 11.5, lineHeight: 16 },
  section: { gap: neverSpacing.md },
  categoryGrid: { flexDirection: 'row', gap: 9 },
  categoryTile: { flex: 1, minHeight: 142, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  categoryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryCount: { fontSize: 11.5, lineHeight: 15, fontWeight: '600' },
  categoryTitle: { marginTop: 16, fontSize: 14, lineHeight: 18, fontWeight: '600', letterSpacing: -0.15 },
  categoryCopy: { marginTop: 2, fontSize: 10.5, lineHeight: 14 },
  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  memoryTile: { width: '48.6%', minHeight: 132, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  memoryTileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  memoryTileIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  memoryTileTitle: { marginTop: 13, fontSize: 14.5, lineHeight: 18, fontWeight: '600', letterSpacing: -0.16 },
  memoryTileMeta: { marginTop: 4, fontSize: 10.5, lineHeight: 14, textTransform: 'capitalize' },
  emptyState: { minHeight: 156, padding: 22, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 16.5, lineHeight: 20, fontWeight: '600' },
  emptyBody: { marginTop: 4, maxWidth: 250, fontSize: 12.5, lineHeight: 17, textAlign: 'center' },
  askBridgeSurface: { minHeight: 70 },
  askBridge: { minHeight: 70, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  askBridgeIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  askBridgeTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  askBridgeSubtitle: { marginTop: 2, fontSize: 11.5, lineHeight: 15 },
  askSection: { gap: 12 },
  promptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  promptTile: { width: '48.6%', minHeight: 104, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, padding: 13, justifyContent: 'space-between' },
  promptIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  promptText: { marginTop: 12, fontSize: 13, lineHeight: 17, fontWeight: '600' },
  loadingRow: { minHeight: 62, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13.5, lineHeight: 17 },
  errorBox: { borderRadius: 16, padding: 14 },
  errorText: { fontSize: 12.5, lineHeight: 17 },
  answerStack: { gap: 14 },
  answerBodyWrap: { padding: 16 },
  answerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  answerMark: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  answerMode: { fontSize: 9.5, lineHeight: 12, fontWeight: '700', letterSpacing: 0.65 },
  answerTitle: { marginTop: 13, fontSize: 20, lineHeight: 24, fontWeight: '700', letterSpacing: -0.35 },
  answerText: { marginTop: 7, fontSize: 14.5, lineHeight: 20 },
  answerMeta: { marginTop: 10, fontSize: 10.5, lineHeight: 14 },
  answerLink: { minHeight: 48, paddingHorizontal: 15, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 9 },
  answerLinkText: { flex: 1, fontSize: 12.5, lineHeight: 16 },
  sourceRow: { minHeight: 54, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sourceContent: { flex: 1, minHeight: 54, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceTitle: { flex: 1, fontSize: 14.5, lineHeight: 18, fontWeight: '500' }
});