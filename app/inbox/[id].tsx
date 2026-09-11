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
  const duplicate = useMemo(
    () => item ? findLikelyDuplicate(item, items) : undefined,
    [item, items]
  );

  if (!item) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.missing}>
          <EmptyState icon={icons.inbox} title="Inbox item not found" body="It may have been processed or removed on another device." />
          <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)')}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>Return to Inbox</Text>
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
        if (warning) Alert.alert('Saved to ONE', warning);
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
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Inbox" onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Inbox item</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit item details" onPress={() => router.push({ pathname: '/item/[id]', params: { id: currentItem.id } })} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.edit} size={17} color={theme.text} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <IconTile icon={iconFor(currentItem)} size={52} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.state, { color: state === 'needs_review' ? theme.warning : theme.accent }]}>{stateLabel(state)}</Text>
            <Text style={[styles.title, { color: theme.text }]}>{currentItem.title}</Text>
            <Text style={[styles.source, { color: theme.textSecondary }]}>{sourceLine(currentItem)}</Text>
          </View>
        </View>

        {previewUri ? <Image source={{ uri: previewUri }} style={[styles.preview, { backgroundColor: theme.fill }]} resizeMode="cover" /> : null}

        <Surface padded>
          <View style={styles.summaryTop}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>ONE understood</Text>
            <View style={[styles.confidencePill, { backgroundColor: theme.fill }]}>
              <Text style={[styles.confidenceText, { color: theme.textSecondary }]}>{confidenceLabel(currentItem)}</Text>
            </View>
          </View>
          <Text style={[styles.summary, { color: theme.textSecondary }]}>{currentItem.summary || currentItem.userContext || 'No additional summary was inferred.'}</Text>
          {currentItem.ambiguities?.length ? (
            <View style={[styles.ambiguity, { backgroundColor: theme.fill }]}>
              <Text style={[styles.ambiguityTitle, { color: theme.warning }]}>Review before acting</Text>
              {currentItem.ambiguities.slice(0, 4).map((value) => (
                <Text key={value} style={[styles.ambiguityText, { color: theme.textSecondary }]}>• {value}</Text>
              ))}
            </View>
          ) : null}
        </Surface>

        {facts(currentItem).length ? (
          <View style={styles.block}>
            <SectionHeader title="Extracted facts" />
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
          <View style={[styles.duplicate, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.more} size={17} color={theme.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.duplicateTitle, { color: theme.text }]}>Possible duplicate</Text>
              <Text style={[styles.duplicateBody, { color: theme.textSecondary }]} numberOfLines={2}>ONE found a recent capture with the same source content: {duplicate.title}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Open possible duplicate" onPress={() => router.push({ pathname: '/item/[id]', params: { id: duplicate.id } })}>
              <Text style={[styles.openText, { color: theme.accent }]}>Open</Text>
            </Pressable>
          </View>
        ) : null}

        {state === 'needs_review' ? (
          <View style={styles.block}>
            <SectionHeader title="Review" />
            <Surface padded>
              <Text style={[styles.reviewBody, { color: theme.textSecondary }]}>Correct any uncertain fields first. Confirm only when the extracted facts match what you captured.</Text>
              <View style={styles.actionStack}>
                <PrimaryButton label="Edit details" icon={icons.edit} onPress={() => router.push({ pathname: '/item/[id]', params: { id: currentItem.id } })} />
                <Pressable accessibilityRole="button" accessibilityLabel="Confirm extracted facts" disabled={working} onPress={confirmReview} style={[styles.secondaryAction, { backgroundColor: theme.fill }]}>
                  <Text style={[styles.secondaryActionText, { color: theme.text }]}>Confirm extracted facts</Text>
                </Pressable>
              </View>
            </Surface>
          </View>
        ) : null}

        {actions.length ? (
          <View style={styles.block}>
            <SectionHeader title="Proposed actions" meta="Based on saved facts" />
            <View style={styles.actionStack}>
              {actions.map((action, index) => (
                <Pressable
                  key={action.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${action.label}. ${action.reason}`}
                  disabled={working}
                  onPress={() => void execute(action.id)}
                  style={({ pressed }) => [
                    styles.proposal,
                    {
                      backgroundColor: action.primary && index === 0 ? theme.accent : theme.surface,
                      borderColor: action.primary && index === 0 ? theme.accent : theme.border,
                      opacity: pressed || working ? 0.62 : 1
                    }
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.proposalTitle, { color: action.primary && index === 0 ? '#FFFFFF' : theme.text }]}>{action.label}</Text>
                    <Text style={[styles.proposalReason, { color: action.primary && index === 0 ? '#FFFFFFCC' : theme.textSecondary }]}>{action.reason}</Text>
                  </View>
                  <OneIcon name={icons.chevron} size={14} color={action.primary && index === 0 ? '#FFFFFF' : theme.textTertiary} />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {original ? (
          <View style={styles.block}>
            <Pressable accessibilityRole="button" accessibilityLabel="Toggle original captured content" onPress={() => setShowOriginal((value) => !value)} style={styles.disclosure}>
              <Text style={[styles.disclosureText, { color: theme.text }]}>Original capture</Text>
              <Text style={[styles.openText, { color: theme.accent }]}>{showOriginal ? 'Hide' : 'Show'}</Text>
            </Pressable>
            {showOriginal ? (
              <Surface padded>
                <Text style={[styles.original, { color: theme.textSecondary }]} selectable>{original}</Text>
              </Surface>
            ) : null}
          </View>
        ) : null}

        <View style={styles.triageActions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Review tomorrow" disabled={working} onPress={deferReview} style={[styles.triageButton, { backgroundColor: theme.fill }]}>
            <Text style={[styles.triageText, { color: theme.textSecondary }]}>Review tomorrow</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Mark processed" disabled={working} onPress={() => void execute('mark_processed')} style={[styles.triageButton, { backgroundColor: theme.fill }]}>
            <Text style={[styles.triageText, { color: theme.textSecondary }]}>Mark processed</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Archive item" disabled={working} onPress={() => void execute('archive')} style={[styles.triageButton, { backgroundColor: theme.fill }]}>
            <Text style={[styles.triageText, { color: theme.danger }]}>Archive</Text>
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
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 42, gap: 18 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  state: { fontSize: 10, fontWeight: '900', letterSpacing: 0.75 },
  title: { marginTop: 4, fontSize: 22, lineHeight: 27, fontWeight: '800', letterSpacing: -0.45 },
  source: { marginTop: 4, fontSize: 12 },
  preview: { width: '100%', height: 250, borderRadius: 22 },
  summaryTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  confidencePill: { minHeight: 27, borderRadius: 10, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  confidenceText: { fontSize: 10.5, fontWeight: '700' },
  summary: { marginTop: 8, fontSize: 13, lineHeight: 19 },
  ambiguity: { marginTop: 12, borderRadius: 14, padding: 12 },
  ambiguityTitle: { fontSize: 11.5, fontWeight: '800' },
  ambiguityText: { marginTop: 4, fontSize: 11.5, lineHeight: 16 },
  block: { gap: 10 },
  factRow: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  factLabel: { width: 76, fontSize: 11.5 },
  factValue: { flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },
  duplicate: { borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  duplicateTitle: { fontSize: 12.5, fontWeight: '800' },
  duplicateBody: { marginTop: 2, fontSize: 11.5, lineHeight: 16 },
  openText: { fontSize: 12, fontWeight: '800' },
  reviewBody: { fontSize: 12.5, lineHeight: 18 },
  actionStack: { marginTop: 12, gap: 8 },
  secondaryAction: { minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { fontSize: 13, fontWeight: '800' },
  proposal: { minHeight: 64, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  proposalTitle: { fontSize: 13.5, fontWeight: '800' },
  proposalReason: { marginTop: 3, fontSize: 11.5, lineHeight: 16 },
  disclosure: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disclosureText: { fontSize: 13.5, fontWeight: '700' },
  original: { fontSize: 12.5, lineHeight: 19 },
  triageActions: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  triageButton: { minHeight: 40, borderRadius: 13, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  triageText: { fontSize: 11.5, fontWeight: '700' }
});
