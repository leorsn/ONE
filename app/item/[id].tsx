import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import CommunityDateTimePicker from '@expo/ui/community/datetime-picker';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { iconForType } from '@/src/ui/OneItemRow';
import { OneIcon, icons } from '@/src/ui/icons';
import {
  V5Chevron,
  V5Group,
  V5IconButton,
  V5SectionHeader,
  useNeverV5Palette
} from '@/src/ui/appleV5';

export default function ItemDetailScreen() {
  const p = useNeverV5Palette();
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
    // Form state intentionally reloads only when navigation changes to another memory.
    // A background sync of this item must not overwrite unsaved user edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  if (!item) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]}>
        <View style={styles.missing}>
          <View style={[styles.missingIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.note} size={19} color={p.chrome} /></View>
          <Text style={[styles.missingTitle, { color: p.label }]}>Memory not found</Text>
          <Text style={[styles.missingBody, { color: p.secondary }]}>This memory may have been removed.</Text>
          <Pressable onPress={() => router.back()}><Text style={[styles.missingBack, { color: p.chrome }]}>Go Back</Text></Pressable>
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

  async function openOriginal() {
    if (!sourceUri) return;
    await Haptics.selectionAsync();

    if (sourceIsImage) {
      setSourceExpanded((value) => !value);
      return;
    }

    try {
      if (/^https?:\/\//i.test(sourceUri)) {
        const supported = await Linking.canOpenURL(sourceUri);
        if (!supported) throw new Error('unsupported');
        await Linking.openURL(sourceUri);
        return;
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Original unavailable', 'This device cannot open the saved original with another app.');
        return;
      }

      await Sharing.shareAsync(sourceUri, {
        mimeType: currentItem.localAttachmentMimeType
      });
    } catch {
      Alert.alert('Could not open original', 'NEVER still has the saved original, but iOS could not hand it to another app.');
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
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <V5IconButton icon={icons.chevronLeft} accessibilityLabel="Go back" onPress={() => router.back()} />
          <Text style={[styles.navTitle, { color: p.label }]}>Memory</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.identity}>
          <View style={[styles.identityGlyph, { backgroundColor: p.fillSoft }]}>
            <OneIcon name={iconForType(currentItem.type)} size={17} color={p.chrome} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.type, { color: p.chrome }]}>{formatType(currentItem.type)}</Text>
            <Text style={[styles.source, { color: p.tertiary }]}>{sourceLabel(currentItem.sourceType)} · Updated {formatUpdated(currentItem.updatedAt)}</Text>
          </View>
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          style={[styles.titleInput, { color: p.label }]}
          placeholder="Title"
          placeholderTextColor={p.tertiary}
          accessibilityLabel="Item title"
          multiline
        />

        {sourceUri ? (
          <View style={styles.section}>
            <V5SectionHeader title="Original" meta={currentItem.localAttachmentName || undefined} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={sourceIsImage ? (sourceExpanded ? 'Close original image' : 'Open original image') : 'Open original file'}
              onPress={() => void openOriginal()}
              style={({ pressed }) => [styles.sourceCard, { backgroundColor: p.surface, opacity: pressed ? 0.74 : 1 }]}
            >
              {sourceIsImage ? (
                <Image source={{ uri: sourceUri }} style={[styles.sourceImage, sourceExpanded && styles.sourceImageExpanded, { backgroundColor: p.fill }]} resizeMode="contain" />
              ) : (
                <View style={styles.sourceFile}>
                  <MemoryGlyph icon={icons.document} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sourceFileTitle, { color: p.label }]}>{currentItem.localAttachmentName || 'Original file'}</Text>
                    <Text style={[styles.sourceFileMeta, { color: p.secondary }]}>Original preserved by NEVER</Text>
                  </View>
                </View>
              )}
              <View style={[styles.sourceActionRow, { borderTopColor: p.separator }]}>
                <Text style={[styles.sourceAction, { color: p.secondary }]}>
                  {sourceIsImage ? (sourceExpanded ? 'Close Original' : 'Open Original') : 'Open Original'}
                </Text>
                <V5Chevron />
              </View>
            </Pressable>
          </View>
        ) : null}

        {(currentItem.type === 'document' || currentItem.merchant || currentItem.amount !== undefined) ? (
          <View style={styles.section}>
            <V5SectionHeader title="Document" />
            <V5Group style={styles.documentGroup}>
              <View style={styles.documentHeader}>
                <MemoryGlyph icon={icons.document} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.documentTitle, { color: p.label }]}>{formatDocumentKind(currentItem.documentKind)}</Text>
                  <Text style={[styles.documentMeta, { color: p.secondary }]}>{currentItem.merchant || 'Saved document'}</Text>
                </View>
                {currentItem.amount !== undefined ? <Text style={[styles.documentAmount, { color: p.label }]}>{formatMoney(currentItem.amount, currentItem.currency)}</Text> : null}
              </View>
              <View style={[styles.documentDetails, { borderTopColor: p.separator }]}>
                {currentItem.merchant ? <InfoLine label="Merchant" value={currentItem.merchant} /> : null}
                {currentItem.date ? <InfoLine label="Date" value={formatHumanDate(currentItem.date)} /> : null}
                {currentItem.currency ? <InfoLine label="Currency" value={currentItem.currency} /> : null}
              </View>
            </V5Group>
          </View>
        ) : null}

        <View style={styles.section}>
          <V5SectionHeader title="Details" />
          <V5Group>
            <DateTimeFieldRow kind="date" label="Date" value={date} icon={icons.calendar} />
            <DateTimeFieldRow kind="time" label="Time" value={time} icon={icons.clock} />
            <TextFieldRow label="Category" value={category} onChange={setCategory} placeholder="General" icon={icons.saved} />
            <TextFieldRow label="Location" value={location} onChange={setLocation} placeholder="Optional" icon={icons.travel} last />
          </V5Group>
        </View>

        <View style={styles.section}>
          <V5SectionHeader title="Context" />
          <TextInput value={context} onChangeText={setContext} style={[styles.largeInput, { color: p.label, backgroundColor: p.surface }]} placeholder="What should NEVER remember this as?" placeholderTextColor={p.tertiary} accessibilityLabel="Memory context" multiline />
        </View>

        <View style={styles.section}>
          <V5SectionHeader title="Notes" />
          <TextInput value={notes} onChangeText={setNotes} style={[styles.largeInput, { color: p.label, backgroundColor: p.surface }]} placeholder="Add notes" placeholderTextColor={p.tertiary} accessibilityLabel="Notes" multiline />
        </View>

        {savedLinks.length ? (
          <View style={styles.section}>
            <V5SectionHeader title="Links" meta={`${savedLinks.length}`} />
            <V5Group>
              {savedLinks.map((link, index) => (
                <Pressable key={`${link}-${index}`} onPress={() => Linking.openURL(normalizeWebUrl(link))} style={({ pressed }) => [styles.extractedLink, index !== savedLinks.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
                  <MemoryGlyph icon={icons.link} />
                  <Text style={[styles.extractedLinkText, { color: p.label }]} numberOfLines={2}>{link}</Text>
                  <V5Chevron />
                </Pressable>
              ))}
            </V5Group>
          </View>
        ) : null}

        {currentItem.extractedText ? (
          <View style={styles.section}>
            <V5SectionHeader title="Recognized Text" />
            <V5Group style={styles.extractedGroup}>
              <Text style={[styles.extracted, { color: p.secondary }]} selectable>{currentItem.extractedText}</Text>
            </V5Group>
          </View>
        ) : null}

        {currentItem.url && !savedLinks.length ? (
          <Pressable onPress={() => Linking.openURL(currentItem.url!)} style={({ pressed }) => [styles.linkCard, { backgroundColor: p.surface, opacity: pressed ? 0.62 : 1 }]}>
            <MemoryGlyph icon={icons.link} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkLabel, { color: p.tertiary }]}>SAVED LINK</Text>
              <Text style={[styles.linkText, { color: p.label }]} numberOfLines={1}>{currentItem.url}</Text>
            </View>
            <V5Chevron />
          </Pressable>
        ) : null}

        <View style={styles.section}>
          <V5SectionHeader title="Status" />
          <V5Group>
            <ToggleRow label="Saved" value={saved} onChange={setSaved} icon={icons.saved} />
            <ToggleRow label="Completed" value={completed} onChange={setCompleted} icon={icons.check} last />
          </V5Group>
        </View>

        <Pressable disabled={saving || !title.trim()} onPress={saveChanges} style={({ pressed }) => [styles.primaryButton, { backgroundColor: p.graphite, opacity: saving || !title.trim() ? 0.38 : pressed ? 0.72 : 1 }]}>
          <OneIcon name={icons.check} size={15} color={p.dark ? '#111113' : '#FFFFFF'} />
          <Text style={[styles.primaryButtonText, { color: p.dark ? '#111113' : '#FFFFFF' }]}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </Pressable>

        <Pressable onPress={confirmDelete} style={styles.deleteAction}>
          <OneIcon name={icons.delete} size={14} color={p.danger} />
          <Text style={[styles.deleteText, { color: p.danger }]}>Delete Memory</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );

  function MemoryGlyph({ icon }: { icon: (typeof icons)[keyof typeof icons] }) {
    return <View style={[styles.memoryGlyph, { backgroundColor: p.fillSoft }]}><OneIcon name={icon} size={15} color={p.chrome} /></View>;
  }

  function InfoLine({ label, value }: { label: string; value: string }) {
    return <View style={styles.infoLine}><Text style={[styles.infoLabel, { color: p.tertiary }]}>{label}</Text><Text style={[styles.infoValue, { color: p.label }]} numberOfLines={1}>{value}</Text></View>;
  }

  function DateTimeFieldRow({ kind, label, value, icon }: { kind: 'date' | 'time'; label: string; value: string; icon: (typeof icons)[keyof typeof icons] }) {
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
        <View style={[styles.fieldRow, { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <MemoryGlyph icon={icon} />
          <Text style={[styles.fieldLabel, { color: p.label }]}>{label}</Text>
          {isWeb ? (
            <TextInput value={value} onChangeText={kind === 'date' ? setDate : setTime} placeholder={kind === 'date' ? 'YYYY-MM-DD' : 'HH:MM'} placeholderTextColor={p.tertiary} accessibilityLabel={label} style={[styles.fieldInput, { color: p.label }]} autoCapitalize="none" />
          ) : isIos && value ? (
            <View style={styles.nativePickerWrap}>
              <CommunityDateTimePicker value={pickerValue} mode={kind} display="compact" is24Hour accentColor={p.chrome} onValueChange={(_event, selected) => applySelected(selected)} />
            </View>
          ) : (
            <Pressable onPress={activatePicker} style={({ pressed }) => [styles.pickerButton, { backgroundColor: p.fillSoft, opacity: pressed ? 0.62 : 1 }]}>
              <Text style={[styles.pickerButtonText, { color: value ? p.label : p.tertiary }]}>{value ? (kind === 'date' ? formatHumanDate(value) : value) : `Add ${label.toLowerCase()}`}</Text>
            </Pressable>
          )}
          {value ? <Pressable hitSlop={8} onPress={clearValue} style={styles.clearButton}><OneIcon name={icons.close} size={11.5} color={p.tertiary} /></Pressable> : null}
        </View>
        {!isWeb && !isIos && activePicker === kind ? (
          <CommunityDateTimePicker value={pickerValue} mode={kind} presentation="dialog" is24Hour accentColor={p.chrome} onValueChange={(_event, selected) => applySelected(selected)} onDismiss={() => setActivePicker(null)} />
        ) : null}
      </>
    );
  }

  function TextFieldRow({ label, value, onChange, placeholder, icon, last = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; icon: (typeof icons)[keyof typeof icons]; last?: boolean }) {
    return (
      <View style={[styles.fieldRow, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <MemoryGlyph icon={icon} />
        <Text style={[styles.fieldLabel, { color: p.label }]}>{label}</Text>
        <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={p.tertiary} accessibilityLabel={label} style={[styles.fieldInput, { color: p.label }]} autoCapitalize="none" />
      </View>
    );
  }

  function ToggleRow({ label, value, onChange, icon, last = false }: { label: string; value: boolean; onChange: (value: boolean) => void; icon: (typeof icons)[keyof typeof icons]; last?: boolean }) {
    return (
      <View style={[styles.fieldRow, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        <MemoryGlyph icon={icon} />
        <Text style={[styles.fieldLabel, { color: p.label }]}>{label}</Text>
        <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: p.chrome }} />
      </View>
    );
  }
}

function normalizeWebUrl(value: string) { return /^https?:\/\//i.test(value) ? value : `https://${value}`; }
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
function formatUpdated(value: string) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value)); }
function formatHumanDate(value: string) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(dateValue(value)); }
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
function toTime(value: Date) { return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`; }

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 18 },
  nav: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: 16.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.18 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  identityGlyph: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  memoryGlyph: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  type: { fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.9 },
  source: { marginTop: 2, fontSize: 11.5, lineHeight: 14 },
  titleInput: { minHeight: 54, paddingVertical: 1, fontSize: 28, lineHeight: 33, fontWeight: '700', letterSpacing: -0.85, textAlignVertical: 'top' },
  section: { gap: 7 },
  sourceCard: { borderRadius: 16, overflow: 'hidden', padding: 8 },
  sourceImage: { width: '100%', height: 210, borderRadius: 10 },
  sourceImageExpanded: { height: 520 },
  sourceFile: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 6 },
  sourceFileTitle: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  sourceFileMeta: { marginTop: 2, fontSize: 11.5, lineHeight: 14 },
  sourceActionRow: { minHeight: 34, marginTop: 3, paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  sourceAction: { fontSize: 11.5, lineHeight: 14, fontWeight: '600' },
  documentGroup: { padding: 14 },
  documentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  documentTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  documentMeta: { marginTop: 2, fontSize: 11.5, lineHeight: 14 },
  documentAmount: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  documentDetails: { marginTop: 12, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, gap: 7 },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { width: 74, fontSize: 10.5, fontWeight: '600' },
  infoValue: { flex: 1, textAlign: 'right', fontSize: 12, fontWeight: '500' },
  fieldRow: { minHeight: 58, paddingLeft: 11, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  fieldLabel: { width: 64, fontSize: 14, lineHeight: 18, fontWeight: '500' },
  fieldInput: { flex: 1, fontSize: 13.5, lineHeight: 17, textAlign: 'right', paddingVertical: 8 },
  nativePickerWrap: { flex: 1, alignItems: 'flex-end' },
  pickerButton: { flex: 1, minHeight: 32, borderRadius: 9, paddingHorizontal: 10, alignItems: 'flex-end', justifyContent: 'center' },
  pickerButtonText: { fontSize: 12.5, lineHeight: 16, fontWeight: '500' },
  clearButton: { width: 24, height: 28, alignItems: 'center', justifyContent: 'center' },
  largeInput: { minHeight: 96, borderRadius: 16, padding: 13, fontSize: 14, lineHeight: 20, textAlignVertical: 'top' },
  extractedGroup: { padding: 14 },
  extracted: { fontSize: 12.5, lineHeight: 19 },
  extractedLink: { minHeight: 54, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  extractedLinkText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontWeight: '500' },
  linkCard: { minHeight: 58, borderRadius: 16, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  linkLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  linkText: { marginTop: 2, fontSize: 12.5, lineHeight: 16, fontWeight: '500' },
  primaryButton: { minHeight: 46, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  deleteAction: { minHeight: 38, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 12.5, lineHeight: 16, fontWeight: '600' },
  missing: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', padding: 24 },
  missingIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  missingTitle: { marginTop: 12, fontSize: 18, lineHeight: 22, fontWeight: '700' },
  missingBody: { marginTop: 3, fontSize: 13, lineHeight: 18 },
  missingBack: { marginTop: 14, fontSize: 14, lineHeight: 18, fontWeight: '600' }
});