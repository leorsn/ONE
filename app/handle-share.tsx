import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { router } from 'expo-router';
import { useIncomingShare } from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaptureReviewEditor } from '@/src/capture/CaptureReviewEditor';
import type { CaptureDraft } from '@/src/capture/core';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { recordLastNativeError, recordNativeAcceptanceEvent } from '@/src/native/acceptance';
import { isRecentlyHandledShare, markShareHandled } from '@/src/native/shareGuard';
import { selectShareCandidate } from '@/src/native/sharePayload';
import { notificationSaveWarning } from '@/src/notifications/status';
import { extractTextFromImage } from '@/src/ocr/extractText';
import { mergeLateOcrDraft } from '@/src/ocr/mergeLateOcr';
import { createItemFromShare, createShareDraft } from '@/src/sharing/ingest';
import { persistLocalAttachment, removeLocalAttachment } from '@/src/storage/attachments';
import { IconTile, PrimaryButton, SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

type OcrState = 'idle' | 'reading' | 'ready' | 'empty' | 'failed';
type AttachmentState = 'idle' | 'securing' | 'ready' | 'failed';

export default function HandleShareScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { add } = useItems();
  const { sharedPayloads, resolvedSharedPayloads, isResolving, error, clearSharedPayloads } = useIncomingShare();

  const [saving, setSaving] = useState(false);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [extractedText, setExtractedText] = useState('');
  const [reviewedDraft, setReviewedDraft] = useState<CaptureDraft | null>(null);
  const [attachmentState, setAttachmentState] = useState<AttachmentState>('idle');
  const [localAttachmentUri, setLocalAttachmentUri] = useState<string | null>(null);
  const userEditedRef = useRef(false);
  const extractedTextEditedRef = useRef(false);
  const attachmentRef = useRef<string | null>(null);
  const attachmentCommittedRef = useRef(false);
  const attachmentRevisionRef = useRef(0);

  const selected = useMemo(
    () => selectShareCandidate(sharedPayloads, resolvedSharedPayloads),
    [sharedPayloads, resolvedSharedPayloads]
  );
  const selectedFingerprint = selected?.fingerprint;
  const selectedRepresentationCount = selected?.representationCount;
  const primary = selected ? sharedPayloads[selected.index] : undefined;
  const resolved = selected ? resolvedSharedPayloads[selected.index] : undefined;
  const contentUri = resolved && 'contentUri' in resolved ? resolved.contentUri : null;
  const isImage = resolved?.contentType === 'image' || primary?.shareType === 'image';
  const isAttachment = Boolean(contentUri) && Boolean(
    primary && ['image', 'file', 'video', 'audio'].includes(primary.shareType || '')
  );
  const imageUri = isImage ? localAttachmentUri : null;

  const automaticDraft = useMemo(
    () => primary ? createShareDraft({ payload: primary, resolved, extractedText }) : null,
    [primary, resolved, extractedText]
  );
  const draft = reviewedDraft ?? automaticDraft;
  const visibleOcrState: OcrState = imageUri ? ocrState : 'idle';

  useEffect(() => {
    if (!selectedFingerprint) return;
    void recordNativeAcceptanceEvent(
      'share_received',
      `${selectedFingerprint}:${selectedRepresentationCount ?? 1} representation(s)`
    );
  }, [selectedFingerprint, selectedRepresentationCount]);

  useEffect(() => {
    let cancelled = false;
    async function resetReviewForNewShare() {
      await Promise.resolve();
      if (cancelled) return;
      userEditedRef.current = false;
      extractedTextEditedRef.current = false;
      setExtractedText('');
      setReviewedDraft(null);
      setOcrState('idle');
      setAllowDuplicate(false);
    }
    void resetReviewForNewShare();
    return () => { cancelled = true; };
  }, [selectedFingerprint]);

  useEffect(() => {
    const revision = ++attachmentRevisionRef.current;
    const previous = attachmentRef.current;
    const previousCommitted = attachmentCommittedRef.current;
    let cancelled = false;
    attachmentCommittedRef.current = false;

    async function secureAttachment() {
      await Promise.resolve();

      if (previous && !previousCommitted) {
        await removeLocalAttachment(previous);
      }
      if (attachmentRef.current === previous) attachmentRef.current = null;
      if (cancelled || revision !== attachmentRevisionRef.current) return;

      setLocalAttachmentUri(null);

      if (!isAttachment || !contentUri) {
        setAttachmentState('idle');
        return;
      }

      setAttachmentState('securing');
      try {
        const persisted = await persistLocalAttachment({
          uri: contentUri,
          originalName: resolved?.originalName
        });

        if (cancelled || revision !== attachmentRevisionRef.current) {
          await removeLocalAttachment(persisted);
          return;
        }

        attachmentRef.current = persisted;
        setLocalAttachmentUri(persisted);
        setAttachmentState('ready');
        await recordNativeAcceptanceEvent('attachment_persisted', resolved?.contentType || primary?.shareType || 'share');
      } catch (attachmentError) {
        if (cancelled || revision !== attachmentRevisionRef.current) return;
        setAttachmentState('failed');
        await recordLastNativeError('share-attachment', attachmentError);
        await recordNativeAcceptanceEvent('attachment_failed', 'share');
      }
    }

    void secureAttachment();
    return () => { cancelled = true; };
  }, [selectedFingerprint, isAttachment, contentUri, resolved?.originalName, resolved?.contentType, primary?.shareType]);

  useEffect(() => () => {
    attachmentRevisionRef.current += 1;
    const local = attachmentRef.current;
    if (local && !attachmentCommittedRef.current) {
      void removeLocalAttachment(local);
    }
  }, []);

  useEffect(() => {
    const ocrImageUri = imageUri;
    if (!ocrImageUri) return;

    let cancelled = false;

    async function readImage(uri: string) {
      await Promise.resolve();
      if (cancelled) return;
      setOcrState('reading');

      try {
        const result = await extractTextFromImage(uri);
        if (cancelled) return;
        const text = result.text.trim();
        setExtractedText(text);
        setOcrState(text ? 'ready' : 'empty');

        if (text) {
          const interpreted = primary
            ? createShareDraft({ payload: primary, resolved, extractedText: text })
            : null;
          if (interpreted) {
            setReviewedDraft((current) => current
              ? mergeLateOcrDraft({
                  current,
                  interpreted,
                  extractedText: text,
                  userEdited: userEditedRef.current,
                  extractedTextEdited: extractedTextEditedRef.current
                })
              : current
            );
          }
        }

        await recordNativeAcceptanceEvent(text ? 'ocr_success' : 'ocr_empty', 'share-image');
      } catch (ocrError) {
        if (cancelled) return;
        console.warn('NEVER OCR failed', ocrError);
        setOcrState('failed');
        await recordLastNativeError('share-ocr', ocrError);
        await recordNativeAcceptanceEvent('ocr_failed', 'share-image');
      }
    }

    void readImage(ocrImageUri);
    return () => { cancelled = true; };
  }, [imageUri, primary, resolved]);

  const preview = useMemo(() => {
    if (!primary) return 'Waiting for shared content…';
    if (primary.shareType === 'text') return primary.value || 'Shared text';
    if (primary.shareType === 'url') return primary.value || 'Shared link';
    return resolved?.originalName || primary.value || 'Shared attachment';
  }, [primary, resolved]);

  async function handleSave() {
    if (!primary || !draft || !selected || saving) return;

    if (isAttachment && attachmentState !== 'ready') {
      Alert.alert(
        attachmentState === 'failed' ? 'Attachment not secured' : 'Securing attachment',
        attachmentState === 'failed'
          ? 'NEVER did not save this attachment because its private local copy could not be created. Try sharing it again.'
          : 'Wait a moment while NEVER secures the original file locally.'
      );
      return;
    }

    setSaving(true);
    try {
      if (!allowDuplicate && await isRecentlyHandledShare(selected.fingerprint)) {
        await recordNativeAcceptanceEvent('share_duplicate_blocked', selected.fingerprint);
        Alert.alert(
          'Already saved recently',
          'NEVER received the same native share again. This can happen when iOS replays a share handoff.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Save again', onPress: () => setAllowDuplicate(true) }
          ]
        );
        return;
      }

      const item = createItemFromShare({
        payload: primary,
        resolved,
        context: draft.userContext || '',
        storedAttachmentPath: localAttachmentUri || undefined,
        extractedText: draft.extractedText || extractedText,
        draft
      });

      const savedItem = await add(item);
      attachmentCommittedRef.current = true;
      await markShareHandled(selected.fingerprint);
      await recordNativeAcceptanceEvent('share_saved', selected.fingerprint);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearSharedPayloads();
      setReviewedDraft(null);
      setAllowDuplicate(false);

      const reminderWarning = notificationSaveWarning(savedItem);
      if (reminderWarning) Alert.alert('Saved to NEVER', reminderWarning);

      router.replace(savedItem.destination === 'saved' ? '/(tabs)/saved' : '/(tabs)');
    } catch (saveError) {
      await recordLastNativeError('share-save', saveError);
      Alert.alert('Could not save to NEVER', 'The shared content was not discarded. Try saving again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    attachmentRevisionRef.current += 1;
    const local = attachmentRef.current;
    attachmentRef.current = null;
    if (local && !attachmentCommittedRef.current) await removeLocalAttachment(local);
    clearSharedPayloads();
    setReviewedDraft(null);
    setAllowDuplicate(false);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={4}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.nav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel share"
              onPress={() => void handleCancel()}
              style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
            >
              <OneIcon name={icons.close} size={16} color={theme.text} />
            </Pressable>
            <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.hero}>
            <Text style={[styles.eyebrow, { color: theme.chrome }]}>INCOMING</Text>
            <Text style={[styles.title, { color: theme.text }]}>Save what matters.</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>NEVER keeps the original content, recognizes useful details where possible and lets you review the memory before it is saved.</Text>
          </View>

          {isResolving ? (
            <View style={[styles.stateCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <ActivityIndicator color={theme.chrome} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.stateTitle, { color: theme.text }]}>Opening shared content</Text>
                <Text style={[styles.stateText, { color: theme.textSecondary }]}>Preparing the best available representation…</Text>
              </View>
            </View>
          ) : null}

          {error ? (
            <View style={[styles.notice, { backgroundColor: theme.fill, borderColor: theme.border }]}>
              <OneIcon name={icons.more} size={15} color={theme.warning} />
              <Text style={[styles.noticeText, { color: theme.textSecondary }]}>Some shared details could not be resolved. The available content can still be reviewed.</Text>
            </View>
          ) : null}

          {primary ? (
            <>
              <View style={styles.section}>
                <SectionHeader title="Original" meta={selected && selected.representationCount > 1 ? `${selected.representationCount} representations` : undefined} />
                <View style={[styles.originalCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={[styles.image, { backgroundColor: theme.fill }]} resizeMode="cover" />
                  ) : (
                    <View style={[styles.originalIcon, { backgroundColor: theme.fill, borderColor: theme.border }]}>
                      <OneIcon name={primary.shareType === 'url' ? icons.link : icons.upload} size={24} color={theme.chrome} />
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.kind, { color: theme.textTertiary }]}>{labelFor(primary.shareType)}</Text>
                    <Text style={[styles.previewTitle, { color: theme.text }]} numberOfLines={4}>{preview}</Text>
                  </View>
                </View>
              </View>

              {isAttachment ? (
                <StatusLine
                  icon={attachmentState === 'failed' ? icons.more : icons.lock}
                  tone={attachmentState === 'failed' ? 'warning' : 'chrome'}
                  title={attachmentState === 'ready' ? 'Original secured' : attachmentState === 'securing' ? 'Securing original' : attachmentState === 'failed' ? 'Original not secured' : 'Preparing original'}
                  body={attachmentMessage(attachmentState)}
                  loading={attachmentState === 'securing'}
                />
              ) : null}

              {isImage ? (
                <StatusLine
                  icon={visibleOcrState === 'ready' ? icons.check : icons.screenshot}
                  tone={visibleOcrState === 'ready' ? 'success' : ['failed', 'empty'].includes(visibleOcrState) ? 'warning' : 'chrome'}
                  title={ocrHeadline(visibleOcrState)}
                  body={ocrMeta(visibleOcrState)}
                  loading={visibleOcrState === 'reading'}
                />
              ) : null}

              {draft ? (
                <View style={styles.section}>
                  <SectionHeader title="Recognized and organized" />
                  <CaptureReviewEditor
                    draft={draft}
                    onChange={(nextDraft) => {
                      userEditedRef.current = true;
                      if (nextDraft.extractedText !== draft.extractedText) extractedTextEditedRef.current = true;
                      setReviewedDraft(nextDraft);
                    }}
                  />
                </View>
              ) : null}

              <View style={[styles.storageLine, { borderTopColor: theme.border }]}>
                <OneIcon name={icons.cloud} size={13} color={theme.chrome} />
                <Text style={[styles.storageText, { color: theme.textTertiary }]}>
                  {session
                    ? 'NEVER saves locally first. Account sync can retry when the network is available.'
                    : 'This capture stays on this device until you sign in.'}
                </Text>
              </View>

              <PrimaryButton
                label={saving ? 'Saving…' : allowDuplicate ? 'Save again' : 'Save to NEVER'}
                icon={icons.check}
                onPress={handleSave}
                disabled={saving || !draft?.title.trim() || (isAttachment && attachmentState !== 'ready')}
              />
            </>
          ) : !isResolving ? (
            <Surface>
              <View style={styles.emptyState}>
                <IconTile icon={icons.upload} tone="neutral" size={42} />
                <Text style={[styles.stateTitle, { color: theme.text }]}>Nothing usable arrived</Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>Return to the iOS Share Sheet and choose NEVER again. Empty or unsupported content is never saved silently.</Text>
              </View>
            </Surface>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function StatusLine({ icon, tone, title, body, loading = false }: {
    icon: (typeof icons)[keyof typeof icons];
    tone: 'chrome' | 'success' | 'warning';
    title: string;
    body: string;
    loading?: boolean;
  }) {
    const color = tone === 'success' ? theme.success : tone === 'warning' ? theme.warning : theme.chrome;
    return (
      <View style={[styles.statusLine, { borderTopColor: theme.border }]}>
        <View style={[styles.statusIcon, { backgroundColor: theme.fill, borderColor: theme.border }]}>
          <OneIcon name={icon} size={15} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.statusBody, { color: theme.textSecondary }]}>{body}</Text>
        </View>
        {loading ? <ActivityIndicator size="small" color={theme.chrome} /> : null}
      </View>
    );
  }
}

