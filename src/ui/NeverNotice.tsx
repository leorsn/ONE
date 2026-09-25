import { materialStyle } from '@/src/theme/editions';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/src/theme/useTheme';
import { neverType } from '@/src/theme/tokens';
import { OneIcon, icons } from './icons';

export function NeverNotice({ title, body, tone = 'neutral', action, onAction }: {
  title: string; body?: string; tone?: 'neutral' | 'error' | 'busy' | 'success'; action?: string; onAction?: () => void;
}) {
  const t = useTheme();
  const color = tone === 'error' ? t.danger : tone === 'success' ? t.success : t.chrome;
  return <View accessibilityLiveRegion="polite" style={[styles.notice, materialStyle(t, 'card')]}>
    <View style={styles.heading}>
      {tone === 'busy' ? <ActivityIndicator color={color} /> : <OneIcon name={tone === 'success' ? icons.check : icons.info} color={color} size={20} />}
      <View style={styles.copy}><Text accessibilityRole={tone === 'error' ? 'alert' : undefined} style={[styles.title, { color: t.text }]}>{title}</Text>
        {body ? <Text style={[styles.body, { color: t.textSecondary }]}>{body}</Text> : null}</View>
    </View>
    {action && onAction ? <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}><Text style={[styles.actionText, { color: t.chrome }]}>{action}</Text></Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({
  notice: { borderRadius: 18, padding: 16 }, heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  copy: { flex: 1, minWidth: 0 }, title: { ...neverType.bodyStrong }, body: { ...neverType.body, marginTop: 4 },
  action: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 4, marginTop: 4 },
  actionText: { ...neverType.bodyStrong }
});
