import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { NeverGlass, NeverSectionLabel, NeverWordmark } from '@/src/ui/never';
import { useTheme } from '@/src/theme/useTheme';
import { neverType } from '@/src/theme/typography';
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <NeverWordmark />
        </View>

        <View style={styles.intro}>
          <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>MEMORY LIBRARY</Text>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>{filter === 'Documents' ? 'Documents' : 'Saved'}</Text>
            <Text style={[styles.count, { color: theme.textTertiary }]}>{filter === 'Documents' ? documents.length : savedItems.length}</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Everything NEVER has kept for you.</Text>
        </View>

        <View style={[styles.search, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
          <OneIcon name={icons.search} size={16} color={theme.chrome} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={filter === 'Documents' ? 'Search documents…' : 'Search memories…'}
            placeholderTextColor={theme.textTertiary}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} style={styles.clearButton} accessibilityRole="button" accessibilityLabel="Clear search">
              <OneIcon name={icons.close} size={13} color={theme.textTertiary} />
            </Pressable>
          ) : null}
          <View pointerEvents="none" style={[styles.reflection, { backgroundColor: theme.reflection }]} />
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
                    backgroundColor: active ? theme.platinumSoft : 'transparent',
                    borderColor: active ? theme.glassBorder : theme.border,
                    opacity: pressed ? 0.62 : 1
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? theme.text : theme.textSecondary }]}>{name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filter === 'Documents' ? (
          <DocumentsView groups={documentGroups} summary={documentSummary} selectedFilter={documentFilter} setSelectedFilter={setDocumentFilter} />
        ) : (
          <View style={styles.section}>
            <NeverSectionLabel meta={String(savedItems.length)}>{filter === 'All' ? 'Memories' : filter}</NeverSectionLabel>
            {savedItems.length ? (
              <View style={styles.gallery}>
                {savedItems.map((item) => <MemoryTile key={item.id} item={item} />)}
              </View>
            ) : (
              <NeverGlass tone="quiet" padded>
                <View style={styles.emptyState}>
                  <OneIcon name={icons.saved} size={19} color={theme.chrome} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing here yet</Text>
                  <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Capture or save something and it will appear here.</Text>
                </View>
              </NeverGlass>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function MemoryTile({ item }: { item: OneItem }) {
    const preview = imagePreviewUri(item);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.987 : 1 }] }]}
      >
        <NeverGlass tone="strong" style={styles.tileGlass}>
          <View style={[styles.tilePreview, { backgroundColor: theme.fill }]}>
            {preview ? (
              <Image source={{ uri: preview }} style={styles.tileImage} resizeMode="cover" />
            ) : (
              <OneIcon name={iconForType(item.type)} size={24} color={theme.platinum} />
            )}
            <View style={[styles.tileBadge, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}>
              <Text style={[styles.tileBadgeText, { color: theme.textSecondary }]}>{item.type.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.tileBody}>
            <Text style={[styles.tileTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.tileMeta, { color: theme.textSecondary }]} numberOfLines={1}>{tileMeta(item)}</Text>
            <View style={styles.tileFooter}>
              <Text style={[styles.tileDate, { color: theme.textTertiary }]}>{prettyCaptured(item.updatedAt)}</Text>
              <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
            </View>
          </View>
        </NeverGlass>
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
        <NeverGlass tone="strong" padded>
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
        </NeverGlass>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.documentFilters}>
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
                  styles.documentFilter,
                  {
                    backgroundColor: active ? theme.platinumSoft : 'transparent',
                    borderColor: active ? theme.glassBorder : theme.border,
                    opacity: pressed ? 0.66 : 1
                  }
                ]}
              >
                <Text style={[styles.documentFilterText, { color: active ? theme.text : theme.textSecondary }]}>{entry.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {groups.length ? groups.map((group) => (
          <View key={group.label} style={styles.section}>
            <NeverSectionLabel meta={String(group.items.length)}>{group.label}</NeverSectionLabel>
            <NeverGlass tone="quiet">
              {group.items.map((item) => <DocumentRow key={item.id} item={item} />)}
            </NeverGlass>
          </View>
        )) : (
          <NeverGlass tone="quiet" padded>
            <View style={styles.emptyState}>
              <OneIcon name={icons.document} size={19} color={theme.chrome} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No matching documents</Text>
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Try another search or document filter.</Text>
            </View>
          </NeverGlass>
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
        style={({ pressed }) => [styles.documentRow, { borderBottomColor: theme.border, backgroundColor: pressed ? theme.fill : 'transparent' }]}
      >
        <View style={[styles.documentDot, { backgroundColor: theme.platinum }]} />
        <View style={styles.documentContent}>
          <Text style={[styles.documentTitle, { color: theme.text }]} numberOfLines={1}>{item.merchant || item.title}</Text>
          <Text style={[styles.documentMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {[formatKind(item.documentKind), prettyDate(item.date), item.category].filter(Boolean).join(' · ')}
          </Text>
        </View>
        {amount ? <Text style={[styles.documentAmount, { color: theme.textSecondary }]}>{amount}</Text> : null}
        <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
      </Pressable>
    );
  }
}

function imagePreviewUri(item: OneItem) {
  const candidate = item.localAttachmentUri || item.imageUrl;
  return candidate && /^(file|content|ph|https?):\/\//i.test(candidate) ? candidate : undefined;
}

function tileMeta(item: OneItem) {
  return [item.category, item.userContext, item.merchant, item.location].filter(Boolean).join(' · ') || (item.saved ? 'Saved memory' : item.type);
}

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
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 132,
    gap: 24
  },
  topBar: {
    minHeight: 42,
    justifyContent: 'center'
  },
  intro: {
    paddingTop: 10
  },
  eyebrow: {
    ...neverType.eyebrow,
    marginBottom: 8
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between'
  },
  title: {
    ...neverType.display,
    fontSize: 36,
    lineHeight: 41
  },
  count: {
    ...neverType.caption,
    fontWeight: '600'
  },
  subtitle: {
    ...neverType.body,
    marginTop: 4
  },
  search: {
    minHeight: 58,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 11 },
    elevation: 4
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 14,
    lineHeight: 19
  },
  clearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: StyleSheet.hairlineWidth
  },
  filters: {
    gap: 8,
    paddingRight: 20
  },
  filter: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterText: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '600'
  },
  section: {
    gap: 11
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  tile: {
    width: '48.2%',
    borderRadius: 22
  },
  tileGlass: {
    borderRadius: 22
  },
  tilePreview: {
    height: 142,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  tileImage: {
    width: '100%',
    height: '100%'
  },
  tileBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth
  },
  tileBadgeText: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.8
  },
  tileBody: {
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: 14
  },
  tileTitle: {
    ...neverType.bodyStrong,
    fontSize: 13.75,
    lineHeight: 17.5
  },
  tileMeta: {
    ...neverType.caption,
    marginTop: 5,
    fontSize: 10.25,
    lineHeight: 13.5
  },
  tileFooter: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tileDate: {
    ...neverType.caption,
    fontSize: 9.25,
    fontWeight: '600'
  },
  documents: {
    gap: 18
  },
  summaryEyebrow: {
    ...neverType.eyebrow,
    fontSize: 8.2
  },
  summaryTop: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  summaryTitle: {
    ...neverType.section,
    fontSize: 17
  },
  summaryCount: {
    ...neverType.caption,
    fontWeight: '600'
  },
  summaryFacts: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12
  },
  fact: {
    minWidth: 62
  },
  factWide: {
    flex: 1,
    alignItems: 'flex-end'
  },
  factValue: {
    ...neverType.bodyStrong,
    fontSize: 13
  },
  factLabel: {
    ...neverType.caption,
    marginTop: 3,
    fontSize: 9.25
  },
  documentFilters: {
    gap: 8,
    paddingRight: 18
  },
  documentFilter: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  documentFilterText: {
    fontSize: 10.25,
    fontWeight: '600'
  },
  documentRow: {
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11
  },
  documentDot: {
    width: 5,
    height: 5,
    borderRadius: 3
  },
  documentContent: {
    flex: 1,
    minWidth: 0
  },
  documentTitle: {
    ...neverType.bodyStrong,
    fontSize: 14,
    lineHeight: 18
  },
  documentMeta: {
    ...neverType.caption,
    marginTop: 3,
    fontSize: 10.5,
    lineHeight: 14
  },
  documentAmount: {
    ...neverType.caption,
    fontWeight: '600'
  },
  emptyState: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  emptyTitle: {
    ...neverType.bodyStrong,
    marginTop: 4
  },
  emptyBody: {
    ...neverType.caption,
    maxWidth: 280,
    textAlign: 'center'
  }
});
