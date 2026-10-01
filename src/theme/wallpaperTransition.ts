import type { NeverTheme, ThemeId } from './editions';

export type WallpaperId = ThemeId | 'basic-light' | 'basic-dark';
export const basicWallpaperIds: WallpaperId[] = ['basic-light', 'basic-dark'];
export function wallpaperId(theme: NeverTheme): WallpaperId {
  return theme.artwork === false ? `basic-${theme.mode}` : theme.id;
}
export type WallpaperState = {
  active: WallpaperId;
  requested: WallpaperId;
  incoming: WallpaperId | null;
  ready: readonly WallpaperId[];
  revision: number;
};
export type WallpaperEvent =
  | { type: 'select'; id: WallpaperId }
  | { type: 'ready'; id: WallpaperId }
  | { type: 'failed'; id: WallpaperId }
  | { type: 'finished'; revision: number };

export function initialWallpaperState(theme: NeverTheme): WallpaperState {
  const requested = wallpaperId(theme);
  return { active: `basic-${theme.mode}`, requested, incoming: null, ready: basicWallpaperIds, revision: 0 };
}
function advance(state: WallpaperState): WallpaperState {
  if (state.incoming || state.active === state.requested || !state.ready.includes(state.requested)) return state;
  return { ...state, incoming: state.requested, revision: state.revision + 1 };
}
/** Keep the opaque active layer until the latest ready replacement has finished. */
export function wallpaperTransition(state: WallpaperState, event: WallpaperEvent): WallpaperState {
  switch (event.type) {
    case 'select': return advance({ ...state, requested: event.id });
    case 'ready': return state.ready.includes(event.id) ? state : advance({ ...state, ready: [...state.ready, event.id] });
    case 'failed': return { ...state, ready: state.ready.filter(id => id !== event.id), incoming: state.incoming === event.id ? null : state.incoming };
    case 'finished':
      if (!state.incoming || event.revision !== state.revision) return state;
      return advance({ ...state, active: state.incoming, incoming: null });
  }
}
