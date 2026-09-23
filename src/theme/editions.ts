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

type EditionConfig = {
  radius: number;
  glass: boolean;
  depth: number;
  blurRadius: number;
  offset: number;
  light: string;
  shade: string;
  heading?: TextStyle;
  material?: Partial<Record<MaterialRole, string>>;
};

function edition(id: ThemeId, name: string, descriptor: string, mode: 'light' | 'dark', colors: OneTheme, config: EditionConfig): NeverTheme {
  const shadow: ViewStyle = {
    shadowColor: colors.shadow,
    shadowOpacity: config.depth,
    shadowRadius: config.blurRadius,
    shadowOffset: { width: 0, height: config.offset },
    elevation: config.depth ? 2 : 0
  };
  const material = (color: string, radius: number, glass: boolean): MaterialToken => ({
    color,
    tint: colors.chrome + '22',
    border: glass ? colors.glassBorder : colors.border,
    radius,
    glass,
    shadow
  });
  const cardShadow = id === 'archive' ? { ...shadow, shadowOpacity: 0, elevation: 0 } : shadow;
  const cardColor = config.material?.card ?? colors.surface;
  const inputColor = config.material?.input ?? (config.glass ? colors.glassStrong : colors.surfaceElevated);
  const navigationColor = config.material?.navigation ?? (config.glass ? colors.glassStrong : colors.surface);
  const modalColor = config.material?.modal ?? colors.surfaceElevated;

  return {
    ...colors, id, name, descriptor, mode, colors,
    materials: {
      card: { ...material(cardColor, config.radius, false), shadow: cardShadow },
      input: material(inputColor, config.radius, config.glass),
      navigation: material(navigationColor, config.radius + 4, config.glass),
      modal: material(modalColor, config.radius + 6, false)
    },
    radius: {
      card: config.radius,
      button: id === 'orbit' ? 28 : id === 'aurora' ? 22 : id === 'tactile' ? 16 : id === 'archive' ? 8 : id === 'platinum' ? 18 : 12,
      icon: id === 'orbit' ? 999 : id === 'aurora' ? 18 : id === 'tactile' ? 18 : id === 'archive' ? 7 : id === 'platinum' ? 16 : 12,
      chip: id === 'archive' ? 5 : id === 'tactile' ? 14 : id === 'monolith' ? 10 : 999,
      sheet: config.radius + 6
    },
    spacing: { page: id === 'archive' ? 24 : 20, section: id === 'archive' ? 24 : 20, row: id === 'archive' ? 62 : 58 },
    typography: {
      heading: { fontWeight: '400', letterSpacing: -0.8, ...config.heading },
      wordmark: { letterSpacing: id === 'archive' ? 3 : id === 'monolith' ? 5.5 : 4.5, fontWeight: id === 'monolith' ? '700' : '600' }
    },
    effects: {
      atmosphere: id === 'aurora'
        ? 'radial-gradient(ellipse at 80% 15%, #F8FBFFD9 0%, #F8FBFF00 58%), linear-gradient(155deg, #BFD8F25C 0%, #E9E0F54A 55%, #C8D9F05C 100%)'
        : id === 'orbit'
          ? 'radial-gradient(ellipse at 95% 30%, #2A57885C 0%, #06101C00 65%)'
          : undefined,
      kind: id,
      light: config.light,
      shade: config.shade,
      edge: colors.reflection,
      texture: id === 'tactile',
      reflection: id !== 'archive' && id !== 'tactile'
    }
  };
}

