import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/context/AuthContext';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Group, V5Wordmark, useNeverV5Palette } from '@/src/ui/appleV5';

export default function SignInScreen() {
  const p = useNeverV5Palette();
  const { configured, signIn, signUp, requestPasswordReset } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function submit() {
    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      Alert.alert('NEVER Account', 'Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('NEVER Account', 'Use a password with at least 8 characters.');
      return;
    }
    setSubmitting(true);
    await Haptics.selectionAsync();
    try {
      const error = mode === 'signin' ? await signIn(cleanEmail, password) : await signUp(cleanEmail, password);
      if (error) {
        Alert.alert('NEVER Account', error);
        return;
      }
      if (mode === 'signup') Alert.alert('Check your email', 'Confirm your email address to finish creating your NEVER account.');
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword() {
    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Reset password', 'Enter your NEVER account email first.');
      return;
    }
    setResetting(true);
    try {
      const error = await requestPasswordReset(cleanEmail);
      if (error) Alert.alert('Reset password', error);
      else Alert.alert('Check your email', 'NEVER sent a secure password reset link if an account exists for that address.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.shell}>
            <V5Wordmark />

            <View style={styles.hero}>
              <Text style={[styles.eyebrow, { color: p.chrome }]}>{mode === 'signin' ? 'WELCOME BACK' : 'CREATE YOUR MEMORY'}</Text>
              <Text style={[styles.title, { color: p.label }]}>{mode === 'signin' ? 'Your memory, with you.' : 'One private place for what matters.'}</Text>
              <Text style={[styles.body, { color: p.secondary }]}>{mode === 'signin' ? 'Sign in to keep your saved information available across your NEVER devices.' : 'Create a NEVER account to sync memories, documents and context across your devices.'}</Text>
            </View>

            <V5Group style={styles.formCard}>
              <Text style={[styles.formTitle, { color: p.label }]}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>
              <Text style={[styles.formCaption, { color: p.secondary }]}>{mode === 'signin' ? 'Use your NEVER account' : 'Email and password'}</Text>

              {!configured ? (
                <View style={[styles.configurationNotice, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.shield} size={14} color={p.danger} /><Text style={[styles.configurationError, { color: p.danger }]}>Cloud authentication is not configured in this build.</Text></View>
              ) : null}

              <View style={styles.form}>
                <View>
                  <Text style={[styles.inputLabel, { color: p.secondary }]}>Email</Text>
                  <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={p.tertiary} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" accessibilityLabel="Email address" style={[styles.input, { color: p.label, backgroundColor: p.fillSoft }]} />
                </View>
                <View>
                  <Text style={[styles.inputLabel, { color: p.secondary }]}>Password</Text>
                  <TextInput value={password} onChangeText={setPassword} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Password'} placeholderTextColor={p.tertiary} secureTextEntry textContentType={mode === 'signup' ? 'newPassword' : 'password'} accessibilityLabel="Password" onSubmitEditing={() => void submit()} style={[styles.input, { color: p.label, backgroundColor: p.fillSoft }]} />
                </View>

                <Pressable disabled={!configured || submitting} onPress={submit} style={({ pressed }) => [styles.primaryButton, { backgroundColor: p.graphite, opacity: !configured || submitting ? 0.38 : pressed ? 0.72 : 1 }]}>
                  {submitting ? <ActivityIndicator size="small" color={p.dark ? '#111113' : '#FFFFFF'} /> : null}
                  <Text style={[styles.primaryText, { color: p.dark ? '#111113' : '#FFFFFF' }]}>{mode === 'signin' ? 'Sign In to NEVER' : 'Create NEVER Account'}</Text>
                </Pressable>
              </View>

              <View style={[styles.formFooter, { borderTopColor: p.separator }]}>
                <Pressable onPress={() => setMode((current) => current === 'signin' ? 'signup' : 'signin')} style={({ pressed }) => [styles.textAction, { opacity: pressed ? 0.55 : 1 }]}>
                  <Text style={[styles.switchText, { color: p.label }]}>{mode === 'signin' ? 'Create an account' : 'I already have an account'}</Text>
                  <OneIcon name={icons.chevron} size={11.5} color={p.tertiary} />
                </Pressable>
                {mode === 'signin' ? (
                  <Pressable disabled={resetting} onPress={() => void resetPassword()} style={({ pressed }) => [styles.textAction, { opacity: pressed || resetting ? 0.55 : 1 }]}>
                    <Text style={[styles.resetText, { color: p.secondary }]}>{resetting ? 'Sending reset link…' : 'Forgot password?'}</Text>
                  </Pressable>
                ) : null}
              </View>
            </V5Group>

            <View style={styles.trustRow}><OneIcon name={icons.shield} size={12.5} color={p.chrome} /><Text style={[styles.privacy, { color: p.tertiary }]}>Private by default. Your account controls which synced memory belongs to you.</Text></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function isValidEmail(value: string) { return /^\S+@\S+\.\S+$/.test(value); }

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 22 },
  shell: { width: '100%', maxWidth: 500, alignSelf: 'center', paddingHorizontal: 20 },
  hero: { marginTop: 38, marginBottom: 24 },
  eyebrow: { fontSize: 8.5, lineHeight: 11, fontWeight: '700', letterSpacing: 1.8 },
  title: { marginTop: 9, maxWidth: 400, fontSize: 30, lineHeight: 35, fontWeight: '700', letterSpacing: -0.95 },
  body: { marginTop: 8, maxWidth: 390, fontSize: 13, lineHeight: 19 },
  formCard: { padding: 15 },
  formTitle: { fontSize: 17, lineHeight: 21, fontWeight: '600', letterSpacing: -0.2 },
  formCaption: { marginTop: 2, fontSize: 11.5, lineHeight: 15 },
  configurationNotice: { minHeight: 44, borderRadius: 12, paddingHorizontal: 11, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  configurationError: { flex: 1, fontSize: 11, lineHeight: 15.5 },
  form: { marginTop: 15, gap: 12 },
  inputLabel: { marginLeft: 2, marginBottom: 5, fontSize: 11.5, lineHeight: 14, fontWeight: '500' },
  input: { minHeight: 48, borderRadius: 13, paddingHorizontal: 13, fontSize: 14.5, lineHeight: 18 },
  primaryButton: { minHeight: 46, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  formFooter: { marginTop: 15, paddingTop: 7, borderTopWidth: StyleSheet.hairlineWidth },
  textAction: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchText: { fontSize: 12.5, lineHeight: 16, fontWeight: '600' },
  resetText: { fontSize: 12, lineHeight: 15, fontWeight: '500' },
  trustRow: { marginTop: 17, paddingHorizontal: 3, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  privacy: { flex: 1, fontSize: 10.5, lineHeight: 14.5 }
});