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
import { buildDirectAnswer } from '@/src/search/answer';
import { buildFollowUpAnswer } from '@/src/search/followUp';
import { searchOneItems } from '@/src/search/searchItems';
import { searchSemantically, type SemanticMatch } from '@/src/search/semantic';
import { iconForType } from '@/src/ui/OneItemRow';
import { IconTile, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

type CombinedResult = {
  item: OneItem;
  score: number;
  semanticSimilarity?: number;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  title?: string;
  body?: string;
  meta?: string;
  itemIds?: string[];
};

const examples = [
  'How much did I spend this month?',
  'Show me invoices over €500',
  'Which ideas did I save for Dad’s birthday?',
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

  const lastAssistantItemIds = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === 'assistant' && message.itemIds?.length) return message.itemIds;
    }
    return [];
  }, [messages]);

  async function submitQuestion(value = query) {
    const clean = value.trim();
    if (!clean || sending) return;

    await Haptics.selectionAsync();

    const userMessage: ChatMessage = {
      id: makeId('user'),
      role: 'user',
      text: clean
    };

    setMessages((current) => [...current, userMessage]);
    setQuery('');
    setSending(true);

    try {
      const lexical = searchOneItems(clean, items);
      let semantic: SemanticMatch[] = [];

      if (session?.user.id && clean.length >= 3) {
        try {
          semantic = await searchSemantically(clean);
        } catch (error) {
          console.warn('ONE semantic conversation search failed', error);
        }
      }

      const combined = combineResults(items, lexical, semantic);

      const contextual = buildFollowUpAnswer(clean, items, lastAssistantItemIds);
      const direct = contextual || buildDirectAnswer(clean, items, combined[0]?.item);

      const assistantMessage: ChatMessage = direct
        ? {
            id: makeId('assistant'),
            role: 'assistant',
            title: direct.title,
            body: direct.body,
            meta: direct.meta,
            itemIds: direct.itemIds
          }
        : combined.length
          ? {
              id: makeId('assistant'),
              role: 'assistant',
              title: combined.length === 1 ? 'I found one relevant memory.' : 'I found ' + String(combined.length) + ' relevant memories.',
              body: summarizeMatches(combined.slice(0, 4)),
              meta: session?.user.id ? 'Meaning + keyword recall' : 'Keyword recall',
              itemIds: combined.map((result) => result.item.id)
            }
          : {
              id: makeId('assistant'),
              role: 'assistant',
              title: 'I couldn’t find that in ONE yet.',
              body: 'Try another wording, or save more context so ONE can connect it later.',
              itemIds: []
            };

      setMessages((current) => [...current, assistantMessage]);

      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    } finally {
      setSending(false);
    }
  }

  if (!hasAi) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <View style={[styles.lockedContent, { justifyContent: 'center' }]}>
          <View style={styles.hero}>
            <IconTile icon={icons.crown} size={52} />
            <Text style={[styles.heading, { color: theme.text }]}>Ask ONE is part of ONE AI.</Text>
            <Text style={[styles.subheading, { color: theme.textSecondary }]}>
              Upgrade to search your personal memory by meaning and ask natural-language questions.
            </Text>
          </View>
          <Pressable onPress={() => router.push('/upgrade')} style={[styles.lockedButton, { backgroundColor: theme.accent }]}>
            <Text style={styles.lockedButtonText}>View ONE AI</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.lockedBack}>
            <Text style={[styles.lockedBackText, { color: theme.textSecondary }]}>Not now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={4}
      >
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <View style={styles.navCenter}>
            <Text style={[styles.navTitle, { color: theme.text }]}>Ask ONE</Text>
            <Text style={[styles.navMeta, { color: theme.textTertiary }]}>ONE AI</Text>
          </View>
          {messages.length ? (
            <Pressable
              onPress={() => setMessages([])}
              style={[styles.navButton, { backgroundColor: theme.fill }]}
            >
              <OneIcon name={icons.close} size={15} color={theme.textSecondary} />
            </Pressable>
          ) : <View style={{ width: 40 }} />}
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={messages.length ? styles.chatContent : styles.emptyChatContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!messages.length ? (
            <>
              <View style={styles.hero}>
                <IconTile icon={icons.ask} size={52} />
                <Text style={[styles.heading, { color: theme.text }]}>Your memory, in conversation.</Text>
                <Text style={[styles.subheading, { color: theme.textSecondary }]}>
                  Ask a question, then keep going. ONE carries the relevant memories into your follow-up.
                </Text>
              </View>

              <View style={styles.examples}>
                {examples.map((example) => (
                  <Pressable
                    key={example}
                    onPress={() => submitQuestion(example)}
                    style={({ pressed }) => [
                      styles.example,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        opacity: pressed ? 0.62 : 1
                      }
                    ]}
                  >
                    <OneIcon name={icons.ask} size={16} color={theme.accent} />
                    <Text style={[styles.exampleText, { color: theme.text }]}>{example}</Text>
                    <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
                  </Pressable>
                ))}
              </View>

              <View style={[styles.privacy, { backgroundColor: theme.accentSoft }]}>
                <OneIcon name={icons.shield} size={17} color={theme.accent} />
                <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
                  Answers are grounded in your own ONE memories. Semantic recall is scoped to your account.
                </Text>
              </View>
            </>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
              />
            ))
          )}

          {sending ? (
            <View style={[styles.assistantBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.thinking}>
                <ActivityIndicator size="small" />
                <Text style={[styles.thinkingText, { color: theme.textSecondary }]}>Looking through your memory…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.composerWrap, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <View style={[styles.composer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={messages.length ? 'Ask a follow-up…' : 'Ask your memory'}
              placeholderTextColor={theme.textTertiary}
              style={[styles.input, { color: theme.text }]}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={() => submitQuestion()}
            />
            <Pressable
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
              <OneIcon name={icons.upload} size={16} color={query.trim() && !sending ? '#FFFFFF' : theme.textTertiary} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function MessageBubble({ message }: { message: ChatMessage }) {
    if (message.role === 'user') {
      return (
        <View style={styles.userRow}>
          <View style={[styles.userBubble, { backgroundColor: theme.accent }]}>
            <Text style={styles.userText}>{message.text}</Text>
          </View>
        </View>
      );
    }

    const supportingItems = (message.itemIds || [])
      .map((id) => itemById.get(id))
      .filter((item): item is OneItem => Boolean(item))
      .slice(0, 4);

    return (
      <View style={[styles.assistantBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.answerHeader}>
          <OneIcon name={icons.ask} size={16} color={theme.accent} />
          <Text style={[styles.answerEyebrow, { color: theme.accent }]}>ONE</Text>
        </View>

        {message.title ? (
          <Text style={[styles.answerTitle, { color: theme.text }]}>{message.title}</Text>
        ) : null}

        {message.body ? (
          <Text style={[styles.answerBody, { color: theme.textSecondary }]}>{message.body}</Text>
        ) : null}

        {message.meta ? (
          <Text style={[styles.answerMeta, { color: theme.textTertiary }]}>{message.meta}</Text>
        ) : null}

        {supportingItems.length ? (
          <View style={[styles.supporting, { borderTopColor: theme.border }]}>
            <Text style={[styles.supportingLabel, { color: theme.textTertiary }]}>SUPPORTING MEMORIES</Text>
            {supportingItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}
                style={({ pressed }) => [styles.memoryRow, { opacity: pressed ? 0.6 : 1 }]}
              >
                <IconTile icon={iconForType(item.type)} tone="neutral" size={34} />
                <View style={styles.memoryText}>
                  <Text style={[styles.memoryTitle, { color: theme.text }]} numberOfLines={1}>
                    {item.merchant || item.title}
                  </Text>
                  <Text style={[styles.memoryMeta, { color: theme.textSecondary }]} numberOfLines={1}>
                    {memoryMeta(item)}
                  </Text>
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

function combineResults(
  items: OneItem[],
  lexical: ReturnType<typeof searchOneItems>,
  semantic: SemanticMatch[]
): CombinedResult[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const combined = new Map<string, CombinedResult>();

  for (const result of lexical) {
    combined.set(result.item.id, {
      item: result.item,
      score: result.score
    });
  }

  for (const match of semantic) {
    const item = itemById.get(match.itemId);
    if (!item) continue;

    const existing = combined.get(item.id);
    combined.set(item.id, {
      item,
      score: (existing?.score ?? 0) + match.similarity * 12,
      semanticSimilarity: match.similarity
    });
  }

  return Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

function summarizeMatches(results: CombinedResult[]) {
  return results
    .map(({ item }) => {
      const amount = formatMoney(item);
      return [item.merchant || item.title, amount, item.date].filter(Boolean).join(' · ');
    })
    .join('\n');
}

function memoryMeta(item: OneItem) {
  return [
    formatType(item.documentKind || item.type),
    formatMoney(item),
    item.date,
    item.category
  ]
    .filter(Boolean)
    .join(' · ');
}

function formatMoney(item: OneItem) {
  if (item.amount === undefined) return undefined;

  try {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: item.currency || 'EUR'
    }).format(item.amount);
  } catch {
    return item.amount.toFixed(2) + ' ' + (item.currency || 'EUR');
  }
}

function formatType(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function makeId(prefix: string) {
  return prefix + '-' + String(Date.now()) + '-' + Math.random().toString(36).slice(2, 7);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  nav: { minHeight: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navCenter: { alignItems: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  navMeta: { marginTop: 1, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.7 },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 22, gap: 14 },
  emptyChatContent: { paddingHorizontal: 20, paddingTop: 36, paddingBottom: 22, gap: 24 },
  hero: { alignItems: 'center' },
  heading: { marginTop: 14, maxWidth: 340, textAlign: 'center', fontSize: 29, lineHeight: 34, fontWeight: '800', letterSpacing: -0.8 },
  subheading: { marginTop: 8, maxWidth: 340, textAlign: 'center', fontSize: 13.5, lineHeight: 19 },
  examples: { gap: 9 },
  example: { minHeight: 58, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  exampleText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  privacy: { minHeight: 58, borderRadius: 17, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyText: { flex: 1, fontSize: 11.5, lineHeight: 17 },
  userRow: { alignItems: 'flex-end' },
  userBubble: { maxWidth: '84%', borderRadius: 20, borderBottomRightRadius: 7, paddingHorizontal: 15, paddingVertical: 11 },
  userText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20, fontWeight: '600' },
  assistantBubble: { maxWidth: '94%', borderRadius: 21, borderBottomLeftRadius: 7, borderWidth: StyleSheet.hairlineWidth, padding: 15, alignSelf: 'flex-start' },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  answerEyebrow: { fontSize: 10.5, fontWeight: '900', letterSpacing: 1 },
  answerTitle: { marginTop: 9, fontSize: 20, lineHeight: 25, fontWeight: '800', letterSpacing: -0.35 },
  answerBody: { marginTop: 6, fontSize: 13.5, lineHeight: 20 },
  answerMeta: { marginTop: 7, fontSize: 10.5, lineHeight: 15 },
  supporting: { marginTop: 13, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth },
  supportingLabel: { marginBottom: 4, fontSize: 9.5, fontWeight: '900', letterSpacing: 0.8 },
  memoryRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 9 },
  memoryText: { flex: 1, minWidth: 0 },
  memoryTitle: { fontSize: 13, fontWeight: '700' },
  memoryMeta: { marginTop: 3, fontSize: 10.5 },
  thinking: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 10 },
  thinkingText: { fontSize: 12.5 },
  composerWrap: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, borderTopWidth: StyleSheet.hairlineWidth },
  composer: { minHeight: 52, maxHeight: 112, borderWidth: StyleSheet.hairlineWidth, borderRadius: 19, paddingLeft: 14, paddingRight: 7, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 48, maxHeight: 96, paddingTop: 13, paddingBottom: 11, fontSize: 14.5, lineHeight: 20 },
  send: { width: 38, height: 38, marginBottom: 6, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  lockedContent: { flex: 1, paddingHorizontal: 20, gap: 18 },
  lockedButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  lockedButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  lockedBack: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  lockedBackText: { fontSize: 13, fontWeight: '700' }
});
