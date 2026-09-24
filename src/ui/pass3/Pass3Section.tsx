import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNeverV5Palette } from '@/src/ui/appleV5';

export function Pass3Section({ title, meta, action, children }: { title: string; meta?: string; action?: ReactNode; children: ReactNode }) {
  const p = useNeverV5Palette();
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: p.secondary }]}>{title.toUpperCase()}</Text>
          {meta ? <Text style={[styles.meta, { color: p.tertiary }]}>{meta}</Text> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Pass3TextAction({ label, onPress }: { label: string; onPress: () => void }) {
  const p = useNeverV5Palette();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10} style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}>
      <Text style={[styles.action, { color: p.chrome }]}>{label}</Text>
    </Pressable>
  );
}

export function Pass3Divider() {
  const p = useNeverV5Palette();
  return <View style={[styles.divider, { backgroundColor: p.separator }]} />;
}

const styles = StyleSheet.create({
  section: { gap: 10, marginTop: 26 },
  header: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  title: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.25 },
  meta: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  action: { fontSize: 13, lineHeight: 18, fontWeight: '650' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
});
