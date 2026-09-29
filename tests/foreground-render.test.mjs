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
const cases = [
  { width: 320, height: 568, count: 0, fontScale: 2 },
  { width: 375, height: 812, count: 1, fontScale: 1 },
  { width: 390, height: 844, count: 0, fontScale: 1 },
  { width: 390, height: 844, count: 1, fontScale: 2 },
  { width: 428, height: 926, count: 30, fontScale: 1 },
  { width: 430, height: 932, count: 30, fontScale: 2 }
];
for (const theme of Object.values(themes)) for (const viewport of cases) {
  const populated = viewport.count > 0;
  test(`${theme.name}: Home/Search/Calendar at ${viewport.width} with ${viewport.count} memories and font scale ${viewport.fontScale}`, () => {
    const title = viewport.count > 1 ? 'Design meeting notes — a long memory title with people, places and follow-up decisions '.repeat(3) : 'Design meeting notes';
    const items = Array.from({ length: viewport.count }, (_, index) => ({ id: `memory-${index}`, title, date: '2026-09-29', time: '14:30', type: 'note', kind: 'note', category: 'Work', summary: 'Review the sketch and supporting details. '.repeat(12), sourceType: 'manual', tags: [], completed: false, createdAt: '2026-09-29T10:00:00Z', updatedAt: '2026-09-29T10:00:00Z', inboxState: 'processed' }));
    const mocks = {
      '@/src/ui/useLocalDay': { useLocalDay: () => '2026-09-29' },
      'expo-router': { router: { push() {} }, useLocalSearchParams: () => ({ q: viewport.count > 1 ? 'Design' : '' }) },
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
      '@/src/search/retrieve': { retrieveLocalOneItems: (_query, filtered, options) => filtered.slice(0, options.limit).map(item => ({ item, reasons: [] })), retrieveOneItems() {} },
      '@/src/ui/openLink': { openMemoryLink() {} }
    };
    const { loadScreen } = loadComponents(theme, !populated, mocks, { ...viewport, scale: 3 });
    const Calendar = loadScreen('src/screens/CalendarV5.tsx').default;
    const calendar = renderToStaticMarkup(React.createElement(Calendar));
    for (const label of ['Previous month', 'Next month']) assert.ok(calendar.includes(`aria-label="${label}"`));
    for (const mode of ['Day', 'Week', 'Month']) assert.ok(calendar.includes(`>${mode}</`));
    const Home = loadScreen('src/screens/HomeV5.tsx').default;
    const Search = loadScreen('src/screens/SearchV5.tsx').default;
    const home = renderToStaticMarkup(React.createElement(Home));
    const search = renderToStaticMarkup(React.createElement(Search));
    for (const control of ['Quick capture', 'Scan', 'Link', 'Share', 'Ask NEVER', 'Open your settings']) assert.ok(home.includes(`aria-label="${control}"`), control);
    assert.ok(home.includes('YOUR MEMORY'));
    assert.ok(home.includes('Everything worth remembering, ready when you need it.'));
    assert.ok(home.includes('RECALL WITH NEVER'));
    assert.ok(home.includes('Ask anything you’ve saved.'));
    assert.ok(home.indexOf('RECALL WITH NEVER') < home.indexOf('aria-label="Quick capture"'));
    assert.ok(home.includes('placeholder="Capture something…"'));
    assert.ok(search.includes('aria-label="Search your memory…"'));
    assert.ok(search.includes('aria-label="Switch to Ask NEVER"'));
    for (const category of ['All', 'Documents', 'Links', 'Ideas']) assert.ok(search.includes(`>${category}</`));
    assert.ok(search.indexOf('aria-label="Search your memory…"') < search.indexOf('>Documents</'));
    if (populated) for (const markup of [home, search, calendar]) assert.ok(markup.includes('Design meeting notes'));
    else { assert.ok(home.includes('Your memory starts here.')); assert.ok(search.includes('Your memory is ready')); }
    for (const markup of [home, search, calendar]) assert.doesNotMatch(markup, /NaN|undefinedpx/);
  });
}