function labelFor(type?: string) {
  if (type === 'url') return 'LINK';
  if (type === 'image') return 'IMAGE';
  if (type === 'file') return 'FILE';
  if (type === 'video') return 'VIDEO';
  if (type === 'audio') return 'AUDIO';
  return 'TEXT';
}

function attachmentMessage(state: AttachmentState) {
  if (state === 'securing') return 'Creating a private local copy before NEVER treats the attachment as saved.';
  if (state === 'ready') return 'The original is safely available locally before recognition or cloud sync.';
  if (state === 'failed') return 'NEVER will not claim this attachment as saved because the local copy could not be created.';
  return 'Preparing the attachment…';
}

function ocrHeadline(state: OcrState) {
  if (state === 'reading') return 'Reading what matters';
  if (state === 'ready') return 'Text recognized';
  if (state === 'empty') return 'No readable text found';
  if (state === 'failed') return 'Text recognition unavailable';
  return 'Screenshot ready';
}

function ocrMeta(state: OcrState) {
  if (state === 'reading') return 'You can continue reviewing while on-device recognition runs.';
  if (state === 'ready') return 'Recognized text is included in the review below.';
  if (state === 'empty') return 'The original image is preserved and can still be saved.';
  if (state === 'failed') return 'The original screenshot can still be saved without recognized text.';
  return 'Waiting for recognition.';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 48, gap: 22 },
  nav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 11, fontWeight: '600', letterSpacing: 3.2 },
  hero: { paddingTop: 10, paddingBottom: 2 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.1 },
  title: { marginTop: 11, maxWidth: 520, fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  subtitle: { marginTop: 9, maxWidth: 560, fontSize: 13, lineHeight: 19.5 },
  section: { gap: 10 },
  originalCard: { minHeight: 96, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 13, shadowOpacity: 0.03, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  originalIcon: { width: 70, height: 70, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  image: { width: 70, height: 70, borderRadius: 15 },
  kind: { fontSize: 8, fontWeight: '700', letterSpacing: 1.25 },
  previewTitle: { marginTop: 6, fontSize: 14.5, lineHeight: 19, fontWeight: '600', letterSpacing: -0.12 },
  notice: { minHeight: 54, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
  stateCard: { minHeight: 70, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  stateTitle: { fontSize: 13.5, lineHeight: 17, fontWeight: '600' },
  stateText: { marginTop: 3, fontSize: 10.75, lineHeight: 15 },
  statusLine: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusIcon: { width: 34, height: 34, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 12.25, lineHeight: 16, fontWeight: '600' },
  statusBody: { marginTop: 2, fontSize: 10.5, lineHeight: 15 },
  storageLine: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  storageText: { flex: 1, fontSize: 10.5, lineHeight: 15 },
  emptyState: { minHeight: 160, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyText: { marginTop: 9, maxWidth: 360, fontSize: 11.5, lineHeight: 17, textAlign: 'center' }
});