import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const appConfig = createRequire(import.meta.url)('../app.config.js');
const names = [
  'NEVER_LOCAL_DEVICE_TEST',
  'NEVER_REQUIRE_TARGET_SUPABASE',
  'EAS_BUILD_PROFILE',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
];

function withEnv(values, run) {
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    Object.assign(process.env, values);
    run();
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
}

const correctUrl = 'https://nywfoprcwbnsxybdqpma.supabase.co';
const correctPublicKey = 'sb_publishable_FoG2PKUsPg55YaGoq_uSEg_ZPITmLaf';

test('local iPhone build works without Expo/EAS credentials using the approved public defaults', () => {
  withEnv({ NEVER_LOCAL_DEVICE_TEST: '1' }, () => {
    const config = appConfig({ config: { plugins: ['expo-notifications', 'expo-sharing', 'expo-font'] } });
    assert.deepEqual(config.plugins, ['expo-font']);
    assert.equal(config.extra.personalDeviceTest, true);
  });
});

test('local iPhone build rejects stale ONE project URL and mismatched publishable key', () => {
  withEnv({
    NEVER_LOCAL_DEVICE_TEST: '1',
    EXPO_PUBLIC_SUPABASE_URL: 'https://uuehozwygopldwcbkfci.supabase.co',
  }, () => {
    assert.throws(() => appConfig({ config: {} }), /local device test blocked/);
  });

  withEnv({
    NEVER_LOCAL_DEVICE_TEST: '1',
    EXPO_PUBLIC_SUPABASE_URL: correctUrl,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_wrong_project',
  }, () => {
    assert.throws(() => appConfig({ config: {} }), /local device test blocked/);
  });
});

test('local iPhone build accepts explicitly matching NEVER URL and publishable key', () => {
  withEnv({
    NEVER_LOCAL_DEVICE_TEST: '1',
    EXPO_PUBLIC_SUPABASE_URL: correctUrl,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: correctPublicKey,
  }, () => {
    assert.equal(appConfig({ config: {} }).extra.personalDeviceTest, true);
  });
});
