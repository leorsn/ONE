import { goBackOrHome } from '@/src/ui/navigation';
import { neverType } from '@/src/theme/tokens';
import { NeverNavigation } from '@/src/ui/utility';
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
import { NeverScreen } from '@/src/ui/NeverScreen';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { CaptureReviewEditor } from '@/src/capture/CaptureReviewEditor';
import { interpretCapture, type CaptureDraft } from '@/src/capture/core';
import { interpretCaptureWithIntelligence } from '@/src/capture/intelligence';
import { remoteCaptureIntelligenceProvider } from '@/src/capture/remoteIntelligence';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { recordLastNativeError, recordNativeAcceptanceEvent } from '@/src/native/acceptance';
import { mapNativePermissionState } from '@/src/native/permissions';
import { notificationSaveWarning } from '@/src/notifications/status';
import { extractTextFromImage } from '@/src/ocr/extractText';
import { mergeLateOcrDraft } from '@/src/ocr/mergeLateOcr';
import { persistLocalAttachment, removeLocalAttachment } from '@/src/storage/attachments';
import { OneIcon, icons } from '@/src/ui/icons';
import {
  V5Group,
  V5LargeHeader,
  V5SectionHeader,
  useNeverV5Palette
} from '@/src/ui/appleV5';

type ScanState = 'empty' | 'reading' | 'ready' | 'no_text' | 'failed';

