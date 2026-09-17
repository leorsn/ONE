import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '@/src/context/PlanContext';
import { PrimaryButton, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { subscriptionProducts } from '@/src/subscription/products';
import type { RevenueCatIntroOffer } from '@/src/subscription/revenueCat';

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL?.trim();

const baseFeatures = ['Capture, calendar & reminders', 'Saved & classical search', 'Share to NEVER', 'Scan to NEVER & OCR', 'Private cloud sync'];
const aiFeatures = ['Everything in NEVER', 'Ask NEVER', 'Meaning-based semantic recall', 'AI answers grounded in your memory', 'Cross-item document & receipt analysis'];

type PurchasePlan = 'one' | 'one_ai';

export default function UpgradeScreen() {
  const theme = useTheme();
  const { plan, isBetaAccess, billingConfigured, localizedPrices, introOffers, purchasing, purchase, restore } = usePlan();
  const [purchasingPlan, setPurchasingPlan] = useState<PurchasePlan | null>(null);
  const hardPaywall = plan === 'none' && !isBetaAccess;
  const neverPrice = storefrontPrice(localizedPrices.one, billingConfigured, subscriptionProducts.oneMonthly.priceEUR);
  const neverAiPrice = storefrontPrice(localizedPrices.one_ai, billingConfigured, subscriptionProducts.oneAiMonthly.priceEUR);
  const neverOffer = storefrontOffer(
    introOffers.one,
    localizedPrices.one,
    billingConfigured,
    `Planned pricing · ${formatEUR(subscriptionProducts.oneMonthly.priceEUR)}/month`
  );
  const neverAiOffer = storefrontOffer(
    introOffers.one_ai,
    localizedPrices.one_ai,
    billingConfigured,
    `Planned pricing · ${formatEUR(subscriptionProducts.oneAiMonthly.priceEUR)}/month`
  );

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
          {hardPaywall ? <View style={{ width: 40 }} /> : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close plans"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
            >
              <OneIcon name={icons.chevronLeft} size={17} color={theme.text} />
            </Pressable>
          )}
          <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.chrome }]}>MEMBERSHIP</Text>
          <Text style={[styles.title, { color: theme.text }]}>Choose how much memory you need.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>NEVER keeps organization simple. NEVER AI adds grounded recall across what you save.</Text>
        </View>

        <PlanCard
          eyebrow="ORGANIZE"
          name="NEVER"
          descriptor="Capture, organize and find what matters."
          price={neverPrice}
          period={localizedPrices.one || !billingConfigured ? '/ month' : ''}
          offer={neverOffer}
          features={baseFeatures}
          planKey="one"
          current={plan === 'one'}
        />

        <PlanCard
          eyebrow="RECALL"
          name="NEVER AI"
          descriptor="Ask questions across your private saved memory."
          price={neverAiPrice}
          period={localizedPrices.one_ai || !billingConfigured ? '/ month' : ''}
          offer={neverAiOffer}
          features={aiFeatures}
          planKey="one_ai"
          current={plan === 'one_ai'}
        />

        {isBetaAccess ? (
          <View style={[styles.notice, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
            <OneIcon name={icons.ask} size={16} color={theme.chrome} />
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>NEVER AI is available during beta so grounded recall can be tested before App Store billing is enabled.</Text>
          </View>
        ) : !billingConfigured ? (
          <View style={[styles.notice, { backgroundColor: theme.fill, borderColor: theme.border }]}>
            <OneIcon name={icons.more} size={16} color={theme.warning} />
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
              {__DEV__ ? 'Purchases are unavailable. Development: RevenueCat is not configured.' : 'Purchases are temporarily unavailable. Please try again later.'}
            </Text>
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
            style={({ pressed }) => [styles.restore, { opacity: pressed || purchasing ? 0.58 : 1 }]}
          >
            {purchasing && !purchasingPlan ? <ActivityIndicator size="small" /> : null}
            <Text style={[styles.restoreText, { color: theme.textSecondary }]}>Restore purchases</Text>
          </Pressable>
        ) : null}

        {!hardPaywall ? <PrimaryButton label="Back to NEVER" icon={icons.check} onPress={() => router.back()} /> : null}

        <Text style={[styles.legal, { color: theme.textTertiary }]}>
          {isBetaAccess
            ? 'Beta billing is disabled. NEVER AI remains unlocked for development testing.'
            : 'Subscriptions renew automatically unless cancelled. Prices and introductory offers shown above come from the current App Store storefront when available. Apple determines introductory-offer eligibility at purchase time.'}
        </Text>

        <View style={styles.legalLinks}>
          <Pressable accessibilityRole="link" accessibilityLabel="Open NEVER Terms of Use" onPress={() => void openLegal('Terms of Use', TERMS_URL)} hitSlop={8}>
            <Text style={[styles.legalLink, { color: TERMS_URL ? theme.chrome : theme.textTertiary }]}>Terms of Use</Text>
          </Pressable>
          <Text style={[styles.legalDivider, { color: theme.textTertiary }]}>·</Text>
          <Pressable accessibilityRole="link" accessibilityLabel="Open NEVER Privacy Policy" onPress={() => void openLegal('Privacy Policy', PRIVACY_POLICY_URL)} hitSlop={8}>
            <Text style={[styles.legalLink, { color: PRIVACY_POLICY_URL ? theme.chrome : theme.textTertiary }]}>Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function PlanCard({
    eyebrow,
    name,
    descriptor,
    price,
    period,
    offer,
    features,
    planKey,
    current = false
  }: {
    eyebrow: string;
    name: string;
    descriptor: string;
    price: string;
    period: string;
    offer: string;
    features: string[];
    planKey: PurchasePlan;
    current?: boolean;
  }) {
    const availableInStorefront = Boolean(localizedPrices[planKey]);
    const purchaseReady = billingConfigured && availableInStorefront;
    const canPurchase = purchaseReady && !purchasing;
    const isThisPlanPurchasing = purchasing && purchasingPlan === planKey;

    return (
      <View style={[styles.planWrap, { borderColor: theme.border, shadowColor: theme.shadow }]}>
        <Surface padded>
          <View style={styles.planTop}>
            <View style={styles.planHeadingRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planEyebrow, { color: theme.textTertiary }]}>{eyebrow}</Text>
                <Text style={[styles.planName, { color: theme.text }]}>{name}</Text>
              </View>
              {current ? (
                <View style={[styles.currentPill, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                  <Text style={[styles.currentText, { color: theme.chrome }]}>{isBetaAccess ? 'CURRENT BETA' : 'CURRENT'}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.descriptor, { color: theme.textSecondary }]}>{descriptor}</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: theme.text }]}>{price}</Text>
              {period ? <Text style={[styles.period, { color: theme.textTertiary }]}>{period}</Text> : null}
            </View>
            <Text style={[styles.offer, { color: theme.textTertiary }]}>{offer}</Text>
          </View>

          <View style={[styles.featureList, { borderTopColor: theme.border }]}>
            {features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <OneIcon name={icons.check} size={13} color={theme.chrome} />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {!current ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={availableInStorefront ? purchaseLabel(planKey, plan) : `${name} is unavailable in the current App Store offering`}
              disabled={!canPurchase}
              onPress={async () => {
                setPurchasingPlan(planKey);
                try {
                  const outcome = await purchase(planKey);
                  if (!outcome.ok && !outcome.cancelled && outcome.error) Alert.alert('NEVER subscription', outcome.error);
                } finally {
                  setPurchasingPlan(null);
                }
              }}
              style={[
                styles.purchaseButton,
                {
                  backgroundColor: purchaseReady ? theme.accent : theme.fillStrong,
                  borderColor: purchaseReady ? theme.accent : theme.border,
                  opacity: purchasing ? 0.62 : 1
                }
              ]}
            >
              {isThisPlanPurchasing ? <ActivityIndicator size="small" color={theme.onAccent} /> : null}
              <Text style={[styles.purchaseButtonText, { color: purchaseReady ? theme.onAccent : theme.textTertiary }]}>
                {purchaseReady
                  ? purchaseLabel(planKey, plan)
                  : !billingConfigured && isBetaAccess
                    ? 'Available at launch'
                    : billingConfigured
                      ? 'Unavailable in App Store'
                      : 'Unavailable'}
              </Text>
            </Pressable>
          ) : null}
        </Surface>
      </View>
    );
  }
}

