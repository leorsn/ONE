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
import {
  V5Chevron,
  V5Group,
  V5IconButton,
  V5LargeHeader,
  V5SectionHeader,
  V5Wordmark,
  useNeverV5Palette
} from '@/src/ui/appleV5';
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
  { text: 'What did I save today?', icon: icons.clock },
  { text: 'What gift ideas did I save for Papa?', icon: icons.idea },
  { text: 'Show my links about Studium', icon: icons.link },
  { text: 'When was the dentist appointment?', icon: icons.calendar }
];

export default function AskV5() {
  const p = useNeverV5Palette();
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
      const retrieval = await retrieveOneItems(clean, items, {
        limit: 12,
        semanticSearch: session?.user.id ? searchSemantically : undefined
      });
      const answer = await answerFromRetrievedItems({
        query: clean,
        retrieval: retrieval.results,
        allItems: items,
        previousSourceIds,
        allowAI: Boolean(session?.user.id)
      });
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
      <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom']}>
        <View style={styles.lockedPage}>
          <View style={styles.lockedTop}><V5Wordmark /></View>
          <V5LargeHeader title="Ask NEVER" subtitle="Grounded conversational recall over the information you saved." />
          <V5Group>
            <View style={styles.lockedBody}>
              <View style={[styles.lockedIcon, { backgroundColor: p.fillSoft }]}>
                <OneIcon name={icons.crown} size={21} color={p.chrome} />
              </View>
              <Text style={[styles.lockedTitle, { color: p.label }]}>NEVER AI</Text>
              <Text style={[styles.lockedText, { color: p.secondary }]}>Ask questions about your saved documents, links, dates and ideas.</Text>
              <Pressable onPress={() => router.push('/upgrade')} style={({ pressed }) => [styles.primaryButton, { backgroundColor: p.graphite, opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.primaryButtonText, { color: p.dark ? '#111113' : '#FFFFFF' }]}>View NEVER AI</Text>
              </Pressable>
            </View>
          </V5Group>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <OneIcon name={icons.chevronLeft} size={11.5} color={p.secondary} />
            <Text style={[styles.backLinkText, { color: p.secondary }]}>Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={4}>
        <View style={styles.shell}>
          <View style={[styles.nav, { borderBottomColor: p.separator }]}>
            <V5IconButton icon={icons.chevronLeft} accessibilityLabel="Go back" onPress={() => router.back()} />
            <Text style={[styles.navTitle, { color: p.label }]}>Ask NEVER</Text>
            {messages.length ? <V5IconButton icon={icons.close} accessibilityLabel="Clear conversation" onPress={() => setMessages([])} /> : <View style={{ width: 38 }} />}
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.chat}
            contentContainerStyle={messages.length ? styles.chatContent : styles.emptyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!messages.length ? (
              <>
                <V5LargeHeader
                  title="Ask your memory."
                  subtitle="NEVER searches what you've saved first and answers from the evidence it finds."
                />

                <View style={styles.groundedInline}>
                  <View style={[styles.groundedIcon, { backgroundColor: p.fillSoft }]}>
                    <OneIcon name={icons.shield} size={15} color={p.chrome} />
                  </View>
                  <Text style={[styles.groundedText, { color: p.secondary }]}>Grounded by design. If the saved evidence is not enough, NEVER should say so.</Text>
                </View>

                <View style={styles.section}>
                  <V5SectionHeader title="Try Asking" />
                  <V5Group>
                    {examples.map((example, index) => (
                      <Pressable key={example.text} onPress={() => submitQuestion(example.text)} style={({ pressed }) => [styles.suggestionRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
                        <View style={[styles.suggestionIcon, { backgroundColor: p.fillSoft }]}>
                          <OneIcon name={example.icon} size={15} color={p.chrome} />
                        </View>
                        <View style={[styles.suggestionContent, index !== examples.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}>
                          <Text style={[styles.suggestionText, { color: p.label }]}>{example.text}</Text>
                          <V5Chevron />
                        </View>
                      </Pressable>
                    ))}
                  </V5Group>
                </View>
              </>
            ) : messages.map((message) => <MessageBubble key={message.id} message={message} />)}

            {sending ? (
              <View style={styles.assistantBlock}>
                <View style={styles.assistantHeader}>
                  <View style={[styles.assistantMark, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.ask} size={12.5} color={p.chrome} /></View>
                  <Text style={[styles.assistantBrand, { color: p.secondary }]}>NEVER</Text>
                </View>
                <View style={styles.loadingLine}>
                  <ActivityIndicator size="small" color={p.chrome} />
                  <Text style={[styles.loadingText, { color: p.secondary }]}>Looking through your memory…</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.composerWrap, { backgroundColor: p.canvas, borderTopColor: p.separator }]}>
            <View style={[styles.composer, { backgroundColor: p.surface }]}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={messages.length ? 'Ask a follow-up' : 'Ask anything you saved'}
                placeholderTextColor={p.tertiary}
                style={[styles.input, { color: p.label }]}
                multiline
                maxLength={800}
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={() => submitQuestion()}
              />
              <Pressable
                disabled={!query.trim() || sending}
                onPress={() => submitQuestion()}
                style={[styles.sendButton, { backgroundColor: query.trim() && !sending ? p.graphite : p.fill, opacity: sending ? 0.5 : 1 }]}
              >
                <OneIcon name={icons.upload} size={13.5} color={query.trim() && !sending ? (p.dark ? '#111113' : '#FFFFFF') : p.tertiary} />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function MessageBubble({ message }: { message: ChatMessage }) {
    if (message.role === 'user') {
      return <View style={[styles.userBubble, { backgroundColor: p.fill }]}><Text style={[styles.userText, { color: p.label }]}>{message.text}</Text></View>;
    }

    const sources = (message.sourceIds || []).map((id) => itemById.get(id)).filter((item): item is OneItem => Boolean(item)).slice(0, 6);
    const answerUrls = extractHttpUrls(message.body);
    const bodyText = withoutStandaloneUrlLines(message.body);

    return (
      <View style={styles.assistantBlock}>
        <View style={styles.assistantHeader}>
          <View style={[styles.assistantMark, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.ask} size={12.5} color={p.chrome} /></View>
          <Text style={[styles.assistantBrand, { color: p.secondary }]}>NEVER</Text>
          {message.mode ? <Text style={[styles.modeLabel, { color: p.tertiary }]}>{message.mode === 'ai' ? 'SYNTHESIZED' : 'GROUNDED'}</Text> : null}
        </View>

        {message.title ? <Text style={[styles.answerTitle, { color: p.label }]}>{message.title}</Text> : null}
        {bodyText ? <Text style={[styles.answerBody, { color: p.label }]}>{bodyText}</Text> : null}
        {message.meta ? <Text style={[styles.answerMeta, { color: p.tertiary }]}>{message.meta}</Text> : null}

        {answerUrls.length ? (
          <V5Group>
            {answerUrls.map((url, index) => (
              <Pressable key={url} onPress={async () => { await Haptics.selectionAsync(); await Linking.openURL(url); }} style={({ pressed }) => [styles.linkRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
                <OneIcon name={icons.link} size={13.5} color={p.chrome} />
                <View style={[styles.linkContent, index !== answerUrls.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}>
                  <Text style={[styles.linkText, { color: p.label }]} numberOfLines={1}>{url}</Text>
                  <V5Chevron />
                </View>
              </Pressable>
            ))}
          </V5Group>
        ) : null}

        {sources.length ? (
          <View style={styles.section}>
            <V5SectionHeader title="Sources" meta={`${sources.length}`} />
            <V5Group>
              {sources.map((item, index) => (
                <Pressable key={item.id} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.sourceRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
                  <View style={[styles.sourceIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={iconForType(item.type)} size={14.5} color={p.chrome} /></View>
                  <View style={[styles.sourceContent, index !== sources.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}>
                    <Text style={[styles.sourceTitle, { color: p.label }]} numberOfLines={1}>{item.title}</Text>
                    <V5Chevron />
                  </View>
                </Pressable>
              ))}
            </V5Group>
          </View>
        ) : null}
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
  nav: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  navTitle: { fontSize: 16.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.18 },
  chat: { flex: 1 },
  emptyContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 18 },
  chatContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24, gap: 21 },
  section: { gap: 7 },
  groundedInline: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
  groundedIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groundedText: { flex: 1, fontSize: 12.5, lineHeight: 17 },
  suggestionRow: { minHeight: 56, paddingLeft: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  suggestionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  suggestionContent: { flex: 1, minHeight: 56, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  suggestionText: { flex: 1, fontSize: 14.5, lineHeight: 18, fontWeight: '500' },
  userBubble: { alignSelf: 'flex-end', maxWidth: '84%', borderRadius: 18, borderBottomRightRadius: 6, paddingHorizontal: 13, paddingVertical: 9 },
  userText: { fontSize: 14.5, lineHeight: 20 },
  assistantBlock: { gap: 9 },
  assistantHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  assistantMark: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  assistantBrand: { fontSize: 11.5, lineHeight: 14, fontWeight: '700', letterSpacing: 0.65 },
  modeLabel: { marginLeft: 'auto', fontSize: 9.5, lineHeight: 12, fontWeight: '600', letterSpacing: 0.45 },
  answerTitle: { fontSize: 19, lineHeight: 24, fontWeight: '700', letterSpacing: -0.3 },
  answerBody: { fontSize: 14.5, lineHeight: 21 },
  answerMeta: { fontSize: 10.5, lineHeight: 14 },
  loadingLine: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 13.5, lineHeight: 17 },
  linkRow: { minHeight: 50, paddingLeft: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  linkContent: { flex: 1, minHeight: 50, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  linkText: { flex: 1, fontSize: 12.5, lineHeight: 16 },
  sourceRow: { minHeight: 54, paddingLeft: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sourceContent: { flex: 1, minHeight: 54, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceTitle: { flex: 1, fontSize: 14.5, lineHeight: 18, fontWeight: '500' },
  composerWrap: { paddingHorizontal: 10, paddingTop: 7, paddingBottom: 7, borderTopWidth: StyleSheet.hairlineWidth },
  composer: { minHeight: 48, borderRadius: 16, paddingLeft: 14, paddingRight: 5, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 44, maxHeight: 112, fontSize: 15.5, lineHeight: 20, paddingTop: 11, paddingBottom: 10 },
  sendButton: { width: 36, height: 36, borderRadius: 18, marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
  lockedPage: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', padding: 20, gap: 18 },
  lockedTop: { minHeight: 28, justifyContent: 'center' },
  lockedBody: { padding: 16 },
  lockedIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  lockedTitle: { marginTop: 12, fontSize: 18, lineHeight: 22, fontWeight: '700' },
  lockedText: { marginTop: 3, fontSize: 13.5, lineHeight: 19 },
  primaryButton: { marginTop: 16, minHeight: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  backLink: { alignSelf: 'flex-start', minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 4 },
  backLinkText: { fontSize: 13.5, lineHeight: 17, fontWeight: '500' }
});