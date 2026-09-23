import { memoryDateLabel } from '@/src/ui/memoryPresentation';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { proposedActionsForItem, triageStateForItem } from '@/src/inbox/triage';
import { useNeverV5Palette } from '@/src/ui/appleV5';
import type { OneInboxAction, OneItem } from '@/src/types/item';

export function TriageRow({
  item,
  onOpen,
  onExecute,
  last = false
}: {
  item: OneItem;
  last?: boolean;
  onOpen: () => void;
  onExecute: (action: OneInboxAction) => void | Promise<void>;
}) {
  const p = useNeverV5Palette();
  const [working, setWorking] = useState(false);
  const workingRef = useRef(false);
  const state = triageStateForItem(item);
  async function execute(action: OneInboxAction) {
    if (workingRef.current) return;
    workingRef.current = true;
    setWorking(true);
    try { await onExecute(action); }
    catch { Alert.alert('Could not update memory', 'Please try again.'); }
    finally { workingRef.current = false; setWorking(false); }
  }
  const action = proposedActionsForItem(item)[0];
  const stateColor = state === 'needs_review'
    ? p.warning
    : state === 'processed'
      ? p.success
      : p.tertiary;

  return (
    <View style={[styles.row, { borderBottomColor: p.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={onOpen}
        style={({ pressed }) => [styles.openArea, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
      >
        <View style={[styles.marker, { backgroundColor: stateColor }]} />

        <View style={styles.body}>
          <Text style={[styles.title, { color: p.label }]} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.summary, { color: p.secondary }]} numberOfLines={1}>
            {item.summary || fallbackSummary(item)}
          </Text>
          <View style={styles.metaLine}>
            <Text style={[styles.source, { color: p.tertiary }]} numberOfLines={1}>{sourceLabel(item)}</Text>
            <Text style={[styles.state, { color: stateColor }]}>{stateLabel(state)}</Text>
          </View>
        </View>

      </Pressable>
        {action ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${action.label} for ${item.title}`}
            disabled={working}
            accessibilityState={{ disabled: working, busy: working }}
            onPress={() => void execute(action.id)}
            style={({ pressed }) => [styles.action, {
              borderRadius: p.radius.chip,
              backgroundColor: p.fillSoft,
              borderColor: p.border,
              opacity: working ? 0.5 : pressed ? 0.55 : 1
            }]}
          >
            {working ? <ActivityIndicator color={p.chrome} /> : <Text style={[styles.actionText, { color: p.chrome }]}>{shortActionLabel(action.label)}</Text>}
          </Pressable>
        ) : null}
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
  return `${source} · ${memoryDateLabel(item.createdAt)}`;
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
  row: { flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  openArea: {
    flex: 1,
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
  metaLine: { marginTop: 4, flexWrap: 'wrap', flexDirection: 'row', alignItems: 'center', gap: 7 },
  source: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 16 },
  state: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
  action: { minHeight: 44, minWidth: 56, paddingHorizontal: 11, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 12, lineHeight: 16, fontWeight: '600' }
});