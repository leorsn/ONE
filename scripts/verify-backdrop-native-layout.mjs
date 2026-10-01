import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';
import { loadComponents } from '../tests/helpers/render-ui.mjs';
import { themes } from '../src/theme/editions.ts';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const yoga = path.join(root, 'node_modules/react-native/ReactCommon/yoga');
const { images, ThemePreview, loadScreen } = loadComponents(themes.platinum, false);
renderToStaticMarkup(React.createElement(ThemePreview, { preference: 'platinum' }));
const { WallpaperStage } = loadScreen('src/ui/WallpaperStage.tsx');
renderToStaticMarkup(React.createElement(WallpaperStage));
assert.equal(images.length, 7); // preview plus the six resident full-screen sources
for (const image of images) {
  const geometry = require('react-native-web').StyleSheet.flatten(image.style);
  assert.equal(geometry.width, '100%'); assert.equal(geometry.height, '100%');
  assert.equal(image.resizeMode, 'cover');
}
const style = require('react-native-web').StyleSheet.flatten(images[0].style);
assert.equal(style.width, '100%'); assert.equal(style.height, '100%');
assert.equal(images[0].resizeMode, 'cover');
const png = readFileSync(path.join(root, 'assets/material-worlds/platinum.png'));
const dir = mkdtempSync(path.join(tmpdir(), 'never-yoga-'));
try {
  const sources = execFileSync('rg', ['--files', path.join(yoga, 'yoga'), '-g', '*.cpp'], { encoding: 'utf8' }).trim().split('\n');
  const binary = path.join(dir, 'backdrop-layout');
  execFileSync(process.env.CXX || 'c++', ['-std=c++20', '-O0', '-I', yoga, path.join(import.meta.dirname, 'native-checks/backdrop-layout.cpp'), ...sources, '-o', binary], { stdio: 'inherit' });
  process.stdout.write(execFileSync(binary, [String(png.readUInt32BE(16)), String(png.readUInt32BE(20)), String(parseFloat(style.width)), String(parseFloat(style.height))], { encoding: 'utf8' }));
  console.log('Native Yoga geometry verified. This is not physical-device visual acceptance.');
} finally { rmSync(dir, { recursive: true, force: true }); }
