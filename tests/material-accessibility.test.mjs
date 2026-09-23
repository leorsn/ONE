import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(path) {
  return readFileSync(path, 'utf8');
}

test('NEVER keeps a 44pt minimum interactive control target', () => {
  const tokens = source('src/theme/tokens.ts');
  assert.match(tokens, /neverControl\s*=\s*\{[^}]*minimum:\s*44\b/s);
});

test('Saved document filters respect the shared minimum touch target', () => {
  const saved = source('src/screens/SavedV5.tsx');
  assert.match(saved, /documentFilter:\s*\{[^}]*minHeight:\s*44\b/s);
});

test('choice surfaces expose semantic radio groups', () => {
  const appearance = source('app/settings/appearance.tsx');
  const notifications = source('app/settings/notifications.tsx');

  assert.match(appearance, /accessibilityRole="radiogroup"\s+accessibilityLabel="Interface theme"/);
  assert.match(appearance, /accessibilityRole="radiogroup"\s+accessibilityLabel="App icon"/);
  assert.match(notifications, /accessibilityRole="radiogroup"\s+accessibilityLabel="Default reminder timing"/);
});

test('Material overlays and the floating tab bar avoid deprecated pointerEvents JSX props', () => {
  const material = source('src/ui/material.tsx');
  const tabs = source('app/(tabs)/_layout.tsx');

  assert.doesNotMatch(material, /\spointerEvents=/);
  assert.doesNotMatch(tabs, /\spointerEvents=/);
  assert.match(material, /pointerEvents:\s*'none'/);
  assert.match(tabs, /pointerEvents:\s*'box-none'/);
});
