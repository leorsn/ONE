import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { retrieveLocalOneItems } from '@/src/search/retrieve';
import { iconForType } from '@/src/ui/OneItemRow';
import { BrandHeader, EmptyState, IconTile, RoundIconButton, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

const suggestions = ['Papa', 'Studium', 'Recent links', 'Saved yesterday'];

export default function SearchScreen() {
  const theme = useTheme();
  const { items } = useItems();
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => retrieveLocalOneItems(query, items, { limit: 18, recentWhenEmpty: true }),
    [query, items]
  );

  const heading = query.trim() ? 'Results' : 'Recent';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={uiStyles.screenContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BrandHeader
          action={
            <RoundIconButton
              icon={icons.ask}
              accessibilityLabel="Ask NEVER"
              onPress={() => router.push(query.trim() ? { pathname: '/ask', params: { q: query.trim() } } : '/ask')}
            />
          }
        />

        <View style={styles.searchGroup}>
          <View style={styles.searchHeadingRow}>
            <View>
              <Text style={[styles.searchTitle, { color: theme.text }]}>Find it again.</Text>
              <Text style={[styles.searchSubtitle, { color: theme.textSecondary }]}>Search across everything you saved to NEVER.</Text>
            </View>
          </View>

          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: query.trim() ? theme.chrome : theme.border,
                shadowColor: theme.shadow
              }
            ]}
          >
            <OneIcon name={icons.search} size={18} color={theme.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search your memory"
              placeholderTextColor={theme.textTertiary}
              style={[styles.input, { color: theme.text }]}
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search NEVER"
              accessibilityHint="Search titles, text, links, tags, contexts, people and dates"
            />
            {query ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setQuery('')}
                style={({ pressed }) => [styles.clear, { backgroundColor: theme.fill, opacity: pressed ? 0.58 : 1 }]}
              >
                <OneIcon name={icons.close} size={14} color={theme.textTertiary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {!query.trim() ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion}
                accessibilityRole="button"
                accessibilityLabel={`Search for ${suggestion}`}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  setQuery(suggestion);
                }}
                style={({ pressed }) => [
                  styles.suggestion,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }
                ]}
              >
                <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>{suggestion}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.resultsBlock}>
          <SectionHeader title={heading} meta={results.length ? `${results.length} items` : undefined} />
          <Surface>
            {results.length ? results.map(({ item, reasons }) => (
              <SearchRow key={item.id} item={item} reason={reasonLabel(reasons)} />
            )) : (
              <EmptyState
                icon={icons.search}
                title="Nothing matched"
                body="Try another wording. NEVER searches titles, original content, links, tags, context and extracted details."
              />
            )}
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function SearchRow({ item, reason }: { item: OneItem; reason?: string }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [
          styles.row,
          { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }
        ]}
      >
        <IconTile icon={iconForType(item.type)} tone="neutral" size={42} />
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={2}>
            {previewFor(item)}
          </Text>
          <Text style={[styles.meta, { color: theme.textTertiary }]} numberOfLines={1}>
            {[item.userContext, reason, formatCaptured(item.capturedAt || item.createdAt)].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
      </Pressable>
    );
  }
}

function previewFor(item: OneItem) {
  return item.summary || item.originalText || item.rawInput || item.url || item.extractedText || item.category || 'Saved in NEVER';
}

function reasonLabel(reasons: string[]) {
  if (reasons.includes('exact-title') || reasons.includes('title')) return 'Title';
  if (reasons.includes('context') || reasons.includes('exact-context')) return 'Context';
  if (reasons.includes('people') || reasons.includes('entities')) return 'Person / entity';
  if (reasons.includes('url')) return 'Link';
  if (reasons.includes('time-context')) return 'Time';
  if (reasons.includes('recent')) return 'Recent';
  return reasons[0] ? reasons[0].replace(/(^|_)(\w)/g, (_, prefix, letter) => `${prefix ? ' ' : ''}${letter.toUpperCase()}`) : undefined;
}

function formatCaptured(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  searchGroup: { gap: 14 },
  searchHeadingRow: { paddingHorizontal: 2 },
  searchTitle: { fontSize: 27, lineHeight: 31, fontWeight: '600', letterSpacing: -0.88 },
  searchSubtitle: { marginTop: 6, maxWidth: 360, fontSize: 12.75, lineHeight: 18.5 },
  searchBox: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 16,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOpacity: 0.045,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1
  },
  input: { flex: 1, fontSize: 15, minHeight: 50, letterSpacing: -0.12 },
  clear: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  suggestions: { gap: 8, paddingRight: 20 },
  suggestion: { minHeight: 34, paddingHorizontal: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  suggestionText: { fontSize: 11.5, fontWeight: '600' },
  resultsBlock: { gap: 10 },
  row: { minHeight: 88, paddingHorizontal: 15, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 14.75, lineHeight: 18, fontWeight: '600', letterSpacing: -0.16 },
  preview: { fontSize: 12, lineHeight: 17 },
  meta: { marginTop: 1, fontSize: 10.25, lineHeight: 13.5, fontWeight: '600' }
});
