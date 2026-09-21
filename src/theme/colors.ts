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

// Canonical NEVER materials. All compatibility palettes derive from these tokens.
export const lightTheme: OneTheme = {
  background: '#E9EDF0', surface: '#F5F7F8', surfaceElevated: '#FCFDFD',
  fill: '#E2E7EB', fillStrong: '#CAD2D9',
  text: '#222930', textSecondary: '#59636E', textTertiary: '#606A74',
  border: '#CDD5DC', accent: '#414D59', accentSoft: '#E1E7EC', onAccent: '#FAFCFD',
  chrome: '#52616F', chromeSoft: '#E0E6EB', platinum: '#7B8995', platinumSoft: '#EDF1F4',
  glass: '#F8FBFCCC', glassStrong: '#F5F8FAF2', glassBorder: '#FFFFFFE6',
  reflection: '#FFFFFFCC', shadow: '#344351',
  success: '#28734D', successSoft: '#E3EFE7', danger: '#B43C3C', dangerSoft: '#F7E8E7',
  warning: '#876020', warningSoft: '#F2EBD9', sky: '#52616F', skySoft: '#E0E6EB',
  plum: '#696372', plumSoft: '#EDEBF0'
};

export const darkTheme: OneTheme = {
  background: '#191D22', surface: '#242A31', surfaceElevated: '#303840',
  fill: '#343D46', fillStrong: '#48535E',
  text: '#F1F4F6', textSecondary: '#B7C1CA', textTertiary: '#A3AFBA',
  border: '#404B56', accent: '#DCE4EB', accentSoft: '#343D46', onAccent: '#20272E',
  chrome: '#C2CED8', chromeSoft: '#343E48', platinum: '#AAB8C4', platinumSoft: '#2B333B',
  glass: '#303941D9', glassStrong: '#2A323BF5', glassBorder: '#FFFFFF24',
  reflection: '#FFFFFF12', shadow: '#090D12',
  success: '#8DC9A8', successSoft: '#253D31', danger: '#F49A94', dangerSoft: '#462E32',
  warning: '#DDBA7C', warningSoft: '#3D3628', sky: '#C2CED8', skySoft: '#343E48',
  plum: '#C0B9CA', plumSoft: '#36323E'
};
