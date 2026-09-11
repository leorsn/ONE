export type NativeRouteKind = 'share' | 'auth_callback' | 'password_reset' | 'acceptance' | 'app' | 'invalid';

export type NativeRouteResolution = {
  route: string;
  kind: NativeRouteKind;
};

export function resolveOneNativePath(path: string): NativeRouteResolution {
  if (!path) return { route: '/', kind: 'invalid' };

  if (path.startsWith('/')) {
    if (path.startsWith('/auth/callback')) return { route: path, kind: 'auth_callback' };
    if (path.startsWith('/auth/reset-password')) return { route: path, kind: 'password_reset' };
    if (path.startsWith('/dev-native')) return { route: path, kind: 'acceptance' };
    return { route: path, kind: 'app' };
  }

  try {
    const url = new URL(path);

    if (url.hostname === 'expo-sharing') {
      return { route: '/handle-share', kind: 'share' };
    }

    if (url.protocol === 'one:') {
      const target = `${url.hostname}${url.pathname}`.replace(/^\/+/, '');
      const suffix = `${url.search}${url.hash}`;

      if (target === 'auth/callback') {
        return { route: `/auth/callback${suffix}`, kind: 'auth_callback' };
      }
      if (target === 'auth/reset-password') {
        return { route: `/auth/reset-password${suffix}`, kind: 'password_reset' };
      }
      if (target === 'dev-native') {
        return { route: `/dev-native${suffix}`, kind: 'acceptance' };
      }
    }

    return { route: path, kind: 'app' };
  } catch {
    return { route: '/', kind: 'invalid' };
  }
}
