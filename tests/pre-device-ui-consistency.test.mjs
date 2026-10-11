import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('core screens use the shared Pass 3 responsive heading treatment', () => {
  for (const path of [
    'src/screens/HomeV5.tsx',
    'src/screens/SearchV5.tsx',
    'src/screens/CalendarV5.tsx',
    'src/screens/SavedV5.tsx',
    'src/screens/SettingsV5.tsx'
  ]) {
    const value = source(path);
    assert.match(value, /p\.pass3Heading/, `${path} should use the shared responsive Pass 3 heading`);
    assert.match(value, /p\.environmentText/, `${path} should preserve artwork-aware environment text`);
  }
});

test('shared controls retain real 44pt interaction targets', () => {
  const apple = source('src/ui/appleV5.tsx');
  assert.match(apple, /clearButton:\s*\{\s*width:\s*44,\s*height:\s*44/);
  assert.match(apple, /neverControl\.minimum/);

  const home = source('src/screens/HomeV5.tsx');
  assert.match(home, /seeAllTarget/);

  const search = source('src/screens/SearchV5.tsx');
  assert.match(search, /clearTarget/);

  const onboarding = source('app/onboarding.tsx');
  assert.match(onboarding, /minHeight:\s*44/);
});

test('material overlays follow effective rendered radius rather than stale defaults', () => {
  const material = source('src/ui/material.tsx');
  assert.match(material, /effectiveRadius/);
  assert.match(material, /borderRadius:\s*effectiveRadius/);
  assert.match(material, /Math\.max\(0, effectiveRadius - 1\)/);
});

test('core loading and recovery states remain explicit before device acceptance', () => {
  const home = source('src/screens/HomeV5.tsx');
  assert.match(home, /Could not save\. Your capture is still here/);
  assert.match(home, /accessibilityState=\{\{ busy: true \}\}/);

  const search = source('src/screens/SearchV5.tsx');
  assert.match(search, /Could not retrieve an answer/);
  assert.match(search, /Looking through your memory/);

  const settings = source('src/screens/SettingsV5.tsx');
  assert.match(settings, /Could not delete account/);
  assert.match(settings, /Needs attention/);
});

test('onboarding remains finite, skippable and reduced-motion aware', () => {
  const onboarding = source('app/onboarding.tsx');
  assert.match(onboarding, /Skip introduction/);
  assert.match(onboarding, /animated: !reducedMotion/);
  assert.match(onboarding, /page \$\{index \+ 1\} of \$\{slides\.length\}/);
});
