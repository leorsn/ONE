import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

test('NEVER keeps Nature as the primary app icon and registers the alternate-icon plugin', () => {
  const appConfig = readJson('app.json');
  const expo = appConfig.expo ?? {};
  const plugins = expo.plugins ?? [];

  assert.equal(expo.icon, './assets/icons/never-nature.png');
  assert.ok(plugins.includes('./plugins/with-never-app-icons'));
  assert.ok(fs.statSync(path.join(root, 'assets/icons/never-nature.png')).size > 1_000);
  assert.ok(fs.statSync(path.join(root, 'assets/icons/never-wordmark.png')).size > 1_000);
});

test('NEVER local icon module is registered for Apple builds', () => {
  const moduleConfig = readJson('modules/never-app-icon/expo-module.config.json');

  assert.deepEqual(moduleConfig.platforms, ['apple']);
  assert.deepEqual(moduleConfig.apple?.modules, ['NeverAppIconModule']);
});
