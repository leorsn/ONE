import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const text = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const userFacingFiles = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/search.tsx',
  'app/(tabs)/calendar.tsx',
  'app/(tabs)/saved.tsx',
  'app/(tabs)/settings.tsx',
  'app/ask.tsx',
  'app/auth/sign-in.tsx',
  'app/auth/callback.tsx',
  'app/auth/reset-password.tsx',
  'app/handle-share.tsx',
  'app/inbox/[id].tsx',
  'app/item/[id].tsx',
  'app/onboarding.tsx',
  'app/scan.tsx',
  'app/settings/appearance.tsx',
  'app/settings/notifications.tsx',
  'app/settings/privacy.tsx',
  'app/share.tsx',
  'app/upgrade.tsx',
  'src/capture/CaptureReviewEditor.tsx',
  'src/export/exportOneData.ts',
  'src/notifications/localNotifications.ts',
  'src/notifications/status.ts',
  'src/recall/grounding.ts',
  'src/recall/service.ts',
  'src/search/grounded.ts',
  'src/ui/OneItemRow.tsx',
  'src/ui/TriageRow.tsx'
];

const bannedLegacyCopy = [
  'Ask ONE',
  'Saved to ONE',
  'Save to ONE',
  'Share to ONE',
  'Share-to-ONE',
  'Scan to ONE',
  'ONE Account',
  'ONE AI',
  'ONE Plans',
  'ONE understood',
  'Captured in ONE',
  'Saved in ONE',
  'Return to ONE',
  'Continue to ONE',
  'Choose ONE',
  'Send anything to ONE',
  'ONE can schedule',
  'ONE memories',
  'ONE items'
];

test('consumer app metadata exposes NEVER while compatibility identifiers remain stable', async () => {
  const config = JSON.parse(await text('app.json'));
  assert.equal(config.expo.name, 'NEVER');
  assert.equal(config.expo.scheme, 'one');
  assert.equal(config.expo.ios.bundleIdentifier, 'app.one.mobile');
});

test('visible subscription names use NEVER without changing compatibility product identifiers', async () => {
  const products = await text('src/subscription/products.ts');
  assert.match(products, /SUBSCRIPTION_GROUP = 'NEVER Membership'/);
  assert.match(products, /displayName: 'NEVER'/);
  assert.match(products, /displayName: 'NEVER AI'/);
  assert.match(products, /id: 'app\.one\.mobile\.one\.monthly'/);
  assert.match(products, /id: 'app\.one\.mobile\.oneai\.monthly'/);
});

test('grounded recall model identifies the consumer product as NEVER', async () => {
  const recallFunction = await text('supabase/functions/answer-one-recall/index.ts');
  assert.match(recallFunction, /You are NEVER, a private personal-memory recall layer\./);
  assert.doesNotMatch(recallFunction, /You are ONE, a private personal-memory recall layer\./);
});

test('critical user-facing surfaces contain no known legacy ONE copy', async () => {
  for (const path of userFacingFiles) {
    const source = await text(path);
    for (const phrase of bannedLegacyCopy) {
      assert.equal(
        source.includes(phrase),
        false,
        `${path} still contains legacy visible copy: ${phrase}`
      );
    }
  }
});
