import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { iconForType } from '@/src/ui/OneItemRow';
import { EmptyState, NeverSignal, PrimaryButton, SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';

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
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);

  useEffect(() => {
    if (!item) return;
    setTitle(item.title);
    setDate(item.date || '');
    setTime(item.time || '');
    setCategory(item.category || '');
    setLocation(item.location || '');
    setContext(item.userContext || item.summary || '');
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
  const sourceUri = currentItem.localAttachmentUri || currentItem.imageUrl || currentItem.attachmentUrl;
  const sourceIsImage = Boolean(sourceUri && (
    currentItem.localAttachmentMimeType?.startsWith('image/') ||
    ['scan', 'photo', 'screenshot'].includes(currentItem.sourceType)
  ));
  const savedLinks = Array.from(new Set([
    currentItem.url,
    ...(currentItem.extractedUrls || []),
    ...currentItem.entities.filter((entity) => entity.startsWith('url:')).map((entity) => entity.slice(4))
  ].filter((value): value is string => Boolean(value))));

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
            style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.chevronLeft} size={16} color={theme.text} />
          </Pressable>
          <View style={styles.navBrand}>
            <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
            <NeverSignal compact />
          </View>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.identity}>
          <View style={[styles.identityGlyph, { borderColor: theme.border }]}>
            <OneIcon name={iconForType(currentItem.type)} size={18} color={typeColor(currentItem.type, theme)} />
          </View>
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

        {sourceUri ? (
          <View style={styles.section}>
            <SectionHeader title="Original" meta={currentItem.localAttachmentName || undefined} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={sourceExpanded ? 'Collapse original' : 'Open original'}
              onPress={() => setSourceExpanded((value) => !value)}
              style={({ pressed }) => [styles.sourceCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.74 : 1 }]}
            >
              {sourceIsImage ? (
                <Image
                  source={{ uri: sourceUri }}
                  style={[styles.sourceImage, sourceExpanded && styles.sourceImageExpanded, { backgroundColor: theme.fill }]}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.sourceFile}>
                  <MemoryGlyph icon={icons.document} color={theme.sky} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sourceFileTitle, { color: theme.text }]}>{currentItem.localAttachmentName || 'Original file'}</Text>
                    <Text style={[styles.sourceFileMeta, { color: theme.textSecondary }]}>Original preserved by NEVER</Text>
                  </View>
                </View>
              )}
              <View style={[styles.sourceActionRow, { borderTopColor: theme.border }]}>
                <Text style={[styles.sourceAction, { color: theme.textSecondary }]}>{sourceExpanded ? 'Close original' : 'Open original'}</Text>
                <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
              </View>
            </Pressable>
          </View>
        ) : null}

        {(currentItem.type === 'document' || currentItem.merchant || currentItem.amount !== undefined) ? (
          <View style={styles.section}>
            <SectionHeader title="Document" />
            <Surface padded>
              <View style={styles.documentHeader}>
                <MemoryGlyph icon={icons.document} color={theme.sky} />
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
            style={[styles.largeInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
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
            style={[styles.largeInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
            placeholder="Add notes"
            placeholderTextColor={theme.textTertiary}
            accessibilityLabel="Notes"
            multiline
          />
        </View>

        {savedLinks.length ? (
          <View style={styles.section}>
            <SectionHeader title="Links" meta={`${savedLinks.length} found`} />
            <Surface>
              {savedLinks.map((link, index) => (
                <Pressable
                  key={`${link}-${index}`}
                  accessibilityRole="link"
                  accessibilityLabel={`Open saved link ${index + 1}`}
                  onPress={() => Linking.openURL(normalizeWebUrl(link))}
                  style={({ pressed }) => [styles.extractedLink, { borderBottomColor: theme.border, opacity: pressed ? 0.64 : 1 }]}
                >
                  <MemoryGlyph icon={icons.link} color={theme.sky} />
                  <Text style={[styles.extractedLinkText, { color: theme.text }]} numberOfLines={2}>{link}</Text>
                  <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
                </Pressable>
              ))}
            </Surface>
          </View>
        ) : null}

        {currentItem.extractedText ? (
          <View style={styles.section}>
            <SectionHeader title="Recognized text" />
            <Surface padded>
              <Text style={[styles.extracted, { color: theme.textSecondary }]} selectable>{currentItem.extractedText}</Text>
            </Surface>
          </View>
        ) : null}

        {currentItem.url && !savedLinks.length ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open saved link"
            onPress={() => Linking.openURL(currentItem.url!)}
            style={({ pressed }) => [styles.linkCard, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <MemoryGlyph icon={icons.link} color={theme.sky} />
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

  function MemoryGlyph({ icon, color }: { icon: (typeof icons)[keyof typeof icons]; color: string }) {
    return (
      <View style={[styles.memoryGlyph, { borderColor: theme.border }]}>
        <OneIcon name={icon} size={17} color={color} />
      </View>
    );
  }

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
          <MemoryGlyph icon={icon} color={theme.textSecondary} />
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
        <MemoryGlyph icon={icon} color={theme.textSecondary} />
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
        <MemoryGlyph icon={icon} color={theme.textSecondary} />
        <Text style={[styles.fieldLabel, { color: theme.text }]}>{label}</Text>
        <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: theme.chrome }} />
      </View>
    );
  }
}

function normalizeWebUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
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

function typeColor(type: string, theme: ReturnType<typeof useTheme>) {
  if (type === 'document' || type === 'link') return theme.sky;
  if (type === 'idea' || type === 'note') return theme.plum;
  if (type === 'reminder' || type === 'task' || type === 'shopping') return theme.warning;
  return theme.textSecondary;
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
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 38, gap: 20 },
  nav: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 38, height: 38, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark: { fontSize: 10.75, fontWeight: '700', letterSpacing: 3.2 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 1 },
  identityGlyph: { width: 30, height: 36, borderLeftWidth: 2, alignItems: 'center', justifyContent: 'center' },
  memoryGlyph: { width: 27, height: 34, borderLeftWidth: 2, alignItems: 'center', justifyContent: 'center' },
  type: { fontSize: 8.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.3 },
  source: { marginTop: 3, fontSize: 10.5, lineHeight: 14 },
  titleBlock: { gap: 5 },
  fieldEyebrow: { fontSize: 8.25, fontWeight: '700', letterSpacing: 1.5 },
  titleInput: { minHeight: 58, paddingVertical: 3, fontFamily: editorialFontFamily, fontSize: 29, lineHeight: 33, fontWeight: '400', letterSpacing: -0.8, textAlignVertical: 'top' },
  section: { gap: 9 },
  sourceCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', padding: 9 },
  sourceImage: { width: '100%', height: 210, borderRadius: 10 },
  sourceImageExpanded: { height: 540 },
  sourceFile: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 7 },
  sourceFileTitle: { fontSize: 13.25, fontWeight: '600' },
  sourceFileMeta: { marginTop: 3, fontSize: 10.75 },
  sourceActionRow: { minHeight: 36, marginTop: 3, paddingTop: 7, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  sourceAction: { fontSize: 11.25, fontWeight: '600' },
  extractedLink: { minHeight: 58, paddingHorizontal: 13, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  extractedLinkText: { flex: 1, fontSize: 11.25, lineHeight: 15.5, fontWeight: '500' },
  documentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  documentTitle: { fontSize: 14, lineHeight: 17.5, fontWeight: '600' },
  documentMeta: { marginTop: 3, fontSize: 11 },
  documentAmount: { fontSize: 14.25, fontWeight: '600', letterSpacing: -0.12 },
  documentDetails: { marginTop: 13, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { width: 74, fontSize: 10.25, fontWeight: '600' },
  infoValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '500' },
  fieldRow: { minHeight: 60, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  fieldLabel: { width: 68, fontSize: 13, fontWeight: '600' },
  fieldInput: { flex: 1, fontSize: 13, textAlign: 'right', paddingVertical: 9 },
  nativePickerWrap: { flex: 1, alignItems: 'flex-end' },
  pickerButton: { flex: 1, minHeight: 34, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, alignItems: 'flex-end', justifyContent: 'center' },
  pickerButtonText: { fontSize: 12, fontWeight: '600' },
  clearButton: { width: 25, height: 30, alignItems: 'center', justifyContent: 'center' },
  largeInput: { minHeight: 104, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, padding: 13, fontSize: 13.25, lineHeight: 19.5, textAlignVertical: 'top' },
  extracted: { fontSize: 12, lineHeight: 18.5 },
  linkCard: { minHeight: 60, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  linkLabel: { fontSize: 7.5, fontWeight: '700', letterSpacing: 1 },
  linkText: { marginTop: 3, fontSize: 11.5, fontWeight: '500' },
  deleteAction: { minHeight: 42, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 12, fontWeight: '600' },
  missing: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }
});
