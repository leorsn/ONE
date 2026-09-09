import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { extractTextFromImage } from '@/src/ocr/extractText';
import { analyzeOcrText, type OcrIntelligence } from '@/src/ocr/intelligence';
import { uploadSharedAttachment } from '@/src/supabase/attachments';
import { persistLocalAttachment } from '@/src/storage/attachments';
import { IconTile, PrimaryButton, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import type { OneItem } from '@/src/types/item';

type ScanState = 'empty' | 'reading' | 'ready' | 'failed';

export default function ScanScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { add } = useItems();
  const [state, setState] = useState<ScanState>('empty');
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [text, setText] = useState('');
  const [intelligence, setIntelligence] = useState<OcrIntelligence | null>(null);
  const [merchant, setMerchant] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState('EUR');
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
    setText('');
    setIntelligence(null);
    setMerchant('');
    setDocumentDate('');
    setAmountText('');
    setCurrency('EUR');

    try {
      const result = await extractTextFromImage(nextAsset.uri);
      const analyzed = analyzeOcrText(result.text);
      setText(result.text);
      setIntelligence(analyzed);
      setMerchant(analyzed.merchant || '');
      setDocumentDate(analyzed.date || '');
      setAmountText(analyzed.amount !== undefined ? String(analyzed.amount) : '');
      setCurrency(analyzed.currency || 'EUR');
      setState('ready');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('ONE scan OCR failed', error);
      setState('failed');
    }
  }

  async function saveScan() {
    if (!asset) return;
    setSaving(true);

    try {
      let storedPath: string | undefined;
      if (session?.user.id) {
        storedPath = await uploadSharedAttachment({
          uri: asset.uri,
          mimeType: asset.mimeType,
          originalName: asset.fileName || `scan-${Date.now()}.jpg`,
          userId: session.user.id
        });
      } else {
        storedPath = await persistLocalAttachment({
          uri: asset.uri,
          originalName: asset.fileName || `scan-${Date.now()}.jpg`
        });
      }

      const now = new Date().toISOString();
      const documentKind = intelligence?.documentKind || 'other';
      const correctedMerchant = merchant.trim() || undefined;
      const correctedDate = documentDate.trim() || intelligence?.date;
      const correctedAmount = parseAmountInput(amountText);
      const correctedCurrency = correctedAmount !== undefined
        ? (currency.trim().toUpperCase().slice(0, 3) || 'EUR')
        : undefined;
      const title = correctedMerchant
        ? documentKind === 'invoice'
          ? correctedMerchant + ' invoice'
          : documentKind === 'receipt'
            ? correctedMerchant + ' receipt'
            : correctedMerchant + ' document'
        : intelligence?.suggestedTitle || 'Scanned document';

      const item: OneItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        rawInput: text || title,
        type: 'document',
        date: correctedDate,
        category: intelligence?.category || (documentKind === 'other' ? 'Documents' : 'Receipts'),
        completed: false,
        saved: true,
        sourceType: 'scan',
        imageUrl: storedPath || asset.uri,
        attachmentUrl: storedPath || asset.uri,
        extractedText: text || undefined,
        documentKind,
        merchant: correctedMerchant,
        amount: correctedAmount,
        currency: correctedCurrency,
        tags: Array.from(new Set(['document', documentKind, ...(intelligence?.tags || [])])),
        entities: correctedEntities(intelligence?.entities || [], correctedMerchant, correctedAmount, correctedCurrency),
        createdAt: now,
        updatedAt: now
      };

      await add(item);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/saved');
    } catch (error) {
      Alert.alert('Could not save scan', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Scan to ONE</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <IconTile icon={icons.scan} size={54} />
          <Text style={[styles.title, { color: theme.text }]}>Turn paper into memory.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Scan receipts, invoices, tickets and documents. OCR runs on-device.
          </Text>
        </View>

        {!asset ? (
          <Surface padded>
            <View style={styles.emptyScan}>
              <View style={[styles.scanFrame, { borderColor: theme.fillStrong }]}>
                <OneIcon name={icons.document} size={34} color={theme.textTertiary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Ready to scan</Text>
              <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
                Keep the document flat and make sure the important text is readable.
              </Text>
              <View style={styles.actions}>
                <PrimaryButton label="Open camera" icon={icons.scan} onPress={takePhoto} />
                <Pressable onPress={choosePhoto} style={[styles.secondaryButton, { backgroundColor: theme.fill }]}>
                  <OneIcon name={icons.screenshot} size={18} color={theme.text} />
                  <Text style={[styles.secondaryText, { color: theme.text }]}>Choose photo</Text>
                </Pressable>
              </View>
            </View>
          </Surface>
        ) : (
          <>
            <Image source={{ uri: asset.uri }} style={[styles.preview, { backgroundColor: theme.fill }]} resizeMode="cover" />

            <Surface padded>
              <View style={styles.intelligenceHeader}>
                <IconTile icon={icons.scan} tone={state === 'ready' ? 'success' : 'neutral'} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.intelligenceTitle, { color: theme.text }]}>
                    {state === 'reading' ? 'Reading document…' : state === 'ready' ? 'Document understood' : 'OCR unavailable'}
                  </Text>
                  <Text style={[styles.intelligenceMeta, { color: theme.textSecondary }]}>
                    {state === 'reading' ? 'Private on-device OCR' : state === 'ready' ? 'Review before saving' : 'The image can still be saved'}
                  </Text>
                </View>
                {state === 'reading' ? <ActivityIndicator size="small" /> : null}
              </View>

              {intelligence ? (
                <View style={[styles.details, { borderTopColor: theme.border }]}>
                  <Detail label="Type" value={formatKind(intelligence.documentKind)} />
                  <EditableDetail label="Merchant" value={merchant} onChange={setMerchant} placeholder="Unknown" />
                  <EditableDetail label="Date" value={documentDate} onChange={setDocumentDate} placeholder="YYYY-MM-DD" />
                  <EditableDetail label="Amount" value={amountText} onChange={setAmountText} placeholder="0.00" keyboardType="decimal-pad" />
                  <EditableDetail label="Currency" value={currency} onChange={(value) => setCurrency(value.toUpperCase())} placeholder="EUR" maxLength={3} />
                </View>
              ) : null}
            </Surface>

            {text ? (
              <Surface padded>
                <Text style={[styles.ocrLabel, { color: theme.textTertiary }]}>RECOGNIZED TEXT</Text>
                <Text style={[styles.ocrText, { color: theme.textSecondary }]} numberOfLines={10}>{text}</Text>
              </Surface>
            ) : null}

            <PrimaryButton
              label={saving ? 'Saving…' : 'Save to ONE'}
              icon={icons.check}
              onPress={saveScan}
              disabled={saving || state === 'reading'}
            />

            <Pressable onPress={takePhoto} style={styles.rescan}>
              <Text style={[styles.rescanText, { color: theme.accent }]}>Scan again</Text>
            </Pressable>
          </>
        )}

        {!session ? (
          <View style={[styles.notice, { backgroundColor: theme.accentSoft }]}>
            <OneIcon name={icons.cloud} size={17} color={theme.accent} />
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
              Sign in to privately sync scanned images across devices.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );

  function Detail({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
      <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
      </View>
    );
  }

  function EditableDetail({
    label,
    value,
    onChange,
    placeholder,
    keyboardType = 'default',
    maxLength
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    keyboardType?: 'default' | 'decimal-pad';
    maxLength?: number;
  }) {
    return (
      <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.textTertiary}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={label === 'Currency' ? 'characters' : 'sentences'}
          style={[styles.detailInput, { color: theme.text, backgroundColor: theme.fill }]}
        />
      </View>
    );
  }
}

