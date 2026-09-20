import type { ReactNode } from 'react';
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
import { OneIcon, icons } from '@/src/ui/icons';
import {
  V5Chevron,
  V5Group,
  V5LargeHeader,
  V5SectionHeader,
  V5Wordmark,
  useNeverV5Palette
} from '@/src/ui/appleV5';
import { useThemePreference } from '@/src/theme/useTheme';

const APP_VERSION = Constants.expoConfig?.version || '0.1.0';
const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

type IconName = (typeof icons)[keyof typeof icons];

type RowTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export default function SettingsV5() {
  const p = useNeverV5Palette();
  const { session, signOut } = useAuth();
  const { syncStatus, retrySync, clearAll } = useItems();
  const { reset: resetOnboarding } = useOnboarding();
  const { preference } = useThemePreference();
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

  const syncLabel = syncStatus === 'syncing'
    ? 'Syncing…'
    : syncStatus === 'saved_local'
      ? 'Saved on this device'
      : syncStatus === 'problem'
        ? 'Tap to retry'
        : 'Up to date';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandBar}><V5Wordmark /></View>
        <V5LargeHeader title="Settings" subtitle="Account, appearance and NEVER preferences." />

        {session ? (
          <V5Group>
            <Pressable
              onPress={() => router.push('/settings/privacy')}
              style={({ pressed }) => [styles.profileRow, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
            >
              <View style={[styles.avatar, { backgroundColor: p.fillSoft }]}>
                {initials ? <Text style={[styles.avatarText, { color: p.chrome }]}>{initials}</Text> : <OneIcon name={icons.person} size={19} color={p.chrome} />}
              </View>
              <View style={styles.profileCopy}>
                <Text style={[styles.profileTitle, { color: p.label }]} numberOfLines={1}>{profileName}</Text>
                <Text style={[styles.profileEmail, { color: p.secondary }]} numberOfLines={1}>{session.user.email}</Text>
              </View>
              <View style={styles.profileMeta}>
                <Text style={[styles.planLabel, { color: p.tertiary }]}>{isBetaAccess ? 'BETA' : membershipLabel(plan).toUpperCase()}</Text>
                <V5Chevron />
              </View>
            </Pressable>
          </V5Group>
        ) : null}

        <SettingsSection title="Preferences">
          <SettingsRow icon={icons.appearance} label="Appearance" value={appearanceLabel(preference)} onPress={() => router.push('/settings/appearance')} />
          <SettingsRow icon={icons.bell} label="Notifications" value="Reminders and alerts" onPress={() => router.push('/settings/notifications')} />
          <SettingsRow icon={icons.cloud} label="Cloud Sync" value={syncLabel} tone={syncStatus === 'problem' ? 'warning' : 'neutral'} onPress={syncStatus === 'problem' ? retrySync : undefined} />
          <SettingsRow icon={icons.shield} label="Security & Privacy" value="Export, legal and account controls" onPress={() => router.push('/settings/privacy')} last />
        </SettingsSection>

        <SettingsSection title="Membership">
          <SettingsRow
            icon={icons.crown}
            label={membershipLabel(plan)}
            value={isBetaAccess ? 'Beta access' : membershipValue(plan, localizedPrices, billingConfigured)}
            tone="accent"
            onPress={() => router.push('/upgrade')}
            last={!subscriptionManagementUrl}
          />
          {subscriptionManagementUrl ? (
            <SettingsRow icon={icons.settings} label="Manage Subscription" value="Open App Store subscription settings" onPress={openSubscriptionManagement} last />
          ) : null}
        </SettingsSection>

        <SettingsSection title="NEVER">
          <SettingsRow
            icon={icons.ask}
            label="Replay Onboarding"
            value="Review the core NEVER concepts"
            onPress={async () => {
              await Haptics.selectionAsync();
              await resetOnboarding();
              router.replace('/onboarding');
            }}
          />
          <SettingsRow icon={icons.info} label="About NEVER" value={`Version ${APP_VERSION}`} last />
        </SettingsSection>

        {session ? (
          <SettingsSection title="Account">
            <SettingsRow icon={icons.logout} label="Sign Out" value="Keep your account and cloud data" onPress={runSignOut} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete NEVER account permanently"
              disabled={deletingAccount}
              onPress={confirmDeleteAccount}
              style={({ pressed }) => [styles.dangerRow, { backgroundColor: pressed ? p.fillSoft : 'transparent', opacity: deletingAccount ? 0.58 : 1 }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: p.danger + '18' }]}>
                <OneIcon name={icons.delete} size={16} color={p.danger} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowLabel, { color: p.danger }]}>Delete Account</Text>
                <Text style={[styles.rowValue, { color: p.secondary }]}>Permanently delete your account and synced data</Text>
              </View>
              {deletingAccount ? <ActivityIndicator size="small" /> : <V5Chevron />}
            </Pressable>
          </SettingsSection>
        ) : null}

        <Text style={[styles.footer, { color: p.tertiary }]}>NEVER · {hasAi ? 'AI enabled' : 'Core'} · {APP_VERSION}</Text>
      </ScrollView>
    </SafeAreaView>
  );

  function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
    return (
      <View style={styles.section}>
        <V5SectionHeader title={title} />
        <V5Group>{children}</V5Group>
      </View>
    );
  }

  function SettingsRow({
    icon,
    label,
    value,
    tone = 'neutral',
    last = false,
    onPress
  }: {
    icon: IconName;
    label: string;
    value: string;
    tone?: RowTone;
    last?: boolean;
    onPress?: () => void | Promise<void>;
  }) {
    const tint = rowTint(tone, p);
    const content = (
      <>
        <View style={[styles.rowIcon, { backgroundColor: tone === 'neutral' ? p.fillSoft : tint + '18' }]}>
          <OneIcon name={icon} size={16} color={tint} />
        </View>
        <View style={[styles.rowContent, !last && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
          <View style={styles.rowCopy}>
            <Text style={[styles.rowLabel, { color: p.label }]}>{label}</Text>
            <Text style={[styles.rowValue, { color: p.secondary }]} numberOfLines={2}>{value}</Text>
          </View>
          {onPress ? <V5Chevron /> : null}
        </View>
      </>
    );

    if (!onPress) return <View style={styles.row}>{content}</View>;
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { backgroundColor: pressed ? p.fillSoft : 'transparent' }]}>
        {content}
      </Pressable>
    );
  }
}

