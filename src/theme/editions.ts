import type { TextStyle, ViewStyle } from 'react-native';
import { lightTheme, darkTheme, type OneTheme } from './colors.ts';

export const themeIds = ['monolith', 'aurora', 'archive', 'orbit', 'tactile', 'platinum'] as const;
export type ThemeId = typeof themeIds[number];
export type ThemePreference = ThemeId | 'system';
export type MaterialRole = 'card' | 'navigation' | 'input' | 'modal';
export type MaterialToken = { color: string; tint: string; border: string; radius: number; glass: boolean; shadow: ViewStyle };
export type NeverTheme = OneTheme & {
  id: ThemeId; name: string; descriptor: string; mode: 'light' | 'dark';
  colors: OneTheme;
  materials: Record<MaterialRole, MaterialToken>;
  radius: { card: number; button: number; icon: number; chip: number; sheet: number };
  spacing: { page: number; section: number; row: number };
  typography: { heading: TextStyle; wordmark: TextStyle };
  effects: { atmosphere?: string; kind: ThemeId; light: string; shade: string; edge: string; texture: boolean; reflection: boolean };
};

function edition(id: ThemeId, name: string, descriptor: string, mode: 'light' | 'dark', colors: OneTheme,
  config: { radius: number; glass: boolean; depth: number; blurRadius: number; offset: number; light: string; shade: string; heading?: TextStyle }): NeverTheme {
  const shadow: ViewStyle = { shadowColor: colors.shadow, shadowOpacity: config.depth, shadowRadius: config.blurRadius, shadowOffset: { width: 0, height: config.offset }, elevation: config.depth ? 2 : 0 };
  const material = (color: string, radius: number, glass: boolean): MaterialToken => ({ color, tint: colors.chrome + '18', border: glass ? colors.glassBorder : colors.border, radius, glass, shadow });
  return {
    ...colors, id, name, descriptor, mode, colors,
    materials: {
      card: { ...material(colors.surface, config.radius, false), shadow: id === 'platinum' || id === 'archive' ? { ...shadow, shadowOpacity: 0, elevation: 0 } : shadow },
      input: material(config.glass ? colors.glassStrong : colors.surfaceElevated, config.radius, config.glass),
      navigation: material(config.glass ? colors.glassStrong : colors.surface, config.radius + 4, config.glass),
      modal: material(colors.surfaceElevated, config.radius + 6, false)
    },
    radius: { card: config.radius, button: id === 'orbit' ? 26 : config.radius, icon: id === 'orbit' ? 999 : id === 'archive' ? 8 : 14, chip: id === 'archive' ? 6 : id === 'tactile' ? 10 : 999, sheet: config.radius + 6 },
    spacing: { page: id === 'archive' ? 24 : 20, section: id === 'archive' ? 24 : 20, row: id === 'archive' ? 62 : 58 },
    typography: { heading: { fontWeight: '400', letterSpacing: -0.8, ...config.heading }, wordmark: { letterSpacing: id === 'archive' ? 3 : id === 'monolith' ? 5.5 : 4.5, fontWeight: id === 'monolith' ? '700' : '600' } },
    effects: { atmosphere: id === 'aurora' ? 'radial-gradient(ellipse at 80% 15%, #FBF5EECC 0%, #FBF5EE00 58%), linear-gradient(155deg, #CBD8EB55 0%, #E4DDF033 55%, #BACCEB55 100%)' : id === 'orbit' ? 'radial-gradient(ellipse at 95% 30%, #213C604D 0%, #090F1800 65%)' : undefined, kind: id, light: config.light, shade: config.shade, edge: colors.reflection, texture: id === 'tactile', reflection: id !== 'archive' && id !== 'tactile' }
  };
}

