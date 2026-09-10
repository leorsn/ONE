import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { CaptureReviewEditor } from '@/src/capture/CaptureReviewEditor';
import { interpretCapture, type CaptureDraft } from '@/src/capture/core';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { extractTextFromImage } from '@/src/ocr/extractText';
import { persistLocalAttachment } from '@/src/storage/attachments';
import { IconTile, PrimaryButton, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

type ScanState = 'empty' | 'reading' | 'ready' | 'failed';

export default function ScanScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { add } = useItems();
  const [state, setState] = useState<ScanState>('empty');
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [draft, setDraft] = useState<CaptureDraft | null>(null);
  const [saving, setSaving] = useState(false);

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Enable camera access to scan documents into ONE.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.9
    });

    if (!result.canceled && result.assets[0]) await processAsset(result.assets[0]);
  }

  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 1
    });

    if (!result.canceled && result.assets[0]) await processAsset(result.assets[0]);
  }

  async function processAsset(nextAsset: ImagePicker.ImagePickerAsset) {
    setAsset(nextAsset);
    setState('reading');
    setDraft(interpretCapture({
      rawText: nextAsset.fileName || 'Scanned document',
      sourceType: 'scan',
      isImage: true
    }));

    try {
      const result = await extractTextFromImage(nextAsset.uri);
      const interpreted = interpretCapture({
        rawText: nextAsset.fileName || 'Scanned document',
        extractedText: result.text,
        sourceType: 'scan',
        isImage: true
      });
      setDraft(interpreted);
      setState('ready');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('ONE scan OCR failed', error);
      setState('failed');
    }
  }

  async function saveScan() {
    if (!asset || !draft || saving) return;
    setSaving(true);

    try {
      const localAttachmentUri = await persistLocalAttachment({
        uri: asset.uri,
        originalName: asset.fileName || `scan-${Date.now()}.jpg`
      });

      const item = buildItemFromCapture({
        draft,
        sourceType: 'scan',
        rawInput: draft.extractedText || draft.title,
        localAttachmentUri,
        attachmentMimeType: asset.mimeType || 'image/jpeg',
        attachmentName: asset.fileName || `scan-${Date.now()}.jpg`
      });

      await add(item);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/saved');
    } catch (error) {
      Alert.alert(
        'Could not save scan',
        error instanceof Error ? error.message : 'The image was not discarded. Try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
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

            <View style={[styles.notice, { backgroundColor: state === 'failed' ? theme.fill : theme.accentSoft }]}>
              <IconTile icon={icons.scan} tone={state === 'ready' ? 'success' : 'neutral'} size={38} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.noticeTitle, { color: theme.text }]}>
                  {state === 'reading' ? 'Reading document…' : state === 'ready' ? 'Document understood' : 'OCR unavailable'}
                </Text>
                <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                  {state === 'reading'
                    ? 'Private native OCR'
                    : state === 'ready'
                      ? 'Only explicit totals are treated as receipt totals. Review before saving.'
                      : 'You can still classify and save the original image.'}
                </Text>
              </View>
              {state === 'reading' ? <ActivityIndicator size="small" /> : null}
            </View>

            {draft ? <CaptureReviewEditor draft={draft} onChange={setDraft} /> : null}

            <View style={[styles.notice, { backgroundColor: theme.accentSoft }]}>
              <OneIcon name={icons.cloud} size={17} color={theme.accent} />
              <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
                {session
                  ? 'The scan is secured locally first. Cloud upload retries if the network is unavailable.'
                  : 'The scan remains on this device until you sign in.'}
              </Text>
            </View>

            <PrimaryButton
              label={saving ? 'Saving…' : 'Save to ONE'}
              icon={icons.check}
              onPress={saveScan}
              disabled={saving || state === 'reading' || !draft?.title.trim()}
            />

            <Pressable accessibilityRole="button" accessibilityLabel="Scan again" onPress={takePhoto} style={styles.rescan}>
              <Text style={[styles.rescanText, { color: theme.accent }]}>Scan again</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 18 },
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
