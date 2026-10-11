import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Generated outputs are 853×1844; the requested 1290×2796 target remains open.
// Guard against accidentally reintroducing the low-resolution sprite or duplicate worlds.
test('six independently bundled portrait assets retain regenerated detail and distinct pixels', () => {
  const hashes = new Set();
  for (const name of ['platinum', 'monolith', 'archive', 'aurora', 'canyon', 'tidal']) {
    const data = readFileSync(new URL(`../assets/material-worlds/${name}.png`, import.meta.url));
    assert.equal(data.subarray(1, 4).toString(), 'PNG');
    assert.ok(data.readUInt32BE(16) >= 853);
    assert.ok(data.readUInt32BE(20) >= 1844);
    hashes.add(createHash('sha256').update(data).digest('hex'));
  }
  assert.equal(hashes.size, 6);
});
