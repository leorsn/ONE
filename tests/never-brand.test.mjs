import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const text = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const userFacingFiles = [
  'app/_layout.tsx',
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
  'src/ui/TriageRow.tsx',
  'src/ui/primitives.tsx'
];

const documentationBrandFiles = [
  'docs/AUTH.md',
  'docs/BILLING.md',
  'docs/CAPTURE_FLOW.md',
  'docs/INBOX_TRIAGE.md',
  'docs/PO003_SHARE_SEARCH_RECALL.md',
  'docs/PO004_AUTH_CLOUD_SYNC.md',
  'docs/PO005_V1_INTEGRATION_AUDIT.md',
  'docs/PO046_RELEASE_CANDIDATE.md',
  'docs/PRODUCT_STRATEGY.md',
  'docs/REPOSITORY_RECOVERY_AUDIT.md'
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
  const pluginConfig = JSON.stringify(config.expo.plugins);
  assert.equal(config.expo.name, 'NEVER');
  assert.equal(config.expo.scheme, 'one');
  assert.equal(config.expo.ios.bundleIdentifier, 'app.one.mobile');
  assert.match(pluginConfig, /Allow NEVER to scan receipts and documents\./);
  assert.match(pluginConfig, /Allow NEVER to import receipts and documents/);
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

test('release and architecture documentation uses NEVER for consumer-facing product wording', async () => {
  for (const path of documentationBrandFiles) {
    const source = await text(path);
    assert.match(source, /^# NEVER\b/m, `${path} must use NEVER in its document title`);
    for (const phrase of bannedLegacyCopy) {
      assert.equal(
        source.includes(phrase),
        false,
        `${path} still contains legacy consumer wording: ${phrase}`
      );
    }
  }
});

test('repository quality workflow uses NEVER as its visible name', async () => {
  const workflow = await text('.github/workflows/quality.yml');
  assert.match(workflow, /^name: NEVER Quality/m);
  assert.doesNotMatch(workflow, /^name: ONE Quality/m);
});
