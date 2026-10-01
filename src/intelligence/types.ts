import type { OneInboxAction, OneItem, OneUnderstandingConfidence } from '@/src/types/item';

export type IntelligenceEntityKind = 'person' | 'organization' | 'place' | 'date' | 'time' | 'money' | 'url';

export type IntelligenceEntity = {
  kind: IntelligenceEntityKind;
  value: string;
  confidence: OneUnderstandingConfidence;
  sourceField?: keyof OneItem;
};

export type IntelligenceSuggestion = {
  action: OneInboxAction;
  confidence: OneUnderstandingConfidence;
  reason: string;
  requiresConfirmation: true;
};

export type IntelligenceSnapshot = {
  itemId: string;
  schemaVersion: 1;
  summary: string;
  confidence: OneUnderstandingConfidence;
  entities: IntelligenceEntity[];
  suggestions: IntelligenceSuggestion[];
  ambiguities: string[];
  generatedAt: string;
};
