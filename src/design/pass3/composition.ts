export const NEVER_PASS3_COMPOSITION = {
  minimumTarget: 44,
  contentMaxWidth: 720,
  hero: {
    greetingMaxWidth: 620,
    sectionGap: 28,
    utilityGap: 8,
  },
  rows: {
    minimumHeight: 56,
    verticalPadding: 12,
    metadataGap: 4,
    separatorInset: 16,
  },
  command: {
    minimumHeight: 56,
    horizontalPadding: 18,
  },
  capture: {
    minimumHeight: 44,
    actionGap: 8,
  },
  motion: {
    translateY: 8,
    durationMs: 260,
    staggerMs: 55,
  },
} as const;

export type NeverPass3SurfaceRole =
  | 'content'
  | 'interactive'
  | 'navigation'
  | 'modal';

/**
 * Pass 3 intentionally reduces material usage. This helper gives screens one semantic
 * place to decide whether a boundary should render as glass/material or remain content.
 */
export function shouldRenderMaterial(role: NeverPass3SurfaceRole): boolean {
  return role !== 'content';
}

export const NEVER_PASS3_PRIMARY_NAV = [
  'home',
  'saved',
  'capture',
  'calendar',
  'search',
] as const;

export type NeverPass3PrimaryNavId = (typeof NEVER_PASS3_PRIMARY_NAV)[number];
