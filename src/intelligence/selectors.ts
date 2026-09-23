import type { OneItem } from '@/src/types/item';
import { getMemoizedNeverIntelligenceState } from './stateCache';

export function selectNeedsReview(items: OneItem[]) { return getMemoizedNeverIntelligenceState(items).items.filter((item) => item.reviewStatus === 'needs_review' || item.processingStatus === 'needs_attention'); }
export function selectSuggestedActions(items: OneItem[]) { return getMemoizedNeverIntelligenceState(items).actions.filter((action) => action.state === 'suggested'); }
export function selectMemoryClusters(items: OneItem[]) { return getMemoizedNeverIntelligenceState(items).clusters; }
export function selectRelatedItems(itemId: string, items: OneItem[]) { const state = getMemoizedNeverIntelligenceState(items); const ids = new Set(state.relationships.filter((edge) => edge.itemId === itemId || edge.relatedItemId === itemId).map((edge) => edge.itemId === itemId ? edge.relatedItemId : edge.itemId)); return state.items.filter((item) => ids.has(item.id)); }
