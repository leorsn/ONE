import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadComponents } from './helpers/render-ui.mjs';
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
  }
});
test('System preview renders both material editions together', () => {
  const { ThemePreview } = loadComponents(themes.platinum, false);
  const markup = renderToStaticMarkup(React.createElement(ThemePreview, { preference: 'system' }));
  assert.equal((markup.match(/>NEVER</g) ?? []).length, 2);
  assert.match(markup, /Light \/ Dark/);
});
