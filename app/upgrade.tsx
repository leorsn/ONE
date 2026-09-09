import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlan } from '@/src/context/PlanContext';
import { IconTile, PrimaryButton, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { subscriptionProducts } from '@/src/subscription/products';

const baseFeatures = ['Capture, calendar & reminders', 'Saved & classical search', 'Share to ONE', 'Scan to ONE & OCR', 'Private cloud sync'];
const aiFeatures = ['Everything in ONE', 'Ask ONE', 'Meaning-based semantic recall', 'AI answers grounded in your memory', 'Cross-item document & receipt analysis'];

export default function UpgradeScreen() {
  const theme = useTheme();
  const { plan, isBetaAccess } = usePlan();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>ONE Plans</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <IconTile icon={icons.crown} size={56} />
          <Text style={[styles.title, { color: theme.text }]}>Simple plans. No clutter.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Organization stays affordable. AI is optional.
          </Text>
        </View>

        <PlanCard
          name="ONE"
          price="€2.99"
          period="/ month"
          offer="7 days free, then €2.99/month"
          features={baseFeatures}
          current={plan === 'one'}
        />

        <PlanCard
          name="ONE AI"
          price="€4.99"
          period="/ month"
          offer="No trial · billed immediately"
          features={aiFeatures}
          highlighted
          current={plan === 'one_ai'}
        />

        {isBetaAccess ? (
          <View style={[styles.beta, { backgroundColor: theme.accentSoft }]}>
            <OneIcon name={icons.ask} size={18} color={theme.accent} />
            <Text style={[styles.betaText, { color: theme.textSecondary }]}>
              ONE AI is enabled during beta so Ask ONE and semantic recall can be tested end-to-end. App Store purchases are not active yet.
            </Text>
          </View>
        ) : null}

        <PrimaryButton label="Back to ONE" icon={icons.check} onPress={() => router.back()} />

        <Text style={[styles.legal, { color: theme.textTertiary }]}>
          ONE includes a 7-day introductory free trial for eligible new subscribers and then renews automatically at €2.99/month unless cancelled. ONE AI has no trial and renews at €4.99/month. App Store billing is not active during beta.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );

  function PlanCard({
    name,
    price,
    period,
    offer,
    features,
    highlighted = false,
    current = false
  }: {
    name: string;
    price: string;
    period: string;
    offer: string;
    features: string[];
    highlighted?: boolean;
    current?: boolean;
  }) {
    return (
      <View style={[styles.planWrap, highlighted && { borderColor: theme.accent }]}>
        <Surface padded>
          <View style={styles.planTop}>
            <View>
              <View style={styles.nameRow}>
                <Text style={[styles.planName, { color: theme.text }]}>{name}</Text>
                {current ? (
                  <View style={[styles.currentPill, { backgroundColor: theme.accentSoft }]}>
                    <Text style={[styles.currentText, { color: theme.accent }]}>CURRENT BETA</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.price, { color: theme.text }]}>{price}</Text>
                <Text style={[styles.period, { color: theme.textSecondary }]}>{period}</Text>
              </View>
              <Text style={[styles.offer, { color: highlighted ? theme.textSecondary : theme.accent }]}>{offer}</Text>
            </View>
          </View>
          <View style={[styles.featureList, { borderTopColor: theme.border }]}>
            {features.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <OneIcon name={icons.check} size={14} color={highlighted ? theme.accent : theme.success} />
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>{feature}</Text>
              </View>
            ))}
          </View>
        </Surface>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 16 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  hero: { alignItems: 'center', paddingTop: 8, paddingBottom: 4 },
  title: { marginTop: 14, fontSize: 28, lineHeight: 33, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { marginTop: 8, fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  planWrap: { borderRadius: 24, borderWidth: 1, borderColor: 'transparent' },
  planTop: { gap: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  currentPill: { minHeight: 24, borderRadius: 9, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  currentText: { fontSize: 9.5, fontWeight: '900', letterSpacing: 0.5 },
  priceRow: { marginTop: 7, flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  price: { fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  period: { fontSize: 12.5 },
  offer: { marginTop: 6, fontSize: 12, fontWeight: '700' },
  featureList: { marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  featureText: { flex: 1, fontSize: 13, lineHeight: 18 },
  beta: { minHeight: 72, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  betaText: { flex: 1, fontSize: 12, lineHeight: 17 },
  legal: { textAlign: 'center', fontSize: 10.5, lineHeight: 15 }
});
