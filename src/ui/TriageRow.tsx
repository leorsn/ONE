import { Pressable, StyleSheet, Text, View } from 'react-native';
import { proposedActionsForItem, triageStateForItem } from '@/src/inbox/triage';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { neverType } from '@/src/theme/typography';
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
    : state === 'processed'
      ? theme.success
      : theme.textTertiary;

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
        onPress={onOpen}
        style={({ pressed }) => [
          styles.openArea,
          { backgroundColor: pressed ? theme.fill : 'transparent' }
        ]}
      >
        <View style={styles.markerColumn}>
          <View style={[styles.marker, { backgroundColor: stateColor }]} />
        </View>

        <View style={styles.body}>
          <View style={styles.topline}>
            <Text style={[styles.state, { color: stateColor }]}>{stateLabel(state)}</Text>
            <Text style={[styles.source, { color: theme.textTertiary }]}>{sourceLabel(item)}</Text>
          </View>

          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.summary, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.summary || fallbackSummary(item)}
          </Text>

          <View style={styles.footer}>
            {metaLine(item) ? (
              <Text style={[styles.meta, { color: theme.textTertiary }]} numberOfLines={1}>{metaLine(item)}</Text>
            ) : <View style={styles.metaSpacer} />}

            {action ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${action.label} for ${item.title}`}
                onPress={() => onExecute(action.id)}
                style={({ pressed }) => [
                  styles.action,
                  {
                    backgroundColor: theme.platinumSoft,
                    borderColor: theme.glassBorder,
                    opacity: pressed ? 0.58 : 1
                  }
                ]}
              >
                <Text style={[styles.actionText, { color: theme.textSecondary }]}>{action.label}</Text>
                <OneIcon name={icons.chevron} size={10} color={theme.textTertiary} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
      </Pressable>
    </View>
  );
}

function stateLabel(state: ReturnType<typeof triageStateForItem>) {
  if (state === 'needs_review') return 'REVIEW';
  if (state === 'actionable') return 'ACTION';
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
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  openArea: {
    minHeight: 98,
    paddingHorizontal: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11
  },
  markerColumn: {
    width: 8,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 8
  },
  marker: {
    width: 5,
    height: 5,
    borderRadius: 3
  },
  body: {
    flex: 1,
    minWidth: 0
  },
  topline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  state: {
    ...neverType.eyebrow,
    fontSize: 7.7,
    lineHeight: 10,
    letterSpacing: 1.25
  },
  source: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 12,
    textAlign: 'right'
  },
  title: {
    ...neverType.bodyStrong,
    marginTop: 7,
    fontSize: 14.5,
    lineHeight: 18
  },
  summary: {
    ...neverType.caption,
    marginTop: 4,
    fontSize: 11.25,
    lineHeight: 16
  },
  footer: {
    marginTop: 9,
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  meta: {
    ...neverType.caption,
    flex: 1,
    fontSize: 9.75,
    lineHeight: 13
  },
  metaSpacer: {
    flex: 1
  },
  action: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  actionText: {
    fontSize: 9.75,
    lineHeight: 12,
    fontWeight: '600'
  }
});