import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './colors';

export function useTheme() {
  return useColorScheme() === 'dark' ? darkTheme : lightTheme;
}
