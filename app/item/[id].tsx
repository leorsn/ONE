import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { iconForType } from '@/src/ui/OneItemRow';
import { EmptyState, IconTile, PrimaryButton, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

export default function ItemDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, update, remove } = useItems();
  const item = useMemo(() => items.find((candidate) => candidate.id === id), [items, id]);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [context, setContext] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setDate(item.date || '');
    setTime(item.time || '');
    setCategory(item.category || '');
    setLocation(item.location || '');
    setContext(item.userContext || '');
    setNotes(item.notes || '');
    setSaved(item.saved);
    setCompleted(item.completed);
  }, [item?.id]);

  if (!item) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.missing}>
          <EmptyState icon={icons.note} title="Item not found" body="This memory may have been removed." />
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function saveChanges() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await update(item.id, {
        title: title.trim(),
        date: clean(date),
        time: clean(time),
        category: clean(category),
        location: clean(location),
        userContext: clean(context),
        notes: clean(notes),
        saved,
        completed
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete this item?', 'This removes it from ONE and your synced account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await remove(item.id);
          router.back();
        }
      }
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Details</Text>
          <Pressable onPress={confirmDelete} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.delete} size={17} color={theme.danger} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <IconTile icon={iconForType(item.type)} size={54} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.type, { color: theme.accent }]}>{formatType(item.type)}</Text>
            <Text style={[styles.source, { color: theme.textSecondary }]}>
              {sourceLabel(item.sourceType)} · {formatUpdated(item.updatedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[styles.titleInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
            placeholder="Title"
            placeholderTextColor={theme.textTertiary}
            multiline
          />
        </View>

        <Surface>
          <FieldRow label="Date" value={date} onChange={setDate} placeholder="YYYY-MM-DD" icon={icons.calendar} />
          <FieldRow label="Time" value={time} onChange={setTime} placeholder="HH:MM" icon={icons.clock} />
          <FieldRow label="Category" value={category} onChange={setCategory} placeholder="General" icon={icons.saved} />
          <FieldRow label="Location" value={location} onChange={setLocation} placeholder="Optional" icon={icons.travel} last />
        </Surface>

        <View style={styles.block}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Context</Text>
          <TextInput
            value={context}
            onChangeText={setContext}
            style={[styles.largeInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
            placeholder="What should ONE remember this as?"
            placeholderTextColor={theme.textTertiary}
            multiline
          />
        </View>

        <View style={styles.block}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[styles.largeInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
            placeholder="Add notes"
            placeholderTextColor={theme.textTertiary}
            multiline
          />
        </View>

        {item.extractedText ? (
          <View style={styles.block}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Recognized text</Text>
            <Surface padded>
              <Text style={[styles.extracted, { color: theme.textSecondary }]} selectable>{item.extractedText}</Text>
            </Surface>
          </View>
        ) : null}

        {item.url ? (
          <Pressable
            onPress={() => Linking.openURL(item.url!)}
            style={[styles.linkCard, { backgroundColor: theme.accentSoft }]}
          >
            <OneIcon name={icons.link} size={18} color={theme.accent} />
            <Text style={[styles.linkText, { color: theme.accent }]} numberOfLines={1}>{item.url}</Text>
            <OneIcon name={icons.chevron} size={14} color={theme.accent} />
          </Pressable>
        ) : null}

        <Surface>
          <ToggleRow label="Saved" value={saved} onChange={setSaved} icon={icons.saved} />
          <ToggleRow label="Completed" value={completed} onChange={setCompleted} icon={icons.check} last />
        </Surface>

        <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} icon={icons.check} onPress={saveChanges} disabled={saving || !title.trim()} />

        <Pressable onPress={confirmDelete} style={styles.deleteAction}>
          <OneIcon name={icons.delete} size={16} color={theme.danger} />
          <Text style={[styles.deleteText, { color: theme.danger }]}>Delete item</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );

  function FieldRow({
    label,
    value,
    onChange,
    placeholder,
    icon,
    last = false
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    icon: (typeof icons)[keyof typeof icons];
    last?: boolean;
  }) {
    return (
      <View style={[styles.fieldRow, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <IconTile icon={icon} tone="neutral" size={34} />
        <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          style={[styles.fieldInput, { color: theme.text }]}
          autoCapitalize="none"
        />
      </View>
    );
  }

  function ToggleRow({
    label,
    value,
    onChange,
    icon,
    last = false
  }: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    icon: (typeof icons)[keyof typeof icons];
    last?: boolean;
  }) {
    return (
      <View style={[styles.fieldRow, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <IconTile icon={icon} tone="neutral" size={34} />
        <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
        <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.accent }} />
      </View>
    );
  }
}

function clean(value: string) { return value.trim() || undefined; }
function formatType(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
function sourceLabel(value: string) {
  if (value === 'screenshot') return 'Screenshot';
  if (value === 'share') return 'Shared';
  if (value === 'manual') return 'Captured';
  return formatType(value);
}
function formatUpdated(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 20 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 4 },
  type: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.9 },
  source: { marginTop: 5, fontSize: 12.5 },
  block: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', marginLeft: 2 },
  titleInput: { minHeight: 72, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 15, fontSize: 22, lineHeight: 27, fontWeight: '700', textAlignVertical: 'top' },
  fieldRow: { minHeight: 60, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldLabel: { width: 72, fontSize: 14, fontWeight: '600' },
  fieldInput: { flex: 1, fontSize: 14, textAlign: 'right', paddingVertical: 10 },
  largeInput: { minHeight: 108, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 14, fontSize: 14.5, lineHeight: 20, textAlignVertical: 'top' },
  extracted: { fontSize: 13, lineHeight: 19 },
  linkCard: { minHeight: 50, borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkText: { flex: 1, fontSize: 13, fontWeight: '650' },
  deleteAction: { minHeight: 44, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 13.5, fontWeight: '700' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }
});
