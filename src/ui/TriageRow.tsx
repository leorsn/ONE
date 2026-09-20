import { Pressable, StyleSheet, Text, View } from 'react-native';
import { proposedActionsForItem, triageStateForItem } from '@/src/inbox/triage';
import { OneIcon, icons } from '@/src/ui/icons';
import { useNeverV5Palette } from '@/src/ui/appleV5';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export function TriageRow({
  item,
  onOpen,
  onExecute
}: {
  item: OneItem;
  onOpen: () => void;
  onExecute: (action: OneInboxAction) => void | Promise<void>;
}) {
  const p = useNeverV5Palette();
  const state = triageStateForItem(item);
  const action = proposedActionsForItem(item)[0];
  const stateColor = state === 'needs_review'
    ? p.warning
    : state === 'processed'
      ? p.success
      : p.tertiary;

  return (
    <View style={[styles.row, { borderBottomColor: p.separator }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.openArea, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
      >
        <View style={[styles.marker, { backgroundColor: stateColor }]} />

        <View style={styles.body}>
          <View style={styles.titleLine}>
            <Text style={[styles.title, { color: p.label }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.source, { color: p.tertiary }]} numberOfLines={1}>{sourceLabel(item)}</Text>
          </View>
          <Text style={[styles.summary, { color: p.secondary }]} numberOfLines={1}>
            {item.summary || fallbackSummary(item)}
          </Text>
          <View style={styles.footer}>
            <View style={styles.stateWrap}>
              <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
              <Text style={[styles.state, { color: stateColor }]}>{stateLabel(state)}</Text>
              {metaLine(item) ? <Text style={[styles.meta, { color: p.tertiary }]} numberOfLines={1}> · {metaLine(item)}</Text> : null}
            </View>
            {action ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${action.label} for ${item.title}`}
                onPress={() => onExecute(action.id)}
                style={({ pressed }) => [styles.action, { backgroundColor: p.fill, opacity: pressed ? 0.55 : 1 }]}
              >
                <Text style={[styles.actionText, { color: p.secondary }]}>{action.label}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <OneIcon name={icons.chevron} size={12} color={p.tertiary} />
      </Pressable>
    </View>
  );
}

function stateLabel(state: ReturnType<typeof triageStateForItem>) {
  if (state === 'needs_review') return 'Review';
  if (state === 'actionable') return 'Action';
  if (state === 'processed') return 'Processed';
  if (state === 'archived') return 'Archived';
  return 'New';
}

function sourceLabel(item: OneItem) {
  const source = item.sourceType === 'screenshot'
    ? 'Screenshot'
    : item.sourceType === 'share'
      ? 'Shared'
      : item.sourceType === 'scan'
        ? 'Scan'
        : item.sourceType === 'manual'
          ? 'Captured'
          : item.sourceType;
  return `${source} · ${new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(item.createdAt))}`;
}

function fallbackSummary(item: OneItem) {
  return item.userContext || item.extractedText || item.originalText || item.rawInput || 'Captured in NEVER';
}

function metaLine(item: OneItem) {
  const values = [
    item.date,
    item.time,
    item.location,
    item.merchant,
    item.amount !== undefined ? formatAmount(item.amount, item.currency) : undefined,
    item.understandingConfidence ? `${item.understandingConfidence} confidence` : undefined
  ].filter(Boolean);
  return values.join(' · ');
}

function formatAmount(amount: number, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: StyleSheet.hairlineWidth },
  openArea: {
    minHeight: 84,
    paddingLeft: 14,
    paddingRight: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11
  },
  marker: { width: 7, height: 7, borderRadius: 4 },
  body: { flex: 1, minWidth: 0 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 16, lineHeight: 20, fontWeight: '600', letterSpacing: -0.15 },
  source: { maxWidth: 112, fontSize: 11, lineHeight: 14, textAlign: 'right' },
  summary: { marginTop: 2, fontSize: 13, lineHeight: 17 },
  footer: { marginTop: 6, minHeight: 26, flexDirection: 'row', alignItems: 'center', gap: 8 },
  stateWrap: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  stateDot: { width: 4, height: 4, borderRadius: 2, marginRight: 5 },
  state: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
  meta: { flexShrink: 1, fontSize: 11, lineHeight: 14 },
  action: { minHeight: 28, paddingHorizontal: 9, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 11, lineHeight: 14, fontWeight: '500' }
});