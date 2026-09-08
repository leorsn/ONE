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

const weekdayMap: Record<string, number> = {
  sunday: 0, sonntag: 0,
  monday: 1, montag: 1,
  tuesday: 2, dienstag: 2,
  wednesday: 3, mittwoch: 3,
  thursday: 4, donnerstag: 4,
  friday: 5, freitag: 5,
  saturday: 6, samstag: 6
};

export function parseQuickCapture(input: string, now = new Date()): ParsedCapture | null {
  const raw = input.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  const time = extractTime(lower);
  const resolvedDate = extractDate(lower, now);

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

  return {
    type,
    title: cleanupTitle(raw),
    date: resolvedDate?.iso,
    dateLabel: resolvedDate?.label,
    time,
    category,
    confidence: type === 'task' ? 0.72 : 0.9
  };
}

function extractTime(input: string) {
  const match = input.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b|\b([01]?\d|2[0-3])\s*(?:uhr|h)\b/);
  if (!match) return undefined;
  if (match[1] && match[2]) return `${match[1].padStart(2, '0')}:${match[2]}`;
  if (match[3]) return `${match[3].padStart(2, '0')}:00`;
  return undefined;
}

function extractDate(input: string, now: Date) {
  for (const [needle, target] of Object.entries(weekdayMap)) {
    if (input.includes(needle)) {
      const date = nextWeekday(now, target);
      return { iso: toIsoDate(date), label: formatDateLabel(date) };
    }
  }

  const dayMatch = input.match(/(?:am|on)?\s*\b([1-9]|[12]\d|3[01])\.?\b/);
  if (dayMatch) {
    const day = Number(dayMatch[1]);
    const candidate = new Date(now.getFullYear(), now.getMonth(), day);
    if (candidate < startOfDay(now)) candidate.setMonth(candidate.getMonth() + 1);
    return { iso: toIsoDate(candidate), label: formatDateLabel(candidate) };
  }

  return undefined;
}

function nextWeekday(now: Date, targetDay: number) {
  const result = startOfDay(now);
  let delta = (targetDay - result.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  result.setDate(result.getDate() + delta);
  return result;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(date);
}

function cleanupTitle(input: string) {
  return input
    .replace(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/gi, '')
    .replace(/\b([01]?\d|2[0-3])\s*(uhr|h)\b/gi, '')
    .replace(/\b(monday|montag|tuesday|dienstag|wednesday|mittwoch|thursday|donnerstag|friday|freitag|saturday|samstag|sunday|sonntag)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
