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

// NEVER v1 — Light
// Platinum canvas, graphite typography and restrained chrome materials.
// accent/sky remain available for semantic AI and active states, but they are
// intentionally no longer the dominant visual language.
export const lightTheme: OneTheme = {
  background: '#F3F4F6',
  surface: '#F8F9FA',
  surfaceElevated: '#FFFFFF',
  fill: '#ECEEF1',
  fillStrong: '#D8DCE2',
  text: '#111317',
  textSecondary: '#5E6670',
  textTertiary: '#8D959F',
  border: '#D7DBE1',
  accent: '#73808D',
  accentSoft: '#E8EBEE',
  onAccent: '#FFFFFF',
  chrome: '#6B7581',
  chromeSoft: '#E6E9ED',
  platinum: '#AEB6C1',
  platinumSoft: '#F0F2F4',
  glass: '#FFFFFFD9',
  glassStrong: '#FFFFFFF2',
  glassBorder: '#FFFFFFF5',
  reflection: '#FFFFFF',
  shadow: '#20242A',
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

// NEVER v1 — Dark
// Graphite rather than pure black. Platinum/chrome carry the identity while
// color is reserved for semantic state and intelligence feedback.
export const darkTheme: OneTheme = {
  background: '#090A0C',
  surface: '#0E1013',
  surfaceElevated: '#14171B',
  fill: '#1A1E23',
  fillStrong: '#272C33',
  text: '#F7F8FA',
  textSecondary: '#BCC2CB',
  textTertiary: '#747E89',
  border: '#2C3239',
  accent: '#AEB6C1',
  accentSoft: '#20252B',
  onAccent: '#090A0C',
  chrome: '#DDE1E6',
  chromeSoft: '#1B2026',
  platinum: '#AEB6C1',
  platinumSoft: '#20252B',
  glass: '#14171BD9',
  glassStrong: '#1A1E23EE',
  glassBorder: '#FFFFFF17',
  reflection: '#FFFFFF1F',
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