export default function ScanScreen() {
  const p = useNeverV5Palette();
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
      if (localAttachmentRef.current) await removeLocalAttachment(localAttachmentRef.current);
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

        const intelligence = await interpretCaptureWithIntelligence({
          rawText: stableAsset.fileName || 'Scanned document',
          extractedText: text,
          sourceType: 'scan',
          isImage: true
        }, remoteCaptureIntelligenceProvider);
        const interpreted = intelligence.draft;

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
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      } catch (ocrError) {
        if (revision !== processingRevisionRef.current) return;
        if (__DEV__) console.warn('NEVER scan OCR failed');
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
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

  function showPermissionAlert(label: 'Camera' | 'Photos', permissionState: ReturnType<typeof mapNativePermissionState>) {
    const permanentlyDenied = permissionState === 'denied';
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
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={4}>
        <ScrollView contentContainerStyle={[styles.content, p.pageStyle]} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <NeverNavigation title="Scan" onBack={() => goBackOrHome()} />

          <V5LargeHeader
            title="Scan a document."
            subtitle="Keep the original, extract what matters, and organize it automatically."
          />

          {!asset ? (
            <V5Group style={styles.capturePanel}>
              <View style={[styles.documentStage, { borderRadius: p.radius.card, backgroundColor: p.fillSoft, borderColor: p.border }]}>
                <View style={[styles.scanFrame, { borderRadius: Math.max(8, p.radius.card - 2), borderColor: p.chromeSoft }]}>
                  <View style={[styles.paper, { borderRadius: Math.max(5, p.radius.chip), backgroundColor: p.surface, borderColor: p.border }]}>
                    <OneIcon name={icons.document} size={24} color={p.chrome} />
                    <View style={[styles.paperLine, { backgroundColor: p.tertiary }]} />
                    <View style={[styles.paperLine, styles.paperLineShort, { backgroundColor: p.tertiary }]} />
                  </View>
                </View>
              </View>

              <View style={styles.captureCopy}>
                <Text style={[styles.emptyTitle, { color: p.label }]}>Ready to scan</Text>
                <Text style={[styles.emptyBody, { color: p.secondary }]}>Keep the page flat and readable. The original stays attached to the memory after saving.</Text>
              </View>

              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={takePhoto} style={({ pressed }) => [styles.primaryButton, { borderRadius: p.radius.button, backgroundColor: p.graphite, borderColor: p.graphite, opacity: pressed ? 0.72 : 1 }]}>
                  <OneIcon name={icons.scan} size={15} color={p.onAccent} />
                  <Text style={[styles.primaryText, { color: p.onAccent }]}>Open Camera</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={choosePhoto} style={({ pressed }) => [styles.secondaryButton, { borderRadius: p.radius.button, backgroundColor: p.fillSoft, borderColor: p.border, opacity: pressed ? 0.62 : 1 }]}>
                  <OneIcon name={icons.screenshot} size={15} color={p.chrome} />
                  <Text style={[styles.secondaryText, { color: p.label }]}>Choose Photo</Text>
                </Pressable>
              </View>
            </V5Group>
          ) : (
            <>
              <View style={styles.section}>
                <V5SectionHeader title="Original" meta={stateLabel(state)} />
                <View style={[styles.previewShell, { borderRadius: p.radius.card, borderColor: p.border }]}>
                  <Image source={{ uri: asset.uri }} style={[styles.preview, { borderRadius: p.radius.card, backgroundColor: p.fill }]} resizeMode="contain" />
                  <View style={[styles.previewBadge, { borderRadius: p.radius.chip, backgroundColor: p.surface, borderColor: p.border }]}>
                    {state === 'reading'
                      ? <ActivityIndicator size="small" color={p.chrome} />
                      : <OneIcon name={state === 'ready' ? icons.check : icons.document} size={12.5} color={state === 'ready' ? p.success : p.chrome} />}
                    <Text style={[styles.previewBadgeText, { color: p.secondary }]}>{stateLabel(state)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statusLine}>
                <View style={[styles.statusDot, { backgroundColor: state === 'ready' ? p.success : p.chrome }]} />
                <View style={styles.statusCopy}>
                  <Text style={[styles.noticeTitle, { color: p.label }]}>{scanHeadline(state)}</Text>
                  <Text style={[styles.noticeText, { color: p.secondary }]}>{scanMeta(state)}</Text>
                </View>
              </View>

              {draft ? (
                <View style={styles.section}>
                  <V5SectionHeader title="Review" />
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

              <View style={styles.storageLine}>
                <OneIcon name={icons.lock} size={12} color={p.chrome} />
                <Text style={[styles.storageText, { color: p.tertiary }]}>
                  {session
                    ? 'Original secured locally. Cloud upload can retry if the network is unavailable.'
                    : 'Original secured on this device until you sign in.'}
                </Text>
              </View>

              <Pressable accessibilityRole="button"
                disabled={saving || !draft?.title.trim()}
                onPress={saveScan}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    borderRadius: p.radius.button,
                    backgroundColor: p.graphite,
                    borderColor: p.graphite,
                    opacity: saving || !draft?.title.trim() ? 0.38 : pressed ? 0.72 : 1
                  }
                ]}
              >
                <OneIcon name={icons.check} size={15} color={p.onAccent} />
                <Text style={[styles.primaryText, { color: p.onAccent }]}>{saving ? 'Saving…' : 'Save to NEVER'}</Text>
              </Pressable>

              <Pressable accessibilityRole="button" accessibilityLabel="Scan again" disabled={saving} accessibilityState={{ disabled: saving }} onPress={takePhoto} style={styles.rescan}>
                <Text style={[styles.rescanText, { color: p.secondary }]}>Scan Another Document</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </NeverScreen>
  );
}

function stateLabel(state: ScanState) {
  if (state === 'reading') return 'Reading';
  if (state === 'ready') return 'Recognized';
  if (state === 'no_text') return 'Needs Input';
  if (state === 'failed') return 'Manual Review';
  return 'Ready';
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
  if (state === 'ready') return 'Review the structured details before saving.';
  if (state === 'no_text') return 'The original is preserved. Add the useful details manually if you want to keep them searchable.';
  if (state === 'failed') return 'The original is preserved and can still be classified and saved.';
  return '';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 38, gap: 18 },
  capturePanel: { padding: 14 },
  documentStage: { height: 210, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  scanFrame: { width: 160, height: 178, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  paper: { width: 104, height: 128, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  paperLine: { width: '72%', height: 2, borderRadius: 1, marginTop: 16, opacity: 0.4 },
  paperLineShort: { width: '48%', marginTop: 9 },
  captureCopy: { paddingTop: 14, paddingHorizontal: 2 },
  emptyTitle: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  emptyBody: { marginTop: 3, ...neverType.body },
  actions: { marginTop: 15, gap: 8 },
  primaryButton: { minHeight: 52, paddingVertical: 12, paddingHorizontal: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { flexShrink: 1, textAlign: 'center', fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  secondaryButton: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { flexShrink: 1, textAlign: 'center', fontSize: 14, lineHeight: 18, fontWeight: '500' },
  section: { gap: 7 },
  previewShell: { position: 'relative', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  preview: { width: '100%', height: 320 },
  previewBadge: { position: 'absolute', right: 10, top: 10, minHeight: 30, paddingHorizontal: 10, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewBadgeText: { ...neverType.caption, fontWeight: '600' },
  statusLine: { paddingHorizontal: 3, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  statusCopy: { flex: 1 },
  noticeTitle: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  noticeText: { marginTop: 2, ...neverType.caption },
  storageLine: { paddingHorizontal: 2, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  storageText: { flex: 1, ...neverType.caption },
  rescan: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  rescanText: { ...neverType.caption, fontWeight: '600' }
});
