import { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { CaptureReviewEditor } from '@/src/capture/CaptureReviewEditor';
import { interpretCapture, requiresStructuredReview, type CaptureDraft } from '@/src/capture/core';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { isInboxActive, triageActionChanges, triagePriority } from '@/src/inbox/triage';
import { buildTodayEntries, todayReasonLabel } from '@/src/inbox/today';
import { notificationSaveWarning } from '@/src/notifications/status';
import { TriageRow } from '@/src/ui/TriageRow';
import { OneItemRow } from '@/src/ui/OneItemRow';
import { BrandHeader, CoreBackdrop, IconTile, PrimaryButton, RoundIconButton, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function InboxScreen() {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  const { session } = useAuth();
  const captureRef = useRef<TextInput>(null);
  const [input, setInput] = useState('');
  const [reviewedDraft, setReviewedDraft] = useState<CaptureDraft | null>(null);
  const { items, add, update } = useItems();

  const automaticDraft = useMemo(() => input.trim() ? interpretCapture({ rawText: input, sourceType: 'manual' }) : null, [input]);
  const draft = reviewedDraft ?? automaticDraft;
  const structuredReview = draft ? requiresStructuredReview(draft) : false;
  const now = new Date();
  const firstName = displayFirstName(session?.user.user_metadata);

  const recentItems = [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);
  const todayEntries = buildTodayEntries(items, now).slice(0, 3);
  const inboxItems = items.filter((item) => !item.completed && isInboxActive(item, now)).sort((a, b) => triagePriority(a) - triagePriority(b) || sortUpdated(a, b)).slice(0, 3);

  async function handleSave() {
    if (!draft || !input.trim()) return;
    const item = buildItemFromCapture({ draft, sourceType: 'manual', rawInput: input, originalText: input });
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
      <CoreBackdrop />
      <ScrollView contentContainerStyle={uiStyles.screenContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BrandHeader action={<RoundIconButton icon={icons.person} onPress={() => router.push('/(tabs)/settings')} accessibilityLabel="Open settings" />} />

        <View style={styles.hero}>
          <Text style={[styles.heroTitle, { color: theme.text }]}>{greetingFor(now)}{firstName ? `, ${firstName}` : ''}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>Your memory, quietly organized.</Text>
        </View>

        <View style={styles.captureGroup}>
          <View style={styles.captureLabelRow}>
            <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>QUICK CAPTURE</Text>
            <Text style={[styles.captureHint, { color: theme.textTertiary }]}>Type anything</Text>
          </View>
          <View style={[styles.capture, {
            backgroundColor: dark ? '#1B1B1DDA' : '#FFFFFFE3',
            borderColor: draft ? `${theme.success}55` : dark ? '#FFFFFF1A' : '#FFFFFFF5',
            shadowColor: dark ? '#000000' : '#7A8498'
          }]}>
            <View pointerEvents="none" style={[styles.captureHighlight, { backgroundColor: dark ? '#FFFFFF18' : '#FFFFFF' }]} />
            <Pressable accessibilityRole="button" accessibilityLabel="Start a new capture" onPress={() => focusCapture()} style={styles.captureStart}>
              <View style={[styles.captureOrb, { backgroundColor: `${theme.accent}${dark ? '28' : '16'}`, borderColor: `${theme.accent}2D` }]}>
                <OneIcon name={icons.plus} size={21} color={theme.accent} />
              </View>
            </Pressable>
            <TextInput
              ref={captureRef}
              value={input}
              onChangeText={(value) => { setInput(value); setReviewedDraft(null); }}
              placeholder="What do you want to remember?"
              placeholderTextColor={theme.textTertiary}
              style={[styles.input, { color: theme.text }]}
              returnKeyType={structuredReview ? 'default' : 'done'}
              onSubmitEditing={structuredReview ? undefined : handleSave}
              accessibilityLabel="Quick capture"
              accessibilityHint="Type a note, reminder, appointment, link or idea"
            />
            {input.trim() ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Save capture" onPress={handleSave} style={({ pressed }) => [styles.captureSubmit, { backgroundColor: theme.accent, opacity: pressed ? 0.72 : 1 }]}>
                <OneIcon name={icons.check} size={15} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={styles.moreSlot}><OneIcon name={icons.more} size={18} color={theme.textTertiary} /></View>
            )}
          </View>
        </View>

        <View style={[styles.actionDock, {
          backgroundColor: dark ? '#171719CC' : '#FFFFFFCF',
          borderColor: dark ? '#FFFFFF18' : '#FFFFFFEE',
          shadowColor: dark ? '#000000' : '#7B8497'
        }]} accessibilityRole="toolbar">
          <QuickAction label="Scan" icon={icons.scan} tone="blue" onPress={() => router.push('/scan')} />
          <QuickAction label="Link" icon={icons.link} tone="neutral" onPress={() => focusCapture('https://')} />
          <QuickAction label="Note" icon={icons.note} tone="plum" onPress={() => focusCapture('')} />
          <QuickAction label="Share" icon={icons.upload} tone="red" onPress={() => router.push('/share')} />
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
                <View style={styles.saveWrap}><PrimaryButton label="Capture to Inbox" icon={icons.check} onPress={handleSave} /></View>
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
          <SectionHeader title="Recent" meta={recentItems.length ? `${recentItems.length}` : undefined} action={<Pressable onPress={() => router.push('/(tabs)/saved')} hitSlop={8}><Text style={[styles.textAction, { color: theme.accent }]}>See all</Text></Pressable>} />
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
            <SectionHeader title="Today" meta={`${todayEntries.length}`} />
            <Surface>{todayEntries.map(({ item, reason }) => <TodayRow key={item.id} item={item} reason={todayReasonLabel(reason)} />)}</Surface>
          </View>
        ) : null}

        {inboxItems.length ? (
          <View style={styles.block}>
            <SectionHeader title="Inbox" meta={`${inboxItems.length}`} action={<Pressable onPress={() => router.push('/inbox')} hitSlop={8}><Text style={[styles.textAction, { color: theme.accent }]}>Review</Text></Pressable>} />
            <Surface>{inboxItems.map((item) => <TriageRow key={item.id} item={item} onOpen={() => router.push({ pathname: '/inbox/[id]', params: { id: item.id } })} onExecute={(action) => executeAction(item, action)} />)}</Surface>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );

  function QuickAction({ label, icon, onPress, tone }: { label: string; icon: (typeof icons)[keyof typeof icons]; onPress: () => void; tone: 'blue' | 'neutral' | 'plum' | 'red' }) {
    const tint = tone === 'blue' ? theme.sky : tone === 'plum' ? theme.plum : tone === 'red' ? theme.danger : theme.chrome;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={async () => { await Haptics.selectionAsync(); onPress(); }}
        style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.65 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: `${tint}${dark ? '20' : '12'}`, borderColor: `${tint}24` }]}>
          <OneIcon name={icon} size={18} color={tint} />
        </View>
        <Text style={[styles.quickActionLabel, { color: theme.textSecondary }]}>{label}</Text>
      </Pressable>
    );
  }

  function TodayRow({ item, reason }: { item: OneItem; reason: string }) {
    const activeInbox = isInboxActive(item, now);
    const overdue = reason === 'Overdue';
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={`${reason}. ${item.title}`} onPress={() => router.push({ pathname: activeInbox ? '/inbox/[id]' : '/item/[id]', params: { id: item.id } } as never)} style={({ pressed }) => [styles.todayRow, { borderBottomColor: `${theme.text}0D`, backgroundColor: pressed ? `${theme.fill}42` : 'transparent' }]}>
        <View style={[styles.todayMarker, { backgroundColor: overdue ? theme.warning : theme.accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.todayReason, { color: overdue ? theme.warning : theme.textTertiary }]}>{reason.toUpperCase()}</Text>
          <Text style={[styles.todayTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.todayMeta, { color: theme.textSecondary }]} numberOfLines={1}>{[item.time, item.location, item.summary].filter(Boolean).join(' · ')}</Text>
        </View>
        <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
      </Pressable>
    );
  }
}

