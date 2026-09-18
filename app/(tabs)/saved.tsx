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
import { BrandHeader, EmptyState, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';
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

export default function SavedScreen() {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <BrandHeader />

        <View style={styles.intro}>
          <Text style={[styles.title, { color: theme.text }]}>{filter === 'Documents' ? 'Documents' : 'Saved'}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {filter === 'Documents' ? 'Receipts, tickets and important files.' : 'Your curated memory library.'}
          </Text>
        </View>

        <View style={[styles.search, { backgroundColor: dark ? '#1C1C1EF7' : '#FFFFFFFA', borderColor: dark ? '#FFFFFF12' : '#0000000A', shadowColor: theme.shadow, shadowOpacity: dark ? 0.2 : 0.1 }]}>
          <View style={[styles.searchIconWell, { backgroundColor: dark ? '#2C2C2EF0' : '#F2F2F7' }]}>
            <OneIcon name={icons.search} size={17.5} color={theme.chrome} />
          </View>
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
              <OneIcon name={icons.close} size={13.5} color={theme.textTertiary} />
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
                style={({ pressed }) => [
                  styles.filter,
                  {
                    backgroundColor: active ? (dark ? '#F2F2F7' : '#2F3338') : dark ? '#1C1C1EF2' : '#FFFFFFE8',
                    borderColor: active ? 'transparent' : dark ? '#FFFFFF0D' : '#00000008',
                    shadowColor: theme.shadow,
                    shadowOpacity: active ? (dark ? 0.18 : 0.12) : 0,
                    opacity: pressed ? 0.72 : 1
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? (dark ? '#111114' : '#FFFFFF') : theme.textSecondary }]}>{name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filter === 'Documents' ? (
          <DocumentsView groups={documentGroups} summary={documentSummary} selectedFilter={documentFilter} setSelectedFilter={setDocumentFilter} />
        ) : (
          <View style={styles.block}>
            <SectionHeader title={filter === 'All' ? 'Your memory' : filter} meta={String(savedItems.length)} />
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

  function DocumentsView({ groups, summary, selectedFilter, setSelectedFilter }: {
    groups: Array<{ label: string; items: OneItem[] }>;
    summary: ReturnType<typeof getDocumentSummary>;
    selectedFilter: 'all' | OneDocumentKind;
    setSelectedFilter: (value: 'all' | OneDocumentKind) => void;
  }) {
    const primaryTotal = summary.totals[0];
    return (
      <View style={styles.documents}>
        <View style={[styles.documentSummary, { backgroundColor: dark ? '#1C1C1EF7' : '#FFFFFFFA', borderColor: dark ? '#FFFFFF10' : '#00000008', shadowColor: theme.shadow, shadowOpacity: dark ? 0.18 : 0.09 }]}>
          <Text style={[styles.summaryEyebrow, { color: theme.textTertiary }]}>{summary.monthLabel.toUpperCase()}</Text>
          <View style={styles.summaryTop}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Document memory</Text>
            <View style={[styles.summaryCountBadge, { backgroundColor: dark ? '#2C2C2EF0' : '#F2F2F7' }]}>
              <Text style={[styles.summaryCount, { color: theme.textSecondary }]}>{summary.documents.length}</Text>
            </View>
          </View>
          <View style={[styles.summaryFacts, { borderTopColor: `${theme.text}0D` }]}>
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
                style={({ pressed }) => [
                  styles.filter,
                  {
                    backgroundColor: active ? (dark ? '#F2F2F7' : '#2F3338') : dark ? '#1C1C1EF2' : '#FFFFFFE8',
                    borderColor: active ? 'transparent' : dark ? '#FFFFFF0D' : '#00000008',
                    opacity: pressed ? 0.72 : 1
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? (dark ? '#111114' : '#FFFFFF') : theme.textSecondary }]}>{entry.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {groups.length ? groups.map((group) => (
          <View key={group.label} style={styles.block}>
            <SectionHeader title={group.label} meta={String(group.items.length)} />
            <Surface>{group.items.map((item) => <DocumentRow key={item.id} item={item} />)}</Surface>
          </View>
        )) : (
          <Surface><EmptyState icon={icons.document} title="No matching documents" body="Try another search or document filter." /></Surface>
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
        style={({ pressed }) => [styles.documentRow, { borderBottomColor: `${theme.text}0D`, backgroundColor: pressed ? `${theme.fill}42` : 'transparent' }]}
      >
        <View style={[styles.documentSpine, { backgroundColor: theme.sky }]} />
        <View style={styles.documentContent}>
          <Text style={[styles.documentTitle, { color: theme.text }]} numberOfLines={1}>{item.merchant || item.title}</Text>
          <Text style={[styles.documentMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {[formatKind(item.documentKind), prettyDate(item.date), item.category].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {amount ? <Text style={[styles.documentAmount, { color: theme.text }]}>{amount}</Text> : null}
        <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
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
  intro: { marginTop: -1 },
  title: { fontFamily: editorialFontFamily, fontSize: 36, lineHeight: 40, fontWeight: '400', letterSpacing: -1 },
  subtitle: { marginTop: 7, fontSize: 13, lineHeight: 18.5 },
  search: {
    minHeight: 60,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 9,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 9 },
    elevation: 4
  },
  searchIconWell: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchInput: { flex: 1, minHeight: 48, fontSize: 14.5, lineHeight: 19 },
  clearButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 8, paddingRight: 18 },
  filter: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', shadowRadius: 9, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  filterText: { fontSize: 10.75, fontWeight: '600' },
  block: { gap: 10 },
  documents: { gap: 18 },
  documentSummary: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 22, padding: 18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  summaryEyebrow: { fontSize: 8.25, fontWeight: '700', letterSpacing: 1.05 },
  summaryTop: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryTitle: { fontSize: 15.75, lineHeight: 19.5, fontWeight: '600' },
  summaryCountBadge: { minWidth: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  summaryCount: { fontSize: 10.5, fontWeight: '700' },
  summaryFacts: { marginTop: 15, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12 },
  fact: { minWidth: 62 },
  factWide: { flex: 1, alignItems: 'flex-end' },
  factValue: { fontSize: 13.25, lineHeight: 16.5, fontWeight: '600' },
  factLabel: { marginTop: 3, fontSize: 9.25, lineHeight: 12 },
  documentRow: { minHeight: 72, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  documentSpine: { width: 3, height: 30, borderRadius: 2 },
  documentContent: { flex: 1, minWidth: 0 },
  documentTitle: { fontSize: 14.25, lineHeight: 18, fontWeight: '600', letterSpacing: -0.12 },
  documentMeta: { marginTop: 3, fontSize: 11, lineHeight: 14.5 },
  documentAmount: { fontSize: 12.25, fontWeight: '600' }
});