function rowTint(tone: RowTone, p: ReturnType<typeof useNeverV5Palette>) {
  if (tone === 'accent') return p.chrome;
  if (tone === 'success') return p.success;
  if (tone === 'warning') return p.warning;
  if (tone === 'danger') return p.danger;
  return p.chrome;
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
  if (value === 'light') return 'Light';
  if (value === 'dark') return 'Dark';
  return 'Automatic';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 118, gap: 22 },
  brandBar: { minHeight: 32, justifyContent: 'center' },
  profileRow: { minHeight: 82, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, lineHeight: 19, fontWeight: '700', letterSpacing: 0.3 },
  profileCopy: { flex: 1, minWidth: 0 },
  profileTitle: { fontSize: 16, lineHeight: 20, fontWeight: '600' },
  profileEmail: { marginTop: 2, fontSize: 13, lineHeight: 17 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planLabel: { fontSize: 10, lineHeight: 13, fontWeight: '700', letterSpacing: 0.6 },
  section: { gap: 8 },
  row: { minHeight: 66, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, minHeight: 66, paddingRight: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 15.5, lineHeight: 19, fontWeight: '500' },
  rowValue: { marginTop: 2, fontSize: 12.5, lineHeight: 16 },
  dangerRow: { minHeight: 66, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  footer: { textAlign: 'center', fontSize: 11, lineHeight: 15, paddingVertical: 8 }
});