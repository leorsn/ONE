import { supabase } from '@/src/supabase/client';
import { buildDirectAnswer } from '@/src/search/answer';
import { buildFollowUpAnswer } from '@/src/search/followUp';
import { buildSpecificLinkAnswer } from '@/src/search/linkAnswer';
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
  const linkQuestion = asksForExactLink(query);

  if (linkQuestion) {
    const previousItems = previousSourceIds
      .map((id) => allItems.find((item) => item.id === id))
      .filter((item): item is OneItem => Boolean(item));
    const linkScope = previousItems.length ? previousItems : retrievedItems.length ? retrievedItems : allItems;
    const specificLink = buildSpecificLinkAnswer(query, linkScope);
    if (specificLink) {
      return {
        title: specificLink.title,
        body: specificLink.body,
        sourceIds: specificLink.itemIds,
        evidence: 'saved',
        mode: 'deterministic',
        meta: specificLink.meta
      };
    }
  }

  const direct = buildDirectAnswer(query, allItems, retrievedItems[0], now);
  if (direct && (direct.kind !== 'memory' || linkQuestion)) {
    return {
      title: direct.title,
      body: direct.body,
      sourceIds: direct.itemIds,
      evidence: 'saved',
      mode: 'deterministic',
      meta: direct.meta || (linkQuestion
        ? 'Exact URL from your saved NEVER memory'
        : 'Calculated from your saved NEVER items')
    };
  }

  if (previousSourceIds.length && !linkQuestion) {
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
        meta: direct.meta || 'Grounded in saved NEVER items'
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
  } catch {
    return {
      ...fallback,
      aiUnavailable: true,
      meta: [fallback.meta, 'AI synthesis unavailable; showing grounded local recall'].filter(Boolean).join(' · ')
    };
  }
}

function asksForExactLink(value: string) {
  const clean = value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return /\b(link|links|url|urls|webseite|website)\b/.test(clean);
}
