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
import { NeverBackdrop, NeverEyebrow, NeverHeroSurface, NeverMetric } from '@/src/ui/neverVisual';
import {
  V5Chevron,
  V5Group,
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
      ? 'On device'
      : syncStatus === 'problem'
        ? 'Needs attention'
        : 'Up to date';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top']}>
      <NeverBackdrop />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCopy}>
          <NeverEyebrow>Control center</NeverEyebrow>
          <Text accessibilityRole="header" style={[styles.heroTitle, { color: p.label }]}>Settings.</Text>
          <Text style={[styles.heroSubtitle, { color: p.secondary }]}>Your account, memory preferences and NEVER membership.</Text>
        </View>

        {session ? (
          <NeverHeroSurface style={styles.profileStage}>
            <Pressable
              onPress={() => router.push('/settings/privacy')}
              style={({ pressed }) => [styles.profileTop, { opacity: pressed ? 0.66 : 1 }]}
            >
              <View style={[styles.avatar, { backgroundColor: p.graphite }]}>
                {initials ? <Text style={[styles.avatarText, { color: p.onAccent }]}>{initials}</Text> : <OneIcon name={icons.person} size={24} color={p.onAccent} />}
              </View>
              <View style={styles.profileCopy}>
                <NeverEyebrow>{isBetaAccess ? 'Beta account' : membershipLabel(plan)}</NeverEyebrow>
                <Text style={[styles.profileTitle, { color: p.label }]} numberOfLines={1}>{profileName}</Text>
                <Text style={[styles.profileEmail, { color: p.secondary }]} numberOfLines={1}>{session.user.email}</Text>
              </View>
              <View style={[styles.profileArrow, { backgroundColor: p.fillSoft }]}><V5Chevron /></View>
            </Pressable>
            <View style={[styles.profileMetrics, { borderTopColor: p.separator }]}>
              <NeverMetric value={appearanceLabel(preference)} label="appearance" style={styles.profileMetric} />
              <NeverMetric value={syncLabel} label="cloud" style={styles.profileMetric} />
              <NeverMetric value={hasAi ? 'On' : 'Core'} label="AI" style={styles.profileMetric} />
            </View>
          </NeverHeroSurface>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: p.label }]}>Preferences</Text>
            <Text style={[styles.sectionMeta, { color: p.tertiary }]}>DEVICE & MEMORY</Text>
          </View>
          <View style={styles.preferenceGrid}>
            <PreferenceTile icon={icons.appearance} label="Appearance" value={appearanceLabel(preference)} onPress={() => router.push('/settings/appearance')} />
            <PreferenceTile icon={icons.bell} label="Notifications" value="Reminders & alerts" onPress={() => router.push('/settings/notifications')} />
            <PreferenceTile icon={icons.cloud} label="Cloud Sync" value={syncLabel} tone={syncStatus === 'problem' ? 'warning' : 'neutral'} onPress={syncStatus === 'problem' ? retrySync : undefined} />
            <PreferenceTile icon={icons.shield} label="Privacy" value="Export & controls" onPress={() => router.push('/settings/privacy')} />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: p.label }]}>Membership</Text>
            <Text style={[styles.sectionMeta, { color: p.tertiary }]}>{isBetaAccess ? 'BETA' : 'NEVER'}</Text>
          </View>
          <NeverHeroSurface compact>
            <Pressable onPress={() => router.push('/upgrade')} style={({ pressed }) => [styles.membershipRow, { opacity: pressed ? 0.65 : 1 }]}>
              <View style={[styles.membershipIcon, { backgroundColor: p.graphite }]}>
                <OneIcon name={icons.crown} size={18} color={p.onAccent} />
              </View>
              <View style={styles.membershipCopy}>
                <NeverEyebrow>{isBetaAccess ? 'Early access' : 'Plan'}</NeverEyebrow>
                <Text style={[styles.membershipTitle, { color: p.label }]}>{membershipLabel(plan)}</Text>
                <Text style={[styles.membershipValue, { color: p.secondary }]} numberOfLines={2}>{isBetaAccess ? 'Beta access' : membershipValue(plan, localizedPrices, billingConfigured)}</Text>
              </View>
              <V5Chevron />
            </Pressable>
            {subscriptionManagementUrl ? (
              <Pressable
                onPress={openSubscriptionManagement}
                style={({ pressed }) => [styles.manageRow, { borderTopColor: p.separator, backgroundColor: pressed ? p.fillSoft : 'transparent' }]}
              >
                <Text style={[styles.manageText, { color: p.chrome }]}>Manage subscription</Text>
                <V5Chevron />
              </Pressable>
            ) : null}
          </NeverHeroSurface>
        </View>

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
                <OneIcon name={icons.delete} size={15} color={p.danger} />
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

  function PreferenceTile({
    icon,
    label,
    value,
    tone = 'neutral',
    onPress
  }: {
    icon: IconName;
    label: string;
    value: string;
    tone?: RowTone;
    onPress?: () => void | Promise<void>;
  }) {
    const tint = rowTint(tone, p);
    const body = (
      <>
        <View style={styles.preferenceTop}>
          <View style={[styles.preferenceIcon, { backgroundColor: tone === 'neutral' ? p.fillSoft : tint + '18' }]}>
            <OneIcon name={icon} size={17} color={tint} />
          </View>
          {onPress ? <V5Chevron /> : null}
        </View>
        <Text style={[styles.preferenceLabel, { color: p.label }]}>{label}</Text>
        <Text style={[styles.preferenceValue, { color: p.secondary }]} numberOfLines={2}>{value}</Text>
      </>
    );
    if (!onPress) return <View style={[styles.preferenceTile, { backgroundColor: p.surface, borderColor: p.border }]}>{body}</View>;
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.preferenceTile, { backgroundColor: p.surface, borderColor: p.border, opacity: pressed ? 0.65 : 1 }]}>
        {body}
      </Pressable>
    );
  }

  function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
    return (
      <View style={styles.section}>
        <Text style={[styles.groupTitle, { color: p.secondary }]}>{title}</Text>
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
          <OneIcon name={icon} size={15} color={tint} />
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
  return 'Auto';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 26, paddingBottom: 126, gap: 26 },
  heroCopy: { gap: 5 },
  heroTitle: { fontSize: 43, lineHeight: 47, fontFamily: 'Georgia', fontWeight: '400', letterSpacing: -1.35 },
  heroSubtitle: { maxWidth: 430, fontSize: 14.5, lineHeight: 20 },
  profileStage: { padding: 16 },
  profileTop: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, lineHeight: 21, fontWeight: '700', letterSpacing: 0.4 },
  profileCopy: { flex: 1, minWidth: 0 },
  profileTitle: { marginTop: 4, fontSize: 19, lineHeight: 23, fontWeight: '600', letterSpacing: -0.3 },
  profileEmail: { marginTop: 2, fontSize: 12.5, lineHeight: 16 },
  profileArrow: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  profileMetrics: { minHeight: 66, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  profileMetric: { flex: 1 },
  section: { gap: 9 },
  sectionHeading: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, lineHeight: 21, fontWeight: '600', letterSpacing: -0.2 },
  sectionMeta: { fontSize: 9.5, lineHeight: 12, fontWeight: '700', letterSpacing: 0.8 },
  preferenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  preferenceTile: { width: '48.6%', minHeight: 128, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  preferenceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preferenceIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  preferenceLabel: { marginTop: 16, fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  preferenceValue: { marginTop: 2, fontSize: 11.5, lineHeight: 15 },
  membershipRow: { minHeight: 102, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 13 },
  membershipIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  membershipCopy: { flex: 1, minWidth: 0 },
  membershipTitle: { marginTop: 2, fontSize: 18, lineHeight: 22, fontWeight: '600', letterSpacing: -0.28 },
  membershipValue: { marginTop: 2, fontSize: 12, lineHeight: 16 },
  manageRow: { minHeight: 48, paddingHorizontal: 15, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  manageText: { fontSize: 12.5, lineHeight: 16, fontWeight: '600' },
  groupTitle: { paddingHorizontal: 4, fontSize: 12.5, lineHeight: 16, fontWeight: '500' },
  row: { minHeight: 58, paddingLeft: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, minHeight: 58, paddingRight: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 15, lineHeight: 18, fontWeight: '500' },
  rowValue: { marginTop: 1, fontSize: 12, lineHeight: 15.5 },
  dangerRow: { minHeight: 58, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  footer: { textAlign: 'center', fontSize: 10.5, lineHeight: 14, paddingVertical: 8 }
});