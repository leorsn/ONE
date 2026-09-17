import { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { PrimaryButton } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const slides = [
  {
    icon: icons.inbox,
    eyebrow: 'CAPTURE',
    title: 'Get it out of your head.',
    body: 'Tasks, appointments, links and ideas. Type naturally and NEVER organizes the details for you.'
  },
  {
    icon: icons.upload,
    eyebrow: 'SHARE',
    title: 'Send anything to NEVER.',
    body: 'Share links, text and screenshots from other apps. NEVER keeps the content together with the context that matters.'
  },
  {
    icon: icons.ask,
    eyebrow: 'RECALL',
    title: 'Remember by asking.',
    body: 'You do not need to remember where something was saved. Ask NEVER and search your personal memory by meaning.'
  }
] as const;

type Slide = (typeof slides)[number];

export default function OnboardingScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { configured, session } = useAuth();
  const { complete } = useOnboarding();
  const scrollRef = useRef<ScrollView>(null);
  const previousWidthRef = useRef(width);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (previousWidthRef.current === width) return;
    previousWidthRef.current = width;
    scrollRef.current?.scrollTo({ x: width * index, animated: false });
  }, [width, index]);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== index && next >= 0 && next < slides.length) setIndex(next);
  }

  async function finish() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await complete();
    router.replace(configured && !session ? '/auth/sign-in' : '/(tabs)');
  }

  async function next() {
    await Haptics.selectionAsync();
    if (index === slides.length - 1) {
      await finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <Text style={[styles.brand, { color: theme.text }]}>NEVER</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Skip introduction" onPress={finish} hitSlop={10}>
          <Text style={[styles.skip, { color: theme.textSecondary }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {slides.map((slide) => (
          <View key={slide.eyebrow} style={[styles.slide, { width }]}>
            <View style={styles.slideContent}>
              <ProductVignette slide={slide} />

              <View style={styles.copy}>
                <Text style={[styles.eyebrow, { color: theme.chrome }]}>{slide.eyebrow}</Text>
                <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
                <Text style={[styles.body, { color: theme.textSecondary }]}>{slide.body}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {slides.map((slide, dotIndex) => (
            <View
              key={slide.eyebrow}
              style={[
                styles.dot,
                {
                  width: dotIndex === index ? 22 : 7,
                  backgroundColor: dotIndex === index ? theme.chrome : theme.fillStrong
                }
              ]}
            />
          ))}
        </View>

        <PrimaryButton
          label={index === slides.length - 1 ? 'Continue to NEVER' : 'Continue'}
          icon={index === slides.length - 1 ? icons.check : icons.chevron}
          onPress={next}
        />

        <Text style={[styles.privacy, { color: theme.textTertiary }]}>Private by default. Your memory belongs to you.</Text>
      </View>
    </SafeAreaView>
  );

  function ProductVignette({ slide }: { slide: Slide }) {
    return (
      <View style={[styles.visual, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
        <View style={styles.visualHeader}>
          <Text style={[styles.visualWordmark, { color: theme.text }]}>NEVER</Text>
          <Text style={[styles.visualMeta, { color: theme.textTertiary }]}>{slide.eyebrow}</Text>
        </View>

        {slide.eyebrow === 'CAPTURE' ? (
          <View style={styles.vignetteBody}>
            <View style={[styles.captureField, { backgroundColor: theme.fill, borderColor: theme.border }]}>
              <View style={[styles.smallIcon, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                <OneIcon name={icons.plus} size={15} color={theme.chrome} />
              </View>
              <Text style={[styles.captureText, { color: theme.text }]}>Dinner Friday at 8 in London</Text>
            </View>
            <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.resultTop}>
                <OneIcon name={icons.check} size={14} color={theme.success} />
                <Text style={[styles.resultEyebrow, { color: theme.textTertiary }]}>ORGANIZED</Text>
              </View>
              <Text style={[styles.resultTitle, { color: theme.text }]}>Dinner in London</Text>
              <View style={styles.detailRow}>
                <Detail icon={icons.calendar} text="Friday" />
                <Detail icon={icons.reminder} text="20:00" />
              </View>
            </View>
          </View>
        ) : null}

        {slide.eyebrow === 'SHARE' ? (
          <View style={styles.vignetteBody}>
            <View style={[styles.sharedCard, { backgroundColor: theme.fill, borderColor: theme.border }]}>
              <View style={[styles.sharedPreview, { backgroundColor: theme.fillStrong }]}>
                <OneIcon name={icons.screenshot} size={24} color={theme.chrome} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sharedLabel, { color: theme.textTertiary }]}>SHARED TO NEVER</Text>
                <Text style={[styles.sharedTitle, { color: theme.text }]}>Flight confirmation</Text>
                <Text style={[styles.sharedMeta, { color: theme.textSecondary }]}>Screenshot · Travel</Text>
              </View>
            </View>
            <View style={[styles.contextLine, { borderColor: theme.border }]}>
              <OneIcon name={icons.travel} size={15} color={theme.chrome} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.contextTitle, { color: theme.text }]}>London → Hamburg</Text>
                <Text style={[styles.contextMeta, { color: theme.textSecondary }]}>23 Sep · 18:45 · BA</Text>
              </View>
            </View>
          </View>
        ) : null}

        {slide.eyebrow === 'RECALL' ? (
          <View style={styles.vignetteBody}>
            <View style={[styles.question, { backgroundColor: theme.accent }]}>
              <Text style={[styles.questionText, { color: theme.onAccent }]}>When is my London dinner?</Text>
            </View>
            <View style={[styles.answer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.answerHeader}>
                <Text style={[styles.answerBrand, { color: theme.chrome }]}>NEVER</Text>
                <Text style={[styles.answerGrounded, { color: theme.textTertiary }]}>GROUNDED</Text>
              </View>
              <Text style={[styles.answerText, { color: theme.text }]}>Friday at 8:00 PM.</Text>
              <View style={[styles.sourceMini, { borderTopColor: theme.border }]}>
                <OneIcon name={icons.document} size={13} color={theme.chrome} />
                <Text style={[styles.sourceText, { color: theme.textSecondary }]}>Dinner reservation · 1 source</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  function Detail({ icon, text }: { icon: (typeof icons)[keyof typeof icons]; text: string }) {
    return (
      <View style={styles.detail}>
        <OneIcon name={icon} size={12} color={theme.textTertiary} />
        <Text style={[styles.detailText, { color: theme.textSecondary }]}>{text}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  top: { width: '100%', maxWidth: 760, alignSelf: 'center', height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 17, fontWeight: '600', letterSpacing: 4.7 },
  skip: { fontSize: 12, fontWeight: '500' },
  pager: { flex: 1 },
  slide: { paddingHorizontal: 20, justifyContent: 'center' },
  slideContent: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  visual: {
    height: 306,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 1
  },
  visualHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  visualWordmark: { fontSize: 10.5, fontWeight: '600', letterSpacing: 3.1 },
  visualMeta: { fontSize: 8, fontWeight: '700', letterSpacing: 1.45 },
  vignetteBody: { flex: 1, justifyContent: 'center', gap: 12, paddingHorizontal: 2 },
  captureField: { minHeight: 54, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallIcon: { width: 32, height: 32, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  captureText: { flex: 1, fontSize: 12.5, fontWeight: '500' },
  resultCard: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  resultEyebrow: { fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  resultTitle: { marginTop: 10, fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  detailRow: { marginTop: 12, flexDirection: 'row', gap: 14 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 10.5 },
  sharedCard: { minHeight: 86, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sharedPreview: { width: 60, height: 60, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sharedLabel: { fontSize: 7.75, fontWeight: '700', letterSpacing: 1.05 },
  sharedTitle: { marginTop: 5, fontSize: 14, fontWeight: '600' },
  sharedMeta: { marginTop: 3, fontSize: 10.5 },
  contextLine: { minHeight: 64, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  contextTitle: { fontSize: 12.5, fontWeight: '600' },
  contextMeta: { marginTop: 3, fontSize: 10.25 },
  question: { alignSelf: 'flex-end', maxWidth: '82%', borderRadius: 16, borderBottomRightRadius: 6, paddingHorizontal: 13, paddingVertical: 10 },
  questionText: { fontSize: 12, lineHeight: 17 },
  answer: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  answerHeader: { flexDirection: 'row', alignItems: 'center' },
  answerBrand: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.35 },
  answerGrounded: { marginLeft: 'auto', fontSize: 7.5, fontWeight: '700', letterSpacing: 0.9 },
  answerText: { marginTop: 12, fontSize: 16, lineHeight: 21, fontWeight: '600', letterSpacing: -0.2 },
  sourceMini: { marginTop: 13, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 7 },
  sourceText: { fontSize: 10.25 },
  copy: { marginTop: 30, paddingHorizontal: 3 },
  eyebrow: { fontSize: 9.25, fontWeight: '700', letterSpacing: 2.1 },
  title: { marginTop: 11, maxWidth: 500, fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  body: { marginTop: 11, maxWidth: 480, fontSize: 13.25, lineHeight: 20 },
  bottom: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 14 },
  dots: { height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { height: 7, borderRadius: 4 },
  privacy: { textAlign: 'center', fontSize: 10.5 }
});