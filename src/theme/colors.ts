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
  danger: string;
  warning: string;
};

export const lightTheme: OneTheme = {
  background: '#F1F3F5',
  surface: '#FAFBFC',
  surfaceElevated: '#FFFFFF',
  fill: '#ECEFF2',
  fillStrong: '#DDE1E5',
  text: '#101214',
  textSecondary: '#5D6268',
  textTertiary: '#8A9097',
  border: '#D8DDE2',
  accent: '#2A2E33',
  accentSoft: '#E5E8EB',
  onAccent: '#FFFFFF',
  chrome: '#6E747B',
  chromeSoft: '#EEF0F2',
  shadow: '#5D6268',
  success: '#267A56',
  danger: '#B93F4B',
  warning: '#9A6A24'
};

export const darkTheme: OneTheme = {
  background: '#080A0C',
  surface: '#111417',
  surfaceElevated: '#171B1F',
  fill: '#1B2025',
  fillStrong: '#262C32',
  text: '#F4F6F7',
  textSecondary: '#A7ADB4',
  textTertiary: '#717880',
  border: '#2A3036',
  accent: '#D9DDE1',
  accentSoft: '#252A2F',
  onAccent: '#0A0C0E',
  chrome: '#F2F4F5',
  chromeSoft: '#30363C',
  shadow: '#000000',
  success: '#55B98A',
  danger: '#FF737D',
  warning: '#D8A65D'
};
