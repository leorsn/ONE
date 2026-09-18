import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { OneItemRow } from '@/src/ui/OneItemRow';
import { BrandHeader, EmptyState, NeverSignal, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';
import type { OneDocumentKind, OneItem } from '@/src/types/item';

const filters = ['All', 'Documents', 'Links', 'Ideas', 'Images'] as const;
const documentFilters: Array<{ label: string; value: 'all' | OneDocumentKind }> = [
  { label: 'All', value: 'all' },
  { label: 'Receipts', value: 'receipt' },
  { label: 'Invoices', value: 'invoice' },
  { label: 'Tickets', value: 'ticket' },
  { label: 'Reservations', value: 'reservation' },
  { label: 'Contracts', value: 'contract' }
];

export default function SavedScreen() {
  const theme = useTheme();
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
    if (filter === 'Links') return base.filter((item) => item.type === 'link');
    if (filter === 'Ideas') return base.filter((item) => item.type === 'idea');
    return base.filter((item) => item.kind === 'image' || item.sourceType === 'screenshot' || Boolean(item.imageUrl || item.localAttachmentUri));
  }, [items, filter, query]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <BrandHeader />

        <View style={styles.intro}>
          <Text style={[styles.title, { color: theme.text }]}>{filter === 'Documents' ? 'Documents' : 'Saved'}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {filter === 'Documents' ? 'Receipts, tickets and important files.' : 'Your curated memory library.'}
          </Text>
        </View>

        <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <OneIcon name={icons.search} size={18} color={theme.textTertiary} />
          <View style={[styles.searchDivider, { backgroundColor: theme.border }]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={filter === 'Documents' ? 'Search documents…' : 'Search your saved items…'}
            placeholderTextColor={theme.textTertiary}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} style={styles.clearButton} accessibilityRole="button" accessibilityLabel="Clear search">
              <OneIcon name={icons.close} size={14} color={theme.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((name) => {
            const active = name === filter;
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setFilter(name);
                }}
                style={[
                  styles.filter,
                  {
                    backgroundColor: active ? theme.chrome : theme.fill,
                    borderColor: active ? theme.chrome : theme.border
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? theme.onAccent : theme.textSecondary }]}>{name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filter === 'Documents' ? (
          <DocumentsView groups={documentGroups} summary={documentSummary} selectedFilter={documentFilter} setSelectedFilter={setDocumentFilter} />
        ) : (
          <View style={styles.block}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionLeft}>
                <NeverSignal compact />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{filter === 'All' ? 'Your memory' : filter}</Text>
                <Text style={[styles.sectionMeta, { color: theme.textTertiary }]}>{savedItems.length}</Text>
              </View>
            </View>
            <Surface>
              {savedItems.length
                ? savedItems.map((item) => <OneItemRow key={item.id} item={item} />)
                : <EmptyState icon={icons.saved} title="Nothing here yet" body="Share something to NEVER or save an idea from your inbox." />}
            </Surface>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function DocumentsView({
    groups,
    summary,
    selectedFilter,
    setSelectedFilter
  }: {
    groups: Array<{ label: string; items: OneItem[] }>;
    summary: ReturnType<typeof getDocumentSummary>;
    selectedFilter: 'all' | OneDocumentKind;
    setSelectedFilter: (value: 'all' | OneDocumentKind) => void;
  }) {
    const primaryTotal = summary.totals[0];
    return (
      <View style={styles.documents}>
        <View style={[styles.documentSummary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.summaryEyebrow, { color: theme.textTertiary }]}>{summary.monthLabel.toUpperCase()}</Text>
          <View style={styles.summaryTop}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Document memory</Text>
            <Text style={[styles.summaryCount, { color: theme.textTertiary }]}>{summary.documents.length}</Text>
          </View>
          <View style={[styles.summaryFacts, { borderTopColor: theme.border }]}>
            <Fact label="Receipts" value={String(summary.receipts)} />
            <Fact label="Invoices" value={String(summary.invoices)} />
            <Fact label="Captured value" value={primaryTotal ? formatCurrencyTotal(primaryTotal, 'de-DE') : '—'} wide />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {documentFilters.map((entry) => {
            const active = selectedFilter === entry.value;
            return (
              <Pressable
                key={entry.value}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setSelectedFilter(entry.value);
                }}
                style={[styles.filter, { backgroundColor: active ? theme.chrome : theme.fill, borderColor: active ? theme.chrome : theme.border }]}
              >
                <Text style={[styles.filterText, { color: active ? theme.onAccent : theme.textSecondary }]}>{entry.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {groups.length ? groups.map((group) => (
          <View key={group.label} style={styles.block}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionLeft}>
                <NeverSignal compact />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{group.label}</Text>
                <Text style={[styles.sectionMeta, { color: theme.textTertiary }]}>{group.items.length}</Text>
              </View>
            </View>
            <Surface>
              {group.items.map((item) => <DocumentRow key={item.id} item={item} />)}
            </Surface>
          </View>
        )) : (
          <Surface>
            <EmptyState icon={icons.document} title="No matching documents" body="Try another search or document filter." />
          </Surface>
        )}
      </View>
    );
  }

  function Fact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
    return (
      <View style={[styles.fact, wide && styles.factWide]}>
        <Text style={[styles.factValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
        <Text style={[styles.factLabel, { color: theme.textTertiary }]}>{label}</Text>
      </View>
    );
  }

  function DocumentRow({ item }: { item: OneItem }) {
    const amount = formatItemAmount(item, 'de-DE');
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.merchant || item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.documentRow, { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
      >
        <View style={[styles.documentSpine, { backgroundColor: theme.sky }]} />
        <View style={styles.documentContent}>
          <Text style={[styles.documentTitle, { color: theme.text }]} numberOfLines={1}>{item.merchant || item.title}</Text>
          <Text style={[styles.documentMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {[formatKind(item.documentKind), prettyDate(item.date), item.category].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {amount ? <Text style={[styles.documentAmount, { color: theme.text }]}>{amount}</Text> : null}
        <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
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
  intro: { marginTop: -2 },
  title: { fontFamily: editorialFontFamily, fontSize: 34, lineHeight: 38, fontWeight: '400', letterSpacing: -0.9 },
  subtitle: { marginTop: 6, fontSize: 12.75, lineHeight: 18.5 },
  search: { minHeight: 56, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingLeft: 16, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchDivider: { width: StyleSheet.hairlineWidth, height: 24 },
  searchInput: { flex: 1, minHeight: 48, fontSize: 14.25, lineHeight: 19 },
  clearButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 8, paddingRight: 20 },
  filter: { minHeight: 34, paddingHorizontal: 14, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 11.25, fontWeight: '600' },
  block: { gap: 10 },
  sectionHeading: { minHeight: 28, flexDirection: 'row', alignItems: 'center' },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, lineHeight: 21, fontWeight: '600', letterSpacing: -0.28 },
  sectionMeta: { fontSize: 10.5, fontWeight: '600' },
  documents: { gap: 20 },
  documentSummary: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 18 },
  summaryEyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.1 },
  summaryTop: { marginTop: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryTitle: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  summaryCount: { fontSize: 11, fontWeight: '600' },
  summaryFacts: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12 },
  fact: { minWidth: 64 },
  factWide: { flex: 1, alignItems: 'flex-end' },
  factValue: { fontSize: 13.75, lineHeight: 17, fontWeight: '600' },
  factLabel: { marginTop: 3, fontSize: 9.5, lineHeight: 12.5 },
  documentRow: { minHeight: 74, paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  documentSpine: { width: 3, height: 34, borderRadius: 2 },
  documentContent: { flex: 1, minWidth: 0 },
  documentTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600', letterSpacing: -0.14 },
  documentMeta: { marginTop: 4, fontSize: 11.25, lineHeight: 15 },
  documentAmount: { fontSize: 12.5, fontWeight: '600' }
});