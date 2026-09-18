import { Platform } from 'react-native';

// NEVER Core uses the platform UI typeface everywhere. This intentionally keeps
// the product close to native iOS typography instead of mixing in a decorative serif.
export const editorialFontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'system-ui'
});

export const uiFontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'system-ui'
});
