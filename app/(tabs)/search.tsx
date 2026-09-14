import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { retrieveLocalOneItems } from '@/src/search/retrieve';
import { iconForType } from '@/src/ui/OneItemRow';
import { IconTile, EmptyState } from '@/src/ui/primitives';
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
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Search</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Find anything you sent to ONE.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask ONE"
            onPress={() => router.push(query.trim() ? { pathname: '/ask', params: { q: query.trim() } } : '/ask')}
            style={({ pressed }) => [styles.askButton, { backgroundColor: theme.accentSoft, opacity: pressed ? 0.65 : 1 }]}
          >
            <OneIcon name={icons.ask} size={17} color={theme.accent} />
            <Text style={[styles.askText, { color: theme.accent }]}>Ask</Text>
          </Pressable>
        </View>

        <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <OneIcon name={icons.search} size={19} color={theme.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your memory"
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { color: theme.text }]}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search ONE"
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
                  { backgroundColor: theme.fill, opacity: pressed ? 0.65 : 1 }
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

        <View style={[styles.results, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {results.length ? results.map(({ item, reasons }) => (
            <SearchRow key={item.id} item={item} reason={reasonLabel(reasons)} />
          )) : (
            <EmptyState
              icon={icons.search}
              title="Nothing matched"
              body="Try another wording. ONE searches the title, original content, links, tags, context and extracted details."
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
          { borderBottomColor: theme.border, opacity: pressed ? 0.62 : 1 }
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
  return item.summary || item.originalText || item.rawInput || item.url || item.extractedText || item.category || 'Saved in ONE';
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
  screen: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 120, gap: 16 },
  header: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 14 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { marginTop: 3, fontSize: 14.5, lineHeight: 20 },
  askButton: { minHeight: 44, paddingHorizontal: 14, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 7 },
  askText: { fontSize: 13.5, fontWeight: '800' },
  searchBox: { minHeight: 54, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 16, minHeight: 48 },
  clear: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  suggestions: { gap: 8, paddingRight: 20 },
  suggestion: { minHeight: 36, paddingHorizontal: 13, borderRadius: 14, justifyContent: 'center' },
  suggestionText: { fontSize: 12.5, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  count: { fontSize: 12.5, fontWeight: '700' },
  results: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { minHeight: 86, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15.5, fontWeight: '750' },
  preview: { fontSize: 13, lineHeight: 18 },
  meta: { fontSize: 11.5, fontWeight: '650' }
});
