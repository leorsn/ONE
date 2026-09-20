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
import { NeverChromeButton, NeverGlass, NeverSectionLabel, NeverWordmark } from '@/src/ui/never';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { neverType } from '@/src/theme/typography';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function HomeV4() {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
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
  const recentItems = [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
  const recentItem = recentItems[0];
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <NeverWordmark />
          <View style={[styles.statusPill, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.chrome }]} />
            <Text style={[styles.statusText, { color: theme.textTertiary }]}>READY</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={[styles.greeting, { color: theme.textTertiary }]}>{greetingFor(now)}{firstName ? `, ${firstName}` : ''}.</Text>
          <Text style={[styles.heroTitle, { color: theme.text }]}>What do you need to remember?</Text>
          <Text style={[styles.heroBody, { color: theme.textSecondary }]}>Capture it once. NEVER keeps the context ready when you need it again.</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ask NEVER"
          onPress={() => router.push('/ask')}
          style={({ pressed }) => [
            styles.askBar,
            {
              backgroundColor: dark ? '#E9EDF0' : '#171B20',
              borderColor: dark ? '#FFFFFFAA' : '#2A3036',
              opacity: pressed ? 0.82 : 1,
              transform: [{ scale: pressed ? 0.992 : 1 }]
            }
          ]}
        >
          <View style={[styles.askGlyph, { backgroundColor: dark ? '#171B20' : '#FFFFFF12' }]}>
            <OneIcon name={icons.ask} size={15} color={dark ? '#F6F8F9' : '#F6F8F9'} />
          </View>
          <View style={styles.askCopy}>
            <Text style={[styles.askTitle, { color: dark ? '#11161B' : '#FFFFFF' }]}>Ask NEVER</Text>
            <Text style={[styles.askHint, { color: dark ? '#5E6872' : '#A5AFB8' }]}>Search your saved memory in natural language</Text>
          </View>
          <View style={[styles.askArrow, { backgroundColor: dark ? '#D7DDE2' : '#EEF1F3' }]}>
            <OneIcon name={icons.chevron} size={11.5} color="#171B20" />
          </View>
        </Pressable>

        <View style={[styles.captureCard, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
          <View style={styles.captureHeader}>
            <View>
              <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>QUICK CAPTURE</Text>
              <Text style={[styles.captureTitle, { color: theme.text }]}>Save something</Text>
            </View>
            <Text style={[styles.autoLabel, { color: theme.textTertiary }]}>AUTO ORGANIZE</Text>
          </View>

          <View style={[styles.composer, { backgroundColor: dark ? '#11161B' : '#F2F4F6', borderColor: draft ? `${theme.success}70` : theme.border }]}>
            <Pressable onPress={() => focusCapture()} style={[styles.plusButton, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}>
              <OneIcon name={icons.plus} size={17} color={theme.chrome} />
            </Pressable>
            <TextInput
              ref={captureRef}
              value={input}
              onChangeText={(value) => { setInput(value); setReviewedDraft(null); }}
              placeholder="Remember something…"
              placeholderTextColor={theme.textTertiary}
              style={[styles.input, { color: theme.text }]}
              returnKeyType={structuredReview ? 'default' : 'done'}
              onSubmitEditing={structuredReview ? undefined : handleSave}
              accessibilityLabel="Quick capture"
            />
            {input.trim() ? (
              <Pressable onPress={handleSave} style={[styles.saveButton, { backgroundColor: theme.chrome }]}>
                <OneIcon name={icons.check} size={14} color={theme.background} />
              </Pressable>
            ) : <OneIcon name={icons.more} size={16} color={theme.textTertiary} />}
          </View>

          <View style={styles.actionsRow}>
            <Action label="Scan" icon={icons.scan} onPress={() => router.push('/scan')} />
            <Action label="Link" icon={icons.link} onPress={() => focusCapture('https://')} />
            <Action label="Note" icon={icons.note} onPress={() => focusCapture('')} />
            <Action label="Share" icon={icons.upload} onPress={() => router.push('/share')} />
          </View>
        </View>

        {draft ? (
          <View style={styles.section}>
            <NeverSectionLabel meta={draft.overallConfidence.toUpperCase()}>NEVER understood</NeverSectionLabel>
            {!structuredReview ? (
              <NeverGlass padded tone="strong">
                <View style={styles.interpretationRow}>
                  <View style={[styles.interpretationGlyph, { backgroundColor: theme.platinumSoft, borderColor: theme.border }]}>
                    <OneIcon name={iconForDraft(draft)} size={17} color={theme.chrome} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.interpretationTitle, { color: theme.text }]} numberOfLines={2}>{draft.title}</Text>
                    <Text style={[styles.interpretationMeta, { color: theme.textSecondary }]}>{labelForKind(draft.canonicalKind)} · Inbox first</Text>
                  </View>
                </View>
                <View style={{ marginTop: 14 }}><NeverChromeButton label="Capture to NEVER" icon={icons.check} onPress={handleSave} /></View>
              </NeverGlass>
            ) : (
              <View style={{ gap: 12 }}>
                <CaptureReviewEditor draft={draft} onChange={setReviewedDraft} showExtractedText={false} />
                <NeverChromeButton label="Capture to NEVER" icon={icons.check} onPress={handleSave} disabled={!draft.title.trim()} />
              </View>
            )}
          </View>
        ) : null}

        {todayEntries.length ? (
          <View style={styles.section}>
            <NeverSectionLabel meta={`${todayEntries.length}`}>Today</NeverSectionLabel>
            <NeverGlass tone="quiet">
              {todayEntries.map(({ item, reason }, index) => (
                <TodayRow key={item.id} item={item} reason={todayReasonLabel(reason)} last={index === todayEntries.length - 1} />
              ))}
            </NeverGlass>
          </View>
        ) : null}

        <View style={styles.section}>
          <NeverSectionLabel meta={recentItems.length ? `${recentItems.length} saved` : undefined}>Recent memory</NeverSectionLabel>
          {recentItem ? <RecentMemory item={recentItem} /> : (
            <NeverGlass padded tone="quiet">
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Your memory starts here.</Text>
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Capture, scan or share something to NEVER.</Text>
            </NeverGlass>
          )}
          <Pressable onPress={() => router.push('/(tabs)/saved')} style={styles.inlineLink}>
            <Text style={[styles.inlineLinkText, { color: theme.textSecondary }]}>Open memory library</Text>
            <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
          </Pressable>
        </View>

        {inboxItems.length ? (
          <View style={styles.section}>
            <NeverSectionLabel meta={`${inboxItems.length}`}>Needs review</NeverSectionLabel>
            <NeverGlass tone="quiet">
              {inboxItems.map((item) => (
                <TriageRow key={item.id} item={item} onOpen={() => router.push({ pathname: '/inbox/[id]', params: { id: item.id } })} onExecute={(action) => executeAction(item, action)} />
              ))}
            </NeverGlass>
            <Pressable onPress={() => router.push('/inbox')} style={styles.inlineLink}>
              <Text style={[styles.inlineLinkText, { color: theme.textSecondary }]}>Open inbox</Text>
              <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );

  function Action({ label, icon, onPress }: { label: string; icon: (typeof icons)[keyof typeof icons]; onPress: () => void }) {
    return (
      <Pressable onPress={async () => { await Haptics.selectionAsync(); onPress(); }} style={({ pressed }) => [styles.action, { backgroundColor: dark ? '#171C21' : '#F4F6F7', borderColor: theme.border, opacity: pressed ? 0.65 : 1 }]}>
        <OneIcon name={icon} size={15} color={theme.chrome} />
        <Text style={[styles.actionText, { color: theme.textSecondary }]}>{label}</Text>
      </Pressable>
    );
  }

  function RecentMemory({ item }: { item: OneItem }) {
    const preview = imagePreviewUri(item);
    return (
      <Pressable onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.memoryCard, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, shadowColor: theme.shadow, opacity: pressed ? 0.76 : 1 }]}>
        <View style={[styles.memoryThumb, { backgroundColor: theme.fill }]}>
          {preview ? <Image source={{ uri: preview }} style={styles.memoryImage} resizeMode="cover" /> : <OneIcon name={iconForRecent(item)} size={22} color={theme.platinum} />}
        </View>
        <View style={styles.memoryCopy}>
          <View style={styles.memoryTopLine}>
            <Text style={[styles.memoryTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.memoryType, { color: theme.textTertiary }]}>{item.type.toUpperCase()}</Text>
          </View>
          <Text style={[styles.memoryMeta, { color: theme.textSecondary }]} numberOfLines={1}>{[item.userContext, item.summary, item.merchant, item.category].find(Boolean) || 'Saved memory'}</Text>
          <Text style={[styles.memoryDate, { color: theme.textTertiary }]}>{formatRelative(item.updatedAt)}</Text>
        </View>
        <View style={[styles.memoryArrow, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.chevron} size={11} color={theme.chrome} /></View>
      </Pressable>
    );
  }

  function TodayRow({ item, reason, last }: { item: OneItem; reason: string; last: boolean }) {
    const activeInbox = isInboxActive(item, now);
    const overdue = reason === 'Overdue';
    const detail = [item.location, item.summary].filter(Boolean).join(' · ') || reason;
    const timeLabel = item.time || (overdue ? 'Past' : reason);
    return (
      <Pressable onPress={() => router.push({ pathname: activeInbox ? '/inbox/[id]' : '/item/[id]', params: { id: item.id } } as never)} style={({ pressed }) => [styles.todayRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }, { opacity: pressed ? 0.62 : 1 }]}>
        <View style={[styles.todayMarker, { backgroundColor: overdue ? theme.warning : theme.chrome }]} />
        <View style={{ flex: 1 }}>
          <View style={styles.todayTitleRow}>
            <Text style={[styles.todayTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.todayTime, { color: overdue ? theme.warning : theme.textTertiary }]}>{timeLabel}</Text>
          </View>
          <Text style={[styles.todayMeta, { color: theme.textSecondary }]} numberOfLines={1}>{detail}</Text>
        </View>
        <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
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
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 112, gap: 22 },
  headerRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { height: 27, paddingHorizontal: 10, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 7.5, fontWeight: '800', letterSpacing: 1.05 },
  hero: { paddingTop: 7, paddingRight: 16 },
  greeting: { ...neverType.caption, fontWeight: '600', marginBottom: 7 },
  heroTitle: { maxWidth: 540, fontSize: 35, lineHeight: 39, fontWeight: '700', letterSpacing: -1.2 },
  heroBody: { maxWidth: 480, marginTop: 10, fontSize: 13.2, lineHeight: 19 },
  askBar: { minHeight: 64, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  askGlyph: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  askCopy: { flex: 1, minWidth: 0 },
  askTitle: { fontSize: 14.2, lineHeight: 18, fontWeight: '700' },
  askHint: { marginTop: 2, fontSize: 10.4, lineHeight: 14 },
  askArrow: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  captureCard: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 15, shadowOpacity: 0.08, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
  captureHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  eyebrow: { ...neverType.eyebrow },
  captureTitle: { marginTop: 4, fontSize: 17.5, lineHeight: 21, fontWeight: '700', letterSpacing: -0.35 },
  autoLabel: { fontSize: 7.3, fontWeight: '800', letterSpacing: 0.95 },
  composer: { minHeight: 54, marginTop: 13, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  plusButton: { width: 36, height: 36, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 44, fontSize: 14.2, lineHeight: 19 },
  saveButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { marginTop: 11, flexDirection: 'row', gap: 7 },
  action: { flex: 1, minHeight: 42, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionText: { fontSize: 9.8, lineHeight: 12, fontWeight: '700' },
  section: { gap: 9 },
  interpretationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  interpretationGlyph: { width: 40, height: 40, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  interpretationTitle: { ...neverType.bodyStrong, fontSize: 14.5 },
  interpretationMeta: { ...neverType.caption, marginTop: 3 },
  todayRow: { minHeight: 63, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  todayMarker: { width: 5, height: 5, borderRadius: 3 },
  todayTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayTitle: { flex: 1, fontSize: 13.7, lineHeight: 17, fontWeight: '700' },
  todayTime: { fontSize: 8.8, lineHeight: 11, fontWeight: '700' },
  todayMeta: { marginTop: 3, fontSize: 10.5, lineHeight: 14 },
  memoryCard: { minHeight: 92, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowOpacity: 0.07, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  memoryThumb: { width: 70, height: 70, borderRadius: 17, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  memoryImage: { width: '100%', height: '100%' },
  memoryCopy: { flex: 1, minWidth: 0 },
  memoryTopLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memoryTitle: { flex: 1, fontSize: 14.3, lineHeight: 18, fontWeight: '700' },
  memoryType: { fontSize: 7.1, fontWeight: '800', letterSpacing: 0.7 },
  memoryMeta: { marginTop: 4, fontSize: 11, lineHeight: 14 },
  memoryDate: { marginTop: 5, fontSize: 9.3, lineHeight: 12, fontWeight: '600' },
  memoryArrow: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  inlineLink: { minHeight: 28, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5 },
  inlineLinkText: { ...neverType.caption, fontWeight: '700' },
  emptyTitle: { ...neverType.bodyStrong },
  emptyBody: { ...neverType.caption, marginTop: 4 }
});