import { validPng as fakePng } from './helpers/png.mjs';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = path.resolve(new URL('..', import.meta.url).pathname);


function fixture() {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'never-alt-icon-'));
  mkdirSync(path.join(directory, 'assets', 'icons'), { recursive: true });
  writeFileSync(
    path.join(directory, 'app.json'),
    JSON.stringify({
      expo: {
        name: 'NEVER',
        version: '0.1.0',
        icon: './assets/icons/never-nature.png',
        ios: { bundleIdentifier: 'app.one.mobile' },
        plugins: ['./plugins/with-never-app-icons']
      }
    })
  );
  writeFileSync(path.join(directory, 'assets', 'icons', 'never-nature.png'), fakePng());
  return directory;
}

function run(directory) {
  return spawnSync(process.execPath, [path.join(root, 'scripts', 'verify-store-assets.mjs')], {
    cwd: directory,
    encoding: 'utf8'
  });
}

test('alternate NEVER icon plugin fails closed when wordmark source is missing', () => {
  const directory = fixture();
  try {
    const result = run(directory);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /iOS alternate wordmark app icon does not exist/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('alternate NEVER icon plugin accepts valid default and wordmark sources', () => {
  const directory = fixture();
  try {
    writeFileSync(path.join(directory, 'assets', 'icons', 'never-wordmark.png'), fakePng());
    const result = run(directory);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /NEVER store asset check passed\./);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
