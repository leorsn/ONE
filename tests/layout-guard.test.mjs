import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function source(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const boundedScreens = [
  'src/ui/primitives.tsx',
  'src/screens/HomeV5.tsx',
  'src/screens/SearchV5.tsx',
  'src/screens/AskV5.tsx',
  'src/screens/CalendarV5.tsx',
  'src/screens/SavedV5.tsx',
  'src/screens/SettingsV5.tsx',
  'app/scan.tsx',
  'app/settings/privacy.tsx',
  'app/settings/notifications.tsx',
  'app/settings/appearance.tsx',
  'app/share.tsx',
  'app/upgrade.tsx',
  'app/handle-share.tsx',
  'app/item/[id].tsx',
  'app/inbox/[id].tsx',
  'app/auth/sign-in.tsx',
  'app/onboarding.tsx'
];

test('primary NEVER consumer screens keep bounded tablet content widths', () => {
  for (const path of boundedScreens) {
    assert.match(
      source(path),
      /maxWidth:\s*(?:[4-7]\d{2})/,
      `${path} must keep a bounded tablet content width between 400 and 799 points`
    );
  }
});

test('tab route wrappers delegate to the V5 implementations', () => {
  const routes = [
    ['app/(tabs)/index.tsx', 'HomeV5'],
    ['app/(tabs)/search.tsx', 'SearchV5'],
    ['app/(tabs)/calendar.tsx', 'CalendarV5'],
    ['app/(tabs)/saved.tsx', 'SavedV5'],
    ['app/(tabs)/settings.tsx', 'SettingsV5'],
    ['app/ask.tsx', 'AskV5']
  ];

  for (const [path, screen] of routes) {
    assert.match(source(path), new RegExp(`src/screens/${screen}`), `${path} must route to ${screen}`);
  }
});

test('onboarding keeps responsive full-width paging separate from bounded visual content', () => {
  const onboarding = source('app/onboarding.tsx');
  assert.match(onboarding, /useWindowDimensions/);
  assert.match(onboarding, /style=\{\[styles\.slide, \{ width \}\]\}/);
  assert.match(onboarding, /style=\{styles\.slideContent\}/);
  assert.match(onboarding, /scrollTo\(\{ x: width \* index, animated: false \}\)/);
});

test('release-facing copy does not mention a development build in the share guide', () => {
  assert.doesNotMatch(source('app/share.tsx'), /development build/i);
});
