import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { IconTile, PageHeader, PrimaryButton, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { usePlan } from '@/src/context/PlanContext';

export default function SettingsScreen() {
  const theme = useTheme();
  const { session, configured, signIn, signUp, signOut } = useAuth();
  const { cloudSyncing, items } = useItems();
  const { reset: resetOnboarding } = useOnboarding();
  const { preference } = useThemePreference();
  const { plan, isBetaAccess } = usePlan();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function runAuth(action: 'signin' | 'signup') {
    await Haptics.selectionAsync();
    const error = action === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);

    if (error) Alert.alert('ONE Account', error);
    else if (action === 'signup') Alert.alert('ONE Account', 'Account created. Check your email if confirmation is enabled.');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <PageHeader title="Settings" subtitle="Keep ONE quiet, private and in sync." />

        {session ? (
          <Surface padded>
            <View style={styles.accountHero}>
              <IconTile icon={icons.person} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountTitle, { color: theme.text }]}>ONE Account</Text>
                <Text style={[styles.accountEmail, { color: theme.textSecondary }]} numberOfLines={1}>{session.user.email}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: theme.accentSoft }]}>
                <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.statusText, { color: theme.accent }]}>{cloudSyncing ? 'Syncing' : 'Synced'}</Text>
              </View>
            </View>
            <View style={[styles.accountStats, { borderTopColor: theme.border }]}>
              <Stat value={String(items.length)} label="Memories" />
              <Stat value="Private" label="Storage" />
              <Stat value="On" label="Recall" />
            </View>
          </Surface>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Membership" />
          <Surface>
            <SettingsRow
              icon={icons.crown}
              label={plan === 'one_ai' ? 'ONE AI' : 'ONE'}
              value={isBetaAccess ? 'Beta access' : plan === 'one_ai' ? '€4.99 / month' : '€2.99 / month'}
              onPress={() => router.push('/upgrade')}
              last
            />
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Preferences" />
          <Surface>
            <SettingsRow
              icon={icons.appearance}
              label="Appearance"
              value={appearanceLabel(preference)}
              onPress={() => router.push("/settings/appearance")}
            />
            <SettingsRow
              icon={icons.bell}
              label="Notifications"
              value="Per item"
              onPress={() => router.push("/settings/notifications")}
            />
            <SettingsRow icon={icons.cloud} label="Cloud sync" value={cloudSyncing ? 'Syncing…' : session ? 'Connected' : 'Sign in'} />
            <SettingsRow
              icon={icons.shield}
              label="Privacy"
              value="Private by default"
              onPress={() => router.push("/settings/privacy")}
              last
            />
          </Surface>
        </View>

        {!session && configured ? (
          <View style={styles.block}>
            <SectionHeader title="ONE Account" meta="Optional" />
            <Surface padded>
              <Text style={[styles.authLead, { color: theme.text }]}>Your memory, on every device.</Text>
              <Text style={[styles.authBody, { color: theme.textSecondary }]}>Sign in to sync items, screenshots and semantic recall securely.</Text>
              <View style={styles.form}>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  placeholderTextColor={theme.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, { color: theme.text, backgroundColor: theme.fill, borderColor: theme.border }]}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor={theme.textTertiary}
                  secureTextEntry
                  style={[styles.input, { color: theme.text, backgroundColor: theme.fill, borderColor: theme.border }]}
                />
                <PrimaryButton label="Sign in" icon={icons.lock} onPress={() => runAuth('signin')} />
                <Pressable onPress={() => runAuth('signup')} style={styles.createAccount}>
                  <Text style={[styles.createAccountText, { color: theme.accent }]}>Create an account</Text>
                </Pressable>
              </View>
            </Surface>
          </View>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="About" />
          <Surface>
            <SettingsRow
              icon={icons.ask}
              label="Replay onboarding"
              value="3 steps"
              onPress={async () => {
                await Haptics.selectionAsync();
                await resetOnboarding();
                router.replace('/onboarding');
              }}
              last
            />
          </Surface>
        </View>

        {session ? (
          <View style={styles.block}>
            <SectionHeader title="Account" />
            <Surface>
              <Pressable
                onPress={async () => {
                  await Haptics.selectionAsync();
                  await signOut();
                }}
                style={({ pressed }) => [styles.signOutRow, { opacity: pressed ? 0.6 : 1 }]}
              >
                <IconTile icon={icons.logout} tone="danger" size={36} />
                <Text style={[styles.signOutText, { color: theme.danger }]}>Sign out</Text>
              </Pressable>
            </Surface>
          </View>
        ) : null}

        <Text style={[styles.footer, { color: theme.textTertiary }]}>ONE · Version 0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );

  function Stat({ value, label }: { value: string; label: string }) {
    return (
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: theme.textTertiary }]}>{label}</Text>
      </View>
    );
  }

  function SettingsRow({
    icon,
    label,
    value,
    last = false,
    onPress
  }: {
    icon: (typeof icons)[keyof typeof icons];
    label: string;
    value: string;
    last?: boolean;
    onPress?: () => void | Promise<void>;
  }) {
    const content = (
      <>
        <IconTile icon={icon} tone="neutral" size={36} />
        <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{value}</Text>
        {onPress ? <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} /> : null}
      </>
    );

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.row,
            !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
            { opacity: pressed ? 0.62 : 1 }
          ]}
        >
          {content}
        </Pressable>
      );
    }

    return (
      <View style={[styles.row, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
        {content}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  accountHero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountTitle: { fontSize: 17, fontWeight: '800' },
  accountEmail: { marginTop: 3, fontSize: 12.5 },
  statusPill: { minHeight: 30, borderRadius: 11, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  accountStats: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  stat: { flex: 1 },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { marginTop: 3, fontSize: 11.5 },
  block: { gap: 10 },
  row: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  rowValue: { fontSize: 12.5 },
  authLead: { fontSize: 18, fontWeight: '800', letterSpacing: -0.25 },
  authBody: { marginTop: 6, fontSize: 13, lineHeight: 19 },
  form: { marginTop: 16, gap: 10 },
  input: { minHeight: 50, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 14, fontSize: 15 },
  createAccount: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  createAccountText: { fontSize: 13.5, fontWeight: '700' },
  signOutRow: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  signOutText: { fontSize: 15, fontWeight: '700' },
  footer: { textAlign: 'center', fontSize: 11.5, marginTop: -4 }
});

function appearanceLabel(value: 'system' | 'light' | 'dark') {
  if (value === 'light') return 'Light';
  if (value === 'dark') return 'Dark';
  return 'System';
}
