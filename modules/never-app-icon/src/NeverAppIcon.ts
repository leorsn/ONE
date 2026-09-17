import { requireNativeModule } from 'expo';
import { Platform } from 'react-native';

export type NeverAppIconName = 'nature' | 'wordmark';

type NativeNeverAppIconModule = {
  supportsAlternateIcons(): boolean;
  getAppIcon(): NeverAppIconName;
  setAppIconAsync(iconName: NeverAppIconName): Promise<void>;
};

let cachedModule: NativeNeverAppIconModule | null | undefined;

function getNativeModule(): NativeNeverAppIconModule | null {
  if (Platform.OS !== 'ios') return null;
  if (cachedModule !== undefined) return cachedModule;

  try {
    cachedModule = requireNativeModule<NativeNeverAppIconModule>('NeverAppIcon');
  } catch {
    cachedModule = null;
  }

  return cachedModule;
}

export function supportsNeverAppIcons(): boolean {
  return getNativeModule()?.supportsAlternateIcons() ?? false;
}

export function getNeverAppIcon(): NeverAppIconName {
  return getNativeModule()?.getAppIcon() ?? 'nature';
}

export async function setNeverAppIcon(iconName: NeverAppIconName): Promise<void> {
  const nativeModule = getNativeModule();
  if (!nativeModule) {
    throw new Error('Alternate app icons require the iOS native build.');
  }
  await nativeModule.setAppIconAsync(iconName);
}
