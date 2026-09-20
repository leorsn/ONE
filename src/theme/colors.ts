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

// NEVER — Light platinum V2
// A visibly metallic canvas: colder silver background, white glass surfaces and
// graphite typography. Chrome, not blue, is the primary visual signature.
export const lightTheme: OneTheme = {
  background: '#E8EBEF',
  surface: '#F1F3F5',
  surfaceElevated: '#FBFCFD',
  fill: '#DDE2E7',
  fillStrong: '#C9D0D7',
  text: '#0D1014',
  textSecondary: '#56606A',
  textTertiary: '#87919B',
  border: '#C9D0D7',
  accent: '#66717D',
  accentSoft: '#E0E5E9',
  onAccent: '#FFFFFF',
  chrome: '#5F6B77',
  chromeSoft: '#D9DFE4',
  platinum: '#AAB4BE',
  platinumSoft: '#E1E6EA',
  glass: '#F8FAFBD8',
  glassStrong: '#FFFFFFEF',
  glassBorder: '#FFFFFFF6',
  reflection: '#FFFFFFFC',
  shadow: '#151A20',
  success: '#3BAE76',
  successSoft: '#E8F6EE',
  danger: '#D65F68',
  dangerSoft: '#FAEAEC',
  warning: '#B88442',
  warningSoft: '#F8F0E5',
  sky: '#7D8995',
  skySoft: '#E2E7EB',
  plum: '#737C86',
  plumSoft: '#E5E8EB'
};

// NEVER — Dark graphite V2
// Near-black graphite with smoked metal surfaces and brighter platinum edges.
export const darkTheme: OneTheme = {
  background: '#07090B',
  surface: '#0E1216',
  surfaceElevated: '#151A1F',
  fill: '#1A2026',
  fillStrong: '#283039',
  text: '#F5F7F9',
  textSecondary: '#BAC2CA',
  textTertiary: '#74808B',
  border: '#2C343C',
  accent: '#B7C0C9',
  accentSoft: '#20272E',
  onAccent: '#07090B',
  chrome: '#E4E8EC',
  chromeSoft: '#1A2128',
  platinum: '#BEC5CC',
  platinumSoft: '#222A31',
  glass: '#12171BE5',
  glassStrong: '#1A2026F2',
  glassBorder: '#FFFFFF22',
  reflection: '#FFFFFF2E',
  shadow: '#000000',
  success: '#55C78A',
  successSoft: '#142A20',
  danger: '#FF6B6B',
  dangerSoft: '#351B1C',
  warning: '#D8A45C',
  warningSoft: '#332719',
  sky: '#B8C1CA',
  skySoft: '#20272E',
  plum: '#9EA7B0',
  plumSoft: '#22282E'
};
