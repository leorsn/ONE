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
import { useTheme } from '@/src/theme/useTheme';
import { neverType } from '@/src/theme/typography';
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
  'What did I save today?',
  'What gift ideas did I save for Papa?',
  'Show my links about Studium',
  'When was the dentist appointment?'
];

export default function AskOneScreen() {
  const theme = useTheme();
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
        <View style={styles.locked}>
          <View style={[styles.lockedMark, { backgroundColor: theme.platinumSoft, borderColor: theme.glassBorder }]}>
            <OneIcon name={icons.crown} size={22} color={theme.chrome} />
          </View>
          <Text style={[styles.lockedEyebrow, { color: theme.textTertiary }]}>NEVER AI</Text>
          <Text style={[styles.heading, { color: theme.text }]}>Ask your memory.</Text>
          <Text style={[styles.subheading, { color: theme.textSecondary }]}>Grounded conversational recall over the information you saved in NEVER.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View NEVER AI"
            onPress={() => router.push('/upgrade')}
            style={({ pressed }) => [styles.primary, { backgroundColor: theme.chrome, borderColor: theme.glassBorder, opacity: pressed ? 0.74 : 1 }]}
          >
            <Text style={[styles.primaryText, { color: theme.background }]}>View NEVER AI</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.secondary}>
            <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>Not now</Text>
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.navButton, { backgroundColor: theme.glass, borderColor: theme.glassBorder, opacity: pressed ? 0.62 : 1 }]}
            >
              <OneIcon name={icons.chevronLeft} size={17} color={theme.text} />
            </Pressable>

            <View style={styles.navCenter}>
              <Text style={[styles.navTitle, { color: theme.text }]}>Ask NEVER</Text>
            </View>

            {messages.length ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear conversation"
                onPress={() => setMessages([])}
                style={({ pressed }) => [styles.navButton, { backgroundColor: theme.glass, borderColor: theme.glassBorder, opacity: pressed ? 0.62 : 1 }]}
              >
                <OneIcon name={icons.close} size={14} color={theme.textSecondary} />
              </Pressable>
            ) : <View style={{ width: 38 }} />}
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
                <View style={styles.hero}>
                  <Text style={[styles.heroEyebrow, { color: theme.textTertiary }]}>GROUNDED IN YOUR MEMORY</Text>
                  <Text style={[styles.heading, { color: theme.text }]}>Ask your memory.</Text>
                  <Text style={[styles.subheading, { color: theme.textSecondary }]}>NEVER searches what you saved first, then answers from those memories.</Text>
                </View>

                <View style={styles.examples}>
                  <Text style={[styles.sectionLabel, { color: theme.textTertiary }]}>TRY ASKING</Text>
                  {examples.map((example, index) => (
                    <Pressable
                      key={example}
                      accessibilityRole="button"
                      accessibilityLabel={example}
                      onPress={() => submitQuestion(example)}
                      style={({ pressed }) => [
                        styles.example,
                        index !== examples.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                        { opacity: pressed ? 0.52 : 1 }
                      ]}
                    >
                      <Text style={[styles.exampleText, { color: theme.text }]}>{example}</Text>
                      <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
                    </Pressable>
                  ))}
                </View>

                <View style={styles.privacy}>
                  <OneIcon name={icons.shield} size={14} color={theme.chrome} />
                  <Text style={[styles.privacyText, { color: theme.textTertiary }]}>NEVER only answers from retrieved saved information and should say when the evidence is not enough.</Text>
                </View>
              </>
            ) : messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {sending ? (
              <View style={styles.assistant} accessibilityLabel="Looking through your memory">
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" color={theme.chrome} />
                  <Text style={[styles.thinking, { color: theme.textSecondary }]}>Looking through your memory…</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.composerWrap, { backgroundColor: theme.background }]}>
            <View style={[styles.composer, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder, shadowColor: theme.shadow }]}>
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send question"
                disabled={!query.trim() || sending}
                onPress={() => submitQuestion()}
                style={[
                  styles.send,
                  {
                    backgroundColor: query.trim() && !sending ? theme.chrome : theme.platinumSoft,
                    opacity: sending ? 0.6 : 1
                  }
                ]}
              >
                <OneIcon name={icons.upload} size={15} color={query.trim() && !sending ? theme.background : theme.textTertiary} />
              </Pressable>
              <View pointerEvents="none" style={[styles.composerReflection, { backgroundColor: theme.reflection }]} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function MessageBubble({ message }: { message: ChatMessage }) {
    if (message.role === 'user') {
      return (
        <View style={[styles.user, { backgroundColor: theme.platinumSoft, borderColor: theme.glassBorder }]}>
          <Text style={[styles.userEyebrow, { color: theme.textTertiary }]}>YOU</Text>
          <Text style={[styles.userText, { color: theme.text }]}>{message.text}</Text>
        </View>
      );
    }

    const sources = (message.sourceIds || [])
      .map((id) => itemById.get(id))
      .filter((item): item is OneItem => Boolean(item))
      .slice(0, 6);
    const answerUrls = extractHttpUrls(message.body);
    const bodyText = withoutStandaloneUrlLines(message.body);

    return (
      <View style={styles.assistant}>
        <View style={styles.answerHeader}>
          <View style={[styles.answerMark, { backgroundColor: theme.platinumSoft, borderColor: theme.glassBorder }]}>
            <OneIcon name={icons.ask} size={12} color={theme.chrome} />
          </View>
          <Text style={[styles.answerEyebrow, { color: theme.chrome }]}>NEVER</Text>
          {message.mode ? <Text style={[styles.mode, { color: theme.textTertiary }]}>{message.mode === 'ai' ? 'SYNTHESIZED' : 'GROUNDED'}</Text> : null}
        </View>
        {message.title ? <Text style={[styles.answerTitle, { color: theme.text }]}>{message.title}</Text> : null}
        {bodyText ? <Text style={[styles.answerBody, { color: theme.textSecondary }]}>{bodyText}</Text> : null}

        {answerUrls.length ? (
          <View style={styles.answerLinks}>
            {answerUrls.map((url) => (
              <Pressable
                key={url}
                accessibilityRole="link"
                accessibilityLabel={`Open ${url}`}
                onPress={async () => {
                  await Haptics.selectionAsync();
                  await Linking.openURL(url);
                }}
                style={({ pressed }) => [styles.answerLink, { borderColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
              >
                <View style={styles.answerLinkText}>
                  <Text style={[styles.answerLinkLabel, { color: theme.text }]}>Open link</Text>
                  <Text style={[styles.answerLinkUrl, { color: theme.textSecondary }]} numberOfLines={2}>{url}</Text>
                </View>
                <OneIcon name={icons.chevron} size={12} color={theme.chrome} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {message.meta ? <Text style={[styles.answerMeta, { color: theme.textTertiary }]}>{message.meta}</Text> : null}

        {sources.length ? (
          <View style={[styles.sources, { borderTopColor: theme.border }]}>
            <View style={styles.sourcesHeader}>
              <Text style={[styles.sourcesLabel, { color: theme.textTertiary }]}>SOURCES</Text>
              <Text style={[styles.sourcesCount, { color: theme.textTertiary }]}>{sources.length} {sources.length === 1 ? 'memory' : 'memories'}</Text>
            </View>
            {sources.map((item, index) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Open source ${item.title}`}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                style={({ pressed }) => [
                  styles.sourceRow,
                  index !== sources.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                  { opacity: pressed ? 0.58 : 1 }
                ]}
              >
                <View style={[styles.sourceGlyph, { backgroundColor: theme.platinumSoft, borderColor: theme.glassBorder }]}>
                  <OneIcon name={iconForType(item.type)} size={14} color={theme.chrome} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sourceTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.sourceMeta, { color: theme.textSecondary }]} numberOfLines={1}>{sourceMeta(item)}</Text>
                </View>
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
  const capturedLabel = Number.isFinite(captured.getTime())
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(captured)
    : undefined;
  return [item.userContext, item.type, capturedLabel].filter(Boolean).join(' · ');
}

function extractHttpUrls(value?: string) {
  if (!value) return [];
  return Array.from(new Set((value.match(/https?:\/\/[^\s<>"')\]}]+/gi) || []).map((url) => url.replace(/[.,;:!?]+$/g, ''))));
}

function withoutStandaloneUrlLines(value?: string) {
  if (!value) return undefined;
  const remaining = value
    .split('\n')
    .filter((line) => !/^https?:\/\/\S+$/i.test(line.trim()))
    .join('\n')
    .trim();
  return remaining || undefined;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  nav: {
    minHeight: 58,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  navCenter: { alignItems: 'center' },
  navTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600', letterSpacing: -0.12 },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30, gap: 22 },
  emptyContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 28, gap: 36 },
  hero: { alignItems: 'flex-start', paddingHorizontal: 2 },
  heroEyebrow: { ...neverType.eyebrow, marginBottom: 12 },
  heading: { ...neverType.display, textAlign: 'left' },
  subheading: { maxWidth: 430, ...neverType.body, marginTop: 10 },
  examples: { gap: 0 },
  sectionLabel: { ...neverType.eyebrow, marginBottom: 8 },
  example: {
    minHeight: 54,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  exampleText: { flex: 1, fontSize: 14.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.15 },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 2 },
  privacyText: { flex: 1, fontSize: 10.75, lineHeight: 16 },
  user: {
    alignSelf: 'flex-end',
    maxWidth: '86%',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  userEyebrow: { fontSize: 7.75, lineHeight: 10, fontWeight: '700', letterSpacing: 1.1, marginBottom: 5 },
  userText: { fontSize: 13.75, lineHeight: 20 },
  assistant: { paddingHorizontal: 2, gap: 10 },
  thinkingRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 9 },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  answerMark: { width: 26, height: 26, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  answerEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.25 },
  mode: { marginLeft: 'auto', fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  answerTitle: { fontSize: 19, lineHeight: 24, fontWeight: '600', letterSpacing: -0.35 },
  answerBody: { fontSize: 13.75, lineHeight: 21 },
  answerLinks: { gap: 0, marginTop: 2 },
  answerLink: {
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  answerLinkText: { flex: 1, gap: 3 },
  answerLinkLabel: { fontSize: 12.5, lineHeight: 16, fontWeight: '600' },
  answerLinkUrl: { fontSize: 10.75, lineHeight: 15 },
  answerMeta: { fontSize: 10.25, lineHeight: 15 },
  thinking: { fontSize: 12 },
  sources: { marginTop: 8, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 2 },
  sourcesHeader: { minHeight: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sourcesLabel: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1 },
  sourcesCount: { fontSize: 9.75, lineHeight: 13 },
  sourceRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceGlyph: { width: 32, height: 32, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  sourceTitle: { fontSize: 13, lineHeight: 16, fontWeight: '600' },
  sourceMeta: { marginTop: 2, fontSize: 10.5, lineHeight: 14 },
  composerWrap: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  composer: {
    minHeight: 54,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 16,
    paddingRight: 7,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    overflow: 'hidden',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  composerReflection: { position: 'absolute', top: 0, left: 20, right: 20, height: StyleSheet.hairlineWidth },
  input: { flex: 1, minHeight: 47, maxHeight: 120, fontSize: 14, lineHeight: 19, paddingTop: 13, paddingBottom: 11 },
  send: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  locked: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 28
  },
  lockedMark: { width: 48, height: 48, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  lockedEyebrow: { ...neverType.eyebrow, marginBottom: 10 },
  primary: { minHeight: 48, minWidth: 190, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  primaryText: { fontWeight: '700', fontSize: 13.5 },
  secondary: { minHeight: 44, paddingHorizontal: 2, justifyContent: 'center', marginTop: 8 },
  secondaryText: { fontSize: 12.5, fontWeight: '600' }
});
