import { interpretCapture, type CaptureDraft, type CaptureKind, type InterpretCaptureInput } from './core.ts';
import { normalizeContextLabel, normalizeTags } from './contextNormalization.ts';

export type OneAIInterpretationPayload = {
  title?: string;
  summary?: string;
  classification?: 'note' | 'task' | 'event' | 'link' | 'image' | 'document' | 'idea';
  tags?: string[];
  context?: string;
  people?: string[];
  entities?: string[];
  dates?: string[];
  times?: string[];
  taskIntent?: boolean;
  eventIntent?: boolean;
  confidence?: 'high' | 'medium' | 'low';
  clarificationRequired?: boolean;
};

export type OneAIInterpretationProvider = {
  provider: string;
  model?: string;
  interpret(input: { text: string; sourceType?: string; url?: string; isImage?: boolean }): Promise<unknown>;
};

export type OneIntelligenceResult = {
  draft: CaptureDraft;
  origin: 'deterministic' | 'hybrid';
  aiApplied: boolean;
  failureCode?: string;
  provider?: string;
  model?: string;
};

export async function interpretCaptureWithIntelligence(
  input: InterpretCaptureInput,
  provider?: OneAIInterpretationProvider
): Promise<OneIntelligenceResult> {
  const deterministic = interpretCapture(input);
  if (!provider) return { draft: deterministic, origin: 'deterministic', aiApplied: false };

  try {
    const raw = await provider.interpret({
      text: [input.userContext, input.rawText, input.extractedText].filter(Boolean).join('\n'),
      sourceType: input.sourceType,
      url: input.url,
      isImage: input.isImage
    });
    const validated = validateAIInterpretation(raw);
    if (!validated) {
      return {
        draft: deterministic,
        origin: 'deterministic',
        aiApplied: false,
        failureCode: 'invalid_ai_payload',
        provider: provider.provider,
        model: provider.model
      };
    }

    return {
      draft: mergeAIInterpretation(deterministic, validated),
      origin: 'hybrid',
      aiApplied: true,
      provider: provider.provider,
      model: provider.model
    };
  } catch {
    return {
      draft: deterministic,
      origin: 'deterministic',
      aiApplied: false,
      failureCode: 'ai_unavailable',
      provider: provider.provider,
      model: provider.model
    };
  }
}

export function validateAIInterpretation(value: unknown): OneAIInterpretationPayload | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const classification = source.classification;
  if (classification !== undefined && !['note','task','event','link','image','document','idea'].includes(String(classification))) return undefined;
  const confidence = source.confidence;
  if (confidence !== undefined && !['high','medium','low'].includes(String(confidence))) return undefined;

  const result: OneAIInterpretationPayload = {};
  if (typeof source.title === 'string') result.title = source.title.trim().slice(0, 160);
  if (typeof source.summary === 'string') result.summary = source.summary.trim().slice(0, 600);
  if (classification) result.classification = classification as OneAIInterpretationPayload['classification'];
  if (Array.isArray(source.tags) && source.tags.every((item) => typeof item === 'string')) result.tags = source.tags.slice(0, 12) as string[];
  if (typeof source.context === 'string') result.context = source.context.trim().slice(0, 120);
  if (Array.isArray(source.people) && source.people.every((item) => typeof item === 'string')) result.people = source.people.slice(0, 12) as string[];
  if (Array.isArray(source.entities) && source.entities.every((item) => typeof item === 'string')) result.entities = source.entities.slice(0, 20) as string[];
  if (Array.isArray(source.dates) && source.dates.every(isIsoDate)) result.dates = source.dates.slice(0, 8) as string[];
  if (Array.isArray(source.times) && source.times.every(isClockTime)) result.times = source.times.slice(0, 8) as string[];
  if (typeof source.taskIntent === 'boolean') result.taskIntent = source.taskIntent;
  if (typeof source.eventIntent === 'boolean') result.eventIntent = source.eventIntent;
  if (confidence) result.confidence = confidence as OneAIInterpretationPayload['confidence'];
  if (typeof source.clarificationRequired === 'boolean') result.clarificationRequired = source.clarificationRequired;
  return result;
}

function mergeAIInterpretation(draft: CaptureDraft, ai: OneAIInterpretationPayload): CaptureDraft {
  const mappedKind = ai.classification ? captureKindForClassification(ai.classification) : draft.captureKind;
  const context = normalizeContextLabel(ai.context || draft.userContext);
  const next: CaptureDraft = {
    ...draft,
    title: ai.title || draft.title,
    summary: ai.summary || draft.summary,
    captureKind: mappedKind,
    itemType: itemTypeFor(mappedKind, draft.itemType),
    canonicalKind: canonicalKindFor(mappedKind, draft.canonicalKind),
    userContext: context,
    tags: normalizeTags([...(draft.tags || []), ...(ai.tags || [])]),
    people: unique([...(draft.people || []), ...(ai.people || [])]),
    entities: unique([...(draft.entities || []), ...(ai.entities || [])]),
    date: draft.date || ai.dates?.[0],
    time: draft.time || ai.times?.[0],
    overallConfidence: ai.confidence || draft.overallConfidence
  };

  if (ai.clarificationRequired && !next.needsReview.includes('type')) {
    next.needsReview = [...next.needsReview, 'type'];
  }
  return next;
}

function captureKindForClassification(value: NonNullable<OneAIInterpretationPayload['classification']>): CaptureKind {
  if (value === 'task') return 'task';
  if (value === 'event') return 'event';
  return value;
}

function itemTypeFor(kind: CaptureKind, fallback: CaptureDraft['itemType']): CaptureDraft['itemType'] {
  if (['task','note','reminder','appointment','event','link','idea','document'].includes(kind)) return kind as CaptureDraft['itemType'];
  if (kind === 'image' || kind === 'screenshot') return 'note';
  return fallback;
}

function canonicalKindFor(kind: CaptureKind, fallback: CaptureDraft['canonicalKind']): CaptureDraft['canonicalKind'] {
  if (kind === 'event' || kind === 'appointment') return 'event';
  if (kind === 'reminder') return 'reminder';
  if (kind === 'link') return 'link';
  if (kind === 'document') return 'document';
  if (kind === 'receipt') return 'receipt';
  if (kind === 'image' || kind === 'screenshot') return 'image';
  if (kind === 'note' || kind === 'idea' || kind === 'task') return 'note';
  return fallback;
}

function isIsoDate(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isClockTime(value: unknown) {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
