import { Pressable, StyleSheet, Text, View } from 'react-native';
import { proposedActionsForItem, triageStateForItem } from '@/src/inbox/triage';
import { IconTile } from '@/src/ui/primitives';
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

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.openArea, { opacity: pressed ? 0.62 : 1 }]}
      >
        <IconTile icon={iconFor(item)} tone="neutral" size={40} />
        <View style={styles.body}>
          <View style={styles.topline}>
            <Text style={[styles.state, { color: state === 'needs_review' ? theme.warning : theme.accent }]}>
              {stateLabel(state)}
            </Text>
            <Text style={[styles.source, { color: theme.textTertiary }]}>{sourceLabel(item)}</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.summary || fallbackSummary(item)}
          </Text>
          <Text style={[styles.meta, { color: theme.textTertiary }]} numberOfLines={1}>
            {metaLine(item)}
          </Text>
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
              backgroundColor: action.primary ? theme.accentSoft : theme.fill,
              opacity: pressed ? 0.62 : 1
            }
          ]}
        >
          <Text style={[styles.actionText, { color: action.primary ? theme.accent : theme.textSecondary }]}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
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
  return item.userContext || item.extractedText || item.originalText || item.rawInput || 'Captured in ONE';
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
  row: { padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  openArea: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  body: { flex: 1, minWidth: 0 },
  topline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  state: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.65 },
  source: { flex: 1, fontSize: 10.5, textAlign: 'right' },
  title: { marginTop: 4, fontSize: 15, fontWeight: '700', letterSpacing: -0.15 },
  summary: { marginTop: 3, fontSize: 12.5, lineHeight: 17 },
  meta: { marginTop: 4, fontSize: 10.5 },
  action: { alignSelf: 'flex-start', minHeight: 34, paddingHorizontal: 12, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 11.5, fontWeight: '800' }
});
