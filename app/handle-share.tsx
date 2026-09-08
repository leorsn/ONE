import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useIncomingShare } from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { createItemFromShare } from '@/src/sharing/ingest';
import { uploadSharedAttachment } from '@/src/supabase/attachments';
import { useTheme } from '@/src/theme/useTheme';

export default function HandleShareScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const { add } = useItems();
  const {
    sharedPayloads,
    resolvedSharedPayloads,
    isResolving,
    error,
    clearSharedPayloads
  } = useIncomingShare();

  const [context, setContext] = useState('');
  const [saving, setSaving] = useState(false);

  const primary = sharedPayloads[0];
  const resolved = resolvedSharedPayloads[0];

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
      const isAttachment =
        Boolean(contentUri) &&
        ['image', 'file', 'video', 'audio'].includes(primary.shareType || '');

      if (isAttachment && session?.user.id && contentUri) {
        storedAttachmentPath = await uploadSharedAttachment({
          uri: contentUri,
          mimeType: resolved?.contentMimeType,
          originalName: resolved?.originalName,
          userId: session.user.id
        });
      }

      const item = createItemFromShare({
        payload: primary,
        resolved,
        context,
        storedAttachmentPath
      });

      await add(item);
      clearSharedPayloads();
      router.replace('/(tabs)/saved');
    } catch (saveError) {
      Alert.alert(
        'Could not save to ONE',
        saveError instanceof Error ? saveError.message : 'Unknown error'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    clearSharedPayloads();
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable onPress={handleCancel}>
            <Text style={{ color: theme.textSecondary }}>Cancel</Text>
          </Pressable>
          <Text style={[styles.brand, { color: theme.text }]}>Save to ONE</Text>
          <View style={{ width: 48 }} />
        </View>

        {isResolving ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={{ color: theme.textSecondary }}>Reading shared content…</Text>
          </View>
        ) : null}

        {error ? (
          <Text style={{ color: theme.textSecondary }}>
            ONE could not fully resolve this share, but you can still save the raw content.
          </Text>
        ) : null}

        {primary ? (
          <>
            <View style={[styles.previewCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {resolved?.contentType === 'image' && resolved.contentUri ? (
                <Image source={{ uri: resolved.contentUri }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.icon, { backgroundColor: theme.accentSoft }]}>
                  <Text style={{ color: theme.accent, fontSize: 22 }}>↗</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewLabel, { color: theme.textSecondary }]}>
                  {labelFor(primary.shareType)}
                </Text>
                <Text style={[styles.previewText, { color: theme.text }]} numberOfLines={4}>
                  {preview}
                </Text>
              </View>
            </View>

            <View>
              <Text style={[styles.heading, { color: theme.text }]}>Add context</Text>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                Optional. Example: “Gift Dad”, “Barcelona”, or “Tax 2026”.
              </Text>
            </View>

            <TextInput
              value={context}
              onChangeText={setContext}
              placeholder="What should ONE remember this as?"
              placeholderTextColor={theme.textSecondary}
              style={[styles.contextInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
              multiline
            />

            {!session && ['image', 'file', 'video', 'audio'].includes(primary.shareType || '') ? (
              <Text style={[styles.note, { color: theme.textSecondary }]}>
                You can save this locally now. Sign in to a ONE Account to keep shared files privately in cloud storage across devices.
              </Text>
            ) : null}

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveButton, { backgroundColor: theme.accent, opacity: saving ? 0.65 : 1 }]}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save to ONE</Text>}
            </Pressable>
          </>
        ) : (
          <View style={styles.center}>
            <Text style={{ color: theme.textSecondary }}>No shared content found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function labelFor(type?: string) {
  if (type === 'url') return 'Link';
  if (type === 'image') return 'Image';
  if (type === 'file') return 'File';
  if (type === 'video') return 'Video';
  if (type === 'audio') return 'Audio';
  return 'Text';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 18, fontWeight: '800' },
  center: { minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 10 },
  previewCard: { borderWidth: 1, borderRadius: 20, padding: 14, flexDirection: 'row', gap: 14, alignItems: 'center' },
  image: { width: 86, height: 86, borderRadius: 14 },
  icon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  previewLabel: { fontSize: 12, marginBottom: 4 },
  previewText: { fontSize: 16, fontWeight: '600', lineHeight: 21 },
  heading: { fontSize: 22, fontWeight: '800' },
  hint: { fontSize: 13, marginTop: 5, lineHeight: 18 },
  contextInput: { minHeight: 110, borderWidth: 1, borderRadius: 18, padding: 15, fontSize: 16, textAlignVertical: 'top' },
  note: { fontSize: 13, lineHeight: 19 },
  saveButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '800' }
});
