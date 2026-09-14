import { buildGroundedRecallAnswer } from '../search/grounded.ts';
import type { OneItem } from '../types/item';

export type RecallModelPayload = {
  title: string;
  body: string;
  sourceIds: string[];
  evidence: 'saved' | 'inferred';
};

export type GroundedRecallAnswer = RecallModelPayload & {
  mode: 'deterministic' | 'ai';
  meta?: string;
  aiUnavailable?: boolean;
};

export function validateRecallModelPayload(
  value: unknown,
  allowedSourceIds: string[]
): RecallModelPayload | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  if (typeof source.title !== 'string' || !source.title.trim()) return undefined;
  if (typeof source.body !== 'string' || !source.body.trim()) return undefined;
  if (source.evidence !== 'saved' && source.evidence !== 'inferred') return undefined;
  if (!Array.isArray(source.sourceIds) || !source.sourceIds.length || !source.sourceIds.every((id) => typeof id === 'string')) return undefined;

  const allowed = new Set(allowedSourceIds);
  const sourceIds = Array.from(new Set(source.sourceIds as string[]));
  if (sourceIds.some((id) => !allowed.has(id))) return undefined;

  return {
    title: source.title.trim().slice(0, 220),
    body: source.body.trim().slice(0, 1600),
    sourceIds,
    evidence: source.evidence
  };
}

export function buildGroundedFallback(
  query: string,
  retrievedItems: OneItem[],
  now = new Date()
): GroundedRecallAnswer {
  const best = retrievedItems[0];
  const grounded = buildGroundedRecallAnswer(query, retrievedItems, best, now);
  if (grounded) {
    return {
      title: grounded.title,
      body: grounded.body,
      sourceIds: grounded.itemIds.filter((id) => retrievedItems.some((item) => item.id === id)),
      evidence: 'saved',
      mode: 'deterministic',
      meta: grounded.meta || 'From your saved ONE memories'
    };
  }

  if (!retrievedItems.length) return noEvidenceAnswer();

  const visible = retrievedItems.slice(0, 4);
  return {
    title: visible.length === 1 ? 'I found one relevant memory.' : `I found ${visible.length} relevant memories.`,
    body: visible.map((item) => [item.title, item.summary].filter(Boolean).join(' — ')).join('\n'),
    sourceIds: visible.map((item) => item.id),
    evidence: 'saved',
    mode: 'deterministic',
    meta: 'Grounded in saved ONE items'
  };
}

export function noEvidenceAnswer(): GroundedRecallAnswer {
  return {
    title: "I couldn't find that in ONE.",
    body: "I couldn't find anything saved in ONE that answers that.",
    sourceIds: [],
    evidence: 'saved',
    mode: 'deterministic'
  };
}
