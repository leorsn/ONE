import { Pressable, StyleSheet, Text, View } from 'react-native';
import { proposedActionsForItem, triageStateForItem } from '@/src/inbox/triage';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
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
  const theme = useTheme();
  const state = triageStateForItem(item);
  const action = proposedActionsForItem(item)[0];
  const stateColor = state === 'needs_review'
    ? theme.warning
    : state === 'actionable'
      ? theme.accent
      : state === 'processed'
        ? theme.success
        : theme.chrome;

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.openArea, { opacity: pressed ? 0.58 : 1 }]}
      >
        <View style={[styles.memorySpine, { backgroundColor: stateColor }]} />
        <View style={styles.body}>
          <View style={styles.topline}>
            <Text style={[styles.state, { color: stateColor }]}>{stateLabel(state)}</Text>
            <Text style={[styles.source, { color: theme.textTertiary }]}>{sourceLabel(item)}</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={2}>{item.summary || fallbackSummary(item)}</Text>
          {metaLine(item) ? <Text style={[styles.meta, { color: theme.textTertiary }]} numberOfLines={1}>{metaLine(item)}</Text> : null}
        </View>
        <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />
      </Pressable>

      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action.label} for ${item.title}`}
          onPress={() => onExecute(action.id)}
          style={({ pressed }) => [
            styles.action,
            {
              borderTopColor: theme.border,
              opacity: pressed ? 0.58 : 1
            }
          ]}
        >
          <Text style={[styles.actionText, { color: action.primary ? theme.text : theme.textSecondary }]}>{action.label}</Text>
          {action.primary ? <OneIcon name={icons.chevron} size={11} color={theme.textTertiary} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

function stateLabel(state: ReturnType<typeof triageStateForItem>) {
  if (state === 'needs_review') return 'NEEDS REVIEW';
  if (state === 'actionable') return 'ACTIONABLE';
  if (state === 'processed') return 'PROCESSED';
  if (state === 'archived') return 'ARCHIVED';
  return 'NEW';
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
  openArea: { minHeight: 92, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'stretch', gap: 12 },
  memorySpine: { width: 3, borderRadius: 2, marginVertical: 3 },
  body: { flex: 1, minWidth: 0 },
  topline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  state: { fontSize: 8.25, fontWeight: '800', letterSpacing: 0.9 },
  source: { flex: 1, fontSize: 9.5, lineHeight: 13, textAlign: 'right' },
  title: { marginTop: 7, fontSize: 14.75, lineHeight: 18, fontWeight: '600', letterSpacing: -0.16 },
  summary: { marginTop: 4, fontSize: 11.75, lineHeight: 16.5 },
  meta: { marginTop: 5, fontSize: 10.1, lineHeight: 13.5 },
  action: { minHeight: 38, paddingHorizontal: 31, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 10.75, fontWeight: '700' }
});