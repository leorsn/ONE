import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveOneNativePath } from '../src/native/deepLinks.ts';

test('NEVER accepts only registered native deep-link targets', () => {
  assert.deepEqual(resolveOneNativePath('one://auth/callback?code=abc'), {
    route: '/auth/callback?code=abc',
    kind: 'auth_callback'
  });
  assert.deepEqual(resolveOneNativePath('one://auth/reset-password?code=abc'), {
    route: '/auth/reset-password?code=abc',
    kind: 'password_reset'
  });
  assert.deepEqual(resolveOneNativePath('expo-sharing://incoming'), {
    route: '/handle-share',
    kind: 'share'
  });
});

test('unknown absolute URLs and unregistered NEVER targets are rejected', () => {
  for (const path of [
    'https://example.com/phish',
    'mailto:test@example.com',
    'other-app://open',
    'one://unknown/path'
  ]) {
    assert.deepEqual(resolveOneNativePath(path), { route: '/', kind: 'invalid' });
  }
});

test('normal internal Expo Router paths remain available', () => {
  assert.deepEqual(resolveOneNativePath('/(tabs)/saved'), {
    route: '/(tabs)/saved',
    kind: 'app'
  });
});
