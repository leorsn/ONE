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
import { EmptyState, IconTile, PageHeader, RoundIconButton, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneDocumentKind, OneItem } from '@/src/types/item';

const filters = ['All', 'Documents', 'Links', 'Ideas', 'Shopping', 'Travel'] as const;
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

  const savedItems = useMemo(() => {
    const clean = query.trim().toLowerCase();
    const base = items
      .filter((item) => item.saved || ['link', 'idea', 'shopping', 'travel', 'document'].includes(item.type))
      .filter((item) => {
        if (!clean) return true;
        return [
          item.title,
          item.category,
          item.userContext,
          item.url,
          item.extractedText,
          item.merchant,
          item.currency,
          item.documentKind,
          item.amount !== undefined ? String(item.amount) : undefined
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(clean));
      });

    if (filter === 'All') return base;
    if (filter === 'Documents') return [];
    if (filter === 'Links') return base.filter((item) => item.type === 'link');
    if (filter === 'Ideas') return base.filter((item) => item.type === 'idea');
    if (filter === 'Shopping') return base.filter((item) => item.type === 'shopping' || item.category === 'Gift idea');
    return base.filter((item) => item.type === 'travel');
  }, [items, filter, query]);

  const documents = useMemo(
    () => filterDocuments(items, documentFilter, query),
    [items, documentFilter, query]
  );

  const documentGroups = useMemo(() => groupDocumentsByMonth(documents), [documents]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={uiStyles.screenContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageHeader
          eyebrow="MEMORY"
          title={filter === 'Documents' ? 'Documents' : 'Saved'}
          subtitle={filter === 'Documents'
            ? 'Receipts, tickets and important files — organized around what they mean.'
            : 'The information you chose to keep, ready when you need it.'}
          action={filter === 'Documents'
            ? <RoundIconButton icon={icons.scan} onPress={() => router.push('/scan')} accessibilityLabel="Scan a document" />
            : undefined}
        />

        <View style={[styles.search, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <OneIcon name={icons.search} size={17} color={theme.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={filter === 'Documents' ? 'Search documents' : 'Search your memory'}
            placeholderTextColor={theme.textTertiary}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
            accessibilityLabel={filter === 'Documents' ? 'Search documents' : 'Search saved memories'}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clearButton}>
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
                    backgroundColor: active ? theme.surfaceElevated : theme.fill,
                    borderColor: active ? theme.fillStrong : theme.border,
                    shadowColor: theme.shadow
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? theme.text : theme.textSecondary }]}>{name}</Text>
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
        <View style={[styles.documentMemory, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <View style={styles.memoryTopline}>
            <View style={styles.memoryIdentity}>
              <IconTile icon={icons.document} tone="neutral" size={40} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.memoryEyebrow, { color: theme.textTertiary }]}>{summary.monthLabel.toUpperCase()}</Text>
                <Text style={[styles.memoryTitle, { color: theme.text }]}>Document memory</Text>
              </View>
            </View>
            <Text style={[styles.documentCount, { color: theme.textTertiary }]}>{summary.documents.length}</Text>
          </View>

          <View style={[styles.memoryFacts, { borderTopColor: theme.border }]}>
            <CompactFact label="Receipts" value={String(summary.receipts)} />
            <CompactFact label="Invoices" value={String(summary.invoices)} />
            <CompactFact
              label="Captured value"
              value={primaryTotal ? formatCurrencyTotal(primaryTotal, 'de-DE') : '—'}
              wide
            />
          </View>

          {summary.totals.length > 1 ? (
            <Text style={[styles.multiCurrency, { color: theme.textTertiary }]}>
              Other currencies: {summary.totals.slice(1).map((total) => formatCurrencyTotal(total, 'de-DE')).join(' · ')}
            </Text>
          ) : null}

          {(summary.largest || summary.topMerchant) ? (
            <View style={[styles.insightStrip, { borderTopColor: theme.border }]}>
              {summary.largest ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open largest document ${summary.largest.title}`}
                  onPress={() => router.push({ pathname: '/item/[id]', params: { id: summary.largest!.id } })}
                  style={({ pressed }) => [styles.insightLine, { opacity: pressed ? 0.58 : 1 }]}
                >
                  <Text style={[styles.insightLabel, { color: theme.textTertiary }]}>LARGEST</Text>
                  <Text style={[styles.insightValue, { color: theme.text }]} numberOfLines={1}>
                    {formatItemAmount(summary.largest, 'de-DE') || '—'} · {summary.largest.merchant || summary.largest.title}
                  </Text>
                  <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
                </Pressable>
              ) : null}
              {summary.topMerchant ? (
                <View style={styles.insightLine}>
                  <Text style={[styles.insightLabel, { color: theme.textTertiary }]}>FREQUENT</Text>
                  <Text style={[styles.insightValue, { color: theme.text }]} numberOfLines={1}>
                    {summary.topMerchant.name} · {summary.topMerchant.count} {summary.topMerchant.count === 1 ? 'document' : 'documents'}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.documentActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/scan')}
            style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.accent, borderColor: theme.accent, opacity: pressed ? 0.74 : 1 }]}
          >
            <OneIcon name={icons.scan} size={16} color={theme.onAccent} />
            <Text style={[styles.actionButtonText, { color: theme.onAccent }]}>Scan</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/ask', params: { q: 'How much did I spend this month?' } })}
            style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.ask} size={16} color={theme.text} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Ask NEVER</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {documentFilters.map((entry) => {
            const active = selectedFilter === entry.value;
            return (
              <Pressable
                key={entry.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setSelectedFilter(entry.value);
                }}
                style={[
                  styles.documentFilter,
                  {
                    backgroundColor: active ? theme.surfaceElevated : theme.fill,
                    borderColor: active ? theme.fillStrong : theme.border,
                    shadowColor: theme.shadow
                  }
                ]}
              >
                <Text style={[styles.documentFilterText, { color: active ? theme.text : theme.textSecondary }]}>{entry.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {groups.length ? groups.map((group) => (
          <View key={group.label} style={styles.block}>
            <SectionHeader title={group.label} meta={String(group.items.length)} />
            <Surface>
              {group.items.map((item) => <DocumentRow key={item.id} item={item} />)}
            </Surface>
          </View>
        )) : (
          <Surface>
            <EmptyState
              icon={icons.document}
              title="No matching documents"
              body={query ? 'Try another search or document filter.' : 'Scan a receipt, invoice or ticket to start your document memory.'}
            />
          </Surface>
        )}
      </View>
    );
  }

  function CompactFact({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
    return (
      <View style={[styles.fact, wide && styles.factWide]}>
        <Text style={[styles.factValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
        <Text style={[styles.factLabel, { color: theme.textTertiary }]}>{label}</Text>
      </View>
    );
  }

  function DocumentRow({ item }: { item: OneItem }) {
    const amount = formatItemAmount(item, 'de-DE');
    const kind = formatKind(item.documentKind);

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.merchant || item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.documentRow, { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
      >
        <IconTile icon={iconForDocument(item.documentKind)} tone="neutral" size={42} />
        <View style={styles.documentContent}>
          <Text style={[styles.documentTitle, { color: theme.text }]} numberOfLines={1}>{item.merchant || item.title}</Text>
          <Text style={[styles.documentMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {[kind, prettyDate(item.date), item.category].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {amount ? <Text style={[styles.documentAmount, { color: theme.text }]}>{amount}</Text> : null}
        <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
      </Pressable>
    );
  }
}

function iconForDocument(kind?: OneDocumentKind) {
  if (kind === 'receipt' || kind === 'invoice') return icons.shopping;
  if (kind === 'ticket' || kind === 'reservation') return icons.calendar;
  if (kind === 'contract') return icons.lock;
  return icons.document;
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
  search: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 15,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOpacity: 0.035,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1
  },
  searchInput: { flex: 1, minHeight: 48, fontSize: 14.5, lineHeight: 19, letterSpacing: -0.1 },
  clearButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  filters: { gap: 8, paddingRight: 20 },
  filter: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  filterText: { fontSize: 11.5, fontWeight: '600' },
  block: { gap: 10 },
  documents: { gap: 20 },
  documentMemory: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 19,
    padding: 17,
    shadowOpacity: 0.035,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1
  },
  memoryTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  memoryIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  memoryEyebrow: { fontSize: 8.75, lineHeight: 11, fontWeight: '700', letterSpacing: 1.15 },
  memoryTitle: { marginTop: 3, fontSize: 15.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.2 },
  documentCount: { fontSize: 11, fontWeight: '600' },
  memoryFacts: { marginTop: 16, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 8 },
  fact: { minWidth: 66 },
  factWide: { flex: 1, alignItems: 'flex-end' },
  factValue: { fontSize: 14, lineHeight: 18, fontWeight: '600', letterSpacing: -0.12 },
  factLabel: { marginTop: 3, fontSize: 9.75, lineHeight: 13 },
  multiCurrency: { marginTop: 11, fontSize: 10.5, lineHeight: 15 },
  insightStrip: { marginTop: 14, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, gap: 1 },
  insightLine: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 9 },
  insightLabel: { width: 58, fontSize: 8.25, fontWeight: '700', letterSpacing: 0.75 },
  insightValue: { flex: 1, fontSize: 11.25, lineHeight: 15.5, fontWeight: '500' },
  documentActions: { flexDirection: 'row', gap: 9 },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  actionButtonText: { fontSize: 12.5, fontWeight: '600' },
  documentFilter: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  documentFilterText: { fontSize: 11.25, fontWeight: '600' },
  documentRow: {
    minHeight: 78,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  documentContent: { flex: 1, minWidth: 0 },
  documentTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600', letterSpacing: -0.14 },
  documentMeta: { marginTop: 4, fontSize: 11.25, lineHeight: 15 },
  documentAmount: { fontSize: 12.75, fontWeight: '600', letterSpacing: -0.05 }
});