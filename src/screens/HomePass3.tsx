import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { NeverInput } from '@/src/ui/NeverInput';
import { NeverEyebrow } from '@/src/ui/neverVisual';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Chevron, V5SectionHeader, V5Wordmark, V5IconButton, useNeverV5Palette } from '@/src/ui/appleV5';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { interpretCapture } from '@/src/capture/core';
import { buildTodayEntries, todayReasonLabel } from '@/src/inbox/today';
import { iconForType } from '@/src/ui/OneItemRow';
import type { OneItem } from '@/src/types/item';

export default function HomePass3() {
  const p = useNeverV5Palette();
  const { session } = useAuth();
  const { items, add } = useItems();
  const captureRef = useRef<TextInput>(null);
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const now = new Date();
  const firstName = displayFirstName(session?.user.user_metadata);
  const draft = useMemo(() => input.trim() ? interpretCapture({ rawText: input, sourceType: 'manual' }) : null, [input]);
  const today = buildTodayEntries(items, now).slice(0, 3);
  const recent = useMemo(() => [...items].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 4), [items]);

  async function save() {
    if (!draft?.title.trim() || !input.trim() || saving) return;
    setSaving(true);
    try {
      await add(buildItemFromCapture({ draft, sourceType: 'manual', rawInput: input, originalText: input }));
      setInput('');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } finally { setSaving(false); }
  }

  return (
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.content, p.pageStyle]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets>
        <View style={styles.brandBar}>
          <V5Wordmark />
          <V5IconButton icon={icons.person} accessibilityLabel="Open your settings" onPress={() => router.push('/(tabs)/settings')} />
        </View>

        <View style={styles.hero}>
          <NeverEyebrow>YOUR MEMORY</NeverEyebrow>
          <Text accessibilityRole="header" style={[styles.heroTitle, p.heading, { color: p.label }]}>{greeting(now)}{firstName ? `,\n${firstName}.` : '.'}</Text>
          <Text style={[styles.heroBody, { color: p.secondary }]}>Everything worth remembering, ready when you need it.</Text>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Ask NEVER" onPress={() => router.push('/ask')} style={({ pressed }) => [styles.askHero, { backgroundColor: p.graphite, borderRadius: p.radius.card, opacity: pressed ? .86 : 1 }]}>
          <View style={styles.askTop}>
            <View style={[styles.askGlyph, { backgroundColor: p.fillSoft, borderRadius: p.radius.icon }]}><OneIcon name={icons.ask} size={19} color={p.onAccent} /></View>
            <Text style={[styles.askMeta, { color: p.onAccent }]}>RECALL WITH NEVER</Text>
          </View>
          <Text style={[styles.askTitle, { color: p.onAccent }]}>Ask anything you’ve saved.</Text>
          <Text style={[styles.askBody, { color: p.onAccent }]}>People, places, links, notes, plans — describe what you remember.</Text>
          <View style={styles.askAction}><Text style={[styles.askActionText, { color: p.onAccent }]}>Ask NEVER</Text><V5Chevron /></View>
        </Pressable>

        <View style={[styles.captureBar, p.inputStyle]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Start capture" onPress={() => captureRef.current?.focus()} style={[styles.captureIcon, { backgroundColor: p.graphite, borderRadius: p.radius.icon }]}><OneIcon name={icons.plus} size={18} color={p.onAccent} /></Pressable>
          <NeverInput ref={captureRef} value={input} onChangeText={setInput} editable={!saving} placeholder="Capture something…" placeholderTextColor={p.tertiary} style={[styles.captureInput, { color: p.label }]} returnKeyType="done" onSubmitEditing={save} />
          {saving ? <ActivityIndicator color={p.chrome} /> : input.trim() ? <Pressable accessibilityRole="button" accessibilityLabel="Save capture" onPress={save} style={[styles.captureIcon, { backgroundColor: p.graphite, borderRadius: p.radius.icon }]}><OneIcon name={icons.check} size={17} color={p.onAccent} /></Pressable> : null}
        </View>

        <View style={styles.shortcutRow}>
          <Shortcut icon={icons.scan} label="Scan" onPress={() => router.push('/scan')} />
          <Shortcut icon={icons.link} label="Link" onPress={() => { setInput('https://'); requestAnimationFrame(() => captureRef.current?.focus()); }} />
          <Shortcut icon={icons.upload} label="Share" onPress={() => router.push('/share')} />
        </View>

        {today.length ? <View style={styles.section}><V5SectionHeader title="Today" meta={`${today.length}`} />{today.map(({ item, reason }) => <MemoryRow key={item.id} item={item} meta={todayReasonLabel(reason)} />)}</View> : null}

        <View style={styles.section}>
          <V5SectionHeader title="Recent memory" action={<Pressable onPress={() => router.push('/(tabs)/saved')}><Text style={[styles.actionText, { color: p.chrome }]}>See All</Text></Pressable>} />
          {recent.length ? recent.map(item => <MemoryRow key={item.id} item={item} meta={shortDate(item.updatedAt)} />) : <View style={styles.empty}><Text style={[styles.emptyTitle, { color: p.label }]}>Your memory starts here.</Text><Text style={[styles.emptyBody, { color: p.secondary }]}>Capture a thought, link, date or document.</Text></View>}
        </View>
      </ScrollView>
    </NeverScreen>
  );
}

