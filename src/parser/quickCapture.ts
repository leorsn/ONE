import type { OneItemType } from '@/src/types/item';

export type ParsedCapture = {
  type: OneItemType;
  title: string;
  dateLabel?: string;
  time?: string;
  category?: string;
  confidence: number;
};

const weekdays: Record<string, string> = {
  monday: 'Monday', montag: 'Monday',
  tuesday: 'Tuesday', dienstag: 'Tuesday',
  wednesday: 'Wednesday', mittwoch: 'Wednesday',
  thursday: 'Thursday', donnerstag: 'Thursday',
  friday: 'Friday', freitag: 'Friday',
  saturday: 'Saturday', samstag: 'Saturday',
  sunday: 'Sunday', sonntag: 'Sunday'
};

export function parseQuickCapture(input: string): ParsedCapture | null {
  const raw = input.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  const time = extractTime(lower);
  const day = extractWeekday(lower);

  let type: OneItemType = 'task';
  let category: string | undefined;

  if (/zahnarzt|dentist|arzt|doctor|termin|appointment/.test(lower)) {
    type = 'appointment';
    category = 'Health';
  } else if (/kündig|cancel|erinner|remind/.test(lower)) {
    type = 'reminder';
    category = /netflix|spotify|prime|abo|subscription/.test(lower) ? 'Subscription' : 'Reminder';
  } else if (/geschenk|gift/.test(lower)) {
    type = 'idea';
    category = 'Gift idea';
  } else if (/https?:\/\//.test(lower)) {
    type = 'link';
    category = 'Saved link';
  } else if (/flug|flight|hotel|reise|travel/.test(lower)) {
    type = 'travel';
    category = 'Travel';
  }

  const title = cleanupTitle(raw);
  const confidence = type === 'task' ? 0.72 : 0.9;

  return {
    type,
    title,
    dateLabel: day,
    time,
    category,
    confidence
  };
}

function extractTime(input: string) {
  const match = input.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b|\b([01]?\d|2[0-3])\s*(?:uhr|h)\b/);
  if (!match) return undefined;
  if (match[1] && match[2]) return `${match[1].padStart(2, '0')}:${match[2]}`;
  if (match[3]) return `${match[3].padStart(2, '0')}:00`;
  return undefined;
}

function extractWeekday(input: string) {
  for (const [needle, label] of Object.entries(weekdays)) {
    if (input.includes(needle)) return label;
  }
  return undefined;
}

function cleanupTitle(input: string) {
  return input
    .replace(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/gi, '')
    .replace(/\b([01]?\d|2[0-3])\s*(uhr|h)\b/gi, '')
    .replace(/\b(monday|montag|tuesday|dienstag|wednesday|mittwoch|thursday|donnerstag|friday|freitag|saturday|samstag|sunday|sonntag)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
