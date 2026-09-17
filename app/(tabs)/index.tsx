import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { CaptureReviewEditor } from '@/src/capture/CaptureReviewEditor';
import { interpretCapture, requiresStructuredReview, type CaptureDraft } from '@/src/capture/core';
import { useItems } from '@/src/context/ItemsContext';
import {
  isInboxActive,
  triageActionChanges,
  triagePriority,
  triageStateForItem
} from '@/src/inbox/triage';
import { buildTodayEntries, todayReasonLabel } from '@/src/inbox/today';
import { notificationSaveWarning } from '@/src/notifications/status';
import { TriageRow } from '@/src/ui/TriageRow';
import { OneItemRow } from '@/src/ui/OneItemRow';
import { BrandHeader, EmptyState, IconTile, PrimaryButton, RoundIconButton, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function InboxScreen() {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [reviewedDraft, setReviewedDraft] = useState<CaptureDraft | null>(null);
  const { items, add, update, toggleCompleted } = useItems();

  const automaticDraft = useMemo(
    () => input.trim() ? interpretCapture({ rawText: input, sourceType: 'manual' }) : null,
    [input]
  );
  const draft = reviewedDraft ?? automaticDraft;
  const structuredReview = draft ? requiresStructuredReview(draft) : false;
  const now = new Date();
  const todayIso = toIsoDate(now);

  const inboxItems = items
    .filter((item) => !item.completed && isInboxActive(item, now))
    .sort((a, b) => triagePriority(a) - triagePriority(b) || sortUpdated(a, b))
    .slice(0, 10);
  const todayEntries = buildTodayEntries(items, now).slice(0, 6);
  const upcoming = items
    .filter((item) => !item.completed && triageStateForItem(item) !== 'archived' && item.destination === 'calendar' && item.date && item.date >= todayIso)
    .sort(sortByDateTime)
    .slice(0, 5);
  const saved = items
    .filter((item) => !item.completed && triageStateForItem(item) !== 'archived' && item.destination === 'saved')
    .sort(sortUpdated)
    .slice(0, 4);

  async function handleSave() {
    if (!draft || !input.trim()) return;
    const item = buildItemFromCapture({
      draft,
      sourceType: 'manual',
      rawInput: input,
      originalText: input
    });
    const savedItem = await add(item);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInput('');
    setReviewedDraft(null);
    const reminderWarning = notificationSaveWarning(savedItem);
    if (reminderWarning) Alert.alert('Saved to NEVER', reminderWarning);
  }

  async function executeAction(item: OneItem, action: OneInboxAction) {
    const changes = triageActionChanges(item, action);
    if (!changes) return;
    const updated = await update(item.id, changes);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (updated) {
      const warning = notificationSaveWarning(updated);
      if (warning) Alert.alert('Saved to NEVER', warning);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BrandHeader
          action={<RoundIconButton icon={icons.person} onPress={() => router.push('/(tabs)/settings')} accessibilityLabel="Open settings" />}
        />

        <View style={styles.captureGroup}>
          <Text style={[styles.captureLabel, { color: theme.textTertiary }]}>QUICK CAPTURE</Text>
          <View
            style={[
              styles.capture,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: draft ? theme.chrome : theme.border,
                shadowColor: theme.shadow
              }
            ]}
          >
            <IconTile icon={icons.plus} tone="neutral" size={38} />
            <TextInput
              value={input}
              onChangeText={(value) => {
                setInput(value);
                setReviewedDraft(null);
              }}
              placeholder="Capture something for later…"
              placeholderTextColor={theme.textTertiary}
              style={[styles.input, { color: theme.text }]}
              returnKeyType={structuredReview ? 'default' : 'done'}
              onSubmitEditing={structuredReview ? undefined : handleSave}
              accessibilityLabel="Quick capture"
              accessibilityHint="Type a note, reminder, appointment, link or idea"
            />
            <RoundIconButton icon={icons.ask} onPress={() => router.push('/ask')} accessibilityLabel="Ask NEVER" filled />
          </View>
        </View>

        <View style={styles.quickActions} accessibilityRole="toolbar">
          <QuickAction label="Scan" icon={icons.scan} hint="Scan a receipt or document" onPress={() => router.push('/scan')} />
          <QuickAction label="Share" icon={icons.upload} hint="Learn how to share content to NEVER" onPress={() => router.push('/share')} />
          <QuickAction label="Ask NEVER" icon={icons.ask} hint="Search your NEVER memory" onPress={() => router.push('/ask')} />
        </View>

        {draft ? (
          <View style={styles.block}>
            <SectionHeader title="NEVER understood" meta={draft.overallConfidence.toUpperCase()} />
            {!structuredReview ? (
              <Surface>
                <View style={styles.interpretationTop}>
                  <IconTile icon={iconForDraft(draft)} tone="neutral" size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.interpretationTitle, { color: theme.text }]} numberOfLines={2}>{draft.title}</Text>
                    <Text style={[styles.interpretationMeta, { color: theme.textSecondary }]}>
                      {[labelForKind(draft.canonicalKind), 'Inbox first'].join(' · ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.saveWrap}>
                  <PrimaryButton label="Capture to Inbox" icon={icons.check} onPress={handleSave} />
                </View>
              </Surface>
            ) : (
              <>
                <CaptureReviewEditor draft={draft} onChange={setReviewedDraft} showExtractedText={false} />
                <PrimaryButton label="Capture to Inbox" icon={icons.check} onPress={handleSave} disabled={!draft.title.trim()} />
              </>
            )}
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Today" meta={todayEntries.length ? `${todayEntries.length} items` : undefined} />
          <Surface>
            {todayEntries.length ? (
              todayEntries.map(({ item, reason }) => (
                <TodayRow key={item.id} item={item} reason={todayReasonLabel(reason)} />
              ))
            ) : (
              <EmptyState icon={icons.check} title="Nothing needs you today" body="Events, reminders and Inbox decisions will appear here when they matter." />
            )}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Inbox" meta={inboxItems.length ? `${inboxItems.length} items` : undefined} />
          <Surface>
            {inboxItems.length ? (
              inboxItems.map((item) => (
                <TriageRow
                  key={item.id}
                  item={item}
                  onOpen={() => router.push({ pathname: '/inbox/[id]', params: { id: item.id } })}
                  onExecute={(action) => executeAction(item, action)}
                />
              ))
            ) : (
              <EmptyState icon={icons.check} title="Inbox clear" body="New captures and information that still needs a decision will appear here." />
            )}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader
            title="Upcoming"
            meta={upcoming.length ? `${upcoming.length} items` : undefined}
            action={
              <Pressable accessibilityRole="button" accessibilityLabel="Open calendar" onPress={() => router.push('/(tabs)/calendar')} hitSlop={8}>
                <Text style={[styles.textAction, { color: theme.chrome }]}>Calendar</Text>
              </Pressable>
            }
          />
          <Surface>
            {upcoming.length
              ? upcoming.map((item) => <OneItemRow key={item.id} item={item} onToggle={toggleCompleted} />)
              : <EmptyState icon={icons.calendar} title="Nothing scheduled" body="Confirmed calendar items and reminders will appear here." />}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader
            title="Saved"
            meta={saved.length ? `${saved.length} items` : undefined}
            action={
              <Pressable accessibilityRole="button" accessibilityLabel="View all saved items" onPress={() => router.push('/(tabs)/saved')} hitSlop={8}>
                <Text style={[styles.textAction, { color: theme.chrome }]}>View all</Text>
              </Pressable>
            }
          />
          <Surface>
            {saved.length
              ? saved.map((item) => <OneItemRow key={item.id} item={item} />)
              : <EmptyState icon={icons.saved} title="Your memory is empty" body="Processed notes, links, ideas and documents collect here." />}
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function TodayRow({ item, reason }: { item: OneItem; reason: string }) {
    const activeInbox = isInboxActive(item, now);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${reason}. ${item.title}`}
        onPress={() => router.push({ pathname: activeInbox ? '/inbox/[id]' : '/item/[id]', params: { id: item.id } } as never)}
        style={({ pressed }) => [styles.todayRow, { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
      >
        <View style={[styles.todayMarker, { backgroundColor: reason === 'Overdue' ? theme.warning : theme.fillStrong }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.todayReason, { color: reason === 'Overdue' ? theme.warning : theme.textTertiary }]}>{reason.toUpperCase()}</Text>
          <Text style={[styles.todayTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.todayMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {[item.time, item.location, item.summary].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
      </Pressable>
    );
  }

  function QuickAction({ label, icon, onPress, hint }: {
    label: string;
    icon: (typeof icons)[keyof typeof icons];
    onPress: () => void;
    hint?: string;
  }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPress={async () => {
          await Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          styles.quickAction,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
            shadowColor: theme.shadow,
            opacity: pressed ? 0.58 : 1
          }
        ]}
      >
        <IconTile icon={icon} tone="neutral" size={34} />
        <Text style={[styles.quickLabel, { color: theme.text }]} numberOfLines={1}>{label}</Text>
      </Pressable>
    );
  }
}

function iconForDraft(draft: CaptureDraft) {
  if (draft.canonicalKind === 'event') return icons.appointment;
  if (draft.canonicalKind === 'reminder') return icons.reminder;
  if (draft.canonicalKind === 'link') return icons.link;
  if (draft.canonicalKind === 'document' || draft.canonicalKind === 'receipt') return icons.document;
  if (draft.canonicalKind === 'image') return icons.screenshot;
  if (draft.captureKind === 'idea') return icons.idea;
  return icons.note;
}

function labelForKind(kind: string) { return kind.charAt(0).toUpperCase() + kind.slice(1); }
function sortByDateTime(a: OneItem, b: OneItem) { return `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`); }
function sortUpdated(a: OneItem, b: OneItem) { return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); }
function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  captureGroup: { gap: 8 },
  captureLabel: { paddingHorizontal: 2, fontSize: 8.75, lineHeight: 12, fontWeight: '700', letterSpacing: 1.45 },
  capture: {
    minHeight: 64,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 8,
    gap: 10,
    shadowOpacity: 0.045,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1
  },
  input: { flex: 1, fontSize: 14.75, lineHeight: 19, letterSpacing: -0.12 },
  block: { gap: 10 },
  quickActions: { flexDirection: 'row', gap: 9 },
  quickAction: {
    flex: 1,
    minHeight: 62,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowOpacity: 0.025,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  quickLabel: { flex: 1, fontSize: 11.25, lineHeight: 14, fontWeight: '600', letterSpacing: -0.05 },
  interpretationTop: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  interpretationTitle: { fontSize: 15, lineHeight: 19, fontWeight: '600', letterSpacing: -0.16 },
  interpretationMeta: { fontSize: 11.5, lineHeight: 15.5, marginTop: 4 },
  saveWrap: { padding: 14, paddingTop: 0 },
  textAction: { fontSize: 11.75, fontWeight: '600' },
  todayRow: {
    minHeight: 74,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  todayMarker: { width: 3, height: 32, borderRadius: 2 },
  todayReason: { fontSize: 8.75, lineHeight: 11, fontWeight: '700', letterSpacing: 0.9 },
  todayTitle: { marginTop: 4, fontSize: 14.5, lineHeight: 18, fontWeight: '600', letterSpacing: -0.14 },
  todayMeta: { marginTop: 4, fontSize: 11.25, lineHeight: 15 }
});
