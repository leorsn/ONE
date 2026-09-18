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
      ? theme.sky
      : state === 'processed'
        ? theme.success
        : theme.textTertiary;

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.openArea, { opacity: pressed ? 0.58 : 1 }]}
      >
        <View style={[styles.spine, { backgroundColor: stateColor }]} />
        <View style={styles.body}>
          <View style={styles.topline}>
            <Text style={[styles.state, { color: stateColor }]}>{stateLabel(state)}</Text>
            <Text style={[styles.source, { color: theme.textTertiary }]}>{sourceLabel(item)}</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={1}>{item.summary || fallbackSummary(item)}</Text>
        </View>
        <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
      </Pressable>

      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${action.label} for ${item.title}`}
          onPress={() => onExecute(action.id)}
          style={({ pressed }) => [styles.action, { borderTopColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
        >
          <Text style={[styles.actionText, { color: theme.textSecondary }]}>{action.label}</Text>
          <OneIcon name={icons.chevron} size={11} color={theme.textTertiary} />
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

const styles = StyleSheet.create({
  row: { paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  openArea: { minHeight: 78, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  spine: { width: 3, height: 34, borderRadius: 2 },
  body: { flex: 1, minWidth: 0 },
  topline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  state: { fontSize: 8.1, fontWeight: '700', letterSpacing: 0.9 },
  source: { flex: 1, fontSize: 9.6, lineHeight: 13, textAlign: 'right' },
  title: { marginTop: 6, fontSize: 14.5, lineHeight: 18, fontWeight: '600', letterSpacing: -0.15 },
  summary: { marginTop: 3, fontSize: 11.5, lineHeight: 16 },
  action: { minHeight: 38, marginLeft: 14, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { fontSize: 10.75, fontWeight: '600' }
});
