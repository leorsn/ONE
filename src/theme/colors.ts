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

// NEVER CORE / MONOLITH — light
// Soft aluminium, quiet paper surfaces and graphite structure.
export const lightTheme: OneTheme = {
  background: '#F2F4F5',
  surface: '#FAFBFC',
  surfaceElevated: '#FFFFFF',
  fill: '#E8EBED',
  fillStrong: '#D8DDE1',
  text: '#111418',
  textSecondary: '#626A72',
  textTertiary: '#929AA2',
  border: '#D5DADF',
  accent: '#343B43',
  accentSoft: '#E3E7EA',
  onAccent: '#FFFFFF',
  chrome: '#343B43',
  chromeSoft: '#E4E8EB',
  shadow: '#1A2026',
  success: '#526F66',
  successSoft: '#E3EBE7',
  danger: '#BE7077',
  dangerSoft: '#F3E2E4',
  warning: '#A97955',
  warningSoft: '#F1E8E0',
  sky: '#7197B4',
  skySoft: '#E2ECF3',
  plum: '#8C788F',
  plumSoft: '#EEE9EF'
};

// NEVER CORE / MONOLITH — dark
// Smoked graphite with the same quiet hierarchy and muted signal accents.
export const darkTheme: OneTheme = {
  background: '#080A0C',
  surface: '#101316',
  surfaceElevated: '#171B1F',
  fill: '#20252A',
  fillStrong: '#2A3036',
  text: '#F3F4F4',
  textSecondary: '#A4ABB2',
  textTertiary: '#707982',
  border: '#2A3036',
  accent: '#B7BEC5',
  accentSoft: '#242A30',
  onAccent: '#101316',
  chrome: '#B7BEC5',
  chromeSoft: '#20252A',
  shadow: '#000000',
  success: '#7E9A90',
  successSoft: '#1C2925',
  danger: '#BF737A',
  dangerSoft: '#301D20',
  warning: '#C0916F',
  warningSoft: '#2D241E',
  sky: '#759DBA',
  skySoft: '#172731',
  plum: '#A695A7',
  plumSoft: '#29232A'
};
