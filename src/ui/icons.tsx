import { SymbolView } from 'expo-symbols';
import type { ColorValue, ViewStyle } from 'react-native';

type PlatformSymbol = { ios: string; android: string; web: string };

export function OneIcon({
  name,
  size = 20,
  color,
  style
}: {
  name: PlatformSymbol;
  size?: number;
  color: ColorValue;
  style?: ViewStyle;
}) {
  return (
    <SymbolView
      name={name as any}
      size={size}
      tintColor={color}
      resizeMode="scaleAspectFit"
      style={style}
      fallback={null}
    />
  );
}

export const icons = {
  inbox: { ios: 'tray', android: 'inbox', web: 'inbox' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  saved: { ios: 'bookmark', android: 'bookmark', web: 'bookmark' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  ask: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  link: { ios: 'link', android: 'link', web: 'link' },
  idea: { ios: 'lightbulb', android: 'lightbulb', web: 'lightbulb' },
  shopping: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' },
  travel: { ios: 'airplane', android: 'flight', web: 'flight' },
  note: { ios: 'note.text', android: 'description', web: 'description' },
  task: { ios: 'checklist', android: 'checklist', web: 'checklist' },
  appointment: { ios: 'calendar.badge.clock', android: 'event', web: 'event' },
  reminder: { ios: 'bell', android: 'notifications', web: 'notifications' },
  event: { ios: 'calendar.badge.plus', android: 'event_available', web: 'event_available' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  person: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  cloud: { ios: 'icloud', android: 'cloud', web: 'cloud' },
  bell: { ios: 'bell', android: 'notifications', web: 'notifications' },
  appearance: { ios: 'circle.lefthalf.filled', android: 'contrast', web: 'contrast' },
  lock: { ios: 'lock', android: 'lock', web: 'lock' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  delete: { ios: 'trash', android: 'delete', web: 'delete' },
  screenshot: { ios: 'viewfinder', android: 'screenshot', web: 'screenshot' },
  upload: { ios: 'square.and.arrow.up', android: 'ios_share', web: 'ios_share' },
  more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  sync: { ios: 'arrow.triangle.2.circlepath', android: 'sync', web: 'sync' },
  shield: { ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' },
  scan: { ios: 'doc.viewfinder', android: 'document_scanner', web: 'document_scanner' },
  document: { ios: 'doc.text', android: 'description', web: 'description' },
  crown: { ios: 'crown', android: 'workspace_premium', web: 'workspace_premium' }
} as const;