export const themes: Record<ThemeId, NeverTheme> = {
  platinum: edition('platinum', 'Platinum', 'Clean. Refined. Universal.', 'light', lightTheme,
    { radius: 20, glass: true, depth: 0.09, blurRadius: 16, offset: 6, light: '#FFFFFFA6', shade: '#AEB9C326' }),
  monolith: edition('monolith', 'Monolith', 'Bold. Minimal. Timeless.', 'dark', {
    ...darkTheme, background: '#0D0F11', surface: '#181B1E', surfaceElevated: '#23272B', fill: '#262A2E', fillStrong: '#363C41',
    text: '#F6F5F1', textSecondary: '#BBC0C4', textTertiary: '#9BA3AA', border: '#343A40', accent: '#E9ECEE', accentSoft: '#252B30',
    onAccent: '#171A1C', chrome: '#CCD3D9', glass: '#202529DC', glassStrong: '#202529F0', glassBorder: '#E0E7ED30', reflection: '#FFFFFF20', shadow: '#000000'
  }, { radius: 14, glass: true, depth: 0.2, blurRadius: 10, offset: 5, light: '#C5CFD412', shade: '#00000040', heading: { letterSpacing: -1.1 } }),
  aurora: edition('aurora', 'Aurora', 'Fluid. Modern. Alive.', 'light', {
    ...lightTheme, background: '#DCE3F0', surface: '#EDF1F9', surfaceElevated: '#F7F9FE', fill: '#D6DFF0', fillStrong: '#C4D1E7',
    text: '#1D2B42', textSecondary: '#4D5E78', textTertiary: '#53627A', border: '#BECBE0', accent: '#354C6B', accentSoft: '#D6E2F5',
    onAccent: '#FFFFFF', chrome: '#4B6385', chromeSoft: '#D8E3F3', glass: '#F6F8FFD0', glassStrong: '#F1F5FBDC', glassBorder: '#FFFFFFED', reflection: '#FFFFFFD9', shadow: '#596B94'
  }, { radius: 26, glass: true, depth: 0.13, blurRadius: 22, offset: 7, light: '#F8FAFF9C', shade: '#A9B8DD4D', heading: { letterSpacing: -0.65 } }),
  archive: edition('archive', 'Archive', 'Structured. Focused. Efficient.', 'light', {
    ...lightTheme, background: '#ECEBE6', surface: '#F5F4F0', surfaceElevated: '#FCFBF7', fill: '#E4E3DC', fillStrong: '#D3D4CC',
    text: '#242720', textSecondary: '#575C53', textTertiary: '#60645B', border: '#D1D3CA', accent: '#353A32', accentSoft: '#E1E4DA',
    onAccent: '#FCFDF7', chrome: '#62695C', chromeSoft: '#E2E6DC', platinum: '#8A9185', platinumSoft: '#E9EBE3',
    glass: '#F5F4F0', glassStrong: '#F5F4F0', glassBorder: '#D1D3CA', reflection: '#FFFFFF00', shadow: '#383D32'
  }, { radius: 8, glass: false, depth: 0, blurRadius: 0, offset: 0, light: '#FFFFFF00', shade: '#353A3208', heading: { letterSpacing: -0.6 } }),
  orbit: edition('orbit', 'Orbit', 'Dynamic. Visual. Intuitive.', 'dark', {
    ...darkTheme, background: '#090F18', surface: '#141F2C', surfaceElevated: '#1F2D3D', fill: '#243548', fillStrong: '#32465D',
    text: '#EFF5FC', textSecondary: '#B4C6DA', textTertiary: '#98AEC5', border: '#344B64', accent: '#CADFF4', accentSoft: '#253B52',
    onAccent: '#142337', chrome: '#A5C9EA', chromeSoft: '#293E54', glass: '#172737DE', glassStrong: '#172737F0', glassBorder: '#B5D9FF40', reflection: '#D2E9FF45', shadow: '#03060B'
  }, { radius: 24, glass: true, depth: 0.24, blurRadius: 20, offset: 6, light: '#8DAFDA22', shade: '#020814C7', heading: { letterSpacing: -1 } }),
  tactile: edition('tactile', 'Tactile', 'Warm. Real. Personal.', 'light', {
    ...lightTheme, background: '#E5DDCE', surface: '#F0EADD', surfaceElevated: '#FAF5EA', fill: '#E1D7C5', fillStrong: '#CEC3AF',
    text: '#302D27', textSecondary: '#61594B', textTertiary: '#685E4F', border: '#CEC3AF', accent: '#504B3D', accentSoft: '#E0D8C6',
    onAccent: '#FCF8EF', chrome: '#6B6252', chromeSoft: '#DED6C5', platinum: '#978C78', platinumSoft: '#EAE3D5',
    glass: '#F2EBDC', glassStrong: '#F2EBDC', glassBorder: '#FBF6EB', reflection: '#FFFCF480', shadow: '#514631'
  }, { radius: 11, glass: false, depth: 0.17, blurRadius: 4, offset: 3, light: '#FFFCF433', shade: '#74634C0A', heading: { letterSpacing: -0.5 } })
};

export function resolveTheme(preference: ThemePreference, systemMode: 'light' | 'dark'): NeverTheme {
  return themes[preference === 'system' ? (systemMode === 'dark' ? 'monolith' : 'platinum') : preference];
}
export function parseThemePreference(value: unknown): ThemePreference {
  if (value === 'light') return 'platinum';
  if (value === 'dark') return 'monolith';
  return value === 'system' || themeIds.includes(value as ThemeId) ? value as ThemePreference : 'platinum';
}
export function appearanceLabel(value: ThemePreference) { return value === 'system' ? 'System' : themes[value].name; }

export function materialStyle(theme: NeverTheme, role: MaterialRole): ViewStyle {
  const material = theme.materials[role];
  return { backgroundColor: material.color, borderColor: material.border, borderWidth: 0.5, borderRadius: material.radius, ...material.shadow };
}

/** Shared by real glass surfaces and plain native text fields. */
export function resolveMaterialAppearance(theme: NeverTheme, role: MaterialRole, options: {
  reduceTransparency: boolean; nativeGlass?: boolean; focused?: boolean;
}): { style: ViewStyle; useGlass: boolean; tint: string } {
  const material = theme.materials[role];
  const useGlass = Boolean(material.glass && !options.reduceTransparency && options.nativeGlass);
  const opaque = role === 'input' || role === 'modal' ? theme.surfaceElevated : theme.surface;
  return {
    useGlass, tint: material.tint,
    style: {
      ...materialStyle(theme, role),
      backgroundColor: useGlass ? 'transparent' : options.reduceTransparency && material.glass ? opaque : material.color,
      borderColor: options.focused ? theme.chrome : material.border
    }
  };
}
