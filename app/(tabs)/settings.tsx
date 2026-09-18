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
import { BrandHeader, SectionHeader, Surface, uiStyles } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';

const APP_VERSION = Constants.expoConfig?.version || '0.1.0';
const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

export default function SettingsScreen() {
  const theme = useTheme();
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
                backgroundColor: `${theme.surfaceElevated}C8`,
                borderColor: `${theme.text}14`,
                shadowColor: theme.shadow,
                opacity: pressed ? 0.68 : 1
              }
            ]}
          >
            <View pointerEvents="none" style={[styles.profileShine, { backgroundColor: `${theme.text}0D` }]} />
            <View style={[styles.avatar, { backgroundColor: `${theme.fill}A8`, borderColor: `${theme.text}12` }]}>
              {initials ? <Text style={[styles.avatarText, { color: theme.chrome }]}>{initials}</Text> : <OneIcon name={icons.person} size={18.5} color={theme.chrome} />}
            </View>
            <View style={styles.profileCopy}>
              <Text style={[styles.profileTitle, { color: theme.text }]} numberOfLines={1}>{profileName}</Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]} numberOfLines={1}>{session.user.email}</Text>
            </View>
            <View style={styles.profileMeta}>
              <View style={[styles.planBadge, { backgroundColor: `${theme.fill}78`, borderColor: `${theme.text}10` }]}>
                <Text style={[styles.planLabel, { color: theme.textSecondary }]}>{isBetaAccess ? 'BETA' : membershipLabel(plan).toUpperCase()}</Text>
              </View>
              <View style={[styles.rowArrow, { backgroundColor: `${theme.fill}72`, borderColor: `${theme.text}0E` }]}>
                <OneIcon name={icons.chevron} size={10.5} color={theme.textTertiary} />
              </View>
            </View>
          </Pressable>
        ) : null}

        <SettingsSection title="Preferences">
          <SettingsRow icon={icons.appearance} label="Appearance" value={appearanceLabel(preference)} onPress={() => router.push('/settings/appearance')} />
          <SettingsRow icon={icons.bell} label="Notifications" value="Reminders and alerts" onPress={() => router.push('/settings/notifications')} />
          <SettingsRow icon={icons.cloud} label="Cloud sync" value={syncLabel} onPress={syncStatus === 'problem' ? retrySync : undefined} />
          <SettingsRow icon={icons.shield} label="Security & Privacy" value="Export, legal and account controls" onPress={() => router.push('/settings/privacy')} last />
        </SettingsSection>

        <SettingsSection title="Membership">
          <SettingsRow
            icon={icons.crown}
            label={membershipLabel(plan)}
            value={isBetaAccess ? 'Beta access' : membershipValue(plan, localizedPrices, billingConfigured)}
            onPress={() => router.push('/upgrade')}
            last={!subscriptionManagementUrl}
          />
          {subscriptionManagementUrl ? <SettingsRow icon={icons.settings} label="Manage subscription" value="Open store subscription settings" onPress={openSubscriptionManagement} last /> : null}
        </SettingsSection>

        <SettingsSection title="NEVER">
          <SettingsRow
            icon={icons.ask}
            label="Replay onboarding"
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
            <SettingsRow icon={icons.logout} label="Sign out" value="Keep your account and cloud data" onPress={runSignOut} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete NEVER account permanently"
              disabled={deletingAccount}
              onPress={confirmDeleteAccount}
              style={({ pressed }) => [styles.dangerRow, { borderTopColor: `${theme.text}10`, opacity: pressed || deletingAccount ? 0.58 : 1 }]}
            >
              <View style={[styles.rowIcon, { backgroundColor: `${theme.danger}13`, borderColor: `${theme.danger}30` }]}>
                <OneIcon name={icons.delete} size={15.5} color={theme.danger} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowLabel, { color: theme.danger }]}>Delete account</Text>
                <Text style={[styles.rowValue, { color: theme.textTertiary }]}>Permanently delete your NEVER account and synced data</Text>
              </View>
              {deletingAccount ? <ActivityIndicator size="small" /> : (
                <View style={[styles.rowArrow, { backgroundColor: `${theme.fill}72`, borderColor: `${theme.text}0E` }]}>
                  <OneIcon name={icons.chevron} size={10.5} color={theme.textTertiary} />
                </View>
              )}
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
        <SectionHeader title={sectionTitle} />
        <Surface>{children}</Surface>
      </View>
    );
  }

  function SettingsRow({ icon, label, value, last = false, onPress }: {
    icon: (typeof icons)[keyof typeof icons];
    label: string;
    value: string;
    last?: boolean;
    onPress?: () => void | Promise<void>;
  }) {
    const content = (
      <>
        <View style={[styles.rowIcon, { backgroundColor: `${theme.fill}72`, borderColor: `${theme.text}0E` }]}>
          <OneIcon name={icon} size={15.5} color={theme.textSecondary} />
        </View>
        <View style={styles.rowCopy}>
          <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.rowValue, { color: theme.textSecondary }]} numberOfLines={2}>{value}</Text>
        </View>
        {onPress ? (
          <View style={[styles.rowArrow, { backgroundColor: `${theme.fill}72`, borderColor: `${theme.text}0E` }]}>
            <OneIcon name={icons.chevron} size={10.5} color={theme.textTertiary} />
          </View>
        ) : null}
      </>
    );
    const separator = !last ? { borderBottomColor: `${theme.text}10`, borderBottomWidth: StyleSheet.hairlineWidth } : undefined;
    if (onPress) {
      return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.row, separator, { opacity: pressed ? 0.58 : 1 }]} accessibilityRole="button">
          {content}
        </Pressable>
      );
    }
    return <View style={[styles.row, separator]}>{content}</View>;
  }
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
  intro: { marginTop: -2 },
  title: { fontFamily: editorialFontFamily, fontSize: 34, lineHeight: 38, fontWeight: '400', letterSpacing: -0.9 },
  subtitle: { marginTop: 6, fontSize: 12.5, lineHeight: 18 },
  profileCard: { minHeight: 80, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden', shadowOpacity: 0.11, shadowRadius: 22, shadowOffset: { width: 0, height: 9 }, elevation: 4 },
  profileShine: { position: 'absolute', top: 0, left: 18, right: 18, height: StyleSheet.hairlineWidth },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12.5, lineHeight: 15, fontWeight: '700', letterSpacing: 0.4 },
  profileCopy: { flex: 1, minWidth: 0 },
  profileTitle: { fontSize: 14.25, lineHeight: 18, fontWeight: '600' },
  profileEmail: { marginTop: 2, fontSize: 10.75, lineHeight: 14 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  planBadge: { minHeight: 26, paddingHorizontal: 9, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  planLabel: { fontSize: 8.1, fontWeight: '700', letterSpacing: 0.82 },
  block: { gap: 10 },
  row: { minHeight: 64, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  rowArrow: { width: 23, height: 23, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 13.65, lineHeight: 17.25, fontWeight: '600', letterSpacing: -0.06 },
  rowValue: { marginTop: 2, fontSize: 10.6, lineHeight: 14.5 },
  dangerRow: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 11 },
  footer: { textAlign: 'center', fontSize: 8.35, fontWeight: '600', letterSpacing: 1.18, marginTop: 1 }
});