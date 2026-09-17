import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/supabase/client';
import { PrimaryButton } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const { updatePassword } = useAuth();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
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
    return () => { cancelled = true; };
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
        { text: 'Continue', onPress: () => router.replace('/(tabs)/settings') }
      ]);
    } finally {
      setSaving(false);
    }
  }

  const eyebrow = errorMessage ? 'RECOVERY' : ready ? 'NEW PASSWORD' : 'SECURE LINK';
  const title = errorMessage ? 'This reset link could not be used.' : ready ? 'Choose a new password.' : 'Opening your reset link.';
  const body = errorMessage || (ready
    ? 'Set a new password for your NEVER account. It must contain at least eight characters.'
    : 'NEVER is validating the recovery session on this device.');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.shell}>
            <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>

            <View style={styles.hero}>
              <Text style={[styles.eyebrow, { color: errorMessage ? theme.danger : theme.chrome }]}>{eyebrow}</Text>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{body}</Text>
            </View>

            {!ready && !errorMessage ? (
              <View style={[styles.statusCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                <ActivityIndicator size="small" color={theme.chrome} />
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>Validating securely…</Text>
              </View>
            ) : null}

            {ready && !errorMessage ? (
              <View style={[styles.formCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: theme.textTertiary }]}>NEW PASSWORD</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 8 characters"
                    placeholderTextColor={theme.textTertiary}
                    secureTextEntry
                    textContentType="newPassword"
                    autoCapitalize="none"
                    accessibilityLabel="New password"
                    style={[styles.input, { color: theme.text, backgroundColor: theme.fill, borderColor: theme.border }]}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: theme.textTertiary }]}>CONFIRM</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat new password"
                    placeholderTextColor={theme.textTertiary}
                    secureTextEntry
                    textContentType="newPassword"
                    autoCapitalize="none"
                    accessibilityLabel="Confirm new password"
                    onSubmitEditing={() => void savePassword()}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.fill, borderColor: theme.border }]}
                  />
                </View>
                <PrimaryButton label={saving ? 'Updating…' : 'Update password'} icon={icons.check} onPress={savePassword} disabled={saving} />
              </View>
            ) : null}

            {errorMessage ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Return to NEVER settings"
                onPress={() => router.replace('/(tabs)/settings')}
                style={({ pressed }) => [styles.returnButton, { backgroundColor: theme.accent, opacity: pressed ? 0.74 : 1 }]}
              >
                <Text style={[styles.returnButtonText, { color: theme.onAccent }]}>Return to NEVER</Text>
              </Pressable>
            ) : null}

            <View style={styles.trustRow}>
              <OneIcon name={icons.lock} size={13} color={theme.chrome} />
              <Text style={[styles.trustText, { color: theme.textTertiary }]}>Password recovery only changes the credentials for your NEVER account.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 26 },
  shell: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20 },
  wordmark: { fontSize: 17, lineHeight: 20, fontWeight: '600', letterSpacing: 4.7 },
  hero: { marginTop: 46, marginBottom: 27 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.05 },
  title: { marginTop: 12, maxWidth: 430, fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  body: { marginTop: 10, maxWidth: 410, fontSize: 13, lineHeight: 19.5 },
  statusCard: { minHeight: 58, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusText: { fontSize: 11.5 },
  formCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 17, gap: 15, shadowOpacity: 0.035, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 1 },
  field: { gap: 7 },
  label: { marginLeft: 2, fontSize: 8.5, fontWeight: '700', letterSpacing: 1.25 },
  input: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14, fontSize: 14.5 },
  returnButton: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  returnButtonText: { fontSize: 13, fontWeight: '600' },
  trustRow: { marginTop: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  trustText: { flex: 1, fontSize: 10.5, lineHeight: 15 }
});