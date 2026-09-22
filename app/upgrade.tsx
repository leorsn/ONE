import { goBackOrHome } from '@/src/ui/navigation';
import { neverType } from '@/src/theme/tokens';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { usePlan } from '@/src/context/PlanContext';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Group, V5IconButton, V5LargeHeader, useNeverV5Palette } from '@/src/ui/appleV5';
import { subscriptionProducts } from '@/src/subscription/products';
import type { RevenueCatIntroOffer } from '@/src/subscription/revenueCat';

const PRIVACY_POLICY_URL = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL?.trim();

const baseFeatures = ['Capture, calendar & reminders', 'Saved & classical search', 'Share to NEVER', 'Scan to NEVER & OCR', 'Private cloud sync'];
const aiFeatures = ['Everything in NEVER', 'Ask NEVER', 'Meaning-based semantic recall', 'AI answers grounded in your memory', 'Cross-item document & receipt analysis'];

type PurchasePlan = 'one' | 'one_ai';

export default function UpgradeScreen() {
  const p = useNeverV5Palette();
  const { plan, isBetaAccess, billingConfigured, localizedPrices, introOffers, purchasing, purchase, restore } = usePlan();
  const [purchasingPlan, setPurchasingPlan] = useState<PurchasePlan | null>(null);
  const hardPaywall = plan === 'none' && !isBetaAccess;
  const neverPrice = storefrontPrice(localizedPrices.one, billingConfigured, subscriptionProducts.oneMonthly.priceEUR);
  const neverAiPrice = storefrontPrice(localizedPrices.one_ai, billingConfigured, subscriptionProducts.oneAiMonthly.priceEUR);
  const neverOffer = storefrontOffer(introOffers.one, localizedPrices.one, billingConfigured, `Planned pricing · ${formatEUR(subscriptionProducts.oneMonthly.priceEUR)}/month`);
  const neverAiOffer = storefrontOffer(introOffers.one_ai, localizedPrices.one_ai, billingConfigured, `Planned pricing · ${formatEUR(subscriptionProducts.oneAiMonthly.priceEUR)}/month`);

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
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.content, p.pageStyle]} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          {hardPaywall ? <View style={{ width: 44 }} /> : <V5IconButton icon={icons.chevronLeft} accessibilityLabel="Close plans" onPress={() => goBackOrHome()} />}
          <Text style={[styles.navTitle, { color: p.label }]}>Membership</Text>
          <View style={{ width: 44 }} />
        </View>

        <V5LargeHeader title="Choose your NEVER." subtitle="Organize everything with NEVER. Add grounded memory recall with NEVER AI." />

        <PlanCard
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
          name="NEVER AI"
          descriptor="Ask questions across your private saved memory."
          price={neverAiPrice}
          period={localizedPrices.one_ai || !billingConfigured ? '/ month' : ''}
          offer={neverAiOffer}
          features={aiFeatures}
          planKey="one_ai"
          current={plan === 'one_ai'}
          featured
        />

        {isBetaAccess ? (
          <View style={[styles.notice, { backgroundColor: p.fillSoft }]}>
            <OneIcon name={icons.ask} size={15} color={p.chrome} />
            <Text style={[styles.noticeText, { color: p.secondary }]}>NEVER AI is unlocked during beta so grounded recall can be tested before App Store billing is enabled.</Text>
          </View>
        ) : !billingConfigured ? (
          <View style={[styles.notice, { backgroundColor: p.fillSoft }]}>
            <OneIcon name={icons.more} size={15} color={p.warning} />
            <Text style={[styles.noticeText, { color: p.secondary }]}>{__DEV__ ? 'Purchases are unavailable. RevenueCat is not configured in this development build.' : 'Purchases are temporarily unavailable. Please try again later.'}</Text>
          </View>
        ) : null}

        {billingConfigured ? (
          <Pressable accessibilityRole="button"
            disabled={purchasing}
            onPress={async () => {
              const outcome = await restore();
              if (!outcome.ok && outcome.error) Alert.alert('Restore purchases', outcome.error);
              else if (outcome.ok) Alert.alert('Restore purchases', 'Your App Store purchases are synced with NEVER.');
            }}
            style={({ pressed }) => [styles.restore, { opacity: pressed || purchasing ? 0.58 : 1 }]}
          >
            {purchasing && !purchasingPlan ? <ActivityIndicator size="small" /> : null}
            <Text style={[styles.restoreText, { color: p.chrome }]}>Restore Purchases</Text>
          </Pressable>
        ) : null}

        {!hardPaywall ? (
          <Pressable accessibilityRole="button" onPress={() => goBackOrHome()} style={({ pressed }) => [styles.backButton, { backgroundColor: p.fill, opacity: pressed ? 0.65 : 1 }]}>
            <Text style={[styles.backButtonText, { color: p.label }]}>Back to NEVER</Text>
          </Pressable>
        ) : null}

        <Text style={[styles.legal, { color: p.tertiary }]}>
          {isBetaAccess
            ? 'Beta billing is disabled. NEVER AI remains unlocked for development testing.'
            : 'Subscriptions renew automatically unless cancelled. Prices and introductory offers shown above come from the current App Store storefront when available. Apple determines introductory-offer eligibility at purchase time.'}
        </Text>

        <View style={styles.legalLinks}>
          <Pressable accessibilityRole="button" onPress={() => void openLegal('Terms of Use', TERMS_URL)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[styles.legalLink, { color: TERMS_URL ? p.chrome : p.tertiary }]}>Terms of Use</Text></Pressable>
          <Text style={[styles.legalDivider, { color: p.tertiary }]}>·</Text>
          <Pressable accessibilityRole="button" onPress={() => void openLegal('Privacy Policy', PRIVACY_POLICY_URL)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[styles.legalLink, { color: PRIVACY_POLICY_URL ? p.chrome : p.tertiary }]}>Privacy Policy</Text></Pressable>
        </View>
      </ScrollView>
    </NeverScreen>
  );

  function PlanCard({ name, descriptor, price, period, offer, features, planKey, current = false, featured = false }: {
    name: string;
    descriptor: string;
    price: string;
    period: string;
    offer: string;
    features: string[];
    planKey: PurchasePlan;
    current?: boolean;
    featured?: boolean;
  }) {
    const availableInStorefront = Boolean(localizedPrices[planKey]);
    const purchaseReady = billingConfigured && availableInStorefront;
    const canPurchase = purchaseReady && !purchasing;
    const isThisPlanPurchasing = purchasing && purchasingPlan === planKey;

    return (
      <View style={styles.planSection}>
        <V5Group style={styles.planCard}>
          <View style={styles.planTop}>
            <View style={styles.planNameRow}>
              <View style={[styles.planIcon, { backgroundColor: featured ? p.graphite : p.fillSoft }]}>
                <OneIcon name={featured ? icons.ask : icons.saved} size={17} color={featured ? (p.onAccent) : p.chrome} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planName, { color: p.label }]}>{name}</Text>
                <Text style={[styles.descriptor, { color: p.secondary }]}>{descriptor}</Text>
              </View>
              {current ? <Text style={[styles.currentText, { color: p.chrome }]}>{isBetaAccess ? 'BETA' : 'CURRENT'}</Text> : null}
            </View>

            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: p.label }]}>{price}</Text>
              {period ? <Text style={[styles.period, { color: p.tertiary }]}>{period}</Text> : null}
            </View>
            <Text style={[styles.offer, { color: p.tertiary }]}>{offer}</Text>
          </View>

          <View style={[styles.featureList, { borderTopColor: p.separator }]}>
            {features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <View style={[styles.checkCircle, { backgroundColor: p.fillSoft }]}><OneIcon name={icons.check} size={10.5} color={p.chrome} /></View>
                <Text style={[styles.featureText, { color: p.secondary }]}>{feature}</Text>
              </View>
            ))}
          </View>

          {!current ? (
            <Pressable accessibilityRole="button"
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
              style={({ pressed }) => [
                styles.purchaseButton,
                {
                  backgroundColor: purchaseReady ? p.graphite : p.fill,
                  opacity: !canPurchase ? 0.52 : pressed ? 0.72 : 1
                }
              ]}
            >
              {isThisPlanPurchasing ? <ActivityIndicator size="small" color={p.onAccent} /> : null}
              <Text style={[styles.purchaseButtonText, { color: purchaseReady ? (p.onAccent) : p.tertiary }]}>
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
        </V5Group>
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
function storefrontOffer(introOffer: RevenueCatIntroOffer | undefined, localizedPrice: string | undefined, billingConfigured: boolean, developmentFallback: string) {
  if (!billingConfigured) return developmentFallback;
  if (!localizedPrice) return 'Unavailable in the current App Store offering';
  if (!introOffer) return `Monthly subscription · ${localizedPrice}/month`;
  if (introOffer.price === 0) return `Free introductory offer for eligible new subscribers · then ${localizedPrice}/month`;
  return `Introductory offer ${introOffer.priceString} for eligible new subscribers · then ${localizedPrice}/month`;
}
function formatEUR(value: number) { return '€' + value.toFixed(2); }

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 660, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36, gap: 16 },
  nav: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navTitle: { fontSize: 16.5, lineHeight: 20, fontWeight: '600', letterSpacing: -0.18 },
  planSection: { gap: 6 },
  planCard: { padding: 15 },
  planTop: { gap: 0 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  planIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planName: { fontSize: 18, lineHeight: 22, fontWeight: '700', letterSpacing: -0.25 },
  descriptor: { marginTop: 2, maxWidth: 420, ...neverType.caption },
  currentText: { fontSize: 9, lineHeight: 12, fontWeight: '700', letterSpacing: 0.6 },
  priceRow: { marginTop: 17, flexWrap: 'wrap', flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  price: { fontSize: 27, lineHeight: 32, fontWeight: '700', letterSpacing: -0.8 },
  period: { ...neverType.caption },
  offer: { marginTop: 4, ...neverType.caption },
  featureList: { marginTop: 15, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, gap: 9 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkCircle: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, ...neverType.caption },
  purchaseButton: { marginTop: 16, minHeight: 52, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  purchaseButtonText: { flexShrink: 1, textAlign: 'center', fontSize: 14, lineHeight: 18, fontWeight: '600' },
  notice: { minHeight: 58, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  noticeText: { flex: 1, ...neverType.caption },
  restore: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  restoreText: { fontSize: 12.5, lineHeight: 16, fontWeight: '600' },
  backButton: { minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 13.5, lineHeight: 17, fontWeight: '600' },
  legal: { textAlign: 'center', ...neverType.caption },
  legalLinks: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  legalLink: { ...neverType.caption, fontWeight: '600' },
  legalDivider: { fontSize: 10.5 }
});
