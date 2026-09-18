import { useState } from 'react';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useItems } from '@/src/context/ItemsContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { usePlan } from '@/src/context/PlanContext';
import { deleteOneAccount } from '@/src/supabase/account';
import { BrandHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';

const APP_VERSION = Constants.expoConfig?.version || '0.1.0';
const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

type RowTone = 'neutral' | 'blue' | 'red' | 'green' | 'gold' | 'plum';

export default function SettingsScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const { syncStatus, retrySync, clearAll } = useItems();
  const { reset: resetOnboarding } = useOnboarding();
  const { preference, resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  const { plan, isBetaAccess, hasAi, billingConfigured, localizedPrices, managementUrl } = usePlan();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const hasStoreSubscription = billingConfigured && plan !== 'none';
  const subscriptionManagementUrl = managementUrl || (hasStoreSubscription && Platform.OS === 'ios' ? APPLE_SUBSCRIPTIONS_URL : undefined);
  const profileName = displayName(session?.user.user_metadata) || 'NEVER Account';
  const initials = initialsFor(profileName);

  async function openSubscriptionManagement() {
    if (!subscriptionManagementUrl) return;
    await Haptics.selectionAsync();
    try {
      const supported = await Linking.canOpenURL(subscriptionManagementUrl);
      if (!supported) {
        Alert.alert('Manage Subscription', 'NEVER could not open your subscription management page on this device.');
        return;
      }
      await Linking.openURL(subscriptionManagementUrl);
    } catch {
      Alert.alert('Manage Subscription', 'NEVER could not open your subscription management page on this device.');
    }
  }

  function confirmDeleteAccount() {
    if (deletingAccount) return;
    if (hasStoreSubscription) {
      Alert.alert(
        'Subscription continues after deletion',
        'Deleting your NEVER account does not cancel your store subscription.',
        [
          { text: 'Cancel', style: 'cancel' },
          ...(subscriptionManagementUrl ? [{ text: 'Manage Subscription', onPress: () => void openSubscriptionManagement() }] : []),
          { text: 'Delete Anyway', style: 'destructive', onPress: confirmPermanentDelete }
        ]
      );
      return;
    }
    confirmPermanentDelete();
  }

  function confirmPermanentDelete() {
    Alert.alert(
      'Delete NEVER Account?',
      'This permanently deletes your cloud memories, documents, attachments and NEVER account. This cannot be undone.',
      [
        { text: 'Keep Account', style: 'cancel' },
        { text: 'Delete Permanently', style: 'destructive', onPress: () => void runDeleteAccount() }
      ]
    );
  }

  async function runDeleteAccount() {
    if (deletingAccount) return;
    setDeletingAccount(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      const error = await deleteOneAccount();
      if (error) {
        Alert.alert('Could not delete account', error);
        return;
      }
      await clearAll();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('NEVER Account Deleted', 'Your NEVER account and synced data have been deleted.');
    } catch (error) {
      Alert.alert('Could not delete account', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  }

  async function runSignOut() {
    await Haptics.selectionAsync();
    const error = await signOut();
    if (error) Alert.alert('Could not sign out', error);
  }

  const syncLabel = syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'saved_local' ? 'Saved on this device' : syncStatus === 'problem' ? 'Tap to retry' : 'Up to date';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false}>
        <BrandHeader />

        <View style={styles.intro}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Make NEVER your own.</Text>
        </View>

        {session ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/settings/privacy')}
            style={({ pressed }) => [
              styles.profileCard,
              {
                backgroundColor: dark ? '#1C1C1EF7' : '#FFFFFFFA',
                borderColor: dark ? '#FFFFFF10' : '#00000008',
                shadowColor: theme.shadow,
                shadowOpacity: dark ? 0.2 : 0.1,
                opacity: pressed ? 0.7 : 1
              }
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: dark ? '#2C2C2EF0' : '#F2F2F7' }]}>
              {initials ? <Text style={[styles.avatarText, { color: theme.chrome }]}>{initials}</Text> : <OneIcon name={icons.person} size={18.5} color={theme.chrome} />}
            </View>
            <View style={styles.profileCopy}>
              <Text style={[styles.profileTitle, { color: theme.text }]} numberOfLines={1}>{profileName}</Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]} numberOfLines={1}>{session.user.email}</Text>
            </View>
            <View style={styles.profileMeta}>
              <View style={[styles.planBadge, { backgroundColor: dark ? '#2C2C2EF0' : '#F2F2F7' }]}>
                <Text style={[styles.planLabel, { color: theme.textSecondary }]}>{isBetaAccess ? 'BETA' : membershipLabel(plan).toUpperCase()}</Text>
              </View>
              <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />
            </View>
          </Pressable>
        ) : null}

        <SettingsSection title="Preferences">
          <SettingsRow tone="blue" icon={icons.appearance} label="Appearance" value={appearanceLabel(preference)} onPress={() => router.push('/settings/appearance')} />
          <SettingsRow tone="red" icon={icons.bell} label="Notifications" value="Reminders and alerts" onPress={() => router.push('/settings/notifications')} />
          <SettingsRow tone="blue" icon={icons.cloud} label="Cloud sync" value={syncLabel} onPress={syncStatus === 'problem' ? retrySync : undefined} />
          <SettingsRow tone="green" icon={icons.shield} label="Security & Privacy" value="Export, legal and account controls" onPress={() => router.push('/settings/privacy')} last />
        </SettingsSection>

        <SettingsSection title="Membership">
          <SettingsRow
            tone="gold"
            icon={icons.crown}
            label={membershipLabel(plan)}
            value={isBetaAccess ? 'Beta access' : membershipValue(plan, localizedPrices, billingConfigured)}
            onPress={() => router.push('/upgrade')}
            last={!subscriptionManagementUrl}
          />
          {subscriptionManagementUrl ? <SettingsRow tone="neutral" icon={icons.settings} label="Manage subscription" value="Open store subscription settings" onPress={openSubscriptionManagement} last /> : null}
        </SettingsSection>

        <SettingsSection title="NEVER">
          <SettingsRow
            tone="plum"
            icon={icons.ask}
            label="Replay onboarding"
            value="Review the core NEVER concepts"
            onPress={async () => {
              await Haptics.selectionAsync();
              await resetOnboarding();
              router.replace('/onboarding');
            }}
          />
          <SettingsRow tone="neutral" icon={icons.info} label="About NEVER" value={`Version ${APP_VERSION}`} last />
        </SettingsSection>

        {session ? (
          <SettingsSection title="Account">
            <SettingsRow tone="neutral" icon={icons.logout} label="Sign out" value="Keep your account and cloud data" onPress={runSignOut} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete NEVER account permanently"
              disabled={deletingAccount}
              onPress={confirmDeleteAccount}
              style={({ pressed }) => [styles.dangerRow, { borderTopColor: `${theme.text}0D`, backgroundColor: pressed ? `${theme.fill}42` : 'transparent', opacity: deletingAccount ? 0.58 : 1 }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${theme.danger}${dark ? '24' : '18'}` }]}>
                <OneIcon name={icons.delete} size={15.5} color={theme.danger} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowLabel, { color: theme.danger }]}>Delete account</Text>
                <Text style={[styles.rowValue, { color: theme.textTertiary }]}>Permanently delete your NEVER account and synced data</Text>
              </View>
              {deletingAccount ? <ActivityIndicator size="small" /> : <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} />}
            </Pressable>
          </SettingsSection>
        ) : null}

        <Text style={[styles.footer, { color: theme.textTertiary }]}>N E V E R   ·   {hasAi ? 'AI ENABLED' : 'CORE'}   ·   {APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );

  function SettingsSection({ title: sectionTitle, children }: { title: string; children: React.ReactNode }) {
    return (
      <View style={styles.block}>
        <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>{sectionTitle.toUpperCase()}</Text>
        <Surface>{children}</Surface>
      </View>
    );
  }

  function SettingsRow({ tone, icon, label, value, last = false, onPress }: {
    tone: RowTone;
    icon: (typeof icons)[keyof typeof icons];
    label: string;
    value: string;
    last?: boolean;
    onPress?: () => void | Promise<void>;
  }) {
    const tint = toneColor(tone, theme);
    const content = (
      <>
        <View style={[styles.rowIcon, { backgroundColor: `${tint}${dark ? '24' : '18'}` }]}>
          <OneIcon name={icon} size={15.5} color={tint} />
        </View>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.rowValue, { color: theme.textSecondary }]} numberOfLines={2}>{value}</Text>
        </View>
        {onPress ? <OneIcon name={icons.chevron} size={13} color={theme.textTertiary} /> : null}
      </>
    );
    const separator = !last ? { borderBottomColor: `${theme.text}0D`, borderBottomWidth: StyleSheet.hairlineWidth } : undefined;
    if (onPress) {
      return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.row, separator, { backgroundColor: pressed ? `${theme.fill}42` : 'transparent' }]} accessibilityRole="button">
          {content}
        </Pressable>
      );
    }
    return <View style={[styles.row, separator]}>{content}</View>;
  }
}

function toneColor(tone: RowTone, theme: ReturnType<typeof useTheme>) {
  if (tone === 'blue') return theme.sky;
  if (tone === 'red') return theme.danger;
  if (tone === 'green') return theme.success;
  if (tone === 'gold') return theme.warning;
  if (tone === 'plum') return theme.plum;
  return theme.textSecondary;
}

function displayName(metadata?: Record<string, unknown>) {
  if (!metadata) return undefined;
  const value = [metadata.full_name, metadata.name, metadata.first_name]
    .find((candidate) => typeof candidate === 'string' && candidate.trim()) as string | undefined;
  return value?.trim();
}

function initialsFor(name: string) {
  if (!name || name === 'NEVER Account') return undefined;
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function membershipLabel(plan: 'none' | 'one' | 'one_ai') {
  if (plan === 'one_ai') return 'NEVER AI';
  if (plan === 'one') return 'NEVER';
  return 'Membership';
}

function membershipValue(plan: 'none' | 'one' | 'one_ai', localizedPrices: Partial<Record<'one' | 'one_ai', string>>, billingConfigured: boolean) {
  if (plan === 'one_ai') return localizedPrices.one_ai ? `${localizedPrices.one_ai} / month · Active` : billingConfigured ? 'Active · App Store' : '€4.99 / month';
  if (plan === 'one') return localizedPrices.one ? `${localizedPrices.one} / month · Active` : billingConfigured ? 'Active · App Store' : '€2.99 / month';
  return 'Compare NEVER plans';
}

function appearanceLabel(value: 'system' | 'light' | 'dark') {
  if (value === 'light') return 'Core Light';
  if (value === 'dark') return 'Core Dark';
  return 'Follow device';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  intro: { marginTop: -1 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1.1 },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 18.5 },
  profileCard: { minHeight: 82, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowRadius: 22, shadowOffset: { width: 0, height: 9 }, elevation: 4 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, lineHeight: 16, fontWeight: '700', letterSpacing: 0.35 },
  profileCopy: { flex: 1, minWidth: 0 },
  profileTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  profileEmail: { marginTop: 2, fontSize: 10.9, lineHeight: 14 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planBadge: { minHeight: 28, paddingHorizontal: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  planLabel: { fontSize: 8.1, fontWeight: '700', letterSpacing: 0.82 },
  block: { gap: 7 },
  groupTitle: { paddingHorizontal: 7, fontSize: 8.5, lineHeight: 12, fontWeight: '700', letterSpacing: 1.15 },
  row: { minHeight: 62, paddingHorizontal: 15, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 13.75, lineHeight: 17.25, fontWeight: '600', letterSpacing: -0.08 },
  rowValue: { marginTop: 2, fontSize: 10.6, lineHeight: 14.5 },
  dangerRow: { minHeight: 66, paddingHorizontal: 15, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footer: { textAlign: 'center', fontSize: 8.35, fontWeight: '600', letterSpacing: 1.18, marginTop: 2 }
});
