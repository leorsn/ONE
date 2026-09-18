import { Platform } from 'react-native';

export const editorialFontFamily = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  web: 'Georgia'
});

export const uiFontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  web: 'system-ui'
});
