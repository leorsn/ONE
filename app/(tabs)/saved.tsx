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
import { BrandHeader, CoreBackdrop, EmptyState, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { iconForType } from '@/src/ui/OneItemRow';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
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
      <CoreBackdrop />
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <BrandHeader />

        <View style={styles.intro}>
          <Text style={[styles.title, { color: theme.text }]}>{filter === 'Documents' ? 'Documents' : 'Saved'}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {filter === 'Documents' ? 'Receipts, tickets and important files.' : 'Your curated memory library.'}
          </Text>
        </View>

        <View style={[styles.search, {
          backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE',
          borderColor: dark ? '#FFFFFF18' : '#FFFFFF',
          shadowColor: dark ? '#000000' : '#788196'
        }]}>
          <View style={[styles.searchIconWell, { backgroundColor: dark ? '#2C2C2ECC' : '#F1F2F6E8' }]}>
            <OneIcon name={icons.search} size={17.5} color={theme.chrome} />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={filter === 'Documents' ? 'Search documents…' : 'Search your library…'}
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

        <View style={[styles.segmented, { backgroundColor: dark ? '#1C1C1ED8' : '#E8EAF0D8' }]}>
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
                  styles.segment,
                  active && {
                    backgroundColor: dark ? '#3A3A3ECC' : '#FFFFFFF2',
                    shadowColor: theme.shadow,
                    shadowOpacity: dark ? 0.2 : 0.12,
                    shadowRadius: 10,
                    shadowOffset: { width: 0, height: 4 }
                  },
                  { opacity: pressed ? 0.7 : 1 }
                ]}
              >
                <Text style={[styles.segmentText, { color: active ? theme.text : theme.textSecondary }]} numberOfLines={1}>{name}</Text>
              </Pressable>
            );
          })}
        </View>

        {filter === 'Documents' ? (
          <DocumentsView groups={documentGroups} summary={documentSummary} selectedFilter={documentFilter} setSelectedFilter={setDocumentFilter} />
        ) : (
          <View style={styles.block}>
            <SectionHeader title={filter === 'All' ? 'Memory library' : filter} meta={String(savedItems.length)} />
            {savedItems.length ? (
              <View style={styles.gallery}>
                {savedItems.map((item) => <MemoryTile key={item.id} item={item} />)}
              </View>
            ) : (
              <Surface><EmptyState icon={icons.saved} title="Nothing here yet" body="Share something to NEVER or save an idea from your inbox." /></Surface>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function MemoryTile({ item }: { item: OneItem }) {
    const preview = imagePreviewUri(item);
    const tint = tileTint(item);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.tile, {
          backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE',
          borderColor: dark ? '#FFFFFF16' : '#FFFFFF',
          shadowColor: dark ? '#000000' : '#7D8594',
          opacity: pressed ? 0.72 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }]
        }]}
      >
        <View style={[styles.tilePreview, { backgroundColor: preview ? theme.fill : `${tint}${dark ? '22' : '12'}` }]}>
          {preview ? (
            <Image source={{ uri: preview }} style={styles.tileImage} resizeMode="cover" />
          ) : (
            <OneIcon name={iconForType(item.type)} size={26} color={tint} />
          )}
          <View style={[styles.tileBadge, { backgroundColor: dark ? '#00000099' : '#FFFFFFDD' }]}>
            <Text style={[styles.tileBadgeText, { color: dark ? '#FFFFFF' : theme.textSecondary }]}>{item.type.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.tileBody}>
          <Text style={[styles.tileTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.tileMeta, { color: theme.textSecondary }]} numberOfLines={1}>{tileMeta(item)}</Text>
          <View style={styles.tileFooter}>
            <Text style={[styles.tileDate, { color: theme.textTertiary }]}>{prettyCaptured(item.updatedAt)}</Text>
            <OneIcon name={icons.chevron} size={12.5} color={theme.textTertiary} />
          </View>
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
        <View style={[styles.documentSummary, {
          backgroundColor: dark ? '#1C1C1EE8' : '#FFFFFFEE',
          borderColor: dark ? '#FFFFFF16' : '#FFFFFF',
          shadowColor: dark ? '#000000' : '#768094'
        }]}>
          <Text style={[styles.summaryEyebrow, { color: theme.textTertiary }]}>{summary.monthLabel.toUpperCase()}</Text>
          <View style={styles.summaryTop}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Document memory</Text>
            <View style={[styles.summaryCountBadge, { backgroundColor: theme.fill }]}>
              <Text style={[styles.summaryCount, { color: theme.textSecondary }]}>{summary.documents.length}</Text>
            </View>
          </View>
          <View style={[styles.summaryFacts, { borderTopColor: `${theme.text}0D` }]}>
            <Fact label="Receipts" value={String(summary.receipts)} />
            <Fact label="Invoices" value={String(summary.invoices)} />
            <Fact label="Captured value" value={primaryTotal ? formatCurrencyTotal(primaryTotal, 'de-DE') : '—'} wide />
          </View>
        </View>

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
                style={({ pressed }) => [styles.documentFilter, {
                  backgroundColor: active ? theme.accent : (dark ? '#1C1C1ECC' : '#FFFFFFD8'),
                  borderColor: active ? theme.accent : (dark ? '#FFFFFF14' : '#FFFFFF'),
                  opacity: pressed ? 0.7 : 1
                }]}
              >
                <Text style={[styles.documentFilterText, { color: active ? '#FFFFFF' : theme.textSecondary }]}>{entry.label}</Text>
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

  function tileTint(item: OneItem) {
    if (item.type === 'document' || item.type === 'link') return theme.sky;
    if (item.type === 'idea' || item.type === 'note') return theme.plum;
    if (item.type === 'shopping' || item.type === 'reminder') return theme.warning;
    return theme.chrome;
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
  intro: { marginTop: 2 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '800', letterSpacing: -1.15 },
  subtitle: { marginTop: 5, fontSize: 13, lineHeight: 18.5 },
  search: { minHeight: 64, borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, paddingLeft: 9, paddingRight: 9, flexDirection: 'row', alignItems: 'center', gap: 10, shadowOpacity: 0.15, shadowRadius: 30, shadowOffset: { width: 0, height: 14 }, elevation: 5 },
  searchIconWell: { width: 42, height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  searchInput: { flex: 1, minHeight: 48, fontSize: 15, lineHeight: 20 },
  clearButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  segmented: { minHeight: 46, borderRadius: 17, padding: 4, flexDirection: 'row', gap: 2 },
  segment: { flex: 1, minHeight: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 10.3, fontWeight: '600' },
  block: { gap: 11 },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '48.2%', borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 4 },
  tilePreview: { height: 118, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tileImage: { width: '100%', height: '100%' },
  tileBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 9 },
  tileBadgeText: { fontSize: 7.2, fontWeight: '800', letterSpacing: 0.7 },
  tileBody: { padding: 13 },
  tileTitle: { fontSize: 13.7, lineHeight: 17.5, fontWeight: '700', letterSpacing: -0.16 },
  tileMeta: { marginTop: 5, fontSize: 10.2, lineHeight: 13.5 },
  tileFooter: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileDate: { fontSize: 9.1, fontWeight: '600' },
  documents: { gap: 18 },
  documentSummary: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 24, padding: 18, shadowOpacity: 0.14, shadowRadius: 28, shadowOffset: { width: 0, height: 13 }, elevation: 4 },
  summaryEyebrow: { fontSize: 8.25, fontWeight: '700', letterSpacing: 1.05 },
  summaryTop: { marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryTitle: { fontSize: 15.75, lineHeight: 19.5, fontWeight: '700' },
  summaryCountBadge: { minWidth: 30, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  summaryCount: { fontSize: 10.5, fontWeight: '700' },
  summaryFacts: { marginTop: 15, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12 },
  fact: { minWidth: 62 },
  factWide: { flex: 1, alignItems: 'flex-end' },
  factValue: { fontSize: 13.25, lineHeight: 16.5, fontWeight: '600' },
  factLabel: { marginTop: 3, fontSize: 9.25, lineHeight: 12 },
  documentFilters: { gap: 9, paddingRight: 18 },
  documentFilter: { minHeight: 37, paddingHorizontal: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  documentFilterText: { fontSize: 10.5, fontWeight: '600' },
  documentRow: { minHeight: 72, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  documentSpine: { width: 3, height: 30, borderRadius: 2 },
  documentContent: { flex: 1, minWidth: 0 },
  documentTitle: { fontSize: 14.25, lineHeight: 18, fontWeight: '600', letterSpacing: -0.12 },
  documentMeta: { marginTop: 3, fontSize: 11, lineHeight: 14.5 },
  documentAmount: { fontSize: 12.25, fontWeight: '600' }
});
