import type { NeverSpatialWorldId } from './worldManifest';

export type NeverPass3ScreenContract = {
  world: NeverSpatialWorldId;
  eyebrow: string;
  title: string;
  body: string;
  primaryMaterial: 'search' | 'calendar' | 'command';
  contentStyle: 'rows' | 'agenda' | 'results';
};

export const NEVER_PASS3_SCREEN_CONTRACTS = {
  saved: {
    world: 'saved',
    eyebrow: 'Library',
    title: 'Saved',
    body: 'Everything worth keeping, without the file-manager feeling.',
    primaryMaterial: 'search',
    contentStyle: 'rows',
  },
  search: {
    world: 'search',
    eyebrow: 'Recall',
    title: 'Search',
    body: 'Find what you saved by meaning, detail or context.',
    primaryMaterial: 'search',
    contentStyle: 'results',
  },
  calendar: {
    world: 'calendar',
    eyebrow: 'Time',
    title: 'Calendar',
    body: 'Dates and plans surfaced from your memory.',
    primaryMaterial: 'calendar',
    contentStyle: 'agenda',
  },
} as const satisfies Record<string, NeverPass3ScreenContract>;
