import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { neverSpacing } from '@/src/theme/tokens';
import {
  V5Chevron,
  V5Group,
  V5LargeHeader,
  V5SearchField,
  V5Segmented,
  V5IconButton,
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

  const documentSummary = useMemo(() => getDocumentSummary(items), [items]);
  const documents = useMemo(() => filterDocuments(items, documentFilter, query), [items, documentFilter, query]);
  const documentGroups = useMemo(() => groupDocumentsByMonth(documents), [documents]);

  const savedItems = useMemo(() => {
    const clean = query.trim().toLowerCase();
    const base = items
      .filter((item) => item.saved || ['link', 'idea', 'shopping', 'travel', 'document'].includes(item.type))
      .filter((item) => {
        if (!clean) return true;
        return [item.title, item.category, item.userContext, item.url, item.extractedText, item.merchant]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(clean));
      });

    base.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    if (filter === 'All') return base;
    if (filter === 'Documents') return [];
    if (filter === 'Images') return base.filter((item) => item.kind === 'image' || item.sourceType === 'screenshot' || Boolean(item.imageUrl) || Boolean(item.localAttachmentMimeType?.startsWith('image/')));
    if (filter === 'Links') return base.filter((item) => item.type === 'link' || Boolean(item.url));
    return base.filter((item) => item.type === 'idea' || item.type === 'note');
  }, [items, filter, query]);

  const groups = useMemo(() => {
    const grouped = new Map<string, OneItem[]>();
    for (const item of savedItems) {
      const label = item.category?.trim() || 'Unfiled';
      grouped.set(label, [...(grouped.get(label) || []), item]);
    }
    return [...grouped].map(([label, entries]) => ({ label, items: entries }));
  }, [savedItems]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive">
        <V5LargeHeader
          title={filter === 'Documents' ? 'Documents' : 'Saved'}
          subtitle="Your curated memory library."
          action={<V5IconButton icon={icons.plus} accessibilityLabel="Capture a memory" onPress={() => router.push('/(tabs)')} />}
        />

        <V5SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={filter === 'Documents' ? 'Search documents' : 'Search saved items'}
        />

        <V5Segmented options={[...filters]} selected={filter} onSelect={(value) => setFilter(value as typeof filter)} />

        {filter === 'Documents' ? (
          <DocumentsView
            groups={documentGroups}
            summary={documentSummary}
            selectedFilter={documentFilter}
            setSelectedFilter={setDocumentFilter}
          />
        ) : (
          <View style={styles.section}>
            <V5SectionHeader title={filter === 'All' ? 'Memories' : filter} meta={`${savedItems.length}`} />
            {savedItems.length ? groups.map((group) => (
              <View key={group.label} style={styles.section}>
                <Text style={[styles.collectionLabel, { color: p.secondary }]}>{group.label} · {group.items.length}</Text>
                <V5Group>{group.items.map((item, index) => <MemoryRow key={item.id} item={item} last={index === group.items.length - 1} />)}</V5Group>
              </View>
            )) : (
              <V5Group><View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.saved} size={22} color={p.chrome} /></View>
                <Text style={[styles.emptyTitle, { color: p.label }]}>{query.trim() ? 'No matching memories' : 'A place for what matters'}</Text>
                <Text style={[styles.emptyBody, { color: p.secondary }]}>{query.trim() ? 'Try another phrase or filter.' : 'Save a capture and build your personal library.'}</Text>
              </View></V5Group>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function DocumentsView({ groups, summary, selectedFilter, setSelectedFilter }: {
    groups: { label: string; items: OneItem[] }[];
    summary: ReturnType<typeof getDocumentSummary>;
    selectedFilter: 'all' | OneDocumentKind;
    setSelectedFilter: (value: 'all' | OneDocumentKind) => void;
  }) {
    const primaryTotal = summary.totals[0];
    return (
      <View style={styles.documents}>
        <V5Group>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryMonth, { color: p.label }]}>{summary.monthLabel}</Text>
            <Text style={[styles.summaryCount, { color: p.tertiary }]}>{summary.documents.length} documents</Text>
          </View>
          <View style={[styles.summaryFacts, { borderTopColor: p.separator }]}>
            <Fact label="Receipts" value={String(summary.receipts)} />
            <Fact label="Invoices" value={String(summary.invoices)} />
            <Fact label="Value" value={primaryTotal ? formatCurrencyTotal(primaryTotal, 'de-DE') : '—'} />
          </View>
        </V5Group>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.documentFilters}>
          {documentFilters.map((entry) => {
            const active = selectedFilter === entry.value;
            return (
              <Pressable
                key={entry.value}
                onPress={async () => { await Haptics.selectionAsync(); setSelectedFilter(entry.value); }}
                style={({ pressed }) => [styles.documentFilter, { backgroundColor: active ? p.fill : 'transparent', opacity: pressed ? 0.64 : 1 }]}
              >
                <Text style={[styles.documentFilterText, { color: active ? p.label : p.secondary, fontWeight: active ? '600' : '500' }]}>{entry.label}</Text>
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
              <View style={[styles.emptyIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.document} size={18} color={p.chrome} /></View>
              <Text style={[styles.emptyTitle, { color: p.label }]}>No matching documents</Text>
              <Text style={[styles.emptyBody, { color: p.secondary }]}>Try another search or document filter.</Text>
            </View>
          </V5Group>
        )}
      </View>
    );
  }

  function Fact({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.fact}>
        <Text style={[styles.factValue, { color: p.label }]} numberOfLines={1}>{value}</Text>
        <Text style={[styles.factLabel, { color: p.tertiary }]}>{label}</Text>
      </View>
    );
  }

  function DocumentRow({ item, last }: { item: OneItem; last: boolean }) {
    const amount = formatItemAmount(item, 'de-DE');
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.documentRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
      >
        <View style={[styles.documentIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.document} size={15} color={p.chrome} /></View>
        <View style={[styles.documentContent, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.documentTitle, { color: p.label }]} numberOfLines={1}>{item.merchant || item.title}</Text>
            <Text style={[styles.documentMeta, { color: p.secondary }]} numberOfLines={1}>{[formatKind(item.documentKind), prettyDate(item.date), item.category].filter(Boolean).join(' · ')}</Text>
          </View>
          {amount ? <Text style={[styles.documentAmount, { color: p.secondary }]}>{amount}</Text> : null}
          <V5Chevron />
        </View>
      </Pressable>
    );
  }
}


function formatKind(kind?: OneDocumentKind) {
  if (!kind || kind === 'other') return 'Document';
  return kind.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
function prettyDate(iso?: string) {
  if (!iso) return undefined;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${iso}T12:00:00`));
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 118, gap: neverSpacing.xxl },
  section: { gap: neverSpacing.md },
  emptyState: { minHeight: 150, padding: 22, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 10, fontSize: 16, lineHeight: 20, fontWeight: '600' },
  emptyBody: { marginTop: 3, maxWidth: 250, fontSize: 12.5, lineHeight: 17, textAlign: 'center' },
  collectionLabel: { fontSize: 12, lineHeight: 17, fontWeight: '600', paddingHorizontal: 4, marginTop: 8 },
  documents: { gap: 15 },
  summaryHeader: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryMonth: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  summaryCount: { fontSize: 11.5, lineHeight: 14 },
  summaryFacts: { minHeight: 70, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  fact: { flex: 1, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  factValue: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  factLabel: { marginTop: 2, fontSize: 10.5, lineHeight: 13 },
  documentFilters: { gap: 5, paddingRight: 6 },
  documentFilter: { minHeight: 44, paddingHorizontal: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  documentFilterText: { fontSize: 12, lineHeight: 15 },
  documentRow: { minHeight: 62, paddingLeft: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  documentIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  documentContent: { flex: 1, minHeight: 62, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  documentTitle: { fontSize: 15, lineHeight: 18, fontWeight: '600' },
  documentMeta: { marginTop: 1, fontSize: 12, lineHeight: 15 },
  documentAmount: { fontSize: 12.5, lineHeight: 16, fontWeight: '500' }
});