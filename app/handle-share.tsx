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
    return () => {
      cancelled = true;
    };
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
    return () => {
      cancelled = true;
    };
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
    return () => {
      cancelled = true;
    };
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
              style={({ pressed }) => [styles.navButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
            >
              <OneIcon name={icons.close} size={17} color={theme.text} />
            </Pressable>
            <Text style={[styles.navTitle, { color: theme.text }]}>Save to NEVER</Text>
            <View style={{ width: 40 }} />
          </View>

          {isResolving ? (
            <Surface padded>
              <View style={styles.center}>
                <ActivityIndicator color={theme.chrome} />
                <Text style={[styles.stateText, { color: theme.textSecondary }]}>Reading shared content…</Text>
              </View>
            </Surface>
          ) : null}

          {error ? (
            <View style={[styles.notice, { backgroundColor: theme.fill, borderColor: theme.border }]}>
              <OneIcon name={icons.more} size={17} color={theme.warning} />
              <Text style={[styles.noticeText, { color: theme.textSecondary }]}>NEVER could not fully resolve this share. The raw content can still be reviewed where available.</Text>
            </View>
          ) : null}

          {primary ? (
            <>
              <View style={styles.block}>
                <SectionHeader title="Shared content" meta={selected && selected.representationCount > 1 ? `${selected.representationCount} representations` : undefined} />
                <Surface padded>
                  <View style={styles.previewRow}>
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={[styles.image, { backgroundColor: theme.fill }]} resizeMode="cover" />
                    ) : (
                      <IconTile icon={primary.shareType === 'url' ? icons.link : icons.upload} size={58} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.kind, { color: theme.chrome }]}>{labelFor(primary.shareType)}</Text>
                      <Text style={[styles.previewTitle, { color: theme.text }]} numberOfLines={4}>{preview}</Text>
                    </View>
                  </View>
                </Surface>
              </View>

              {isAttachment ? (
                <View style={[styles.notice, { backgroundColor: attachmentState === 'failed' ? theme.fill : theme.chromeSoft, borderColor: theme.border }]}>
                  <OneIcon name={attachmentState === 'failed' ? icons.more : icons.saved} size={17} color={attachmentState === 'failed' ? theme.warning : theme.chrome} />
                  <Text style={[styles.noticeText, { color: theme.textSecondary }]}>{attachmentMessage(attachmentState)}</Text>
                  {attachmentState === 'securing' ? <ActivityIndicator size="small" color={theme.chrome} /> : null}
                </View>
              ) : null}

              {isImage ? (
                <View style={[styles.notice, { backgroundColor: ['failed', 'empty'].includes(visibleOcrState) ? theme.fill : theme.chromeSoft, borderColor: theme.border }]}>
                  <IconTile icon={icons.screenshot} tone={visibleOcrState === 'ready' ? 'success' : 'neutral'} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ocrTitle, { color: theme.text }]}>{ocrHeadline(visibleOcrState)}</Text>
                    <Text style={[styles.ocrMeta, { color: theme.textSecondary }]}>{ocrMeta(visibleOcrState)}</Text>
                  </View>
                  {visibleOcrState === 'reading' ? <ActivityIndicator size="small" color={theme.chrome} /> : null}
                </View>
              ) : null}

              {draft ? (
                <CaptureReviewEditor
                  draft={draft}
                  onChange={(nextDraft) => {
                    userEditedRef.current = true;
                    if (nextDraft.extractedText !== draft.extractedText) {
                      extractedTextEditedRef.current = true;
                    }
                    setReviewedDraft(nextDraft);
                  }}
                />
              ) : null}

              <View style={[styles.notice, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                <OneIcon name={icons.cloud} size={17} color={theme.chrome} />
                <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                  {session
                    ? 'NEVER saves locally first. Account sync retries automatically when the network is available.'
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
              <View style={styles.center}>
                <IconTile icon={icons.upload} tone="neutral" size={46} />
                <Text style={[styles.stateTitle, { color: theme.text }]}>No usable shared content</Text>
                <Text style={[styles.stateText, { color: theme.textSecondary }]}>Return to the share sheet and choose NEVER again. Empty or unsupported payloads are never saved silently.</Text>
              </View>
            </Surface>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
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
  if (state === 'securing') return 'Securing the original in NEVER private local storage…';
  if (state === 'ready') return 'Original secured locally before OCR or cloud sync.';
  if (state === 'failed') return 'The original could not be secured. NEVER will not claim this attachment as saved.';
  return 'Preparing attachment…';
}

function ocrHeadline(state: OcrState) {
  if (state === 'reading') return 'Reading on-device';
  if (state === 'ready') return 'Text recognized';
  if (state === 'empty') return 'No readable text found';
  if (state === 'failed') return 'OCR unavailable';
  return 'Screenshot ready';
}

function ocrMeta(state: OcrState) {
  if (state === 'reading') return 'You can save now. OCR text is included only if recognition finishes first.';
  if (state === 'ready') return 'Review the recognized text before saving.';
  if (state === 'empty') return 'The original image is still preserved and can be saved.';
  if (state === 'failed') return 'The original screenshot can still be saved.';
  return 'Waiting for OCR.';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 48, gap: 20 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.1 },
  block: { gap: 10 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  image: { width: 76, height: 76, borderRadius: 15 },
  kind: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  previewTitle: { marginTop: 5, fontSize: 15.25, lineHeight: 20, fontWeight: '700', letterSpacing: -0.1 },
  notice: { minHeight: 56, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeText: { flex: 1, fontSize: 11.75, lineHeight: 17 },
  ocrTitle: { fontSize: 13.25, fontWeight: '700' },
  ocrMeta: { marginTop: 2, fontSize: 11.25, lineHeight: 16 },
  center: { minHeight: 122, alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  stateTitle: { fontSize: 14.5, fontWeight: '700' },
  stateText: { fontSize: 12.25, lineHeight: 17, textAlign: 'center' }
});