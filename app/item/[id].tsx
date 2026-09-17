import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { iconForType } from '@/src/ui/OneItemRow';
import { EmptyState, IconTile, PrimaryButton, SectionHeader, Surface } from '@/src/ui/primitives';
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
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);

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
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()}>
            <Text style={{ color: theme.chrome, fontWeight: '600' }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentItem = item;

  async function saveChanges() {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await update(currentItem.id, {
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
    Alert.alert('Delete this item?', 'This removes it from NEVER and your synced account.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await remove(currentItem.id);
          router.back();
        }
      }
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.chevronLeft} size={17} color={theme.text} />
          </Pressable>
          <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.identity}>
          <IconTile icon={iconForType(currentItem.type)} tone="neutral" size={42} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.type, { color: theme.chrome }]}>{formatType(currentItem.type)}</Text>
            <Text style={[styles.source, { color: theme.textTertiary }]}>{sourceLabel(currentItem.sourceType)} · Updated {formatUpdated(currentItem.updatedAt)}</Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.fieldEyebrow, { color: theme.textTertiary }]}>MEMORY</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[styles.titleInput, { color: theme.text }]}
            placeholder="Title"
            placeholderTextColor={theme.textTertiary}
            accessibilityLabel="Item title"
            multiline
          />
        </View>

        {(currentItem.type === 'document' || currentItem.merchant || currentItem.amount !== undefined) ? (
          <View style={styles.section}>
            <SectionHeader title="Document" />
            <Surface padded>
              <View style={styles.documentHeader}>
                <IconTile icon={icons.document} tone="neutral" size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.documentTitle, { color: theme.text }]}>{formatDocumentKind(currentItem.documentKind)}</Text>
                  <Text style={[styles.documentMeta, { color: theme.textSecondary }]}>{currentItem.merchant || 'Saved document'}</Text>
                </View>
                {currentItem.amount !== undefined ? <Text style={[styles.documentAmount, { color: theme.text }]}>{formatMoney(currentItem.amount, currentItem.currency)}</Text> : null}
              </View>
              <View style={[styles.documentDetails, { borderTopColor: theme.border }]}>
                {currentItem.merchant ? <InfoLine label="Merchant" value={currentItem.merchant} /> : null}
                {currentItem.date ? <InfoLine label="Date" value={formatHumanDate(currentItem.date)} /> : null}
                {currentItem.currency ? <InfoLine label="Currency" value={currentItem.currency} /> : null}
              </View>
            </Surface>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Details" />
          <Surface>
            <DateTimeFieldRow kind="date" label="Date" value={date} icon={icons.calendar} />
            <DateTimeFieldRow kind="time" label="Time" value={time} icon={icons.clock} />
            <TextFieldRow label="Category" value={category} onChange={setCategory} placeholder="General" icon={icons.saved} />
            <TextFieldRow label="Location" value={location} onChange={setLocation} placeholder="Optional" icon={icons.travel} last />
          </Surface>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Context" />
          <TextInput
            value={context}
            onChangeText={setContext}
            style={[styles.largeInput, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            placeholder="What should NEVER remember this as?"
            placeholderTextColor={theme.textTertiary}
            accessibilityLabel="Memory context"
            multiline
          />
        </View>

        <View style={styles.section}>
          <SectionHeader title="Notes" />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            style={[styles.largeInput, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            placeholder="Add notes"
            placeholderTextColor={theme.textTertiary}
            accessibilityLabel="Notes"
            multiline
          />
        </View>

        {currentItem.extractedText ? (
          <View style={styles.section}>
            <SectionHeader title="Recognized text" />
            <Surface padded>
              <Text style={[styles.extracted, { color: theme.textSecondary }]} selectable>{currentItem.extractedText}</Text>
            </Surface>
          </View>
        ) : null}

        {currentItem.url ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open saved link"
            onPress={() => Linking.openURL(currentItem.url!)}
            style={({ pressed }) => [styles.linkCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <IconTile icon={icons.link} tone="neutral" size={36} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkLabel, { color: theme.textTertiary }]}>SAVED LINK</Text>
              <Text style={[styles.linkText, { color: theme.text }]} numberOfLines={1}>{currentItem.url}</Text>
            </View>
            <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Status" />
          <Surface>
            <ToggleRow label="Saved" value={saved} onChange={setSaved} icon={icons.saved} />
            <ToggleRow label="Completed" value={completed} onChange={setCompleted} icon={icons.check} last />
          </Surface>
        </View>

        <PrimaryButton label={saving ? 'Saving…' : 'Save changes'} icon={icons.check} onPress={saveChanges} disabled={saving || !title.trim()} />

        <Pressable accessibilityRole="button" accessibilityLabel="Delete item" onPress={confirmDelete} style={styles.deleteAction}>
          <OneIcon name={icons.delete} size={15} color={theme.danger} />
          <Text style={[styles.deleteText, { color: theme.danger }]}>Delete this memory</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );

  function InfoLine({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.infoLine}>
        <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
      </View>
    );
  }

  function DateTimeFieldRow({ kind, label, value, icon }: {
    kind: 'date' | 'time';
    label: string;
    value: string;
    icon: (typeof icons)[keyof typeof icons];
  }) {
    const pickerValue = kind === 'date' ? dateValue(value) : timeValue(value);
    const isIos = Platform.OS === 'ios';
    const isWeb = Platform.OS === 'web';

    function applySelected(next: Date) {
      if (kind === 'date') setDate(toIsoDate(next));
      else setTime(toTime(next));
      setActivePicker(null);
      void Haptics.selectionAsync();
    }

    function clearValue() {
      if (kind === 'date') setDate('');
      else setTime('');
      setActivePicker(null);
      void Haptics.selectionAsync();
    }

    function activatePicker() {
      if (isIos && !value) {
        applySelected(new Date());
        return;
      }
      setActivePicker(kind);
    }

    return (
      <>
        <View style={[styles.fieldRow, { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <IconTile icon={icon} tone="neutral" size={34} />
          <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>

          {isWeb ? (
            <TextInput
              value={value}
              onChangeText={kind === 'date' ? setDate : setTime}
              placeholder={kind === 'date' ? 'YYYY-MM-DD' : 'HH:MM'}
              placeholderTextColor={theme.textTertiary}
              accessibilityLabel={label}
              style={[styles.fieldInput, { color: theme.text }]}
              autoCapitalize="none"
            />
          ) : isIos && value ? (
            <View style={styles.nativePickerWrap}>
              <DateTimePicker
                value={pickerValue}
                mode={kind}
                display="compact"
                is24Hour
                accentColor={theme.chrome}
                onValueChange={(_event, selected) => applySelected(selected)}
              />
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${label}. ${value || 'Not set'}`}
              onPress={activatePicker}
              style={({ pressed }) => [styles.pickerButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
            >
              <Text style={[styles.pickerButtonText, { color: value ? theme.text : theme.textTertiary }]}>
                {value ? (kind === 'date' ? formatHumanDate(value) : value) : `Add ${label.toLowerCase()}`}
              </Text>
            </Pressable>
          )}

          {value ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Clear ${label.toLowerCase()}`} hitSlop={8} onPress={clearValue} style={styles.clearButton}>
              <OneIcon name={icons.close} size={12} color={theme.textTertiary} />
            </Pressable>
          ) : null}
        </View>

        {!isWeb && !isIos && activePicker === kind ? (
          <DateTimePicker
            value={pickerValue}
            mode={kind}
            presentation="dialog"
            is24Hour
            accentColor={theme.chrome}
            onValueChange={(_event, selected) => applySelected(selected)}
            onDismiss={() => setActivePicker(null)}
          />
        ) : null}
      </>
    );
  }

  function TextFieldRow({ label, value, onChange, placeholder, icon, last = false }: {
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
          accessibilityLabel={label}
          style={[styles.fieldInput, { color: theme.text }]}
          autoCapitalize="none"
        />
      </View>
    );
  }

  function ToggleRow({ label, value, onChange, icon, last = false }: {
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
        <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: theme.chrome }} />
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
function formatDocumentKind(value?: string) {
  if (!value) return 'Scanned document';
  return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function formatMoney(amount: number, currency = 'EUR') {
  try { return new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(amount); }
  catch { return `${amount.toFixed(2)} ${currency}`; }
}

function formatUpdated(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function formatHumanDate(value: string) {
  const parsed = dateValue(value);
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function dateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date();
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function timeValue(value: string) {
  const now = new Date();
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return now;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return now;
  now.setHours(hours, minutes, 0, 0);
  return now;
}

function toIsoDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTime(value: Date) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 42, gap: 24 },
  nav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 11, fontWeight: '600', letterSpacing: 3.2 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
  type: { fontSize: 8.75, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.35 },
  source: { marginTop: 4, fontSize: 10.75, lineHeight: 14 },
  titleBlock: { gap: 6 },
  fieldEyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.55 },
  titleInput: { minHeight: 62, paddingVertical: 4, fontSize: 29, lineHeight: 35, fontWeight: '600', letterSpacing: -0.95, textAlignVertical: 'top' },
  section: { gap: 10 },
  documentHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  documentTitle: { fontSize: 14.25, lineHeight: 18, fontWeight: '600' },
  documentMeta: { marginTop: 3, fontSize: 11.25 },
  documentAmount: { fontSize: 14.5, fontWeight: '600', letterSpacing: -0.15 },
  documentDetails: { marginTop: 14, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, gap: 9 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { width: 76, fontSize: 10.5, fontWeight: '600' },
  infoValue: { flex: 1, textAlign: 'right', fontSize: 12.25, fontWeight: '500' },
  fieldRow: { minHeight: 64, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldLabel: { width: 72, fontSize: 13.25, fontWeight: '600' },
  fieldInput: { flex: 1, fontSize: 13.25, textAlign: 'right', paddingVertical: 10 },
  nativePickerWrap: { flex: 1, alignItems: 'flex-end' },
  pickerButton: { flex: 1, minHeight: 36, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, alignItems: 'flex-end', justifyContent: 'center' },
  pickerButtonText: { fontSize: 12.25, fontWeight: '600' },
  clearButton: { width: 26, height: 32, alignItems: 'center', justifyContent: 'center' },
  largeInput: { minHeight: 112, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 14, fontSize: 13.5, lineHeight: 20, textAlignVertical: 'top' },
  extracted: { fontSize: 12.25, lineHeight: 19 },
  linkCard: { minHeight: 64, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  linkLabel: { fontSize: 7.75, fontWeight: '700', letterSpacing: 1.05 },
  linkText: { marginTop: 3, fontSize: 11.75, fontWeight: '500' },
  deleteAction: { minHeight: 44, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 12.25, fontWeight: '600' },
  missing: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }
});