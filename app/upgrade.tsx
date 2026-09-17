import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '@/src/context/PlanContext';
import { PrimaryButton, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { subscriptionProducts } from '@/src/subscription/products';

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL?.trim();

const baseFeatures = ['Capture, calendar & reminders', 'Saved & classical search', 'Share to NEVER', 'Scan to NEVER & OCR', 'Private cloud sync'];
const aiFeatures = ['Everything in NEVER', 'Ask NEVER', 'Meaning-based semantic recall', 'AI answers grounded in your memory', 'Cross-item document & receipt analysis'];

export default function UpgradeScreen() {
  const theme = useTheme();
  const { plan, isBetaAccess, billingConfigured, purchasing, purchase, restore } = usePlan();
  const hardPaywall = plan === 'none' && !isBetaAccess;

  async function openLegal(label: string, url?: string) {
    if (!url) {
      Alert.alert(`${label} unavailable`, 'This build does not have the release URL configured yet.');
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert(`${label} unavailable`, 'The configured URL could not be opened on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert(`${label} unavailable`, 'The configured URL could not be opened on this device.');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          {hardPaywall ? (
            <View style={{ width: 40 }} />
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close plans"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.navButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
            >
              <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
            </Pressable>
          )}
          <Text style={[styles.navTitle, { color: theme.text }]}>NEVER Plans</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <View style={[styles.heroMark, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
            <OneIcon name={icons.crown} size={24} color={theme.chrome} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Simple plans. No clutter.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Organization stays affordable. AI is optional.</Text>
        </View>

        <PlanCard
          name="NEVER"
          price={formatEUR(subscriptionProducts.oneMonthly.priceEUR)}
          period="/ month"
          offer="7-day free trial for eligible new subscribers · then €2.99/month"
          features={baseFeatures}
          planKey="one"
          current={plan === 'one'}
        />

        <PlanCard
          name="NEVER AI"
          price={formatEUR(subscriptionProducts.oneAiMonthly.priceEUR)}
          period="/ month"
          offer="No trial · billed immediately"
          features={aiFeatures}
          planKey="one_ai"
          highlighted
          current={plan === 'one_ai'}
        />

        {isBetaAccess ? (
          <View style={[styles.beta, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
            <OneIcon name={icons.ask} size={18} color={theme.chrome} />
            <Text style={[styles.betaText, { color: theme.textSecondary }]}>NEVER AI is enabled during beta so Ask NEVER and semantic recall can be tested end-to-end. App Store purchases are not active yet.</Text>
          </View>
        ) : !billingConfigured ? (
          <View style={[styles.beta, { backgroundColor: theme.fill, borderColor: theme.border }]}>
            <OneIcon name={icons.more} size={18} color={theme.warning} />
            <Text style={[styles.betaText, { color: theme.textSecondary }]}>App Store billing is unavailable in this release build. Paid access is not unlocked. Configure RevenueCat before distribution.</Text>
          </View>
        ) : null}

        {billingConfigured ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Restore App Store purchases"
            disabled={purchasing}
            onPress={async () => {
              const outcome = await restore();
              if (!outcome.ok && outcome.error) Alert.alert('Restore purchases', outcome.error);
              else if (outcome.ok) Alert.alert('Restore purchases', 'Your App Store purchases are synced with NEVER.');
            }}
            style={styles.restore}
          >
            {purchasing ? <ActivityIndicator size="small" /> : null}
            <Text style={[styles.restoreText, { color: theme.chrome }]}>Restore purchases</Text>
          </Pressable>
        ) : null}

        {!hardPaywall ? <PrimaryButton label="Back to NEVER" icon={icons.check} onPress={() => router.back()} /> : null}

        <Text style={[styles.legal, { color: theme.textTertiary }]}>
          {isBetaAccess
            ? 'Beta billing is disabled. NEVER AI remains unlocked for development testing.'
            : 'Subscriptions renew automatically unless cancelled. NEVER’s introductory free trial is available only to eligible App Store accounts. NEVER AI has no free trial.'}
        </Text>

        <View style={styles.legalLinks}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open NEVER Terms of Use"
            onPress={() => void openLegal('Terms of Use', TERMS_URL)}
            hitSlop={8}
          >
            <Text style={[styles.legalLink, { color: TERMS_URL ? theme.chrome : theme.textTertiary }]}>Terms of Use</Text>
          </Pressable>
          <Text style={[styles.legalDivider, { color: theme.textTertiary }]}>·</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Open NEVER Privacy Policy"
            onPress={() => void openLegal('Privacy Policy', PRIVACY_POLICY_URL)}
            hitSlop={8}
          >
            <Text style={[styles.legalLink, { color: PRIVACY_POLICY_URL ? theme.chrome : theme.textTertiary }]}>Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function PlanCard({
    name,
    price,
    period,
    offer,
    features,
    planKey,
    highlighted = false,
    current = false
  }: {
    name: string;
    price: string;
    period: string;
    offer: string;
    features: string[];
    planKey: 'one' | 'one_ai';
    highlighted?: boolean;
    current?: boolean;
  }) {
    return (
      <View style={[styles.planWrap, { borderColor: highlighted ? theme.chrome : 'transparent' }]}>
        <Surface padded>
          <View style={styles.planTop}>
            <View>
              <View style={styles.nameRow}>
                <Text style={[styles.planName, { color: theme.text }]}>{name}</Text>
                {current ? (
                  <View style={[styles.currentPill, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                    <Text style={[styles.currentText, { color: theme.chrome }]}>{isBetaAccess ? 'CURRENT BETA' : 'CURRENT'}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: theme.text }]}>{price}</Text>
                <Text style={[styles.period, { color: theme.textSecondary }]}>{period}</Text>
              </View>
              <Text style={[styles.offer, { color: highlighted ? theme.textSecondary : theme.chrome }]}>{offer}</Text>
            </View>
          </View>

          <View style={[styles.featureList, { borderTopColor: theme.border }]}>
            {features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <OneIcon name={icons.check} size={14} color={highlighted ? theme.chrome : theme.success} />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {!current ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={purchaseLabel(planKey, plan)}
              disabled={!billingConfigured || purchasing}
              onPress={async () => {
                const outcome = await purchase(planKey);
                if (!outcome.ok && !outcome.cancelled && outcome.error) Alert.alert('NEVER subscription', outcome.error);
              }}
              style={[
                styles.purchaseButton,
                {
                  backgroundColor: billingConfigured ? highlighted ? theme.accent : theme.text : theme.fillStrong,
                  borderColor: billingConfigured ? highlighted ? theme.accent : theme.text : theme.border,
                  opacity: purchasing ? 0.62 : 1
                }
              ]}
            >
              {purchasing ? <ActivityIndicator size="small" color={billingConfigured ? theme.onAccent : theme.textTertiary} /> : null}
              <Text style={[styles.purchaseButtonText, { color: billingConfigured ? theme.onAccent : theme.textTertiary }]}>
                {billingConfigured ? purchaseLabel(planKey, plan) : isBetaAccess ? 'Available at launch' : 'Unavailable'}
              </Text>
            </Pressable>
          ) : null}
        </Surface>
      </View>
    );
  }
}

function purchaseLabel(nextPlan: 'one' | 'one_ai', currentPlan: 'none' | 'one' | 'one_ai') {
  if (nextPlan === 'one') return currentPlan === 'one_ai' ? 'Switch to NEVER' : 'Get NEVER';
  return currentPlan === 'one' ? 'Upgrade to NEVER AI' : 'Get NEVER AI';
}

function formatEUR(value: number) {
  return '€' + value.toFixed(2);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 42,
    gap: 17
  },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.15 },
  hero: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  heroMark: { width: 56, height: 56, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 15, fontSize: 27.5, lineHeight: 33, fontWeight: '700', letterSpacing: -0.85, textAlign: 'center' },
  subtitle: { marginTop: 9, fontSize: 13.25, lineHeight: 19, textAlign: 'center' },
  planWrap: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  planTop: { gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 19, fontWeight: '700', letterSpacing: -0.35 },
  currentPill: { minHeight: 24, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  currentText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.65 },
  priceRow: { marginTop: 8, flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontSize: 29, fontWeight: '700', letterSpacing: -0.9 },
  period: { fontSize: 12.25 },
  offer: { marginTop: 6, fontSize: 11.75, fontWeight: '700' },
  featureList: { marginTop: 17, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  featureText: { flex: 1, fontSize: 12.75, lineHeight: 18 },
  purchaseButton: { marginTop: 17, minHeight: 50, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  purchaseButtonText: { fontSize: 13.25, fontWeight: '700' },
  restore: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  restoreText: { fontSize: 12.75, fontWeight: '700' },
  beta: { minHeight: 72, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  betaText: { flex: 1, fontSize: 11.75, lineHeight: 17 },
  legal: { textAlign: 'center', fontSize: 10.25, lineHeight: 15 },
  legalLinks: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  legalLink: { fontSize: 11.5, fontWeight: '700' },
  legalDivider: { fontSize: 11.5 }
});
