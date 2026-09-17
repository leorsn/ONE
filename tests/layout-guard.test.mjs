import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function source(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

const boundedScreens = [
  ['src/ui/primitives.tsx', /screenContent:[\s\S]*maxWidth:\s*760/],
  ['app/ask.tsx', /shell:[\s\S]*maxWidth:\s*760/],
  ['app/scan.tsx', /content:[\s\S]*maxWidth:\s*760/],
  ['app/settings/privacy.tsx', /content:[\s\S]*maxWidth:\s*760/],
  ['app/settings/notifications.tsx', /content:[\s\S]*maxWidth:\s*760/],
  ['app/settings/appearance.tsx', /content:[\s\S]*maxWidth:\s*760/],
  ['app/share.tsx', /content:[\s\S]*maxWidth:\s*760/],
  ['app/upgrade.tsx', /content:[\s\S]*maxWidth:\s*760/],
  ['app/handle-share.tsx', /content:[\s\S]*maxWidth:\s*760/],
  ['app/item/[id].tsx', /content:[\s\S]*maxWidth:\s*760/],
  ['app/inbox/[id].tsx', /content:[\s\S]*maxWidth:\s*760/],
  ['app/auth/sign-in.tsx', /shell:[\s\S]*maxWidth:\s*520/],
  ['app/onboarding.tsx', /slideContent:[\s\S]*maxWidth:\s*760/]
];

test('primary NEVER consumer screens keep bounded tablet content widths', () => {
  for (const [path, pattern] of boundedScreens) {
    assert.match(source(path), pattern, `${path} must keep a bounded tablet content width`);
  }
});

test('onboarding keeps responsive full-width paging separate from bounded visual content', () => {
  const onboarding = source('app/onboarding.tsx');
  assert.match(onboarding, /useWindowDimensions/);
  assert.match(onboarding, /style=\{\[styles\.slide, \{ width \}\]\}/);
  assert.match(onboarding, /style=\{styles\.slideContent\}/);
});

test('release-facing copy does not mention a development build in the share guide', () => {
  assert.doesNotMatch(source('app/share.tsx'), /development build/i);
});
