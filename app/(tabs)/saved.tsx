import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { OneItemRow } from '@/src/ui/OneItemRow';
import { EmptyState, PageHeader, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const filters = ['All', 'Documents', 'Links', 'Ideas', 'Shopping', 'Travel'] as const;

export default function SavedScreen() {
  const theme = useTheme();
  const { items } = useItems();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [query, setQuery] = useState('');

  const savedItems = useMemo(() => {
    const clean = query.trim().toLowerCase();
    const base = items
      .filter((item) => item.saved || ['link', 'idea', 'shopping', 'travel', 'document'].includes(item.type))
      .filter((item) => {
        if (!clean) return true;
        return [item.title, item.category, item.userContext, item.url, item.extractedText, item.merchant, item.currency, item.documentKind]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(clean));
      });

    if (filter === 'All') return base;
    if (filter === 'Documents') return base.filter((item) => item.type === 'document');
    if (filter === 'Links') return base.filter((item) => item.type === 'link');
    if (filter === 'Ideas') return base.filter((item) => item.type === 'idea');
    if (filter === 'Shopping') return base.filter((item) => item.type === 'shopping' || item.category === 'Gift idea');
    return base.filter((item) => item.type === 'travel');
  }, [items, filter, query]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <PageHeader title="Saved" subtitle="Links, ideas and moments worth keeping." />

        <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <OneIcon name={icons.search} size={18} color={theme.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search saved"
            placeholderTextColor={theme.textTertiary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')}>
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
                    backgroundColor: active ? theme.text : theme.fill,
                    borderColor: active ? theme.text : theme.fill
                  }
                ]}
              >
                <Text style={[styles.filterText, { color: active ? theme.background : theme.textSecondary }]}>
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.block}>
          <SectionHeader title={filter === 'All' ? 'Your memory' : filter} meta={String(savedItems.length)} />
          <Surface>
            {savedItems.length ? (
              savedItems.map((item) => <OneItemRow key={item.id} item={item} />)
            ) : (
              <EmptyState icon={icons.saved} title="Nothing here yet" body="Share something to ONE or save an idea from your inbox." />
            )}
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  search: {
    minHeight: 52,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  searchInput: { flex: 1, fontSize: 15 },
  filters: { gap: 8, paddingRight: 20 },
  filter: { minHeight: 34, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 12.5, fontWeight: '700' },
  block: { gap: 10 }
});
