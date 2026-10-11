import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('clean Light and Dark palettes are neutral and retain legacy compatibility', async () => {
  const theme = await read('src/theme/editions.ts');
  assert.match(theme, /background: '#F5F3F0'/);
  assert.match(theme, /background: '#050505'/);
  assert.match(theme, /'Light', 'Pearl/);
  assert.match(theme, /'Dark', 'Graphite/);
  assert.match(theme, /'archive', 'aurora', 'tactile', 'orbit'/);
  assert.match(theme, /basicSystemDark/);
  assert.match(theme, /basicSystemLight/);
});

test('home keeps its functional P3 navigation, capture and recall', async () => {
  const home = await read('src/screens/HomeV5.tsx');
  assert.match(home, /router\.push\('\/ask'\)/);
  assert.match(home, /handleSave/);
  assert.match(home, /router\.push\('\/scan'\)/);
  assert.match(home, /router\.push\('\/share'\)/);
  assert.match(home, /const recall = controls \?\? \(p\.dark/);
  assert.match(home, /quickAction: \{ flex: 1/);
});

test('appearance picker features two primary designs plus system', async () => {
  const appearance = await read('app/settings/appearance.tsx');
  assert.match(appearance, /\['platinum', 'monolith', 'system'\] as const/);
  assert.match(appearance, /Two essential appearances/);
});
