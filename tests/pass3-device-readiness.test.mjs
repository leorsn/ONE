import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as Native from 'react-native-web';
import { themes } from '../src/theme/editions.ts';
import { loadComponents } from './helpers/render-ui.mjs';

// Render-state injection exercises production presentation without pretending to
// run the native keyboard, UIKit text measurement or the capture backend.
for (const state of [
  { name: 'processing', values: ['A note to keep', true, 'Saving your capture…', null], text: 'Saving capture' },
  { name: 'error', values: ['A note to keep', false, 'Could not save. Your capture is still here — try again.', null], text: 'Could not save.' }
]) test(`capture ${state.name} retains input and feedback`, () => {
  let index = 0;
  const indicators = [];
  const mocks = {
    'react-native': { ...Native, useWindowDimensions: () => ({ width: 375, height: 812, scale: 3, fontScale: 2 }),
      ActivityIndicator: props => { indicators.push(props); return React.createElement(Native.ActivityIndicator, props); } },
    react: { ...React, useState(initial) { return React.useState(index < state.values.length ? state.values[index++] : initial); } },
    'expo-router': { router: { push() {} } },
    'expo-symbols': { SymbolView: () => null },
    'react-native-safe-area-context': { SafeAreaView: Native.View },
    '@/src/ui/useLocalDay': { useLocalDay: () => '2026-09-29' },
    '@/src/context/AuthContext': { useAuth: () => ({ session: null }) },
    '@/src/context/ItemsContext': { useItems: () => ({ items: [], add() {}, update() {} }) },
    '@/src/capture/buildItem': { buildItemFromCapture() {} },
    '@/src/capture/CaptureReviewEditor': { CaptureReviewEditor: () => null },
    '@/src/notifications/status': { notificationSaveWarning: () => null }
  };
  const { loadScreen } = loadComponents(themes.platinum, false, mocks, { width: 375, height: 812, scale: 3, fontScale: 2 });
  const Home = loadScreen('src/screens/HomeV5.tsx').default;
  const markup = renderToStaticMarkup(React.createElement(Home));
  assert.ok(markup.includes(state.text));
  assert.ok(markup.includes('A note to keep'));
  assert.ok(markup.includes('aria-live="polite"'));
  if (state.name === 'processing') assert.ok(indicators.some(props => props.accessibilityState?.busy && props.accessibilityLabel === 'Saving capture'));
  else assert.ok(markup.includes('aria-label="Save capture"'));
});

test('floating navigation preserves five accessible tabs and bounded geometry', () => {
  for (const [width, height] of [[375, 812], [390, 844], [428, 926], [430, 932], [926, 428]]) {
    const captured = [];
    const routes = ['index', 'search', 'calendar', 'saved', 'settings'].map(name => ({ key: name, name }));
    const Tabs = props => props.tabBar({ state: { index: 0, routes }, descriptors: {}, navigation: { emit() {}, navigate() {} } });
    Tabs.Screen = () => null;
    const mocks = {
      'expo-router': { Tabs },
      'expo-symbols': { SymbolView: () => null },
      'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: width > height ? 59 : 0, right: width > height ? 59 : 0 }) },
      'react-native': { ...Native, useWindowDimensions: () => ({ width, height, fontScale: 2, scale: 3 }),
        Pressable: props => { captured.push(props); return React.createElement(Native.Pressable, props); } }
    };
    const { loadScreen } = loadComponents(themes.monolith, true, mocks);
    const Layout = loadScreen('app/(tabs)/_layout.tsx').default;
    const markup = renderToStaticMarkup(React.createElement(Layout));
    assert.equal(captured.length, 5);
    assert.equal((markup.match(/role="tab"/g) ?? []).length, 5);
    assert.equal(captured.filter(tab => tab.accessibilityState?.selected).length, 1);
    for (const tab of captured) {
      const style = Native.StyleSheet.flatten(tab.style({ pressed: false }));
      assert.ok(style.minHeight >= 44);
      assert.ok(tab.accessibilityLabel);
    }
    const inset = width > height ? 59 : 18;
    const tabWidth = (Math.min(width - 2 * inset, 648) - 9) / 5;
    assert.ok(tabWidth >= 44);
    const well = React.Children.toArray(captured[0].children)[0];
    const wellStyle = Native.StyleSheet.flatten(well.props.style);
    assert.equal(wellStyle.borderRadius, wellStyle.height / 2);
  }
});

for (const pending of [true, false]) test(`Search Ask ${pending ? 'loading' : 'error'} retains query and feedback`, () => {
  let index = 0;
  const values = ['ask', 'A long remembered phrase', 'All', [], pending, null, pending ? null : 'Could not search. Try again.'];
  const mocks = {
    react: { ...React, useState(initial) { return React.useState(index < values.length ? values[index++] : initial); } },
    'expo-router': { router: { push() {} }, useLocalSearchParams: () => ({}) },
    'expo-symbols': { SymbolView: () => null },
    'react-native-safe-area-context': { SafeAreaView: Native.View },
    '@/src/context/AuthContext': { useAuth: () => ({ session: null }) },
    '@/src/context/ItemsContext': { useItems: () => ({ items: [] }) },
    '@/src/context/PlanContext': { usePlan: () => ({ hasAi: false }) },
    '@/src/recall/service': { answerFromRetrievedItems() {} },
    '@/src/search/semantic': { searchSemantically() {} },
    '@/src/search/retrieve': { retrieveLocalOneItems: () => [], retrieveOneItems() {} },
    '@/src/ui/openLink': { openMemoryLink() {} }
  };
  const { loadScreen } = loadComponents(themes.monolith, true, mocks, { width: 390, height: 844, scale: 3, fontScale: 2 });
  const Search = loadScreen('src/screens/SearchV5.tsx').default;
  const markup = renderToStaticMarkup(React.createElement(Search));
  assert.ok(markup.includes('A long remembered phrase'));
  assert.ok(markup.includes(pending ? 'Looking through your memory' : 'Could not search. Try again.'));
  assert.ok(markup.includes('aria-label="Switch to Search"'));
});
