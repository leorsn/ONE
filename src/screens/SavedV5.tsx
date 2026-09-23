import { useLocalDay } from '@/src/ui/useLocalDay';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { useItems } from '@/src/context/ItemsContext';
import {
  filterDocuments,
  formatCurrencyTotal,
  formatItemAmount,
  getDocumentSummary,
  groupDocumentsByMonth
} from '@/src/documents/analytics';
import { OneIcon, icons } from '@/src/ui/icons';
import { MemoryRow } from '@/src/ui/MemoryRow';
import { NeverEyebrow, NeverHeroSurface, NeverMetric } from '@/src/ui/neverVisual';
import { neverSpacing, neverType } from '@/src/theme/tokens';
import {
  V5Group,
  V5SearchField,
  V5Segmented,
  V5SectionHeader,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import type { OneDocumentKind, OneItem } from '@/src/types/item';

const filters = ['All', 'Documents', 'Images', 'Links', 'Ideas'] as const;
const documentFilters: { label: string; value: 'all' | OneDocumentKind }[] = [
  { label: 'All', value: 'all' },
  { label: 'Receipts', value: 'receipt' },
  { label: 'Invoices', value: 'invoice' },
  { label: 'Tickets', value: 'ticket' },
  { label: 'Reservations', value: 'reservation' },
  { label: 'Contracts', value: 'contract' }
];

export default function SavedV5() {
  const p = useNeverV5Palette();
  const { items } = useItems();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [documentFilter, setDocumentFilter] = useState<'all' | OneDocumentKind>('all');
  const [query, setQuery] = useState('');

  const today = useLocalDay();
  const documentSummary = useMemo(() => getDocumentSummary(items, new Date(`${today}T12:00:00`)), [items, today]);
  const documents = useMemo(() => filterDocuments(items, documentFilter, query), [items, documentFilter, query]);
  const documentGroups = useMemo(() => groupDocumentsByMonth(documents), [documents]);

  const libraryItems = useMemo(() => items
    .filter((item) => item.saved || ['link', 'idea', 'shopping', 'travel', 'document'].includes(item.type))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [items]);

  const counts = useMemo(() => ({
    Documents: libraryItems.filter((item) => item.type === 'document' || item.documentKind).length,
    Images: libraryItems.filter((item) => item.kind === 'image' || item.sourceType === 'screenshot' || Boolean(item.imageUrl) || Boolean(item.localAttachmentMimeType?.startsWith('image/'))).length,
    Links: libraryItems.filter((item) => item.type === 'link' || Boolean(item.url)).length,
    Ideas: libraryItems.filter((item) => item.type === 'idea' || item.type === 'note').length
  }), [libraryItems]);

  const savedItems = useMemo(() => {
    const clean = query.trim().toLowerCase();
    const base = libraryItems.filter((item) => {
      if (!clean) return true;
      return [item.title, item.category, item.userContext, item.url, item.extractedText, item.merchant]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(clean));
    });

    if (filter === 'All') return base;
    if (filter === 'Documents') return [];
    if (filter === 'Images') return base.filter((item) => item.kind === 'image' || item.sourceType === 'screenshot' || Boolean(item.imageUrl) || Boolean(item.localAttachmentMimeType?.startsWith('image/')));
    if (filter === 'Links') return base.filter((item) => item.type === 'link' || Boolean(item.url));
    return base.filter((item) => item.type === 'idea' || item.type === 'note');
  }, [libraryItems, filter, query]);

  const groups = useMemo(() => {
    const grouped = new Map<string, OneItem[]>();
    for (const item of savedItems) {
      const label = item.category?.trim() || 'Unfiled';
      const entries = grouped.get(label);
      if (entries) entries.push(item);
      else grouped.set(label, [item]);
    }
    return [...grouped].map(([label, entries]) => ({ label, items: entries }));
  }, [savedItems]);

  return (
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.content, p.pageStyle]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive">
        <View style={styles.heroCopy}>
          <NeverEyebrow>Curated memory</NeverEyebrow>
          <Text accessibilityRole="header" style={[styles.heroTitle, p.heading, { color: p.label }]}>{filter === 'Documents' ? 'Documents.' : 'Saved.'}</Text>
          <Text style={[styles.heroSubtitle, { color: p.secondary }]}>Everything worth keeping, organized without feeling like a file manager.</Text>
        </View>

        <NeverHeroSurface style={styles.libraryStage}>
          <View style={styles.libraryTop}>
            <View style={styles.libraryMetrics}>
              <NeverMetric value={`${libraryItems.length}`} label="saved" />
              <NeverMetric value={`${counts.Documents}`} label="documents" />
              <NeverMetric value={`${counts.Links}`} label="links" />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Capture a memory"
              onPress={() => router.push('/(tabs)')}
              style={({ pressed }) => [styles.captureButton, { borderRadius: p.radius.button, backgroundColor: p.graphite, opacity: pressed ? 0.64 : 1 }]}
            >
              <OneIcon name={icons.plus} size={18} color={p.onAccent} />
            </Pressable>
          </View>

          <V5SearchField
            value={query}
            onChangeText={setQuery}
            placeholder={filter === 'Documents' ? 'Search documents' : 'Search saved memory'}
          />

          <V5Segmented options={[...filters]} selected={filter} onSelect={(value) => setFilter(value as typeof filter)} />
        </NeverHeroSurface>

        {filter === 'Documents' ? (
          <DocumentsView
            groups={documentGroups}
            summary={documentSummary}
            selectedFilter={documentFilter}
            setSelectedFilter={setDocumentFilter}
          />
        ) : (
          <>
            {filter === 'All' && !query.trim() ? (
              <View style={styles.section}>
                <V5SectionHeader title="Library map" />
                <View style={styles.libraryGrid}>
                  <LibraryTile label="Documents" count={counts.Documents} icon={icons.document} onPress={() => setFilter('Documents')} />
                  <LibraryTile label="Images" count={counts.Images} icon={icons.screenshot} onPress={() => setFilter('Images')} />
                  <LibraryTile label="Links" count={counts.Links} icon={icons.link} onPress={() => setFilter('Links')} />
                  <LibraryTile label="Ideas" count={counts.Ideas} icon={icons.idea} onPress={() => setFilter('Ideas')} />
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <V5SectionHeader title={filter === 'All' ? 'Collections' : filter} meta={`${savedItems.length}`} />
              {savedItems.length ? groups.map((group) => (
                <View key={group.label} style={styles.collectionBlock}>
                  <View style={styles.collectionHeader}>
                    <View>
                      <Text style={[styles.collectionLabel, { color: p.label }]}>{group.label}</Text>
                      <Text style={[styles.collectionCount, { color: p.tertiary }]}>{group.items.length} {group.items.length === 1 ? 'memory' : 'memories'}</Text>
                    </View>
                    <View style={[styles.collectionMark, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft }]}><OneIcon name={icons.saved} size={14} color={p.chrome} /></View>
                  </View>
                  <V5Group>{group.items.map((item, index) => <MemoryRow key={item.id} item={item} last={index === group.items.length - 1} />)}</V5Group>
                </View>
              )) : (
                <V5Group><View style={styles.emptyState}>
                  <View style={[styles.emptyIcon, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft }]}><OneIcon name={icons.saved} size={22} color={p.chrome} /></View>
                  <Text style={[styles.emptyTitle, { color: p.label }]}>{query.trim() ? 'No matching memories' : 'A place for what matters'}</Text>
                  <Text style={[styles.emptyBody, { color: p.secondary }]}>{query.trim() ? 'Try another phrase or filter.' : 'Save a capture and build your personal library.'}</Text>
                </View></V5Group>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </NeverScreen>
  );

}

function formatKind(kind?: OneDocumentKind) {
  if (!kind || kind === 'other') return 'Document';
  return kind.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
function prettyDate(iso?: string) {
  if (!iso || !Number.isFinite(new Date(`${iso}T12:00:00`).getTime())) return undefined;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${iso}T12:00:00`));
}

function LibraryTile({ label, count, icon, onPress }: { label: string; count: number; icon: (typeof icons)[keyof typeof icons]; onPress: () => void }) {
  const p = useNeverV5Palette();
  return (
    <Pressable accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.libraryTile, p.cardStyle, pressed ? { backgroundColor: p.fillSoft, borderColor: p.chrome } : null]}
    >
      <View style={styles.libraryTileTop}>
        <View style={[styles.libraryTileIcon, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft }]}><OneIcon name={icon} size={18} color={p.chrome} /></View>
        <Text style={[styles.libraryTileCount, { color: p.tertiary }]}>{count}</Text>
      </View>
      <Text style={[styles.libraryTileTitle, { color: p.label }]}>{label}</Text>
      <Text style={[styles.libraryTileCopy, { color: p.secondary }]}>Open collection</Text>
    </Pressable>
  );
}

function DocumentsView({ groups, summary, selectedFilter, setSelectedFilter }: {
  groups: { label: string; items: OneItem[] }[];
  summary: ReturnType<typeof getDocumentSummary>;
  selectedFilter: 'all' | OneDocumentKind;
  setSelectedFilter: (value: 'all' | OneDocumentKind) => void;
}) {
  const p = useNeverV5Palette();
  const primaryTotal = summary.totals[0];
  return (
    <View style={styles.documents}>
      <NeverHeroSurface compact style={styles.documentSummary}>
        <View style={styles.summaryHeader}>
          <View>
            <NeverEyebrow>Document intelligence</NeverEyebrow>
            <Text style={[styles.summaryMonth, { color: p.label }]}>{summary.monthLabel}</Text>
          </View>
          <Text style={[styles.summaryCount, { color: p.tertiary }]}>{summary.documents.length} documents</Text>
        </View>
        <View style={[styles.summaryFacts, { borderTopColor: p.separator }]}>
          <Fact label="Receipts" value={String(summary.receipts)} />
          <Fact label="Invoices" value={String(summary.invoices)} />
          <Fact label="Value" value={primaryTotal ? formatCurrencyTotal(primaryTotal, 'de-DE') : '—'} />
        </View>
      </NeverHeroSurface>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.documentFilters}>
        {documentFilters.map((entry) => {
          const active = selectedFilter === entry.value;
          return (
            <Pressable accessibilityRole="button"
              key={entry.value}
              onPress={async () => { void Haptics.selectionAsync().catch(() => undefined); setSelectedFilter(entry.value); }}
              style={({ pressed }) => [styles.documentFilter, {
                borderRadius: p.radius.chip,
                backgroundColor: active ? p.graphite : pressed ? p.fill : p.fillSoft,
                borderColor: pressed ? p.chrome : active ? p.graphite : p.border
              }]}
            >
              <Text style={[styles.documentFilterText, { color: active ? p.onAccent : p.secondary, fontWeight: active ? '600' : '500' }]}>{entry.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {groups.length ? groups.map((group) => (
        <View key={group.label} style={styles.section}>
          <V5SectionHeader title={group.label} meta={`${group.items.length}`} />
          <V5Group>
            {group.items.map((item, index) => <DocumentRow key={item.id} item={item} last={index === group.items.length - 1} />)}
          </V5Group>
        </View>
      )) : (
        <V5Group>
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft }]}><OneIcon name={icons.document} size={18} color={p.chrome} /></View>
            <Text style={[styles.emptyTitle, { color: p.label }]}>No matching documents</Text>
            <Text style={[styles.emptyBody, { color: p.secondary }]}>Try another search or document filter.</Text>
          </View>
        </V5Group>
      )}
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const p = useNeverV5Palette();
  return (
    <View style={styles.fact}>
      <Text style={[styles.factValue, { color: p.label }]} >{value}</Text>
      <Text style={[styles.factLabel, { color: p.tertiary }]}>{label}</Text>
    </View>
  );
}

function DocumentRow({ item, last }: { item: OneItem; last: boolean }) {
  const subtitle = [item.merchant, formatKind(item.documentKind), prettyDate(item.date), formatItemAmount(item, 'de-DE')].filter(Boolean).join(' · ');
  return <MemoryRow item={item} subtitle={subtitle} last={last} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 126, gap: 26 },
  heroCopy: { gap: 5 },
  heroTitle: { fontSize: 43, lineHeight: 47, fontFamily: neverType.hero.fontFamily, fontWeight: '400', letterSpacing: -1.35 },
  heroSubtitle: { maxWidth: 430, fontSize: 14.5, lineHeight: 20 },
  libraryStage: { padding: 17, gap: 14 },
  libraryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  libraryMetrics: { flex: 1, flexDirection: 'row', gap: 14 },
  captureButton: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  section: { gap: neverSpacing.md },
  libraryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  libraryTile: { flexBasis: '47%', flexGrow: 1, minWidth: 130, minHeight: 124, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  libraryTileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  libraryTileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  libraryTileCount: { fontSize: 11.5, lineHeight: 15, fontWeight: '600' },
  libraryTileTitle: { marginTop: 14, fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  libraryTileCopy: { marginTop: 2, fontSize: 10.5, lineHeight: 14 },
  collectionBlock: { gap: 8, marginTop: 4 },
  collectionHeader: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  collectionLabel: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  collectionCount: { marginTop: 1, fontSize: 10.5, lineHeight: 14 },
  collectionMark: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyState: { minHeight: 150, padding: 22, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 16, lineHeight: 20, fontWeight: '600' },
  emptyBody: { marginTop: 3, maxWidth: 250, fontSize: 12.5, lineHeight: 17, textAlign: 'center' },
  documents: { gap: 15 },
  documentSummary: { overflow: 'hidden' },
  summaryHeader: { minHeight: 74, flexWrap: 'wrap', gap: 8, paddingVertical: 12, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryMonth: { marginTop: 3, fontSize: 17, lineHeight: 21, fontWeight: '600' },
  summaryCount: { fontSize: 11.5, lineHeight: 14 },
  summaryFacts: { minHeight: 76, flexWrap: 'wrap', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  fact: { flex: 1, minWidth: 110, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  factValue: { fontSize: 17, lineHeight: 21, fontWeight: '600' },
  factLabel: { marginTop: 2, fontSize: 10.5, lineHeight: 13 },
  documentFilters: { gap: 7, paddingRight: 6 },
  documentFilter: { minHeight: 44, paddingHorizontal: 13, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  documentFilterText: { fontSize: 11.5, lineHeight: 15 },
});