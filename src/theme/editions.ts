import type { TextStyle, ViewStyle } from 'react-native';
import { lightTheme, darkTheme, type OneTheme } from './colors.ts';

// Preserve existing persisted IDs. Canyon replaces Tactile; Tidal replaces Orbit.
export const themeIds = ['platinum', 'monolith', 'archive', 'aurora', 'tactile', 'orbit'] as const;
export type ThemeId = typeof themeIds[number];
export type ThemePreference = ThemeId | 'system';
export const primaryAction = { background: '#252B31', foreground: '#FCFDFD', border: '#FFFFFF30' } as const;
export type MaterialRole = 'card' | 'hero' | 'navigation' | 'input' | 'modal';
export type MaterialToken = { color: string; tint: string; border: string; radius: number; glass: boolean; shadow: ViewStyle };
export type NeverTheme = OneTheme & {
  id: ThemeId; name: string; descriptor: string; mode: 'light' | 'dark'; artwork?: boolean;
  colors: OneTheme;
  materials: Record<MaterialRole, MaterialToken>;
  radius: { card: number; button: number; icon: number; chip: number; sheet: number };
  spacing: { page: number; section: number; row: number };
  typography: { heading: TextStyle; wordmark: TextStyle };
  effects: { atmosphere?: string; kind: ThemeId; light: string; shade: string; edge: string; texture: boolean; reflection: boolean };
};

// The artwork changes; controls retain one neutral light/dark design system.
// Clean V1: tonal pearl and monolithic graphite. Legacy editions remain available
// for compatibility, but the primary Light/Dark foundation uses these neutral surfaces.
const neutralLight: OneTheme = {
  ...lightTheme,
  background: '#F5F3F0', surface: '#FBFAF8', surfaceElevated: '#FFFFFF',
  fill: '#ECE9E5', fillStrong: '#DDD8D2', text: '#111111',
  textSecondary: '#6E6A66', textTertiary: '#67615C', border: '#DCD8D2',
  accent: '#252525', accentSoft: '#E8E4DF', onAccent: '#FFFFFF',
  chrome: '#6D6965', chromeSoft: '#E8E4DF', glassBorder: '#FFFFFFC0',
  shadow: '#312A24'
};
const neutralDark: OneTheme = {
  ...darkTheme,
  background: '#050505', surface: '#141416', surfaceElevated: '#1B1B1E',
  fill: '#242426', fillStrong: '#333336', text: '#F3F2F0',
  textSecondary: '#B6B1AC', textTertiary: '#AAA49E', border: '#353537',
  accent: '#E1DFDC', accentSoft: '#252527', onAccent: '#111113',
  chrome: '#C8C4BF', chromeSoft: '#2A2A2C', glassBorder: '#FFFFFF24',
  shadow: '#000000'
};

function edition(id: ThemeId, name: string, descriptor: string, mode: 'light' | 'dark'): NeverTheme {
  const colors = mode === 'dark' ? neutralDark : neutralLight;
  const none: ViewStyle = { shadowOpacity: 0, elevation: 0 };
  const elevated: ViewStyle = { shadowColor: colors.shadow, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 2 };
  const material = (color: string, radius: number, glass: boolean, shadow: ViewStyle = none): MaterialToken => ({
    color, radius, glass, shadow, tint: colors.surface + '45', border: colors.glassBorder
  });
  return {
    ...colors, id, name, descriptor, mode, artwork: true, colors,
    materials: {
      card: material(colors.surface + 'FF', 24, false),
      hero: material(colors.surface + 'FF', 26, false),
      input: material(colors.surfaceElevated + 'FF', 24, true),
      navigation: material(colors.surface + 'FF', 28, true, { ...elevated, shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } }),
      modal: material(colors.surfaceElevated + 'FF', 24, false, elevated)
    },
    radius: { card: 24, button: 18, icon: 12, chip: 12, sheet: 28 },
    spacing: { page: 24, section: 32, row: 56 },
    typography: { heading: { fontWeight: '600', letterSpacing: -0.8 }, wordmark: { letterSpacing: 4.5, fontWeight: '600' } },
    effects: { kind: id, light: '#FFFFFF08', shade: '#00000008', edge: colors.glassBorder, texture: false, reflection: true }
  };
}

export const themes: Record<ThemeId, NeverTheme> = {
  platinum: edition('platinum', 'Light', 'Pearl · quiet editorial light', 'light'),
  monolith: edition('monolith', 'Dark', 'Graphite · restrained chrome', 'dark'),
  archive: edition('archive', 'Archive', 'Sage garden · quiet natural light', 'light'),
  aurora: edition('aurora', 'Aurora', 'Pastel sky · a glass horizon', 'light'),
  tactile: edition('tactile', 'Canyon', 'Copper stone · warm sculptural light', 'dark'),
  orbit: edition('orbit', 'Tidal', 'Crystal water · cool luminous depth', 'light')
};

// System is intentionally a basic/free appearance. It follows the device's
// light/dark mode but never inherits Platinum/Monolith artwork. Explicitly
// selecting either premium world still keeps its bundled artwork unchanged.
const basicSystemLight: NeverTheme = {
  ...themes.platinum,
  name: 'System',
  descriptor: 'Basic light appearance',
  artwork: false
};
const basicSystemDark: NeverTheme = {
  ...themes.monolith,
  name: 'System',
  descriptor: 'Basic dark appearance',
  artwork: false
};

export function resolveTheme(preference: ThemePreference, systemMode: 'light' | 'dark'): NeverTheme {
  if (preference === 'system') return systemMode === 'dark' ? basicSystemDark : basicSystemLight;
  return themes[preference];
}
export function parseThemePreference(value: unknown): ThemePreference {
  if (value === 'light') return 'platinum';
  if (value === 'dark') return 'monolith';
  if (value === 'canyon') return 'tactile';
  if (value === 'tidal') return 'orbit';
  return value === 'system' || themeIds.includes(value as ThemeId) ? value as ThemePreference : 'platinum';
}
export function appearanceLabel(value: ThemePreference) { return value === 'system' ? 'System' : themes[value].name; }

export function materialStyle(theme: NeverTheme, role: MaterialRole): ViewStyle {
  const material = theme.materials[role];
  return { backgroundColor: material.color, borderColor: material.border, borderWidth: 0.5, borderRadius: material.radius, ...material.shadow };
}

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
      // Native glass supplies its own optical material; do not stack the fallback beneath it.
      backgroundColor: options.reduceTransparency ? opaque : useGlass ? theme.surface + '14' : material.color,
      borderColor: options.focused ? theme.chrome + '80' : material.border
    }
  };
}
