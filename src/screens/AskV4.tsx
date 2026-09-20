import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { usePlan } from '@/src/context/PlanContext';
import { answerFromRetrievedItems } from '@/src/recall/service';
import { retrieveOneItems } from '@/src/search/retrieve';
import { searchSemantically } from '@/src/search/semantic';
import { iconForType } from '@/src/ui/OneItemRow';
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverWordmark } from '@/src/ui/never';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  title?: string;
  body?: string;
  meta?: string;
  sourceIds?: string[];
  mode?: 'ai' | 'deterministic';
};

const examples = [
  { label: 'Today', text: 'What did I save today?', icon: icons.clock },
  { label: 'Ideas', text: 'What gift ideas did I save for Papa?', icon: icons.idea },
  { label: 'Links', text: 'Show my links about Studium', icon: icons.link },
  { label: 'Dates', text: 'When was the dentist appointment?', icon: icons.calendar }
];

export default function AskV4() {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  const { q } = useLocalSearchParams<{ q?: string }>();
  const { session } = useAuth();
  const { items } = useItems();
  const { hasAi } = usePlan();
  const scrollRef = useRef<ScrollView>(null);
  const [query, setQuery] = useState(typeof q === 'string' ? q : '');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const previousSourceIds = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === 'assistant' && message.sourceIds?.length) return message.sourceIds;
    }
    return [];
  }, [messages]);

  async function submitQuestion(value = query) {
    const clean = value.trim();
    if (!clean || sending) return;
    await Haptics.selectionAsync();
    setMessages((current) => [...current, { id: makeId('user'), role: 'user', text: clean }]);
    setQuery('');
    setSending(true);
    try {
      const retrieval = await retrieveOneItems(clean, items, { limit: 12, semanticSearch: session?.user.id ? searchSemantically : undefined });
      const answer = await answerFromRetrievedItems({ query: clean, retrieval: retrieval.results, allItems: items, previousSourceIds, allowAI: Boolean(session?.user.id) });
      setMessages((current) => [...current, {
        id: makeId('assistant'),
        role: 'assistant',
        title: answer.title,
        body: answer.body,
        meta: [answer.meta, retrieval.semanticError ? 'Semantic search unavailable' : undefined].filter(Boolean).join(' · '),
        sourceIds: answer.sourceIds,
        mode: answer.mode
      }]);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    } finally {
      setSending(false);
    }
  }

  if (!hasAi) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.lockedWrap}>
          <NeverWordmark />
          <View style={[styles.lockedCard, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}>
            <View style={[styles.lockedIcon, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.crown} size={21} color={theme.chrome} /></View>
            <Text style={[styles.lockedEyebrow, { color: theme.textTertiary }]}>NEVER AI</Text>
            <Text style={[styles.lockedTitle, { color: theme.text }]}>Ask your memory.</Text>
            <Text style={[styles.lockedBody, { color: theme.textSecondary }]}>Grounded conversational recall over the information you saved in NEVER.</Text>
            <Pressable onPress={() => router.push('/upgrade')} style={({ pressed }) => [styles.lockedPrimary, { backgroundColor: dark ? '#E8ECEF' : '#171B20', opacity: pressed ? 0.75 : 1 }]}>
              <Text style={[styles.lockedPrimaryText, { color: dark ? '#11161B' : '#FFFFFF' }]}>View NEVER AI</Text>
              <OneIcon name={icons.chevron} size={11} color={dark ? '#11161B' : '#FFFFFF'} />
            </Pressable>
          </View>
          <Pressable onPress={() => router.back()} style={styles.backText}><OneIcon name={icons.chevronLeft} size={12} color={theme.textTertiary} /><Text style={[styles.backTextLabel, { color: theme.textSecondary }]}>Back</Text></Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={4}>
        <View style={styles.shell}>
          <View style={styles.nav}>
            <Pressable onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}><OneIcon name={icons.chevronLeft} size={16} color={theme.text} /></Pressable>
            <NeverWordmark compact />
            {messages.length ? <Pressable onPress={() => setMessages([])} style={[styles.navButton, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}><OneIcon name={icons.close} size={13} color={theme.textSecondary} /></Pressable> : <View style={{ width: 40 }} />}
          </View>

          <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={messages.length ? styles.chatContent : styles.emptyContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {!messages.length ? (
              <>
                <View style={[styles.heroCard, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
                  <View style={styles.heroTopLine}>
                    <View style={[styles.heroIcon, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.ask} size={18} color={theme.chrome} /></View>
                    <View style={[styles.groundedPill, { backgroundColor: theme.platinumSoft }]}><View style={[styles.groundedDot, { backgroundColor: theme.chrome }]} /><Text style={[styles.groundedText, { color: theme.textTertiary }]}>GROUNDED</Text></View>
                  </View>
                  <Text style={[styles.heroEyebrow, { color: theme.textTertiary }]}>MEMORY INTELLIGENCE</Text>
                  <Text style={[styles.heroTitle, { color: theme.text }]}>Ask what you saved.</Text>
                  <Text style={[styles.heroBody, { color: theme.textSecondary }]}>NEVER retrieves your own memory first, then answers only from that evidence.</Text>
                </View>

                <View style={styles.promptSection}>
                  <View style={styles.promptHeader}>
                    <View><Text style={[styles.promptEyebrow, { color: theme.textTertiary }]}>START HERE</Text><Text style={[styles.promptTitle, { color: theme.text }]}>Try a question</Text></View>
                    <OneIcon name={icons.shield} size={14} color={theme.chrome} />
                  </View>
                  <View style={styles.promptGrid}>
                    {examples.map((example) => (
                      <Pressable key={example.text} onPress={() => submitQuestion(example.text)} style={({ pressed }) => [styles.promptCard, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, opacity: pressed ? 0.7 : 1 }]}>
                        <View style={[styles.promptIcon, { backgroundColor: theme.platinumSoft }]}><OneIcon name={example.icon} size={14} color={theme.chrome} /></View>
                        <Text style={[styles.promptLabel, { color: theme.textTertiary }]}>{example.label.toUpperCase()}</Text>
                        <Text style={[styles.promptText, { color: theme.text }]} numberOfLines={3}>{example.text}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={[styles.privacy, { borderColor: theme.border }]}>
                  <OneIcon name={icons.shield} size={14} color={theme.chrome} />
                  <Text style={[styles.privacyText, { color: theme.textSecondary }]}>If your saved evidence is not enough, NEVER should say so instead of inventing an answer.</Text>
                </View>
              </>
            ) : messages.map((message) => <MessageBubble key={message.id} message={message} />)}

            {sending ? <View style={[styles.thinking, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}><ActivityIndicator size="small" color={theme.chrome} /><Text style={[styles.thinkingText, { color: theme.textSecondary }]}>Retrieving your memory…</Text></View> : null}
          </ScrollView>

          <View style={[styles.composerWrap, { backgroundColor: theme.background }]}>
            <View style={[styles.composer, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
              <View style={[styles.composerIcon, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.ask} size={13} color={theme.chrome} /></View>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={messages.length ? 'Ask a follow-up…' : 'Ask anything you saved…'}
                placeholderTextColor={theme.textTertiary}
                style={[styles.input, { color: theme.text }]}
                multiline
                maxLength={800}
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={() => submitQuestion()}
              />
              <Pressable disabled={!query.trim() || sending} onPress={() => submitQuestion()} style={[styles.send, { backgroundColor: query.trim() && !sending ? theme.chrome : theme.platinumSoft, opacity: sending ? 0.6 : 1 }]}>
                <OneIcon name={icons.upload} size={14} color={query.trim() && !sending ? theme.background : theme.textTertiary} />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function MessageBubble({ message }: { message: ChatMessage }) {
    if (message.role === 'user') {
      return <View style={[styles.userCard, { backgroundColor: dark ? '#E8ECEF' : '#171B20' }]}><Text style={[styles.userLabel, { color: dark ? '#69747D' : '#99A3AC' }]}>YOU</Text><Text style={[styles.userText, { color: dark ? '#11161B' : '#FFFFFF' }]}>{message.text}</Text></View>;
    }

    const sources = (message.sourceIds || []).map((id) => itemById.get(id)).filter((item): item is OneItem => Boolean(item)).slice(0, 6);
    const answerUrls = extractHttpUrls(message.body);
    const bodyText = withoutStandaloneUrlLines(message.body);

    return (
      <View style={[styles.assistantCard, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}>
        <View style={styles.answerHeader}><View style={[styles.answerMark, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.ask} size={12} color={theme.chrome} /></View><Text style={[styles.answerBrand, { color: theme.text }]}>NEVER</Text><Text style={[styles.answerMode, { color: theme.textTertiary }]}>{message.mode === 'ai' ? 'SYNTHESIZED' : 'GROUNDED'}</Text></View>
        {message.title ? <Text style={[styles.answerTitle, { color: theme.text }]}>{message.title}</Text> : null}
        {bodyText ? <Text style={[styles.answerBody, { color: theme.textSecondary }]}>{bodyText}</Text> : null}
        {answerUrls.length ? <View style={styles.links}>{answerUrls.map((url) => <Pressable key={url} onPress={async () => { await Haptics.selectionAsync(); await Linking.openURL(url); }} style={[styles.linkRow, { borderTopColor: theme.border }]}><OneIcon name={icons.link} size={13} color={theme.chrome} /><Text style={[styles.linkText, { color: theme.textSecondary }]} numberOfLines={1}>{url}</Text><OneIcon name={icons.chevron} size={11} color={theme.textTertiary} /></Pressable>)}</View> : null}
        {message.meta ? <Text style={[styles.answerMeta, { color: theme.textTertiary }]}>{message.meta}</Text> : null}
        {sources.length ? <View style={[styles.sources, { borderTopColor: theme.border }]}><Text style={[styles.sourcesLabel, { color: theme.textTertiary }]}>SOURCES</Text>{sources.map((item, index) => <Pressable key={item.id} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={[styles.sourceRow, index !== sources.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}><View style={[styles.sourceIcon, { backgroundColor: theme.platinumSoft }]}><OneIcon name={iconForType(item.type)} size={13} color={theme.chrome} /></View><Text style={[styles.sourceTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text><OneIcon name={icons.chevron} size={11} color={theme.textTertiary} /></Pressable>)}</View> : null}
      </View>
    );
  }
}

function extractHttpUrls(value?: string) {
  if (!value) return [];
  return Array.from(new Set((value.match(/https?:\/\/[^\s<>"')\]}]+/gi) || []).map((url) => url.replace(/[.,;:!?]+$/g, ''))));
}
function withoutStandaloneUrlLines(value?: string) {
  if (!value) return undefined;
  const remaining = value.split('\n').filter((line) => !/^https?:\/\/\S+$/i.test(line.trim())).join('\n').trim();
  return remaining || undefined;
}
function makeId(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

const styles = StyleSheet.create({
  safe: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  nav: { minHeight: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, gap: 16 },
  emptyContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28, gap: 24 },
  heroCard: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 18, shadowOpacity: 0.07, shadowRadius: 22, shadowOffset: { width: 0, height: 9 }, elevation: 3 },
  heroTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  groundedPill: { height: 25, paddingHorizontal: 9, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 5 },
  groundedDot: { width: 5, height: 5, borderRadius: 3 },
  groundedText: { fontSize: 7.2, fontWeight: '800', letterSpacing: 0.9 },
  heroEyebrow: { marginTop: 18, fontSize: 8.2, lineHeight: 11, fontWeight: '800', letterSpacing: 1.6 },
  heroTitle: { marginTop: 6, fontSize: 29, lineHeight: 33, fontWeight: '700', letterSpacing: -0.9 },
  heroBody: { marginTop: 8, maxWidth: 470, fontSize: 12.4, lineHeight: 18 },
  promptSection: { gap: 12 },
  promptHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  promptEyebrow: { fontSize: 8, lineHeight: 10, fontWeight: '800', letterSpacing: 1.5 },
  promptTitle: { marginTop: 4, fontSize: 19, lineHeight: 23, fontWeight: '700', letterSpacing: -0.4 },
  promptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  promptCard: { width: '48.7%', minHeight: 126, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  promptIcon: { width: 35, height: 35, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  promptLabel: { marginTop: 12, fontSize: 7.3, fontWeight: '800', letterSpacing: 0.8 },
  promptText: { marginTop: 5, fontSize: 12.3, lineHeight: 17, fontWeight: '600' },
  privacy: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  privacyText: { flex: 1, fontSize: 10.7, lineHeight: 15.5 },
  thinking: { minHeight: 58, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  thinkingText: { fontSize: 11.5 },
  userCard: { alignSelf: 'flex-end', maxWidth: '84%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  userLabel: { fontSize: 7.3, fontWeight: '800', letterSpacing: 0.9, marginBottom: 5 },
  userText: { fontSize: 13.5, lineHeight: 19 },
  assistantCard: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingTop: 15, overflow: 'hidden' },
  answerHeader: { paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 7 },
  answerMark: { width: 29, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  answerBrand: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  answerMode: { marginLeft: 'auto', fontSize: 7.2, fontWeight: '800', letterSpacing: 0.75 },
  answerTitle: { paddingHorizontal: 15, marginTop: 12, fontSize: 18.5, lineHeight: 23, fontWeight: '700' },
  answerBody: { paddingHorizontal: 15, marginTop: 7, fontSize: 12.5, lineHeight: 18.5 },
  links: { marginTop: 11 },
  linkRow: { minHeight: 50, paddingHorizontal: 15, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkText: { flex: 1, fontSize: 10.6, lineHeight: 14 },
  answerMeta: { paddingHorizontal: 15, marginTop: 10, fontSize: 9.2, lineHeight: 13 },
  sources: { marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 7 },
  sourcesLabel: { fontSize: 7.8, fontWeight: '800', letterSpacing: 1, marginBottom: 3 },
  sourceRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceIcon: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  sourceTitle: { flex: 1, fontSize: 11.5, lineHeight: 15, fontWeight: '600' },
  composerWrap: { paddingHorizontal: 20, paddingTop: 9, paddingBottom: 8 },
  composer: { minHeight: 56, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, paddingLeft: 8, paddingRight: 7, flexDirection: 'row', alignItems: 'flex-end', gap: 8, shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  composerIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  input: { flex: 1, minHeight: 49, maxHeight: 120, fontSize: 13.8, lineHeight: 19, paddingTop: 14, paddingBottom: 11 },
  send: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  lockedWrap: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', padding: 24, justifyContent: 'center', gap: 18 },
  lockedCard: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  lockedIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lockedEyebrow: { marginTop: 18, fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  lockedTitle: { marginTop: 6, fontSize: 27, lineHeight: 31, fontWeight: '700', letterSpacing: -0.8 },
  lockedBody: { marginTop: 8, fontSize: 12.5, lineHeight: 18 },
  lockedPrimary: { minHeight: 48, marginTop: 20, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lockedPrimaryText: { fontSize: 12.5, fontWeight: '700' },
  backText: { alignSelf: 'flex-start', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5 },
  backTextLabel: { fontSize: 11.5, fontWeight: '600' }
});