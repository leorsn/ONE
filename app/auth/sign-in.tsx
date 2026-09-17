import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/context/AuthContext';
import { PrimaryButton } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

export default function SignInScreen() {
  const theme = useTheme();
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
      const error = mode === 'signin'
        ? await signIn(cleanEmail, password)
        : await signUp(cleanEmail, password);
      if (error) {
        Alert.alert('NEVER Account', error);
        return;
      }
      if (mode === 'signup') {
        Alert.alert('Check your email', 'Confirm your email address to finish creating your NEVER account.');
      }
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
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.shell}>
            <View style={styles.brandRow}>
              <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
              <View style={[styles.brandRule, { backgroundColor: theme.fillStrong }]} />
              <Text style={[styles.brandMeta, { color: theme.textTertiary }]}>PRIVATE MEMORY</Text>
            </View>

            <View style={styles.hero}>
              <Text style={[styles.eyebrow, { color: theme.chrome }]}>{mode === 'signin' ? 'WELCOME BACK' : 'CREATE YOUR MEMORY'}</Text>
              <Text style={[styles.title, { color: theme.text }]}>
                {mode === 'signin' ? 'Your memory, with you.' : 'One private place for what matters.'}
              </Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>
                {mode === 'signin'
                  ? 'Sign in to keep your saved information available across your NEVER devices.'
                  : 'Create a NEVER account to sync memories, documents and context across your devices.'}
              </Text>
            </View>

            <View style={[styles.formCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
              <View style={styles.formHeading}>
                <Text style={[styles.formTitle, { color: theme.text }]}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
                <Text style={[styles.formCaption, { color: theme.textTertiary }]}>{mode === 'signin' ? 'Use your NEVER account' : 'Email and password'}</Text>
              </View>

              {!configured ? (
                <View style={[styles.configurationNotice, { backgroundColor: theme.fill, borderColor: theme.border }]}>
                  <OneIcon name={icons.shield} size={15} color={theme.danger} />
                  <Text style={[styles.configurationError, { color: theme.danger }]}>Cloud authentication is not configured in this build.</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textTertiary }]}>EMAIL</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    accessibilityLabel="Email address"
                    style={[styles.input, { color: theme.text, backgroundColor: theme.fill, borderColor: theme.border }]}
                  />
                </View>

                <View>
                  <Text style={[styles.inputLabel, { color: theme.textTertiary }]}>PASSWORD</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={mode === 'signup' ? 'At least 8 characters' : 'Password'}
                    placeholderTextColor={theme.textTertiary}
                    secureTextEntry
                    textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                    accessibilityLabel="Password"
                    onSubmitEditing={() => void submit()}
                    style={[styles.input, { color: theme.text, backgroundColor: theme.fill, borderColor: theme.border }]}
                  />
                </View>

                <PrimaryButton
                  label={mode === 'signin' ? 'Sign in to NEVER' : 'Create NEVER account'}
                  disabled={!configured || submitting}
                  onPress={submit}
                />

                {submitting ? (
                  <View style={styles.progressRow}>
                    <ActivityIndicator size="small" />
                    <Text style={[styles.progressText, { color: theme.textSecondary }]}>{mode === 'signin' ? 'Signing in…' : 'Creating account…'}</Text>
                  </View>
                ) : null}
              </View>

              <View style={[styles.formFooter, { borderTopColor: theme.border }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={mode === 'signin' ? 'Create NEVER account instead' : 'Sign in to existing NEVER account instead'}
                  onPress={() => setMode((current) => current === 'signin' ? 'signup' : 'signin')}
                  style={({ pressed }) => [styles.textAction, { opacity: pressed ? 0.55 : 1 }]}
                >
                  <Text style={[styles.switchText, { color: theme.text }]}>{mode === 'signin' ? 'Create an account' : 'I already have an account'}</Text>
                  <OneIcon name={icons.chevron} size={12} color={theme.textTertiary} />
                </Pressable>

                {mode === 'signin' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Reset forgotten NEVER password"
                    disabled={resetting}
                    onPress={() => void resetPassword()}
                    style={({ pressed }) => [styles.textAction, { opacity: pressed || resetting ? 0.55 : 1 }]}
                  >
                    <Text style={[styles.resetText, { color: theme.textSecondary }]}>{resetting ? 'Sending reset link…' : 'Forgot password?'}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.trustRow}>
              <OneIcon name={icons.shield} size={13} color={theme.chrome} />
              <Text style={[styles.privacy, { color: theme.textTertiary }]}>Private by default. Your account controls which synced memory belongs to you.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  shell: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 20 },
  brandRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontSize: 17, lineHeight: 20, fontWeight: '600', letterSpacing: 4.7 },
  brandRule: { width: 28, height: StyleSheet.hairlineWidth },
  brandMeta: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.45 },
  hero: { marginTop: 44, marginBottom: 30 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.1 },
  title: { marginTop: 12, maxWidth: 410, fontSize: 32, lineHeight: 37, fontWeight: '600', letterSpacing: -1.1 },
  body: { marginTop: 10, maxWidth: 400, fontSize: 13, lineHeight: 19.5 },
  formCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 17,
    shadowOpacity: 0.04,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1
  },
  formHeading: { marginBottom: 18 },
  formTitle: { fontSize: 17, lineHeight: 21, fontWeight: '600', letterSpacing: -0.25 },
  formCaption: { marginTop: 3, fontSize: 10.75, lineHeight: 14.5 },
  configurationNotice: { minHeight: 46, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  configurationError: { flex: 1, fontSize: 11.25, lineHeight: 16 },
  form: { gap: 14 },
  inputLabel: { marginLeft: 2, marginBottom: 7, fontSize: 8.5, fontWeight: '700', letterSpacing: 1.25 },
  input: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14, fontSize: 14.5 },
  progressRow: { minHeight: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  progressText: { fontSize: 11.25 },
  formFooter: { marginTop: 18, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth },
  textAction: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchText: { fontSize: 12.5, fontWeight: '600' },
  resetText: { fontSize: 11.75, fontWeight: '500' },
  trustRow: { marginTop: 20, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  privacy: { flex: 1, fontSize: 10.5, lineHeight: 15 }
});