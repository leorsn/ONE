import type { NeverSpatialWorldId } from './worldManifest';

/** Canonical NEVER designs. Pass 3 improves these six; it does not create new themes. */
export type NeverPass3DesignId =
  | 'basic'
  | 'monolith'
  | 'aurora'
  | 'archive'
  | 'orbit'
  | 'tactile';

export type NeverPass3DesignProfile = {
  id: NeverPass3DesignId;
  label: string;
  description: string;
  home: NeverSpatialWorldId;
  saved: NeverSpatialWorldId;
  search: NeverSpatialWorldId;
  calendar: NeverSpatialWorldId;
  settings: NeverSpatialWorldId;
  chrome: 'silver' | 'graphite' | 'neutral' | 'warm';
  density: 'airy' | 'balanced' | 'compact';
};

/**
 * Pass 3 keeps the original six NEVER design families intact.
 * Spatial-world IDs are internal presentation assets/variants, never additional
 * user-facing themes. For example Deep Space belongs to Orbit and Warm Earth to Tactile.
 */
export const NEVER_PASS3_DESIGNS: Record<NeverPass3DesignId, NeverPass3DesignProfile> = {
  basic: {
    id: 'basic',
    label: 'Basic',
    description: 'Classic minimal NEVER in system-aware black and white.',
    home: 'classicWhite',
    saved: 'classicWhite',
    search: 'classicWhite',
    calendar: 'classicWhite',
    settings: 'classicWhite',
    chrome: 'neutral',
    density: 'balanced',
  },
  monolith: {
    id: 'monolith',
    label: 'Monolith',
    description: 'Architectural graphite, dark metal and restrained chrome.',
    home: 'settings',
    saved: 'settings',
    search: 'settings',
    calendar: 'settings',
    settings: 'settings',
    chrome: 'graphite',
    density: 'compact',
  },
  aurora: {
    id: 'aurora',
    label: 'Aurora',
    description: 'Bright flowing pearl, liquid light and subtle iridescence.',
    home: 'home',
    saved: 'abstract',
    search: 'search',
    calendar: 'calendar',
    settings: 'abstract',
    chrome: 'silver',
    density: 'airy',
  },
  archive: {
    id: 'archive',
    label: 'Archive',
    description: 'Mineral stone, editorial structure and cool archival depth.',
    home: 'saved',
    saved: 'saved',
    search: 'search',
    calendar: 'saved',
    settings: 'settings',
    chrome: 'graphite',
    density: 'compact',
  },
  orbit: {
    id: 'orbit',
    label: 'Orbit',
    description: 'Deep-space darkness, orbital light and cool metallic accents.',
    home: 'night',
    saved: 'night',
    search: 'night',
    calendar: 'night',
    settings: 'classicBlack',
    chrome: 'silver',
    density: 'balanced',
  },
  tactile: {
    id: 'tactile',
    label: 'Tactile',
    description: 'Warm earth, natural material and softly physical surfaces.',
    home: 'nature',
    saved: 'nature',
    search: 'nature',
    calendar: 'nature',
    settings: 'nature',
    chrome: 'warm',
    density: 'airy',
  },
};

export function resolvePass3World(
  design: NeverPass3DesignId,
  screen: 'home' | 'saved' | 'search' | 'calendar' | 'settings',
): NeverSpatialWorldId {
  return NEVER_PASS3_DESIGNS[design][screen];
}
