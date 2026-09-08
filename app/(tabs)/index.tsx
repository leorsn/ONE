import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mockItems } from '@/src/data/mockItems';
import { useItems } from '@/src/hooks/useItems';
import { parseQuickCapture } from '@/src/parser/quickCapture';
import { useTheme } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

export default function InboxScreen() {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const { items, add, toggleCompleted, remove } = useItems(mockItems);
  const parsed = useMemo(() => parseQuickCapture(input), [input]);

  const todayIso = toIsoDate(new Date());
  const today = items.filter((item) => item.date === todayIso || (!item.date && !item.saved));
  const upcoming = items.filter((item) => item.date && item.date > todayIso && !item.saved);
  const saved = items.filter((item) => item.saved || ['link', 'idea', 'shopping', 'travel'].includes(item.type));

  function handleSave() {
    if (!parsed) return;
    const now = new Date().toISOString();
    const item: OneItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: parsed.title || input,
      rawInput: input,
      type: parsed.type,
      date: parsed.date,
      time: parsed.time,
      category: parsed.category,
      completed: false,
      saved: ['link', 'idea', 'shopping', 'travel'].includes(parsed.type),
      sourceType: 'manual',
      originalText: input,
      tags: parsed.category ? [parsed.category.toLowerCase()] : [],
      entities: [],
      createdAt: now,
      updatedAt: now
    };
    add(item);
    setInput('');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <Text style={{ color: theme.textSecondary }}>⌁</Text>
        </View>

        {parsed ? (
          <View style={styles.smartWrap}>
            <Text style={[styles.smartTitle, { color: theme.text }]}>Smart interpretation</Text>
            <View style={[styles.smartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.smartHeader}>
                <View style={[styles.typeIcon, { backgroundColor: theme.accentSoft }]}>
                  <Text style={{ color: theme.accent }}>◫</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.smartType, { color: theme.text }]}>{formatType(parsed.type)}</Text>
                  <Text style={[styles.smartMeta, { color: theme.textSecondary }]}>
                    {[parsed.dateLabel, parsed.time].filter(Boolean).join(' · ') || 'No date detected'}
                  </Text>
                </View>
                <Text style={{ color: theme.accent }}>Edit</Text>
              </View>

              <SmartRow label="Title" value={parsed.title || input} theme={theme} />
              <SmartRow label="Date & time" value={[parsed.dateLabel, parsed.time].filter(Boolean).join(' · ') || 'Add date'} theme={theme} />
              <SmartRow label="Category" value={parsed.category || 'General'} theme={theme} />
              <SmartRow label="Confidence" value={`${Math.round(parsed.confidence * 100)}%`} theme={theme} />

              <Pressable onPress={handleSave} style={[styles.saveButton, { backgroundColor: theme.accent }]}>
                <Text style={styles.saveButtonText}>Save to ONE</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Section title="Today" theme={theme}>
          {today.length ? today.map((item) => (
            <ItemRow key={item.id} item={item} theme={theme} onToggle={toggleCompleted} onDelete={remove} />
          )) : <EmptyRow label="Nothing for today" theme={theme} />}
        </Section>

        <Section title="Upcoming" theme={theme}>
          {upcoming.length ? upcoming.map((item) => (
            <ItemRow key={item.id} item={item} theme={theme} onToggle={toggleCompleted} onDelete={remove} />
          )) : <EmptyRow label="Nothing upcoming" theme={theme} />}
        </Section>

        <Section title="Saved" theme={theme}>
          {saved.length ? saved.map((item) => (
            <ItemRow key={item.id} item={item} theme={theme} onToggle={toggleCompleted} onDelete={remove} />
          )) : <EmptyRow label="Nothing saved yet" theme={theme} />}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function SmartRow({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.smartRow, { borderTopColor: theme.border }]}>
      <Text style={[styles.smartRowLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.smartRowValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={{ color: theme.accent }}>See all</Text>
      </View>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>{children}</View>
    </View>
  );
}

function ItemRow({ item, theme, onToggle, onDelete }: {
  item: OneItem;
  theme: ReturnType<typeof useTheme>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Pressable
      onLongPress={() => Alert.alert('Delete item?', item.title, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) }
      ])}
      style={[styles.row, { borderBottomColor: theme.border }]}
    >
      <Pressable onPress={() => onToggle(item.id)} style={[styles.check, { borderColor: item.completed ? theme.accent : theme.textSecondary, backgroundColor: item.completed ? theme.accent : 'transparent' }]}>
        {item.completed ? <Text style={styles.checkmark}>✓</Text> : null}
      </Pressable>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.text, textDecorationLine: item.completed ? 'line-through' : 'none' }]}>
          {item.time ? `${item.time}  ${item.title}` : item.title}
        </Text>
        <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
          {[item.date, item.location || item.category].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyRow({ label, theme }: { label: string; theme: ReturnType<typeof useTheme> }) {
  return <Text style={[styles.empty, { color: theme.textSecondary }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  brand: { fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  tagline: { fontSize: 13, marginTop: 2 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  capture: { minHeight: 56, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  plus: { fontSize: 28, marginRight: 8 },
  input: { flex: 1, fontSize: 16 },
  smartWrap: { gap: 10 },
  smartTitle: { fontSize: 22, fontWeight: '700' },
  smartCard: { borderWidth: 1, borderRadius: 20, overflow: 'hidden', paddingTop: 4 },
  smartHeader: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16 },
  typeIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  smartType: { fontSize: 17, fontWeight: '700' },
  smartMeta: { fontSize: 13, marginTop: 3 },
  smartRow: { minHeight: 58, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  smartRowLabel: { fontSize: 13 },
  smartRowValue: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '500' },
  saveButton: { margin: 14, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 22, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  row: { minHeight: 68, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  check: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800' },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubtitle: { fontSize: 13 },
  empty: { padding: 18, fontSize: 14 }
});
