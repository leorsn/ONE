import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { V5Group, V5IconButton, V5SectionHeader, useNeverV5Palette } from './appleV5';
import { icons } from './icons';

export function NeverNavigation({ title, onBack, action }: { title: string; onBack?: () => void; action?: ReactNode }) {
  const p = useNeverV5Palette();
  return <View style={styles.nav}>
    <View style={styles.side}>{onBack ? <V5IconButton icon={icons.chevronLeft} accessibilityLabel="Go back" onPress={onBack} /> : null}</View>
    <Text accessibilityRole="header" style={[styles.title, { color: p.label }]}>{title}</Text>
    <View style={styles.side}>{action}</View>
  </View>;
}
export function NeverSettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><V5SectionHeader title={title} /><V5Group>{children}</V5Group></View>;
}
const styles = StyleSheet.create({
  nav: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 22, fontWeight: '600', paddingVertical: 8 },
  section: { gap: 12 }
});
