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
  success: string;
  danger: string;
  warning: string;
};

export const lightTheme: OneTheme = {
  background: '#F5F6F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  fill: '#F0F1F4',
  fillStrong: '#E6E8EC',
  text: '#111318',
  textSecondary: '#6F7580',
  textTertiary: '#9AA0AA',
  border: '#E7E9ED',
  accent: '#0A7AFF',
  accentSoft: '#EAF3FF',
  success: '#198754',
  danger: '#D9424E',
  warning: '#C87A12'
};

export const darkTheme: OneTheme = {
  background: '#0B0C0E',
  surface: '#15171A',
  surfaceElevated: '#1B1D21',
  fill: '#202328',
  fillStrong: '#292D33',
  text: '#F7F8FA',
  textSecondary: '#A1A6AF',
  textTertiary: '#737983',
  border: '#292C31',
  accent: '#3A91FF',
  accentSoft: '#132C4B',
  success: '#44B982',
  danger: '#FF6773',
  warning: '#E6A64D'
};