function formatKind(kind?: string) {
  if (!kind) return undefined;
  return kind.split('_').map((value) => value.charAt(0).toUpperCase() + value.slice(1)).join(' ');
}

function parseAmountInput(value: string) {
  const clean = value.trim().replace(/[^0-9.,-]/g, '');
  if (!clean) return undefined;

  const comma = clean.lastIndexOf(',');
  const dot = clean.lastIndexOf('.');
  let normalized = clean;

  if (comma > dot) normalized = clean.replace(/\\./g, '').replace(',', '.');
  else if (dot > comma) normalized = clean.replace(/,/g, '');
  else normalized = clean.replace(',', '.');

  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : undefined;
}

function correctedEntities(entities: string[], merchant?: string, amount?: number, currency?: string) {
  const base = entities.filter((entity) => !entity.startsWith('merchant:') && !entity.startsWith('amount:'));
  if (merchant) base.push('merchant:' + merchant);
  if (amount !== undefined) base.push('amount:' + String(amount) + ' ' + (currency || 'EUR'));
  return Array.from(new Set(base));
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
  intelligenceHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  intelligenceTitle: { fontSize: 15, fontWeight: '800' },
  intelligenceMeta: { marginTop: 3, fontSize: 12 },
  details: { marginTop: 14, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailLabel: { width: 72, fontSize: 11.5, fontWeight: '700' },
  detailValue: { flex: 1, fontSize: 13.5, fontWeight: '600', textAlign: 'right' },
  detailInput: { flex: 1, minHeight: 38, borderRadius: 10, paddingHorizontal: 10, fontSize: 13.5, fontWeight: '600', textAlign: 'right' },
  ocrLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1 },
  ocrText: { marginTop: 9, fontSize: 12.5, lineHeight: 18 },
  rescan: { minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  rescanText: { fontSize: 13, fontWeight: '700' },
  notice: { minHeight: 56, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 }
});
