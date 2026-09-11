import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  applyUserContextPriority,
  confirmCaptureField,
  setCaptureDestination,
  setCaptureKind,
  type CaptureConfidence,
  type CaptureDraft,
  type CaptureField,
  type CaptureKind
} from '@/src/capture/core';
import { Surface } from '@/src/ui/primitives';
import { useTheme } from '@/src/theme/useTheme';
import type { OneDestination } from '@/src/types/item';

const kinds: { value: CaptureKind; label: string }[] = [
  { value: 'appointment', label: 'Appointment' },
  { value: 'event', label: 'Event' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'idea', label: 'Idea' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'document', label: 'Document' },
  { value: 'link', label: 'Link' },
  { value: 'image', label: 'Image' },
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' },
  { value: 'unknown', label: 'Not sure' }
];

const destinations: { value: OneDestination; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'saved', label: 'Saved' }
];

export function CaptureReviewEditor({
  draft,
  onChange,
  showExtractedText = true
}: {
  draft: CaptureDraft;
  onChange: (draft: CaptureDraft) => void;
  showExtractedText?: boolean;
}) {
  const theme = useTheme();

  function setField<K extends keyof CaptureDraft>(key: K, value: CaptureDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  function updateTextField(
    key: 'title' | 'date' | 'time' | 'location' | 'category' | 'merchant' | 'currency',
    field: CaptureField,
    value: string
  ) {
    onChange(confirmCaptureField({ ...draft, [key]: value || undefined }, field));
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heading, { color: theme.text }]}>Review capture</Text>
          <Text style={[styles.subheading, { color: theme.textSecondary }]}>Correct only what ONE got wrong.</Text>
        </View>
        {draft.needsReview.length ? (
          <View style={[styles.reviewBadge, { backgroundColor: theme.fill }]}>
            <Text style={[styles.reviewBadgeText, { color: theme.warning }]}>{draft.needsReview.length} to review</Text>
          </View>
        ) : (
          <View style={[styles.reviewBadge, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.reviewBadgeText, { color: theme.accent }]}>Ready</Text>
          </View>
        )}
      </View>

      {draft.ambiguities.length ? (
        <View style={[styles.ambiguityCard, { backgroundColor: theme.fill, borderColor: theme.border }]}>
          <Text style={[styles.ambiguityTitle, { color: theme.text }]}>Check these details</Text>
          {draft.ambiguities.map((ambiguity) => (
            <Text key={`${ambiguity.code}-${ambiguity.field}`} style={[styles.ambiguityText, { color: theme.textSecondary }]}>• {ambiguity.message}</Text>
          ))}
        </View>
      ) : null}

      <Surface padded>
        <FieldLabel label="Type" confidence={draft.fieldConfidence.type} field="type" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kindRow}>
          {kinds.map((kind) => {
            const active = draft.captureKind === kind.value || (draft.captureKind === 'screenshot' && kind.value === 'image');
            return (
              <Pressable
                key={kind.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onChange(setCaptureKind(draft, kind.value))}
                style={[
                  styles.kindChip,
                  {
                    backgroundColor: active ? theme.accent : theme.fill,
                    borderColor: active ? theme.accent : theme.border
                  }
                ]}
              >
                <Text style={[styles.kindText, { color: active ? '#FFFFFF' : theme.textSecondary }]}>{kind.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Surface>

      <Surface>
        <ReviewField
          label="Title"
          field="title"
          value={draft.title}
          confidence={draft.fieldConfidence.title}
          onChange={(value) => updateTextField('title', 'title', value)}
          onConfirm={() => onChange(confirmCaptureField(draft, 'title'))}
          placeholder="Title"
        />
        <ReviewField
          label="Date"
          field="date"
          value={draft.date || ''}
          confidence={draft.fieldConfidence.date}
          onChange={(value) => updateTextField('date', 'date', value)}
          onConfirm={() => onChange(confirmCaptureField(draft, 'date'))}
          placeholder="YYYY-MM-DD"
        />
        <ReviewField
          label="Time"
          field="time"
          value={draft.time || ''}
          confidence={draft.fieldConfidence.time}
          onChange={(value) => updateTextField('time', 'time', value)}
          onConfirm={() => onChange(confirmCaptureField(draft, 'time'))}
          placeholder="HH:MM"
        />
        <ReviewField
          label="Location"
          field="location"
          value={draft.location || ''}
          confidence={draft.fieldConfidence.location}
          onChange={(value) => updateTextField('location', 'location', value)}
          onConfirm={() => onChange(confirmCaptureField(draft, 'location'))}
          placeholder="Optional"
        />
        <ReviewField
          label="Category"
          field="category"
          value={draft.category || ''}
          onChange={(value) => updateTextField('category', 'category', value)}
          placeholder="Optional"
          last
        />
      </Surface>

      {(draft.captureKind === 'receipt' || draft.captureKind === 'document' || draft.documentKind) ? (
        <Surface>
          <ReviewField
            label="Merchant"
            field="merchant"
            value={draft.merchant || ''}
            confidence={draft.fieldConfidence.merchant}
            onChange={(value) => updateTextField('merchant', 'merchant', value)}
            onConfirm={() => onChange(confirmCaptureField(draft, 'merchant'))}
            placeholder="Unknown"
          />
          <ReviewField
            label="Amount"
            field="amount"
            value={draft.amount === undefined ? '' : String(draft.amount)}
            confidence={draft.fieldConfidence.amount}
            onChange={(value) => {
              const amount = parseAmount(value);
              onChange(confirmCaptureField({ ...draft, amount }, 'amount'));
            }}
            onConfirm={() => onChange(confirmCaptureField(draft, 'amount'))}
            placeholder="Leave blank if unknown"
            keyboardType="decimal-pad"
          />
          <ReviewField
            label="Currency"
            field="currency"
            value={draft.currency || ''}
            confidence={draft.fieldConfidence.currency}
            onChange={(value) => updateTextField('currency', 'currency', value.toUpperCase().slice(0, 3))}
            onConfirm={() => onChange(confirmCaptureField(draft, 'currency'))}
            placeholder="EUR"
            last
          />
        </Surface>
      ) : null}

      <View style={styles.textBlock}>
        <FieldLabel label="Your context" confidence={draft.userContext ? 'high' : undefined} />
        <TextInput
          value={draft.userContext || ''}
          onChangeText={(value) => onChange(applyUserContextPriority(draft, value))}
          placeholder="Gift Dad, Barcelona, Tax 2026…"
          placeholderTextColor={theme.textTertiary}
          style={[styles.largeInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
          multiline
          accessibilityLabel="Your context"
        />
        <Text style={[styles.help, { color: theme.textTertiary }]}>Your words take priority over uncertain automatic classification.</Text>
      </View>

      <Surface padded>
        <FieldLabel label="Organize in" />
        <View style={styles.destinationRow}>
          {destinations.map((destination) => {
            const active = draft.destination === destination.value;
            return (
              <Pressable
                key={destination.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onChange(setCaptureDestination(draft, destination.value))}
                style={[
                  styles.destinationChip,
                  {
                    backgroundColor: active ? theme.accentSoft : theme.fill,
                    borderColor: active ? theme.accent : theme.border
                  }
                ]}
              >
                <Text style={[styles.destinationText, { color: active ? theme.accent : theme.textSecondary }]}>{destination.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {draft.needsReview.length ? (
          <Text style={[styles.help, { color: theme.textTertiary }]}>Unresolved details default to Inbox until you confirm them.</Text>
        ) : null}
      </Surface>

      <View style={styles.textBlock}>
        <FieldLabel label="Tags" />
        <TextInput
          value={draft.tags.join(', ')}
          onChangeText={(value) => setField('tags', splitTags(value))}
          placeholder="gift, dad, travel"
          placeholderTextColor={theme.textTertiary}
          style={[styles.singleInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
          autoCapitalize="none"
          accessibilityLabel="Tags"
        />
      </View>

      {showExtractedText ? (
        <View style={styles.textBlock}>
          <FieldLabel label="Extracted text" />
          <TextInput
            value={draft.extractedText || ''}
            onChangeText={(value) => setField('extractedText', value || undefined)}
            placeholder="No text recognized"
            placeholderTextColor={theme.textTertiary}
            style={[styles.extractedInput, { color: theme.textSecondary, backgroundColor: theme.surface, borderColor: theme.border }]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Extracted text"
          />
          <Text style={[styles.help, { color: theme.textTertiary }]}>Recognized text is separate from your own notes and can be corrected without changing the original attachment.</Text>
        </View>
      ) : null}
    </View>
  );

  function FieldLabel({ label, confidence, field }: { label: string; confidence?: CaptureConfidence; field?: CaptureField }) {
    return (
      <View style={styles.fieldLabelRow}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
        {confidence ? (
          <Pressable
            accessibilityRole={field ? 'button' : undefined}
            accessibilityLabel={field ? `${label} confidence ${confidence}. Mark as confirmed.` : `${label} confidence ${confidence}`}
            onPress={field ? () => onChange(confirmCaptureField(draft, field)) : undefined}
          >
            <Text style={[styles.confidence, { color: confidenceColor(confidence) }]}>{confidence.toUpperCase()}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  function ReviewField({
    label,
    field,
    value,
    confidence,
    onChange: onFieldChange,
    onConfirm,
    placeholder,
    keyboardType = 'default',
    last = false
  }: {
    label: string;
    field: CaptureField;
    value: string;
    confidence?: CaptureConfidence;
    onChange: (value: string) => void;
    onConfirm?: () => void;
    placeholder: string;
    keyboardType?: 'default' | 'decimal-pad';
    last?: boolean;
  }) {
    const unresolved = draft.needsReview.includes(field);
    return (
      <View style={[styles.fieldRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
        <View style={styles.fieldNameWrap}>
          <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</Text>
          {confidence ? <Text style={[styles.inlineConfidence, { color: confidenceColor(confidence) }]}>{confidence}</Text> : null}
          {unresolved && onConfirm ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Confirm ${label}`} onPress={onConfirm} hitSlop={8}>
              <Text style={[styles.confirmText, { color: theme.accent }]}>{value ? 'Confirm' : 'Keep blank'}</Text>
            </Pressable>
          ) : null}
        </View>
        <TextInput
          value={value}
          onChangeText={onFieldChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          keyboardType={keyboardType}
          style={[styles.rowInput, { color: theme.text }]}
          accessibilityLabel={label}
          autoCapitalize={label === 'Currency' ? 'characters' : 'sentences'}
        />
      </View>
    );
  }

  function confidenceColor(confidence: CaptureConfidence) {
    if (confidence === 'high') return theme.success;
    if (confidence === 'medium') return theme.warning;
    return theme.danger;
  }
}

function splitTags(value: string) {
  return Array.from(new Set(value.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean)));
}

function parseAmount(value: string) {
  const clean = value.trim().replace(/[^0-9.,-]/g, '');
  if (!clean) return undefined;
  const comma = clean.lastIndexOf(',');
  const dot = clean.lastIndexOf('.');
  let normalized = clean;
  if (comma > dot) normalized = clean.replace(/\./g, '').replace(',', '.');
  else if (dot > comma) normalized = clean.replace(/,/g, '');
  else normalized = clean.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heading: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  subheading: { marginTop: 3, fontSize: 12.5 },
  reviewBadge: { minHeight: 28, borderRadius: 10, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  reviewBadgeText: { fontSize: 10.5, fontWeight: '800' },
  ambiguityCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 13, gap: 5 },
  ambiguityTitle: { fontSize: 12.5, fontWeight: '800', marginBottom: 2 },
  ambiguityText: { fontSize: 11.5, lineHeight: 17 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  fieldLabel: { fontSize: 11.5, fontWeight: '700' },
  confidence: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.6 },
  kindRow: { gap: 7 },
  kindChip: { minHeight: 34, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  kindText: { fontSize: 11.5, fontWeight: '700' },
  fieldRow: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  fieldNameWrap: { width: 90 },
  rowLabel: { fontSize: 12, fontWeight: '700' },
  inlineConfidence: { marginTop: 2, fontSize: 9.5, textTransform: 'uppercase', fontWeight: '800' },
  confirmText: { marginTop: 3, fontSize: 9.5, fontWeight: '800' },
  rowInput: { flex: 1, minHeight: 44, fontSize: 14, textAlign: 'right' },
  textBlock: { gap: 0 },
  largeInput: { minHeight: 88, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 13, fontSize: 14, lineHeight: 20, textAlignVertical: 'top' },
  singleInput: { minHeight: 50, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, fontSize: 14 },
  extractedInput: { minHeight: 128, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 13, fontSize: 12.5, lineHeight: 18 },
  destinationRow: { flexDirection: 'row', gap: 8 },
  destinationChip: { flex: 1, minHeight: 38, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  destinationText: { fontSize: 11.5, fontWeight: '800' },
  help: { marginTop: 6, marginLeft: 2, fontSize: 10.5, lineHeight: 15 }
});
