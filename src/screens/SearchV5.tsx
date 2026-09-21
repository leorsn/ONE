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
import { neverSpacing } from '@/src/theme/tokens';
import { NeverChromeButton } from '@/src/ui/never';
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

  function rememberSearch(value = query) {
    const clean = value.trim();
    if (clean) setRecentSearches((current) => [clean, ...current.filter((entry) => entry !== clean)].slice(0, 5));
  }

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  async function askNever() {
    const clean = query.trim();
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

  async function toggleMode() {
    void Haptics.selectionAsync().catch(() => undefined);
    requestVersion.current += 1;
    setAsking(false);
    setAskError(null);
    setAnswer(null);
    setMode((current) => current === 'quick' ? 'ask' : 'quick');
  }

  function updateQuery(value: string) {
    requestVersion.current += 1;
    setAsking(false);
    setQuery(value);
    setAnswer(null);
    setAskError(null);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive" showsVerticalScrollIndicator={false}>
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
          placeholder={mode === 'ask' ? 'Ask about your memory…' : 'Search your memory…'}
          ask={mode === 'ask'}
          onSubmit={mode === 'ask' ? askNever : () => rememberSearch()}
        />

        {mode === 'quick' ? (
          <>
              <V5Segmented
                options={categories}
                selected={category}
                onSelect={(value) => setCategory(value as SearchCategory)}
              />

            {!query.trim() && category === 'All' ? (
              <View style={styles.section}>
                <V5SectionHeader title="Explore your memory" />
                <V5Group>
                  <V5Row icon={icons.document} title="Documents" subtitle="Receipts, contracts and scanned pages" onPress={() => setCategory('Documents')} />
                  <V5Row icon={icons.link} title="Links" subtitle="Places you wanted to return to" onPress={() => setCategory('Links')} />
                  <V5Row icon={icons.note} title="Notes & ideas" subtitle="Thoughts worth keeping" onPress={() => setCategory('Ideas')} last />
                </V5Group>
              </View>
            ) : null}
            {!query.trim() && recentSearches.length ? (
              <View style={styles.section}>
                <V5SectionHeader title="Recent searches" action={<Pressable accessibilityRole="button" onPress={() => setRecentSearches([])} hitSlop={12}><Text style={{ color: p.chrome }}>Clear</Text></Pressable>} />
                <V5Group>{recentSearches.map((entry, index) => <V5Row key={entry} icon={icons.clock} title={entry} onPress={() => updateQuery(entry)} last={index === recentSearches.length - 1} />)}</V5Group>
              </View>
            ) : null}

            <View style={styles.section}>
              <V5SectionHeader
                title={query.trim() ? 'Results' : category === 'All' ? 'Recently captured' : category}
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
                )) : (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: p.fillSoft }]}>
                      <OneIcon name={icons.search} size={18} color={p.chrome} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: p.label }]}>{query.trim() || category !== 'All' ? 'No matching memories' : 'Your memory is ready'}</Text>
                    <Text style={[styles.emptyBody, { color: p.secondary }]}>{query.trim() ? 'Try a name, a phrase or another category.' : 'Capture a note, document or link to find it here.'}</Text>
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
                  <OneIcon name={icons.ask} size={14} color={p.onAccent} />
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
            <NeverChromeButton label={asking ? 'Searching your memory…' : 'Ask NEVER'} icon={icons.ask} onPress={askNever} disabled={asking || !query.trim()} />
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
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 118, gap: neverSpacing.xxl },
  section: { gap: neverSpacing.md },
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