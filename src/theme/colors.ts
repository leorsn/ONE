export type OneTheme = {
  background: string;
  surface: string;
  surfaceElevated: string;
  fill: string;
  fillStrong: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  chrome: string;
  chromeSoft: string;
  platinum: string;
  platinumSoft: string;
  glass: string;
  glassStrong: string;
  glassBorder: string;
  reflection: string;
  shadow: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  sky: string;
  skySoft: string;
  plum: string;
  plumSoft: string;
};

// NEVER V5 — iOS-inspired light system palette.
// Platinum/chrome are restrained material accents; hierarchy comes from
// native-feeling grouped backgrounds, white surfaces and system typography.
export const lightTheme: OneTheme = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  fill: '#E9E9EE',
  fillStrong: '#D1D1D6',
  text: '#000000',
  textSecondary: '#636366',
  textTertiary: '#8E8E93',
  border: '#D1D1D6',
  accent: '#6E7681',
  accentSoft: '#ECEDEF',
  onAccent: '#FFFFFF',
  chrome: '#6E7681',
  chromeSoft: '#E5E5EA',
  platinum: '#AEAEB2',
  platinumSoft: '#F0F0F2',
  glass: '#FFFFFFD9',
  glassStrong: '#FFFFFFF2',
  glassBorder: '#FFFFFFF5',
  reflection: '#FFFFFF',
  shadow: '#000000',
  success: '#34C759',
  successSoft: '#E9F8ED',
  danger: '#FF3B30',
  dangerSoft: '#FDECEA',
  warning: '#C5892F',
  warningSoft: '#FBF3E6',
  sky: '#7C8793',
  skySoft: '#EEF0F2',
  plum: '#7F7F87',
  plumSoft: '#F0F0F2'
};

// NEVER V5 — iOS-inspired dark system palette.
// True black canvas, grouped graphite surfaces and neutral metallic accents.
export const darkTheme: OneTheme = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  fill: '#2C2C2E',
  fillStrong: '#3A3A3C',
  text: '#FFFFFF',
  textSecondary: '#C7C7CC',
  textTertiary: '#8E8E93',
  border: '#38383A',
  accent: '#D1D1D6',
  accentSoft: '#2C2C2E',
  onAccent: '#111113',
  chrome: '#D1D1D6',
  chromeSoft: '#2C2C2E',
  platinum: '#AEAEB2',
  platinumSoft: '#2C2C2E',
  glass: '#1C1C1ED9',
  glassStrong: '#1C1C1EF2',
  glassBorder: '#FFFFFF1A',
  reflection: '#FFFFFF1F',
  shadow: '#000000',
  success: '#30D158',
  successSoft: '#16351F',
  danger: '#FF453A',
  dangerSoft: '#3A1B1B',
  warning: '#D6A14D',
  warningSoft: '#352819',
  sky: '#D1D1D6',
  skySoft: '#2C2C2E',
  plum: '#AEAEB2',
  plumSoft: '#2C2C2E'
};