import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { IconTile } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
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
          <IconTile icon={icons.crown} size={54} />
          <Text style={[styles.heading, { color: theme.text }]}>Ask NEVER is part of NEVER AI.</Text>
          <Text style={[styles.subheading, { color: theme.textSecondary }]}>Search remains available without AI. NEVER AI adds conversational recall over your own saved memories.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View NEVER AI"
            onPress={() => router.push('/upgrade')}
            style={({ pressed }) => [styles.primary, { backgroundColor: theme.accent, borderColor: theme.accent, opacity: pressed ? 0.74 : 1 }]}
          >
            <Text style={[styles.primaryText, { color: theme.onAccent }]}>View NEVER AI</Text>
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
              style={({ pressed }) => [styles.navButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
            >
              <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
            </Pressable>
            <View style={styles.navCenter}>
              <Text style={[styles.navTitle, { color: theme.text }]}>Ask NEVER</Text>
              <Text style={[styles.navMeta, { color: theme.textTertiary }]}>Grounded in your memory</Text>
            </View>
            {messages.length ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear conversation"
                onPress={() => setMessages([])}
                style={({ pressed }) => [styles.navButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
              >
                <OneIcon name={icons.close} size={15} color={theme.textSecondary} />
              </Pressable>
            ) : <View style={{ width: 40 }} />}
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
                  <View style={[styles.heroMark, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                    <OneIcon name={icons.ask} size={25} color={theme.chrome} />
                  </View>
                  <Text style={[styles.heading, { color: theme.text }]}>Ask what you saved.</Text>
                  <Text style={[styles.subheading, { color: theme.textSecondary }]}>NEVER retrieves relevant memories first, then answers only from those sources.</Text>
                </View>
                <View style={styles.examples}>
                  {examples.map((example) => (
                    <Pressable
                      key={example}
                      accessibilityRole="button"
                      accessibilityLabel={example}
                      onPress={() => submitQuestion(example)}
                      style={({ pressed }) => [
                        styles.example,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                          shadowColor: theme.shadow,
                          opacity: pressed ? 0.58 : 1
                        }
                      ]}
                    >
                      <OneIcon name={icons.ask} size={15} color={theme.chrome} />
                      <Text style={[styles.exampleText, { color: theme.text }]}>{example}</Text>
                      <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
                    </Pressable>
                  ))}
                </View>
                <View style={[styles.privacy, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                  <OneIcon name={icons.shield} size={16} color={theme.chrome} />
                  <Text style={[styles.privacyText, { color: theme.textSecondary }]}>Only retrieved source items are eligible for AI synthesis. If AI is unavailable, NEVER falls back to grounded local recall.</Text>
                </View>
              </>
            ) : messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {sending ? (
              <View style={[styles.assistant, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]} accessibilityLabel="Looking through your memory">
                <ActivityIndicator size="small" />
                <Text style={[styles.thinking, { color: theme.textSecondary }]}>Looking through your memory…</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.composerWrap, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
            <View style={[styles.composer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={messages.length ? 'Ask a follow-up…' : 'Ask your memory'}
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
                    backgroundColor: query.trim() && !sending ? theme.accent : theme.fillStrong,
                    opacity: sending ? 0.6 : 1
                  }
                ]}
              >
                <OneIcon name={icons.upload} size={16} color={query.trim() && !sending ? theme.onAccent : theme.textTertiary} />
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function MessageBubble({ message }: { message: ChatMessage }) {
    if (message.role === 'user') {
      return (
        <View style={styles.userRow}>
          <View style={[styles.user, { backgroundColor: theme.accent }]}>
            <Text style={[styles.userText, { color: theme.onAccent }]}>{message.text}</Text>
          </View>
        </View>
      );
    }

    const sources = (message.sourceIds || [])
      .map((id) => itemById.get(id))
      .filter((item): item is OneItem => Boolean(item))
      .slice(0, 6);

    return (
      <View style={[styles.assistant, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <View style={styles.answerHeader}>
          <OneIcon name={icons.ask} size={15} color={theme.chrome} />
          <Text style={[styles.answerEyebrow, { color: theme.chrome }]}>NEVER</Text>
          {message.mode ? <Text style={[styles.mode, { color: theme.textTertiary }]}>{message.mode === 'ai' ? 'SYNTHESIZED' : 'GROUNDED'}</Text> : null}
        </View>
        {message.title ? <Text style={[styles.answerTitle, { color: theme.text }]}>{message.title}</Text> : null}
        {message.body ? <Text style={[styles.answerBody, { color: theme.textSecondary }]}>{message.body}</Text> : null}
        {message.meta ? <Text style={[styles.answerMeta, { color: theme.textTertiary }]}>{message.meta}</Text> : null}

        {sources.length ? (
          <View style={[styles.sources, { borderTopColor: theme.border }]}>
            <Text style={[styles.sourcesLabel, { color: theme.textTertiary }]}>SOURCES</Text>
            {sources.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Open source ${item.title}`}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                style={({ pressed }) => [styles.sourceRow, { opacity: pressed ? 0.58 : 1 }]}
              >
                <IconTile icon={iconForType(item.type)} tone="neutral" size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sourceTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.sourceMeta, { color: theme.textSecondary }]} numberOfLines={1}>{sourceMeta(item)}</Text>
                </View>
                <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
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

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },
  nav: { minHeight: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navCenter: { alignItems: 'center', gap: 2 },
  navTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.15 },
  navMeta: { fontSize: 10, fontWeight: '600', letterSpacing: 0.15 },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 26, gap: 12 },
  emptyContent: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 26, gap: 26 },
  hero: { alignItems: 'center', gap: 11, paddingHorizontal: 18 },
  heroMark: { width: 56, height: 56, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  heading: { fontSize: 26, lineHeight: 32, fontWeight: '700', textAlign: 'center', letterSpacing: -0.55 },
  subheading: { maxWidth: 410, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  examples: { gap: 9 },
  example: { minHeight: 56, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11, shadowOpacity: 0.045, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
  exampleText: { flex: 1, fontSize: 13.5, fontWeight: '600', letterSpacing: -0.08 },
  privacy: { minHeight: 60, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 17.5 },
  userRow: { alignItems: 'flex-end' },
  user: { maxWidth: '84%', borderRadius: 18, borderBottomRightRadius: 6, paddingHorizontal: 14, paddingVertical: 10 },
  userText: { fontSize: 14, lineHeight: 20 },
  assistant: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 9, shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 1 },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  answerEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.15 },
  mode: { marginLeft: 'auto', fontSize: 9, fontWeight: '700', letterSpacing: 0.65 },
  answerTitle: { fontSize: 17.5, lineHeight: 23, fontWeight: '700', letterSpacing: -0.2 },
  answerBody: { fontSize: 13.75, lineHeight: 20.5 },
  answerMeta: { fontSize: 11, lineHeight: 16 },
  thinking: { fontSize: 12.5 },
  sources: { marginTop: 5, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth, gap: 4 },
  sourcesLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.85, marginBottom: 4 },
  sourceRow: { minHeight: 51, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sourceTitle: { fontSize: 13.25, fontWeight: '700' },
  sourceMeta: { marginTop: 2, fontSize: 11 },
  composerWrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  composer: { minHeight: 54, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingLeft: 15, paddingRight: 7, flexDirection: 'row', alignItems: 'flex-end', gap: 8, shadowOpacity: 0.055, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 1 },
  input: { flex: 1, minHeight: 47, maxHeight: 120, fontSize: 14.75, paddingTop: 13, paddingBottom: 11 },
  send: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  locked: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', justifyContent: 'center', alignItems: 'center', padding: 28, gap: 14 },
  primary: { minHeight: 50, minWidth: 220, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryText: { fontWeight: '700', fontSize: 14.25 },
  secondary: { minHeight: 44, paddingHorizontal: 18, justifyContent: 'center' },
  secondaryText: { fontSize: 13, fontWeight: '700' }
});
