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
import { NeverChromeButton, NeverGlass, NeverSectionLabel } from '@/src/ui/never';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { neverType } from '@/src/theme/typography';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function HomeV3() {
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
  const recentItems = [...items]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.heroShell, { shadowColor: '#000000' }]}>
          <View pointerEvents="none" style={styles.heroOrbLarge} />
          <View pointerEvents="none" style={styles.heroOrbSmall} />
          <View pointerEvents="none" style={styles.heroChromeLine} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroBrandRow}>
              <Text style={styles.heroWordmark}>NEVER</Text>
              <View style={styles.heroSignal}>
                <View style={styles.heroSignalLong} />
                <View style={styles.heroSignalShort} />
              </View>
            </View>
            <View style={styles.memoryStatus}>
              <View style={styles.statusDot} />
              <Text style={styles.memoryStatusText}>MEMORY READY</Text>
            </View>
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.heroGreeting}>{greetingFor(now)}{firstName ? `, ${firstName}` : ''}.</Text>
            <Text style={styles.heroTitle}>What do you need to remember?</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ask NEVER"
            onPress={() => router.push('/ask')}
            style={({ pressed }) => [styles.askConsole, { opacity: pressed ? 0.82 : 1, transform: [{ scale: pressed ? 0.992 : 1 }] }]}
          >
            <View style={styles.askConsoleIcon}><OneIcon name={icons.ask} size={16} color="#F5F7F9" /></View>
            <View style={styles.askConsoleCopy}>
              <Text style={styles.askConsoleTitle}>Ask NEVER</Text>
              <Text style={styles.askConsoleHint} numberOfLines={1}>Search your memory in natural language</Text>
            </View>
            <View style={styles.askConsoleAction}><OneIcon name={icons.chevron} size={13} color="#171B20" /></View>
          </Pressable>
        </View>

        <View style={[styles.capturePanel, { backgroundColor: dark ? '#14191EEB' : '#FAFBFC', borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
          <View pointerEvents="none" style={[styles.panelHighlight, { backgroundColor: theme.reflection }]} />
          <View style={styles.captureHeadingRow}>
            <View>
              <Text style={[styles.panelEyebrow, { color: theme.textTertiary }]}>QUICK CAPTURE</Text>
              <Text style={[styles.captureHeading, { color: theme.text }]}>Put it in memory.</Text>
            </View>
            <View style={[styles.readyPill, { backgroundColor: theme.platinumSoft, borderColor: theme.glassBorder }]}>
              <Text style={[styles.readyPillText, { color: theme.textSecondary }]}>AUTO ORGANIZE</Text>
            </View>
          </View>

          <View style={[styles.captureComposer, { backgroundColor: dark ? '#0D1115' : '#EEF1F3', borderColor: draft ? `${theme.success}70` : theme.border }]}>
            <View style={[styles.captureStart, { backgroundColor: dark ? '#20272E' : '#FFFFFF', borderColor: theme.glassBorder }]}>
              <OneIcon name={icons.plus} size={18} color={theme.chrome} />
            </View>
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
              <Pressable onPress={handleSave} style={({ pressed }) => [styles.captureSubmit, { backgroundColor: theme.chrome, opacity: pressed ? 0.75 : 1 }]}>
                <OneIcon name={icons.check} size={14} color={dark ? '#07090B' : '#FFFFFF'} />
              </Pressable>
            ) : (
              <View style={styles.captureMore}><OneIcon name={icons.more} size={16} color={theme.textTertiary} /></View>
            )}
          </View>

          <View style={styles.quickGrid}>
            <QuickAction label="Scan" caption="Paper & image" icon={icons.scan} primary onPress={() => router.push('/scan')} />
            <QuickAction label="Link" caption="Paste URL" icon={icons.link} onPress={() => focusCapture('https://')} />
            <QuickAction label="Note" caption="Write freely" icon={icons.note} onPress={() => focusCapture('')} />
            <QuickAction label="Share" caption="Import anything" icon={icons.upload} onPress={() => router.push('/share')} />
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
                  <View style={styles.interpretationCopy}>
                    <Text style={[styles.interpretationTitle, { color: theme.text }]} numberOfLines={2}>{draft.title}</Text>
                    <Text style={[styles.interpretationMeta, { color: theme.textSecondary }]}>{labelForKind(draft.canonicalKind)} · Inbox first</Text>
                  </View>
                </View>
                <View style={styles.interpretationAction}><NeverChromeButton label="Capture to NEVER" icon={icons.check} onPress={handleSave} /></View>
              </NeverGlass>
            ) : (
              <View style={styles.structuredReview}>
                <CaptureReviewEditor draft={draft} onChange={setReviewedDraft} showExtractedText={false} />
                <NeverChromeButton label="Capture to NEVER" icon={icons.check} onPress={handleSave} disabled={!draft.title.trim()} />
              </View>
            )}
          </View>
        ) : null}

        {todayEntries.length ? (
          <View style={styles.section}>
            <NeverSectionLabel meta={`${todayEntries.length} in focus`}>Today</NeverSectionLabel>
            <View style={[styles.todayPanel, { backgroundColor: dark ? '#11161AE6' : '#F9FAFB', borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
              <View style={[styles.timelineRail, { backgroundColor: theme.platinum }]} />
              {todayEntries.map(({ item, reason }, index) => (
                <TodayRow key={item.id} item={item} reason={todayReasonLabel(reason)} last={index === todayEntries.length - 1} />
              ))}
            </View>
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
          <Pressable onPress={() => router.push('/(tabs)/saved')} hitSlop={8} style={styles.inlineLink}>
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
            <Pressable onPress={() => router.push('/inbox')} hitSlop={8} style={styles.inlineLink}>
              <Text style={[styles.inlineLinkText, { color: theme.textSecondary }]}>Open inbox</Text>
              <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );

  function QuickAction({ label, caption, icon, primary = false, onPress }: { label: string; caption: string; icon: (typeof icons)[keyof typeof icons]; primary?: boolean; onPress: () => void }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={async () => { await Haptics.selectionAsync(); onPress(); }}
        style={({ pressed }) => [
          styles.quickAction,
          {
            backgroundColor: primary ? (dark ? '#E4E8EC' : '#161B20') : (dark ? '#1A2026' : '#F1F3F5'),
            borderColor: primary ? (dark ? '#FFFFFF66' : '#21272D') : theme.border,
            opacity: pressed ? 0.72 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }]
          }
        ]}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: primary ? (dark ? '#11161B' : '#FFFFFF18') : (dark ? '#262D34' : '#FFFFFF'), borderColor: primary ? '#FFFFFF22' : theme.glassBorder }]}>
          <OneIcon name={icon} size={16} color={primary ? (dark ? '#F5F7F9' : '#F5F7F9') : theme.chrome} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.quickActionLabel, { color: primary ? (dark ? '#0B0E11' : '#FFFFFF') : theme.text }]}>{label}</Text>
          <Text style={[styles.quickActionCaption, { color: primary ? (dark ? '#44505A' : '#AEB6BE') : theme.textTertiary }]}>{caption}</Text>
        </View>
        <OneIcon name={icons.chevron} size={11} color={primary ? (dark ? '#4A5661' : '#C9CFD5') : theme.textTertiary} />
      </Pressable>
    );
  }

  function RecentMemory({ item }: { item: OneItem }) {
    const preview = imagePreviewUri(item);
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.recentPressable, { opacity: pressed ? 0.76 : 1, transform: [{ scale: pressed ? 0.992 : 1 }] }]}>
        <View style={[styles.recentCard, { backgroundColor: dark ? '#151A1FEF' : '#FAFBFC', borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
          <View style={[styles.recentVisual, { backgroundColor: theme.fill }]}>
            {preview ? <Image source={{ uri: preview }} style={styles.recentImage} resizeMode="cover" /> : <View style={styles.recentPlaceholder}><OneIcon name={iconForRecent(item)} size={27} color={theme.platinum} /></View>}
          </View>
          <View style={styles.recentCopy}>
            <View style={[styles.recentBadge, { backgroundColor: theme.platinumSoft, borderColor: theme.glassBorder }]}><Text style={[styles.recentBadgeText, { color: theme.textSecondary }]}>{item.type.toUpperCase()}</Text></View>
            <Text style={[styles.recentTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.recentMeta, { color: theme.textSecondary }]} numberOfLines={2}>{[item.userContext, item.summary, item.merchant, item.category].find(Boolean) || 'Saved memory'}</Text>
            <View style={styles.recentFooter}><Text style={[styles.recentDate, { color: theme.textTertiary }]}>{formatRelative(item.updatedAt)}</Text><View style={[styles.recentArrow, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.chevron} size={11} color={theme.chrome} /></View></View>
          </View>
        </View>
      </Pressable>
    );
  }

  function TodayRow({ item, reason, last }: { item: OneItem; reason: string; last: boolean }) {
    const activeInbox = isInboxActive(item, now);
    const overdue = reason === 'Overdue';
    const detail = [item.location, item.summary].filter(Boolean).join(' · ') || reason;
    const timeLabel = item.time || (overdue ? 'Past' : reason);
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={`${reason}. ${item.title}`} onPress={() => router.push({ pathname: activeInbox ? '/inbox/[id]' : '/item/[id]', params: { id: item.id } } as never)} style={({ pressed }) => [styles.todayRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }, { opacity: pressed ? 0.62 : 1 }]}>
        <View style={styles.todayIndex}><View style={[styles.todayDot, { backgroundColor: overdue ? theme.warning : theme.chrome }]} /></View>
        <View style={styles.todayCopy}>
          <View style={styles.todayTopLine}><Text style={[styles.todayTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text><Text style={[styles.todayTime, { color: overdue ? theme.warning : theme.textTertiary }]}>{timeLabel}</Text></View>
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
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 132, gap: 18 },
  heroShell: { minHeight: 365, borderRadius: 32, backgroundColor: '#11161B', padding: 22, paddingTop: 19, overflow: 'hidden', shadowOpacity: 0.24, shadowRadius: 30, shadowOffset: { width: 0, height: 15 }, elevation: 8 },
  heroOrbLarge: { position: 'absolute', width: 260, height: 260, borderRadius: 130, right: -120, top: -130, backgroundColor: '#FFFFFF0A', borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF12' },
  heroOrbSmall: { position: 'absolute', width: 120, height: 120, borderRadius: 60, right: 28, bottom: -65, backgroundColor: '#C7D0D910' },
  heroChromeLine: { position: 'absolute', left: 36, right: 36, top: 0, height: 1, backgroundColor: '#FFFFFF72' },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  heroWordmark: { color: '#F7F8FA', fontSize: 15.5, lineHeight: 20, fontWeight: '800', letterSpacing: 5.2 },
  heroSignal: { flexDirection: 'row', gap: 3, alignItems: 'center' },
  heroSignalLong: { width: 20, height: 3, borderRadius: 2, backgroundColor: '#E5E9ED' },
  heroSignalShort: { width: 7, height: 3, borderRadius: 2, backgroundColor: '#7D8893' },
  memoryStatus: { minHeight: 25, paddingHorizontal: 9, borderRadius: 13, backgroundColor: '#FFFFFF0B', borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF1D', flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#DCE2E7' },
  memoryStatusText: { color: '#929DA7', fontSize: 7, fontWeight: '800', letterSpacing: 0.9 },
  heroCopy: { marginTop: 40 },
  heroGreeting: { color: '#8F99A3', fontSize: 11, lineHeight: 15, fontWeight: '600' },
  heroTitle: { marginTop: 9, maxWidth: 530, color: '#F7F8FA', fontSize: 37, lineHeight: 40, fontWeight: '750', letterSpacing: -1.45 },
  askConsole: { minHeight: 69, marginTop: 30, borderRadius: 21, backgroundColor: '#FFFFFF0B', borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF26', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  askConsoleIcon: { width: 40, height: 40, borderRadius: 15, backgroundColor: '#FFFFFF0C', borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF22', alignItems: 'center', justifyContent: 'center' },
  askConsoleCopy: { flex: 1 },
  askConsoleTitle: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700', letterSpacing: -0.2 },
  askConsoleHint: { color: '#8D98A3', marginTop: 3, fontSize: 10.5, lineHeight: 14 },
  askConsoleAction: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E7EBEE', alignItems: 'center', justifyContent: 'center' },
  capturePanel: { borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 17, overflow: 'hidden', shadowOpacity: 0.11, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 5 },
  panelHighlight: { position: 'absolute', top: 0, left: 30, right: 30, height: StyleSheet.hairlineWidth },
  captureHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  panelEyebrow: { ...neverType.eyebrow },
  captureHeading: { marginTop: 5, fontSize: 19, lineHeight: 23, fontWeight: '750', letterSpacing: -0.45 },
  readyPill: { minHeight: 25, paddingHorizontal: 9, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  readyPillText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.75 },
  captureComposer: { minHeight: 58, marginTop: 15, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  captureStart: { width: 39, height: 39, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 46, fontSize: 14.5, lineHeight: 19 },
  captureSubmit: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  captureMore: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  quickGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickAction: { width: '48.7%', minHeight: 69, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  quickActionIcon: { width: 36, height: 36, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 12.5, lineHeight: 16, fontWeight: '700' },
  quickActionCaption: { marginTop: 2, fontSize: 8.5, lineHeight: 11 },
  section: { gap: 9 },
  interpretationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  interpretationGlyph: { width: 40, height: 40, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  interpretationCopy: { flex: 1 },
  interpretationTitle: { ...neverType.bodyStrong, fontSize: 14.5 },
  interpretationMeta: { ...neverType.caption, marginTop: 3 },
  interpretationAction: { marginTop: 16 },
  structuredReview: { gap: 12 },
  todayPanel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 25, paddingHorizontal: 14, overflow: 'hidden', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 3, position: 'relative' },
  timelineRail: { position: 'absolute', left: 24, top: 25, bottom: 25, width: 1, opacity: 0.38 },
  todayRow: { minHeight: 72, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  todayIndex: { width: 21, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  todayDot: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5, borderColor: '#FFFFFF' },
  todayCopy: { flex: 1 },
  todayTopLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  todayTitle: { flex: 1, ...neverType.bodyStrong, fontSize: 13.7 },
  todayTime: { fontSize: 8.7, fontWeight: '700', letterSpacing: 0.15 },
  todayMeta: { ...neverType.caption, marginTop: 4 },
  recentPressable: { borderRadius: 25 },
  recentCard: { minHeight: 164, borderRadius: 25, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', flexDirection: 'row', shadowOpacity: 0.1, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  recentVisual: { width: '39%', minHeight: 164, alignItems: 'center', justifyContent: 'center' },
  recentImage: { width: '100%', height: '100%' },
  recentPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  recentCopy: { flex: 1, paddingHorizontal: 16, paddingVertical: 15, justifyContent: 'center' },
  recentBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth },
  recentBadgeText: { fontSize: 7, fontWeight: '800', letterSpacing: 0.75 },
  recentTitle: { marginTop: 11, ...neverType.section, fontSize: 16.5, lineHeight: 20 },
  recentMeta: { ...neverType.body, marginTop: 4, fontSize: 12.2, lineHeight: 17 },
  recentFooter: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recentDate: { ...neverType.caption, fontWeight: '600' },
  recentArrow: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  inlineLink: { minHeight: 28, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 1 },
  inlineLinkText: { ...neverType.caption, fontWeight: '700' },
  emptyTitle: { ...neverType.bodyStrong },
  emptyBody: { ...neverType.caption, marginTop: 4 }
});
