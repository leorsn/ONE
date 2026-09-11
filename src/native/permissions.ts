export type NativePermissionState = 'granted' | 'not_requested' | 'denied' | 'unavailable';

export type PermissionLike = {
  granted?: boolean;
  status?: string | null;
  canAskAgain?: boolean;
};

export function mapNativePermissionState(permission?: PermissionLike | null): NativePermissionState {
  if (!permission) return 'unavailable';
  if (permission.granted || permission.status === 'granted') return 'granted';
  if (permission.status === 'undetermined') return 'not_requested';
  if (permission.status === 'denied') return permission.canAskAgain === false ? 'denied' : 'not_requested';
  if (permission.canAskAgain === true) return 'not_requested';
  if (permission.canAskAgain === false) return 'denied';
  return 'unavailable';
}

export function permissionStateLabel(state: NativePermissionState) {
  if (state === 'granted') return 'Granted';
  if (state === 'not_requested') return 'Not requested';
  if (state === 'denied') return 'Denied';
  return 'Unavailable';
}
