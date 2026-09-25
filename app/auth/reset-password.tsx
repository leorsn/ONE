import { neverType } from '@/src/theme/tokens';
import { NeverInput } from '@/src/ui/NeverInput';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/supabase/client';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Group, V5Wordmark, useNeverV5Palette } from '@/src/ui/appleV5';

export default function ResetPasswordScreen() {
  const p = useNeverV5Palette();
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
    void prepareRecoverySession().catch(() => { if (!cancelled) setErrorMessage('Could not connect. Open your email link again when your connection is available.'); });
    return () => { cancelled = true; };
  }, [params.code, params.error, params.error_description]);

  async function savePassword() {
    if (saving || !ready || errorMessage) return;
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      Alert.alert('Password updated', 'Your NEVER password has been changed.', [{ text: 'Continue', onPress: () => router.replace('/(tabs)/settings') }]);
    } catch {
      Alert.alert('Could not update password', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  const eyebrow = errorMessage ? 'RECOVERY' : ready ? 'NEW PASSWORD' : 'SECURE LINK';
  const title = errorMessage ? 'This reset link could not be used.' : ready ? 'Choose a new password.' : 'Opening your reset link.';
  const body = errorMessage || (ready ? 'Set a new password for your NEVER account. It must contain at least eight characters.' : 'NEVER is validating the recovery session on this device.');

  return (
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.shell}>
            <V5Wordmark />

            <View style={styles.hero}>
              <Text style={[styles.eyebrow, { color: errorMessage ? p.danger : p.chrome }]}>{eyebrow}</Text>
              <Text style={[styles.title, p.heading, { color: p.label }]}>{title}</Text>
              <Text style={[styles.body, { color: p.secondary }]}>{body}</Text>
            </View>

            {!ready && !errorMessage ? (
              <V5Group><View style={styles.statusRow}><ActivityIndicator size="small" color={p.chrome} /><Text style={[styles.statusText, { color: p.secondary }]}>Validating securely…</Text></View></V5Group>
            ) : null}

            {ready && !errorMessage ? (
              <V5Group style={styles.formCard}>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: p.secondary }]}>New Password</Text>
                  <NeverInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={p.tertiary} secureTextEntry textContentType="newPassword" autoCapitalize="none" accessibilityLabel="New password" style={[styles.input, { color: p.label, backgroundColor: p.fillSoft }]} />
                </View>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: p.secondary }]}>Confirm Password</Text>
                  <NeverInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat new password" placeholderTextColor={p.tertiary} secureTextEntry textContentType="newPassword" autoCapitalize="none" accessibilityLabel="Confirm new password" onSubmitEditing={() => void savePassword()} style={[styles.input, { color: p.label, backgroundColor: p.fillSoft }]} />
                </View>
                <Pressable accessibilityRole="button" disabled={saving} onPress={savePassword} style={({ pressed }) => [styles.primaryButton, { borderRadius: p.radius.button, backgroundColor: p.graphite, borderColor: p.graphite, opacity: saving ? 0.45 : pressed ? 0.72 : 1 }]}>
                  {saving ? <ActivityIndicator size="small" color={p.onAccent} /> : <OneIcon name={icons.check} size={14} color={p.onAccent} />}
                  <Text style={[styles.primaryText, { color: p.onAccent }]}>{saving ? 'Updating…' : 'Update Password'}</Text>
                </Pressable>
              </V5Group>
            ) : null}

            {errorMessage ? (
              <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/settings')} style={({ pressed }) => [styles.primaryButton, { borderRadius: p.radius.button, backgroundColor: p.graphite, borderColor: p.graphite, opacity: pressed ? 0.72 : 1 }]}>
                <Text style={[styles.primaryText, { color: p.onAccent }]}>Return to NEVER</Text>
              </Pressable>
            ) : null}

            <View style={styles.trustRow}><OneIcon name={icons.lock} size={12.5} color={p.chrome} /><Text style={[styles.trustText, { color: p.tertiary }]}>Password recovery only changes the credentials for your NEVER account.</Text></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </NeverScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  shell: { width: '100%', maxWidth: 500, alignSelf: 'center', paddingHorizontal: 20 },
  hero: { marginTop: 38, marginBottom: 22 },
  eyebrow: { ...neverType.eyebrow },
  title: { marginTop: 9, maxWidth: 420, ...neverType.hero },
  body: { marginTop: 8, maxWidth: 405, ...neverType.body },
  statusRow: { minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusText: { fontSize: 12, lineHeight: 15 },
  formCard: { padding: 15, gap: 13 },
  field: { gap: 5 },
  label: { marginLeft: 2, fontSize: 11.5, lineHeight: 14, fontWeight: '500' },
  input: { minHeight: 54, paddingVertical: 12, paddingHorizontal: 13, fontSize: 16, lineHeight: 22 },
  primaryButton: { minHeight: 52, paddingVertical: 12, paddingHorizontal: 16, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { flexShrink: 1, textAlign: 'center', fontSize: 16, lineHeight: 22, fontWeight: '600' },
  trustRow: { marginTop: 17, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  trustText: { flex: 1, ...neverType.caption }
});
