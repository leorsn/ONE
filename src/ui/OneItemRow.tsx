import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { IconTile } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

type RowTone = 'accent' | 'neutral' | 'success' | 'warning' | 'info' | 'memory';

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
  const previewUri = imagePreviewUri(item);
  const tone = toneFor(item);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${meta}`}
      accessibilityHint="Opens item details"
      onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
      style={({ pressed }) => [styles.row, { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
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
          style={[styles.check, { borderColor: item.completed ? theme.chrome : theme.fillStrong, backgroundColor: item.completed ? theme.chrome : 'transparent' }]}
        >
          {item.completed ? <OneIcon name={icons.check} size={11} color={theme.background} /> : null}
        </Pressable>
      ) : previewUri ? (
        <Image source={{ uri: previewUri }} style={[styles.preview, { backgroundColor: theme.fill, borderColor: theme.border }]} resizeMode="cover" />
      ) : (
        <IconTile icon={iconForType(item.type)} tone={tone} size={36} />
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: item.completed ? theme.textTertiary : theme.text, textDecorationLine: item.completed ? 'line-through' : 'none' }]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>{meta}</Text>
      </View>

      {item.time ? <Text style={[styles.time, { color: theme.textTertiary }]}>{item.time}</Text> : null}
      {showChevron ? <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} /> : null}
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

function toneFor(item: OneItem): RowTone {
  if (item.type === 'link' || item.type === 'document') return 'info';
  if (item.type === 'idea' || item.type === 'note') return 'memory';
  if (item.type === 'reminder' || item.type === 'task' || item.type === 'shopping') return 'warning';
  if (item.type === 'appointment' || item.type === 'event' || item.type === 'travel') return 'accent';
  if (item.completed) return 'success';
  return 'neutral';
}

function metaFor(item: OneItem, showDate: boolean) {
  const values = [
    statusFor(item),
    showDate ? prettyDate(item.date) : undefined,
    item.category,
    item.userContext,
    item.location,
    item.merchant,
    item.amount !== undefined ? formatAmount(item.amount, item.currency) : undefined,
    syncLabel(item)
  ].filter(Boolean);
  return values.join(' · ') || formatType(item.type);
}

function statusFor(item: OneItem) {
  if (item.completed) return 'Completed';
  if (item.date) return 'Upcoming';
  if (item.saved) return 'Saved';
  return 'New';
}

function syncLabel(item: OneItem) {
  if (item.syncState === 'pending') return 'Sync pending';
  if (item.syncState === 'local') return 'On device';
  return undefined;
}

function imagePreviewUri(item: OneItem) {
  const candidate = item.localAttachmentUri || item.imageUrl;
  return candidate && /^(file|content|ph|https?):\/\//i.test(candidate) ? candidate : undefined;
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
  row: { minHeight: 72, paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.3, alignItems: 'center', justifyContent: 'center' },
  preview: { width: 40, height: 40, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 14.4, lineHeight: 18, fontWeight: '600', letterSpacing: -0.15 },
  meta: { fontSize: 11.25, lineHeight: 15, marginTop: 3 },
  time: { fontSize: 10.75, lineHeight: 14, fontWeight: '600', letterSpacing: 0.04 }
});
