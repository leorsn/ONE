import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { CaptureReviewEditor } from '@/src/capture/CaptureReviewEditor';
import { interpretCapture, requiresStructuredReview, type CaptureDraft } from '@/src/capture/core';
import { useItems } from '@/src/context/ItemsContext';
import { notificationSaveWarning } from '@/src/notifications/status';
import { OneItemRow } from '@/src/ui/OneItemRow';
import { EmptyState, IconTile, PageHeader, PrimaryButton, RoundIconButton, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

export default function InboxScreen() {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [reviewedDraft, setReviewedDraft] = useState<CaptureDraft | null>(null);
  const { items, add, toggleCompleted } = useItems();

  const automaticDraft = useMemo(
    () => input.trim()
      ? interpretCapture({ rawText: input, sourceType: 'manual' })
      : null,
    [input]
  );
  const draft = reviewedDraft ?? automaticDraft;
  const structuredReview = draft ? requiresStructuredReview(draft) : false;

  const todayIso = toIsoDate(new Date());
  const active = items.filter((item) => !item.completed);
  const newItems = active
    .filter((item) => item.destination === 'inbox' || item.reviewStatus === 'needs_review')
    .sort(sortUpdated)
    .slice(0, 6);
  const upcoming = active
    .filter((item) => item.destination === 'calendar' && item.date && item.date >= todayIso)
    .sort(sortByDateTime)
    .slice(0, 6);
  const saved = active
    .filter((item) => item.destination === 'saved')
    .sort(sortUpdated)
    .slice(0, 5);
  const completed = items
    .filter((item) => item.completed)
    .sort(sortUpdated)
    .slice(0, 3);

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
    if (reminderWarning) Alert.alert('Saved to ONE', reminderWarning);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PageHeader
          title="Inbox"
          subtitle="Capture first. ONE keeps the rest organized."
          action={<RoundIconButton icon={icons.person} onPress={() => router.push('/(tabs)/settings')} accessibilityLabel="Open settings" />}
        />

        <View style={[styles.capture, { backgroundColor: theme.surface, borderColor: draft ? theme.accent : theme.border }]}>
          <IconTile icon={icons.plus} size={36} />
          <TextInput
            value={input}
            onChangeText={(value) => {
              setInput(value);
              setReviewedDraft(null);
            }}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { color: theme.text }]}
            returnKeyType={structuredReview ? 'default' : 'done'}
            onSubmitEditing={structuredReview ? undefined : handleSave}
            accessibilityLabel="Quick capture"
            accessibilityHint="Type a note, reminder, appointment, link or idea"
          />
          <RoundIconButton icon={icons.ask} onPress={() => router.push('/ask')} accessibilityLabel="Ask ONE" filled />
        </View>

        <View style={styles.quickActions} accessibilityRole="toolbar">
          <QuickAction label="Scan" icon={icons.scan} hint="Scan a receipt or document" onPress={() => router.push('/scan')} />
          <QuickAction label="Share" icon={icons.upload} hint="Learn how to share content to ONE" onPress={() => router.push('/share')} />
          <QuickAction label="Ask" icon={icons.ask} hint="Open ONE AI conversation" badge="AI" onPress={() => router.push('/ask')} />
        </View>

        {draft ? (
          <View style={styles.block}>
            <SectionHeader title="ONE understood" meta={draft.overallConfidence.toUpperCase()} />
            {!structuredReview ? (
              <Surface>
                <View style={styles.interpretationTop}>
                  <IconTile icon={iconForDraft(draft)} size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.interpretationTitle, { color: theme.text }]} numberOfLines={2}>{draft.title}</Text>
                    <Text style={[styles.interpretationMeta, { color: theme.textSecondary }]}>
                      {[labelForKind(draft.canonicalKind), destinationLabel(draft.destination)].join(' · ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.saveWrap}>
                  <PrimaryButton label="Save to ONE" icon={icons.check} onPress={handleSave} />
                </View>
              </Surface>
            ) : (
              <>
                <CaptureReviewEditor draft={draft} onChange={setReviewedDraft} showExtractedText={false} />
                <PrimaryButton label="Save to ONE" icon={icons.check} onPress={handleSave} disabled={!draft.title.trim()} />
              </>
            )}
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Inbox" meta={String(newItems.length)} />
          <Surface>
            {newItems.length
              ? newItems.map((item) => <OneItemRow key={item.id} item={item} onToggle={toggleCompleted} />)
              : <EmptyState icon={icons.check} title="Inbox clear" body="New or unresolved captures appear here until ONE can organize them." />}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader
            title="Upcoming"
            meta={String(upcoming.length)}
            action={
              <Pressable accessibilityRole="button" accessibilityLabel="Open calendar" onPress={() => router.push('/(tabs)/calendar')}>
                <Text style={[styles.textAction, { color: theme.accent }]}>Calendar</Text>
              </Pressable>
            }
          />
          <Surface>
            {upcoming.length
              ? upcoming.map((item) => <OneItemRow key={item.id} item={item} onToggle={toggleCompleted} />)
              : <EmptyState icon={icons.calendar} title="Nothing scheduled" body="Appointments, reminders, events and dated tasks appear here." />}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader
            title="Saved"
            meta={String(saved.length)}
            action={
              <Pressable accessibilityRole="button" accessibilityLabel="View all saved items" onPress={() => router.push('/(tabs)/saved')}>
                <Text style={[styles.textAction, { color: theme.accent }]}>View all</Text>
              </Pressable>
            }
          />
          <Surface>
            {saved.length
              ? saved.map((item) => <OneItemRow key={item.id} item={item} />)
              : <EmptyState icon={icons.saved} title="Your memory is empty" body="Notes, links, ideas, images and documents collect here." />}
          </Surface>
        </View>

        {completed.length ? (
          <View style={styles.block}>
            <SectionHeader title="Completed" meta={String(completed.length)} />
            <Surface>
              {completed.map((item) => <OneItemRow key={item.id} item={item} onToggle={toggleCompleted} />)}
            </Surface>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );

  function QuickAction({
    label,
    icon,
    onPress,
    badge,
    hint
  }: {
    label: string;
    icon: (typeof icons)[keyof typeof icons];
    onPress: () => void;
    badge?: string;
    hint?: string;
  }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={badge ? `${label}, ${badge}` : label}
        accessibilityHint={hint}
        onPress={async () => {
          await Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          styles.quickAction,
          { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }
        ]}
      >
        <IconTile icon={icon} tone="neutral" size={34} />
        <Text style={[styles.quickLabel, { color: theme.text }]}>{label}</Text>
        {badge ? (
          <View style={[styles.aiBadge, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.aiBadgeText, { color: theme.accent }]}>{badge}</Text>
          </View>
        ) : null}
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
function destinationLabel(destination: string) { return destination.charAt(0).toUpperCase() + destination.slice(1); }
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
  capture: { minHeight: 64, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 8, gap: 10 },
  input: { flex: 1, fontSize: 16, letterSpacing: -0.15 },
  block: { gap: 10 },
  quickActions: { flexDirection: 'row', gap: 8 },
  quickAction: { flex: 1, minHeight: 52, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  quickLabel: { flex: 1, fontSize: 12.5, fontWeight: '700' },
  aiBadge: { minHeight: 20, borderRadius: 7, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  aiBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  interpretationTop: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  interpretationTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  interpretationMeta: { fontSize: 12.5, marginTop: 4 },
  saveWrap: { padding: 14, paddingTop: 0 },
  textAction: { fontSize: 13, fontWeight: '700' }
});
