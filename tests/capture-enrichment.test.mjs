import test from 'node:test';
import assert from 'node:assert/strict';

import { interpretCapture } from '../src/capture/core.ts';
import { enrichCaptureDraft, extractWebUrls } from '../src/capture/enrichment.ts';
import { buildItemFromCapture } from '../src/capture/buildItem.ts';

const NOW = new Date('2026-09-20T18:00:00.000Z');

test('scan enrichment replaces camera filename with useful OCR title and exposes OCR URL', () => {
  const input = {
    rawText: 'IMG_4821.JPG',
    extractedText: [
      'STELLA POLARIS GMBH',
      'Customer portal',
      'www.stella-polaris.de/login'
    ].join('\n'),
    sourceType: 'scan',
    isImage: true,
    now: NOW
  };

  const draft = enrichCaptureDraft(interpretCapture(input), input);

  assert.equal(draft.title, 'STELLA POLARIS GMBH');
  assert.equal(draft.url, 'https://www.stella-polaris.de/login');
  assert.ok(draft.entities.includes('url:https://www.stella-polaris.de/login'));
  assert.match(draft.userContext || '', /STELLA POLARIS GMBH/i);
});

test('receipt enrichment drafts useful context without replacing recognized facts', () => {
  const input = {
    rawText: 'scan-20260920.jpg',
    extractedText: 'IKEA\nRECEIPT\nDesk 49.00 EUR\nTOTAL 59.90 EUR',
    sourceType: 'scan',
    isImage: true,
    now: NOW
  };

  const draft = enrichCaptureDraft(interpretCapture(input), input);

  assert.equal(draft.merchant, 'IKEA');
  assert.equal(draft.amount, 59.9);
  assert.equal(draft.currency, 'EUR');
  assert.match(draft.userContext || '', /^Receipt from IKEA/i);
});

test('clean web URL extraction normalizes www links for direct opening', () => {
  assert.deepEqual(
    extractWebUrls('Portal: www.example.com/account\nDocs: https://docs.example.com/help.'),
    ['https://www.example.com/account', 'https://docs.example.com/help']
  );
});

test('resolved safe destination survives item creation and attachment remains reopenable', () => {
  const input = {
    rawText: 'IMG_4821.JPG',
    extractedText: 'Project Atlas\nReference material',
    sourceType: 'scan',
    isImage: true,
    now: NOW
  };
  const draft = enrichCaptureDraft(interpretCapture(input), input);
  assert.equal(draft.destination, 'saved');
  assert.equal(draft.needsReview.length, 0);

  const item = buildItemFromCapture({
    draft,
    sourceType: 'scan',
    rawInput: draft.extractedText,
    localAttachmentUri: 'file:///one-attachments/project-atlas.jpg',
    attachmentMimeType: 'image/jpeg',
    attachmentName: 'IMG_4821.JPG',
    now: NOW
  });

  assert.equal(item.destination, 'saved');
  assert.equal(item.triageState, 'processed');
  assert.equal(item.localAttachmentUri, 'file:///one-attachments/project-atlas.jpg');
  assert.equal(item.imageUrl, 'file:///one-attachments/project-atlas.jpg');
  assert.equal(item.attachmentUrl, 'file:///one-attachments/project-atlas.jpg');
});
