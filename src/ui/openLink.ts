import { Alert, Linking } from 'react-native';
export async function openMemoryLink(url: string) {
  try { await Linking.openURL(url); }
  catch { Alert.alert('Could not open link', 'The link is still saved in NEVER. Please try again or open it in your browser.'); }
}
