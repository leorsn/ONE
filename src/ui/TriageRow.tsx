import { Pressable, StyleSheet, Text, View } from 'react-native';
import { proposedActionsForItem, triageStateForItem } from '@/src/inbox/triage';
import { IconTile } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneInboxAction, OneItem } from '@/src/types/item';

type TriageTone = 'accent' | 'neutral' | 'warning' | 'info' | 'memory';

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
        <IconTile icon={iconFor(item)} tone={toneFor(item, state)} size={42} />
        <View style={styles.body}>
          <View style={styles.topline}>
            <View style={[styles.stateBadge, { backgroundColor: `${stateColor}16` }]}>
              <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
              <Text style={[styles.state, { color: stateColor }]}>{stateLabel(state)}</Text>
            </View>
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
              backgroundColor: action.primary ? theme.accentSoft : theme.fill,
              borderColor: action.primary ? `${theme.accent}33` : theme.border,
              opacity: pressed ? 0.58 : 1
            }
          ]}
        >
          <Text style={[styles.actionText, { color: action.primary ? theme.accent : theme.textSecondary }]}>{action.label}</Text>
          {action.primary ? <OneIcon name={icons.chevron} size={11} color={theme.accent} /> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

function toneFor(item: OneItem, state: ReturnType<typeof triageStateForItem>): TriageTone {
  if (state === 'needs_review') return 'warning';
  if (item.kind === 'receipt' || item.kind === 'document' || item.kind === 'link') return 'info';
  if (item.type === 'idea' || item.type === 'note') return 'memory';
  if (item.kind === 'event' || item.kind === 'reminder') return 'accent';
  return 'neutral';
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
  row: { padding: 15, borderBottomWidth: StyleSheet.hairlineWidth, gap: 11 },
  openArea: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  body: { flex: 1, minWidth: 0 },
  topline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stateBadge: { minHeight: 20, paddingHorizontal: 7, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  stateDot: { width: 5, height: 5, borderRadius: 3 },
  state: { fontSize: 8.25, fontWeight: '800', letterSpacing: 0.78 },
  source: { flex: 1, fontSize: 9.75, lineHeight: 13, textAlign: 'right' },
  title: { marginTop: 7, fontSize: 14.75, lineHeight: 18, fontWeight: '600', letterSpacing: -0.16 },
  summary: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  meta: { marginTop: 5, fontSize: 10.25, lineHeight: 13.5 },
  action: { alignSelf: 'flex-start', minHeight: 34, paddingHorizontal: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  actionText: { fontSize: 11, fontWeight: '700' }
});
