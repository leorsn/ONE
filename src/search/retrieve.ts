import { applyIntelligenceRetrievalSignals } from '../intelligence/retrieval.ts';
import { searchOneItems, type SearchResult } from './searchItems.ts';
import type { OneItem } from '../types/item';

export type SemanticMatch = { itemId: string; similarity: number };
export type RetrievalResult = SearchResult & { semanticSimilarity?: number };
export type RetrievalResponse = { results: RetrievalResult[]; mode: 'local' | 'hybrid'; semanticError?: string };

export function retrieveLocalOneItems(query: string, items: OneItem[], options: { limit?: number; now?: Date; recentWhenEmpty?: boolean } = {}): RetrievalResult[] {
  const limit = options.limit ?? 12;
  const now = options.now ?? new Date();
  const clean = query.trim();
  if (!clean) {
    if (options.recentWhenEmpty === false) return [];
    return [...items].sort((a, b) => itemTimestamp(b) - itemTimestamp(a)).slice(0, limit).map((item, index) => ({ item, score: Math.max(0.1, 4 - index * 0.15), matchedTerms: [], reasons: ['recent'] }));
  }
  const combined = new Map<string, RetrievalResult>();
  for (const result of searchOneItems(clean, items, { limit: Math.max(limit * 2, 24), now })) combined.set(result.item.id, result);
  for (const item of timeAwareCandidates(clean, items, now)) {
    const existing = combined.get(item.id);
    combined.set(item.id, { item, score: (existing?.score ?? 0) + 11, matchedTerms: existing?.matchedTerms ?? [], reasons: Array.from(new Set([...(existing?.reasons ?? []), 'time-context'])) });
  }
  return applyIntelligenceRetrievalSignals(clean, Array.from(combined.values())).sort((a, b) => b.score - a.score || itemTimestamp(b.item) - itemTimestamp(a.item)).slice(0, limit);
}

export async function retrieveOneItems(query: string, items: OneItem[], options: { limit?: number; now?: Date; semanticSearch?: (query: string) => Promise<SemanticMatch[]> } = {}): Promise<RetrievalResponse> {
  const limit = options.limit ?? 12;
  const local = retrieveLocalOneItems(query, items, { limit, now: options.now });
  if (!query.trim() || !options.semanticSearch) return { results: local, mode: 'local' };
  const itemById = new Map(items.map((item) => [item.id, item]));
  const combined = new Map(local.map((result) => [result.item.id, result]));
  try {
    const semantic = await options.semanticSearch(query);
    for (const match of semantic) {
      const item = itemById.get(match.itemId); if (!item) continue;
      const existing = combined.get(item.id);
      combined.set(item.id, { item, score: (existing?.score ?? 0) + Math.max(0, match.similarity) * 12, matchedTerms: existing?.matchedTerms ?? [], reasons: Array.from(new Set([...(existing?.reasons ?? []), 'semantic'])), semanticSimilarity: match.similarity });
    }
    const results = applyIntelligenceRetrievalSignals(query, Array.from(combined.values())).sort((a, b) => b.score - a.score || itemTimestamp(b.item) - itemTimestamp(a.item)).slice(0, limit);
    return { results, mode: 'hybrid' };
  } catch (error) {
    return { results: local, mode: 'local', semanticError: error instanceof Error ? error.message : 'semantic_search_unavailable' };
  }
}

function timeAwareCandidates(query: string, items: OneItem[], now: Date) {
  const normalized = query.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const today = isoDate(now); const yesterdayDate = new Date(now); yesterdayDate.setDate(now.getDate() - 1); const yesterday = isoDate(yesterdayDate);
  const asksCaptured = /saved|gespeichert|captured|erfasst/.test(normalized);
  if (/\b(today|heute)\b/.test(normalized)) return items.filter((item) => { const captured = (item.capturedAt || item.createdAt).slice(0, 10); return asksCaptured ? captured === today : captured === today || item.date === today; });
  if (/\b(yesterday|gestern)\b/.test(normalized)) return items.filter((item) => (item.capturedAt || item.createdAt).slice(0, 10) === yesterday);
  if (/next week|n(?:a|ae)chste woche|kommende woche|upcoming/.test(normalized)) {
    const start = new Date(now); start.setHours(0, 0, 0, 0); const end = new Date(start); end.setDate(end.getDate() + 8);
    return items.filter((item) => { if (!item.date) return false; const date = new Date(`${item.date}T12:00:00`); return date >= start && date < end; });
  }
  return [];
}
function itemTimestamp(item: OneItem) { return new Date(item.capturedAt || item.updatedAt || item.createdAt).getTime(); }
function isoDate(value: Date) { const year = value.getFullYear(); const month = String(value.getMonth() + 1).padStart(2, '0'); const day = String(value.getDate()).padStart(2, '0'); return `${year}-${month}-${day}`; }