import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { CaptureReviewEditor } from '@/src/capture/CaptureReviewEditor';
import { interpretCapture, type CaptureDraft } from '@/src/capture/core';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { recordLastNativeError, recordNativeAcceptanceEvent } from '@/src/native/acceptance';
import { mapNativePermissionState } from '@/src/native/permissions';
import { notificationSaveWarning } from '@/src/notifications/status';
import { extractTextFromImage } from '@/src/ocr/extractText';
import { mergeLateOcrDraft } from '@/src/ocr/mergeLateOcr';
import { persistLocalAttachment, removeLocalAttachment } from '@/src/storage/attachments';
import { IconTile, PrimaryButton, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

type ScanState = 'empty' | 'reading' | 'ready' | 'no_text' | 'failed';

export default function ScanScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { add } = useItems();
  const [state, setState] = useState<ScanState>('empty');
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [localAttachmentUri, setLocalAttachmentUri] = useState<string | null>(null);
  const [draft, setDraft] = useState<CaptureDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const userEditedRef = useRef(false);
  const extractedTextEditedRef = useRef(false);
  const localAttachmentRef = useRef<string | null>(null);
  const attachmentCommittedRef = useRef(false);
  const processingRevisionRef = useRef(0);

  useEffect(() => () => {
    processingRevisionRef.current += 1;
    if (localAttachmentRef.current && !attachmentCommittedRef.current) {
      void removeLocalAttachment(localAttachmentRef.current);
    }
  }, []);

  async function takePhoto() {
    try {
      let permission = await ImagePicker.getCameraPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        permission = await ImagePicker.requestCameraPermissionsAsync();
      }

      if (!permission.granted) {
        showPermissionAlert('Camera', mapNativePermissionState(permission));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.9 });
      if (result.canceled) return;
      if (result.assets[0]) await processAsset(result.assets[0]);
    } catch (error) {
      await recordLastNativeError('camera', error);
      Alert.alert('Camera unavailable', 'NEVER could not open the camera. Your existing memories are unchanged.');
    }
  }

  async function choosePhoto() {
    try {
      let permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permission.granted) {
        showPermissionAlert('Photos', mapNativePermissionState(permission));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: false, quality: 1, selectionLimit: 1 });
      if (result.canceled) return;
      if (result.assets[0]) await processAsset(result.assets[0]);
    } catch (error) {
      await recordLastNativeError('photo-picker', error);
      Alert.alert('Photos unavailable', 'NEVER could not open your photo library. Nothing was changed.');
    }
  }

  async function processAsset(nextAsset: ImagePicker.ImagePickerAsset) {
    const revision = ++processingRevisionRef.current;
    userEditedRef.current = false;
    extractedTextEditedRef.current = false;
    attachmentCommittedRef.current = false;

    try {
      if (localAttachmentRef.current) {
        await removeLocalAttachment(localAttachmentRef.current);
      }
      if (revision !== processingRevisionRef.current) return;

      const persisted = await persistLocalAttachment({
        uri: nextAsset.uri,
        originalName: nextAsset.fileName || `scan-${Date.now()}.jpg`
      });

      if (revision !== processingRevisionRef.current) {
        await removeLocalAttachment(persisted);
        return;
      }

      localAttachmentRef.current = persisted;
      setLocalAttachmentUri(persisted);
      await recordNativeAcceptanceEvent('attachment_persisted', 'scan');

      const stableAsset = { ...nextAsset, uri: persisted };
      setAsset(stableAsset);
      setState('reading');
      setDraft(interpretCapture({
        rawText: stableAsset.fileName || 'Scanned document',
        sourceType: 'scan',
        isImage: true
      }));

      try {
        const result = await extractTextFromImage(persisted);
        if (revision !== processingRevisionRef.current) return;

        const text = result.text.trim();
        if (!text) {
          setState('no_text');
          await recordNativeAcceptanceEvent('ocr_empty', 'scan');
          return;
        }

        const interpreted = interpretCapture({
          rawText: stableAsset.fileName || 'Scanned document',
          extractedText: text,
          sourceType: 'scan',
          isImage: true
        });

        if (revision !== processingRevisionRef.current) return;
        setDraft((current) => mergeLateOcrDraft({
          current,
          interpreted,
          extractedText: text,
          userEdited: userEditedRef.current,
          extractedTextEdited: extractedTextEditedRef.current
        }));
        setState('ready');
        await recordNativeAcceptanceEvent('ocr_success', 'scan');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (ocrError) {
        if (revision !== processingRevisionRef.current) return;
        console.warn('NEVER scan OCR failed', ocrError);
        setState('failed');
        await recordLastNativeError('scan-ocr', ocrError);
        await recordNativeAcceptanceEvent('ocr_failed', 'scan');
      }
    } catch (error) {
      if (revision !== processingRevisionRef.current) return;
      await recordLastNativeError('scan-attachment', error);
      await recordNativeAcceptanceEvent('attachment_failed', 'scan');
      setAsset(null);
      setLocalAttachmentUri(null);
      localAttachmentRef.current = null;
      setState('empty');
      Alert.alert('Could not secure image', 'NEVER could not copy this image into private local storage. The scan was not claimed as saved.');
    }
  }

  async function saveScan() {
    if (!asset || !draft || !localAttachmentUri || saving) return;
    setSaving(true);

    try {
      const item = buildItemFromCapture({
        draft,
        sourceType: 'scan',
        rawInput: draft.extractedText || draft.title,
        localAttachmentUri,
        attachmentMimeType: asset.mimeType || 'image/jpeg',
        attachmentName: asset.fileName || `scan-${Date.now()}.jpg`
      });

      const savedItem = await add(item);
      attachmentCommittedRef.current = true;
      processingRevisionRef.current += 1;
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const reminderWarning = notificationSaveWarning(savedItem);
      if (reminderWarning) Alert.alert('Saved to NEVER', reminderWarning);
      router.replace(savedItem.destination === 'saved' ? '/(tabs)/saved' : '/(tabs)');
    } catch (error) {
      await recordLastNativeError('scan-save', error);
      Alert.alert('Could not save scan', 'NEVER could not save this scan. The private local image remains available while this screen is open. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function showPermissionAlert(label: 'Camera' | 'Photos', state: ReturnType<typeof mapNativePermissionState>) {
    const permanentlyDenied = state === 'denied';
    Alert.alert(
      `${label} access ${permanentlyDenied ? 'denied' : 'needed'}`,
      permanentlyDenied
        ? `Enable ${label.toLowerCase()} access for NEVER in iOS Settings to continue.`
        : `NEVER needs ${label.toLowerCase()} access for this scan action.`,
      [
        { text: 'Cancel', style: 'cancel' },
        ...(permanentlyDenied ? [{ text: 'Open Settings', onPress: () => void Linking.openSettings() }] : [])
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={4}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.nav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
            >
              <OneIcon name={icons.chevronLeft} size={17} color={theme.text} />
            </Pressable>
            <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.hero}>
            <Text style={[styles.eyebrow, { color: theme.chrome }]}>SCAN</Text>
            <Text style={[styles.title, { color: theme.text }]}>Turn paper into memory.</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Capture a receipt, ticket or document. NEVER preserves the original, reads what it can and lets you review the result before saving.</Text>
          </View>

          {!asset ? (
            <Surface padded>
              <View style={styles.emptyScan}>
                <View style={[styles.documentStage, { backgroundColor: theme.fill, borderColor: theme.border }]}>
                  <View style={[styles.paper, { backgroundColor: theme.surfaceElevated, borderColor: theme.fillStrong, shadowColor: theme.shadow }]}>
                    <View style={styles.paperHeader}>
                      <OneIcon name={icons.document} size={16} color={theme.chrome} />
                      <Text style={[styles.paperLabel, { color: theme.textTertiary }]}>DOCUMENT</Text>
                    </View>
                    <View style={[styles.paperLine, styles.paperLineStrong, { backgroundColor: theme.text }]} />
                    <View style={[styles.paperLine, { backgroundColor: theme.textTertiary }]} />
                    <View style={[styles.paperLine, styles.paperLineShort, { backgroundColor: theme.textTertiary }]} />
                  </View>
                  <View style={[styles.scanCorners, { borderColor: theme.chrome }]} />
                </View>

                <Text style={[styles.emptyTitle, { color: theme.text }]}>Ready when the document is.</Text>
                <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Keep important text visible and avoid strong glare. You can also choose an existing image.</Text>

                <View style={styles.actions}>
                  <PrimaryButton label="Open camera" icon={icons.scan} onPress={takePhoto} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choose a photo"
                    onPress={choosePhoto}
                    style={({ pressed }) => [styles.secondaryButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
                  >
                    <OneIcon name={icons.screenshot} size={16} color={theme.text} />
                    <Text style={[styles.secondaryText, { color: theme.text }]}>Choose photo</Text>
                  </Pressable>
                </View>
              </View>
            </Surface>
          ) : (
            <>
              <View style={styles.previewBlock}>
                <Text style={[styles.sectionEyebrow, { color: theme.textTertiary }]}>ORIGINAL</Text>
                <Image source={{ uri: asset.uri }} style={[styles.preview, { backgroundColor: theme.fill, borderColor: theme.border }]} resizeMode="cover" />
              </View>

              <View style={[styles.statusCard, { backgroundColor: state === 'ready' ? theme.surfaceElevated : theme.fill, borderColor: theme.border, shadowColor: theme.shadow }]}>
                <IconTile icon={state === 'ready' ? icons.check : icons.scan} tone={state === 'ready' ? 'success' : 'neutral'} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusEyebrow, { color: state === 'ready' ? theme.chrome : theme.textTertiary }]}>NEVER · {state === 'ready' ? 'RECOGNIZED' : 'PROCESSING'}</Text>
                  <Text style={[styles.noticeTitle, { color: theme.text }]}>{scanHeadline(state)}</Text>
                  <Text style={[styles.noticeText, { color: theme.textSecondary }]}>{scanMeta(state)}</Text>
                </View>
                {state === 'reading' ? <ActivityIndicator size="small" /> : null}
              </View>

              {draft ? (
                <View style={styles.reviewBlock}>
                  <Text style={[styles.sectionEyebrow, { color: theme.textTertiary }]}>RECOGNIZED AND ORGANIZED</Text>
                  <CaptureReviewEditor
                    draft={draft}
                    onChange={(nextDraft) => {
                      userEditedRef.current = true;
                      if (nextDraft.extractedText !== draft.extractedText) extractedTextEditedRef.current = true;
                      setDraft(nextDraft);
                    }}
                  />
                </View>
              ) : null}

              <View style={[styles.storageLine, { borderTopColor: theme.border }]}>
                <OneIcon name={icons.lock} size={14} color={theme.chrome} />
                <Text style={[styles.storageText, { color: theme.textTertiary }]}>
                  {session
                    ? 'Original secured locally. Cloud upload can retry if the network is unavailable.'
                    : 'Original secured on this device until you sign in.'}
                </Text>
              </View>

              <PrimaryButton label={saving ? 'Saving…' : 'Save to NEVER'} icon={icons.check} onPress={saveScan} disabled={saving || !draft?.title.trim()} />

              <Pressable accessibilityRole="button" accessibilityLabel="Scan again" onPress={takePhoto} style={styles.rescan}>
                <Text style={[styles.rescanText, { color: theme.textSecondary }]}>Scan another document</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function scanHeadline(state: ScanState) {
  if (state === 'reading') return 'Reading what matters…';
  if (state === 'ready') return 'Recognized and organized';
  if (state === 'no_text') return 'No readable text found';
  if (state === 'failed') return 'Text recognition unavailable';
  return 'Ready';
}

function scanMeta(state: ScanState) {
  if (state === 'reading') return 'The private original is already safe. You can review while recognition continues.';
  if (state === 'ready') return 'Review the structured details before saving. Explicit totals remain the only values treated as receipt totals.';
  if (state === 'no_text') return 'The original is preserved. Add the useful details manually if you want to keep them searchable.';
  if (state === 'failed') return 'The original is preserved and can still be classified and saved.';
  return '';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 48,
    gap: 22
  },
  nav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 11, fontWeight: '600', letterSpacing: 3.2 },
  hero: { paddingTop: 12, paddingBottom: 4 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.1 },
  title: { marginTop: 11, maxWidth: 520, fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  subtitle: { marginTop: 9, maxWidth: 560, fontSize: 13, lineHeight: 19.5 },
  emptyScan: { paddingVertical: 4 },
  documentStage: { height: 196, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  paper: { width: 128, height: 156, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 15, shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 1 },
  paperHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  paperLabel: { fontSize: 7.5, fontWeight: '700', letterSpacing: 1.05 },
  paperLine: { width: '78%', height: 3, borderRadius: 2, marginTop: 14, opacity: 0.28 },
  paperLineStrong: { width: '62%', marginTop: 20, opacity: 0.72 },
  paperLineShort: { width: '46%' },
  scanCorners: { position: 'absolute', width: 154, height: 180, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, opacity: 0.45 },
  emptyTitle: { marginTop: 20, fontSize: 16.5, lineHeight: 21, fontWeight: '600', letterSpacing: -0.2 },
  emptyBody: { marginTop: 7, maxWidth: 430, fontSize: 12, lineHeight: 18 },
  actions: { width: '100%', marginTop: 20, gap: 9 },
  secondaryButton: { minHeight: 50, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { fontSize: 13, fontWeight: '600' },
  previewBlock: { gap: 9 },
  sectionEyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.45 },
  preview: { width: '100%', height: 320, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth },
  statusCard: { minHeight: 82, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, shadowOpacity: 0.025, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  statusEyebrow: { fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  noticeTitle: { marginTop: 4, fontSize: 13.5, lineHeight: 17, fontWeight: '600' },
  noticeText: { marginTop: 3, fontSize: 11.25, lineHeight: 16 },
  reviewBlock: { gap: 9 },
  storageLine: { paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  storageText: { flex: 1, fontSize: 10.5, lineHeight: 15 },
  rescan: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  rescanText: { fontSize: 12, fontWeight: '600' }
});