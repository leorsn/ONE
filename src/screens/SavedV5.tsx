import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { iconForType } from '@/src/ui/OneItemRow';
import {
  V5Chevron,
  V5Group,
  V5LargeHeader,
  V5SearchField,
  V5SectionHeader,
  V5Segmented,
  V5Wordmark,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import type { OneDocumentKind, OneItem } from '@/src/types/item';

const filters = ['All', 'Documents', 'Images', 'Links', 'Ideas'] as const;
const documentFilters: Array<{ label: string; value: 'all' | OneDocumentKind }> = [
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

    if (filter === 'All') return base;
    if (filter === 'Documents') return [];
    if (filter === 'Images') return base.filter((item) => item.kind === 'image' || item.sourceType === 'screenshot' || Boolean(item.imageUrl || item.localAttachmentUri));
    if (filter === 'Links') return base.filter((item) => item.type === 'link');
    return base.filter((item) => item.type === 'idea');
  }, [items, filter, query]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBar}><V5Wordmark /></View>
        <V5LargeHeader
          title={filter === 'Documents' ? 'Documents' : 'Saved'}
          subtitle="Everything NEVER has kept for you."
        />

        <V5SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={filter === 'Documents' ? 'Search documents' : 'Search saved items'}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>
          {filters.map((name) => {
            const active = name === filter;
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={async () => { await Haptics.selectionAsync(); setFilter(name); }}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: active ? p.graphite : p.surface,
                    opacity: pressed ? 0.62 : 1
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? (p.dark ? '#111113' : '#FFFFFF') : p.secondary }]}>{name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

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
            <V5Group>
              {savedItems.length ? savedItems.map((item, index) => (
                <MemoryRow key={item.id} item={item} last={index === savedItems.length - 1} />
              )) : (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.saved} size={19} color={p.chrome} /></View>
                  <Text style={[styles.emptyTitle, { color: p.label }]}>Nothing here yet</Text>
                  <Text style={[styles.emptyBody, { color: p.secondary }]}>Capture or save something and it will appear here.</Text>
                </View>
              )}
            </V5Group>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function MemoryRow({ item, last }: { item: OneItem; last: boolean }) {
    const preview = imagePreviewUri(item);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.memoryRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
      >
        <View style={[styles.memoryThumb, { backgroundColor: p.fillSoft }]}>
          {preview ? <Image source={{ uri: preview }} style={styles.memoryImage} resizeMode="cover" /> : <OneIcon name={iconForType(item.type)} size={19} color={p.chrome} />}
        </View>
        <View style={[styles.memoryContent, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.memoryTitle, { color: p.label }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.memoryMeta, { color: p.secondary }]} numberOfLines={1}>{tileMeta(item)}</Text>
          </View>
          <Text style={[styles.memoryDate, { color: p.tertiary }]}>{prettyCaptured(item.updatedAt)}</Text>
          <V5Chevron />
        </View>
      </Pressable>
    );
  }

  function DocumentsView({ groups, summary, selectedFilter, setSelectedFilter }: {
    groups: Array<{ label: string; items: OneItem[] }>;
    summary: ReturnType<typeof getDocumentSummary>;
    selectedFilter: 'all' | OneDocumentKind;
    setSelectedFilter: (value: 'all' | OneDocumentKind) => void;
  }) {
    const primaryTotal = summary.totals[0];
    return (
      <View style={styles.documents}>
        <V5Group>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryMonth, { color: p.secondary }]}>{summary.monthLabel}</Text>
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
                style={({ pressed }) => [styles.documentFilter, { backgroundColor: active ? p.graphite : p.surface, opacity: pressed ? 0.64 : 1 }]}
              >
                <Text style={[styles.documentFilterText, { color: active ? (p.dark ? '#111113' : '#FFFFFF') : p.secondary }]}>{entry.label}</Text>
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
              <View style={[styles.emptyIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.document} size={19} color={p.chrome} /></View>
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
        <View style={[styles.documentIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.document} size={16} color={p.chrome} /></View>
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

function imagePreviewUri(item: OneItem) {
  const candidate = item.localAttachmentUri || item.imageUrl;
  return candidate && /^(file|content|ph|https?):\/\//i.test(candidate) ? candidate : undefined;
}
function tileMeta(item: OneItem) { return [item.category, item.userContext, item.merchant, item.location].filter(Boolean).join(' · ') || (item.saved ? 'Saved memory' : item.type); }
function prettyCaptured(value?: string) {
  if (!value) return 'Memory';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Memory';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
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
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 118, gap: 20 },
  brandBar: { minHeight: 32, justifyContent: 'center' },
  filterRail: { gap: 8, paddingRight: 8 },
  filterChip: { minHeight: 34, paddingHorizontal: 14, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 13, lineHeight: 16, fontWeight: '500' },
  section: { gap: 8 },
  memoryRow: { minHeight: 72, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  memoryThumb: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  memoryImage: { width: '100%', height: '100%' },
  memoryContent: { flex: 1, minHeight: 72, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  memoryTitle: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  memoryMeta: { marginTop: 2, fontSize: 13, lineHeight: 17 },
  memoryDate: { fontSize: 12, lineHeight: 15 },
  emptyState: { minHeight: 180, padding: 24, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 12, fontSize: 17, lineHeight: 21, fontWeight: '600' },
  emptyBody: { marginTop: 4, maxWidth: 260, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  documents: { gap: 18 },
  summaryHeader: { minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryMonth: { fontSize: 15, lineHeight: 19, fontWeight: '600' },
  summaryCount: { fontSize: 12, lineHeight: 15 },
  summaryFacts: { minHeight: 80, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  fact: { flex: 1, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  factValue: { fontSize: 17, lineHeight: 21, fontWeight: '600' },
  factLabel: { marginTop: 3, fontSize: 11, lineHeight: 14 },
  documentFilters: { gap: 8, paddingRight: 8 },
  documentFilter: { minHeight: 34, paddingHorizontal: 13, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  documentFilterText: { fontSize: 12.5, lineHeight: 16, fontWeight: '500' },
  documentRow: { minHeight: 68, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  documentIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  documentContent: { flex: 1, minHeight: 68, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  documentTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  documentMeta: { marginTop: 2, fontSize: 12.5, lineHeight: 16 },
  documentAmount: { fontSize: 13, lineHeight: 17, fontWeight: '500' }
});