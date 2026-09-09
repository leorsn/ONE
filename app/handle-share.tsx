import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useIncomingShare } from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { extractTextFromImage } from '@/src/ocr/extractText';
import { createItemFromShare } from '@/src/sharing/ingest';
import { uploadSharedAttachment } from '@/src/supabase/attachments';
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

  const [context, setContext] = useState('');
  const [saving, setSaving] = useState(false);
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [extractedText, setExtractedText] = useState('');

  const primary = sharedPayloads[0];
  const resolved = resolvedSharedPayloads[0];
  const imageUri = resolved?.contentType === 'image' ? resolved.contentUri : null;

  useEffect(() => {
    if (!imageUri) {
      setOcrState('idle');
      setExtractedText('');
      return;
    }

    let cancelled = false;
    setOcrState('reading');

    extractTextFromImage(imageUri)
      .then((result) => {
        if (cancelled) return;
        setExtractedText(result.text);
        setOcrState('ready');
      })
      .catch((ocrError) => {
        if (cancelled) return;
        console.warn('ONE OCR failed', ocrError);
        setExtractedText('');
        setOcrState('failed');
      });

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
    if (!primary) return;

    setSaving(true);
    try {
      let storedAttachmentPath: string | undefined;
      const contentUri = resolved && 'contentUri' in resolved ? resolved.contentUri : null;
      const isAttachment = Boolean(contentUri) && ['image', 'file', 'video', 'audio'].includes(primary.shareType || '');

      if (isAttachment && contentUri) {
        if (session?.user.id) {
          storedAttachmentPath = await uploadSharedAttachment({
            uri: contentUri,
            mimeType: resolved?.contentMimeType,
            originalName: resolved?.originalName,
            userId: session.user.id
          });
        } else {
          storedAttachmentPath = await persistLocalAttachment({
            uri: contentUri,
            originalName: resolved?.originalName
          });
        }
      }

      const item = createItemFromShare({
        payload: primary,
        resolved,
        context,
        storedAttachmentPath,
        extractedText
      });

      await add(item);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearSharedPayloads();
      router.replace('/(tabs)/saved');
    } catch (saveError) {
      Alert.alert('Could not save to ONE', saveError instanceof Error ? saveError.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    clearSharedPayloads();
    router.replace('/(tabs)');
  }

  const waitingForOcr = Boolean(imageUri) && ocrState === 'reading';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable onPress={handleCancel} style={[styles.navButton, { backgroundColor: theme.fill }]}>
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
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>ONE could not fully resolve this share. Raw content can still be saved.</Text>
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
              <View style={styles.block}>
                <SectionHeader title="Screenshot intelligence" />
                <Surface padded>
                  <View style={styles.ocrHeader}>
                    <IconTile icon={icons.screenshot} tone={ocrState === 'ready' ? 'success' : 'neutral'} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ocrTitle, { color: theme.text }]}>{ocrHeadline(ocrState)}</Text>
                      <Text style={[styles.ocrMeta, { color: theme.textSecondary }]}>{ocrMeta(ocrState)}</Text>
                    </View>
                    {ocrState === 'reading' ? <ActivityIndicator size="small" /> : null}
                    {ocrState === 'ready' ? <OneIcon name={icons.check} size={17} color={theme.success} /> : null}
                  </View>
                  {extractedText ? (
                    <View style={[styles.ocrTextWrap, { borderTopColor: theme.border }]}>
                      <Text style={[styles.ocrText, { color: theme.textSecondary }]} numberOfLines={7}>{extractedText}</Text>
                    </View>
                  ) : null}
                </Surface>
              </View>
            ) : null}

            <View style={styles.block}>
              <SectionHeader title="Add context" meta="Optional" />
              <TextInput
                value={context}
                onChangeText={setContext}
                placeholder="Gift Dad, Barcelona, Tax 2026…"
                placeholderTextColor={theme.textTertiary}
                style={[styles.contextInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                multiline
              />
              <Text style={[styles.contextHelp, { color: theme.textTertiary }]}>
                A few words make this much easier to find later with Ask ONE.
              </Text>
            </View>

            {!session && ['image', 'file', 'video', 'audio'].includes(primary.shareType || '') ? (
              <View style={[styles.notice, { backgroundColor: theme.accentSoft }]}>
                <OneIcon name={icons.cloud} size={17} color={theme.accent} />
                <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                  Sign in to keep shared files privately synced across devices.
                </Text>
              </View>
            ) : null}

            <PrimaryButton
              label={saving ? 'Saving…' : waitingForOcr ? 'Reading screenshot…' : 'Save to ONE'}
              icon={icons.check}
              onPress={handleSave}
              disabled={saving || waitingForOcr}
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
  if (state === 'failed') return 'Recognition unavailable';
  return 'Ready for analysis';
}

function ocrMeta(state: OcrState) {
  if (state === 'reading') return 'Apple Vision / ML Kit';
  if (state === 'ready') return 'Included in ONE recall';
  if (state === 'failed') return 'You can still save the screenshot';
  return 'Private OCR';
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
  ocrHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  ocrTitle: { fontSize: 15, fontWeight: '700' },
  ocrMeta: { marginTop: 3, fontSize: 12 },
  ocrTextWrap: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth },
  ocrText: { fontSize: 12.5, lineHeight: 18 },
  contextInput: { minHeight: 112, borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 15, fontSize: 15, lineHeight: 20, textAlignVertical: 'top' },
  contextHelp: { marginLeft: 2, fontSize: 11.5, lineHeight: 16 },
  notice: { minHeight: 54, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  center: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 9 },
  stateTitle: { fontSize: 15, fontWeight: '700' },
  stateText: { fontSize: 12.5, textAlign: 'center' }
});
