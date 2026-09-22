import { router, type Href } from 'expo-router';

export function goBackOrHome(fallback: Href = '/(tabs)') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
