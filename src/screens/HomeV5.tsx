import { useLocalDay } from '@/src/ui/useLocalDay';
import { NeverInput } from '@/src/ui/NeverInput';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { NeverMaterial, selectionFeedback } from '@/src/ui/material';
import { MemoryRow } from '@/src/ui/MemoryRow';
import { primaryAction } from '@/src/theme/editions';
import { neverSpacing, neverType } from '@/src/theme/tokens';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { CaptureReviewEditor } from '@/src/capture/CaptureReviewEditor';
import { interpretCapture, requiresStructuredReview, type CaptureDraft } from '@/src/capture/core';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { isInboxActive, triageActionChanges, triagePriority } from '@/src/inbox/triage';
import { buildTodayEntries, todayReasonLabel } from '@/src/inbox/today';
import { notificationSaveWarning } from '@/src/notifications/status';
import { TriageRow } from '@/src/ui/TriageRow';
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverChromeButton } from '@/src/ui/never';
import {
  V5Chevron,
  V5Group,
  V5SectionHeader,
  V5Wordmark,
  V5IconButton,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function HomeV5() {
  const p = useNeverV5Palette();
  const { session } = useAuth();
  const captureRef = useRef<TextInput>(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [captureStatus, setCaptureStatus] = useState('');
  const [reviewedDraft, setReviewedDraft] = useState<CaptureDraft | null>(null);
  const { items, add, update } = useItems();

  const automaticDraft = useMemo(
    () => input.trim() ? interpretCapture({ rawText: input, sourceType: 'manual' }) : null,
    [input]
  );
  const draft = reviewedDraft ?? automaticDraft;
  const structuredReview = draft ? requiresStructuredReview(draft) : false;
  useLocalDay();
  const now = new Date();
  const firstName = displayFirstName(session?.user.user_metadata);
  const recentItems = useMemo(() => [...items].sort(sortUpdated).slice(0, 6), [items]);
  const todayEntries = buildTodayEntries(items, now).slice(0, 3);
  const reviewItems = items
    .filter((item) => !item.completed && isInboxActive(item, new Date()))
    .sort((a, b) => triagePriority(a) - triagePriority(b) || sortUpdated(a, b));
  const inboxItems = reviewItems.slice(0, 3);

  async function handleSave() {
    if (!draft || !input.trim() || !draft.title.trim() || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setCaptureStatus('Saving your capture…');
    try {
      const item = buildItemFromCapture({ draft, sourceType: 'manual', rawInput: input, originalText: input });
      const savedItem = await add(item);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      setInput('');
      setReviewedDraft(null);
      setCaptureStatus('Saved to NEVER');
      const warning = notificationSaveWarning(savedItem);
      if (warning) Alert.alert('Saved to NEVER', warning);
    } catch {
      setCaptureStatus('Could not save. Your capture is still here — try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function executeAction(item: OneItem, action: OneInboxAction) {
    const changes = triageActionChanges(item, action);
    if (!changes) return;
    const updated = await update(item.id, changes);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (updated) {
      const warning = notificationSaveWarning(updated);
      if (warning) Alert.alert('Saved to NEVER', warning);
    }
  }

  function focusCapture(seed?: string) {
    if (savingRef.current) return;
    if (typeof seed === 'string') {
      setInput(seed);
      setReviewedDraft(null);
    }
    requestAnimationFrame(() => captureRef.current?.focus());
  }

  return (
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.content, p.pageStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <View style={styles.brandBar}>
          <V5Wordmark />
          <V5IconButton icon={icons.person} accessibilityLabel="Open your settings" onPress={() => router.push('/(tabs)/settings')} />
        </View>

        <View style={styles.heroCopy}>
          <Text accessibilityRole="header" style={[styles.heroTitle, p.heroType, p.heading, p.environmentText]}>
            {`${greetingFor(now)}${firstName ? `,\n${firstName}.` : '.'}`}
          </Text>
          <Text style={[styles.heroSubtitle, p.environmentText]}>
            Capture what matters. NEVER keeps the context.
          </Text>
        </View>

        <View style={styles.captureStage}>
          <NeverMaterial role="input" style={styles.captureControls}>
            <View style={styles.captureComposer}>
              <Pressable
                onPress={() => focusCapture()}
                accessibilityRole="button"
                accessibilityLabel="Start a capture"
                style={[styles.capturePlus, { borderRadius: p.radius.icon, backgroundColor: primaryAction.background }]}
              >
                <OneIcon name={icons.plus} size={20} color={primaryAction.foreground} />
              </Pressable>
              <NeverInput
                ref={captureRef}
                value={input}
                onChangeText={(value) => { setInput(value); setReviewedDraft(null); setCaptureStatus(''); }}
                editable={!saving}
                placeholder="Capture a thought, link, date…"
                placeholderTextColor={p.tertiary}
                style={[styles.captureInput, { color: p.label }]}
                returnKeyType={structuredReview ? 'default' : 'done'}
                onSubmitEditing={structuredReview ? undefined : handleSave}
                accessibilityLabel="Quick capture"
              />
              {saving ? <ActivityIndicator color={p.chrome} /> : input.trim() ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save capture"
                  disabled={saving || !draft?.title.trim()}
                  onPress={handleSave}
                  style={[styles.captureSave, { backgroundColor: primaryAction.background }]}
                >
                  <OneIcon name={icons.check} size={18} color={primaryAction.foreground} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.quickActions}>
              <QuickAction label="Scan" icon={icons.scan} onPress={() => router.push('/scan')} />
              <QuickAction label="Link" icon={icons.link} onPress={() => focusCapture('https://')} />
              <QuickAction label="Note" icon={icons.note} onPress={() => focusCapture('')} />
              <QuickAction label="Share" icon={icons.upload} onPress={() => router.push('/share')} />
            </View>
          </NeverMaterial>
          {captureStatus ? <Text accessibilityLiveRegion="polite" style={[styles.captureStatus, p.environmentText]}>{captureStatus}</Text> : null}
        </View>

        {draft ? (
          <View style={styles.section}>
            <V5SectionHeader title="Understood" meta={draft.overallConfidence} />
            <V5Group style={styles.draftGroup}>
              {!structuredReview ? (
                <>
                  <View style={styles.draftRow}>
                    <View style={[styles.draftIcon, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft }]}>
                      <OneIcon name={iconForDraft(draft)} size={16} color={p.chrome} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.draftTitle, { color: p.label }]} numberOfLines={2}>{draft.title}</Text>
                      <Text style={[styles.draftMeta, { color: p.secondary }]}>{labelForKind(draft.canonicalKind)} · Ready to save</Text>
                    </View>
                  </View>
                  <View style={styles.draftButton}><NeverChromeButton label={saving ? 'Saving…' : 'Save to NEVER'} icon={icons.check} onPress={handleSave} busy={saving} /></View>
                </>
              ) : (
                <View style={styles.reviewEditor}>
                  <CaptureReviewEditor draft={draft} onChange={setReviewedDraft} showExtractedText={false} />
                  <NeverChromeButton label="Save to NEVER" icon={icons.check} onPress={handleSave} busy={saving} disabled={!draft.title.trim()} />
                </View>
              )}
            </V5Group>
          </View>
        ) : null}

        <View style={styles.askStage}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask NEVER"
            onPress={() => router.push('/ask')}
            style={({ pressed }) => [styles.askRow, { opacity: pressed ? 0.66 : 1 }]}
          >
            <View style={[styles.askIcon, { borderRadius: p.radius.icon, backgroundColor: primaryAction.background }]}>
              <OneIcon name={icons.ask} size={17} color={primaryAction.foreground} />
            </View>
            <View style={styles.askCopy}>
              <Text style={[styles.askTitle, p.environmentText]}>Ask NEVER</Text>
              <Text style={[styles.askSubtitle, p.environmentText]} numberOfLines={2}>
                Find a memory in your own words.
              </Text>
            </View>
            <OneIcon name={icons.chevron} size={14} color={p.environmentText.color} />
          </Pressable>
        </View>

        {todayEntries.length ? (
          <View style={styles.section}>
            <V5SectionHeader title="Today" meta={`${todayEntries.length}`} />
            <V5Group>
              {todayEntries.map(({ item, reason }, index) => (
                <TodayRow key={item.id} item={item} reason={todayReasonLabel(reason)} last={index === todayEntries.length - 1} />
              ))}
            </V5Group>
          </View>
        ) : null}

        <View style={styles.section}>
          <V5SectionHeader
            title="Recent memory"
            action={recentItems.length ? (
              <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/saved')} hitSlop={8}>
                <Text style={[styles.seeAll, p.environmentText]}>See All</Text>
              </Pressable>
            ) : undefined}
          />
          {recentItems.length ? (
            <V5Group>
              {recentItems.map((item, index) => <MemoryRow key={item.id} item={item} last={index === recentItems.length - 1} />)}
            </V5Group>
          ) : (
            <V5Group>
              <View style={styles.emptyRow}>
                <Text style={[styles.emptyTitle, { color: p.label }]}>Your memory starts here.</Text>
                <Text style={[styles.emptyBody, { color: p.secondary }]}>Capture, scan or share something to NEVER.</Text>
              </View>
            </V5Group>
          )}
        </View>

        {inboxItems.length ? (
          <View style={styles.section}>
            <V5SectionHeader
              title="Needs Review"
              meta={`${reviewItems.length}`}
              action={(
                <Pressable accessibilityRole="button" onPress={() => router.push('/inbox')} hitSlop={8}>
                  <Text style={[styles.seeAll, p.environmentText]}>Open</Text>
                </Pressable>
              )}
            />
            <V5Group>
              {inboxItems.map((item, index) => (
                <TriageRow last={index === inboxItems.length - 1} key={item.id} item={item} onOpen={() => router.push({ pathname: '/inbox/[id]', params: { id: item.id } })} onExecute={(action) => executeAction(item, action)} />
              ))}
            </V5Group>
          </View>
        ) : null}
      </ScrollView>
    </NeverScreen>
  );

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
function QuickAction({ label, icon, onPress }: { label: string; icon: (typeof icons)[keyof typeof icons]; onPress: () => void }) {
  const p = useNeverV5Palette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => { selectionFeedback(); onPress(); }}
      style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.58 : 1 }]}
    >
      <View style={styles.actionIcon}>
        <OneIcon name={icon} size={16} color={p.chrome} />
      </View>
      <Text style={[styles.quickActionLabel, { color: p.secondary }]}>{label}</Text>
    </Pressable>
  );
}

