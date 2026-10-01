import test from 'node:test';
import assert from 'node:assert/strict';
import {
  selectPendingShareCandidate,
  selectShareCandidate,
  shouldPreventDuplicateShare
} from '../src/native/sharePayload.ts';

test('share selection prefers a resolved attachment over duplicate text/url representations', () => {
  const payloads = [
    { shareType: 'text', value: 'Example' },
    { shareType: 'url', value: 'https://example.com' },
    { shareType: 'image', value: 'image' }
  ];
  const resolved = [
    {},
    {},
    { contentType: 'image', contentUri: 'file:///private/image.jpg', originalName: 'image.jpg' }
  ];

  const selected = selectShareCandidate(payloads, resolved);
  assert.equal(selected?.index, 2);
  assert.equal(selected?.representationCount, 3);
});

test('pending share selection skips already completed payload indices', () => {
  const payloads = [
    { shareType: 'image', value: 'first' },
    { shareType: 'file', value: 'second' }
  ];
  const resolved = [
    { contentType: 'image', contentUri: 'file:///private/first.jpg' },
    { contentType: 'file', contentUri: 'file:///private/second.pdf' }
  ];

  const selected = selectPendingShareCandidate(payloads, resolved, [0]);
  assert.equal(selected?.index, 1);
});

test('duplicate share guard blocks only the same fingerprint inside the replay window', () => {
  const now = 1_000_000;
  assert.equal(shouldPreventDuplicateShare({ previousFingerprint: 'same', previousHandledAt: now - 30_000, nextFingerprint: 'same', now }), true);
  assert.equal(shouldPreventDuplicateShare({ previousFingerprint: 'different', previousHandledAt: now - 30_000, nextFingerprint: 'same', now }), false);
  assert.equal(shouldPreventDuplicateShare({ previousFingerprint: 'same', previousHandledAt: now - 180_000, nextFingerprint: 'same', now }), false);
});

test('share selection ignores empty unusable payloads', () => {
  const selected = selectShareCandidate([
    { shareType: 'text', value: '' },
    { shareType: 'url', value: '   ' }
  ]);
  assert.equal(selected, undefined);
});
