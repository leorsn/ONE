export type NeverSpatialWorldId =
  | 'home'
  | 'ask'
  | 'saved'
  | 'calendar'
  | 'search'
  | 'settings'
  | 'classicBlack'
  | 'classicWhite'
  | 'night'
  | 'nature'
  | 'city'
  | 'abstract';

export type NeverSpatialWorldAsset = {
  id: NeverSpatialWorldId;
  label: string;
  description: string;
  /** Existing Material World to use when no optional raster asset is installed. */
  fallbackWorld: 'platinum' | 'aurora' | 'archive' | 'orbit' | 'tactile' | 'monolith';
  /** Future optional asset path. Kept declarative so missing imagery never breaks runtime. */
  assetKey: string;
  atmosphere: 'light' | 'balanced' | 'dark';
};

/**
 * Pass 3 presentation manifest.
 *
 * This deliberately does not `require()` raster files. The current GitHub branch does
 * not yet contain the approved UHD exports, and runtime must remain valid without them.
 * A native asset resolver can map `assetKey` to bundled images once each export has
 * been individually validated.
 */
export const NEVER_SPATIAL_WORLDS: Record<NeverSpatialWorldId, NeverSpatialWorldAsset> = {
  home: {
    id: 'home',
    label: 'Platinum Mountain',
    description: 'Open platinum landscape for Home.',
    fallbackWorld: 'platinum',
    assetKey: 'home-platinum',
    atmosphere: 'light',
  },
  ask: {
    id: 'ask',
    label: 'Liquid Chrome',
    description: 'Reflective liquid-metal atmosphere for Ask NEVER.',
    fallbackWorld: 'aurora',
    assetKey: 'ask-liquid-chrome',
    atmosphere: 'light',
  },
  saved: {
    id: 'saved',
    label: 'Stone Archive',
    description: 'Cool mineral structure for Saved and Archive.',
    fallbackWorld: 'archive',
    assetKey: 'saved-stone-archive',
    atmosphere: 'dark',
  },
  calendar: {
    id: 'calendar',
    label: 'Light Flow',
    description: 'Restrained luminous flow for Calendar.',
    fallbackWorld: 'orbit',
    assetKey: 'calendar-light-flow',
    atmosphere: 'balanced',
  },
  search: {
    id: 'search',
    label: 'Fog Depth',
    description: 'Layered mist and depth for Search.',
    fallbackWorld: 'archive',
    assetKey: 'search-fog-depth',
    atmosphere: 'dark',
  },
  settings: {
    id: 'settings',
    label: 'Graphite Minimal',
    description: 'Quiet graphite geometry for Settings.',
    fallbackWorld: 'monolith',
    assetKey: 'settings-graphite',
    atmosphere: 'dark',
  },
  classicBlack: {
    id: 'classicBlack',
    label: 'Classic Black',
    description: 'Near-black minimal NEVER presentation.',
    fallbackWorld: 'monolith',
    assetKey: 'classic-black',
    atmosphere: 'dark',
  },
  classicWhite: {
    id: 'classicWhite',
    label: 'Classic White',
    description: 'Clean white minimal NEVER presentation.',
    fallbackWorld: 'platinum',
    assetKey: 'classic-white',
    atmosphere: 'light',
  },
  night: {
    id: 'night',
    label: 'Deep Space',
    description: 'Deep-space dark presentation.',
    fallbackWorld: 'orbit',
    assetKey: 'night-deep-space',
    atmosphere: 'dark',
  },
  nature: {
    id: 'nature',
    label: 'Warm Earth',
    description: 'Warm natural stone and earth presentation.',
    fallbackWorld: 'tactile',
    assetKey: 'nature-warm-earth',
    atmosphere: 'balanced',
  },
  city: {
    id: 'city',
    label: 'Urban Reflections',
    description: 'Architectural reflective presentation.',
    fallbackWorld: 'monolith',
    assetKey: 'city-reflections',
    atmosphere: 'dark',
  },
  abstract: {
    id: 'abstract',
    label: 'Ethereal',
    description: 'Soft abstract translucent presentation.',
    fallbackWorld: 'aurora',
    assetKey: 'abstract-ethereal',
    atmosphere: 'light',
  },
};

export const NEVER_PRIMARY_SCREEN_WORLDS = {
  home: NEVER_SPATIAL_WORLDS.home,
  ask: NEVER_SPATIAL_WORLDS.ask,
  saved: NEVER_SPATIAL_WORLDS.saved,
  calendar: NEVER_SPATIAL_WORLDS.calendar,
  search: NEVER_SPATIAL_WORLDS.search,
  settings: NEVER_SPATIAL_WORLDS.settings,
} as const;
