import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useItems } from '@/src/context/ItemsContext';
import { isInboxActive, triageActionChanges, triagePriority } from '@/src/inbox/triage';
import { TriageRow } from '@/src/ui/TriageRow';
import { BrandHeader, EmptyState, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function InboxIndexScreen() {
  const theme = useTheme();
  const { items, update } = useItems();
  const now = new Date();
  const inboxItems = items
    .filter((item) => !item.completed && isInboxActive(item, now))
    .sort((a, b) => triagePriority(a) - triagePriority(b) || sortUpdated(a, b));

  async function executeAction(item: OneItem, action: OneInboxAction) {
    const changes = triageActionChanges(item, action);
    if (!changes) return;
    await update(item.id, changes);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false}>
        <BrandHeader />
        <View style={styles.intro}>
          <Text style={[styles.title, { color: theme.text }]}>Inbox</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>New captures that still need a decision.</Text>
        </View>
        <View style={styles.block}>
          <SectionHeader title="Needs you" meta={`${inboxItems.length} items`} />
          <Surface>
            {inboxItems.length ? inboxItems.map((item) => (
              <TriageRow
                key={item.id}
                item={item}
                onOpen={() => router.push({ pathname: '/inbox/[id]', params: { id: item.id } })}
                onExecute={(action) => executeAction(item, action)}
              />
            )) : (
              <EmptyState icon={icons.check} title="Inbox clear" body="Everything you captured has a place." />
            )}
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function sortUpdated(a: OneItem, b: OneItem) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  intro: { marginTop: -4 },
  title: { fontFamily: editorialFontFamily, fontSize: 34, lineHeight: 38, letterSpacing: -1.05 },
  subtitle: { marginTop: 4, fontSize: 12.75, lineHeight: 18.5 },
  block: { gap: 10 }
});
