import { Alert, Linking } from 'react-native';
import { safeMemoryUrl } from './linkPolicy';

export async function openMemoryLink(value: string) {
  const url = safeMemoryUrl(value);
  if (!url) {
    Alert.alert('Cannot open this link', 'NEVER opens valid web links. You can still review or edit the saved content.');
    return;
  }
  try { await Linking.openURL(url); }
  catch { Alert.alert('Could not open link', 'The link is still saved in NEVER. Please try again or open it in your browser.'); }
}
