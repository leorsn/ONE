import type { OneItem } from '../types/item.ts';

/** Apply a delayed result only to the exact local revision it was requested for. */
export function applyItemResult(current: OneItem[], submitted: OneItem, result: OneItem): OneItem[] {
  return current.map((item) => item === submitted ? result : item);
}

/** Rebase async collection work over edits, additions and deletions made during it. */
export function rebaseItemSnapshot(before: OneItem[], result: OneItem[], current: OneItem[]): OneItem[] {
  const beforeById = new Map(before.map((item) => [item.id, item]));
  const currentById = new Map(current.map((item) => [item.id, item]));
  const rebased = result.flatMap((item) => {
    const previous = beforeById.get(item.id);
    const latest = currentById.get(item.id);
    if (previous && !latest) return [];
    return [latest && latest !== previous ? latest : item];
  });
  const included = new Set(rebased.map((item) => item.id));
  for (const item of current) {
    if (!included.has(item.id) && beforeById.get(item.id) !== item) rebased.push(item);
  }
  return rebased;
}
