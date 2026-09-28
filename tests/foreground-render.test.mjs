import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRequire } from 'node:module';
import { themes } from '../src/theme/editions.ts';
import { loadComponents } from './helpers/render-ui.mjs';
const require = createRequire(import.meta.url);
const { View } = require('react-native-web');

// Actual foreground components with provider/native boundaries replaced. These
// smoke tests verify available controls/content, not native pixel layout.
for (const theme of Object.values(themes)) for (const populated of [false, true]) {
  test(`${theme.name}: Home and Search retain entry points with ${populated ? 'memories' : 'empty storage'}`, () => {
    const items = populated ? [{ id: 'memory-1', title: 'Design meeting notes', type: 'note', kind: 'note', category: 'Work', summary: 'Review the sketch', sourceType: 'manual', tags: [], completed: false, createdAt: '2026-09-28T10:00:00Z', updatedAt: '2026-09-28T10:00:00Z', inboxState: 'processed' }] : [];
    const mocks = {
      'expo-router': { router: { push() {} }, useLocalSearchParams: () => ({}) },
      'expo-symbols': { SymbolView: () => null },
      'react-native-safe-area-context': { SafeAreaView: View },
      '@/src/context/AuthContext': { useAuth: () => ({ session: null }) },
      '@/src/context/ItemsContext': { useItems: () => ({ items, add: async () => {}, update: async () => {} }) },
      '@/src/context/PlanContext': { usePlan: () => ({ hasAi: false }) },
      '@/src/capture/buildItem': { buildItemFromCapture() {} },
      '@/src/capture/CaptureReviewEditor': { CaptureReviewEditor: () => null },
      '@/src/notifications/status': { notificationSaveWarning: () => null },
      '@/src/recall/service': { answerFromRetrievedItems() {} },
      '@/src/search/semantic': { searchSemantically() {} },
      '@/src/search/retrieve': { retrieveLocalOneItems: () => items.map(item => ({ item, reasons: [] })), retrieveOneItems() {} },
      '@/src/ui/openLink': { openMemoryLink() {} }
    };
    const { loadScreen } = loadComponents(theme, !populated, mocks, { width: populated ? 430 : 320, height: 852, scale: 3, fontScale: populated ? 1 : 1.5 });
    const Home = loadScreen('src/screens/HomeV5.tsx').default;
    const Search = loadScreen('src/screens/SearchV5.tsx').default;
    const home = renderToStaticMarkup(React.createElement(Home));
    const search = renderToStaticMarkup(React.createElement(Search));
    for (const control of ['Quick capture', 'Scan', 'Link', 'Note', 'Share', 'Ask NEVER', 'Open your settings']) assert.ok(home.includes(`aria-label="${control}"`), control);
    assert.ok(search.includes('aria-label="Search your memory…"'));
    assert.ok(search.includes('aria-label="Switch to Ask NEVER"'));
    for (const category of ['All', 'Documents', 'Links', 'Ideas']) assert.ok(search.includes(`>${category}</`));
    assert.ok(search.indexOf('aria-label="Search your memory…"') < search.indexOf('>Documents</'));
    if (populated) for (const markup of [home, search]) assert.ok(markup.includes('Design meeting notes'));
    else { assert.ok(home.includes('Your memory starts here.')); assert.ok(search.includes('Your memory is ready')); }
    for (const markup of [home, search]) assert.doesNotMatch(markup, /NaN|undefinedpx/);
  });
}
