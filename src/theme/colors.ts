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

// NEVER light identity: brushed silver base, graphite structure,
// powder blue + dusty red signal accents. The palette intentionally avoids
// pure white so the product has a recognizable material character.
export const lightTheme: OneTheme = {
  background: '#E6E9ED',
  surface: '#ECEFF2',
  surfaceElevated: '#F3F5F7',
  fill: '#DCE1E6',
  fillStrong: '#C7CED6',
  text: '#171B21',
  textSecondary: '#59626C',
  textTertiary: '#858F9A',
  border: '#C7CED5',
  accent: '#536F8C',
  accentSoft: '#DCE7F0',
  onAccent: '#F7F9FA',
  chrome: '#3D4650',
  chromeSoft: '#D7DDE3',
  shadow: '#28323C',
  success: '#526A68',
  successSoft: '#DCE7E5',
  danger: '#B9636E',
  dangerSoft: '#F0DADC',
  warning: '#976858',
  warningSoft: '#EBDDD7',
  sky: '#719AB9',
  skySoft: '#DCEAF3',
  plum: '#B56F78',
  plumSoft: '#F0DEE1'
};

export const darkTheme: OneTheme = {
  background: '#171A1E',
  surface: '#1D2126',
  surfaceElevated: '#24292F',
  fill: '#2D333A',
  fillStrong: '#3A424B',
  text: '#F1F3F4',
  textSecondary: '#B2B8BF',
  textTertiary: '#7F8993',
  border: '#39414A',
  accent: '#93AEC6',
  accentSoft: '#2A3946',
  onAccent: '#151A1E',
  chrome: '#C0C7CE',
  chromeSoft: '#30363D',
  shadow: '#000000',
  success: '#8AA8A4',
  successSoft: '#293A38',
  danger: '#D99099',
  dangerSoft: '#452E32',
  warning: '#C4937E',
  warningSoft: '#42332D',
  sky: '#9ABDD7',
  skySoft: '#293A47',
  plum: '#D69AA2',
  plumSoft: '#432F33'
};
