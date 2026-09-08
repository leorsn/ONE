export type OneTheme = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentSoft: string;
};

export const lightTheme: OneTheme = {
  background: '#F7F7F8',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#111318',
  textSecondary: '#747981',
  border: '#E7E8EB',
  accent: '#1677FF',
  accentSoft: '#EAF3FF',
};

export const darkTheme: OneTheme = {
  background: '#0D0E10',
  surface: '#16181B',
  surfaceElevated: '#1D1F23',
  text: '#F5F6F7',
  textSecondary: '#979CA5',
  border: '#2A2D32',
  accent: '#2F8CFF',
  accentSoft: '#122A47',
};
