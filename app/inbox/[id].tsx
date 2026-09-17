import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import {
  confirmReviewChanges,
  deferReviewChanges,
  findLikelyDuplicate,
  proposedActionsForItem,
  triageActionChanges,
  triageStateForItem
} from '@/src/inbox/triage';
import { notificationSaveWarning } from '@/src/notifications/status';
import { EmptyState, IconTile, PrimaryButton, SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function InboxItemDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, update } = useItems();
  const item = useMemo(() => items.find((candidate) => candidate.id === id), [items, id]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [working, setWorking] = useState(false);
  const duplicate = useMemo(() => item ? findLikelyDuplicate(item, items) : undefined, [item, items]);

  if (!item) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.missing}>
          <EmptyState icon={icons.inbox} title="Inbox item not found" body="It may have been processed or removed on another device." />
          <Pressable accessibilityRole="button" accessibilityLabel="Return to Inbox" onPress={() => router.replace('/(tabs)')}>
            <Text style={{ color: theme.chrome, fontWeight: '600' }}>Return to Inbox</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentItem = item;
  const state = triageStateForItem(currentItem);
  const actions = proposedActionsForItem(currentItem);
  const previewUri = imagePreviewUri(currentItem);
  const original = currentItem.originalText || currentItem.rawInput || currentItem.extractedText;

  async function execute(action: OneInboxAction) {
    if (working) return;
    const changes = triageActionChanges(currentItem, action);
    if (!changes) return;

    setWorking(true);
    try {
      const next = await update(currentItem.id, changes);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (next) {
        const warning = notificationSaveWarning(next);
        if (warning) Alert.alert('Saved to NEVER', warning);
      }
      router.replace('/(tabs)');
    } finally {
      setWorking(false);
    }
  }

  async function confirmReview() {
    if (working) return;
    setWorking(true);
    try {
      await update(currentItem.id, confirmReviewChanges(currentItem));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setWorking(false);
    }
  }

  async function deferReview() {
    if (working) return;
    setWorking(true);
    try {
      await update(currentItem.id, deferReviewChanges());
      await Haptics.selectionAsync();
      router.replace('/(tabs)');
    } finally {
      setWorking(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Inbox"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.chevronLeft} size={17} color={theme.text} />
          </Pressable>
          <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit item details"
            onPress={() => router.push({ pathname: '/item/[id]', params: { id: currentItem.id } })}
            style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.edit} size={16} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.identity}>
          <IconTile icon={iconFor(currentItem)} tone="neutral" size={42} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.state, { color: state === 'needs_review' ? theme.warning : theme.chrome }]}>{stateLabel(state)}</Text>
            <Text style={[styles.source, { color: theme.textTertiary }]}>{sourceLine(currentItem)}</Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>INBOX MEMORY</Text>
          <Text style={[styles.title, { color: theme.text }]}>{currentItem.title}</Text>
        </View>

        {previewUri ? (
          <View style={styles.section}>
            <SectionHeader title="Original" />
            <Image source={{ uri: previewUri }} style={[styles.preview, { backgroundColor: theme.fill, borderColor: theme.border }]} resizeMode="cover" />
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="What NEVER understood" />
          <Surface padded>
            <View style={styles.understandingTop}>
              <Text style={[styles.confidenceLabel, { color: theme.textTertiary }]}>CONFIDENCE</Text>
              <Text style={[styles.confidenceValue, { color: theme.text }]}>{confidenceLabel(currentItem)}</Text>
            </View>
            <Text style={[styles.summary, { color: theme.textSecondary }]}>{currentItem.summary || currentItem.userContext || 'No additional summary was inferred.'}</Text>
            {currentItem.ambiguities?.length ? (
              <View style={[styles.ambiguity, { borderTopColor: theme.border }]}>
                <Text style={[styles.ambiguityTitle, { color: theme.warning }]}>Review these details</Text>
                {currentItem.ambiguities.slice(0, 4).map((value) => (
                  <Text key={value} style={[styles.ambiguityText, { color: theme.textSecondary }]}>• {value}</Text>
                ))}
              </View>
            ) : null}
          </Surface>
        </View>

        {facts(currentItem).length ? (
          <View style={styles.section}>
            <SectionHeader title="Facts" />
            <Surface>
              {facts(currentItem).map((fact, index, list) => (
                <View key={fact.label} style={[styles.factRow, index < list.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <Text style={[styles.factLabel, { color: theme.textTertiary }]}>{fact.label}</Text>
                  <Text style={[styles.factValue, { color: theme.text }]} numberOfLines={2}>{fact.value}</Text>
                </View>
              ))}
            </Surface>
          </View>
        ) : null}

        {duplicate ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open possible duplicate"
            onPress={() => router.push({ pathname: '/item/[id]', params: { id: duplicate.id } })}
            style={({ pressed }) => [styles.duplicate, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
          >
            <View style={[styles.warningIcon, { backgroundColor: theme.fill, borderColor: theme.border }]}>
              <OneIcon name={icons.more} size={15} color={theme.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.duplicateTitle, { color: theme.text }]}>Possible duplicate</Text>
              <Text style={[styles.duplicateBody, { color: theme.textSecondary }]} numberOfLines={2}>A recent capture appears to contain the same source information: {duplicate.title}</Text>
            </View>
            <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
          </Pressable>
        ) : null}

        {state === 'needs_review' ? (
          <View style={styles.section}>
            <SectionHeader title="Review" />
            <Surface padded>
              <Text style={[styles.reviewBody, { color: theme.textSecondary }]}>Check uncertain details before confirming. Edit the memory if any recognized fact is wrong.</Text>
              <View style={styles.actionStack}>
                <PrimaryButton label="Edit details" icon={icons.edit} onPress={() => router.push({ pathname: '/item/[id]', params: { id: currentItem.id } })} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Confirm extracted facts"
                  disabled={working}
                  onPress={confirmReview}
                  style={({ pressed }) => [styles.secondaryAction, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed || working ? 0.58 : 1 }]}
                >
                  <Text style={[styles.secondaryActionText, { color: theme.text }]}>Confirm facts</Text>
                </Pressable>
              </View>
            </Surface>
          </View>
        ) : null}

        {actions.length ? (
          <View style={styles.section}>
            <SectionHeader title="Next actions" meta="From saved facts" />
            <View style={styles.actionStack}>
              {actions.map((action, index) => {
                const primary = action.primary && index === 0;
                return (
                  <Pressable
                    key={action.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${action.label}. ${action.reason}`}
                    disabled={working}
                    onPress={() => void execute(action.id)}
                    style={({ pressed }) => [
                      styles.proposal,
                      {
                        backgroundColor: primary ? theme.accent : theme.surfaceElevated,
                        borderColor: primary ? theme.accent : theme.border,
                        opacity: pressed || working ? 0.58 : 1
                      }
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.proposalTitle, { color: primary ? theme.onAccent : theme.text }]}>{action.label}</Text>
                      <Text style={[styles.proposalReason, { color: primary ? theme.onAccent : theme.textSecondary, opacity: primary ? 0.78 : 1 }]}>{action.reason}</Text>
                    </View>
                    <OneIcon name={icons.chevron} size={13} color={primary ? theme.onAccent : theme.textTertiary} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {original ? (
          <View style={styles.section}>
            <Pressable accessibilityRole="button" accessibilityLabel="Toggle original captured content" onPress={() => setShowOriginal((value) => !value)} style={styles.disclosure}>
              <Text style={[styles.disclosureText, { color: theme.text }]}>Original capture</Text>
              <Text style={[styles.openText, { color: theme.textSecondary }]}>{showOriginal ? 'Hide' : 'Show'}</Text>
            </Pressable>
            {showOriginal ? <Surface padded><Text style={[styles.original, { color: theme.textSecondary }]} selectable>{original}</Text></Surface> : null}
          </View>
        ) : null}

        <View style={[styles.triageFooter, { borderTopColor: theme.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Review tomorrow" disabled={working} onPress={deferReview} style={({ pressed }) => [styles.footerAction, { opacity: pressed || working ? 0.55 : 1 }]}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Review tomorrow</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Mark processed" disabled={working} onPress={() => void execute('mark_processed')} style={({ pressed }) => [styles.footerAction, { opacity: pressed || working ? 0.55 : 1 }]}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Mark processed</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Archive item" disabled={working} onPress={() => void execute('archive')} style={({ pressed }) => [styles.footerAction, { opacity: pressed || working ? 0.55 : 1 }]}>
            <Text style={[styles.footerText, { color: theme.danger }]}>Archive</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function facts(item: OneItem) {
  return [
    item.date ? { label: 'Date', value: item.date } : undefined,
    item.time ? { label: 'Time', value: item.time } : undefined,
    item.location ? { label: 'Location', value: item.location } : undefined,
    item.people?.length ? { label: 'People', value: item.people.join(', ') } : undefined,
    item.merchant ? { label: 'Merchant', value: item.merchant } : undefined,
    item.amount !== undefined ? { label: 'Amount', value: formatAmount(item.amount, item.currency) } : undefined,
    item.category ? { label: 'Category', value: item.category } : undefined
  ].filter((value): value is { label: string; value: string } => Boolean(value));
}

function imagePreviewUri(item: OneItem) {
  const candidate = item.localAttachmentUri || item.imageUrl;
  if (!candidate) return undefined;
  return /^(file|content|ph|https?):\/\//i.test(candidate) ? candidate : undefined;
}

function iconFor(item: OneItem) {
  if (item.kind === 'event') return icons.appointment;
  if (item.kind === 'reminder') return icons.reminder;
  if (item.kind === 'receipt' || item.kind === 'document') return icons.document;
  if (item.kind === 'image') return icons.screenshot;
  if (item.kind === 'link') return icons.link;
  if (item.type === 'idea') return icons.idea;
  return icons.note;
}

function stateLabel(state: ReturnType<typeof triageStateForItem>) {
  if (state === 'needs_review') return 'NEEDS REVIEW';
  if (state === 'actionable') return 'ACTIONABLE';
  if (state === 'processed') return 'PROCESSED';
  if (state === 'archived') return 'ARCHIVED';
  return 'NEW';
}

function sourceLine(item: OneItem) {
  const source = item.sourceType === 'manual' ? 'Captured' : item.sourceType === 'share' ? 'Shared' : item.sourceType;
  return `${source} · ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(item.createdAt))}`;
}

function confidenceLabel(item: OneItem) {
  const value = item.understandingConfidence || 'medium';
  return `${value.charAt(0).toUpperCase() + value.slice(1)} confidence`;
}

function formatAmount(amount: number, currency = 'EUR') {
  try { return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount); }
  catch { return `${amount.toFixed(2)} ${currency}`; }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 42, gap: 23 },
  missing: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  nav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 11, fontWeight: '600', letterSpacing: 3.2 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  state: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.2 },
  source: { marginTop: 3, fontSize: 10.5, lineHeight: 14 },
  titleBlock: { gap: 7 },
  eyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.5 },
  title: { maxWidth: 650, fontSize: 29, lineHeight: 35, fontWeight: '600', letterSpacing: -0.95 },
  section: { gap: 10 },
  preview: { width: '100%', height: 270, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth },
  understandingTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  confidenceLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  confidenceValue: { fontSize: 11.25, fontWeight: '600' },
  summary: { marginTop: 11, fontSize: 12.5, lineHeight: 18.5 },
  ambiguity: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  ambiguityTitle: { fontSize: 11.25, fontWeight: '600' },
  ambiguityText: { marginTop: 5, fontSize: 11.25, lineHeight: 16 },
  factRow: { minHeight: 54, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  factLabel: { width: 76, fontSize: 10.75 },
  factValue: { flex: 1, fontSize: 12.75, fontWeight: '600', textAlign: 'right' },
  duplicate: { minHeight: 74, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  warningIcon: { width: 36, height: 36, borderRadius: 11, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  duplicateTitle: { fontSize: 12.75, fontWeight: '600' },
  duplicateBody: { marginTop: 3, fontSize: 10.75, lineHeight: 15.5 },
  openText: { fontSize: 11.5, fontWeight: '600' },
  reviewBody: { fontSize: 12, lineHeight: 17.5 },
  actionStack: { marginTop: 12, gap: 8 },
  secondaryAction: { minHeight: 48, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { fontSize: 12.5, fontWeight: '600' },
  proposal: { minHeight: 66, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  proposalTitle: { fontSize: 13.25, fontWeight: '600' },
  proposalReason: { marginTop: 3, fontSize: 10.75, lineHeight: 15.5 },
  disclosure: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disclosureText: { fontSize: 13, fontWeight: '600' },
  original: { fontSize: 12, lineHeight: 18.5 },
  triageFooter: { paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 4 },
  footerAction: { minHeight: 36, paddingHorizontal: 10, justifyContent: 'center' },
  footerText: { fontSize: 10.75, fontWeight: '600' }
});