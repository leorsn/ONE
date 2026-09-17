import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const text = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('native acceptance diagnostics are development-only in distributed builds', async () => {
  const diagnostics = await text('app/dev-native.tsx');
  assert.match(diagnostics, /if \(!__DEV__\) return <Redirect href="\/\(tabs\)" \/>/);
  assert.match(diagnostics, /if \(!__DEV__\) return;/);
});

test('privacy surface reads release legal URLs from public environment configuration', async () => {
  const privacy = await text('app/settings/privacy.tsx');
  assert.match(privacy, /EXPO_PUBLIC_PRIVACY_POLICY_URL/);
  assert.match(privacy, /EXPO_PUBLIC_SUPPORT_URL/);
  assert.match(privacy, /EXPO_PUBLIC_TERMS_URL/);
  assert.doesNotMatch(privacy, /example\.com|localhost|127\.0\.0\.1/i);
});

test('subscription paywall exposes Privacy Policy and Terms of Use from release URLs', async () => {
  const upgrade = await text('app/upgrade.tsx');
  assert.match(upgrade, /EXPO_PUBLIC_PRIVACY_POLICY_URL/);
  assert.match(upgrade, /EXPO_PUBLIC_TERMS_URL/);
  assert.match(upgrade, />Terms of Use</);
  assert.match(upgrade, />Privacy Policy</);
});

test('App Store release environment requires both billing and Terms configuration', async () => {
  const releaseEnv = await text('scripts/verify-release-env.mjs');
  assert.match(releaseEnv, /required\.push\('EXPO_PUBLIC_REVENUECAT_IOS_KEY', 'EXPO_PUBLIC_TERMS_URL'\)/);
});

test('manual NEVER release gates remain exposed without running production-only checks in normal CI', async () => {
  const pkg = JSON.parse(await text('package.json'));
  assert.equal(pkg.scripts['release:env-check'], 'node scripts/verify-release-env.mjs');
  assert.equal(pkg.scripts['release:asset-check'], 'node scripts/verify-store-assets.mjs');
  assert.equal(pkg.scripts['release:privacy-check'], 'node scripts/verify-ios-privacy-manifests.mjs');
  assert.match(pkg.scripts['release:script-check'], /verify-ios-privacy-manifests\.mjs/);
  assert.doesNotMatch(pkg.scripts.quality, /release:env-check|release:asset-check|release:privacy-check/);
});

test('consumer display name stays NEVER while technical V1 identifiers remain stable', async () => {
  const config = JSON.parse(await text('app.json'));
  assert.equal(config.expo.name, 'NEVER');
  assert.equal(config.expo.scheme, 'one');
  assert.equal(config.expo.ios.bundleIdentifier, 'app.one.mobile');
  assert.equal(config.expo.ios.supportsTablet, true);
});
