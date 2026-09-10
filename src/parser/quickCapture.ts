import { interpretCapture } from '@/src/capture/core';
import type { OneItemType } from '@/src/types/item';

export type ParsedCapture = {
  type: OneItemType;
  title: string;
  date?: string;
  dateLabel?: string;
  time?: string;
  category?: string;
  confidence: number;
};

export function parseQuickCapture(input: string, now = new Date()): ParsedCapture | null {
  const raw = input.trim();
  if (!raw) return null;

  const draft = interpretCapture({
    rawText: raw,
    sourceType: 'manual',
    now
  });

  return {
    type: draft.itemType,
    title: draft.title,
    date: draft.date,
    dateLabel: draft.date ? formatDateLabel(draft.date) : undefined,
    time: draft.time,
    category: refineCategory(raw, draft.itemType, draft.category),
    confidence: confidenceNumber(draft.fieldConfidence.type)
  };
}

function refineCategory(input: string, type: OneItemType, fallback?: string) {
  const lower = input.toLowerCase();
  if (type === 'appointment' && /dentist|zahnarzt|doctor|arzt|clinic|praxis/.test(lower)) return 'Health';
  if (type === 'reminder' && /netflix|spotify|prime|abo|subscription/.test(lower)) return 'Subscription';
  if (type === 'idea' && /gift|geschenk|birthday|geburtstag/.test(lower)) return 'Gift idea';
  if (type === 'link') return 'Saved link';
  if (/flight|flug|hotel|reise|travel|airbnb/.test(lower)) return 'Travel';
  return fallback;
}

function confidenceNumber(value?: 'high' | 'medium' | 'low') {
  if (value === 'high') return 0.92;
  if (value === 'low') return 0.55;
  return 0.74;
}

function formatDateLabel(iso: string) {
  const date = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);
}
