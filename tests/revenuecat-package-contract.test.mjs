import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/subscription/revenueCat.ts', import.meta.url), 'utf8');

test('RevenueCat package selection requires both the expected package and store product IDs', () => {
  assert.match(
    source,
    /rcPackage\.identifier === product\.revenueCatPackageId\s*&&\s*rcPackage\.product\.identifier === product\.id/,
    'Never permit a matching package identifier to override a mismatched store product ID (or vice versa)'
  );
});

test('RevenueCat purchase rejects missing expected packages before calling the store', () => {
  assert.match(source, /if \(!rcPackage\)\s*\{\s*return\s*\{\s*ok: false,/);
});
