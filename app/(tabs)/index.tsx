import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockItems } from '@/src/data/mockItems';
import { useTheme } from '@/src/theme/useTheme';

export default function InboxScreen() {
  const theme = useTheme();
  const [input, setInput] = useState('');

  const today = useMemo(() => mockItems.filter((item) => item.id !== 'netflix'), []);
  const upcoming = useMemo(() => mockItems.filter((item) => item.id === 'netflix'), []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.brand, { color: theme.text }]}>ONE</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>A calmer mind. A fuller life.</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>O</Text>
          </View>
        </View>

        <View style={[styles.capture, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.plus, { color: theme.accent }]}>＋</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
          />
          <Text style={{ color: theme.textSecondary }}>⌁</Text>
        </View>

        <Section title="Today" theme={theme}>
          {today.map((item) => (
            <ItemRow key={item.id} title={item.time ? `${item.time}  ${item.title}` : item.title} subtitle={item.location || item.category} theme={theme} />
          ))}
        </Section>

        <Section title="Upcoming" theme={theme}>
          {upcoming.map((item) => (
            <ItemRow key={item.id} title={`${item.title} · Sep 23`} subtitle={item.category} theme={theme} />
          ))}
        </Section>

        <Section title="Saved" theme={theme}>
          <ItemRow title="Restaurant idea" subtitle="Nice Italian place" theme={theme} />
          <ItemRow title="Summer shoes" subtitle="Saved link" theme={theme} />
          <ItemRow title="Barcelona flight" subtitle="Travel" theme={theme} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <Pressable><Text style={{ color: theme.accent }}>See all</Text></Pressable>
      </View>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>{children}</View>
    </View>
  );
}

function ItemRow({ title, subtitle, theme }: { title: string; subtitle?: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={[styles.check, { borderColor: theme.textSecondary }]} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  brand: { fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  tagline: { fontSize: 13, marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  capture: { minHeight: 56, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  plus: { fontSize: 28, marginRight: 8 },
  input: { flex: 1, fontSize: 16 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  row: { minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  check: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, marginRight: 12 },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubtitle: { fontSize: 13 }
});
