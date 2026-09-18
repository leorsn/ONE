import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { CaptureReviewEditor } from '@/src/capture/CaptureReviewEditor';
import { interpretCapture, requiresStructuredReview, type CaptureDraft } from '@/src/capture/core';
import { useItems } from '@/src/context/ItemsContext';
import { isInboxActive, triageActionChanges, triagePriority } from '@/src/inbox/triage';
import { buildTodayEntries, todayReasonLabel } from '@/src/inbox/today';
import { notificationSaveWarning } from '@/src/notifications/status';
import { TriageRow } from '@/src/ui/TriageRow';
import { OneItemRow, iconForType } from '@/src/ui/OneItemRow';
import { BrandHeader, IconTile, PrimaryButton, RoundIconButton, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function InboxScreen() {
  const theme = useTheme();
  const captureRef = useRef<TextInput>(null);
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

  const recentItems = [...items]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
  const todayEntries = buildTodayEntries(items, now).slice(0, 3);
  const inboxItems = items
    .filter((item) => !item.completed && isInboxActive(item, now))
    .sort((a, b) => triagePriority(a) - triagePriority(b) || sortUpdated(a, b))
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

  function focusCapture(seed?: string) {
    if (typeof seed === 'string') {
      setInput(seed);
      setReviewedDraft(null);
    }
    requestAnimationFrame(() => captureRef.current?.focus());
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BrandHeader
          action={<RoundIconButton icon={icons.person} onPress={() => router.push('/(tabs)/settings')} accessibilityLabel="Open settings" />}
        />

        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>{greetingFor(new Date())}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>Everything you want to remember, in one place.</Text>
        </View>

        <View style={styles.captureGroup}>
          <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>QUICK CAPTURE</Text>
          <View
            style={[
              styles.capture,
              {
                backgroundColor: theme.surface,
                borderColor: draft ? theme.success : theme.border,
                shadowColor: theme.shadow
              }
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start a new capture"
              onPress={() => focusCapture()}
              style={[styles.captureStart, { borderRightColor: theme.border }]}
            >
              <OneIcon name={icons.plus} size={21} color={theme.chrome} />
            </Pressable>
            <TextInput
              ref={captureRef}
              value={input}
              onChangeText={(value) => {
                setInput(value);
                setReviewedDraft(null);
              }}
              placeholder="Capture something…"
              placeholderTextColor={theme.textTertiary}
              style={[styles.input, { color: theme.text }]}
              returnKeyType={structuredReview ? 'default' : 'done'}
              onSubmitEditing={structuredReview ? undefined : handleSave}
              accessibilityLabel="Quick capture"
              accessibilityHint="Type a note, reminder, appointment, link or idea"
            />
            {input.trim() ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save capture"
                onPress={handleSave}
                style={({ pressed }) => [styles.captureSubmit, { backgroundColor: theme.chrome, opacity: pressed ? 0.72 : 1 }]}
              >
                <OneIcon name={icons.check} size={15} color={theme.onAccent} />
              </Pressable>
            ) : (
              <OneIcon name={icons.more} size={18} color={theme.textTertiary} />
            )}
          </View>
        </View>

        <View style={styles.toolGrid} accessibilityRole="toolbar">
          <ToolCard label="Scan" meta="Paper to memory" icon={icons.scan} onPress={() => router.push('/scan')} />
          <ToolCard label="Add Link" meta="From any app" icon={icons.link} onPress={() => focusCapture('https://')} />
          <ToolCard label="New Note" meta="Quick capture" icon={icons.note} onPress={() => focusCapture('')} />
          <ToolCard label="Share" meta="Send to NEVER" icon={icons.upload} onPress={() => router.push('/share')} />
        </View>

        {draft ? (
          <View style={styles.block}>
            <SectionHeader title="NEVER understood" meta={draft.overallConfidence.toUpperCase()} />
            {!structuredReview ? (
              <Surface>
                <View style={styles.interpretationTop}>
                  <IconTile icon={iconForDraft(draft)} tone="neutral" size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.interpretationTitle, { color: theme.text }]} numberOfLines={2}>{draft.title}</Text>
                    <Text style={[styles.interpretationMeta, { color: theme.textSecondary }]}>{labelForKind(draft.canonicalKind)} · Inbox first</Text>
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
          <SectionHeader
            title="Recent"
            meta={recentItems.length ? `${recentItems.length} items` : undefined}
            action={
              <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/saved')} hitSlop={8}>
                <Text style={[styles.textAction, { color: theme.textSecondary }]}>See all</Text>
              </Pressable>
            }
          />
          <Surface>
            {recentItems.length ? recentItems.map((item) => <OneItemRow key={item.id} item={item} showDate={false} />) : (
              <View style={styles.compactEmpty}>
                <Text style={[styles.compactEmptyTitle, { color: theme.text }]}>Your memory starts here.</Text>
                <Text style={[styles.compactEmptyBody, { color: theme.textSecondary }]}>Capture, scan or share something to NEVER.</Text>
              </View>
            )}
          </Surface>
        </View>

        {todayEntries.length ? (
          <View style={styles.block}>
            <SectionHeader title="Today" meta={`${todayEntries.length} items`} />
            <Surface>
              {todayEntries.map(({ item, reason }) => <TodayRow key={item.id} item={item} reason={todayReasonLabel(reason)} />)}
            </Surface>
          </View>
        ) : null}

        {inboxItems.length ? (
          <View style={styles.block}>
            <SectionHeader
              title="Inbox"
              meta={`${inboxItems.length} items`}
              action={
                <Pressable accessibilityRole="button" onPress={() => router.push('/inbox')} hitSlop={8}>
                  <Text style={[styles.textAction, { color: theme.textSecondary }]}>Review</Text>
                </Pressable>
              }
            />
            <Surface>
              {inboxItems.map((item) => (
                <TriageRow
                  key={item.id}
                  item={item}
                  onOpen={() => router.push({ pathname: '/inbox/[id]', params: { id: item.id } })}
                  onExecute={(action) => executeAction(item, action)}
                />
              ))}
            </Surface>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );

  function TodayRow({ item, reason }: { item: OneItem; reason: string }) {
    const activeInbox = isInboxActive(item, now);
    const overdue = reason === 'Overdue';
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${reason}. ${item.title}`}
        onPress={() => router.push({ pathname: activeInbox ? '/inbox/[id]' : '/item/[id]', params: { id: item.id } } as never)}
        style={({ pressed }) => [styles.todayRow, { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
      >
        <View style={[styles.todayMarker, { backgroundColor: overdue ? theme.warning : theme.sky }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.todayReason, { color: overdue ? theme.warning : theme.textTertiary }]}>{reason.toUpperCase()}</Text>
          <Text style={[styles.todayTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.todayMeta, { color: theme.textSecondary }]} numberOfLines={1}>{[item.time, item.location, item.summary].filter(Boolean).join(' · ')}</Text>
        </View>
        <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
      </Pressable>
    );
  }

  function ToolCard({ label, meta, icon, onPress }: {
    label: string;
    meta: string;
    icon: (typeof icons)[keyof typeof icons];
    onPress: () => void;
  }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={async () => {
          await Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          styles.toolCard,
          { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }
        ]}
      >
        <OneIcon name={icon} size={19} color={theme.chrome} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.toolLabel, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.toolMeta, { color: theme.textSecondary }]}>{meta}</Text>
        </View>
        <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
      </Pressable>
    );
  }
}

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 18) return 'Good afternoon.';
  return 'Good evening.';
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
function sortUpdated(a: OneItem, b: OneItem) { return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); }

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: { marginTop: -3, paddingHorizontal: 1 },
  heroTitle: { maxWidth: 430, fontFamily: editorialFontFamily, fontSize: 31, lineHeight: 34, letterSpacing: -0.8 },
  heroSubtitle: { marginTop: 5, fontSize: 12.5, lineHeight: 18 },
  captureGroup: { gap: 8 },
  eyebrow: { paddingHorizontal: 1, fontSize: 8.5, lineHeight: 12, fontWeight: '700', letterSpacing: 1.6 },
  capture: {
    minHeight: 62,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    gap: 10,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1
  },
  captureStart: { width: 54, alignSelf: 'stretch', borderRightWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 50, fontSize: 14.5, lineHeight: 19, letterSpacing: -0.1 },
  captureSubmit: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolCard: { width: '48%', minHeight: 72, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  toolLabel: { fontSize: 13.25, lineHeight: 17, fontWeight: '600', letterSpacing: -0.08 },
  toolMeta: { marginTop: 3, fontSize: 10.25, lineHeight: 13.5 },
  block: { gap: 10 },
  interpretationTop: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  interpretationTitle: { fontSize: 14.75, lineHeight: 18.5, fontWeight: '600', letterSpacing: -0.14 },
  interpretationMeta: { fontSize: 11.25, lineHeight: 15, marginTop: 4 },
  saveWrap: { padding: 14, paddingTop: 0 },
  textAction: { fontSize: 11.5, fontWeight: '600' },
  compactEmpty: { minHeight: 106, paddingHorizontal: 18, justifyContent: 'center' },
  compactEmptyTitle: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  compactEmptyBody: { marginTop: 4, fontSize: 11.5, lineHeight: 16 },
  todayRow: { minHeight: 72, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  todayMarker: { width: 3, height: 30, borderRadius: 2 },
  todayReason: { fontSize: 8.5, lineHeight: 11, fontWeight: '700', letterSpacing: 0.9 },
  todayTitle: { marginTop: 3, fontSize: 14.25, lineHeight: 18, fontWeight: '600', letterSpacing: -0.12 },
  todayMeta: { marginTop: 3, fontSize: 11.1, lineHeight: 15 }
});
