import assert from 'node:assert/strict';
import test from 'node:test';
import { noEvidenceAnswer, validateRecallModelPayload } from '../src/recall/grounding.ts';

test('accepts grounded saved evidence only with allowed sources', () => {
  const result = validateRecallModelPayload({
    title: 'Saved answer',
    body: 'Supported by memory.',
    sourceIds: ['a'],
    evidence: 'saved'
  }, ['a', 'b']);

  assert.equal(result?.evidence, 'saved');
  assert.deepEqual(result?.sourceIds, ['a']);
});

test('rejects saved or inferred answers without sources', () => {
  assert.equal(validateRecallModelPayload({ title: 'x', body: 'y', sourceIds: [], evidence: 'saved' }, ['a']), undefined);
  assert.equal(validateRecallModelPayload({ title: 'x', body: 'y', sourceIds: [], evidence: 'inferred' }, ['a']), undefined);
});

test('accepts explicit no-evidence answers only without sources', () => {
  const result = validateRecallModelPayload({
    title: 'Not enough evidence',
    body: 'I could not support that from saved memory.',
    sourceIds: [],
    evidence: 'none'
  }, ['a']);

  assert.equal(result?.evidence, 'none');
  assert.deepEqual(result?.sourceIds, []);
  assert.equal(validateRecallModelPayload({ title: 'x', body: 'y', sourceIds: ['a'], evidence: 'none' }, ['a']), undefined);
});

test('rejects source ids outside the retrieved allow-list', () => {
  assert.equal(validateRecallModelPayload({ title: 'x', body: 'y', sourceIds: ['outside'], evidence: 'saved' }, ['a']), undefined);
});

test('deterministic no-evidence fallback is explicit and uncited', () => {
  const result = noEvidenceAnswer();
  assert.equal(result.evidence, 'none');
  assert.deepEqual(result.sourceIds, []);
  assert.match(result.body, /enough saved evidence/i);
});