function Shortcut({ icon, label, onPress }: { icon: (typeof icons)[keyof typeof icons]; label: string; onPress: () => void }) {
  const p = useNeverV5Palette();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.shortcut, { opacity: pressed ? .55 : 1 }]}><View style={[styles.shortcutIcon, { backgroundColor: p.fillSoft, borderColor: p.border, borderRadius: p.radius.icon }]}><OneIcon name={icon} size={18} color={p.chrome} /></View><Text style={[styles.shortcutLabel, { color: p.secondary }]}>{label}</Text></Pressable>;
}

function MemoryRow({ item, meta }: { item: OneItem; meta: string }) {
  const p = useNeverV5Palette();
  return <Pressable onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.memoryRow, { borderBottomColor: p.border, opacity: pressed ? .62 : 1 }]}><View style={[styles.memoryIcon, { backgroundColor: p.fillSoft, borderRadius: p.radius.icon }]}><OneIcon name={iconForType(item.type)} size={17} color={p.chrome} /></View><View style={styles.memoryCopy}><Text numberOfLines={1} style={[styles.memoryTitle, { color: p.label }]}>{item.title}</Text><Text numberOfLines={1} style={[styles.memoryMeta, { color: p.secondary }]}>{meta}{item.summary ? ` · ${item.summary}` : ''}</Text></View><V5Chevron /></Pressable>;
}

function displayFirstName(metadata?: Record<string, unknown>) { const candidate = metadata && [metadata.first_name, metadata.full_name, metadata.name].find(v => typeof v === 'string' && v.trim()) as string | undefined; return candidate?.trim().split(/\s+/)[0]; }
function greeting(date: Date) { const h = date.getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
function shortDate(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(d); }

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { paddingHorizontal: 20, paddingBottom: 132 }, brandBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 54 },
  hero: { paddingTop: 30, paddingBottom: 28, maxWidth: 355 }, heroTitle: { fontSize: 42, lineHeight: 44, letterSpacing: -1.8, fontWeight: '650', marginTop: 8 }, heroBody: { fontSize: 16, lineHeight: 23, letterSpacing: -.15, marginTop: 12, maxWidth: 320 },
  askHero: { padding: 22, minHeight: 224, justifyContent: 'space-between' }, askTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, askGlyph: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, askMeta: { fontSize: 11, letterSpacing: 1.15, fontWeight: '700', opacity: .62 }, askTitle: { fontSize: 28, lineHeight: 31, letterSpacing: -.8, fontWeight: '650', marginTop: 26, maxWidth: 280 }, askBody: { fontSize: 14, lineHeight: 20, opacity: .64, maxWidth: 290, marginTop: 8 }, askAction: { marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, askActionText: { fontSize: 15, fontWeight: '650' },
  captureBar: { minHeight: 58, marginTop: 14, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 9 }, captureIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, captureInput: { flex: 1, fontSize: 16, minHeight: 46, paddingVertical: 0 },
  shortcutRow: { flexDirection: 'row', gap: 26, paddingHorizontal: 6, paddingTop: 14, paddingBottom: 8 }, shortcut: { alignItems: 'center', gap: 6 }, shortcutIcon: { width: 42, height: 42, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' }, shortcutLabel: { fontSize: 11, fontWeight: '600' },
  section: { marginTop: 32 }, actionText: { fontSize: 14, fontWeight: '600' }, memoryRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth }, memoryIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, memoryCopy: { flex: 1, minWidth: 0 }, memoryTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -.15 }, memoryMeta: { fontSize: 12, marginTop: 4 }, empty: { paddingVertical: 24 }, emptyTitle: { fontSize: 17, fontWeight: '600' }, emptyBody: { fontSize: 14, lineHeight: 20, marginTop: 5 }
});