function displayFirstName(metadata?: Record<string, unknown>) {
  if (!metadata) return undefined;
  const candidate = [metadata.first_name, metadata.full_name, metadata.name].find((value) => typeof value === 'string' && value.trim()) as string | undefined;
  return candidate?.trim().split(/\s+/)[0];
}

function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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
  hero: { paddingTop: 8, paddingHorizontal: 1 },
  heroTitle: { maxWidth: 460, fontSize: 32, lineHeight: 37, fontWeight: '750', letterSpacing: -1.05 },
  heroSubtitle: { marginTop: 5, fontSize: 13.2, lineHeight: 18.5 },
  captureGroup: { gap: 8 },
  captureLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { paddingHorizontal: 1, fontSize: 8.2, lineHeight: 11, fontWeight: '700', letterSpacing: 1.65 },
  captureHint: { fontSize: 9.5, fontWeight: '500' },
  capture: { minHeight: 64, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingRight: 11, gap: 9, overflow: 'hidden', shadowOpacity: 0.15, shadowRadius: 28, shadowOffset: { width: 0, height: 13 }, elevation: 4 },
  captureHighlight: { position: 'absolute', top: 0, left: 21, right: 21, height: StyleSheet.hairlineWidth },
  captureStart: { width: 58, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  captureOrb: { width: 38, height: 38, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 46, fontSize: 14.6, lineHeight: 19.5, letterSpacing: -0.1 },
  captureSubmit: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  moreSlot: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  actionDock: { minHeight: 84, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6, paddingVertical: 10, shadowOpacity: 0.13, shadowRadius: 28, shadowOffset: { width: 0, height: 13 }, elevation: 4 },
  quickAction: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  quickActionIcon: { width: 40, height: 40, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 10, lineHeight: 12.5, fontWeight: '600' },
  block: { gap: 9 },
  interpretationTop: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  interpretationTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600', letterSpacing: -0.12 },
  interpretationMeta: { fontSize: 11, lineHeight: 14.5, marginTop: 4 },
  saveWrap: { padding: 14, paddingTop: 0 },
  textAction: { fontSize: 11.5, fontWeight: '600' },
  compactEmpty: { minHeight: 96, paddingHorizontal: 18, justifyContent: 'center' },
  compactEmptyTitle: { fontSize: 13.75, lineHeight: 17.5, fontWeight: '600' },
  compactEmptyBody: { marginTop: 4, fontSize: 11.25, lineHeight: 15.5 },
  todayRow: { minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  todayMarker: { width: 3, height: 28, borderRadius: 2 },
  todayReason: { fontSize: 8.2, lineHeight: 10.5, fontWeight: '700', letterSpacing: 0.85 },
  todayTitle: { marginTop: 3, fontSize: 14.25, lineHeight: 18, fontWeight: '600', letterSpacing: -0.12 },
  todayMeta: { marginTop: 3, fontSize: 11, lineHeight: 14.5 }
});
