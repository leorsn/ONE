import { neverType } from '@/src/theme/tokens';
import { useEffect, useState } from 'react';
import { ScrollView, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { supabase } from '@/src/supabase/client';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Group, V5Wordmark, useNeverV5Palette } from '@/src/ui/appleV5';

export default function AuthCallbackScreen() {
  const p = useNeverV5Palette();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function completeAuth() {
      if (params.error || params.error_description) {
        if (!cancelled) setErrorMessage(params.error_description || params.error || 'Authentication failed.');
        return;
      }
      if (!params.code) {
        if (!cancelled) setErrorMessage('The confirmation link is missing its authorization code.');
        return;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (cancelled) return;
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      router.replace('/(tabs)/settings');
    }
    void completeAuth().catch(() => { if (!cancelled) setErrorMessage('Could not connect. Open your email link again when your connection is available.'); });
    return () => { cancelled = true; };
  }, [params.code, params.error, params.error_description]);

  return (
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.shell}>
        <V5Wordmark />

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: errorMessage ? p.danger : p.chrome }]}>{errorMessage ? 'ACCOUNT' : 'SECURE SIGN-IN'}</Text>
          <Text style={[styles.title, p.heading, { color: p.label }]}>{errorMessage ? 'We could not confirm this account.' : 'Connecting your memory.'}</Text>
          <Text style={[styles.body, { color: p.secondary }]}>{errorMessage || 'NEVER is securely completing sign-in on this device.'}</Text>
        </View>

        {!errorMessage ? (
          <V5Group><View style={styles.statusRow}><ActivityIndicator size="small" color={p.chrome} /><View style={{ flex: 1 }}><Text style={[styles.statusTitle, { color: p.label }]}>Confirming account</Text><Text style={[styles.statusBody, { color: p.secondary }]}>This should finish automatically.</Text></View></View></V5Group>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/settings')} style={({ pressed }) => [styles.button, { backgroundColor: p.graphite, opacity: pressed ? 0.72 : 1 }]}>
            <Text style={[styles.buttonText, { color: p.onAccent }]}>Return to NEVER</Text>
          </Pressable>
        )}

        <View style={styles.trustRow}><OneIcon name={icons.lock} size={12.5} color={p.chrome} /><Text style={[styles.trustText, { color: p.tertiary }]}>The link is exchanged for your authenticated NEVER session on this device.</Text></View>
      </ScrollView>
    </NeverScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  shell: { flexGrow: 1, paddingVertical: 24, width: '100%', maxWidth: 500, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  hero: { marginTop: 38, marginBottom: 22 },
  eyebrow: { ...neverType.eyebrow },
  title: { marginTop: 9, maxWidth: 420, ...neverType.hero },
  body: { marginTop: 8, maxWidth: 405, ...neverType.body },
  statusRow: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusTitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  statusBody: { marginTop: 2, fontSize: 11.5, lineHeight: 15 },
  button: { minHeight: 52, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  trustRow: { marginTop: 17, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  trustText: { flex: 1, ...neverType.caption }
});
