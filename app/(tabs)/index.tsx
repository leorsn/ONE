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
  NeverIconButton,
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
          <NeverIconButton
            icon={icons.person}
            accessibilityLabel="Open settings"
            onPress={() => router.push('/(tabs)/settings')}
          />
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
              opacity: pressed ? 0.76 : 1,
              transform: [{ scale: pressed ? 0.994 : 1 }]
            }
          ]}
        >
          <View style={[styles.askGlyph, { backgroundColor: theme.platinumSoft, borderColor: theme.border }]}>
            <OneIcon name={icons.ask} size={16} color={theme.chrome} />
          </View>
          <Text style={[styles.askText, { color: theme.textSecondary }]}>Ask NEVER anything you saved</Text>
          <View style={[styles.askAction, { backgroundColor: theme.chrome }]}>
            <OneIcon name={icons.chevron} size={13} color={theme.background} />
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
              <OneIcon name={icons.plus} size={18} color={theme.chrome} />
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
                <OneIcon name={icons.more} size={17} color={theme.textTertiary} />
              </View>
            )}
          </View>
        </View>

        <View style={styles.quickActions}>
          <QuickAction label="Scan" icon={icons.scan} onPress={() => router.push('/scan')} />
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
            <View style={styles.timeline}>
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
    onPress
  }: {
    label: string;
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
        style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.58 : 1 }]}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: theme.glass, borderColor: theme.glassBorder }]}>
          <OneIcon name={icon} size={17} color={theme.chrome} />
        </View>
        <Text style={[styles.quickActionLabel, { color: theme.textSecondary }]}>{label}</Text>
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
                <OneIcon name={iconForRecent(item)} size={28} color={theme.platinum} />
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
              <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
            </View>
          </View>
        </NeverGlass>
      </Pressable>
    );
  }

  function TodayRow({ item, reason, last }: { item: OneItem; reason: string; last: boolean }) {
    const activeInbox = isInboxActive(item, now);
    const overdue = reason === 'Overdue';
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
        <View style={styles.todayTimeRail}>
          <Text style={[styles.todayTime, { color: overdue ? theme.warning : theme.textSecondary }]}>{item.time || reason}</Text>
          <View style={[styles.todayDot, { backgroundColor: overdue ? theme.warning : theme.platinum }]} />
        </View>
        <View style={styles.todayCopy}>
          <Text style={[styles.todayTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.todayMeta, { color: theme.textSecondary }]} numberOfLines={1}>
            {[item.location, item.summary].filter(Boolean).join(' · ') || reason}
          </Text>
        </View>
        <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
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
    paddingTop: 10,
    paddingBottom: 136,
    gap: 28
  },
  topBar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  hero: {
    paddingTop: 18,
    paddingRight: 10
  },
  greeting: {
    ...neverType.bodyStrong,
    marginBottom: 8
  },
  heroTitle: {
    ...neverType.hero,
    maxWidth: 520
  },
  askBar: {
    minHeight: 70,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    shadowOpacity: 0.24,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5
  },
  askGlyph: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  askText: {
    ...neverType.bodyStrong,
    flex: 1,
    fontSize: 14.5
  },
  askAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: StyleSheet.hairlineWidth
  },
  captureBlock: { gap: 9 },
  captureComposer: {
    minHeight: 58,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden'
  },
  captureStart: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center'
  },
  input: {
    flex: 1,
    minHeight: 44,
    fontSize: 14.5,
    lineHeight: 19,
    letterSpacing: -0.1
  },
  captureSubmit: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  captureMore: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 7
  },
  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickActionLabel: {
    ...neverType.caption,
    fontWeight: '600'
  },
  section: { gap: 11 },
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
    minHeight: 76,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  todayTimeRail: {
    width: 66,
    alignSelf: 'stretch',
    justifyContent: 'center',
    position: 'relative'
  },
  todayTime: {
    ...neverType.caption,
    fontWeight: '600'
  },
  todayDot: {
    position: 'absolute',
    right: 0,
    width: 5,
    height: 5,
    borderRadius: 3
  },
  todayCopy: { flex: 1 },
  todayTitle: {
    ...neverType.bodyStrong
  },
  todayMeta: {
    ...neverType.caption,
    marginTop: 4
  },
  recentPressable: {
    borderRadius: 24
  },
  recentVisual: {
    height: 178,
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
    top: 12,
    right: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth
  },
  recentBadgeText: {
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.85
  },
  recentCopy: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 17
  },
  recentTitle: {
    ...neverType.section,
    fontSize: 17,
    lineHeight: 21
  },
  recentMeta: {
    ...neverType.body,
    marginTop: 5
  },
  recentFooter: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  recentDate: {
    ...neverType.caption,
    fontWeight: '600'
  },
  inlineLink: {
    minHeight: 30,
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
