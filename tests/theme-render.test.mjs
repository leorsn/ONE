import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { themes } from '../src/theme/editions.ts';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const nativeWeb = require('react-native-web');

// Render production primitives with the real React/web renderer. Native-only modules
// are stubbed here; these checks do not assert native glass or pixel layout.
function loadComponents(theme, reduced) {
  const cache = new Map();
  const context = { theme, preference: theme.id, resolvedMode: theme.mode, loaded: true, reduceTransparency: reduced, reduceMotion: true };
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
    ...load(path.join(root, 'src/ui/NeverInput.tsx'))
  };
}
for (const theme of Object.values(themes)) test(`${theme.id} production preview, material and field render in both transparency modes`, () => {
  for (const reduced of [false, true]) {
    const { ThemePreview, NeverMaterial, NeverInput } = loadComponents(theme, reduced);
    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
      React.createElement(ThemePreview, { preference: theme.id }),
      React.createElement(NeverMaterial, { role: 'input' }, React.createElement(NeverInput, { accessibilityLabel: 'Capture', value: 'Unsent draft', onChangeText() {}, style: { backgroundColor: theme.fill } }))
    ));
    assert.match(markup, /NEVER/);
    assert.match(markup, /Unsent draft/);
    assert.match(markup, /aria-label="Capture"/);
    assert.doesNotMatch(markup, /NaN/);
  }
});
test('System preview renders both material editions together', () => {
  const { ThemePreview } = loadComponents(themes.platinum, false);
  const markup = renderToStaticMarkup(React.createElement(ThemePreview, { preference: 'system' }));
  assert.equal((markup.match(/>NEVER</g) ?? []).length, 2);
  assert.match(markup, /Light \/ Dark/);
});
