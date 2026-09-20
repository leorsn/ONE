import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useItems } from '@/src/context/ItemsContext';
import { isInboxActive, triageActionChanges, triagePriority } from '@/src/inbox/triage';
import { TriageRow } from '@/src/ui/TriageRow';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Group, V5LargeHeader, V5SectionHeader, useNeverV5Palette } from '@/src/ui/appleV5';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function InboxIndexScreen() {
  const p = useNeverV5Palette();
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
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <V5LargeHeader title="Inbox" subtitle="New captures that still need a decision." />

        <View style={styles.section}>
          <V5SectionHeader title="Needs Review" meta={`${inboxItems.length}`} />
          <V5Group>
            {inboxItems.length ? inboxItems.map((item) => (
              <TriageRow
                key={item.id}
                item={item}
                onOpen={() => router.push({ pathname: '/inbox/[id]', params: { id: item.id } })}
                onExecute={(action) => executeAction(item, action)}
              />
            )) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.check} size={18} color={p.chrome} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emptyTitle, { color: p.label }]}>Inbox clear</Text>
                  <Text style={[styles.emptyBody, { color: p.secondary }]}>Everything you captured has a place.</Text>
                </View>
              </View>
            )}
          </V5Group>
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
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40, gap: 18 },
  section: { gap: 7 },
  emptyState: { minHeight: 78, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  emptyIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  emptyBody: { marginTop: 1, fontSize: 12.5, lineHeight: 16 }
});