import { goBackOrHome } from '@/src/ui/navigation';
import { memoryDateLabel, memoryPreview } from '@/src/ui/memoryPresentation';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { neverType, neverSpacing } from '@/src/theme/tokens';
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
import { OneIcon, icons } from '@/src/ui/icons';
import {
  V5Chevron,
  V5Group,
  V5IconButton,
  V5SectionHeader,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export default function InboxItemDetailScreen() {
  const p = useNeverV5Palette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, update } = useItems();
  const item = useMemo(() => items.find((candidate) => candidate.id === id), [items, id]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [working, setWorking] = useState(false);
  const duplicate = useMemo(() => item ? findLikelyDuplicate(item, items) : undefined, [item, items]);

  if (!item) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]}>
        <View style={styles.missing}>
          <View style={[styles.missingIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.inbox} size={19} color={p.chrome} /></View>
          <Text style={[styles.missingTitle, { color: p.label }]}>Inbox item not found</Text>
          <Text style={[styles.missingBody, { color: p.secondary }]}>It may have been processed or removed on another device.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)')}><Text style={[styles.missingBack, { color: p.chrome }]}>Return to Home</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentItem = item;
  const state = triageStateForItem(currentItem);
  const actions = proposedActionsForItem(currentItem);
  const previewUri = memoryPreview(currentItem);
  const original = currentItem.originalText || currentItem.rawInput || currentItem.extractedText;

  async function execute(action: OneInboxAction) {
    if (working) return;
    const changes = triageActionChanges(currentItem, action);
    if (!changes) return;
    setWorking(true);
    try {
      const next = await update(currentItem.id, changes);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      if (next) {
        const warning = notificationSaveWarning(next);
        if (warning) Alert.alert('Saved to NEVER', warning);
      }
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Could not update memory', 'Your memory is still available. Please try again.');
    } finally {
      setWorking(false);
    }
  }

  async function confirmReview() {
    if (working) return;
    setWorking(true);
    try {
      await update(currentItem.id, confirmReviewChanges(currentItem));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch {
      Alert.alert('Could not update memory', 'Your memory is still available. Please try again.');
    } finally {
      setWorking(false);
    }
  }

  async function deferReview() {
    if (working) return;
    setWorking(true);
    try {
      await update(currentItem.id, deferReviewChanges());
      void Haptics.selectionAsync().catch(() => undefined);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Could not update memory', 'Your memory is still available. Please try again.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive">
        <View style={styles.nav}>
          <V5IconButton icon={icons.chevronLeft} accessibilityLabel="Back to Inbox" onPress={() => goBackOrHome()} />
          <Text style={[styles.navTitle, { color: p.label }]}>Review</Text>
          <V5IconButton icon={icons.edit} accessibilityLabel="Edit item details" onPress={() => router.push({ pathname: '/item/[id]', params: { id: currentItem.id } })} />
        </View>

        <View style={styles.identity}>
          <View style={[styles.identityIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={iconFor(currentItem)} size={17} color={p.chrome} /></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.state, { color: state === 'needs_review' ? p.warning : p.chrome }]}>{stateLabel(state)}</Text>
            <Text style={[styles.source, { color: p.tertiary }]}>{sourceLine(currentItem)}</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: p.label }]}>{currentItem.title}</Text>

        {previewUri ? (
          <View style={styles.section}>
            <V5SectionHeader title="Original" />
            <Image source={{ uri: previewUri }} style={[styles.preview, { backgroundColor: p.fill }]} resizeMode="contain" />
          </View>
        ) : null}

        <View style={styles.section}>
          <V5SectionHeader title="NEVER Understood" />
          <V5Group style={styles.understandingGroup}>
            <View style={styles.confidenceRow}>
              <Text style={[styles.confidenceLabel, { color: p.tertiary }]}>Confidence</Text>
              <Text style={[styles.confidenceValue, { color: p.label }]}>{confidenceLabel(currentItem)}</Text>
            </View>
            <Text style={[styles.summary, { color: p.secondary }]}>{currentItem.summary || currentItem.userContext || 'No additional summary was inferred.'}</Text>
            {currentItem.ambiguities?.length ? (
              <View style={[styles.ambiguity, { borderTopColor: p.separator }]}>
                <Text style={[styles.ambiguityTitle, { color: p.warning }]}>Check these details</Text>
                {currentItem.ambiguities.slice(0, 4).map((value) => <Text key={value} style={[styles.ambiguityText, { color: p.secondary }]}>• {value}</Text>)}
              </View>
            ) : null}
          </V5Group>
        </View>

        {facts(currentItem).length ? (
          <View style={styles.section}>
            <V5SectionHeader title="Facts" />
            <V5Group>
              {facts(currentItem).map((fact, index, list) => (
                <View key={fact.label} style={[styles.factRow, index < list.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <Text style={[styles.factLabel, { color: p.secondary }]}>{fact.label}</Text>
                  <Text style={[styles.factValue, { color: p.label }]} numberOfLines={2}>{fact.value}</Text>
                </View>
              ))}
            </V5Group>
          </View>
        ) : null}

        {duplicate ? (
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/item/[id]', params: { id: duplicate.id } })} style={({ pressed }) => [styles.duplicate, { backgroundColor: p.surface, opacity: pressed ? 0.6 : 1 }]}>
            <View style={[styles.warningIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.more} size={14} color={p.warning} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.duplicateTitle, { color: p.label }]}>Possible Duplicate</Text>
              <Text style={[styles.duplicateBody, { color: p.secondary }]} numberOfLines={2}>{duplicate.title}</Text>
            </View>
            <V5Chevron />
          </Pressable>
        ) : null}

        {state === 'needs_review' ? (
          <View style={styles.section}>
            <V5SectionHeader title="Review" />
            <V5Group style={styles.reviewGroup}>
              <Text style={[styles.reviewBody, { color: p.secondary }]}>Check uncertain details before confirming. Edit the memory if any recognized fact is wrong.</Text>
              <View style={styles.actionStack}>
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/item/[id]', params: { id: currentItem.id } })} style={({ pressed }) => [styles.primaryAction, { backgroundColor: p.graphite, opacity: pressed ? 0.72 : 1 }]}>
                  <OneIcon name={icons.edit} size={14} color={p.onAccent} />
                  <Text style={[styles.primaryActionText, { color: p.onAccent }]}>Edit Details</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={working} onPress={confirmReview} style={({ pressed }) => [styles.secondaryAction, { backgroundColor: p.fill, opacity: pressed || working ? 0.58 : 1 }]}>
                  <Text style={[styles.secondaryActionText, { color: p.label }]}>Confirm Facts</Text>
                </Pressable>
              </View>
            </V5Group>
          </View>
        ) : null}

        {actions.length ? (
          <View style={styles.section}>
            <V5SectionHeader title="Next Actions" />
            <V5Group>
              {actions.map((action, index) => (
                <Pressable accessibilityRole="button" key={action.id} disabled={working} onPress={() => void execute(action.id)} style={({ pressed }) => [styles.proposal, index !== actions.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }, { backgroundColor: pressed ? p.fillSoft : 'transparent', opacity: working ? 0.58 : 1 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.proposalTitle, { color: p.label }]}>{action.label}</Text>
                    <Text style={[styles.proposalReason, { color: p.secondary }]}>{action.reason}</Text>
                  </View>
                  <V5Chevron />
                </Pressable>
              ))}
            </V5Group>
          </View>
        ) : null}

        {original ? (
          <View style={styles.section}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showOriginal }} onPress={() => setShowOriginal((value) => !value)} style={styles.disclosure}>
              <Text style={[styles.disclosureText, { color: p.label }]}>Original Capture</Text>
              <Text style={[styles.openText, { color: p.secondary }]}>{showOriginal ? 'Hide' : 'Show'}</Text>
            </Pressable>
            {showOriginal ? <V5Group style={styles.originalGroup}><Text style={[styles.original, { color: p.secondary }]} selectable>{original}</Text></V5Group> : null}
          </View>
        ) : null}

        <View style={[styles.triageFooter, { borderTopColor: p.separator }]}>
          <FooterAction label="Review Tomorrow" onPress={deferReview} />
          <FooterAction label="Mark Processed" onPress={() => void execute('mark_processed')} />
          <FooterAction label="Archive" onPress={() => void execute('archive')} danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function FooterAction({ label, onPress, danger = false }: { label: string; onPress: () => void | Promise<void>; danger?: boolean }) {
    return <Pressable accessibilityRole="button" disabled={working} onPress={onPress} style={({ pressed }) => [styles.footerAction, { opacity: pressed || working ? 0.55 : 1 }]}><Text style={[styles.footerText, { color: danger ? p.danger : p.secondary }]}>{label}</Text></Pressable>;
  }
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
  return `${source} · ${memoryDateLabel(item.createdAt, true)}`;
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
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 38, gap: 18 },
  missing: { flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', padding: 24 },
  missingIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  missingTitle: { marginTop: 12, fontSize: 18, lineHeight: 22, fontWeight: '700' },
  missingBody: { marginTop: 3, maxWidth: 280, textAlign: 'center', fontSize: 13, lineHeight: 18 },
  missingBack: { marginTop: 14, fontSize: 14, lineHeight: 18, fontWeight: '600' },
  nav: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: 16.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.18 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  identityIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  state: { fontSize: 9.5, lineHeight: 12, fontWeight: '700', letterSpacing: 0.8 },
  source: { marginTop: 2, fontSize: 11.5, lineHeight: 14 },
  title: { ...neverType.display },
  section: { gap: neverSpacing.md },
  preview: { width: '100%', height: 300, borderRadius: 16 },
  understandingGroup: { padding: 14 },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confidenceLabel: { fontSize: 11, lineHeight: 14, fontWeight: '500' },
  confidenceValue: { fontSize: 12, lineHeight: 15, fontWeight: '600' },
  summary: { marginTop: 10, fontSize: 13.5, lineHeight: 19 },
  ambiguity: { marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  ambiguityTitle: { fontSize: 12, lineHeight: 15, fontWeight: '600' },
  ambiguityText: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  factRow: { minHeight: 50, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  factLabel: { width: 78, fontSize: 12, lineHeight: 15 },
  factValue: { flex: 1, textAlign: 'right', fontSize: 13, lineHeight: 17, fontWeight: '500' },
  duplicate: { minHeight: 66, borderRadius: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  warningIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  duplicateTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  duplicateBody: { marginTop: 2, fontSize: 12, lineHeight: 16 },
  reviewGroup: { padding: 14 },
  reviewBody: { fontSize: 12.5, lineHeight: 18 },
  actionStack: { marginTop: 12, gap: 8 },
  primaryAction: { minHeight: 44, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryActionText: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  secondaryAction: { minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { fontSize: 13.5, lineHeight: 17, fontWeight: '600' },
  proposal: { minHeight: 58, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  proposalTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  proposalReason: { marginTop: 2, fontSize: 11.5, lineHeight: 15 },
  disclosure: { minHeight: 44, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disclosureText: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  openText: { fontSize: 12.5, lineHeight: 16 },
  originalGroup: { padding: 14 },
  original: { fontSize: 12.5, lineHeight: 19 },
  triageFooter: { marginTop: 2, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  footerAction: { minHeight: 44, justifyContent: 'center' },
  footerText: { fontSize: 11.5, lineHeight: 14, fontWeight: '600' }
});
