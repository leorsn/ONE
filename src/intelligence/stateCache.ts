import type { OneItem } from '@/src/types/item';
import { intelligenceSemanticKey } from './cache';
import { buildNeverIntelligenceState } from './orchestrator';

type NeverIntelligenceState = ReturnType<typeof buildNeverIntelligenceState>;
let lastKey: string | undefined;
let lastState: NeverIntelligenceState | undefined;

export function getMemoizedNeverIntelligenceState(items: OneItem[]): NeverIntelligenceState {
  const key = items.map(intelligenceSemanticKey).join('\u001e');
  if (key === lastKey && lastState) return lastState;
  lastKey = key; lastState = buildNeverIntelligenceState(items);
  return lastState;
}

export function clearNeverIntelligenceStateCache() { lastKey = undefined; lastState = undefined; }
