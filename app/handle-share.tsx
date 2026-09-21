import { neverType } from '@/src/theme/tokens';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Group, V5IconButton, V5LargeHeader, V5SectionHeader, useNeverV5Palette } from '@/src/ui/appleV5';

type OcrState = 'idle' | 'reading' | 'ready' | 'empty' | 'failed';
type AttachmentState = 'idle' | 'securing' | 'ready' | 'failed';

export default function HandleShareScreen() {
  const p = useNeverV5Palette();
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

  const selected = useMemo(() => selectShareCandidate(sharedPayloads, resolvedSharedPayloads), [sharedPayloads, resolvedSharedPayloads]);
  const selectedFingerprint = selected?.fingerprint;
  const selectedRepresentationCount = selected?.representationCount;
  const primary = selected ? sharedPayloads[selected.index] : undefined;
  const resolved = selected ? resolvedSharedPayloads[selected.index] : undefined;
  const contentUri = resolved && 'contentUri' in resolved ? resolved.contentUri : null;
  const isImage = resolved?.contentType === 'image' || primary?.shareType === 'image';
  const isAttachment = Boolean(contentUri) && Boolean(primary && ['image', 'file', 'video', 'audio'].includes(primary.shareType || ''));
  const imageUri = isImage ? localAttachmentUri : null;

  const automaticDraft = useMemo(() => primary ? createShareDraft({ payload: primary, resolved, extractedText }) : null, [primary, resolved, extractedText]);
  const draft = reviewedDraft ?? automaticDraft;
  const visibleOcrState: OcrState = imageUri ? ocrState : 'idle';

  useEffect(() => {
    if (!selectedFingerprint) return;
    void recordNativeAcceptanceEvent('share_received', `${selectedFingerprint}:${selectedRepresentationCount ?? 1} representation(s)`);
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
      if (previous && !previousCommitted) await removeLocalAttachment(previous);
      if (attachmentRef.current === previous) attachmentRef.current = null;
      if (cancelled || revision !== attachmentRevisionRef.current) return;
      setLocalAttachmentUri(null);
      if (!isAttachment || !contentUri) {
        setAttachmentState('idle');
        return;
      }
      setAttachmentState('securing');
      try {
        const persisted = await persistLocalAttachment({ uri: contentUri, originalName: resolved?.originalName });
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
    if (local && !attachmentCommittedRef.current) void removeLocalAttachment(local);
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
          const interpreted = primary ? createShareDraft({ payload: primary, resolved, extractedText: text }) : null;
          if (interpreted) {
            setReviewedDraft((current) => current ? mergeLateOcrDraft({ current, interpreted, extractedText: text, userEdited: userEditedRef.current, extractedTextEdited: extractedTextEditedRef.current }) : current);
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
        Alert.alert('Already saved recently', 'NEVER received the same native share again. This can happen when iOS replays a share handoff.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save again', onPress: () => setAllowDuplicate(true) }
        ]);
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
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
    if (saving) return;
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
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={4}>
        <ScrollView contentContainerStyle={styles.content} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.nav}>
            <V5IconButton disabled={saving} icon={icons.close} accessibilityLabel="Cancel share" onPress={() => void handleCancel()} />
            <Text style={[styles.navTitle, { color: p.label }]}>Save to NEVER</Text>
            <View style={{ width: 44 }} />
          </View>

          <V5LargeHeader title="Save what matters." subtitle="Keep the original, recognize useful details and review the memory before it is saved." />

          {isResolving ? (
            <V5Group><View style={styles.stateRow}><ActivityIndicator color={p.chrome} /><View style={{ flex: 1 }}><Text style={[styles.stateTitle, { color: p.label }]}>Opening shared content</Text><Text style={[styles.stateText, { color: p.secondary }]}>Preparing the best available representation…</Text></View></View></V5Group>
          ) : null}

          {error ? (
            <View style={[styles.notice, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.more} size={14} color={p.warning} /><Text style={[styles.noticeText, { color: p.secondary }]}>Some shared details could not be resolved. The available content can still be reviewed.</Text></View>
          ) : null}

          {primary ? (
            <>
              <View style={styles.section}>
                <V5SectionHeader title="Original" meta={selected && selected.representationCount > 1 ? `${selected.representationCount} representations` : undefined} />
                <V5Group style={styles.originalCard}>
                  {imageUri ? <Image source={{ uri: imageUri }} style={[styles.image, { backgroundColor: p.fill }]} resizeMode="cover" /> : <View style={[styles.originalIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={primary.shareType === 'url' ? icons.link : icons.upload} size={22} color={p.chrome} /></View>}
                  <View style={{ flex: 1, minWidth: 0 }}><Text style={[styles.kind, { color: p.tertiary }]}>{labelFor(primary.shareType)}</Text><Text style={[styles.previewTitle, { color: p.label }]} numberOfLines={4}>{preview}</Text></View>
                </V5Group>
              </View>

              {isAttachment ? <StatusLine icon={attachmentState === 'failed' ? icons.more : icons.lock} tone={attachmentState === 'failed' ? 'warning' : 'chrome'} title={attachmentState === 'ready' ? 'Original secured' : attachmentState === 'securing' ? 'Securing original' : attachmentState === 'failed' ? 'Original not secured' : 'Preparing original'} body={attachmentMessage(attachmentState)} loading={attachmentState === 'securing'} /> : null}
              {isImage ? <StatusLine icon={visibleOcrState === 'ready' ? icons.check : icons.screenshot} tone={visibleOcrState === 'ready' ? 'success' : ['failed', 'empty'].includes(visibleOcrState) ? 'warning' : 'chrome'} title={ocrHeadline(visibleOcrState)} body={ocrMeta(visibleOcrState)} loading={visibleOcrState === 'reading'} /> : null}

              {draft ? (
                <View style={styles.section}>
                  <V5SectionHeader title="Review" />
                  <CaptureReviewEditor draft={draft} onChange={(nextDraft) => { userEditedRef.current = true; if (nextDraft.extractedText !== draft.extractedText) extractedTextEditedRef.current = true; setReviewedDraft(nextDraft); }} />
                </View>
              ) : null}

              <View style={styles.storageLine}><OneIcon name={icons.cloud} size={12.5} color={p.chrome} /><Text style={[styles.storageText, { color: p.tertiary }]}>{session ? 'NEVER saves locally first. Account sync can retry when the network is available.' : 'This capture stays on this device until you sign in.'}</Text></View>

              <Pressable accessibilityRole="button" disabled={saving || !draft?.title.trim() || (isAttachment && attachmentState !== 'ready')} onPress={handleSave} style={({ pressed }) => [styles.primaryButton, { backgroundColor: p.graphite, opacity: saving || !draft?.title.trim() || (isAttachment && attachmentState !== 'ready') ? 0.38 : pressed ? 0.72 : 1 }]}>
                <OneIcon name={icons.check} size={14.5} color={p.onAccent} />
                <Text style={[styles.primaryText, { color: p.onAccent }]}>{saving ? 'Saving…' : allowDuplicate ? 'Save Again' : 'Save to NEVER'}</Text>
              </Pressable>
            </>
          ) : !isResolving ? (
            <V5Group><View style={styles.emptyState}><View style={[styles.emptyIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.upload} size={18} color={p.chrome} /></View><Text style={[styles.stateTitle, { color: p.label }]}>Nothing usable arrived</Text><Text style={[styles.emptyText, { color: p.secondary }]}>Return to the iOS Share Sheet and choose NEVER again. Empty or unsupported content is never saved silently.</Text></View></V5Group>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function StatusLine({ icon, tone, title, body, loading = false }: { icon: (typeof icons)[keyof typeof icons]; tone: 'chrome' | 'success' | 'warning'; title: string; body: string; loading?: boolean }) {
    const color = tone === 'success' ? p.success : tone === 'warning' ? p.warning : p.chrome;
    return (
      <View style={styles.statusLine}>
        <View style={[styles.statusIcon, { backgroundColor: p.fillSoft }]}><OneIcon name={icon} size={14.5} color={color} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.statusTitle, { color: p.label }]}>{title}</Text><Text style={[styles.statusBody, { color: p.secondary }]}>{body}</Text></View>
        {loading ? <ActivityIndicator size="small" color={p.chrome} /> : null}
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
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 42, gap: 18 },
  nav: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: 16.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.18 },
  section: { gap: 7 },
  originalCard: { minHeight: 86, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  originalIcon: { width: 62, height: 62, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  image: { width: 62, height: 62, borderRadius: 14 },
  kind: { fontSize: 8, lineHeight: 10, fontWeight: '700', letterSpacing: 1 },
  previewTitle: { marginTop: 4, fontSize: 14, lineHeight: 18, fontWeight: '600' },
  notice: { minHeight: 50, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeText: { flex: 1, ...neverType.caption },
  stateRow: { minHeight: 64, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  stateTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  stateText: { marginTop: 2, ...neverType.caption },
  statusLine: { paddingHorizontal: 3, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 12.5, lineHeight: 16, fontWeight: '600' },
  statusBody: { marginTop: 1, ...neverType.caption },
  storageLine: { paddingHorizontal: 3, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  storageText: { flex: 1, ...neverType.caption },
  primaryButton: { minHeight: 52, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { flexShrink: 1, textAlign: 'center', fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  emptyState: { minHeight: 150, padding: 22, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 5, maxWidth: 330, ...neverType.caption, textAlign: 'center' }
});
