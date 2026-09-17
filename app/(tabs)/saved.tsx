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
import { EmptyState, IconTile, PageHeader, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
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
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <PageHeader
          title="Saved"
          subtitle={filter === 'Documents' ? 'Receipts, invoices and documents in one place.' : 'Links, ideas and moments worth keeping.'}
          action={
            filter === 'Documents'
              ? <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Scan a document"
                  onPress={() => router.push('/scan')}
                  style={({ pressed }) => [styles.scanButton, { backgroundColor: theme.chromeSoft, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
                >
                  <OneIcon name={icons.scan} size={17} color={theme.chrome} />
                </Pressable>
              : undefined
          }
        />

        <View style={[styles.search, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <OneIcon name={icons.search} size={18} color={theme.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={filter === 'Documents' ? 'Search receipts and documents' : 'Search saved'}
            placeholderTextColor={theme.textTertiary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {query ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')}>
              <OneIcon name={icons.close} size={15} color={theme.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((name) => {
            const active = name === filter;
            return (
              <Pressable
                key={name}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setFilter(name);
                }}
                style={[
                  styles.filter,
                  {
                    backgroundColor: active ? theme.accent : theme.fill,
                    borderColor: active ? theme.accent : theme.border
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? theme.onAccent : theme.textSecondary }]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filter === 'Documents' ? (
          <DocumentsView
            documents={documents}
            groups={documentGroups}
            summary={documentSummary}
            selectedFilter={documentFilter}
            setSelectedFilter={setDocumentFilter}
          />
        ) : (
          <View style={styles.block}>
            <SectionHeader title={filter === 'All' ? 'Your memory' : filter} meta={String(savedItems.length)} />
            <Surface>
              {savedItems.length ? (
                savedItems.map((item) => <OneItemRow key={item.id} item={item} />)
              ) : (
                <EmptyState icon={icons.saved} title="Nothing here yet" body="Share something to NEVER or save an idea from your inbox." />
              )}
            </Surface>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function DocumentsView({
    documents,
    groups,
    summary,
    selectedFilter,
    setSelectedFilter
  }: {
    documents: OneItem[];
    groups: Array<{ label: string; items: OneItem[] }>;
    summary: ReturnType<typeof getDocumentSummary>;
    selectedFilter: 'all' | OneDocumentKind;
    setSelectedFilter: (value: 'all' | OneDocumentKind) => void;
  }) {
    const primaryTotal = summary.totals[0];

    return (
      <View style={styles.documents}>
        <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={[styles.summaryEyebrow, { color: theme.chrome }]}>{summary.monthLabel.toUpperCase()}</Text>
              <Text style={[styles.summaryAmount, { color: theme.text }]}>
                {primaryTotal ? formatCurrencyTotal(primaryTotal, 'de-DE') : '€0.00'}
              </Text>
              <Text style={[styles.summaryCaption, { color: theme.textSecondary }]}>captured total</Text>
            </View>
            <IconTile icon={icons.document} size={46} />
          </View>

          {summary.totals.length > 1 ? (
            <Text style={[styles.multiCurrency, { color: theme.textTertiary }]}>
              + {summary.totals.slice(1).map((total) => formatCurrencyTotal(total, 'de-DE')).join(' + ')}
            </Text>
          ) : null}

          <View style={[styles.metrics, { borderTopColor: theme.border }]}>
            <Metric value={String(summary.receipts)} label="Receipts" />
            <Metric value={String(summary.invoices)} label="Invoices" />
            <Metric value={String(summary.documents.length)} label="Documents" />
          </View>
        </View>

        {(summary.largest || summary.topMerchant) ? (
          <View style={styles.insights}>
            {summary.largest ? (
              <InsightCard
                icon={icons.shopping}
                label="Largest"
                value={formatItemAmount(summary.largest, 'de-DE') || '—'}
                meta={summary.largest.merchant || summary.largest.title}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: summary.largest!.id } })}
              />
            ) : null}
            {summary.topMerchant ? (
              <InsightCard
                icon={icons.saved}
                label="Top merchant"
                value={summary.topMerchant.name}
                meta={summary.topMerchant.count + (summary.topMerchant.count === 1 ? ' document' : ' documents')}
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.documentActions}>
          <Pressable
            onPress={() => router.push('/scan')}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.accent, borderColor: theme.accent, opacity: pressed ? 0.72 : 1 }
            ]}
          >
            <OneIcon name={icons.scan} size={17} color={theme.onAccent} />
            <Text style={[styles.actionButtonText, { color: theme.onAccent }]}>Scan document</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/ask', params: { q: 'How much did I spend this month?' } })}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }
            ]}
          >
            <OneIcon name={icons.ask} size={17} color={theme.text} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Ask NEVER</Text>
          </Pressable>
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
                style={[
                  styles.documentFilter,
                  {
                    backgroundColor: active ? theme.chromeSoft : theme.fill,
                    borderColor: active ? theme.chrome : theme.border
                  }
                ]}
              >
                <Text style={[styles.documentFilterText, { color: active ? theme.chrome : theme.textSecondary }]}>
                  {entry.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {groups.length ? (
          groups.map((group) => (
            <View key={group.label} style={styles.block}>
              <SectionHeader title={group.label} meta={String(group.items.length)} />
              <Surface>
                {group.items.map((item) => (
                  <DocumentRow key={item.id} item={item} />
                ))}
              </Surface>
            </View>
          ))
        ) : (
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

  function Metric({ value, label }: { value: string; label: string }) {
    return (
      <View style={styles.metric}>
        <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.metricLabel, { color: theme.textTertiary }]}>{label}</Text>
      </View>
    );
  }

  function InsightCard({
    icon,
    label,
    value,
    meta,
    onPress
  }: {
    icon: (typeof icons)[keyof typeof icons];
    label: string;
    value: string;
    meta: string;
    onPress?: () => void;
  }) {
    const content = (
      <>
        <IconTile icon={icon} tone="neutral" size={34} />
        <Text style={[styles.insightLabel, { color: theme.textTertiary }]}>{label}</Text>
        <Text style={[styles.insightValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
        <Text style={[styles.insightMeta, { color: theme.textSecondary }]} numberOfLines={1}>{meta}</Text>
      </>
    );

    return onPress ? (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.insightCard,
          { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow, opacity: pressed ? 0.6 : 1 }
        ]}
      >
        {content}
      </Pressable>
    ) : (
      <View style={[styles.insightCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
        {content}
      </View>
    );
  }

  function DocumentRow({ item }: { item: OneItem }) {
    const amount = formatItemAmount(item, 'de-DE');
    const kind = formatKind(item.documentKind);

    return (
      <Pressable
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [
          styles.documentRow,
          { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }
        ]}
      >
        <IconTile icon={iconForDocument(item.documentKind)} size={40} />
        <View style={styles.documentContent}>
          <Text style={[styles.documentTitle, { color: theme.text }]} numberOfLines={1}>
            {item.merchant || item.title}
          </Text>
          <Text style={[styles.documentMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {[kind, prettyDate(item.date), item.category].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {amount ? <Text style={[styles.documentAmount, { color: theme.text }]}>{amount}</Text> : null}
        <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
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
  return kind
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function prettyDate(iso?: string) {
  if (!iso) return undefined;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
    new Date(iso + 'T12:00:00')
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  search: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 1
  },
  searchInput: { flex: 1, fontSize: 14.75, letterSpacing: -0.08 },
  filters: { gap: 8, paddingRight: 20 },
  filter: { minHeight: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 12, fontWeight: '700' },
  block: { gap: 10 },
  scanButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  documents: { gap: 17 },
  summaryCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 18, shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 1 },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  summaryEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.25 },
  summaryAmount: { marginTop: 8, fontSize: 31, lineHeight: 37, fontWeight: '700', letterSpacing: -1.05 },
  summaryCaption: { marginTop: 3, fontSize: 12 },
  multiCurrency: { marginTop: 7, fontSize: 11 },
  metrics: { marginTop: 18, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  metric: { flex: 1 },
  metricValue: { fontSize: 15.5, fontWeight: '700' },
  metricLabel: { marginTop: 4, fontSize: 11 },
  insights: { flexDirection: 'row', gap: 10 },
  insightCard: { flex: 1, minWidth: 0, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 14, shadowOpacity: 0.045, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
  insightLabel: { marginTop: 11, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  insightValue: { marginTop: 5, fontSize: 14.5, fontWeight: '700' },
  insightMeta: { marginTop: 4, fontSize: 11 },
  documentActions: { flexDirection: 'row', gap: 9 },
  actionButton: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionButtonText: { fontSize: 12.75, fontWeight: '700' },
  documentFilter: { minHeight: 34, paddingHorizontal: 13, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  documentFilterText: { fontSize: 11.75, fontWeight: '700' },
  documentRow: { minHeight: 78, paddingHorizontal: 15, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  documentContent: { flex: 1, minWidth: 0 },
  documentTitle: { fontSize: 14.75, fontWeight: '700', letterSpacing: -0.1 },
  documentMeta: { marginTop: 4, fontSize: 11.25 },
  documentAmount: { fontSize: 13.25, fontWeight: '700' }
});
