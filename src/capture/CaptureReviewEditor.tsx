import { useState } from 'react';
import { neverType } from '@/src/theme/tokens';
import { NeverInput } from '@/src/ui/NeverInput';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { V5Group, V5Segmented, useNeverV5Palette } from '@/src/ui/appleV5';
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
  const p = useNeverV5Palette();
  const [editingTags, setEditingTags] = useState(false);
  const [rawTags, setRawTags] = useState('');

  function setField<K extends keyof CaptureDraft>(key: K, value: CaptureDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  function updateTextField(
    key: 'title' | 'date' | 'time' | 'location' | 'category' | 'merchant' | 'currency',
    field: CaptureField,
    value: string
  ) {
    onChange(confirmCaptureField({ ...draft, [key]: key === 'title' ? value : value || undefined }, field));
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headingRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heading, { color: p.label }]}>Review details</Text>
          <Text style={[styles.subheading, { color: p.secondary }]}>Keep what NEVER recognized and change only what needs context.</Text>
        </View>
        <View style={styles.reviewState}>
          <View style={[styles.stateDot, { backgroundColor: draft.needsReview.length ? p.warning : p.success }]} />
          <Text style={[styles.reviewStateText, { color: p.secondary }]}>{draft.needsReview.length ? `${draft.needsReview.length} to review` : 'Ready'}</Text>
        </View>
      </View>

      {draft.ambiguities.length ? (
        <View style={[styles.ambiguityCard, { borderTopColor: p.separator }]}>
          <Text style={[styles.ambiguityTitle, { color: p.warning }]}>Check these details</Text>
          {draft.ambiguities.map((ambiguity) => <Text key={`${ambiguity.code}-${ambiguity.field}`} style={[styles.ambiguityText, { color: p.secondary }]}>• {ambiguity.message}</Text>)}
        </View>
      ) : null}

      <View style={styles.section}>
        <FieldLabel onConfirm={(field) => onChange(confirmCaptureField(draft, field))} label="Type" confidence={draft.fieldConfidence.type} field="type" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.kindRow}>
          {kinds.map((kind) => {
            const active = draft.captureKind === kind.value || (draft.captureKind === 'screenshot' && kind.value === 'image');
            return (
              <Pressable
                key={kind.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onChange(setCaptureKind(draft, kind.value))}
                style={[styles.kindChip, { backgroundColor: active ? p.fill : 'transparent' }]}
              >
                <Text style={[styles.kindText, { color: active ? p.label : p.secondary, fontWeight: active ? '600' : '500' }]}>{kind.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <V5Group>
        <ReviewField needsReview={draft.needsReview} label="Title" field="title" value={draft.title} confidence={draft.fieldConfidence.title} onChange={(value) => updateTextField('title', 'title', value)} onConfirm={() => onChange(confirmCaptureField(draft, 'title'))} placeholder="Title" />
        <ReviewField needsReview={draft.needsReview} label="Date" field="date" value={draft.date || ''} confidence={draft.fieldConfidence.date} onChange={(value) => updateTextField('date', 'date', value)} onConfirm={() => onChange(confirmCaptureField(draft, 'date'))} placeholder="YYYY-MM-DD" />
        <ReviewField needsReview={draft.needsReview} label="Time" field="time" value={draft.time || ''} confidence={draft.fieldConfidence.time} onChange={(value) => updateTextField('time', 'time', value)} onConfirm={() => onChange(confirmCaptureField(draft, 'time'))} placeholder="HH:MM" />
        <ReviewField needsReview={draft.needsReview} label="Location" field="location" value={draft.location || ''} confidence={draft.fieldConfidence.location} onChange={(value) => updateTextField('location', 'location', value)} onConfirm={() => onChange(confirmCaptureField(draft, 'location'))} placeholder="Optional" />
        <ReviewField needsReview={draft.needsReview} label="Category" field="category" value={draft.category || ''} onChange={(value) => updateTextField('category', 'category', value)} placeholder="Optional" last />
      </V5Group>

      {(draft.captureKind === 'receipt' || draft.captureKind === 'document' || draft.documentKind) ? (
        <V5Group>
          <ReviewField needsReview={draft.needsReview} label="Merchant" field="merchant" value={draft.merchant || ''} confidence={draft.fieldConfidence.merchant} onChange={(value) => updateTextField('merchant', 'merchant', value)} onConfirm={() => onChange(confirmCaptureField(draft, 'merchant'))} placeholder="Unknown" />
          <ReviewField needsReview={draft.needsReview}
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
          <ReviewField needsReview={draft.needsReview} label="Currency" field="currency" value={draft.currency || ''} confidence={draft.fieldConfidence.currency} onChange={(value) => updateTextField('currency', 'currency', value.toUpperCase().slice(0, 3))} onConfirm={() => onChange(confirmCaptureField(draft, 'currency'))} placeholder="EUR" last />
        </V5Group>
      ) : null}

      <View style={styles.textBlock}>
        <FieldLabel onConfirm={(field) => onChange(confirmCaptureField(draft, field))} label="Context" confidence={draft.userContext ? 'high' : undefined} />
        <NeverInput
          value={draft.userContext || ''}
          onChangeText={(value) => onChange(applyUserContextPriority(draft, value))}
          placeholder="NEVER will summarize what this is about…"
          placeholderTextColor={p.tertiary}
          style={[styles.largeInput, { color: p.label, backgroundColor: p.surface }]}
          multiline
          accessibilityLabel="Your context"
        />
        <Text style={[styles.help, { color: p.tertiary }]}>NEVER drafts this automatically. Your edits always take priority.</Text>
      </View>

      <View style={styles.section}>
        <FieldLabel onConfirm={(field) => onChange(confirmCaptureField(draft, field))} label="Organize in" />
        <V5Segmented
          options={destinations.map((destination) => destination.label)}
          selected={destinations.find((destination) => destination.value === draft.destination)?.label || 'Inbox'}
          onSelect={(label) => {
            const destination = destinations.find((entry) => entry.label === label);
            if (destination) onChange(setCaptureDestination(draft, destination.value));
          }}
        />
        {draft.needsReview.length ? <Text style={[styles.help, { color: p.tertiary }]}>Unresolved details default to Inbox until you confirm them.</Text> : null}
      </View>

      <View style={styles.textBlock}>
        <FieldLabel onConfirm={(field) => onChange(confirmCaptureField(draft, field))} label="Tags" />
        <NeverInput
          value={editingTags ? rawTags : draft.tags.join(', ')}
          onFocus={() => { setRawTags(draft.tags.join(', ')); setEditingTags(true); }}
          onBlur={() => setEditingTags(false)}
          onChangeText={(value) => { setRawTags(value); setField('tags', splitTags(value)); }}
          placeholder="gift, dad, travel"
          placeholderTextColor={p.tertiary}
          style={[styles.singleInput, { color: p.label, backgroundColor: p.surface }]}
          autoCapitalize="none"
          accessibilityLabel="Tags"
        />
      </View>

      {showExtractedText ? (
        <View style={styles.textBlock}>
          <FieldLabel onConfirm={(field) => onChange(confirmCaptureField(draft, field))} label="Recognized text" />
          <NeverInput
            value={draft.extractedText || ''}
            onChangeText={(value) => setField('extractedText', value || undefined)}
            placeholder="No text recognized"
            placeholderTextColor={p.tertiary}
            style={[styles.extractedInput, { color: p.secondary, backgroundColor: p.surface }]}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Extracted text"
          />
          <Text style={[styles.help, { color: p.tertiary }]}>Recognition remains separate from your notes and can be corrected without changing the original attachment.</Text>
        </View>
      ) : null}
    </View>
  );

}

function FieldLabel({ label, confidence, field, onConfirm }: { label: string; confidence?: CaptureConfidence; field?: CaptureField; onConfirm: (field: CaptureField) => void }) {
  const p = useNeverV5Palette();
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={[styles.fieldLabel, { color: p.secondary }]}>{label}</Text>
      {confidence ? (
        <Pressable accessibilityRole={field ? 'button' : undefined} accessibilityLabel={field ? `${label} confidence ${confidence}. Mark as confirmed.` : `${label} confidence ${confidence}`} style={{ minHeight: 44, justifyContent: 'center' }} onPress={field ? () => onConfirm(field) : undefined}>
          <View style={styles.confidenceRow}>
            <View style={[styles.confidenceDot, { backgroundColor: confidenceColor(confidence, p) }]} />
            <Text style={[styles.confidence, { color: p.tertiary }]}>{confidence}</Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

function ReviewField({
  label,
  field,
  needsReview,
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
  needsReview: CaptureField[];
  value: string;
  confidence?: CaptureConfidence;
  onChange: (value: string) => void;
  onConfirm?: () => void;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad';
  last?: boolean;
}) {
  const p = useNeverV5Palette();
  const unresolved = needsReview.includes(field);
  const [editing, setEditing] = useState(false);
  const [rawValue, setRawValue] = useState(value);
  return (
    <View style={[styles.fieldRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}>
      <View style={styles.fieldNameWrap}>
        <Text style={[styles.rowLabel, { color: p.label }]}>{label}</Text>
        <View style={styles.fieldMetaLine}>
          {confidence ? (
            <View style={styles.inlineConfidenceRow}>
              <View style={[styles.miniDot, { backgroundColor: confidenceColor(confidence, p) }]} />
              <Text style={[styles.inlineConfidence, { color: p.tertiary }]}>{confidence}</Text>
            </View>
          ) : null}
          {unresolved && onConfirm ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Confirm ${label}`} onPress={onConfirm} style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={[styles.confirmText, { color: p.chrome }]}>{value ? 'Confirm' : 'Keep blank'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <NeverInput
        value={editing ? rawValue : value}
        onFocus={() => { setRawValue(value); setEditing(true); }}
        onBlur={() => setEditing(false)}
        onChangeText={(text) => { setRawValue(text); onFieldChange(text); }}
        placeholder={placeholder}
        placeholderTextColor={p.tertiary}
        keyboardType={keyboardType}
        style={[styles.rowInput, { color: p.label }]}
        accessibilityLabel={label}
        autoCapitalize={label === 'Currency' ? 'characters' : 'sentences'}
      />
    </View>
  );
}

function confidenceColor(confidence: CaptureConfidence, p: ReturnType<typeof useNeverV5Palette>) {
  if (confidence === 'high') return p.success;
  if (confidence === 'medium') return p.warning;
  return p.danger;
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
  wrapper: { gap: 16 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heading: { fontSize: 16.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.2 },
  subheading: { marginTop: 3, maxWidth: 430, ...neverType.caption },
  reviewState: { paddingTop: 2, flexDirection: 'row', alignItems: 'center', gap: 5 },
  stateDot: { width: 5, height: 5, borderRadius: 3 },
  reviewStateText: { ...neverType.caption, fontWeight: '600' },
  ambiguityCard: { paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  ambiguityTitle: { ...neverType.caption, fontWeight: '600', marginBottom: 2 },
  ambiguityText: { marginTop: 3, ...neverType.caption },
  section: { gap: 7 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  fieldLabel: { fontSize: 12.5, lineHeight: 16, fontWeight: '500' },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  confidenceDot: { width: 4, height: 4, borderRadius: 2 },
  confidence: { ...neverType.caption, fontWeight: '500', textTransform: 'capitalize' },
  kindRow: { gap: 4, paddingRight: 4 },
  kindChip: { minHeight: 44, borderRadius: 10, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  kindText: { ...neverType.caption },
  fieldRow: { minHeight: 84, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  fieldNameWrap: { alignSelf: 'stretch' },
  rowLabel: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  fieldMetaLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  inlineConfidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  miniDot: { width: 4, height: 4, borderRadius: 2 },
  inlineConfidence: { ...neverType.caption, textTransform: 'capitalize' },
  confirmText: { ...neverType.caption, fontWeight: '600' },
  rowInput: { minHeight: 44, ...neverType.body, fontSize: 16 },
  textBlock: { gap: 7 },
  largeInput: { minHeight: 86, borderRadius: 16, padding: 13, ...neverType.body, textAlignVertical: 'top' },
  singleInput: { minHeight: 46, borderRadius: 14, paddingHorizontal: 13, fontSize: 16 },
  extractedInput: { minHeight: 116, borderRadius: 16, padding: 13, ...neverType.body },
  help: { marginLeft: 2, ...neverType.caption }
});
