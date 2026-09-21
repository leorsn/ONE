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
          <Text style={[styles.title, { color: p.label }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.summary, { color: p.secondary }]} numberOfLines={1}>
            {item.summary || fallbackSummary(item)}
          </Text>
          <View style={styles.metaLine}>
            <Text style={[styles.source, { color: p.tertiary }]} numberOfLines={1}>{sourceLabel(item)}</Text>
            <Text style={[styles.state, { color: stateColor }]}>{stateLabel(state)}</Text>
          </View>
        </View>

        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${action.label} for ${item.title}`}
            onPress={(event) => { event.stopPropagation(); void onExecute(action.id); }}
            style={({ pressed }) => [styles.action, { backgroundColor: p.fill, opacity: pressed ? 0.55 : 1 }]}
          >
            <Text style={[styles.actionText, { color: p.label }]}>{shortActionLabel(action.label)}</Text>
          </Pressable>
        ) : <OneIcon name={icons.chevron} size={11.5} color={p.tertiary} />}
      </Pressable>
    </View>
  );
}

function stateLabel(state: ReturnType<typeof triageStateForItem>) {
  if (state === 'needs_review') return 'Needs Review';
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

function shortActionLabel(label: string) {
  if (/save reference/i.test(label)) return 'Save';
  if (/save/i.test(label)) return 'Save';
  if (/confirm/i.test(label)) return 'Confirm';
  return label;
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: StyleSheet.hairlineWidth },
  openArea: {
    minHeight: 92,
    paddingLeft: 13,
    paddingRight: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  marker: { width: 6, height: 6, borderRadius: 3 },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 15.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.12 },
  summary: { marginTop: 1, fontSize: 12.5, lineHeight: 16 },
  metaLine: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 7 },
  source: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 16 },
  state: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  action: { minHeight: 44, minWidth: 56, paddingHorizontal: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12, lineHeight: 16, fontWeight: '600' }
});