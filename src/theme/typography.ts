import { Platform } from 'react-native';

// NEVER V5 uses platform-native typography. The product identity now comes
// from hierarchy, grouped layout, spacing and restrained platinum material.
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
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '700' as const,
    letterSpacing: -1.05
  },
  display: {
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '700' as const,
    letterSpacing: -0.9
  },
  title: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '600' as const,
    letterSpacing: -0.45
  },
  section: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '600' as const,
    letterSpacing: -0.2
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.05
  },
  bodyStrong: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600' as const,
    letterSpacing: -0.08
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600' as const,
    letterSpacing: 1.2
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
  xl: 20,
  sheet: 28,
  pill: 999
} as const;