function purchaseLabel(nextPlan: PurchasePlan, currentPlan: 'none' | 'one' | 'one_ai') {
  if (nextPlan === 'one') return currentPlan === 'one_ai' ? 'Switch to NEVER' : 'Get NEVER';
  return currentPlan === 'one' ? 'Upgrade to NEVER AI' : 'Get NEVER AI';
}

function storefrontPrice(localized: string | undefined, billingConfigured: boolean, fallbackEUR: number) {
  if (localized) return localized;
  if (billingConfigured) return 'App Store price';
  return formatEUR(fallbackEUR);
}

function storefrontOffer(
  introOffer: RevenueCatIntroOffer | undefined,
  localizedPrice: string | undefined,
  billingConfigured: boolean,
  developmentFallback: string
) {
  if (!billingConfigured) return developmentFallback;
  if (!localizedPrice) return 'Unavailable in the current App Store offering';
  if (!introOffer) return `Monthly subscription · ${localizedPrice}/month`;
  if (introOffer.price === 0) {
    return `Free introductory offer for eligible new subscribers · then ${localizedPrice}/month`;
  }
  return `Introductory offer ${introOffer.priceString} for eligible new subscribers · then ${localizedPrice}/month`;
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
    gap: 18
  },
  nav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 11, fontWeight: '600', letterSpacing: 3.2 },
  hero: { paddingTop: 22, paddingBottom: 12 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.1 },
  title: { marginTop: 11, maxWidth: 520, fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  subtitle: { marginTop: 9, maxWidth: 500, fontSize: 13, lineHeight: 19.5 },
  planWrap: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.025,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  planTop: { gap: 0 },
  planHeadingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  planEyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.5 },
  planName: { marginTop: 5, fontSize: 19, lineHeight: 23, fontWeight: '600', letterSpacing: -0.35 },
  descriptor: { marginTop: 7, maxWidth: 440, fontSize: 11.75, lineHeight: 17 },
  currentPill: { minHeight: 24, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  currentText: { fontSize: 8.5, fontWeight: '700', letterSpacing: 0.7 },
  priceRow: { marginTop: 18, flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  price: { fontSize: 28, lineHeight: 34, fontWeight: '600', letterSpacing: -0.9 },
  period: { fontSize: 11.5 },
  offer: { marginTop: 5, fontSize: 10.75, lineHeight: 15 },
  featureList: { marginTop: 17, paddingTop: 15, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  featureText: { flex: 1, fontSize: 12.25, lineHeight: 17.5 },
  purchaseButton: { marginTop: 18, minHeight: 50, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  purchaseButtonText: { fontSize: 13, fontWeight: '600' },
  restore: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  restoreText: { fontSize: 12, fontWeight: '600' },
  notice: { minHeight: 66, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeText: { flex: 1, fontSize: 11.25, lineHeight: 16 },
  legal: { textAlign: 'center', fontSize: 10, lineHeight: 15 },
  legalLinks: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  legalLink: { fontSize: 11, fontWeight: '600' },
  legalDivider: { fontSize: 11 }
});