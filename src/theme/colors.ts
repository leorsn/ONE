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

// NEVER — Light platinum
// Cool metal canvas with soft ceramic whites and restrained chrome contrast.
// The interface should read as premium utility, not as a conventional AI app.
export const lightTheme: OneTheme = {
  background: '#EFF1F3',
  surface: '#F5F6F7',
  surfaceElevated: '#FBFCFC',
  fill: '#E5E8EB',
  fillStrong: '#D3D8DD',
  text: '#101215',
  textSecondary: '#59616A',
  textTertiary: '#8A929B',
  border: '#D2D7DC',
  accent: '#77818C',
  accentSoft: '#E5E9EC',
  onAccent: '#FFFFFF',
  chrome: '#65707B',
  chromeSoft: '#DFE4E8',
  platinum: '#B5BDC5',
  platinumSoft: '#E7EAED',
  glass: '#F8FAFBC9',
  glassStrong: '#FFFFFFE4',
  glassBorder: '#FFFFFFE8',
  reflection: '#FFFFFFF2',
  shadow: '#1B2026',
  success: '#3BAE76',
  successSoft: '#E8F6EE',
  danger: '#D65F68',
  dangerSoft: '#FAEAEC',
  warning: '#B88442',
  warningSoft: '#F8F0E5',
  sky: '#6AAFE8',
  skySoft: '#EAF4FC',
  plum: '#8A8393',
  plumSoft: '#F0EDF2'
};

// NEVER — Dark graphite
// Not pure black: graphite, smoked glass and cool metal highlights keep depth
// visible while preserving the same material language as the light theme.
export const darkTheme: OneTheme = {
  background: '#0B0D0F',
  surface: '#111417',
  surfaceElevated: '#171B1F',
  fill: '#1D2227',
  fillStrong: '#2A3036',
  text: '#F5F7F8',
  textSecondary: '#BDC3CA',
  textTertiary: '#77818B',
  border: '#30363D',
  accent: '#B3BAC2',
  accentSoft: '#22282E',
  onAccent: '#0B0D0F',
  chrome: '#E0E4E8',
  chromeSoft: '#1E242A',
  platinum: '#B9C0C7',
  platinumSoft: '#242A30',
  glass: '#15191DD6',
  glassStrong: '#1C2126ED',
  glassBorder: '#FFFFFF1C',
  reflection: '#FFFFFF25',
  shadow: '#000000',
  success: '#55C78A',
  successSoft: '#142A20',
  danger: '#FF6B6B',
  dangerSoft: '#351B1C',
  warning: '#D8A45C',
  warningSoft: '#332719',
  sky: '#8CC8FF',
  skySoft: '#14283A',
  plum: '#A59CAC',
  plumSoft: '#28242C'
};
