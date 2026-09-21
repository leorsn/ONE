import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MemoryRow } from '@/src/ui/MemoryRow';
import { NeverMaterial, selectionFeedback } from '@/src/ui/material';
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
  V5LargeHeader,
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
  const now = new Date();
  const firstName = displayFirstName(session?.user.user_metadata);
  const recentItems = [...items]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);
  const todayEntries = buildTodayEntries(items, now).slice(0, 3);
  const inboxItems = items
    .filter((item) => !item.completed && isInboxActive(item, now))
    .sort((a, b) => triagePriority(a) - triagePriority(b) || sortUpdated(a, b))
    .slice(0, 3);

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
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <View style={styles.brandBar}>
          <V5Wordmark />
          <V5IconButton icon={icons.person} accessibilityLabel="Open your settings" onPress={() => router.push('/(tabs)/settings')} />
        </View>
        <V5LargeHeader
          title={`${greetingFor(now)}${firstName ? `,\n${firstName}.` : '.'}`}
          subtitle="Capture today. Remember tomorrow."
        />

        <View style={styles.section}>
          <NeverMaterial glass>
            <View style={styles.captureComposer}>
              <Pressable onPress={() => focusCapture()} accessibilityRole="button" accessibilityLabel="Start a capture" style={[styles.capturePlus, { backgroundColor: p.graphite }]}>
                <OneIcon name={icons.plus} size={20} color={p.onAccent} />
              </Pressable>
              <TextInput
                ref={captureRef}
                value={input}
                onChangeText={(value) => { setInput(value); setReviewedDraft(null); setCaptureStatus(''); }}
                editable={!saving}
                placeholder="Capture something…"
                placeholderTextColor={p.tertiary}
                style={[styles.captureInput, { color: p.label }]}
                returnKeyType={structuredReview ? 'default' : 'done'}
                onSubmitEditing={structuredReview ? undefined : handleSave}
                accessibilityLabel="Quick capture"
              />
              {saving ? <ActivityIndicator color={p.chrome} /> : input.trim() ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Save capture" disabled={saving || !draft?.title.trim()} onPress={handleSave} style={[styles.captureSave, { backgroundColor: p.graphite }]}>
                  <OneIcon name={icons.check} size={18} color={p.onAccent} />
                </Pressable>
              ) : null}
            </View>
          </NeverMaterial>
            <View style={styles.quickActions}>
              <QuickAction label="Scan" icon={icons.scan} onPress={() => router.push('/scan')} />
              <QuickAction label="Add link" icon={icons.link} onPress={() => focusCapture('https://')} />
              <QuickAction label="New note" icon={icons.note} onPress={() => focusCapture('')} />
              <QuickAction label="Share" icon={icons.upload} onPress={() => router.push('/share')} />
            </View>
          {captureStatus ? <Text accessibilityLiveRegion="polite" style={[styles.captureStatus, { color: p.secondary }]}>{captureStatus}</Text> : null}
        </View>

        {draft ? (
          <View style={styles.section}>
            <V5SectionHeader title="Understood" meta={draft.overallConfidence} />
            <V5Group style={styles.draftGroup}>
              {!structuredReview ? (
                <>
                  <View style={styles.draftRow}>
                    <View style={[styles.draftIcon, { backgroundColor: p.fillSoft }]}>
                      <OneIcon name={iconForDraft(draft)} size={16} color={p.chrome} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.draftTitle, { color: p.label }]} numberOfLines={2}>{draft.title}</Text>
                      <Text style={[styles.draftMeta, { color: p.secondary }]}>{labelForKind(draft.canonicalKind)} · Ready to save</Text>
                    </View>
                  </View>
                  <View style={styles.draftButton}><NeverChromeButton label={saving ? "Saving…" : "Save to NEVER"} icon={icons.check} onPress={handleSave} disabled={saving} /></View>
                </>
              ) : (
                <View style={styles.reviewEditor}>
                  <CaptureReviewEditor draft={draft} onChange={setReviewedDraft} showExtractedText={false} />
                  <NeverChromeButton label="Save to NEVER" icon={icons.check} onPress={handleSave} disabled={saving || !draft.title.trim()} />
                </View>
              )}
            </V5Group>
          </View>
        ) : null}

        <V5Group>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask NEVER"
            onPress={() => router.push('/ask')}
            style={({ pressed }) => [styles.askRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
          >
            <View style={[styles.askIcon, { backgroundColor: p.graphite }]}>
              <OneIcon name={icons.ask} size={15} color={p.onAccent} />
            </View>
            <View style={styles.askCopy}>
              <Text style={[styles.askTitle, { color: p.label }]}>Ask NEVER</Text>
              <Text style={[styles.askSubtitle, { color: p.secondary }]} numberOfLines={1}>Find something you saved, in your own words</Text>
            </View>
            <V5Chevron />
          </Pressable>
        </V5Group>

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
            title="Recent"
            action={recentItems.length ? (
              <Pressable onPress={() => router.push('/(tabs)/saved')} hitSlop={8}>
                <Text style={[styles.seeAll, { color: p.chrome }]}>See All</Text>
              </Pressable>
            ) : undefined}
          />
          <V5Group>
            {recentItems.length ? recentItems.map((item, index) => (
              <MemoryRow key={item.id} item={item} last={index === recentItems.length - 1} />
            )) : (
              <View style={styles.emptyRow}>
                <Text style={[styles.emptyTitle, { color: p.label }]}>Your memory starts here.</Text>
                <Text style={[styles.emptyBody, { color: p.secondary }]}>Capture, scan or share something to NEVER.</Text>
              </View>
            )}
          </V5Group>
        </View>

        {inboxItems.length ? (
          <View style={styles.section}>
            <V5SectionHeader
              title="Needs Review"
              meta={`${inboxItems.length}`}
              action={(
                <Pressable onPress={() => router.push('/inbox')} hitSlop={8}>
                  <Text style={[styles.seeAll, { color: p.chrome }]}>Open</Text>
                </Pressable>
              )}
            />
            <V5Group>
              {inboxItems.map((item) => (
                <TriageRow key={item.id} item={item} onOpen={() => router.push({ pathname: '/inbox/[id]', params: { id: item.id } })} onExecute={(action) => executeAction(item, action)} />
              ))}
            </V5Group>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );

  function QuickAction({ label, icon, onPress }: { label: string; icon: (typeof icons)[keyof typeof icons]; onPress: () => void }) {
    return (
      <Pressable
        accessibilityRole="button" accessibilityLabel={label}
        onPress={() => { selectionFeedback(); onPress(); }}
        style={({ pressed }) => [styles.quickAction, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
      >
        <View style={[styles.actionIcon, { backgroundColor: p.fillSoft, borderColor: p.glassBorder }]}><OneIcon name={icon} size={22} color={p.chrome} /></View>
        <Text style={[styles.quickActionLabel, { color: p.label }]}>{label}</Text>
      </Pressable>
    );
  }

  function TodayRow({ item, reason, last }: { item: OneItem; reason: string; last: boolean }) {
    const activeInbox = isInboxActive(item, now);
    const overdue = reason === 'Overdue';
    const detail = [item.location, item.summary].filter(Boolean).join(' · ') || reason;
    const timeLabel = item.time || (overdue ? 'Past' : reason);
    return (
      <Pressable
        onPress={() => router.push({ pathname: activeInbox ? '/inbox/[id]' : '/item/[id]', params: { id: item.id } } as never)}
        style={({ pressed }) => [styles.listRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
      >
        <View style={[styles.todayDot, { backgroundColor: overdue ? p.warning : p.chrome }]} />
        <View style={[styles.listRowContent, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.listTitleLine}>
              <Text style={[styles.listTitle, { color: p.label }]} numberOfLines={1}>{item.title}</Text>
              <Text style={[styles.listMeta, { color: overdue ? p.warning : p.tertiary }]}>{timeLabel}</Text>
            </View>
            <Text style={[styles.listSubtitle, { color: p.secondary }]} numberOfLines={1}>{detail}</Text>
          </View>
          <V5Chevron />
        </View>
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
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: neverSpacing.md, paddingBottom: 118, gap: neverSpacing.xxl },
  brandBar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  askRow: { minHeight: 62, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  askIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  askCopy: { flex: 1, minWidth: 0 },
  askTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.12 },
  askSubtitle: { marginTop: 1, fontSize: 12.5, lineHeight: 16 },
  section: { gap: neverSpacing.md },
  captureComposer: { minHeight: 72, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  capturePlus: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  captureInput: { flex: 1, minHeight: 46, fontSize: 16, lineHeight: 20, paddingVertical: 0 },
  captureSave: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickActions: { flexDirection: 'row', gap: neverSpacing.sm },
  quickAction: { flex: 1, minHeight: 82, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  quickActionLabel: { fontSize: 11.5, lineHeight: 14, fontWeight: '500' },
  actionIcon: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  captureStatus: { ...neverType.caption },
  draftGroup: { padding: 13 },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  draftIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  draftTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  draftMeta: { marginTop: 1, fontSize: 12.5, lineHeight: 16 },
  draftButton: { marginTop: 12 },
  reviewEditor: { gap: 10 },
  seeAll: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  listRow: { minHeight: 58, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  todayDot: { width: 6, height: 6, borderRadius: 3 },
  listRowContent: { flex: 1, minHeight: 58, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  listTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  listTitle: { flex: 1, fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  listMeta: { fontSize: 11.5, lineHeight: 14 },
  listSubtitle: { marginTop: 1, fontSize: 12.5, lineHeight: 16 },
  emptyRow: { minHeight: 80, padding: 14, justifyContent: 'center' },
  emptyTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  emptyBody: { marginTop: 2, fontSize: 12.5, lineHeight: 16 }
});