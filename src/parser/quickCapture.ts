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

const monthMap: Record<string, number> = {
  january: 0, januar: 0,
  february: 1, februar: 1,
  march: 2, märz: 2, maerz: 2,
  april: 3,
  may: 4, mai: 4,
  june: 5, juni: 5,
  july: 6, juli: 6,
  august: 7,
  september: 8,
  october: 9, oktober: 9,
  november: 10,
  december: 11, dezember: 11
};

const TIME_PATTERN = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b|\b([01]?\d|2[0-3])\s*(?:uhr|h)\b/i;

export function parseQuickCapture(input: string, now = new Date()): ParsedCapture | null {
  const raw = input.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  const time = extractTime(lower);
  const resolvedDate = extractDate(lower, now);

  let type: OneItemType = 'task';
  let category: string | undefined;

  if (/zahnarzt|dentist|arzt|doctor|termin|appointment|praxis|clinic/.test(lower)) {
    type = 'appointment';
    category = 'Health';
  } else if (/kündig|cancel|erinner|remind/.test(lower)) {
    type = 'reminder';
    category = /netflix|spotify|prime|abo|subscription/.test(lower) ? 'Subscription' : 'Reminder';
  } else if (/geschenk|gift|geburtstag|birthday/.test(lower)) {
    type = 'idea';
    category = 'Gift idea';
  } else if (/https?:\/\//.test(lower)) {
    type = 'link';
    category = 'Saved link';
  } else if (/flug|flight|hotel|reise|travel|airbnb/.test(lower)) {
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
  const match = input.match(TIME_PATTERN);
  if (!match) return undefined;
  if (match[1] && match[2]) return `${match[1].padStart(2, '0')}:${match[2]}`;
  if (match[3]) return `${match[3].padStart(2, '0')}:00`;
  return undefined;
}

function extractDate(input: string, now: Date) {
  const withoutTime = input.replace(TIME_PATTERN, ' ');

  if (/\b(today|heute)\b/.test(withoutTime)) {
    const date = startOfDay(now);
    return { iso: toIsoDate(date), label: formatDateLabel(date) };
  }

  if (/\b(tomorrow|morgen)\b/.test(withoutTime)) {
    const date = startOfDay(now);
    date.setDate(date.getDate() + 1);
    return { iso: toIsoDate(date), label: formatDateLabel(date) };
  }

  if (/\b(day after tomorrow|übermorgen|uebermorgen)\b/.test(withoutTime)) {
    const date = startOfDay(now);
    date.setDate(date.getDate() + 2);
    return { iso: toIsoDate(date), label: formatDateLabel(date) };
  }

  for (const [needle, target] of Object.entries(weekdayMap)) {
    if (new RegExp(`\\b${needle}\\b`).test(withoutTime)) {
      const date = nextWeekday(now, target);
      return { iso: toIsoDate(date), label: formatDateLabel(date) };
    }
  }

  const monthNames = Object.keys(monthMap).join('|');
  const namedMonth = withoutTime.match(new RegExp(`\\b([1-9]|[12]\\d|3[01])\\.?\\s*(?:of\\s+)?(${monthNames})\\b`, 'i'));
  if (namedMonth) {
    const day = Number(namedMonth[1]);
    const month = monthMap[namedMonth[2].toLowerCase()];
    const date = new Date(now.getFullYear(), month, day);
    if (date < startOfDay(now)) date.setFullYear(date.getFullYear() + 1);
    return { iso: toIsoDate(date), label: formatDateLabel(date) };
  }

  const numericDate = withoutTime.match(/\b([1-9]|[12]\d|3[01])[./-](0?[1-9]|1[0-2])(?:[./-](20\d{2}|\d{2}))?\b/);
  if (numericDate) {
    const day = Number(numericDate[1]);
    const month = Number(numericDate[2]) - 1;
    let year = numericDate[3] ? Number(numericDate[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const date = new Date(year, month, day);
    if (!numericDate[3] && date < startOfDay(now)) date.setFullYear(date.getFullYear() + 1);
    return { iso: toIsoDate(date), label: formatDateLabel(date) };
  }

  const dayMatch = withoutTime.match(/(?:\bam\b|\bon\b)\s*([1-9]|[12]\d|3[01])\.?\b/);
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
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

function cleanupTitle(input: string) {
  return input
    .replace(TIME_PATTERN, '')
    .replace(/\b(today|heute|tomorrow|morgen|day after tomorrow|übermorgen|uebermorgen)\b/gi, '')
    .replace(/\b(monday|montag|tuesday|dienstag|wednesday|mittwoch|thursday|donnerstag|friday|freitag|saturday|samstag|sunday|sonntag)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
