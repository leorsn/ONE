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
import {
  NeverChromeButton,
  NeverGlass,
  NeverSectionLabel,
  NeverWordmark
} from '@/src/ui/never';
import { useTheme } from '@/src/theme/useTheme';
import { neverType } from '@/src/theme/typography';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function InboxScreen() {
  const theme = useTheme();
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <NeverWordmark />
        </View>

        <View style={styles.hero}>
          <Text style={[styles.greeting, { color: theme.textTertiary }]}>
            {greetingFor(now)}{firstName ? `, ${firstName}` : ''}.
          </Text>
          <Text style={[styles.heroTitle, { color: theme.text }]}>What do you need to remember?</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ask NEVER"
          onPress={() => router.push('/ask')}
          style={({ pressed }) => [
            styles.askBar,
            {
              backgroundColor: theme.glassStrong,
              borderColor: theme.glassBorder,
              shadowColor: theme.shadow,
              opacity: pressed ? 0.78 : 1,
              transform: [{ scale: pressed ? 0.995 : 1 }]
            }
          ]}
        >
          <View style={[styles.askGlyph, { backgroundColor: theme.platinumSoft, borderColor: theme.glassBorder }]}>
            <OneIcon name={icons.ask} size={15} color={theme.chrome} />
          </View>
          <View style={styles.askCopy}>
            <Text style={[styles.askTitle, { color: theme.text }]}>Ask NEVER</Text>
            <Text style={[styles.askHint, { color: theme.textTertiary }]} numberOfLines={1}>
              What did I save today?
            </Text>
          </View>
          <View style={[styles.askAction, { borderColor: theme.border }]}>
            <OneIcon name={icons.chevron} size={11.5} color={theme.textSecondary} />
          </View>
          <View pointerEvents="none" style={[styles.reflection, { backgroundColor: theme.reflection }]} />
        </Pressable>

        <View style={styles.captureBlock}>
          <NeverSectionLabel meta="Text · link · reminder">Quick capture</NeverSectionLabel>
          <View style={[styles.captureComposer, { backgroundColor: theme.glass, borderColor: draft ? `${theme.success}66` : theme.glassBorder }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start a new capture"
              onPress={() => focusCapture()}
              style={styles.captureStart}
            >
              <OneIcon name={icons.plus} size={17} color={theme.chrome} />
            </Pressable>
            <TextInput
              ref={captureRef}
              value={input}
              onChangeText={(value) => {
                setInput(value);
                setReviewedDraft(null);
              }}
              placeholder="Remember something…"
              placeholderTextColor={theme.textTertiary}
              style={[styles.input, { color: theme.text }]}
              returnKeyType={structuredReview ? 'default' : 'done'}
              onSubmitEditing={structuredReview ? undefined : handleSave}
              accessibilityLabel="Quick capture"
            />
            {input.trim() ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save capture"
                onPress={handleSave}
                style={({ pressed }) => [styles.captureSubmit, { backgroundColor: theme.chrome, opacity: pressed ? 0.72 : 1 }]}
              >
                <OneIcon name={icons.check} size={14} color={theme.background} />
              </Pressable>
            ) : (
              <View style={styles.captureMore}>
                <OneIcon name={icons.more} size={16} color={theme.textTertiary} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.quickActions}>
          <QuickAction label="Scan" icon={icons.scan} primary onPress={() => router.push('/scan')} />
          <QuickAction label="Link" icon={icons.link} onPress={() => focusCapture('https://')} />
          <QuickAction label="Note" icon={icons.note} onPress={() => focusCapture('')} />
          <QuickAction label="Share" icon={icons.upload} onPress={() => router.push('/share')} />
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
                <View style={styles.interpretationAction}>
                  <NeverChromeButton label="Capture to NEVER" icon={icons.check} onPress={handleSave} />
                </View>
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
            <NeverSectionLabel meta={`${todayEntries.length}`}>Today</NeverSectionLabel>
            <View style={[styles.timeline, { borderColor: theme.border }]}>
              {todayEntries.map(({ item, reason }, index) => (
                <TodayRow
                  key={item.id}
                  item={item}
                  reason={todayReasonLabel(reason)}
                  last={index === todayEntries.length - 1}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <NeverSectionLabel meta={recentItems.length ? `${recentItems.length} saved` : undefined}>Recent memory</NeverSectionLabel>
          {recentItem ? (
            <RecentMemory item={recentItem} />
          ) : (
            <NeverGlass padded tone="quiet">
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Your memory starts here.</Text>
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Capture, scan or share something to NEVER.</Text>
            </NeverGlass>
          )}
          <Pressable onPress={() => router.push('/(tabs)/saved')} hitSlop={8} style={styles.inlineLink}>
            <Text style={[styles.inlineLinkText, { color: theme.textSecondary }]}>View all memories</Text>
            <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
          </Pressable>
        </View>

        {inboxItems.length ? (
          <View style={styles.section}>
            <NeverSectionLabel meta={`${inboxItems.length}`}>Needs review</NeverSectionLabel>
            <NeverGlass tone="quiet">
              {inboxItems.map((item) => (
                <TriageRow
                  key={item.id}
                  item={item}
                  onOpen={() => router.push({ pathname: '/inbox/[id]', params: { id: item.id } })}
                  onExecute={(action) => executeAction(item, action)}
                />
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

  function QuickAction({
    label,
    icon,
    primary = false,
    onPress
  }: {
    label: string;
    icon: (typeof icons)[keyof typeof icons];
    primary?: boolean;
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
          styles.quickAction,
          primary && [styles.quickActionPrimary, { backgroundColor: theme.platinumSoft, borderColor: theme.glassBorder }],
          { opacity: pressed ? 0.52 : 1 }
        ]}
      >
        <OneIcon name={icon} size={primary ? 15.5 : 14.5} color={primary ? theme.chrome : theme.textSecondary} />
        <Text style={[styles.quickActionLabel, { color: primary ? theme.text : theme.textSecondary }]}>{label}</Text>
      </Pressable>
    );
  }

  function RecentMemory({ item }: { item: OneItem }) {
    const preview = imagePreviewUri(item);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
        style={({ pressed }) => [styles.recentPressable, { opacity: pressed ? 0.76 : 1, transform: [{ scale: pressed ? 0.992 : 1 }] }]}
      >
        <NeverGlass tone="strong">
          <View style={[styles.recentVisual, { backgroundColor: theme.fill }]}>
            {preview ? (
              <Image source={{ uri: preview }} style={styles.recentImage} resizeMode="cover" />
            ) : (
              <View style={styles.recentPlaceholder}>
                <OneIcon name={iconForRecent(item)} size={26} color={theme.platinum} />
              </View>
            )}
            <View style={[styles.recentBadge, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}>
              <Text style={[styles.recentBadgeText, { color: theme.textSecondary }]}>{item.type.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.recentCopy}>
            <Text style={[styles.recentTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
            <Text style={[styles.recentMeta, { color: theme.textSecondary }]} numberOfLines={2}>
              {[item.userContext, item.summary, item.merchant, item.category].find(Boolean) || 'Saved memory'}
            </Text>
            <View style={styles.recentFooter}>
              <Text style={[styles.recentDate, { color: theme.textTertiary }]}>{formatRelative(item.updatedAt)}</Text>
              <OneIcon name={icons.chevron} size={12.5} color={theme.textTertiary} />
            </View>
          </View>
        </NeverGlass>
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
        accessibilityRole="button"
        accessibilityLabel={`${reason}. ${item.title}`}
        onPress={() => router.push({ pathname: activeInbox ? '/inbox/[id]' : '/item/[id]', params: { id: item.id } } as never)}
        style={({ pressed }) => [
          styles.todayRow,
          !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
          { backgroundColor: pressed ? theme.fill : 'transparent' }
        ]}
      >
        <View style={styles.todayTimeColumn}>
          <Text style={[styles.todayTime, { color: overdue ? theme.warning : theme.textTertiary }]} numberOfLines={1}>{timeLabel}</Text>
          <View style={[styles.todayDot, { backgroundColor: overdue ? theme.warning : theme.platinum }]} />
        </View>
        <View style={styles.todayCopy}>
          <Text style={[styles.todayTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.todayMeta, { color: theme.textSecondary }]} numberOfLines={1}>{detail}</Text>
        </View>
        <OneIcon name={icons.chevron} size={12.5} color={theme.textTertiary} />
      </Pressable>
    );
  }
}

function displayFirstName(metadata?: Record<string, unknown>) {
  if (!metadata) return undefined;
  const candidate = [metadata.first_name, metadata.full_name, metadata.name]
    .find((value) => typeof value === 'string' && value.trim()) as string | undefined;
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

function labelForKind(kind: string) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function sortUpdated(a: OneItem, b: OneItem) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
    gap: 22
  },
  topBar: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center'
  },
  hero: {
    paddingTop: 10,
    paddingRight: 8
  },
  greeting: {
    ...neverType.caption,
    fontWeight: '600',
    marginBottom: 7
  },
  heroTitle: {
    ...neverType.hero,
    maxWidth: 470,
    fontSize: 35,
    lineHeight: 39,
    letterSpacing: -1.15
  },
  askBar: {
    minHeight: 62,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    overflow: 'hidden',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2
  },
  askGlyph: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  askCopy: {
    flex: 1,
    minWidth: 0
  },
  askTitle: {
    ...neverType.bodyStrong,
    fontSize: 14.5,
    lineHeight: 18
  },
  askHint: {
    ...neverType.caption,
    marginTop: 1,
    fontSize: 11,
    lineHeight: 14
  },
  askAction: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: StyleSheet.hairlineWidth,
    opacity: 0.72
  },
  captureBlock: { gap: 8 },
  captureComposer: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    overflow: 'hidden'
  },
  captureStart: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  input: {
    flex: 1,
    minHeight: 42,
    fontSize: 14.5,
    lineHeight: 19,
    letterSpacing: -0.1
  },
  captureSubmit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  captureMore: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickActions: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  quickAction: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5
  },
  quickActionPrimary: {
    flex: 1.14,
    borderWidth: StyleSheet.hairlineWidth
  },
  quickActionLabel: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '600'
  },
  section: { gap: 10 },
  interpretationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  interpretationGlyph: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  interpretationCopy: { flex: 1 },
  interpretationTitle: {
    ...neverType.bodyStrong,
    fontSize: 14.5
  },
  interpretationMeta: {
    ...neverType.caption,
    marginTop: 3
  },
  interpretationAction: { marginTop: 16 },
  structuredReview: { gap: 12 },
  timeline: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  todayRow: {
    minHeight: 64,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11
  },
  todayTimeColumn: {
    width: 62,
    alignSelf: 'stretch',
    justifyContent: 'center',
    gap: 5
  },
  todayTime: {
    ...neverType.caption,
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '600'
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2
  },
  todayCopy: { flex: 1 },
  todayTitle: {
    ...neverType.bodyStrong,
    fontSize: 14.5
  },
  todayMeta: {
    ...neverType.caption,
    marginTop: 3
  },
  recentPressable: {
    borderRadius: 22
  },
  recentVisual: {
    height: 156,
    position: 'relative'
  },
  recentImage: {
    width: '100%',
    height: '100%'
  },
  recentPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  recentBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth
  },
  recentBadgeText: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.75
  },
  recentCopy: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 15
  },
  recentTitle: {
    ...neverType.section,
    fontSize: 16.5,
    lineHeight: 20
  },
  recentMeta: {
    ...neverType.body,
    marginTop: 4,
    fontSize: 13.5,
    lineHeight: 19
  },
  recentFooter: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  recentDate: {
    ...neverType.caption,
    fontWeight: '600'
  },
  inlineLink: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 1
  },
  inlineLinkText: {
    ...neverType.caption,
    fontWeight: '600'
  },
  emptyTitle: {
    ...neverType.bodyStrong
  },
  emptyBody: {
    ...neverType.caption,
    marginTop: 4
  }
});