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
import { neverSpacing, neverType, pass3 } from '@/src/theme/tokens';
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
  V5Group,
  V5SectionHeader,
  V5Wordmark,
  V5IconButton,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function HomeV5() {
  const p = useNeverV5Palette();
  const archive = p.archiveControls;
  const recall = archive ?? pass3;
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
        contentContainerStyle={[p.pageStyle, styles.content]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
        <View style={styles.brandBar}>
          <V5Wordmark />
          <V5IconButton quiet icon={icons.person} accessibilityLabel="Open your settings" onPress={() => router.push('/(tabs)/settings')} />
        </View>

        <View style={styles.heroCopy}>
          <Text style={[styles.eyebrow, p.environmentText]}>YOUR MEMORY</Text>
          <Text accessibilityRole="header" style={[styles.heroTitle, p.pass3Heading, p.environmentText]}>
            {`${greetingFor(now)}${firstName ? `,\n${firstName}.` : '.'}`}
          </Text>
          <Text style={[styles.heroSubtitle, p.environmentText]}>
            Everything worth remembering, ready when you need it.
          </Text>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Ask NEVER" onPress={() => router.push('/ask')}
          style={({ pressed }) => [styles.askHero, { backgroundColor: recall.recall }, { opacity: pressed ? 0.86 : 1 }]}>
          <View style={styles.askTop}>
            <View style={[styles.askGlyph, { backgroundColor: recall.glyph }]}><OneIcon name={icons.ask} size={19} color={recall.recall} /></View>
            <Text style={[styles.askMeta, { color: recall.recallSecondary }]}>RECALL WITH NEVER</Text>
          </View>
          <Text style={[styles.askTitle, { color: recall.onRecall }]}>Ask anything you’ve saved.</Text>
          <Text style={[styles.askBody, { color: recall.recallSecondary }]}>People, places, links, notes, plans — describe what you remember.</Text>
          <View style={styles.askAction}>
            <Text style={[styles.askActionText, { color: recall.onRecall }]}>Ask NEVER</Text>
            <OneIcon name={icons.chevron} size={13} color={recall.recallSecondary} />
          </View>
        </Pressable>

        <View style={styles.captureStage}>
          <NeverMaterial role="input" shape="capsule" tintColor={archive?.captureTint}
            style={[styles.captureControls, archive && { backgroundColor: p.reduceTransparency ? archive.captureOpaque : archive.capture, borderColor: archive.captureBorder }]}>
            <View style={styles.captureComposer}>
              <Pressable
                onPress={() => focusCapture()}
                accessibilityRole="button"
                accessibilityLabel="Start a capture"
                style={[styles.capturePlus, { backgroundColor: primaryAction.background }]}
              >
                <OneIcon name={icons.plus} size={20} color={primaryAction.foreground} />
              </Pressable>
              <NeverInput
                ref={captureRef}
                value={input}
                onChangeText={(value) => { setInput(value); setReviewedDraft(null); setCaptureStatus(''); }}
                editable={!saving}
                placeholder="Capture something…"
                placeholderTextColor={archive?.onRecall ?? p.tertiary}
                style={[styles.captureInput, { color: archive?.onRecall ?? p.label }]}
                returnKeyType={structuredReview ? 'default' : 'done'}
                onSubmitEditing={structuredReview ? undefined : handleSave}
                accessibilityLabel="Quick capture"
              />
              {saving ? <ActivityIndicator accessibilityLabel="Saving capture" accessibilityState={{ busy: true }} color={archive?.onRecall ?? p.chrome} /> : input.trim() ? (
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
          </NeverMaterial>
          {captureStatus ? <Text accessibilityLiveRegion="polite" style={[styles.captureStatus, p.environmentText]}>{captureStatus}</Text> : null}
        </View>

        <View style={styles.quickActions}>
          <QuickAction label="Scan" icon={icons.scan} onPress={() => router.push('/scan')} />
          <QuickAction label="Link" icon={icons.link} onPress={() => focusCapture('https://')} />
          <QuickAction label="Share" icon={icons.upload} onPress={() => router.push('/share')} />
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

        {todayEntries.length ? (
          <View style={styles.section}>
            <V5SectionHeader title="Today" meta={`${todayEntries.length}`} />
            <View>
              {todayEntries.map(({ item, reason }) => (
                <TodayRow key={item.id} item={item} reason={todayReasonLabel(reason)} />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <V5SectionHeader
            title="Recent memory"
            action={recentItems.length ? (
              <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/saved')} style={styles.seeAllTarget}>
                <Text style={[styles.seeAll, p.environmentText]}>See All</Text>
              </Pressable>
            ) : undefined}
          />
          {recentItems.length ? (
            <View>
              {recentItems.map((item, index) => <MemoryRow floating key={item.id} item={item} last={index === recentItems.length - 1} />)}
            </View>
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
      <View style={[styles.actionIcon, { backgroundColor: p.archiveControls?.action ?? p.inputStyle.backgroundColor }]}>
        <OneIcon name={icon} size={16} color={p.archiveControls?.actionInk ?? p.chrome} />
      </View>
      <Text style={[styles.quickActionLabel, p.environmentText]}>{label}</Text>
    </Pressable>
  );
}

function TodayRow({ item, reason }: { item: OneItem; reason: string }) {
  const activeInbox = isInboxActive(item, new Date());
  const detail = [item.location, item.summary !== item.title ? item.summary : undefined].filter(Boolean).join(' · ');
  const status = [item.time, reason].filter(Boolean).join(' · ');
  return <MemoryRow floating item={item} status={status} subtitle={detail || undefined}
    onPress={() => router.push({ pathname: activeInbox ? '/inbox/[id]' : '/item/[id]', params: { id: item.id } } as never)} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 126,
    gap: 20
  },
  brandBar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroCopy: { paddingTop: 30, paddingBottom: 28, maxWidth: 355 },
  eyebrow: { fontSize: 11, lineHeight: 16, fontWeight: '600', letterSpacing: 1.5 },
  heroTitle: { marginTop: 8, fontFamily: neverType.hero.fontFamily },
  heroSubtitle: { maxWidth: 320, fontSize: 16, lineHeight: 23, letterSpacing: -0.15, marginTop: 12 },
  captureStage: { marginTop: 14, gap: 8 },
  captureControls: { paddingHorizontal: 8 },
  captureComposer: {
    minHeight: 58,
    paddingHorizontal: 0,
    borderRadius: 21,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    overflow: 'hidden'
  },
  capturePlus: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  captureInput: { flex: 1, minHeight: 46, fontSize: 15.5, lineHeight: 20, paddingVertical: 0 },
  captureSave: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickActions: { flexWrap: 'wrap', flexDirection: 'row', gap: 26, paddingHorizontal: 6, paddingTop: 14, paddingBottom: 8 },
  quickAction: { width: 44, minHeight: 44, alignItems: 'center', gap: 6 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { maxWidth: '100%', textAlign: 'center', fontSize: 12, lineHeight: 17, fontWeight: '600' },
  captureStatus: { ...neverType.caption },
  section: { marginTop: 32, gap: neverSpacing.md },
  draftGroup: { padding: 13 },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  draftIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  draftTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  draftMeta: { marginTop: 1, fontSize: 12.5, lineHeight: 16 },
  draftButton: { marginTop: 12 },
  reviewEditor: { gap: 10 },
  askHero: { backgroundColor: pass3.recall, borderRadius: pass3.heroRadius, padding: 22, minHeight: 224, justifyContent: 'space-between' },
  askTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  askGlyph: { width: 38, height: 38, borderRadius: 19, backgroundColor: pass3.glyph, alignItems: 'center', justifyContent: 'center' },
  askMeta: { color: pass3.recallSecondary, fontSize: 11, letterSpacing: 1.15, fontWeight: '700', flexShrink: 1 },
  askTitle: { color: pass3.onRecall, fontSize: 28, lineHeight: 31, letterSpacing: -0.8, fontWeight: '600', marginTop: 26, maxWidth: 280 },
  askBody: { color: pass3.recallSecondary, fontSize: 14, lineHeight: 20, maxWidth: 290, marginTop: 8 },
  askAction: { marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  askActionText: { color: pass3.onRecall, fontSize: 15, fontWeight: '600' },
  seeAllTarget: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' },
  seeAll: { fontSize: 13, lineHeight: 17, fontWeight: '600' },
  emptyRow: { minHeight: 86, padding: 15, justifyContent: 'center' },
  emptyTitle: { fontSize: 15.5, lineHeight: 19, fontWeight: '600' },
  emptyBody: { marginTop: 2, fontSize: 12.5, lineHeight: 16 }
});
