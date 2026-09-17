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
import { IconTile, PageHeader, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';

const APP_VERSION = Constants.expoConfig?.version || '0.1.0';
const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

export default function SettingsScreen() {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const { syncStatus, items, retrySync, clearAll } = useItems();
  const { reset: resetOnboarding } = useOnboarding();
  const { preference } = useThemePreference();
  const { plan, isBetaAccess, hasAi, billingConfigured, localizedPrices, managementUrl } = usePlan();
  const [deletingAccount, setDeletingAccount] = useState(false);
  const hasStoreSubscription = billingConfigured && plan !== 'none';
  const subscriptionManagementUrl = managementUrl || (
    hasStoreSubscription && Platform.OS === 'ios' ? APPLE_SUBSCRIPTIONS_URL : undefined
  );

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
      const actions = [
        { text: 'Cancel', style: 'cancel' as const },
        ...(subscriptionManagementUrl
          ? [{ text: 'Manage Subscription', onPress: () => void openSubscriptionManagement() }]
          : []),
        { text: 'Delete Anyway', style: 'destructive' as const, onPress: confirmPermanentDelete }
      ];

      Alert.alert(
        'Subscription continues after deletion',
        'Deleting your NEVER account does not cancel your store subscription. Billing can continue until you cancel it. You can manage the subscription first or delete the account immediately.',
        actions
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
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => void runDeleteAccount()
        }
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
      Alert.alert(
        'NEVER Account Deleted',
        hasStoreSubscription
          ? 'Your NEVER account and synced data have been deleted. Your store subscription is separate and may continue until you cancel it.'
          : 'Your NEVER account and synced data have been deleted.'
      );
    } catch (error) {
      Alert.alert(
        'Could not delete account',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  async function runSignOut() {
    await Haptics.selectionAsync();
    const error = await signOut();
    if (error) Alert.alert('Could not sign out', error);
  }

  async function runRetrySync() {
    await Haptics.selectionAsync();
    await retrySync();
  }

  const syncLabel = syncStatusLabel(syncStatus);
  const syncTone = syncStatus === 'problem' ? theme.danger : syncStatus === 'saved_local' ? theme.textSecondary : theme.success;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={uiStyles.screenContent} showsVerticalScrollIndicator={false}>
        <PageHeader title="Settings" subtitle="Keep NEVER quiet, private and in sync." />

        {session ? (
          <Surface padded>
            <View style={styles.accountHero}>
              <IconTile icon={icons.person} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.accountTitle, { color: theme.text }]}>NEVER Account</Text>
                <Text style={[styles.accountEmail, { color: theme.textSecondary }]} numberOfLines={1}>{session.user.email}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                <View style={[styles.statusDot, { backgroundColor: syncTone }]} />
                <Text style={[styles.statusText, { color: syncStatus === 'problem' ? theme.danger : theme.chrome }]}>{syncLabel}</Text>
              </View>
            </View>
            <View style={[styles.accountStats, { borderTopColor: theme.border }]}>
              <Stat value={String(items.length)} label="Memories" />
              <Stat value="Private" label="Storage" />
              <Stat value={hasAi ? 'AI' : 'Standard'} label="Recall" />
            </View>
          </Surface>
        ) : null}

        <View style={styles.block}>
          <SectionHeader title="Membership" />
          <Surface>
            <SettingsRow
              icon={icons.crown}
              label={membershipLabel(plan)}
              value={isBetaAccess ? 'Beta access' : membershipValue(plan, localizedPrices, billingConfigured)}
              onPress={() => router.push('/upgrade')}
              last={!subscriptionManagementUrl}
            />
            {subscriptionManagementUrl ? (
              <SettingsRow
                icon={icons.settings}
                label="Manage Subscription"
                value={Platform.OS === 'ios' ? 'App Store' : 'Store'}
                onPress={openSubscriptionManagement}
                last
              />
            ) : null}
          </Surface>
        </View>

        <View style={styles.block}>
          <SectionHeader title="Preferences" />
          <Surface>
            <SettingsRow
              icon={icons.appearance}
              label="Appearance"
              value={appearanceLabel(preference)}
              onPress={() => router.push('/settings/appearance')}
            />
            <SettingsRow
              icon={icons.bell}
              label="Notifications"
              value="Per item"
              onPress={() => router.push('/settings/notifications')}
            />
            <SettingsRow
              icon={icons.cloud}
              label="Cloud sync"
              value={syncStatusPreferenceLabel(syncStatus)}
              onPress={syncStatus === 'problem' ? runRetrySync : undefined}
            />
            <SettingsRow
              icon={icons.shield}
              label="Privacy"
              value="Private by default"
              onPress={() => router.push('/settings/privacy')}
              last
            />
          </Surface>
        </View>

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
                accessibilityRole="button"
                accessibilityLabel="Sign out of NEVER"
                onPress={() => void runSignOut()}
                style={({ pressed }) => [styles.accountActionRow, { borderBottomColor: theme.border, opacity: pressed ? 0.58 : 1 }]}
              >
                <IconTile icon={icons.logout} tone="danger" size={36} />
                <Text style={[styles.accountActionText, { color: theme.danger }]}>Sign out</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete NEVER account permanently"
                disabled={deletingAccount}
                onPress={confirmDeleteAccount}
                style={({ pressed }) => [styles.accountActionRow, { opacity: pressed || deletingAccount ? 0.58 : 1 }]}
              >
                <IconTile icon={icons.delete} tone="danger" size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accountActionText, { color: theme.danger }]}>Delete Account</Text>
                  <Text style={[styles.deleteMeta, { color: theme.textTertiary }]}>Permanently delete NEVER data</Text>
                </View>
                {deletingAccount ? <ActivityIndicator size="small" /> : <OneIcon name={icons.chevron} size={14} color={theme.textTertiary} />}
              </Pressable>
            </Surface>
          </View>
        ) : null}

        <Text style={[styles.footer, { color: theme.textTertiary }]}>NEVER · Version {APP_VERSION}</Text>
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
          accessibilityRole="button"
          accessibilityLabel={`${label}. ${value}`}
          onPress={onPress}
          style={({ pressed }) => [
            styles.row,
            !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
            { opacity: pressed ? 0.58 : 1 }
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
  accountTitle: { fontSize: 16.5, fontWeight: '700', letterSpacing: -0.2 },
  accountEmail: { marginTop: 4, fontSize: 12.25 },
  statusPill: { minHeight: 30, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.1 },
  accountStats: { marginTop: 17, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  stat: { flex: 1 },
  statValue: { fontSize: 14.5, fontWeight: '700' },
  statLabel: { marginTop: 4, fontSize: 11 },
  block: { gap: 10 },
  row: { minHeight: 64, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowLabel: { flex: 1, fontSize: 14.5, fontWeight: '600', letterSpacing: -0.1 },
  rowValue: { fontSize: 12 },
  accountActionRow: { minHeight: 66, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  accountActionText: { fontSize: 14.5, fontWeight: '700' },
  deleteMeta: { marginTop: 4, fontSize: 11 },
  footer: { textAlign: 'center', fontSize: 10.5, letterSpacing: 0.6, marginTop: -2 }
});

function syncStatusLabel(status: 'saved' | 'syncing' | 'saved_local' | 'problem') {
  if (status === 'syncing') return 'Syncing';
  if (status === 'saved_local') return 'Saved';
  if (status === 'problem') return 'Sync problem';
  return 'Synced';
}

function syncStatusPreferenceLabel(status: 'saved' | 'syncing' | 'saved_local' | 'problem') {
  if (status === 'syncing') return 'Syncing…';
  if (status === 'saved_local') return 'Saved on device';
  if (status === 'problem') return 'Tap to retry';
  return 'Up to date';
}

function membershipLabel(plan: 'none' | 'one' | 'one_ai') {
  if (plan === 'one_ai') return 'NEVER AI';
  if (plan === 'one') return 'NEVER';
  return 'No subscription';
}

function membershipValue(
  plan: 'none' | 'one' | 'one_ai',
  localizedPrices: Partial<Record<'one' | 'one_ai', string>>,
  billingConfigured: boolean
) {
  if (plan === 'one_ai') {
    if (localizedPrices.one_ai) return `${localizedPrices.one_ai} / month`;
    return billingConfigured ? 'Active · App Store' : '€4.99 / month';
  }
  if (plan === 'one') {
    if (localizedPrices.one) return `${localizedPrices.one} / month`;
    return billingConfigured ? 'Active · App Store' : '€2.99 / month';
  }
  return 'Choose a plan';
}

function appearanceLabel(value: 'system' | 'light' | 'dark') {
  if (value === 'light') return 'Light';
  if (value === 'dark') return 'Dark';
  return 'System';
}
