import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '../..');
const nativeWeb = require('react-native-web');

// Render production primitives with the real React/web renderer. Native-only modules
// are stubbed here; these checks do not assert native glass or pixel layout.
export function loadComponents(theme, reduced, mocks = {}, dimensions) {
  const cache = new Map();
  const images = [];
  const context = { theme, preference: theme.id, resolvedMode: theme.mode, loaded: true, reduceTransparency: reduced, reduceMotion: true };
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} }; cache.set(filename, module);
    const compiled = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    function localRequire(name) {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === 'react-native') return { ...nativeWeb, ...(dimensions ? { useWindowDimensions: () => dimensions } : {}), Image: (props) => { images.push(props); return React.createElement(nativeWeb.Image, props); } };
      if (name === 'expo-glass-effect') return { GlassView: nativeWeb.View, isGlassEffectAPIAvailable: () => false, isLiquidGlassAvailable: () => false };
      if (name === 'expo-haptics') return { selectionAsync: async () => undefined };
      if (name === '@/src/theme/useTheme') return { useTheme: () => theme, useThemePreference: () => context };
      if (name === '@/src/context/ThemeContext') return { useThemeContext: () => context };
      if (!name.startsWith('.') && !name.startsWith('@/')) return require(name);
      const base = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(filename), name);
      const resolved = [base, `${base}.ts`, `${base}.tsx`].find(existsSync);
      if (!resolved) throw Error(`Unresolved test import ${name}`);
      if (resolved.endsWith('.png')) return { uri: `/assets/material-worlds/${path.basename(resolved)}` };
      return load(resolved);
    }
    new Function('require', 'module', 'exports', compiled)(localRequire, module, module.exports);
    return module.exports;
  }
  return {
    images,
    loadScreen: (file) => load(path.join(root, file)),
    ...load(path.join(root, 'src/ui/ThemePreview.tsx')),
    ...load(path.join(root, 'src/ui/material.tsx')),
    ...load(path.join(root, 'src/ui/NeverInput.tsx'))
  };
}
