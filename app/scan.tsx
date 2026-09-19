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
import { NeverChromeButton, NeverGlass, NeverSectionLabel, NeverWordmark } from '@/src/ui/never';
import { useTheme } from '@/src/theme/useTheme';
import { neverType } from '@/src/theme/typography';

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
              style={({ pressed }) => [
                styles.navButton,
                {
                  backgroundColor: theme.glass,
                  borderColor: theme.glassBorder,
                  opacity: pressed ? 0.62 : 1
                }
              ]}
            >
              <OneIcon name={icons.chevronLeft} size={17} color={theme.text} />
            </Pressable>
            <NeverWordmark compact />
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.hero}>
            <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>CAPTURE</Text>
            <Text style={[styles.title, { color: theme.text }]}>Scan into memory.</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Photograph a document. NEVER keeps the original and organizes what it reads.</Text>
          </View>

          {!asset ? (
            <NeverGlass tone="strong" style={styles.capturePanel}>
              <View style={[styles.documentStage, { backgroundColor: theme.fill, borderColor: theme.glassBorder }]}>
                <View style={[styles.paperShadow, { backgroundColor: theme.surfaceElevated, shadowColor: theme.shadow }]}>
                  <View style={styles.paperHeader}>
                    <OneIcon name={icons.document} size={16} color={theme.chrome} />
                    <Text style={[styles.paperLabel, { color: theme.textTertiary }]}>DOCUMENT</Text>
                  </View>
                  <View style={[styles.paperLine, styles.paperLineStrong, { backgroundColor: theme.text }]} />
                  <View style={[styles.paperLine, { backgroundColor: theme.textTertiary }]} />
                  <View style={[styles.paperLine, styles.paperLineShort, { backgroundColor: theme.textTertiary }]} />
                </View>
                <View style={[styles.scanFrame, { borderColor: theme.platinum }]} />
                <View style={[styles.scanGlow, { backgroundColor: theme.reflection }]} />
              </View>

              <View style={styles.captureCopy}>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>Ready when the document is.</Text>
                <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>Keep the page flat and readable. The original stays attached to the memory after saving.</Text>
              </View>

              <View style={styles.actions}>
                <NeverChromeButton label="Open camera" icon={icons.scan} onPress={takePhoto} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose a photo"
                  onPress={choosePhoto}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    {
                      backgroundColor: theme.platinumSoft,
                      borderColor: theme.glassBorder,
                      opacity: pressed ? 0.62 : 1
                    }
                  ]}
                >
                  <OneIcon name={icons.screenshot} size={15} color={theme.chrome} />
                  <Text style={[styles.secondaryText, { color: theme.textSecondary }]}>Choose photo</Text>
                </Pressable>
              </View>
            </NeverGlass>
          ) : (
            <>
              <View style={styles.section}>
                <NeverSectionLabel meta={stateLabel(state)}>Original</NeverSectionLabel>
                <View style={styles.previewShell}>
                  <Image source={{ uri: asset.uri }} style={[styles.preview, { backgroundColor: theme.fill }]} resizeMode="cover" />
                  <View style={[styles.previewBadge, { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}>
                    {state === 'reading' ? <ActivityIndicator size="small" color={theme.chrome} /> : <OneIcon name={state === 'ready' ? icons.check : icons.document} size={13} color={state === 'ready' ? theme.success : theme.chrome} />}
                    <Text style={[styles.previewBadgeText, { color: theme.textSecondary }]}>{stateLabel(state)}</Text>
                  </View>
                </View>
              </View>

              <NeverGlass tone="quiet" padded>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: state === 'ready' ? theme.success : theme.platinum }]} />
                  <View style={styles.statusCopy}>
                    <Text style={[styles.noticeTitle, { color: theme.text }]}>{scanHeadline(state)}</Text>
                    <Text style={[styles.noticeText, { color: theme.textSecondary }]}>{scanMeta(state)}</Text>
                  </View>
                </View>
              </NeverGlass>

              {draft ? (
                <View style={styles.section}>
                  <NeverSectionLabel>NEVER understood</NeverSectionLabel>
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
                <OneIcon name={icons.lock} size={12.5} color={theme.chrome} />
                <Text style={[styles.storageText, { color: theme.textTertiary }]}>
                  {session
                    ? 'Original secured locally. Cloud upload can retry if the network is unavailable.'
                    : 'Original secured on this device until you sign in.'}
                </Text>
              </View>

              <NeverChromeButton label={saving ? 'Saving…' : 'Save to NEVER'} icon={icons.check} onPress={saveScan} disabled={saving || !draft?.title.trim()} />

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

function stateLabel(state: ScanState) {
  if (state === 'reading') return 'Reading';
  if (state === 'ready') return 'Recognized';
  if (state === 'no_text') return 'Needs input';
  if (state === 'failed') return 'Manual review';
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
    paddingBottom: 46,
    gap: 26
  },
  nav: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hero: {
    paddingTop: 12,
    paddingBottom: 2
  },
  eyebrow: {
    ...neverType.eyebrow,
    marginBottom: 10
  },
  title: {
    ...neverType.display,
    maxWidth: 520,
    fontSize: 35,
    lineHeight: 40
  },
  subtitle: {
    ...neverType.body,
    marginTop: 9,
    maxWidth: 540,
    fontSize: 13,
    lineHeight: 19
  },
  capturePanel: {
    padding: 16
  },
  documentStage: {
    height: 248,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden'
  },
  paperShadow: {
    width: 138,
    height: 174,
    borderRadius: 10,
    padding: 18,
    shadowOpacity: 0.13,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4
  },
  paperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  paperLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 1.3
  },
  paperLine: {
    width: '82%',
    height: 3,
    borderRadius: 2,
    marginTop: 16,
    opacity: 0.24
  },
  paperLineStrong: {
    width: '66%',
    marginTop: 24,
    opacity: 0.58
  },
  paperLineShort: {
    width: '48%'
  },
  scanFrame: {
    position: 'absolute',
    width: 166,
    height: 204,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    opacity: 0.48
  },
  scanGlow: {
    position: 'absolute',
    left: 72,
    right: 72,
    top: 33,
    height: StyleSheet.hairlineWidth,
    opacity: 0.9
  },
  captureCopy: {
    paddingTop: 20,
    paddingHorizontal: 2
  },
  emptyTitle: {
    ...neverType.section,
    fontSize: 17,
    lineHeight: 21
  },
  emptyBody: {
    ...neverType.body,
    marginTop: 6,
    fontSize: 12.25,
    lineHeight: 18
  },
  actions: {
    marginTop: 20,
    gap: 9
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  secondaryText: {
    ...neverType.bodyStrong,
    fontSize: 12.75
  },
  section: {
    gap: 10
  },
  previewShell: {
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden'
  },
  preview: {
    width: '100%',
    height: 360,
    borderRadius: 24
  },
  previewBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  previewBadgeText: {
    ...neverType.caption,
    fontSize: 9.75,
    fontWeight: '600'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7
  },
  statusCopy: {
    flex: 1
  },
  noticeTitle: {
    ...neverType.bodyStrong,
    fontSize: 14
  },
  noticeText: {
    ...neverType.caption,
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16
  },
  storageLine: {
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8
  },
  storageText: {
    ...neverType.caption,
    flex: 1,
    fontSize: 10,
    lineHeight: 14.5
  },
  rescan: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rescanText: {
    ...neverType.caption,
    fontWeight: '600'
  }
});
