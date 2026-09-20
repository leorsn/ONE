import { useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverChromeButton } from '@/src/ui/never';
import {
  V5Chevron,
  V5Group,
  V5LargeHeader,
  V5SectionHeader,
  V5Wordmark,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function HomeV5() {
  const p = useNeverV5Palette();
  const { session } = useAuth();
  const captureRef = useRef<TextInput>(null);
  const [input, setInput] = useState('');
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
    if (!draft || !input.trim()) return;
    const item = buildItemFromCapture({ draft, sourceType: 'manual', rawInput: input, originalText: input });
    const savedItem = await add(item);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInput('');
    setReviewedDraft(null);
    const warning = notificationSaveWarning(savedItem);
    if (warning) Alert.alert('Saved to NEVER', warning);
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
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandBar}><V5Wordmark /></View>

        <V5LargeHeader
          eyebrow={`${greetingFor(now)}${firstName ? `, ${firstName}` : ''}.`}
          title="What do you need to remember?"
        />

        <V5Group>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask NEVER"
            onPress={() => router.push('/ask')}
            style={({ pressed }) => [styles.askRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
          >
            <View style={[styles.askIcon, { backgroundColor: p.graphite }]}>
              <OneIcon name={icons.ask} size={15} color={p.dark ? '#111113' : '#FFFFFF'} />
            </View>
            <View style={styles.askCopy}>
              <Text style={[styles.askTitle, { color: p.label }]}>Ask NEVER</Text>
              <Text style={[styles.askSubtitle, { color: p.secondary }]} numberOfLines={1}>Find something you saved, in your own words</Text>
            </View>
            <V5Chevron />
          </Pressable>
        </V5Group>

        <View style={styles.section}>
          <V5SectionHeader title="Capture" />
          <V5Group>
            <View style={styles.captureComposer}>
              <Pressable onPress={() => focusCapture()} style={[styles.capturePlus, { backgroundColor: p.fillSoft }]}>
                <OneIcon name={icons.plus} size={17} color={p.chrome} />
              </Pressable>
              <TextInput
                ref={captureRef}
                value={input}
                onChangeText={(value) => { setInput(value); setReviewedDraft(null); }}
                placeholder="Remember something…"
                placeholderTextColor={p.tertiary}
                style={[styles.captureInput, { color: p.label }]}
                returnKeyType={structuredReview ? 'default' : 'done'}
                onSubmitEditing={structuredReview ? undefined : handleSave}
                accessibilityLabel="Quick capture"
              />
              {input.trim() ? (
                <Pressable onPress={handleSave} style={[styles.captureSave, { backgroundColor: p.graphite }]}>
                  <OneIcon name={icons.check} size={13} color={p.dark ? '#111113' : '#FFFFFF'} />
                </Pressable>
              ) : <OneIcon name={icons.more} size={15} color={p.tertiary} />}
            </View>
            <View style={[styles.captureDivider, { backgroundColor: p.separator }]} />
            <View style={styles.quickActions}>
              <QuickAction label="Scan" icon={icons.scan} onPress={() => router.push('/scan')} />
              <QuickAction label="Link" icon={icons.link} onPress={() => focusCapture('https://')} />
              <QuickAction label="Note" icon={icons.note} onPress={() => focusCapture('')} />
              <QuickAction label="Share" icon={icons.upload} onPress={() => router.push('/share')} last />
            </View>
          </V5Group>
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
                  <View style={styles.draftButton}><NeverChromeButton label="Save to NEVER" icon={icons.check} onPress={handleSave} /></View>
                </>
              ) : (
                <View style={styles.reviewEditor}>
                  <CaptureReviewEditor draft={draft} onChange={setReviewedDraft} showExtractedText={false} />
                  <NeverChromeButton label="Save to NEVER" icon={icons.check} onPress={handleSave} disabled={!draft.title.trim()} />
                </View>
              )}
            </V5Group>
          </View>
        ) : null}

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
              <RecentRow key={item.id} item={item} last={index === recentItems.length - 1} />
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

  function QuickAction({ label, icon, onPress, last = false }: { label: string; icon: (typeof icons)[keyof typeof icons]; onPress: () => void; last?: boolean }) {
    return (
      <Pressable
        onPress={async () => { await Haptics.selectionAsync(); onPress(); }}
        style={({ pressed }) => [styles.quickAction, !last && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: p.separator }, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
      >
        <OneIcon name={icon} size={15} color={p.chrome} />
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

  function RecentRow({ item, last }: { item: OneItem; last: boolean }) {
    const preview = imagePreviewUri(item);
    return (
      <Pressable onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.recentRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
        <View style={[styles.recentThumb, { backgroundColor: p.fillSoft }]}>
          {preview ? <Image source={{ uri: preview }} style={styles.recentImage} resizeMode="cover" /> : <OneIcon name={iconForRecent(item)} size={18} color={p.chrome} />}
        </View>
        <View style={[styles.recentContent, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.recentTitle, { color: p.label }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.recentSubtitle, { color: p.secondary }]} numberOfLines={1}>{[item.userContext, item.summary, item.merchant, item.category].find(Boolean) || 'Saved memory'}</Text>
          </View>
          <Text style={[styles.recentDate, { color: p.tertiary }]}>{formatRelative(item.updatedAt)}</Text>
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
function iconForRecent(item: OneItem) {
  if (item.type === 'link') return icons.link;
  if (item.type === 'document') return icons.document;
  if (item.type === 'idea') return icons.idea;
  if (item.type === 'reminder') return icons.reminder;
  return icons.note;
}
function imagePreviewUri(item: OneItem) {
  const candidate = item.localAttachmentUri || item.imageUrl;
  return candidate && /^(file|content|ph|https?):\/\//i.test(candidate) ? candidate : undefined;
}
function formatRelative(iso: string) {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}
function labelForKind(kind: string) { return kind.charAt(0).toUpperCase() + kind.slice(1); }
function sortUpdated(a: OneItem, b: OneItem) { return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); }

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 118, gap: 18 },
  brandBar: { minHeight: 24, justifyContent: 'center' },
  askRow: { minHeight: 62, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  askIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  askCopy: { flex: 1, minWidth: 0 },
  askTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.12 },
  askSubtitle: { marginTop: 1, fontSize: 12.5, lineHeight: 16 },
  section: { gap: 7 },
  captureComposer: { minHeight: 56, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  capturePlus: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  captureInput: { flex: 1, minHeight: 46, fontSize: 16, lineHeight: 20, paddingVertical: 0 },
  captureSave: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  captureDivider: { height: StyleSheet.hairlineWidth, marginLeft: 12 },
  quickActions: { minHeight: 52, flexDirection: 'row' },
  quickAction: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', gap: 4 },
  quickActionLabel: { fontSize: 11.5, lineHeight: 14, fontWeight: '500' },
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
  recentRow: { minHeight: 64, paddingLeft: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentThumb: { width: 44, height: 44, borderRadius: 11, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  recentImage: { width: '100%', height: '100%' },
  recentContent: { flex: 1, minHeight: 64, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  recentTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  recentSubtitle: { marginTop: 1, fontSize: 12.5, lineHeight: 16 },
  recentDate: { fontSize: 11.5, lineHeight: 14 },
  emptyRow: { minHeight: 80, padding: 14, justifyContent: 'center' },
  emptyTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  emptyBody: { marginTop: 2, fontSize: 12.5, lineHeight: 16 }
});