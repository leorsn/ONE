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

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.9
      });

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

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1
      });

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
      Alert.alert(
        'Could not save scan',
        'NEVER could not save this scan. The private local image remains available while this screen is open. Try again.'
      );
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
        ...(permanentlyDenied
          ? [{ text: 'Open Settings', onPress: () => void Linking.openSettings() }]
          : [])
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
              style={({ pressed }) => [styles.navButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
            >
              <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
            </Pressable>
            <Text style={[styles.navTitle, { color: theme.text }]}>Scan to NEVER</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.hero}>
            <View style={[styles.heroMark, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
              <OneIcon name={icons.scan} size={24} color={theme.chrome} />
            </View>
            <Text style={[styles.title, { color: theme.text }]}>Turn paper into memory.</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Scan receipts, invoices, tickets and documents. OCR runs on-device where supported.</Text>
          </View>

          {!asset ? (
            <Surface padded>
              <View style={styles.emptyScan}>
                <View style={[styles.scanFrame, { borderColor: theme.fillStrong }]}>
                  <OneIcon name={icons.document} size={32} color={theme.textTertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Ready to scan</Text>
                <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Keep the document flat and make sure the important text is readable.</Text>
                <View style={styles.actions}>
                  <PrimaryButton label="Open camera" icon={icons.scan} onPress={takePhoto} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Choose a photo"
                    onPress={choosePhoto}
                    style={({ pressed }) => [styles.secondaryButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
                  >
                    <OneIcon name={icons.screenshot} size={18} color={theme.text} />
                    <Text style={[styles.secondaryText, { color: theme.text }]}>Choose photo</Text>
                  </Pressable>
                </View>
              </View>
            </Surface>
          ) : (
            <>
              <Image source={{ uri: asset.uri }} style={[styles.preview, { backgroundColor: theme.fill, borderColor: theme.border }]} resizeMode="cover" />

              <View style={[styles.notice, { backgroundColor: ['failed', 'no_text'].includes(state) ? theme.fill : theme.chromeSoft, borderColor: theme.border }]}>
                <IconTile icon={icons.scan} tone={state === 'ready' ? 'success' : 'neutral'} size={38} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.noticeTitle, { color: theme.text }]}>{scanHeadline(state)}</Text>
                  <Text style={[styles.noticeText, { color: theme.textSecondary }]}>{scanMeta(state)}</Text>
                </View>
                {state === 'reading' ? <ActivityIndicator size="small" /> : null}
              </View>

              {draft ? (
                <CaptureReviewEditor
                  draft={draft}
                  onChange={(nextDraft) => {
                    userEditedRef.current = true;
                    if (nextDraft.extractedText !== draft.extractedText) {
                      extractedTextEditedRef.current = true;
                    }
                    setDraft(nextDraft);
                  }}
                />
              ) : null}

              <View style={[styles.notice, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                <OneIcon name={icons.cloud} size={17} color={theme.chrome} />
                <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                  {session
                    ? 'The original image is already secured locally. Cloud upload retries if the network is unavailable.'
                    : 'The original image is already secured on this device until you sign in.'}
                </Text>
              </View>

              <PrimaryButton
                label={saving ? 'Saving…' : 'Save to NEVER'}
                icon={icons.check}
                onPress={saveScan}
                disabled={saving || !draft?.title.trim()}
              />

              <Pressable accessibilityRole="button" accessibilityLabel="Scan again" onPress={takePhoto} style={styles.rescan}>
                <Text style={[styles.rescanText, { color: theme.chrome }]}>Scan again</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function scanHeadline(state: ScanState) {
  if (state === 'reading') return 'Reading document…';
  if (state === 'ready') return 'Document understood';
  if (state === 'no_text') return 'No readable text found';
  if (state === 'failed') return 'OCR unavailable';
  return 'Ready';
}

function scanMeta(state: ScanState) {
  if (state === 'reading') return 'The private original is safe. You can save now while OCR continues.';
  if (state === 'ready') return 'Only explicit totals are treated as receipt totals. Review before saving.';
  if (state === 'no_text') return 'The original image is preserved. Add details manually if useful.';
  if (state === 'failed') return 'The original image is preserved and can still be classified and saved.';
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
    gap: 19
  },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.15 },
  hero: { alignItems: 'center', paddingTop: 12, paddingBottom: 6 },
  heroMark: { width: 56, height: 56, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 15, fontSize: 27.5, lineHeight: 33, fontWeight: '700', letterSpacing: -0.85, textAlign: 'center' },
  subtitle: { marginTop: 9, maxWidth: 420, fontSize: 13.25, lineHeight: 19.5, textAlign: 'center' },
  emptyScan: { alignItems: 'center', paddingVertical: 9 },
  scanFrame: { width: 124, height: 154, borderRadius: 20, borderWidth: 1.25, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 19, fontSize: 16.5, fontWeight: '700', letterSpacing: -0.15 },
  emptyBody: { marginTop: 7, maxWidth: 340, textAlign: 'center', fontSize: 12.25, lineHeight: 18 },
  actions: { width: '100%', marginTop: 19, gap: 9 },
  secondaryButton: { minHeight: 50, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { fontSize: 13.5, fontWeight: '700' },
  preview: { width: '100%', height: 300, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  notice: { minHeight: 60, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeTitle: { fontSize: 13.25, fontWeight: '700' },
  noticeText: { flex: 1, marginTop: 2, fontSize: 11.5, lineHeight: 16.5 },
  rescan: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  rescanText: { fontSize: 12.75, fontWeight: '700' }
});
