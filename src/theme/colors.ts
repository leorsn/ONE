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
// Frosted silver canvas, native graphite text and a restrained iOS-blue signal.
export const lightTheme: OneTheme = {
  background: '#F5F5F7',
  surface: '#F9F9FB',
  surfaceElevated: '#FFFFFF',
  fill: '#ECECF1',
  fillStrong: '#DCDCE3',
  text: '#0C0C0D',
  textSecondary: '#62626A',
  textTertiary: '#96969D',
  border: '#D9D9E0',
  accent: '#0A84FF',
  accentSoft: '#E7F2FF',
  onAccent: '#FFFFFF',
  chrome: '#30323A',
  chromeSoft: '#E8E9ED',
  shadow: '#1C1C1E',
  success: '#30A46C',
  successSoft: '#E7F6EE',
  danger: '#D05D69',
  dangerSoft: '#FBECEF',
  warning: '#C68A35',
  warningSoft: '#FBF2E4',
  sky: '#0A84FF',
  skySoft: '#E7F2FF',
  plum: '#8B5FBF',
  plumSoft: '#F2EAF9'
};

// NEVER CORE — dark
// True black canvas with elevated glass-like graphite materials and native blue highlights.
export const darkTheme: OneTheme = {
  background: '#000000',
  surface: '#141416',
  surfaceElevated: '#1C1C1E',
  fill: '#262629',
  fillStrong: '#343438',
  text: '#F7F7F8',
  textSecondary: '#B0B0B7',
  textTertiary: '#7C7C84',
  border: '#303034',
  accent: '#0A84FF',
  accentSoft: '#10253B',
  onAccent: '#FFFFFF',
  chrome: '#D8D8DE',
  chromeSoft: '#242428',
  shadow: '#000000',
  success: '#64D2A1',
  successSoft: '#173127',
  danger: '#FF7B86',
  dangerSoft: '#3A1E23',
  warning: '#E8A552',
  warningSoft: '#382A1C',
  sky: '#64B5FF',
  skySoft: '#11283D',
  plum: '#C09AE8',
  plumSoft: '#2B2037'
};
