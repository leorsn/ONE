import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
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

export default function AskV3() {
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
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={styles.lockedShell}>
          <View style={styles.lockedConsole}>
            <View pointerEvents="none" style={styles.consoleOrb} />
            <View pointerEvents="none" style={styles.chromeLine} />
            <View style={styles.lockedBrandRow}>
              <Text style={styles.consoleBrand}>NEVER AI</Text>
              <View style={styles.consoleSignal}><View style={styles.signalLong} /><View style={styles.signalShort} /></View>
            </View>
            <View style={styles.lockedMark}><OneIcon name={icons.crown} size={22} color="#F5F7F9" /></View>
            <Text style={styles.lockedTitle}>Ask what you saved.</Text>
            <Text style={styles.lockedBody}>Grounded conversational recall over your private NEVER memory.</Text>
            <Pressable onPress={() => router.push('/upgrade')} style={({ pressed }) => [styles.lockedPrimary, { opacity: pressed ? 0.76 : 1 }]}>
              <Text style={styles.lockedPrimaryText}>View NEVER AI</Text>
              <OneIcon name={icons.chevron} size={12} color="#11161B" />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.lockedSecondary}>
            <OneIcon name={icons.chevronLeft} size={13} color={theme.textSecondary} />
            <Text style={[styles.lockedSecondaryText, { color: theme.textSecondary }]}>Back to NEVER</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={4}>
        <View style={styles.shell}>
          <View style={styles.nav}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.navButton, { backgroundColor: dark ? '#171D22' : '#F8FAFB', borderColor: theme.glassBorder, opacity: pressed ? 0.62 : 1 }]}>
              <OneIcon name={icons.chevronLeft} size={17} color={theme.text} />
            </Pressable>
            <View style={styles.navCenter}>
              <Text style={[styles.navEyebrow, { color: theme.textTertiary }]}>PRIVATE MEMORY ENGINE</Text>
              <Text style={[styles.navTitle, { color: theme.text }]}>Ask NEVER</Text>
            </View>
            {messages.length ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear conversation" onPress={() => setMessages([])} style={({ pressed }) => [styles.navButton, { backgroundColor: dark ? '#171D22' : '#F8FAFB', borderColor: theme.glassBorder, opacity: pressed ? 0.62 : 1 }]}>
                <OneIcon name={icons.close} size={14} color={theme.textSecondary} />
              </Pressable>
            ) : <View style={{ width: 42 }} />}
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
                <View style={styles.intelligenceConsole}>
                  <View pointerEvents="none" style={styles.consoleOrb} />
                  <View pointerEvents="none" style={styles.chromeLine} />
                  <View style={styles.consoleStatusRow}>
                    <View style={styles.consoleStatus}><View style={styles.statusDot} /><Text style={styles.consoleStatusText}>GROUNDED ONLY</Text></View>
                    <OneIcon name={icons.shield} size={15} color="#B6C0C9" />
                  </View>
                  <Text style={styles.consoleEyebrow}>MEMORY INTELLIGENCE</Text>
                  <Text style={styles.consoleTitle}>Ask what you saved.</Text>
                  <Text style={styles.consoleBody}>NEVER searches your own memory first, then answers only from retrieved evidence.</Text>

                  <View style={styles.pipeline}>
                    <PipelineStep index="01" label="Your memory" active />
                    <View style={styles.pipelineLine} />
                    <PipelineStep index="02" label="Retrieve" />
                    <View style={styles.pipelineLine} />
                    <PipelineStep index="03" label="Answer" />
                  </View>
                </View>

                <View style={styles.promptSection}>
                  <View style={styles.promptHeader}>
                    <View>
                      <Text style={[styles.promptEyebrow, { color: theme.textTertiary }]}>START HERE</Text>
                      <Text style={[styles.promptTitle, { color: theme.text }]}>Try a question</Text>
                    </View>
                    <Text style={[styles.promptMeta, { color: theme.textTertiary }]}>YOUR MEMORY</Text>
                  </View>
                  <View style={styles.exampleGrid}>
                    {examples.map((example, index) => (
                      <Pressable
                        key={example.text}
                        accessibilityRole="button"
                        accessibilityLabel={example.text}
                        onPress={() => submitQuestion(example.text)}
                        style={({ pressed }) => [
                          styles.exampleCard,
                          {
                            backgroundColor: index === 0 ? (dark ? '#E8ECEF' : '#151A1F') : (dark ? '#151B20' : '#FAFBFC'),
                            borderColor: index === 0 ? (dark ? '#FFFFFF90' : '#20262C') : theme.glassBorder,
                            shadowColor: theme.shadow,
                            opacity: pressed ? 0.72 : 1,
                            transform: [{ scale: pressed ? 0.985 : 1 }]
                          }
                        ]}
                      >
                        <View style={[styles.exampleIcon, { backgroundColor: index === 0 ? (dark ? '#11161B' : '#FFFFFF12') : theme.platinumSoft }]}>
                          <OneIcon name={example.icon} size={15} color={index === 0 ? '#F5F7F9' : theme.chrome} />
                        </View>
                        <Text style={[styles.exampleLabel, { color: index === 0 ? (dark ? '#13181D' : '#AAB3BB') : theme.textTertiary }]}>{example.label.toUpperCase()}</Text>
                        <Text style={[styles.exampleText, { color: index === 0 ? (dark ? '#101419' : '#FFFFFF') : theme.text }]} numberOfLines={3}>{example.text}</Text>
                        <View style={[styles.exampleArrow, { backgroundColor: index === 0 ? (dark ? '#C8D0D7' : '#E8ECEF') : theme.platinumSoft }]}><OneIcon name={icons.chevron} size={10.5} color={index === 0 ? '#11161B' : theme.chrome} /></View>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={[styles.privacyCard, { backgroundColor: dark ? '#14191E' : '#F8FAFB', borderColor: theme.glassBorder }]}>
                  <View style={[styles.privacyIcon, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.shield} size={15} color={theme.chrome} /></View>
                  <View style={{ flex: 1 }}><Text style={[styles.privacyTitle, { color: theme.text }]}>Grounded by design</Text><Text style={[styles.privacyText, { color: theme.textSecondary }]}>When your saved evidence is not enough, NEVER should say so instead of inventing an answer.</Text></View>
                </View>
              </>
            ) : messages.map((message) => <MessageBubble key={message.id} message={message} />)}

            {sending ? (
              <View style={[styles.thinkingCard, { backgroundColor: dark ? '#151B20' : '#FAFBFC', borderColor: theme.glassBorder }]} accessibilityLabel="Looking through your memory">
                <View style={[styles.answerMark, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.ask} size={12} color={theme.chrome} /></View>
                <ActivityIndicator size="small" color={theme.chrome} />
                <Text style={[styles.thinking, { color: theme.textSecondary }]}>Retrieving your memory…</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.composerWrap, { backgroundColor: theme.background }]}>
            <View style={[styles.composer, { backgroundColor: dark ? '#151B20' : '#FAFBFC', borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
              <View style={[styles.composerAskMark, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.ask} size={14} color={theme.chrome} /></View>
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
                accessibilityLabel="Ask NEVER question"
                accessibilityHint="Ask a question about information saved in NEVER"
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Send question" disabled={!query.trim() || sending} onPress={() => submitQuestion()} style={[styles.send, { backgroundColor: query.trim() && !sending ? theme.chrome : theme.platinumSoft, opacity: sending ? 0.6 : 1 }]}>
                <OneIcon name={icons.upload} size={15} color={query.trim() && !sending ? (dark ? '#07090B' : '#FFFFFF') : theme.textTertiary} />
              </Pressable>
              <View pointerEvents="none" style={[styles.composerReflection, { backgroundColor: theme.reflection }]} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function PipelineStep({ index, label, active = false }: { index: string; label: string; active?: boolean }) {
    return (
      <View style={styles.pipelineStep}>
        <View style={[styles.pipelineIndex, active && styles.pipelineIndexActive]}><Text style={[styles.pipelineIndexText, active && styles.pipelineIndexTextActive]}>{index}</Text></View>
        <Text style={[styles.pipelineLabel, active && styles.pipelineLabelActive]}>{label}</Text>
      </View>
    );
  }

  function MessageBubble({ message }: { message: ChatMessage }) {
    if (message.role === 'user') {
      return (
        <View style={[styles.userCard, { backgroundColor: dark ? '#E8ECEF' : '#151A1F', borderColor: dark ? '#FFFFFF60' : '#242B32' }]}>
          <Text style={[styles.userEyebrow, { color: dark ? '#68737E' : '#8E99A3' }]}>YOU ASKED</Text>
          <Text style={[styles.userText, { color: dark ? '#11161B' : '#FFFFFF' }]}>{message.text}</Text>
        </View>
      );
    }

    const sources = (message.sourceIds || []).map((id) => itemById.get(id)).filter((item): item is OneItem => Boolean(item)).slice(0, 6);
    const answerUrls = extractHttpUrls(message.body);
    const bodyText = withoutStandaloneUrlLines(message.body);

    return (
      <View style={[styles.assistantCard, { backgroundColor: dark ? '#151B20' : '#FAFBFC', borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
        <View style={styles.answerHeader}>
          <View style={[styles.answerMark, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.ask} size={12} color={theme.chrome} /></View>
          <View><Text style={[styles.answerEyebrow, { color: theme.text }]}>NEVER</Text><Text style={[styles.answerMode, { color: theme.textTertiary }]}>{message.mode === 'ai' ? 'SYNTHESIZED FROM MEMORY' : 'GROUNDED RETRIEVAL'}</Text></View>
        </View>
        {message.title ? <Text style={[styles.answerTitle, { color: theme.text }]}>{message.title}</Text> : null}
        {bodyText ? <Text style={[styles.answerBody, { color: theme.textSecondary }]}>{bodyText}</Text> : null}

        {answerUrls.length ? (
          <View style={styles.answerLinks}>
            {answerUrls.map((url) => (
              <Pressable key={url} accessibilityRole="link" accessibilityLabel={`Open ${url}`} onPress={async () => { await Haptics.selectionAsync(); await Linking.openURL(url); }} style={({ pressed }) => [styles.answerLink, { borderColor: theme.border, opacity: pressed ? 0.58 : 1 }]}>
                <View style={[styles.answerLinkIcon, { backgroundColor: theme.platinumSoft }]}><OneIcon name={icons.link} size={13} color={theme.chrome} /></View>
                <View style={styles.answerLinkText}><Text style={[styles.answerLinkLabel, { color: theme.text }]}>Open link</Text><Text style={[styles.answerLinkUrl, { color: theme.textSecondary }]} numberOfLines={2}>{url}</Text></View>
                <OneIcon name={icons.chevron} size={12} color={theme.chrome} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {message.meta ? <Text style={[styles.answerMeta, { color: theme.textTertiary }]}>{message.meta}</Text> : null}

        {sources.length ? (
          <View style={[styles.sources, { borderTopColor: theme.border }]}>
            <View style={styles.sourcesHeader}><Text style={[styles.sourcesLabel, { color: theme.textTertiary }]}>SOURCE MEMORY</Text><Text style={[styles.sourcesCount, { color: theme.textTertiary }]}>{sources.length}</Text></View>
            {sources.map((item, index) => (
              <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Open source ${item.title}`} onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.sourceRow, index !== sources.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }, { opacity: pressed ? 0.58 : 1 }]}>
                <View style={[styles.sourceGlyph, { backgroundColor: theme.platinumSoft }]}><OneIcon name={iconForType(item.type)} size={14} color={theme.chrome} /></View>
                <View style={{ flex: 1 }}><Text style={[styles.sourceTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text><Text style={[styles.sourceMeta, { color: theme.textSecondary }]} numberOfLines={1}>{sourceMeta(item)}</Text></View>
                <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  }
}

function sourceMeta(item: OneItem) {
  const captured = new Date(item.capturedAt || item.createdAt);
  const capturedLabel = Number.isFinite(captured.getTime()) ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(captured) : undefined;
  return [item.userContext, item.type, capturedLabel].filter(Boolean).join(' · ');
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
  nav: { minHeight: 66, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  navButton: { width: 42, height: 42, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navCenter: { alignItems: 'center' },
  navEyebrow: { fontSize: 6.8, lineHeight: 9, fontWeight: '800', letterSpacing: 1.05 },
  navTitle: { marginTop: 2, fontSize: 13.5, lineHeight: 17, fontWeight: '700', letterSpacing: -0.12 },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 30, gap: 15 },
  emptyContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, gap: 18 },
  intelligenceConsole: { minHeight: 330, borderRadius: 30, backgroundColor: '#11161B', padding: 22, overflow: 'hidden' },
  consoleOrb: { position: 'absolute', width: 250, height: 250, borderRadius: 125, right: -115, top: -130, backgroundColor: '#FFFFFF0A', borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF12' },
  chromeLine: { position: 'absolute', top: 0, left: 34, right: 34, height: 1, backgroundColor: '#FFFFFF72' },
  consoleStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  consoleStatus: { minHeight: 26, paddingHorizontal: 9, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF1D', backgroundColor: '#FFFFFF0B', flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#E2E7EB' },
  consoleStatusText: { color: '#909BA5', fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  consoleEyebrow: { marginTop: 36, color: '#78838D', fontSize: 8, lineHeight: 11, fontWeight: '800', letterSpacing: 1.55 },
  consoleTitle: { marginTop: 8, maxWidth: 480, color: '#F7F8FA', fontSize: 36, lineHeight: 40, fontWeight: '800', letterSpacing: -1.4 },
  consoleBody: { marginTop: 9, maxWidth: 470, color: '#98A2AB', fontSize: 12, lineHeight: 17.5 },
  pipeline: { marginTop: 32, flexDirection: 'row', alignItems: 'center' },
  pipelineStep: { alignItems: 'center', gap: 6 },
  pipelineIndex: { width: 31, height: 31, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF20', backgroundColor: '#FFFFFF08', alignItems: 'center', justifyContent: 'center' },
  pipelineIndexActive: { backgroundColor: '#E7EBEE', borderColor: '#FFFFFFC2' },
  pipelineIndexText: { color: '#7E8993', fontSize: 7.5, fontWeight: '800' },
  pipelineIndexTextActive: { color: '#151A1F' },
  pipelineLabel: { color: '#6D7882', fontSize: 7.5, fontWeight: '700' },
  pipelineLabelActive: { color: '#DDE2E7' },
  pipelineLine: { flex: 1, height: StyleSheet.hairlineWidth, marginHorizontal: 8, marginBottom: 18, backgroundColor: '#FFFFFF22' },
  promptSection: { gap: 11 },
  promptHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 2 },
  promptEyebrow: { fontSize: 7.5, lineHeight: 10, fontWeight: '800', letterSpacing: 1.45 },
  promptTitle: { marginTop: 4, fontSize: 22, lineHeight: 26, fontWeight: '800', letterSpacing: -0.55 },
  promptMeta: { fontSize: 7, fontWeight: '800', letterSpacing: 0.9 },
  exampleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  exampleCard: { width: '48.7%', minHeight: 142, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, padding: 13, shadowOpacity: 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  exampleIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  exampleLabel: { marginTop: 15, fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  exampleText: { marginTop: 5, paddingRight: 18, fontSize: 12.2, lineHeight: 16.5, fontWeight: '700', letterSpacing: -0.16 },
  exampleArrow: { position: 'absolute', right: 11, bottom: 11, width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  privacyCard: { borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  privacyIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  privacyTitle: { fontSize: 12.5, lineHeight: 16, fontWeight: '700' },
  privacyText: { marginTop: 3, fontSize: 10.3, lineHeight: 15 },
  userCard: { alignSelf: 'flex-end', maxWidth: '88%', borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 13 },
  userEyebrow: { fontSize: 7, lineHeight: 10, fontWeight: '800', letterSpacing: 1 },
  userText: { marginTop: 5, fontSize: 13.5, lineHeight: 19.5, fontWeight: '600' },
  assistantCard: { borderRadius: 25, borderWidth: StyleSheet.hairlineWidth, padding: 17, shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 3 },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  answerMark: { width: 31, height: 31, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  answerEyebrow: { fontSize: 9, lineHeight: 12, fontWeight: '800', letterSpacing: 1.2 },
  answerMode: { marginTop: 1, fontSize: 6.8, lineHeight: 9, fontWeight: '800', letterSpacing: 0.75 },
  answerTitle: { marginTop: 16, fontSize: 20, lineHeight: 25, fontWeight: '800', letterSpacing: -0.45 },
  answerBody: { marginTop: 7, fontSize: 13, lineHeight: 20 },
  answerLinks: { marginTop: 12, gap: 7 },
  answerLink: { minHeight: 58, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  answerLinkIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  answerLinkText: { flex: 1, gap: 2 },
  answerLinkLabel: { fontSize: 11.5, lineHeight: 15, fontWeight: '700' },
  answerLinkUrl: { fontSize: 9.8, lineHeight: 13 },
  answerMeta: { marginTop: 12, fontSize: 9, lineHeight: 13 },
  sources: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth },
  sourcesHeader: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourcesLabel: { fontSize: 7.5, fontWeight: '800', letterSpacing: 1.1 },
  sourcesCount: { fontSize: 9, fontWeight: '700' },
  sourceRow: { minHeight: 55, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sourceGlyph: { width: 33, height: 33, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sourceTitle: { fontSize: 12.5, lineHeight: 16, fontWeight: '700' },
  sourceMeta: { marginTop: 2, fontSize: 10, lineHeight: 13.5 },
  thinkingCard: { minHeight: 62, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  thinking: { fontSize: 11.5 },
  composerWrap: { paddingHorizontal: 16, paddingTop: 9, paddingBottom: 7 },
  composer: { minHeight: 60, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingLeft: 9, paddingRight: 7, flexDirection: 'row', alignItems: 'flex-end', gap: 8, overflow: 'hidden', shadowOpacity: 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 4 },
  composerReflection: { position: 'absolute', top: 0, left: 24, right: 24, height: StyleSheet.hairlineWidth },
  composerAskMark: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  input: { flex: 1, minHeight: 52, maxHeight: 120, fontSize: 13.8, lineHeight: 19, paddingTop: 15, paddingBottom: 12 },
  send: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  lockedShell: { flex: 1, width: '100%', maxWidth: 620, alignSelf: 'center', justifyContent: 'center', padding: 18, gap: 14 },
  lockedConsole: { minHeight: 390, borderRadius: 31, backgroundColor: '#11161B', padding: 24, overflow: 'hidden' },
  lockedBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  consoleBrand: { color: '#F7F8FA', fontSize: 14, fontWeight: '800', letterSpacing: 4.5 },
  consoleSignal: { flexDirection: 'row', gap: 3 },
  signalLong: { width: 19, height: 3, borderRadius: 2, backgroundColor: '#E3E8EC' },
  signalShort: { width: 7, height: 3, borderRadius: 2, backgroundColor: '#77838D' },
  lockedMark: { width: 50, height: 50, borderRadius: 17, marginTop: 54, borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF22', backgroundColor: '#FFFFFF0C', alignItems: 'center', justifyContent: 'center' },
  lockedTitle: { marginTop: 18, color: '#F7F8FA', fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1.2 },
  lockedBody: { marginTop: 8, maxWidth: 430, color: '#98A2AB', fontSize: 12, lineHeight: 18 },
  lockedPrimary: { minHeight: 52, marginTop: 30, borderRadius: 17, backgroundColor: '#E8ECEF', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lockedPrimaryText: { color: '#11161B', fontSize: 12.5, fontWeight: '800' },
  lockedSecondary: { minHeight: 46, alignSelf: 'center', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockedSecondaryText: { fontSize: 11.5, fontWeight: '700' }
});
