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
  const localAttachmentRef = useRef<string | null>(null);
  const attachmentCommittedRef = useRef(false);

  useEffect(() => () => {
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
      Alert.alert('Camera unavailable', 'ONE could not open the camera. Your existing memories are unchanged.');
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
      Alert.alert('Photos unavailable', 'ONE could not open your photo library. Nothing was changed.');
    }
  }

  async function processAsset(nextAsset: ImagePicker.ImagePickerAsset) {
    userEditedRef.current = false;
    attachmentCommittedRef.current = false;

    try {
      if (localAttachmentRef.current) {
        await removeLocalAttachment(localAttachmentRef.current);
      }

      const persisted = await persistLocalAttachment({
        uri: nextAsset.uri,
        originalName: nextAsset.fileName || `scan-${Date.now()}.jpg`
      });
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

        setDraft((current) =>
          userEditedRef.current && current
            ? { ...current, extractedText: text }
            : interpreted
        );
        setState('ready');
        await recordNativeAcceptanceEvent('ocr_success', 'scan');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (ocrError) {
        console.warn('ONE scan OCR failed', ocrError);
        setState('failed');
        await recordLastNativeError('scan-ocr', ocrError);
        await recordNativeAcceptanceEvent('ocr_failed', 'scan');
      }
    } catch (error) {
      await recordLastNativeError('scan-attachment', error);
      setAsset(null);
      setLocalAttachmentUri(null);
      localAttachmentRef.current = null;
      setState('empty');
      Alert.alert('Could not secure image', 'ONE could not copy this image into private local storage. The scan was not claimed as saved.');
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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const reminderWarning = notificationSaveWarning(savedItem);
      if (reminderWarning) Alert.alert('Saved to ONE', reminderWarning);
      router.replace(savedItem.destination === 'saved' ? '/(tabs)/saved' : '/(tabs)');
    } catch (error) {
      await recordLastNativeError('scan-save', error);
      Alert.alert(
        'Could not save scan',
        error instanceof Error ? error.message : 'The private local image is still available while this screen remains open. Try again.'
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
        ? `Enable ${label.toLowerCase()} access for ONE in iOS Settings to continue.`
        : `ONE needs ${label.toLowerCase()} access for this scan action.`,
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
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]}>
              <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
            </Pressable>
            <Text style={[styles.navTitle, { color: theme.text }]}>Scan to ONE</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.hero}>
            <IconTile icon={icons.scan} size={54} />
            <Text style={[styles.title, { color: theme.text }]}>Turn paper into memory.</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Scan receipts, invoices, tickets and documents. OCR runs on-device where supported.</Text>
          </View>

          {!asset ? (
            <Surface padded>
              <View style={styles.emptyScan}>
                <View style={[styles.scanFrame, { borderColor: theme.fillStrong }]}>
                  <OneIcon name={icons.document} size={34} color={theme.textTertiary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Ready to scan</Text>
                <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Keep the document flat and make sure the important text is readable.</Text>
                <View style={styles.actions}>
                  <PrimaryButton label="Open camera" icon={icons.scan} onPress={takePhoto} />
                  <Pressable accessibilityRole="button" accessibilityLabel="Choose a photo" onPress={choosePhoto} style={[styles.secondaryButton, { backgroundColor: theme.fill }]}>
                    <OneIcon name={icons.screenshot} size={18} color={theme.text} />
                    <Text style={[styles.secondaryText, { color: theme.text }]}>Choose photo</Text>
                  </Pressable>
                </View>
              </View>
            </Surface>
          ) : (
            <>
              <Image source={{ uri: asset.uri }} style={[styles.preview, { backgroundColor: theme.fill }]} resizeMode="cover" />

              <View style={[styles.notice, { backgroundColor: ['failed', 'no_text'].includes(state) ? theme.fill : theme.accentSoft }]}>
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
                    setDraft(nextDraft);
                  }}
                />
              ) : null}

              <View style={[styles.notice, { backgroundColor: theme.accentSoft }]}>
                <OneIcon name={icons.cloud} size={17} color={theme.accent} />
                <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                  {session
                    ? 'The original image is already secured locally. Cloud upload retries if the network is unavailable.'
                    : 'The original image is already secured on this device until you sign in.'}
                </Text>
              </View>

              <PrimaryButton
                label={saving ? 'Saving…' : 'Save to ONE'}
                icon={icons.check}
                onPress={saveScan}
                disabled={saving || !draft?.title.trim()}
              />

              <Pressable accessibilityRole="button" accessibilityLabel="Scan again" onPress={takePhoto} style={styles.rescan}>
                <Text style={[styles.rescanText, { color: theme.accent }]}>Scan again</Text>
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
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, gap: 18 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  hero: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  title: { marginTop: 14, fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { marginTop: 8, maxWidth: 330, fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  emptyScan: { alignItems: 'center', paddingVertical: 8 },
  scanFrame: { width: 126, height: 156, borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { marginTop: 18, fontSize: 17, fontWeight: '800' },
  emptyBody: { marginTop: 7, maxWidth: 300, textAlign: 'center', fontSize: 12.5, lineHeight: 18 },
  actions: { width: '100%', marginTop: 18, gap: 9 },
  secondaryButton: { minHeight: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { fontSize: 14, fontWeight: '700' },
  preview: { width: '100%', height: 300, borderRadius: 24 },
  notice: { minHeight: 58, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeTitle: { fontSize: 13.5, fontWeight: '800' },
  noticeText: { flex: 1, marginTop: 2, fontSize: 11.5, lineHeight: 16 },
  rescan: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  rescanText: { fontSize: 13, fontWeight: '700' }
});
