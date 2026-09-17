import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { retrieveLocalOneItems } from '@/src/search/retrieve';
import { iconForType } from '@/src/ui/OneItemRow';
import { IconTile, EmptyState, PageHeader } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

const suggestions = ['Papa', 'Studium', 'Recent links', 'What I saved yesterday'];

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
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Search"
          subtitle="Find anything you sent to NEVER."
          action={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ask NEVER"
              onPress={() => router.push(query.trim() ? { pathname: '/ask', params: { q: query.trim() } } : '/ask')}
              style={({ pressed }) => [
                styles.askButton,
                { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }
              ]}
            >
              <OneIcon name={icons.ask} size={17} color={theme.text} />
              <Text style={[styles.askText, { color: theme.text }]}>Ask</Text>
            </Pressable>
          }
        />

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
              style={styles.clear}
            >
              <OneIcon name={icons.close} size={15} color={theme.textTertiary} />
            </Pressable>
          ) : null}
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
                  { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }
                ]}
              >
                <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>{suggestion}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{heading}</Text>
          <Text style={[styles.count, { color: theme.textTertiary }]}>{results.length}</Text>
        </View>

        <View
          style={[
            styles.results,
            { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }
          ]}
        >
          {results.length ? results.map(({ item, reasons }) => (
            <SearchRow key={item.id} item={item} reason={reasonLabel(reasons)} />
          )) : (
            <EmptyState
              icon={icons.search}
              title="Nothing matched"
              body="Try another wording. NEVER searches the title, original content, links, tags, context and extracted details."
            />
          )}
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
        <IconTile icon={iconForType(item.type)} tone="neutral" size={40} />
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
  screen: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 124, gap: 20 },
  askButton: { minHeight: 42, paddingHorizontal: 13, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 7 },
  askText: { fontSize: 13, fontWeight: '700' },
  searchBox: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 1
  },
  input: { flex: 1, fontSize: 15.5, minHeight: 50, letterSpacing: -0.1 },
  clear: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  suggestions: { gap: 8, paddingRight: 20 },
  suggestion: { minHeight: 36, paddingHorizontal: 13, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  suggestionText: { fontSize: 12, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.25 },
  count: { fontSize: 11.5, fontWeight: '600' },
  results: {
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1
  },
  row: { minHeight: 88, paddingHorizontal: 15, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.12 },
  preview: { fontSize: 12.75, lineHeight: 18 },
  meta: { fontSize: 11, fontWeight: '600' }
});
