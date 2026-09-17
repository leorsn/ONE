import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/supabase/client';
import { IconTile, PrimaryButton } from '@/src/ui/primitives';
import { icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const { updatePassword } = useAuth();
  const params = useLocalSearchParams<{
    code?: string;
    error?: string;
    error_description?: string;
  }>();
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function prepareRecoverySession() {
      if (params.error || params.error_description) {
        if (!cancelled) setErrorMessage(params.error_description || params.error || 'Password recovery failed.');
        return;
      }

      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (cancelled) return;

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        setReady(true);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error || !data.session) {
        setErrorMessage(error?.message || 'This password reset link is incomplete or has expired.');
        return;
      }

      setReady(true);
    }

    void prepareRecoverySession();
    return () => {
      cancelled = true;
    };
  }, [params.code, params.error, params.error_description]);

  async function savePassword() {
    if (saving) return;

    if (password.length < 8) {
      Alert.alert('New password', 'Use at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('New password', 'The passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const error = await updatePassword(password);
      if (error) {
        Alert.alert('Could not update password', error);
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Password updated', 'Your NEVER password has been changed.', [
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)/settings')
        }
      ]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={[styles.brand, { color: theme.chrome }]}>NEVER</Text>
        <IconTile icon={errorMessage ? icons.close : icons.lock} size={54} tone={errorMessage ? 'danger' : 'neutral'} />
        <Text style={[styles.title, { color: theme.text }]}>{errorMessage ? 'Could not reset password' : ready ? 'Choose a new password' : 'Opening secure reset…'}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          {errorMessage || (ready
            ? 'Set a new password for your NEVER account.'
            : 'NEVER is securely validating this password reset link.')}
        </Text>

        {!ready && !errorMessage ? <ActivityIndicator style={styles.spinner} color={theme.chrome} /> : null}

        {ready && !errorMessage ? (
          <View style={styles.form}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="New password"
              placeholderTextColor={theme.textTertiary}
              secureTextEntry
              textContentType="newPassword"
              autoCapitalize="none"
              accessibilityLabel="New password"
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={theme.textTertiary}
              secureTextEntry
              textContentType="newPassword"
              autoCapitalize="none"
              accessibilityLabel="Confirm new password"
              onSubmitEditing={() => void savePassword()}
              style={[styles.input, { color: theme.text, backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            />
            <PrimaryButton label={saving ? 'Updating…' : 'Update password'} icon={icons.check} onPress={savePassword} />
          </View>
        ) : null}

        {errorMessage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to NEVER settings"
            onPress={() => router.replace('/(tabs)/settings')}
            style={[styles.returnButton, { backgroundColor: theme.accent }]}
          >
            <Text style={[styles.returnButtonText, { color: theme.onAccent }]}>Return to NEVER</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  brand: { marginBottom: 20, fontSize: 10.5, fontWeight: '700', letterSpacing: 2.4 },
  title: { marginTop: 18, maxWidth: 340, textAlign: 'center', fontSize: 25, lineHeight: 30, fontWeight: '700', letterSpacing: -0.55 },
  body: { marginTop: 9, maxWidth: 340, textAlign: 'center', fontSize: 13, lineHeight: 20 },
  spinner: { marginTop: 22 },
  form: { width: '100%', maxWidth: 420, marginTop: 24, gap: 11 },
  input: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, paddingHorizontal: 14, fontSize: 15 },
  returnButton: { marginTop: 24, minHeight: 50, minWidth: 180, paddingHorizontal: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  returnButtonText: { fontSize: 14, fontWeight: '700' }
});