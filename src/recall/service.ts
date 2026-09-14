import { supabase } from '@/src/supabase/client';
import { buildDirectAnswer } from '@/src/search/answer';
import { buildFollowUpAnswer } from '@/src/search/followUp';
import type { RetrievalResult } from '@/src/search/retrieve';
import type { OneItem } from '@/src/types/item';
import {
  buildGroundedFallback,
  noEvidenceAnswer,
  validateRecallModelPayload,
  type GroundedRecallAnswer
} from './grounding';

export async function answerFromRetrievedItems({
  query,
  retrieval,
  allItems,
  previousSourceIds = [],
  allowAI = true,
  now = new Date()
}: {
  query: string;
  retrieval: RetrievalResult[];
  allItems: OneItem[];
  previousSourceIds?: string[];
  allowAI?: boolean;
  now?: Date;
}): Promise<GroundedRecallAnswer> {
  const retrievedItems = retrieval.map((result) => result.item);

  if (previousSourceIds.length) {
    const followUp = buildFollowUpAnswer(query, allItems, previousSourceIds);
    if (followUp) {
      return {
        title: followUp.title,
        body: followUp.body,
        sourceIds: followUp.itemIds,
        evidence: 'saved',
        mode: 'deterministic',
        meta: followUp.meta || 'Follow-up grounded in your previous sources'
      };
    }
  }

  const direct = buildDirectAnswer(query, allItems, retrievedItems[0], now);
  if (direct && direct.kind !== 'memory') {
    return {
      title: direct.title,
      body: direct.body,
      sourceIds: direct.itemIds,
      evidence: 'saved',
      mode: 'deterministic',
      meta: direct.meta || 'Calculated from your saved ONE items'
    };
  }

  if (!retrievedItems.length) return direct
    ? {
        title: direct.title,
        body: direct.body,
        sourceIds: direct.itemIds,
        evidence: 'saved',
        mode: 'deterministic',
        meta: direct.meta
      }
    : noEvidenceAnswer();

  const fallback = direct
    ? {
        title: direct.title,
        body: direct.body,
        sourceIds: direct.itemIds,
        evidence: 'saved' as const,
        mode: 'deterministic' as const,
        meta: direct.meta || 'Grounded in saved ONE items'
      }
    : buildGroundedFallback(query, retrievedItems, now);

  if (!allowAI) return fallback;

  const allowedIds = retrievedItems.slice(0, 6).map((item) => item.id);

  try {
    const { data, error } = await supabase.functions.invoke('answer-one-recall', {
      body: {
        query: query.trim().slice(0, 800),
        itemIds: allowedIds
      }
    });

    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));

    const validated = validateRecallModelPayload(data?.answer, allowedIds);
    if (!validated) throw new Error('invalid_recall_payload');

    return {
      ...validated,
      mode: 'ai',
      meta: data?.model ? `Grounded recall · ${String(data.model)}` : 'Grounded recall'
    };
  } catch (error) {
    return {
      ...fallback,
      aiUnavailable: true,
      meta: [fallback.meta, 'AI synthesis unavailable; showing grounded local recall'].filter(Boolean).join(' · ')
    };
  }
}
