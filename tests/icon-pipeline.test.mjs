import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { validatePng } from '../scripts/png-integrity.mjs';
const require = createRequire(import.meta.url);
const plugin = require('../plugins/with-never-app-icons.js');
const Jimp = require('jimp-compact');
const root = path.resolve(import.meta.dirname, '..');

for (const name of ['never-nature', 'never-wordmark']) test(`${name} fully decodes through Expo's image decoder`, async () => {
  const bytes = fs.readFileSync(path.join(root, 'assets/icons', `${name}.png`));
  validatePng(bytes);
  assert.equal(bytes[24], 8);
  assert.equal(bytes[25], 2, 'approved source is opaque RGB');
  const image = await Jimp.read(bytes);
  assert.equal(image.bitmap.width, 1024);
  assert.equal(image.bitmap.height, 1024);
  for (let i = 3; i < image.bitmap.data.length; i += 4) assert.equal(image.bitmap.data[i], 255);
});

test('alternate icon generation is deterministic, clears stale files and fails before replacing good output', async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'never-icon-plugin-'));
  try {
    fs.mkdirSync(path.join(temporary, 'ios/NEVER.xcodeproj'), { recursive: true });
    fs.mkdirSync(path.join(temporary, 'ios/NEVER'), { recursive: true });
    fs.writeFileSync(path.join(temporary, 'ios/NEVER/AppDelegate.swift'), '// Native source-root fixture');
    fs.mkdirSync(path.join(temporary, 'assets/icons'), { recursive: true });
    const source = path.join(temporary, 'assets/icons/never-wordmark.png');
    const original = fs.readFileSync(path.join(root, 'assets/icons/never-wordmark.png'));
    fs.writeFileSync(source, original);
    const config = plugin({ name: 'NEVER', slug: 'one-app' });
    const generate = () => config.mods.ios.dangerous({ ...config, modRequest: { projectRoot: temporary, platformProjectRoot: path.join(temporary, 'ios'), platform: 'ios', modName: 'dangerous' } });
    const catalog = path.join(temporary, 'ios/NEVER/Images.xcassets/NeverWordmark.appiconset');
    await generate();
    const manifest = fs.readFileSync(path.join(catalog, 'Contents.json'), 'utf8');
    assert.deepEqual(JSON.parse(manifest), { images: [{ filename: 'NeverWordmark-1024.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }], info: { author: 'xcode', version: 1 } });
    fs.writeFileSync(path.join(catalog, 'stale-corrupt.png'), 'broken');
    await generate();
    assert.deepEqual(fs.readdirSync(catalog).sort(), ['Contents.json', 'NeverWordmark-1024.png']);
    assert.equal(fs.readFileSync(path.join(catalog, 'Contents.json'), 'utf8'), manifest);
    assert.deepEqual(fs.readFileSync(path.join(catalog, 'NeverWordmark-1024.png')), original);
    fs.writeFileSync(source, original.subarray(0, 100));
    await assert.rejects(generate(), /truncated PNG/);
    assert.deepEqual(fs.readFileSync(path.join(catalog, 'NeverWordmark-1024.png')), original);
    fs.writeFileSync(source, Buffer.from('RIFF not a PNG'));
    await assert.rejects(generate(), /invalid PNG/);
    fs.rmSync(source);
    await assert.rejects(generate(), /Missing NEVER alternate icon/);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});
