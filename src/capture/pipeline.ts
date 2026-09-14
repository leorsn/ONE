import type { OneItem, OneProcessingStatus } from '../types/item';

export const CAPTURE_PROCESSING_STAGES: OneProcessingStatus[] = [
  'received',
  'normalized',
  'classified',
  'enriched',
  'stored',
  'ready'
];

export function withProcessingStatus(item: OneItem, processingStatus: OneProcessingStatus): OneItem {
  return {
    ...item,
    processingStatus,
    updatedAt: new Date().toISOString()
  };
}

export function markEnrichmentFailure(item: OneItem, failureCode = 'enrichment_failed'): OneItem {
  return {
    ...item,
    processingStatus: 'failed_enrichment',
    aiMetadata: {
      ...(item.aiMetadata || {}),
      failureCode
    },
    updatedAt: new Date().toISOString()
  };
}

export function markNeedsAttention(item: OneItem): OneItem {
  return {
    ...item,
    processingStatus: 'needs_attention',
    updatedAt: new Date().toISOString()
  };
}

export function canAdvanceProcessing(from: OneProcessingStatus, to: OneProcessingStatus) {
  if (to === 'needs_attention' || to === 'failed_enrichment') return true;
  const fromIndex = CAPTURE_PROCESSING_STAGES.indexOf(from);
  const toIndex = CAPTURE_PROCESSING_STAGES.indexOf(to);
  return fromIndex >= 0 && toIndex >= 0 && toIndex >= fromIndex;
}

export function rawCapturePreserved(before: OneItem, after: OneItem) {
  return (
    before.id === after.id &&
    before.rawInput === after.rawInput &&
    before.originalText === after.originalText &&
    before.localAttachmentUri === after.localAttachmentUri
  );
}
