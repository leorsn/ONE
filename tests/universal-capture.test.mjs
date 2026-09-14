import test from 'node:test';
import assert from 'node:assert/strict';

import { buildItemFromCapture } from '../src/capture/buildItem.ts';
import { normalizeContextLabel, normalizeTags } from '../src/capture/contextNormalization.ts';
import { interpretCapture } from '../src/capture/core.ts';
import { interpretCaptureWithIntelligence, validateAIInterpretation } from '../src/capture/intelligence.ts';
import { markEnrichmentFailure, rawCapturePreserved } from '../src/capture/pipeline.ts';

const NOW = new Date('2026-09-14T10:00:00.000Z');

test('URL capture is detected deterministically and retains the original URL', () => {
  const draft = interpretCapture({ rawText: 'https://example.com/article', sourceType: 'manual', now: NOW });
  assert.equal(draft.captureKind, 'link');
  assert.equal(draft.url, 'https://example.com/article');
});

test('event-like text yields structured date/time and event intent on the saved item', () => {
  const draft = interpretCapture({ rawText: 'Meeting mit Max Donnerstag um 17 Uhr', sourceType: 'manual', now: NOW });
  const item = buildItemFromCapture({ draft, sourceType: 'manual', rawInput: 'Meeting mit Max Donnerstag um 17 Uhr', now: NOW });
  assert.equal(item.eventIntent, true);
  assert.equal(item.taskIntent, false);
  assert.equal(item.time, '17:00');
  assert.deepEqual(item.extractedTimes, ['17:00']);
  assert.equal(item.capturedAt, NOW.toISOString());
});

test('task-like capture remains lightweight and records task intent', () => {
  const rawInput = 'Erinnere mich daran, Papa Geschenk zu bestellen';
  const draft = interpretCapture({ rawText: rawInput, sourceType: 'manual', now: NOW });
  const item = buildItemFromCapture({ draft, sourceType: 'manual', rawInput, now: NOW });
  assert.equal(item.taskIntent, true);
  assert.equal(item.eventIntent, false);
  assert.equal(item.processingStatus === 'ready' || item.processingStatus === 'needs_attention', true);
});

test('context normalization reuses familiar family context instead of duplicate variants', () => {
  assert.equal(normalizeContextLabel('Dad', ['Papa', 'Studium']), 'Papa');
  assert.deepEqual(normalizeTags(['Dad', '#Papa', 'Gift', 'gift']), ['papa', 'gift']);
});

test('AI interpretation schema rejects arbitrary model text and invalid classification', () => {
  assert.equal(validateAIInterpretation('Task: do something'), undefined);
  assert.equal(validateAIInterpretation({ classification: 'finance-secret' }), undefined);
});

test('AI unavailable falls back to deterministic interpretation without losing capture', async () => {
  const result = await interpretCaptureWithIntelligence(
    { rawText: 'Zahnarzt Dienstag 14:30', sourceType: 'manual', now: NOW },
    { provider: 'test', model: 'offline', async interpret() { throw new Error('offline'); } }
  );
  assert.equal(result.aiApplied, false);
  assert.equal(result.origin, 'deterministic');
  assert.equal(result.failureCode, 'ai_unavailable');
  assert.equal(result.draft.time, '14:30');
});

test('validated AI enrichment remains structured and additive', async () => {
  const result = await interpretCaptureWithIntelligence(
    { rawText: 'Braun Rasierer', userContext: 'Dad', sourceType: 'manual', now: NOW },
    {
      provider: 'test',
      model: 'structured-v1',
      async interpret() {
        return {
          title: 'Braun Rasierer',
          summary: 'Geschenkidee für Papa',
          classification: 'idea',
          tags: ['gift', 'Dad'],
          context: 'Father',
          confidence: 'high'
        };
      }
    }
  );
  assert.equal(result.aiApplied, true);
  assert.equal(result.draft.captureKind, 'idea');
  assert.equal(result.draft.userContext, 'Papa');
  assert.equal(result.draft.overallConfidence, 'high');
  assert.ok(result.draft.tags.includes('papa'));
});

test('enrichment failure preserves raw user content and attachment reference', () => {
  const draft = interpretCapture({ extractedText: 'Gift Dad', sourceType: 'screenshot', isImage: true, now: NOW });
  const item = buildItemFromCapture({
    draft,
    sourceType: 'screenshot',
    rawInput: 'Gift Dad',
    originalText: 'Gift Dad',
    localAttachmentUri: 'file:///one/gift.png',
    attachmentMimeType: 'image/png',
    now: NOW
  });
  const failed = markEnrichmentFailure(item, 'provider_timeout');
  assert.equal(failed.processingStatus, 'failed_enrichment');
  assert.equal(failed.aiMetadata?.failureCode, 'provider_timeout');
  assert.equal(rawCapturePreserved(item, failed), true);
});