export const themes: Record<ThemeId, NeverTheme> = {
  platinum: edition('platinum', 'Platinum', 'Clean. Refined. Universal.', 'light', {
    ...lightTheme,
    background: '#ECEDEB', surface: '#F7F7F4', surfaceElevated: '#FCFCFA', fill: '#E7E9E8', fillStrong: '#D5DADC',
    text: '#171B1E', textSecondary: '#5A646B', textTertiary: '#626C73', border: '#C9CFD1', accent: '#303A40', accentSoft: '#E3E7E8',
    onAccent: '#FFFFFF', chrome: '#65727A', chromeSoft: '#E8ECEC', platinum: '#8C979D', platinumSoft: '#EEF0F0',
    glass: '#F8F8F4D6', glassStrong: '#F6F7F4E8', glassBorder: '#FFFFFFD9', reflection: '#FFFFFFC9', shadow: '#667078'
  }, {
    radius: 20, glass: true, depth: 0.08, blurRadius: 18, offset: 5, light: '#FFFFFFB8', shade: '#8B959F1F',
    material: { card: '#F7F8F5F0', input: '#F1F3F2E8', navigation: '#F2F4F3E8', modal: '#FBFCFA' }
  }),

  monolith: edition('monolith', 'Monolith', 'Bold. Minimal. Timeless.', 'dark', {
    ...darkTheme,
    background: '#070809', surface: '#151719', surfaceElevated: '#202326', fill: '#24272A', fillStrong: '#34383C',
    text: '#F4F5F5', textSecondary: '#B2B7BB', textTertiary: '#8F969C', border: '#34383C', accent: '#E6EAEC', accentSoft: '#24282B',
    onAccent: '#111315', chrome: '#C8CED2', chromeSoft: '#2B3034', glass: '#191C1FDE', glassStrong: '#191C1FF2', glassBorder: '#F0F3F52B', reflection: '#FFFFFF1F', shadow: '#000000'
  }, {
    radius: 14, glass: true, depth: 0.24, blurRadius: 12, offset: 5, light: '#D6DDE114', shade: '#00000052', heading: { letterSpacing: -1.1 },
    material: { card: '#121416F2', input: '#1B1E21F4', navigation: '#1A1D20F2', modal: '#222629' }
  }),

  aurora: edition('aurora', 'Aurora', 'Fluid. Modern. Alive.', 'light', {
    ...lightTheme,
    background: '#DCE8F6', surface: '#EEF5FC', surfaceElevated: '#FAFCFF', fill: '#D9E5F4', fillStrong: '#C1D3E8',
    text: '#182944', textSecondary: '#506783', textTertiary: '#53677F', border: '#C2D2E6', accent: '#36577D', accentSoft: '#D7E6F7',
    onAccent: '#FFFFFF', chrome: '#55779C', chromeSoft: '#D9E7F5', glass: '#F5FAFFD1', glassStrong: '#F3F8FFE8', glassBorder: '#FFFFFFF0', reflection: '#FFFFFFE5', shadow: '#5B78A0'
  }, {
    radius: 26, glass: true, depth: 0.12, blurRadius: 24, offset: 7, light: '#FFFFFFB5', shade: '#8FADD23D', heading: { letterSpacing: -0.65 },
    material: { card: '#EEF6FDEB', input: '#F6FAFFE8', navigation: '#EDF5FDE8', modal: '#FBFDFF' }
  }),

  archive: edition('archive', 'Archive', 'Structured. Focused. Efficient.', 'light', {
    ...lightTheme,
    background: '#D9E0DD', surface: '#EEF2F0', surfaceElevated: '#F8FAF8', fill: '#CFD9D3', fillStrong: '#B7C5BC',
    text: '#18231D', textSecondary: '#495B50', textTertiary: '#52645A', border: '#AEBDB4', accent: '#244435', accentSoft: '#CDDCD3',
    onAccent: '#F8FCF9', chrome: '#526E60', chromeSoft: '#D8E2DC', platinum: '#778980', platinumSoft: '#E5EAE7',
    glass: '#EFF3F1', glassStrong: '#EFF3F1', glassBorder: '#AEBDB4', reflection: '#FFFFFF00', shadow: '#2F4037'
  }, {
    radius: 8, glass: false, depth: 0, blurRadius: 0, offset: 0, light: '#FFFFFF00', shade: '#2444350A', heading: { letterSpacing: -0.55 },
    material: { card: '#F0F3F1F7', input: '#DEE6E1', navigation: '#E6ECE8F8', modal: '#F8FAF8' }
  }),

  orbit: edition('orbit', 'Orbit', 'Dynamic. Visual. Intuitive.', 'dark', {
    ...darkTheme,
    background: '#050C14', surface: '#101D2A', surfaceElevated: '#192B3D', fill: '#1D3247', fillStrong: '#294A68',
    text: '#F2F7FC', textSecondary: '#B3C9DF', textTertiary: '#8EABC6', border: '#31506D', accent: '#BFDDFC', accentSoft: '#1F3D57',
    onAccent: '#0B2237', chrome: '#88BAE8', chromeSoft: '#203B53', glass: '#11273BDD', glassStrong: '#11273BF2', glassBorder: '#A8D5FF42', reflection: '#D4EBFF52', shadow: '#02060B'
  }, {
    radius: 24, glass: true, depth: 0.26, blurRadius: 22, offset: 7, light: '#73A9E22B', shade: '#010711D1', heading: { letterSpacing: -1 },
    material: { card: '#0D1A28F2', input: '#12283DF2', navigation: '#10273AF2', modal: '#192D41' }
  }),

  tactile: edition('tactile', 'Tactile', 'Warm. Real. Personal.', 'light', {
    ...lightTheme,
    background: '#E8DDCB', surface: '#F2E9DC', surfaceElevated: '#FBF4E9', fill: '#DFD1BC', fillStrong: '#C8B79C',
    text: '#342A22', textSecondary: '#665847', textTertiary: '#6C5C4B', border: '#C7B69D', accent: '#675541', accentSoft: '#E2D5C3',
    onAccent: '#FFF9F0', chrome: '#816C54', chromeSoft: '#E2D7C7', platinum: '#9D896F', platinumSoft: '#EEE4D6',
    glass: '#F1E7D8', glassStrong: '#F1E7D8', glassBorder: '#FFF8EC', reflection: '#FFF8EA73', shadow: '#5E4B37'
  }, {
    radius: 15, glass: false, depth: 0.18, blurRadius: 7, offset: 4, light: '#FFF8EA38', shade: '#735C430F', heading: { letterSpacing: -0.45 },
    material: { card: '#F3EADCF5', input: '#E9DCCBF7', navigation: '#ECE1D2F7', modal: '#FBF4E9' }
  })
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
      backgroundColor: useGlass ? 'transparent' : options.reduceTransparency ? opaque : material.color,
      borderColor: options.focused ? theme.chrome : material.border
    }
  };
}