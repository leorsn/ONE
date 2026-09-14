import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/context/AuthContext';
import { IconTile, PrimaryButton, Surface } from '@/src/ui/primitives';
import { icons } from '@/src/ui/icons';
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
      Alert.alert('ONE Account', 'Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('ONE Account', 'Use a password with at least 8 characters.');
      return;
    }

    setSubmitting(true);
    await Haptics.selectionAsync();
    try {
      const error = mode === 'signin'
        ? await signIn(cleanEmail, password)
        : await signUp(cleanEmail, password);
      if (error) {
        Alert.alert('ONE Account', error);
        return;
      }
      if (mode === 'signup') {
        Alert.alert('Check your email', 'Confirm your email address to finish creating your ONE account.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resetPassword() {
    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Reset password', 'Enter your ONE account email first.');
      return;
    }

    setResetting(true);
    try {
      const error = await requestPasswordReset(cleanEmail);
      if (error) Alert.alert('Reset password', error);
      else Alert.alert('Check your email', 'ONE sent a secure password reset link if an account exists for that address.');
    } finally {
      setResetting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.shell}>
        <View style={styles.hero}>
          <IconTile icon={icons.lock} size={58} />
          <Text style={[styles.brand, { color: theme.text }]}>ONE</Text>
          <Text style={[styles.title, { color: theme.text }]}>Your memory, on every device.</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>Create one private account so ONE can keep your saved information available across devices.</Text>
        </View>

        <Surface padded>
          {!configured ? (
            <Text style={[styles.configurationError, { color: theme.danger }]}>Cloud authentication is not configured in this build.</Text>
          ) : null}
          <View style={styles.form}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              accessibilityLabel="Email address"
              style={[styles.input, { color: theme.text, backgroundColor: theme.fill, borderColor: theme.border }]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={theme.textTertiary}
              secureTextEntry
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              accessibilityLabel="Password"
              onSubmitEditing={() => void submit()}
              style={[styles.input, { color: theme.text, backgroundColor: theme.fill, borderColor: theme.border }]}
            />
            <PrimaryButton
              label={mode === 'signin' ? 'Sign in' : 'Create account'}
              icon={icons.lock}
              disabled={!configured || submitting}
              onPress={submit}
            />
            {submitting ? <ActivityIndicator size="small" /> : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === 'signin' ? 'Create ONE account instead' : 'Sign in to existing ONE account instead'}
            onPress={() => setMode((current) => current === 'signin' ? 'signup' : 'signin')}
            style={({ pressed }) => [styles.switchAction, { opacity: pressed ? 0.55 : 1 }]}
          >
            <Text style={[styles.switchText, { color: theme.accent }]}>
              {mode === 'signin' ? 'Create an account' : 'I already have an account'}
            </Text>
          </Pressable>

          {mode === 'signin' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset forgotten ONE password"
              disabled={resetting}
              onPress={() => void resetPassword()}
              style={({ pressed }) => [styles.resetAction, { opacity: pressed || resetting ? 0.55 : 1 }]}
            >
              <Text style={[styles.resetText, { color: theme.textSecondary }]}>Forgot password?</Text>
            </Pressable>
          ) : null}
        </Surface>

        <Text style={[styles.privacy, { color: theme.textTertiary }]}>Private by default. Synced data is scoped to your authenticated ONE account.</Text>
      </View>
    </SafeAreaView>
  );
}

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 22 },
  hero: { alignItems: 'center', paddingHorizontal: 16 },
  brand: { marginTop: 14, fontSize: 17, fontWeight: '900', letterSpacing: 1.2 },
  title: { marginTop: 12, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.7, textAlign: 'center' },
  body: { marginTop: 10, maxWidth: 360, fontSize: 13.5, lineHeight: 20, textAlign: 'center' },
  configurationError: { marginBottom: 12, fontSize: 12.5, lineHeight: 18 },
  form: { gap: 10 },
  input: { minHeight: 52, borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, paddingHorizontal: 14, fontSize: 15 },
  switchAction: { minHeight: 42, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  switchText: { fontSize: 13.5, fontWeight: '700' },
  resetAction: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontSize: 12.5, fontWeight: '600' },
  privacy: { paddingHorizontal: 22, textAlign: 'center', fontSize: 11.5, lineHeight: 16 }
});
