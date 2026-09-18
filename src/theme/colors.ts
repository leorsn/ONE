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

// NEVER CORE — light
// Apple-like grouped canvas with soft white material, graphite structure and restrained NEVER signals.
export const lightTheme: OneTheme = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  fill: '#E9E9EE',
  fillStrong: '#D8D8DE',
  text: '#111114',
  textSecondary: '#606068',
  textTertiary: '#8E8E93',
  border: '#D9D9DE',
  accent: '#2F3338',
  accentSoft: '#E7E8EB',
  onAccent: '#FFFFFF',
  chrome: '#353A40',
  chromeSoft: '#E8E9EC',
  shadow: '#15171A',
  success: '#4F7B69',
  successSoft: '#E4EFEA',
  danger: '#C26F79',
  dangerSoft: '#F5E4E7',
  warning: '#AD7A4E',
  warningSoft: '#F4E9DE',
  sky: '#6E94AE',
  skySoft: '#E3EDF4',
  plum: '#8A7890',
  plumSoft: '#EFE9F1'
};

// NEVER CORE — dark
// True black canvas with elevated system-like graphite materials and the same restrained NEVER signal palette.
export const darkTheme: OneTheme = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#242426',
  fill: '#2C2C2E',
  fillStrong: '#3A3A3C',
  text: '#F5F5F7',
  textSecondary: '#AEAEB2',
  textTertiary: '#7C7C80',
  border: '#38383A',
  accent: '#D0D2D5',
  accentSoft: '#2A2B2E',
  onAccent: '#141416',
  chrome: '#D0D2D5',
  chromeSoft: '#29292C',
  shadow: '#000000',
  success: '#83A797',
  successSoft: '#203029',
  danger: '#D17A83',
  dangerSoft: '#382226',
  warning: '#C89B74',
  warningSoft: '#352A22',
  sky: '#82A8C1',
  skySoft: '#1F303B',
  plum: '#B29FB5',
  plumSoft: '#302A31'
};
