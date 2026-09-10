import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useItems } from '@/src/context/ItemsContext';
import { parseQuickCapture } from '@/src/parser/quickCapture';
import { OneItemRow } from '@/src/ui/OneItemRow';
import { EmptyState, IconTile, PageHeader, PrimaryButton, RoundIconButton, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

export default function InboxScreen() {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const { items, add, toggleCompleted } = useItems();
  const parsed = useMemo(() => parseQuickCapture(input), [input]);

  const todayIso = toIsoDate(new Date());
  const active = items.filter((item) => !item.completed);
  const today = active.filter((item) => item.date === todayIso || (!item.date && !item.saved));
  const upcoming = active.filter((item) => item.date && item.date > todayIso && !item.saved).sort(sortByDateTime).slice(0, 5);
  const saved = active.filter((item) => item.saved || ['link', 'idea', 'shopping', 'travel'].includes(item.type)).slice(0, 4);

  async function handleSave() {
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
    await add(item);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInput('');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <PageHeader
          title="Inbox"
          subtitle="A calmer mind. A fuller life."
          action={<RoundIconButton icon={icons.person} onPress={() => router.push('/(tabs)/settings')} accessibilityLabel="Open settings" />}
        />

        <View style={[styles.capture, { backgroundColor: theme.surface, borderColor: parsed ? theme.accent : theme.border }]}>
          <IconTile icon={icons.plus} size={36} />
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.textTertiary}
            style={[styles.input, { color: theme.text }]}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            accessibilityLabel="Quick capture"
            accessibilityHint="Type a task, reminder, appointment, note, link or idea"
          />
          <RoundIconButton icon={icons.ask} onPress={() => router.push('/ask')} accessibilityLabel="Ask ONE" filled />
        </View>

        <View style={styles.quickActions} accessibilityRole="toolbar">
          <QuickAction label="Scan" icon={icons.scan} hint="Scan a receipt or document" onPress={() => router.push('/scan')} />
          <QuickAction label="Share" icon={icons.upload} hint="Learn how to share content to ONE" onPress={() => router.push('/share')} />
          <QuickAction label="Ask" icon={icons.ask} hint="Open ONE AI conversation" badge="AI" onPress={() => router.push('/ask')} />
        </View>

        {parsed ? (
          <View style={styles.block}>
            <SectionHeader title="ONE understood" meta={`${Math.round(parsed.confidence * 100)}%`} />
            <Surface>
              <View style={styles.interpretationTop}>
                <IconTile icon={iconForParsedType(parsed.type)} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.interpretationTitle, { color: theme.text }]} numberOfLines={2}>{parsed.title || input}</Text>
                  <Text style={[styles.interpretationMeta, { color: theme.textSecondary }]}>
                    {[labelForType(parsed.type), parsed.dateLabel, parsed.time].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </View>
              <View style={[styles.chipsRow, { borderTopColor: theme.border }]}>
                <Chip label={parsed.category || 'General'} />
                {parsed.dateLabel ? <Chip label={parsed.dateLabel} /> : null}
                {parsed.time ? <Chip label={parsed.time} /> : null}
              </View>
              <View style={styles.saveWrap}>
                <PrimaryButton label="Save to ONE" icon={icons.check} onPress={handleSave} />
              </View>
            </Surface>
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Today" meta={String(today.length)} />
          <Surface>
            {today.length
              ? today.map((item) => <OneItemRow key={item.id} item={item} onToggle={toggleCompleted} showDate={false} />)
              : <EmptyState icon={icons.check} title="Clear for today" body="Anything you capture without a date will appear here." />}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader
            title="Upcoming"
            meta={String(upcoming.length)}
            action={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open calendar"
                onPress={() => router.push('/(tabs)/calendar')}
              >
                <Text style={[styles.textAction, { color: theme.accent }]}>Calendar</Text>
              </Pressable>
            }
          />
          <Surface>
            {upcoming.length
              ? upcoming.map((item) => <OneItemRow key={item.id} item={item} onToggle={toggleCompleted} />)
              : <EmptyState icon={icons.calendar} title="Nothing scheduled" body="Dated tasks and appointments will show up here." />}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader
            title="Recently saved"
            meta={String(saved.length)}
            action={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View all saved items"
                onPress={() => router.push('/(tabs)/saved')}
              >
                <Text style={[styles.textAction, { color: theme.accent }]}>View all</Text>
              </Pressable>
            }
          />
          <Surface>
            {saved.length
              ? saved.map((item) => <OneItemRow key={item.id} item={item} />)
              : <EmptyState icon={icons.saved} title="Your memory is empty" body="Links, ideas, travel and shared screenshots collect here." />}
          </Surface>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function QuickAction({
    label,
    icon,
    onPress,
    badge,
    hint
  }: {
    label: string;
    icon: (typeof icons)[keyof typeof icons];
    onPress: () => void;
    badge?: string;
    hint?: string;
  }) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={badge ? `${label}, ${badge}` : label}
        accessibilityHint={hint}
        onPress={async () => {
          await Haptics.selectionAsync();
          onPress();
        }}
        style={({ pressed }) => [
          styles.quickAction,
          { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }
        ]}
      >
        <IconTile icon={icon} tone="neutral" size={34} />
        <Text style={[styles.quickLabel, { color: theme.text }]}>{label}</Text>
        {badge ? (
          <View style={[styles.aiBadge, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.aiBadgeText, { color: theme.accent }]}>{badge}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }

  function Chip({ label }: { label: string }) {
    return (
      <View style={[styles.chip, { backgroundColor: theme.fill }]}>
        <Text style={[styles.chipText, { color: theme.textSecondary }]}>{label}</Text>
      </View>
    );
  }
}

function iconForParsedType(type: OneItem['type']) {
  if (type === 'appointment') return icons.appointment;
  if (type === 'reminder') return icons.reminder;
  if (type === 'link') return icons.link;
  if (type === 'idea') return icons.idea;
  if (type === 'travel') return icons.travel;
  return icons.task;
}

function labelForType(type: string) { return type.charAt(0).toUpperCase() + type.slice(1); }
function sortByDateTime(a: OneItem, b: OneItem) { return `${a.date}T${a.time || '23:59'}`.localeCompare(`${b.date}T${b.time || '23:59'}`); }
function toIsoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  capture: { minHeight: 64, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingLeft: 10, paddingRight: 8, gap: 10 },
  input: { flex: 1, fontSize: 16, letterSpacing: -0.15 },
  block: { gap: 10 },
  quickActions: { flexDirection: 'row', gap: 8 },
  quickAction: { flex: 1, minHeight: 52, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  quickLabel: { flex: 1, fontSize: 12.5, fontWeight: '700' },
  aiBadge: { minHeight: 20, borderRadius: 7, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  aiBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  interpretationTop: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  interpretationTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  interpretationMeta: { fontSize: 12.5, marginTop: 4 },
  chipsRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingTop: 12, flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  chip: { minHeight: 28, paddingHorizontal: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontSize: 11.5, fontWeight: '600' },
  saveWrap: { padding: 14 },
  textAction: { fontSize: 13, fontWeight: '700' }
});
