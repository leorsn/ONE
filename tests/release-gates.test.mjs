import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(new URL('..', import.meta.url).pathname);

function runScript(script, args = [], env = {}) {
  return spawnSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: 'utf8'
  });
}

const baseReleaseEnv = {
  EXPO_PUBLIC_SUPABASE_URL: 'https://never-release-test.supabase.co',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_release_test',
  EXPO_PUBLIC_PRIVACY_POLICY_URL: 'https://never.test/privacy',
  EXPO_PUBLIC_SUPPORT_URL: 'https://never.test/support',
  EXPO_PUBLIC_TERMS_URL: '',
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: ''
};

test('TestFlight environment may stay billing-disabled while required privacy/support URLs are valid', () => {
  const result = runScript('scripts/verify-release-env.mjs', [], {
    ...baseReleaseEnv,
    NEVER_RELEASE_SCOPE: 'testflight'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /NEVER testflight environment check passed\./);
  assert.match(result.stderr, /RevenueCat iOS key is absent/);
});

test('App Store environment fails closed without RevenueCat and Terms configuration', () => {
  const result = runScript('scripts/verify-release-env.mjs', [], {
    ...baseReleaseEnv,
    NEVER_RELEASE_SCOPE: 'appstore'
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /EXPO_PUBLIC_REVENUECAT_IOS_KEY is missing/);
  assert.match(result.stderr, /EXPO_PUBLIC_TERMS_URL is missing/);
});

test('App Store environment passes when billing and legal URLs are configured', () => {
  const result = runScript('scripts/verify-release-env.mjs', [], {
    ...baseReleaseEnv,
    NEVER_RELEASE_SCOPE: 'appstore',
    EXPO_PUBLIC_TERMS_URL: 'https://never.test/terms',
    EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'appl_release_test_key'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /NEVER appstore environment check passed\./);
});

test('release environment rejects insecure public legal URLs', () => {
  const result = runScript('scripts/verify-release-env.mjs', [], {
    ...baseReleaseEnv,
    NEVER_RELEASE_SCOPE: 'testflight',
    EXPO_PUBLIC_PRIVACY_POLICY_URL: 'http://never.test/privacy'
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /EXPO_PUBLIC_PRIVACY_POLICY_URL must use https/);
});

test('iOS privacy archive gate fails when no PrivacyInfo manifest is present', () => {
  const archive = mkdtempSync(path.join(os.tmpdir(), 'never-empty-archive-'));
  try {
    const result = runScript('scripts/verify-ios-privacy-manifests.mjs', [archive]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /no PrivacyInfo\.xcprivacy file was found/);
  } finally {
    rmSync(archive, { recursive: true, force: true });
  }
});

test('iOS privacy archive gate finds nested dependency or app manifests', () => {
  const archive = mkdtempSync(path.join(os.tmpdir(), 'never-manifest-archive-'));
  try {
    const nested = path.join(archive, 'Products', 'Applications', 'NEVER.app');
    mkdirSync(nested, { recursive: true });
    writeFileSync(path.join(nested, 'PrivacyInfo.xcprivacy'), '<?xml version="1.0"?><plist version="1.0"><dict/></plist>');

    const result = runScript('scripts/verify-ios-privacy-manifests.mjs', [archive]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /found 1 manifest\(s\)/);
    assert.match(result.stdout, /PrivacyInfo\.xcprivacy/);
  } finally {
    rmSync(archive, { recursive: true, force: true });
  }
});
