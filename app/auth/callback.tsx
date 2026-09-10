import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/src/supabase/client';
import { IconTile } from '@/src/ui/primitives';
import { icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

export default function AuthCallbackScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
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
    return () => {
      cancelled = true;
    };
  }, [params.code, params.error, params.error_description]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <IconTile icon={errorMessage ? icons.close : icons.person} size={54} tone={errorMessage ? 'danger' : 'neutral'} />
        <Text style={[styles.title, { color: theme.text }]}>
          {errorMessage ? 'Could not confirm account' : 'Confirming your ONE account…'}
        </Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {errorMessage || 'ONE is securely completing the sign-in on this device.'}
        </Text>

        {!errorMessage ? <ActivityIndicator style={styles.spinner} /> : null}

        {errorMessage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to ONE settings"
            onPress={() => router.replace('/(tabs)/settings')}
            style={[styles.button, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.buttonText}>Return to ONE</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 18, maxWidth: 340, textAlign: 'center', fontSize: 25, lineHeight: 30, fontWeight: '800', letterSpacing: -0.5 },
  body: { marginTop: 9, maxWidth: 340, textAlign: 'center', fontSize: 13.5, lineHeight: 20 },
  spinner: { marginTop: 22 },
  button: { marginTop: 24, minHeight: 50, minWidth: 180, paddingHorizontal: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' }
});
