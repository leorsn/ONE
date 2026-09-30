import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { resolveTheme, themes } from '../src/theme/editions.ts';

test('System follows device mode without using premium material-world artwork', () => {
  const light = resolveTheme('system', 'light');
  const dark = resolveTheme('system', 'dark');

  assert.equal(light.mode, 'light');
  assert.equal(dark.mode, 'dark');
  assert.equal(light.background, '#E6E9EC');
  assert.equal(dark.background, '#101418');
  assert.equal(light.artwork, false);
  assert.equal(dark.artwork, false);

  // Explicit premium selections keep their artwork and identity unchanged.
  assert.equal(themes.platinum.artwork, true);
  assert.equal(themes.monolith.artwork, true);
  assert.equal(resolveTheme('platinum', 'dark'), themes.platinum);
  assert.equal(resolveTheme('monolith', 'light'), themes.monolith);
});

test('ThemeBackdrop suppresses bundled world images only for basic System themes', () => {
  const source = fs.readFileSync(new URL('../src/ui/ThemeBackdrop.tsx', import.meta.url), 'utf8');
  assert.match(source, /theme\.artwork !== false/);
  assert.match(source, /materialWorldAssets\[theme\.id\]/);
});
