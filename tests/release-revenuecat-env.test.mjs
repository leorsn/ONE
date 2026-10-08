import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

function checkRevenueCatKey(key) {
  return spawnSync(process.execPath, ['scripts/verify-release-env.mjs'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      NEVER_RELEASE_SCOPE: 'appstore',
      NEVER_REQUIRE_BILLING: '1',
      EXPO_PUBLIC_SUPABASE_URL: 'https://never-testing.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_unit_test',
      EXPO_PUBLIC_PRIVACY_POLICY_URL: 'https://never.invalid/privacy',
      EXPO_PUBLIC_SUPPORT_URL: 'https://never.invalid/support',
      EXPO_PUBLIC_TERMS_URL: 'https://never.invalid/terms',
      EXPO_PUBLIC_REVENUECAT_IOS_KEY: key
    }
  });
}

test('production billing rejects RevenueCat test store keys', () => {
  const result = checkRevenueCatKey('test_fake_test_store_key');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires an appl_ RevenueCat iOS key/);
});

test('production billing accepts Apple public SDK keys of the correct type', () => {
  const result = checkRevenueCatKey('appl_public_sdk_test_value');
  assert.equal(result.status, 0, result.stderr);
});
