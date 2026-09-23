import { goBackOrHome } from '@/src/ui/navigation';
import { openMemoryLink } from '@/src/ui/openLink';
import { NeverNotice } from '@/src/ui/NeverNotice';
import { MemoryRow } from '@/src/ui/MemoryRow';
import { useReducedMotion } from '@/src/ui/material';
import { NeverInput } from '@/src/ui/NeverInput';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { usePlan } from '@/src/context/PlanContext';
import { answerFromRetrievedItems } from '@/src/recall/service';
import { retrieveOneItems } from '@/src/search/retrieve';
import { searchSemantically } from '@/src/search/semantic';
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverEyebrow, NeverHeroSurface, NeverMetric } from '@/src/ui/neverVisual';
import {
  V5Chevron,
  V5Group,
  V5IconButton,
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
  const sendingRef = useRef(false);
  const requestVersion = useRef(0);
  useEffect(() => () => { requestVersion.current += 1; }, []);
  const nearBottom = useRef(true);
  const reducedMotion = useReducedMotion();
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const previousSourceIds = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === 'assistant' && message.sourceIds?.length) return message.sourceIds;
    }
    return [];
  }, [messages]);

  async function submitQuestion(value = query, retry = false) {
    const clean = value.trim();
    if (!clean || sendingRef.current) return;
    sendingRef.current = true;
    const version = ++requestVersion.current;
    nearBottom.current = true;
    setFailedQuestion(null);
    void Haptics.selectionAsync().catch(() => undefined);
    if (!retry) setMessages((current) => [...current, { id: makeId('user'), role: 'user', text: clean }]);
    setQuery('');
    setSending(true);
    try {
      const retrieval = await retrieveOneItems(clean, items, {
        limit: 12,
        semanticSearch: session?.user.id ? searchSemantically : undefined
      });
      if (version !== requestVersion.current) return;
      const answer = await answerFromRetrievedItems({
        query: clean,
        retrieval: retrieval.results,
        allItems: items,
        previousSourceIds,
        allowAI: Boolean(session?.user.id)
      });
      if (version !== requestVersion.current) return;
      setMessages((current) => [...current, {
        id: makeId('assistant'),
        role: 'assistant',
        title: answer.title,
        body: answer.body,
        meta: [answer.meta, retrieval.semanticError ? 'Semantic search unavailable' : undefined].filter(Boolean).join(' · '),
        sourceIds: answer.sourceIds,
        mode: answer.mode
      }]);
      requestAnimationFrame(() => { if (nearBottom.current) scrollRef.current?.scrollToEnd({ animated: !reducedMotion }); });
    } catch {
      if (version === requestVersion.current) setFailedQuestion(clean);
    } finally {
      if (version === requestVersion.current) { sendingRef.current = false; setSending(false); }
    }
  }

  if (!hasAi) {
    return (
      <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.lockedPage} showsVerticalScrollIndicator={false}>
          <View style={styles.lockedTop}>
            <V5Wordmark />
            <V5IconButton icon={icons.chevronLeft} accessibilityLabel="Go back" onPress={() => goBackOrHome()} />
          </View>
          <View style={styles.lockedHeroCopy}>
            <NeverEyebrow>Grounded recall</NeverEyebrow>
            <Text style={[styles.heroTitle, p.heading, { color: p.label }]}>Ask NEVER.</Text>
            <Text style={[styles.heroSubtitle, { color: p.secondary }]}>Turn your saved memory into direct, evidence-backed answers.</Text>
          </View>
          <NeverHeroSurface style={styles.lockedStage}>
            <View style={[styles.lockedIcon, { borderRadius: p.radius.icon, backgroundColor: p.graphite }]}>
              <OneIcon name={icons.crown} size={22} color={p.onAccent} />
            </View>
            <NeverEyebrow>NEVER AI</NeverEyebrow>
            <Text style={[styles.lockedTitle, { color: p.label }]}>Your memory, conversational.</Text>
            <Text style={[styles.lockedText, { color: p.secondary }]}>Ask questions about saved documents, links, dates and ideas. NEVER searches your own evidence first.</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/upgrade')} style={({ pressed }) => [styles.primaryButton, { borderRadius: p.radius.button, backgroundColor: p.graphite, opacity: pressed ? 0.7 : 1 }]}>
              <Text style={[styles.primaryButtonText, { color: p.onAccent }]}>View NEVER AI</Text>
            </Pressable>
          </NeverHeroSurface>
        </ScrollView>
      </NeverScreen>
    );
  }

  return (
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={4}>
        <View style={styles.shell}>
          <View style={[styles.nav, { borderBottomColor: p.separator }]}>
            <V5IconButton icon={icons.chevronLeft} accessibilityLabel="Go back" onPress={() => goBackOrHome()} />
            <View style={styles.navBrand}>
              <Text style={[styles.navTitle, { color: p.label }]}>Ask NEVER</Text>
              <View style={[styles.liveDot, { backgroundColor: p.success }]} />
            </View>
            {messages.length && !sending ? <V5IconButton icon={icons.close} accessibilityLabel="Clear conversation" onPress={() => { setMessages([]); setFailedQuestion(null); }} /> : <View style={{ width: 44 }} />}
          </View>

          <ScrollView
            ref={scrollRef}
            keyboardDismissMode="interactive"
            onScroll={(event) => { const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent; nearBottom.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 80; }}
            scrollEventThrottle={32}
            onContentSizeChange={() => { if (nearBottom.current) scrollRef.current?.scrollToEnd({ animated: !reducedMotion }); }}
            style={styles.chat}
            contentContainerStyle={messages.length ? styles.chatContent : styles.emptyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!messages.length ? (
              <>
                <View style={styles.heroCopy}>
                  <NeverEyebrow>Grounded recall</NeverEyebrow>
                  <Text accessibilityRole="header" style={[styles.heroTitle, p.heading, { color: p.label }]}>Ask your memory.</Text>
                  <Text style={[styles.heroSubtitle, { color: p.secondary }]}>NEVER searches what you saved first, then answers from the evidence it can actually find.</Text>
                </View>

                <NeverHeroSurface style={styles.trustStage}>
                  <View style={styles.trustTop}>
                    <View style={[styles.trustMark, { borderRadius: p.radius.icon, backgroundColor: p.graphite }]}>
                      <OneIcon name={icons.shield} size={18} color={p.onAccent} />
                    </View>
                    <View style={styles.trustCopy}>
                      <NeverEyebrow>Evidence first</NeverEyebrow>
                      <Text style={[styles.trustTitle, { color: p.label }]}>Grounded by design.</Text>
                      <Text style={[styles.trustBody, { color: p.secondary }]}>If your saved evidence is not enough, NEVER should say so instead of filling the gap.</Text>
                    </View>
                  </View>
                  <View style={[styles.trustMetrics, { borderTopColor: p.separator }]}>
                    <NeverMetric value={`${items.length}`} label="memories" />
                    <NeverMetric value="Private" label="context" />
                    <NeverMetric value="Grounded" label="answers" />
                  </View>
                </NeverHeroSurface>

                <View style={styles.section}>
                  <V5SectionHeader title="Try asking" />
                  <View style={styles.suggestionGrid}>
                    {examples.map((example) => (
                      <Pressable accessibilityRole="button"
                        key={example.text}
                        onPress={() => submitQuestion(example.text)}
                        style={({ pressed }) => [styles.suggestionTile, p.cardStyle, { opacity: pressed ? 0.65 : 1 }]}
                      >
                        <View style={styles.suggestionTileTop}>
                          <View style={[styles.suggestionIcon, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft }]}>
                            <OneIcon name={example.icon} size={16} color={p.chrome} />
                          </View>
                          <V5Chevron />
                        </View>
                        <Text style={[styles.suggestionText, { color: p.label }]}>{example.text}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : messages.map((message) => <MessageBubble key={message.id} message={message} itemById={itemById} />)}

            {failedQuestion ? <NeverNotice tone="error" title="Could not retrieve an answer" body="Your conversation is still here. Check your connection and try again." action="Try again" onAction={() => void submitQuestion(failedQuestion, true)} /> : null}
            {sending ? (
              <NeverHeroSurface compact style={styles.loadingSurface}>
                <View style={styles.loadingLine}>
                  <View style={[styles.assistantMark, { borderRadius: p.radius.icon, backgroundColor: p.graphite }]}><OneIcon name={icons.ask} size={12.5} color={p.onAccent} /></View>
                  <ActivityIndicator size="small" color={p.chrome} />
                  <Text style={[styles.loadingText, { color: p.secondary }]}>Looking through your memory…</Text>
                </View>
              </NeverHeroSurface>
            ) : null}
          </ScrollView>

          <View style={[styles.composerWrap, { borderTopColor: p.separator }]}>
            <NeverHeroSurface compact glass style={styles.composerSurface}>
              <View style={styles.composer}>
                <NeverInput accessibilityLabel="Your question"
                  value={query}
                  onChangeText={setQuery}
                  placeholder={messages.length ? 'Ask a follow-up…' : 'Ask anything you saved…'}
                  placeholderTextColor={p.tertiary}
                  style={[styles.input, { color: p.label }]}
                  multiline
                  maxLength={800}
                  returnKeyType="send"
                  blurOnSubmit
                  onSubmitEditing={() => submitQuestion()}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send question"
                  accessibilityState={{ disabled: !query.trim() || sending, busy: sending }}
                  disabled={!query.trim() || sending}
                  onPress={() => submitQuestion()}
                  style={[styles.sendButton, {
                    borderRadius: p.radius.icon,
                    backgroundColor: query.trim() && !sending ? p.graphite : p.fill,
                    opacity: sending ? 0.5 : 1
                  }]}
                >
                  <OneIcon name={icons.upload} size={14} color={query.trim() && !sending ? p.onAccent : p.tertiary} />
                </Pressable>
              </View>
            </NeverHeroSurface>
          </View>
        </View>
      </KeyboardAvoidingView>
    </NeverScreen>
  );

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

function MessageBubble({ message, itemById }: { message: ChatMessage; itemById: Map<string, OneItem> }) {
  const p = useNeverV5Palette();
  if (message.role === 'user') {
    const bubbleRadius = p.radius.button;
    return (
      <View style={styles.userMessageWrap}>
        <NeverEyebrow>You</NeverEyebrow>
        <View style={[styles.userBubble, {
          borderRadius: bubbleRadius,
          borderBottomRightRadius: Math.max(5, Math.round(bubbleRadius * 0.35)),
          backgroundColor: p.graphite
        }]}>
          <Text style={[styles.userText, { color: p.onAccent }]}>{message.text}</Text>
        </View>
      </View>
    );
  }

  const sources = (message.sourceIds || []).map((id) => itemById.get(id)).filter((item): item is OneItem => Boolean(item)).slice(0, 6);
  const answerUrls = extractHttpUrls(message.body);
  const bodyText = withoutStandaloneUrlLines(message.body);

  return (
    <NeverHeroSurface compact style={styles.assistantSurface}>
      <View style={styles.assistantBody}>
        <View style={styles.assistantHeader}>
          <View style={[styles.assistantMark, { borderRadius: p.radius.icon, backgroundColor: p.graphite }]}><OneIcon name={icons.ask} size={12.5} color={p.onAccent} /></View>
          <Text style={[styles.assistantBrand, { color: p.label }]}>NEVER</Text>
          {message.mode ? <Text style={[styles.modeLabel, { color: p.tertiary }]}>{message.mode === 'ai' ? 'SYNTHESIZED' : 'GROUNDED'}</Text> : null}
        </View>

        {message.title ? <Text style={[styles.answerTitle, { color: p.label }]}>{message.title}</Text> : null}
        {bodyText ? <Text selectable style={[styles.answerBody, { color: p.secondary }]}>{bodyText}</Text> : null}
        {message.meta ? <Text style={[styles.answerMeta, { color: p.tertiary }]}>{message.meta}</Text> : null}
      </View>

      {answerUrls.length ? (
        <View style={[styles.answerLinks, { borderTopColor: p.separator }]}>
          {answerUrls.map((url, index) => (
            <Pressable accessibilityRole="button" key={url} onPress={async () => { void Haptics.selectionAsync().catch(() => undefined); await openMemoryLink(url); }} style={({ pressed }) => [styles.linkRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
              <OneIcon name={icons.link} size={13.5} color={p.chrome} />
              <View style={[styles.linkContent, index !== answerUrls.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.separator }]}>
                <Text style={[styles.linkText, { color: p.label }]} numberOfLines={1}>{url}</Text>
                <V5Chevron />
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {sources.length ? (
        <View style={[styles.sourcesWrap, { borderTopColor: p.separator }]}>
          <V5SectionHeader title="Sources" meta={`${sources.length}`} />
          <V5Group>
            {sources.map((item, index) => <MemoryRow key={item.id} item={item} last={index === sources.length - 1} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} />)}
          </V5Group>
        </View>
      ) : null}
    </NeverHeroSurface>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  nav: { minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  navTitle: { fontSize: 16, lineHeight: 20, fontWeight: '600', letterSpacing: -0.18 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  chat: { flex: 1 },
  emptyContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 26, gap: 24 },
  chatContent: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 26, gap: 18 },
  heroCopy: { gap: 5 },
  heroTitle: { fontSize: 42, lineHeight: 46, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', web: 'Georgia, serif' }), fontWeight: '400', letterSpacing: -1.25 },
  heroSubtitle: { maxWidth: 470, fontSize: 14.5, lineHeight: 20 },
  trustStage: { padding: 17 },
  trustTop: { minHeight: 104, flexDirection: 'row', alignItems: 'center', gap: 13 },
  trustMark: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  trustCopy: { flex: 1, minWidth: 0 },
  trustTitle: { marginTop: 3, fontSize: 18, lineHeight: 22, fontWeight: '600', letterSpacing: -0.25 },
  trustBody: { marginTop: 3, fontSize: 12.5, lineHeight: 17 },
  trustMetrics: { minHeight: 64, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { gap: 9 },
  suggestionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  suggestionTile: { flexBasis: '47%', flexGrow: 1, minWidth: 130, minHeight: 118, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 13, justifyContent: 'space-between' },
  suggestionTileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  suggestionIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  suggestionText: { marginTop: 16, fontSize: 13.5, lineHeight: 18, fontWeight: '600' },
  userMessageWrap: { alignItems: 'flex-end', gap: 5 },
  userBubble: { maxWidth: '84%', borderRadius: 20, borderBottomRightRadius: 7, paddingHorizontal: 14, paddingVertical: 10 },
  userText: { fontSize: 14.5, lineHeight: 20 },
  assistantSurface: { overflow: 'hidden' },
  assistantBody: { padding: 16, gap: 9 },
  assistantHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  assistantMark: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  assistantBrand: { fontSize: 11.5, lineHeight: 14, fontWeight: '700', letterSpacing: 0.65 },
  modeLabel: { marginLeft: 'auto', fontSize: 9.5, lineHeight: 12, fontWeight: '600', letterSpacing: 0.45 },
  answerTitle: { marginTop: 3, fontSize: 20, lineHeight: 25, fontWeight: '700', letterSpacing: -0.35 },
  answerBody: { fontSize: 14.5, lineHeight: 21 },
  answerMeta: { fontSize: 10.5, lineHeight: 14 },
  answerLinks: { borderTopWidth: StyleSheet.hairlineWidth },
  loadingSurface: { minHeight: 62 },
  loadingLine: { minHeight: 62, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  loadingText: { fontSize: 13.5, lineHeight: 17 },
  linkRow: { minHeight: 50, paddingLeft: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  linkContent: { flex: 1, minHeight: 50, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  linkText: { flex: 1, fontSize: 12.5, lineHeight: 16 },
  sourcesWrap: { padding: 14, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  composerWrap: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 5, borderTopWidth: StyleSheet.hairlineWidth },
  composerSurface: { minHeight: 56 },
  composer: { minHeight: 56, paddingLeft: 15, paddingRight: 7, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 50, maxHeight: 116, fontSize: 15, lineHeight: 20, paddingTop: 13, paddingBottom: 11 },
  sendButton: { width: 44, height: 44, borderRadius: 22, marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
  lockedPage: { flexGrow: 1, width: '100%', maxWidth: 620, alignSelf: 'center', padding: 20, gap: 24 },
  lockedTop: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lockedHeroCopy: { gap: 5 },
  lockedStage: { padding: 18 },
  lockedIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  lockedTitle: { marginTop: 5, fontSize: 22, lineHeight: 27, fontWeight: '600', letterSpacing: -0.45 },
  lockedText: { marginTop: 5, fontSize: 13.5, lineHeight: 19 },
  primaryButton: { marginTop: 18, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' }
});