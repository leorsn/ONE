import type { OneItem } from '@/src/types/item';

export function getReminderDate(
  item: Pick<OneItem, 'date' | 'time'>,
  leadMinutes = 10
) {
  if (!item.date) return null;

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item.date);
  if (!dateMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  let hour = 9;
  let minute = 0;

  if (item.time) {
    const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(item.time);
    if (!timeMatch) return null;
    hour = Number(timeMatch[1]);
    minute = Number(timeMatch[2]);
  }

  // Deliberately uses the device's local timezone. NEVER stores wall-clock date/time
  // separately so a user's 18:00 reminder remains 18:00 in the active locale.
  const eventDate = new Date(year, month - 1, day, hour, minute, 0, 0);

  // JavaScript normalizes invalid dates such as 2026-02-31 into March. Reject that
  // normalization so corrupted/imported values never reach the native scheduler.
  if (
    eventDate.getFullYear() !== year ||
    eventDate.getMonth() !== month - 1 ||
    eventDate.getDate() !== day ||
    eventDate.getHours() !== hour ||
    eventDate.getMinutes() !== minute
  ) {
    return null;
  }

  if (item.time) {
    const safeLeadMinutes = Number.isFinite(leadMinutes)
      ? Math.max(0, Math.trunc(leadMinutes))
      : 0;
    if (safeLeadMinutes > 0) eventDate.setMinutes(eventDate.getMinutes() - safeLeadMinutes);
  }

  return eventDate;
}
