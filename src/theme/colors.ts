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
// Aluminium paper, graphite structure and restrained signal colors.
export const lightTheme: OneTheme = {
  background: '#EEF0F2',
  surface: '#F7F8F9',
  surfaceElevated: '#FCFCFC',
  fill: '#E7EAED',
  fillStrong: '#D7DBDF',
  text: '#111418',
  textSecondary: '#646B73',
  textTertiary: '#9299A1',
  border: '#D2D6DA',
  accent: '#343B43',
  accentSoft: '#E1E5E8',
  onAccent: '#FFFFFF',
  chrome: '#343B43',
  chromeSoft: '#E2E5E8',
  shadow: '#1B2026',
  success: '#526F66',
  successSoft: '#E1EAE6',
  danger: '#BE7077',
  dangerSoft: '#F2E0E2',
  warning: '#A97955',
  warningSoft: '#F1E7DE',
  sky: '#7197B4',
  skySoft: '#E0EBF2',
  plum: '#8C788F',
  plumSoft: '#ECE7ED'
};

// NEVER CORE / MONOLITH — dark
// Smoked graphite with the same structure and muted signal accents.
export const darkTheme: OneTheme = {
  background: '#090B0D',
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
