import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useIncomingShare } from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CaptureReviewEditor } from '@/src/capture/CaptureReviewEditor';
import type { CaptureDraft } from '@/src/capture/core';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { extractTextFromImage } from '@/src/ocr/extractText';
import { createItemFromShare, createShareDraft } from '@/src/sharing/ingest';
import { persistLocalAttachment } from '@/src/storage/attachments';
import { IconTile, PrimaryButton, SectionHeader, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

type OcrState = 'idle' | 'reading' | 'ready' | 'failed';

export default function HandleShareScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { add } = useItems();
  const { sharedPayloads, resolvedSharedPayloads, isResolving, error, clearSharedPayloads } = useIncomingShare();

  const [saving, setSaving] = useState(false);
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [extractedText, setExtractedText] = useState('');
  const [reviewedDraft, setReviewedDraft] = useState<CaptureDraft | null>(null);

  const primary = sharedPayloads[0];
  const resolved = resolvedSharedPayloads[0];
  const imageUri = resolved?.contentType === 'image' ? resolved.contentUri : null;

  const automaticDraft = useMemo(
    () => primary
      ? createShareDraft({ payload: primary, resolved, extractedText })
      : null,
    [primary, resolved, extractedText]
  );
  const draft = reviewedDraft ?? automaticDraft;
  const visibleOcrState: OcrState = imageUri ? ocrState : 'idle';

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
        setExtractedText(result.text);
        setOcrState('ready');
        setReviewedDraft((current) => current ? { ...current, extractedText: result.text || undefined } : current);
      } catch (ocrError) {
        if (cancelled) return;
        console.warn('ONE OCR failed', ocrError);
        setOcrState('failed');
      }
    }

    void readImage(ocrImageUri);
    return () => {
      cancelled = true;
    };
  }, [imageUri]);

  const preview = useMemo(() => {
    if (!primary) return 'Waiting for shared content…';
    if (primary.shareType === 'text') return primary.value || 'Shared text';
    if (primary.shareType === 'url') return primary.value || 'Shared link';
    return resolved?.originalName || primary.value || 'Shared attachment';
  }, [primary, resolved]);

  async function handleSave() {
    if (!primary || !draft || saving) return;

    setSaving(true);
    try {
      const contentUri = resolved && 'contentUri' in resolved ? resolved.contentUri : null;
      const isAttachment = Boolean(contentUri) && ['image', 'file', 'video', 'audio'].includes(primary.shareType || '');
      let localAttachmentUri: string | undefined;

      if (isAttachment && contentUri) {
        localAttachmentUri = await persistLocalAttachment({
          uri: contentUri,
          originalName: resolved?.originalName
        });
      }

      const item = createItemFromShare({
        payload: primary,
        resolved,
        context: draft.userContext || '',
        storedAttachmentPath: localAttachmentUri,
        extractedText: draft.extractedText || extractedText,
        draft
      });

      await add(item);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearSharedPayloads();
      setReviewedDraft(null);

      const actionable = ['appointment', 'reminder', 'task', 'event'].includes(item.type);
      router.replace(actionable ? '/(tabs)' : '/(tabs)/saved');
    } catch (saveError) {
      Alert.alert(
        'Could not save to ONE',
        saveError instanceof Error
          ? saveError.message
          : 'The shared content was not discarded. Try saving again.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    clearSharedPayloads();
    setReviewedDraft(null);
    router.replace('/(tabs)');
  }

  const waitingForOcr = Boolean(imageUri) && visibleOcrState === 'reading';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel share" onPress={handleCancel} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.close} size={17} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Save to ONE</Text>
          <View style={{ width: 40 }} />
        </View>

        {isResolving ? (
          <Surface padded>
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={[styles.stateText, { color: theme.textSecondary }]}>Reading shared content…</Text>
            </View>
          </Surface>
        ) : null}

        {error ? (
          <View style={[styles.notice, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.more} size={17} color={theme.warning} />
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>ONE could not fully resolve this share. The raw content can still be reviewed and saved.</Text>
          </View>
        ) : null}

        {primary ? (
          <>
            <View style={styles.block}>
              <SectionHeader title="Shared content" />
              <Surface padded>
                <View style={styles.previewRow}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <IconTile icon={primary.shareType === 'url' ? icons.link : icons.upload} size={58} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.kind, { color: theme.accent }]}>{labelFor(primary.shareType)}</Text>
                    <Text style={[styles.previewTitle, { color: theme.text }]} numberOfLines={4}>{preview}</Text>
                  </View>
                </View>
              </Surface>
            </View>

            {imageUri ? (
              <View style={[styles.notice, { backgroundColor: visibleOcrState === 'failed' ? theme.fill : theme.accentSoft }]}>
                <IconTile icon={icons.screenshot} tone={visibleOcrState === 'ready' ? 'success' : 'neutral'} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ocrTitle, { color: theme.text }]}>{ocrHeadline(visibleOcrState)}</Text>
                  <Text style={[styles.ocrMeta, { color: theme.textSecondary }]}>{ocrMeta(visibleOcrState)}</Text>
                </View>
                {visibleOcrState === 'reading' ? <ActivityIndicator size="small" /> : null}
              </View>
            ) : null}

            {draft ? <CaptureReviewEditor draft={draft} onChange={setReviewedDraft} /> : null}

            <View style={[styles.notice, { backgroundColor: theme.accentSoft }]}>
              <OneIcon name={icons.cloud} size={17} color={theme.accent} />
              <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                {session
                  ? 'ONE saves locally first. Account sync retries automatically when the network is available.'
                  : 'This capture stays on this device until you sign in.'}
              </Text>
            </View>

            <PrimaryButton
              label={saving ? 'Saving…' : waitingForOcr ? 'Reading screenshot…' : 'Save to ONE'}
              icon={icons.check}
              onPress={handleSave}
              disabled={saving || waitingForOcr || !draft?.title.trim()}
            />
          </>
        ) : !isResolving ? (
          <Surface>
            <View style={styles.center}>
              <IconTile icon={icons.upload} tone="neutral" size={46} />
              <Text style={[styles.stateTitle, { color: theme.text }]}>No shared content</Text>
              <Text style={[styles.stateText, { color: theme.textSecondary }]}>Return to the share sheet and choose ONE again.</Text>
            </View>
          </Surface>
        ) : null}
      </ScrollView>
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

function ocrHeadline(state: OcrState) {
  if (state === 'reading') return 'Reading on-device';
  if (state === 'ready') return 'Text recognized';
  if (state === 'failed') return 'OCR unavailable';
  return 'Screenshot ready';
}

function ocrMeta(state: OcrState) {
  if (state === 'reading') return 'Private native OCR';
  if (state === 'ready') return 'Review the recognized text before saving';
  if (state === 'failed') return 'The original screenshot can still be saved';
  return 'Waiting for OCR';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 20 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  block: { gap: 10 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  image: { width: 76, height: 76, borderRadius: 16 },
  kind: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },
  previewTitle: { marginTop: 5, fontSize: 15.5, lineHeight: 20, fontWeight: '700' },
  notice: { minHeight: 56, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  ocrTitle: { fontSize: 13.5, fontWeight: '700' },
  ocrMeta: { marginTop: 2, fontSize: 11.5, lineHeight: 16 },
  center: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 9 },
  stateTitle: { fontSize: 15, fontWeight: '700' },
  stateText: { fontSize: 12.5, textAlign: 'center' }
});