function TodayRow({ item, reason, last }: { item: OneItem; reason: string; last: boolean }) {
  const p = useNeverV5Palette();
  const activeInbox = isInboxActive(item, new Date());
  const overdue = reason === 'Overdue';
  const detail = [item.location, item.summary].filter(Boolean).join(' · ') || reason;
  const timeLabel = item.time || (overdue ? 'Past' : reason);
  return (
    <Pressable accessibilityRole="button"
      onPress={() => router.push({ pathname: activeInbox ? '/inbox/[id]' : '/item/[id]', params: { id: item.id } } as never)}
      style={({ pressed }) => [styles.todayCard, { borderBottomColor: p.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, opacity: pressed ? 0.66 : 1 }]}
    >
      <View style={[styles.todayRail, { backgroundColor: overdue ? p.warning : p.chrome }]} />
      <View style={styles.todayCopy}>
        <View style={styles.listTitleLine}>
          <Text style={[styles.listTitle, { color: p.label }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.listMeta, { color: overdue ? p.warning : p.tertiary }]}>{timeLabel}</Text>
        </View>
        <Text style={[styles.listSubtitle, { color: p.secondary }]} numberOfLines={1}>{detail}</Text>
      </View>
      <V5Chevron />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: neverSpacing.md,
    paddingBottom: 126,
    gap: 26
  },
  brandBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroCopy: { gap: 5, paddingTop: 4 },
  heroTitle: { fontSize: 42, lineHeight: 45, fontFamily: neverType.hero.fontFamily, fontWeight: '400', letterSpacing: -1.35 },
  heroSubtitle: { maxWidth: 390, fontSize: 14.5, lineHeight: 20 },
  captureStage: { gap: 8 },
  captureControls: { paddingHorizontal: 8, paddingVertical: 4 },
  captureComposer: {
    minHeight: 52,
    paddingHorizontal: 0,
    borderRadius: 21,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    overflow: 'hidden'
  },
  capturePlus: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  captureInput: { flex: 1, minHeight: 46, fontSize: 15.5, lineHeight: 20, paddingVertical: 0 },
  captureSave: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickActions: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 },
  quickAction: { flex: 1, minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 4, paddingVertical: 4 },
  actionIcon: { width: 20, height: 24, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { textAlign: 'center', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  captureStatus: { ...neverType.caption },
  section: { gap: neverSpacing.md },
  draftGroup: { padding: 13 },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  draftIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  draftTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  draftMeta: { marginTop: 1, fontSize: 12.5, lineHeight: 16 },
  draftButton: { marginTop: 12 },
  reviewEditor: { gap: 10 },
  askStage: { minHeight: 64 },
  askRow: { minHeight: 64, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 13 },
  askIcon: { width: 36, height: 36, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  askCopy: { flex: 1, minWidth: 0, gap: 1 },
  askTitle: { marginTop: 2, fontSize: 18.5, lineHeight: 22, fontWeight: '600', letterSpacing: -0.35 },
  askSubtitle: { fontSize: 12.5, lineHeight: 17 },
  todayCard: {
    minHeight: 68,
    borderRadius: 0,
    paddingLeft: 12,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden'
  },
  todayRail: { width: 3, alignSelf: 'stretch' },
  todayCopy: { flex: 1, minWidth: 0 },
  listTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listTitle: { flex: 1, fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  listMeta: { fontSize: 11.5, lineHeight: 14 },
  listSubtitle: { marginTop: 2, fontSize: 12.5, lineHeight: 16 },
  seeAll: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  emptyRow: { minHeight: 86, padding: 15, justifyContent: 'center' },
  emptyTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  emptyBody: { marginTop: 2, fontSize: 12.5, lineHeight: 16 }
});
