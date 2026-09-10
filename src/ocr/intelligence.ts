import { interpretCapture } from '@/src/capture/core';
import type { OneDocumentKind } from '@/src/types/item';

export type OcrIntelligence = {
  suggestedTitle?: string;
  category?: string;
  date?: string;
  time?: string;
  documentKind?: OneDocumentKind;
  merchant?: string;
  amount?: number;
  currency?: string;
  entities: string[];
  tags: string[];
};

export function analyzeOcrText(text: string, context = ''): OcrIntelligence {
  const clean = text.trim();
  if (!clean) {
    return {
      suggestedTitle: context.trim() || undefined,
      entities: [],
      tags: []
    };
  }

  const draft = interpretCapture({
    extractedText: clean,
    userContext: context,
    sourceType: 'scan',
    isImage: true
  });

  return {
    suggestedTitle: draft.title,
    category: draft.category,
    date: draft.date,
    time: draft.time,
    documentKind: draft.documentKind,
    merchant: draft.merchant,
    amount: draft.amount,
    currency: draft.currency,
    entities: draft.entities,
    tags: draft.tags
  };
}
