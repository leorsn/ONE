import type { NeverSpatialWorldId } from './worldManifest';

export type NeverPass3DesignId =
  | 'platinum'
  | 'archive'
  | 'classicBlack'
  | 'classicWhite'
  | 'night'
  | 'nature'
  | 'city'
  | 'abstract';

export type NeverPass3DesignProfile = {
  id: NeverPass3DesignId;
  label: string;
  home: NeverSpatialWorldId;
  saved: NeverSpatialWorldId;
  search: NeverSpatialWorldId;
  calendar: NeverSpatialWorldId;
  settings: NeverSpatialWorldId;
  chrome: 'silver' | 'graphite' | 'white' | 'warm' | 'reflective';
  density: 'airy' | 'balanced' | 'compact';
};

/**
 * App-wide design families. A selected family changes the whole visual language;
 * screens still keep their functional identity. This prevents Pass 3 from hardcoding
 * one background per route and preserves NEVER's multiple-design promise.
 */
export const NEVER_PASS3_DESIGNS: Record<NeverPass3DesignId, NeverPass3DesignProfile> = {
  platinum: { id: 'platinum', label: 'Platinum', home: 'home', saved: 'saved', search: 'search', calendar: 'calendar', settings: 'settings', chrome: 'silver', density: 'airy' },
  archive: { id: 'archive', label: 'Archive', home: 'saved', saved: 'saved', search: 'settings', calendar: 'night', settings: 'settings', chrome: 'graphite', density: 'compact' },
  classicBlack: { id: 'classicBlack', label: 'Classic Black', home: 'classicBlack', saved: 'classicBlack', search: 'classicBlack', calendar: 'classicBlack', settings: 'classicBlack', chrome: 'white', density: 'balanced' },
  classicWhite: { id: 'classicWhite', label: 'Classic White', home: 'classicWhite', saved: 'classicWhite', search: 'classicWhite', calendar: 'classicWhite', settings: 'classicWhite', chrome: 'graphite', density: 'balanced' },
  night: { id: 'night', label: 'Night', home: 'night', saved: 'night', search: 'night', calendar: 'night', settings: 'classicBlack', chrome: 'silver', density: 'balanced' },
  nature: { id: 'nature', label: 'Nature', home: 'nature', saved: 'nature', search: 'nature', calendar: 'nature', settings: 'nature', chrome: 'warm', density: 'airy' },
  city: { id: 'city', label: 'City', home: 'city', saved: 'city', search: 'city', calendar: 'city', settings: 'settings', chrome: 'reflective', density: 'compact' },
  abstract: { id: 'abstract', label: 'Abstract', home: 'abstract', saved: 'abstract', search: 'abstract', calendar: 'abstract', settings: 'abstract', chrome: 'silver', density: 'airy' },
};

export function resolvePass3World(design: NeverPass3DesignId, screen: 'home' | 'saved' | 'search' | 'calendar' | 'settings'): NeverSpatialWorldId {
  return NEVER_PASS3_DESIGNS[design][screen];
}
