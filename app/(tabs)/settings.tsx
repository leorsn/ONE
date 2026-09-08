import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { useTheme } from '@/src/theme/useTheme';

export default function SettingsScreen() {
  const theme = useTheme();
  const { session, configured, signIn, signUp, signOut } = useAuth();
  const { cloudSyncing } = useItems();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function runAuth(action: 'signin' | 'signup') {
    const error = action === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);

    if (error) {
      Alert.alert('ONE Account', error);
    } else if (action === 'signup') {
      Alert.alert('ONE Account', 'Account created. Check your email if confirmation is enabled.');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.brand, { color: theme.text }]}>ONE</Text>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Row label="Appearance" value="System" theme={theme} />
          <Row label="Notifications" value="Enabled per item" theme={theme} />
          <Row
            label="Cloud sync"
            value={!configured ? 'Not configured' : cloudSyncing ? 'Syncing…' : session ? 'Connected' : 'Sign in'}
            theme={theme}
          />
        </View>

        {configured && !session ? (
          <View style={[styles.authCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.authTitle, { color: theme.text }]}>ONE Account</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            />
            <Pressable onPress={() => runAuth('signin')} style={[styles.primary, { backgroundColor: theme.accent }]}>
              <Text style={styles.primaryText}>Sign in</Text>
            </Pressable>
            <Pressable onPress={() => runAuth('signup')} style={[styles.secondary, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text }}>Create account</Text>
            </Pressable>
          </View>
        ) : null}

        {session ? (
          <View style={[styles.authCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.authTitle, { color: theme.text }]}>Connected</Text>
            <Text style={{ color: theme.textSecondary }}>{session.user.email}</Text>
            <Pressable onPress={signOut} style={[styles.secondary, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text }}>Sign out</Text>
            </Pressable>
          </View>
        ) : null}

        {!configured ? (
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            Local mode is active. Add the ONE Supabase URL and publishable key to enable accounts and cloud sync.
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.textSecondary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 16 },
  brand: { fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  title: { fontSize: 30, fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  row: { minHeight: 64, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '600' },
  value: { fontSize: 13 },
  authCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  authTitle: { fontSize: 18, fontWeight: '700' },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14 },
  primary: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: { minHeight: 48, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 13, lineHeight: 19 }
});
