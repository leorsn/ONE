import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNeverV5Palette } from '@/src/ui/appleV5';

export function Pass3ScreenIntro({ eyebrow, title, body, trailing }: { eyebrow: string; title: string; body?: string; trailing?: ReactNode }) {
  const p = useNeverV5Palette();
  return (
    <View style={styles.wrap}>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: p.tertiary }]}>{eyebrow.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={[styles.title, p.heading, { color: p.label }]}>{title}</Text>
        {body ? <Text style={[styles.body, { color: p.secondary }]}>{body}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginTop: 12, marginBottom: 18 },
  copy: { flex: 1, maxWidth: 620 },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 1.3, marginBottom: 9 },
  title: { fontSize: 42, lineHeight: 46, fontWeight: '650', letterSpacing: -1.6 },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '450', marginTop: 8, maxWidth: 520 },
  trailing: { paddingTop: 20 },
});
