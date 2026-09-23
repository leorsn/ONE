import type { OneItem } from '@/src/types/item';
import { buildNeverIntelligenceState } from './orchestrator';

export function selectNeedsReview(items: OneItem[]) { return buildNeverIntelligenceState(items).items.filter((item) => item.reviewStatus === 'needs_review' || item.processingStatus === 'needs_attention'); }
export function selectSuggestedActions(items: OneItem[]) { return buildNeverIntelligenceState(items).actions.filter((action) => action.state === 'suggested'); }
export function selectMemoryClusters(items: OneItem[]) { return buildNeverIntelligenceState(items).clusters; }
export function selectRelatedItems(itemId: string, items: OneItem[]) { const state = buildNeverIntelligenceState(items); const ids = new Set(state.relationships.filter((edge) => edge.itemId === itemId || edge.relatedItemId === itemId).map((edge) => edge.itemId === itemId ? edge.relatedItemId : edge.itemId)); return state.items.filter((item) => ids.has(item.id)); }
