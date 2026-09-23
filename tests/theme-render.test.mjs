import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { themes } from '../src/theme/editions.ts';

const require = createRequire(import.meta.dirname, '..');
const root = path.resolve(import.meta.dirname, '..');
const nativeWeb = require('react-native-web');

// Render production primitives with the real React/web renderer. Native-only modules
// are stubbed here; these checks do not assert native glass, native symbols or pixel layout.
function loadComponents(theme, reduced) {
  const cache = new Map();
  const context = { theme, preference: theme.id, resolvedMode: theme.mode, loaded: true, reduceTransparency: reduced, reduceMotion: true };
  const iconStub = {
    icons: {
      check: { ios: 'checkmark', android: 'check', web: 'check' },
      info: { ios: 'info.circle', android: 'info', web: 'info' }
    },
    OneIcon: ({ size = 20 }) => React.createElement(nativeWeb.View, { style: { width: size, height: size } })
  };
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    function localRequire(name) {
      if (name === 'react-native') return nativeWeb;
      if (name === 'expo-glass-effect') return { GlassView: nativeWeb.View, isGlassEffectAPIAvailable: () => false, isLiquidGlassAvailable: () => false };
      if (name === 'expo-haptics') return { selectionAsync: async () => undefined };
      if (name === '@/src/theme/useTheme') return { useTheme: () => theme, useThemePreference: () => context };
      if (name === '@/src/context/ThemeContext') return { useThemeContext: () => context };
      if (name === '@/src/ui/icons' || name === './icons') return iconStub;
      if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
      const base = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
      const resolved = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
      if (!resolved) throw Error(`Unresolved test import ${name}`);
      return load(resolved);
    }
    new Function('require', 'module', 'exports', compiled)(localRequire, module, module.exports);
    return module.exports;
  }
  return {
    ...load(path.join(root, 'src/ui/ThemePreview.tsx')),
    ...load(path.join(root, 'src/ui/material.tsx')),
    ...load(path.join(root, 'src/ui/NeverInput.tsx')),
    ...load(path.join(root, 'src/ui/NeverNotice.tsx'))
  };
}
for (const theme of Object.values(themes)) test(`${theme.id} production preview, materials, notice and field render in both transparency modes`, () => {
  for (const reduced of [false, true]) {
    const { ThemePreview, NeverMaterial, NeverInput, NeverNotice } = loadComponents(theme, reduced);
    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
      React.createElement(ThemePreview, { preference: theme.id }),
      React.createElement(NeverMaterial, { role: 'card' }, React.createElement('span', null, 'Material card')),
      React.createElement(NeverMaterial, { role: 'input' }, React.createElement(NeverInput, { accessibilityLabel: 'Capture', value: 'Unsent draft', onChangeText() {}, style: { backgroundColor: theme.fill } })),
      React.createElement(NeverNotice, { title: 'Status check', body: 'Shared material notice' })
    ));
    assert.match(markup, /NEVER/);
    assert.match(markup, /Material card/);
    assert.match(markup, /Unsent draft/);
    assert.match(markup, /Status check/);
    assert.match(markup, /Shared material notice/);
    assert.match(markup, /aria-label="Capture"/);
    assert.doesNotMatch(markup, /NaN/);
  }
});
test('explicit Material World geometry overrides the shared material default', () => {
  const { NeverMaterial } = loadComponents(themes.archive, false);
  const markup = renderToStaticMarkup(
    React.createElement(NeverMaterial, { role: 'card', style: { borderRadius: 3 } }, React.createElement('span', null, 'Custom geometry'))
  );
  assert.match(markup, /Custom geometry/);
  for (const corner of ['top-left', 'top-right', 'bottom-right', 'bottom-left']) {
    assert.match(markup, new RegExp(`border-${corner}-radius:3px`));
  }
});
test('System preview renders both material editions together', () => {
  const { ThemePreview } = loadComponents(themes.platinum, false);
  const markup = renderToStaticMarkup(React.createElement(ThemePreview, { preference: 'system' }));
  assert.equal((markup.match(/>NEVER</g) ?? []).length, 2);
  assert.match(markup, /Light \/ Dark/);
});