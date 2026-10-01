import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadComponents } from './helpers/render-ui.mjs';
import { StyleSheet } from 'react-native-web';
import { themes } from '../src/theme/editions.ts';

for (const theme of Object.values(themes)) test(`${theme.id} production preview, material and field render in both transparency modes`, () => {
  for (const reduced of [false, true]) {
    const { ThemePreview, NeverMaterial, NeverInput, images } = loadComponents(theme, reduced);
    const markup = renderToStaticMarkup(React.createElement(React.Fragment, null,
      React.createElement(ThemePreview, { preference: theme.id }),
      React.createElement(NeverMaterial, { role: 'input' }, React.createElement(NeverInput, { accessibilityLabel: 'Capture', value: 'Unsent draft', onChangeText() {}, style: { backgroundColor: theme.fill } }))
    ));
    assert.match(markup, /NEVER/);
    assert.match(markup, /Unsent draft/);
    assert.match(markup, /aria-label="Capture"/);
    assert.doesNotMatch(markup, /NaN/);
    const asset = { tactile: 'canyon', orbit: 'tidal' }[theme.id] ?? theme.id;
    assert.equal(images.length, 1);
    assert.equal(images[0].source.uri, `/assets/material-worlds/${asset}.png`);
    assert.equal(images[0].resizeMode, 'cover');
    const style = StyleSheet.flatten(images[0].style);
    assert.equal(style.width, '100%');
    assert.equal(style.height, '100%');
  }
});
test('System preview uses plain light and dark without premium artwork', () => {
  const { ThemePreview, images } = loadComponents(themes.platinum, false);
  const markup = renderToStaticMarkup(React.createElement(ThemePreview, { preference: 'system' }));
  assert.equal((markup.match(/>NEVER</g) ?? []).length, 2);
  assert.match(markup, /Light \/ Dark/);
  assert.equal(images.length, 0);
});

test('standalone route fallback keeps artwork outside transparent safe-area content', () => {
  let safeProps;
  const SafeAreaView = props => { safeProps = props; return React.createElement('main', null, props.children); };
  const { loadScreen, images } = loadComponents(themes.platinum, false, {
    'react-native-safe-area-context': { SafeAreaView }
  });
  const { NeverScreen } = loadScreen('src/ui/NeverScreen.tsx');
  const markup = renderToStaticMarkup(React.createElement(NeverScreen, { edges: ['top', 'left', 'right'], style: { backgroundColor: '#FFFFFF' } }, 'Content'));
  assert.equal(images.length, 1);
  assert.equal(safeProps.children, 'Content');
  assert.equal(StyleSheet.flatten(safeProps.style).backgroundColor, 'transparent');
  assert.ok(markup.indexOf('/assets/material-worlds/platinum.png') < markup.indexOf('<main>'));
});

test('shared wallpaper stage warms six images once across multiple route surfaces', () => {
  const { loadScreen, images } = loadComponents(themes.platinum, false, {
    'react-native-safe-area-context': { SafeAreaView: props => React.createElement('main', null, props.children) }
  });
  const { WallpaperStage } = loadScreen('src/ui/WallpaperStage.tsx');
  const { NeverScreen } = loadScreen('src/ui/NeverScreen.tsx');
  const markup = renderToStaticMarkup(React.createElement(WallpaperStage, null,
    React.createElement(NeverScreen, null, 'Home'), React.createElement(NeverScreen, null, 'Search')));
  assert.equal(images.length, 6, 'route mounting must not add another wallpaper image');
  assert.equal(new Set(images.map(image => image.source.uri)).size, 6);
  for (const image of images) {
    assert.equal(image.resizeMode, 'cover');
    assert.equal(image.fadeDuration, 0);
    assert.equal(typeof image.onLoad, 'function');
    assert.equal(StyleSheet.flatten(image.style).width, '100%');
    assert.equal(StyleSheet.flatten(image.style).height, '100%');
  }
  assert.match(markup, /Home/); assert.match(markup, /Search/);
});
