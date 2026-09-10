import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { IconTile } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

export function OneItemRow({
  item,
  onToggle,
  showDate = true,
  showChevron = true
}: {
  item: OneItem;
  onToggle?: (id: string) => Promise<void>;
  showDate?: boolean;
  showChevron?: boolean;
}) {
  const theme = useTheme();
  const meta = metaFor(item, showDate);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${meta}${item.completed ? '. Completed' : ''}`}
      accessibilityHint="Opens item details"
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border, opacity: pressed ? 0.62 : 1 }
      ]}
    >
      {onToggle && !item.saved ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`${item.completed ? 'Mark as incomplete' : 'Mark as complete'}: ${item.title}`}
          accessibilityState={{ checked: item.completed }}
          hitSlop={10}
          onPress={async (event) => {
            event.stopPropagation();
            await Haptics.selectionAsync();
            await onToggle(item.id);
          }}
          style={[
            styles.check,
            {
              borderColor: item.completed ? theme.accent : theme.fillStrong,
              backgroundColor: item.completed ? theme.accent : 'transparent'
            }
          ]}
        >
          {item.completed ? <OneIcon name={icons.check} size={12} color="#FFFFFF" /> : null}
        </Pressable>
      ) : (
        <IconTile icon={iconForType(item.type)} size={38} />
      )}

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: item.completed ? theme.textTertiary : theme.text,
              textDecorationLine: item.completed ? 'line-through' : 'none'
            }
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      {item.time ? (
        <View style={[styles.timePill, { backgroundColor: theme.fill }]}>
          <Text style={[styles.time, { color: theme.textSecondary }]}>{item.time}</Text>
        </View>
      ) : null}

      {showChevron ? <OneIcon name={icons.chevron} size={15} color={theme.textTertiary} /> : null}
    </Pressable>
  );
}

export function iconForType(type: OneItem['type']) {
  if (type === 'link') return icons.link;
  if (type === 'idea') return icons.idea;
  if (type === 'shopping') return icons.shopping;
  if (type === 'travel') return icons.travel;
  if (type === 'appointment') return icons.appointment;
  if (type === 'reminder') return icons.reminder;
  if (type === 'event') return icons.event;
  if (type === 'note') return icons.note;
  if (type === 'document') return icons.document;
  return icons.task;
}

function metaFor(item: OneItem, showDate: boolean) {
  const values = [
    showDate ? prettyDate(item.date) : undefined,
    item.category,
    item.userContext,
    item.location,
    item.merchant,
    item.amount !== undefined ? formatAmount(item.amount, item.currency) : undefined
  ].filter(Boolean);
  return values.join(' · ') || formatType(item.type);
}

function prettyDate(iso?: string) {
  if (!iso) return undefined;
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function formatAmount(amount: number, currency = 'EUR') {
  try { return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount); }
  catch { return `${amount.toFixed(2)} ${currency}`; }
}

function formatType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

const styles = StyleSheet.create({
  row: { minHeight: 72, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 15.5, fontWeight: '600', letterSpacing: -0.18 },
  meta: { fontSize: 12.5, marginTop: 4 },
  timePill: { minHeight: 28, paddingHorizontal: 9, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  time: { fontSize: 11.5, fontWeight: '700' }
});
