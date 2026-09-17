import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/src/supabase/client';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

export default function AuthCallbackScreen() {
  const theme = useTheme();
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

    void completeAuth();
    return () => { cancelled = true; };
  }, [params.code, params.error, params.error_description]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.shell}>
        <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: errorMessage ? theme.danger : theme.chrome }]}>{errorMessage ? 'ACCOUNT' : 'SECURE SIGN-IN'}</Text>
          <Text style={[styles.title, { color: theme.text }]}>{errorMessage ? 'We could not confirm this account.' : 'Connecting your memory.'}</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>{errorMessage || 'NEVER is securely completing sign-in on this device.'}</Text>
        </View>

        {!errorMessage ? (
          <View style={[styles.statusCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <ActivityIndicator size="small" color={theme.chrome} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: theme.text }]}>Confirming account</Text>
              <Text style={[styles.statusBody, { color: theme.textSecondary }]}>This should finish automatically.</Text>
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to NEVER settings"
            onPress={() => router.replace('/(tabs)/settings')}
            style={({ pressed }) => [styles.button, { backgroundColor: theme.accent, opacity: pressed ? 0.74 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: theme.onAccent }]}>Return to NEVER</Text>
          </Pressable>
        )}

        <View style={styles.trustRow}>
          <OneIcon name={icons.lock} size={13} color={theme.chrome} />
          <Text style={[styles.trustText, { color: theme.textTertiary }]}>The link is exchanged for your authenticated NEVER session on this device.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  wordmark: { fontSize: 17, lineHeight: 20, fontWeight: '600', letterSpacing: 4.7 },
  hero: { marginTop: 46, marginBottom: 27 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.05 },
  title: { marginTop: 12, maxWidth: 430, fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  body: { marginTop: 10, maxWidth: 410, fontSize: 13, lineHeight: 19.5 },
  statusCard: { minHeight: 74, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12, shadowOpacity: 0.03, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  statusTitle: { fontSize: 13.5, fontWeight: '600' },
  statusBody: { marginTop: 3, fontSize: 10.75 },
  button: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 13, fontWeight: '600' },
  trustRow: { marginTop: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  trustText: { flex: 1, fontSize: 10.5, lineHeight: 15 }
});