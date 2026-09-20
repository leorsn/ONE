import { Platform } from 'react-native';

// NEVER keeps platform-native typography as the implementation baseline.
// Brand character comes from precise hierarchy, spacing and material rather
// than a decorative display face.
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
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -1.25
  },
  display: {
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -1.0
  },
  title: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.58
  },
  section: {
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.28
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
    fontSize: 10.75,
    lineHeight: 15,
    fontWeight: '500' as const,
    letterSpacing: 0.02
  },
  eyebrow: {
    fontSize: 8.75,
    lineHeight: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.6
  }
};

export const neverSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 30,
  hero: 38
} as const;

export const neverRadius = {
  sm: 11,
  md: 15,
  lg: 19,
  xl: 25,
  sheet: 30,
  pill: 999
} as const;
