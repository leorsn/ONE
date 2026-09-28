import test from 'node:test';
import assert from 'node:assert/strict';
import { backgroundSpriteLayout } from '../src/theme/backgroundLayout.ts';

test('all worlds cover phone, landscape and preview frames without neighbouring panels', () => {
  for (const [w, h] of [[320, 568], [390, 844], [430, 932], [844, 390], [140, 90]]) {
    for (let index = 0; index < 6; index++) {
      const frame = backgroundSpriteLayout(w, h, index);
      const panel = frame.width / 6;
      const left = frame.left + index * panel;
      assert.ok(left <= 0 && left + panel >= w);
      assert.ok(frame.top <= 0 && frame.top + frame.height >= h);
      assert.ok(Math.abs(panel / frame.height - 150 / 325) < 1e-10);
    }
  }
});

test('unmeasured backdrop has finite zero-size geometry', () => {
  assert.deepEqual(backgroundSpriteLayout(0, 0, 0), { width: 0, height: 0, left: 0, top: 0 });
});
