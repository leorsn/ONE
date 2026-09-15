import assert from 'node:assert/strict';
import test from 'node:test';

import { sanitizeNativeDiagnosticDetail } from '../src/native/diagnosticSanitization.ts';
import { mergeLateOcrDraft } from '../src/ocr/mergeLateOcr.ts';
import { collectPagedRows } from '../src/sync/pagination.ts';

test('cloud pagination collects item sets beyond the Supabase default row cap', async () => {
  const source = Array.from({ length: 1201 }, (_, index) => `item-${index}`);
  const calls = [];
  const rows = await collectPagedRows(async (from, to) => {
    calls.push([from, to]);
    return source.slice(from, to + 1);
  }, 500);

  assert.equal(rows.length, 1201);
  assert.deepEqual(rows, source);
  assert.deepEqual(calls, [[0, 499], [500, 999], [1000, 1499]]);
});

test('cloud pagination verifies the end of an exact page boundary', async () => {
  const source = Array.from({ length: 1000 }, (_, index) => index);
  let calls = 0;
  const rows = await collectPagedRows(async (from, to) => {
    calls += 1;
    return source.slice(from, to + 1);
  }, 500);

  assert.equal(rows.length, 1000);
  assert.equal(calls, 3);
});

test('late OCR enriches untouched drafts normally', () => {
  const current = { title: 'Scanned document', extractedText: undefined };
  const interpreted = { title: 'IKEA receipt', extractedText: 'TOTAL 12.00 EUR' };

  assert.equal(
    mergeLateOcrDraft({
      current,
      interpreted,
      extractedText: 'TOTAL 12.00 EUR',
      userEdited: false,
      extractedTextEdited: false
    }),
    interpreted
  );
});

test('late OCR preserves manual fields while adding OCR evidence when extracted text was not edited', () => {
  const current = { title: 'My corrected title', extractedText: undefined, tags: ['manual'] };
  const interpreted = { title: 'Automatic title', extractedText: 'recognized text', tags: ['auto'] };

  assert.deepEqual(
    mergeLateOcrDraft({
      current,
      interpreted,
      extractedText: 'recognized text',
      userEdited: true,
      extractedTextEdited: false
    }),
    { title: 'My corrected title', extractedText: 'recognized text', tags: ['manual'] }
  );
});

test('late OCR never overwrites manually edited extracted text', () => {
  const current = { title: 'Document', extractedText: 'manual correction' };
  const interpreted = { title: 'Automatic', extractedText: 'late OCR' };

  assert.equal(
    mergeLateOcrDraft({
      current,
      interpreted,
      extractedText: 'late OCR',
      userEdited: true,
      extractedTextEdited: true
    }),
    current
  );
});

test('native diagnostic details redact auth codes and bearer or JWT-like credentials', () => {
  const jwt = 'eyJabcdefghijk.abcdefghijk.abcdefghijk';
  const sanitized = sanitizeNativeDiagnosticDetail(
    `callback?code=secret-code&token=secret-token Authorization: Bearer top.secret.value jwt=${jwt}`,
    500
  );

  assert.ok(sanitized);
  assert.equal(sanitized.includes('secret-code'), false);
  assert.equal(sanitized.includes('secret-token'), false);
  assert.equal(sanitized.includes('top.secret.value'), false);
  assert.equal(sanitized.includes(jwt), false);
});
