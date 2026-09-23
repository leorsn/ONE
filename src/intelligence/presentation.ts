import type { OneItem } from '@/src/types/item';
import { buildNeverIntelligenceState } from './orchestrator';
import { buildIntelligenceSnapshot } from './engine';

export type IntelligenceBadge = { kind: 'confidence' | 'review' | 'action' | 'relationship'; label: string; tone: 'neutral' | 'attention' | 'positive' };
export type IntelligenceItemView = { itemId: string; summary: string; badges: IntelligenceBadge[]; relatedItemIds: string[]; suggestedActionCount: number; needsReview: boolean };

/** Headless adapter: screens decide how this data looks. */
export function buildIntelligenceItemView(itemId: string, items: OneItem[]): IntelligenceItemView | undefined {
  const item = items.find((entry) => entry.id === itemId); if (!item) return undefined;
  const state = buildNeverIntelligenceState(items); const snapshot = buildIntelligenceSnapshot(item);
  const relatedItemIds = state.relationships.filter((edge) => edge.itemId === itemId || edge.relatedItemId === itemId).map((edge) => edge.itemId === itemId ? edge.relatedItemId : edge.itemId);
  const actions = state.actions.filter((action) => action.itemId === itemId && action.state === 'suggested');
  const needsReview = item.reviewStatus === 'needs_review' || item.processingStatus === 'needs_attention';
  const badges: IntelligenceBadge[] = [{ kind: 'confidence', label: `${snapshot.confidence} confidence`, tone: snapshot.confidence === 'high' ? 'positive' : snapshot.confidence === 'low' ? 'attention' : 'neutral' }];
  if (needsReview) badges.push({ kind: 'review', label: 'Needs review', tone: 'attention' });
  if (actions.length) badges.push({ kind: 'action', label: `${actions.length} suggested action${actions.length === 1 ? '' : 's'}`, tone: 'neutral' });
  if (relatedItemIds.length) badges.push({ kind: 'relationship', label: `${relatedItemIds.length} related`, tone: 'neutral' });
  return { itemId, summary: snapshot.summary, badges, relatedItemIds, suggestedActionCount: actions.length, needsReview };
}

export function buildIntelligenceInboxView(items: OneItem[]) {
  const state = buildNeverIntelligenceState(items);
  return state.items.filter((item) => item.reviewStatus === 'needs_review' || item.processingStatus === 'needs_attention').map((item) => buildIntelligenceItemView(item.id, state.items)!).filter(Boolean);
}
