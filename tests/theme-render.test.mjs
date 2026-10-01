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

test('route artwork is outside the transparent safe-area content', () => {
  const SafeAreaView = () => null;
  const { loadScreen } = loadComponents(themes.platinum, false, {
    'react-native-safe-area-context': { SafeAreaView }
  });
  const { NeverScreen } = loadScreen('src/ui/NeverScreen.tsx');
  const tree = NeverScreen({ children: 'Content', edges: ['top', 'left', 'right'], style: { backgroundColor: '#FFFFFF' } });
  const [backdrop, content] = React.Children.toArray(tree.props.children);
  assert.equal(backdrop.type, loadScreen('src/ui/ThemeBackdrop.tsx').ThemeBackdrop);
  assert.equal(content.type, SafeAreaView);
  assert.equal(content.props.children, 'Content');
  assert.equal(StyleSheet.flatten(content.props.style).backgroundColor, 'transparent');
  assert.equal(StyleSheet.flatten(tree.props.style).flex, 1);
});
