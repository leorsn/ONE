import { Platform } from 'react-native';

// NEVER keeps platform-native typography as the implementation baseline.
// The visual identity comes from hierarchy, spacing, material and restraint
// rather than a decorative display face.
export const editorialFontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'system-ui'
});

export const uiFontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'system-ui'
});

export const neverType = {
  hero: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '700' as const,
    letterSpacing: -1.7
  },
  display: {
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '700' as const,
    letterSpacing: -1.15
  },
  title: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '650' as const,
    letterSpacing: -0.65
  },
  section: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.3
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.08
  },
  bodyStrong: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.1
  },
  caption: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500' as const,
    letterSpacing: 0.02
  },
  eyebrow: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.75
  }
};

export const neverSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
  hero: 40
} as const;

export const neverRadius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  sheet: 28,
  pill: 999
} as const;
