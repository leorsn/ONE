import { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Group, V5Wordmark, useNeverV5Palette } from '@/src/ui/appleV5';

const slides = [
  { icon: icons.inbox, eyebrow: 'CAPTURE', title: 'Get it out of your head.', body: 'Tasks, appointments, links and ideas. Type naturally and NEVER organizes the details for you.' },
  { icon: icons.upload, eyebrow: 'SHARE', title: 'Send anything to NEVER.', body: 'Share links, text and screenshots from other apps. NEVER keeps the content together with the context that matters.' },
  { icon: icons.ask, eyebrow: 'RECALL', title: 'Remember by asking.', body: 'You do not need to remember where something was saved. Ask NEVER and search your personal memory by meaning.' }
] as const;

type Slide = (typeof slides)[number];

export default function OnboardingScreen() {
  const p = useNeverV5Palette();
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
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    if (nextIndex !== index && nextIndex >= 0 && nextIndex < slides.length) setIndex(nextIndex);
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
    <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <V5Wordmark />
        <Pressable accessibilityRole="button" accessibilityLabel="Skip introduction" onPress={finish} hitSlop={10}>
          <Text style={[styles.skip, { color: p.secondary }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleScroll} scrollEventThrottle={16} style={styles.pager}>
        {slides.map((slide) => (
          <View key={slide.eyebrow} style={[styles.slide, { width }]}>
            <View style={styles.slideContent}>
              <ProductVignette slide={slide} />
              <View style={styles.copy}>
                <Text style={[styles.eyebrow, { color: p.chrome }]}>{slide.eyebrow}</Text>
                <Text style={[styles.title, { color: p.label }]}>{slide.title}</Text>
                <Text style={[styles.body, { color: p.secondary }]}>{slide.body}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {slides.map((slide, dotIndex) => (
            <View key={slide.eyebrow} style={[styles.dot, { width: dotIndex === index ? 20 : 6, backgroundColor: dotIndex === index ? p.chrome : p.tertiary }]} />
          ))}
        </View>

        <Pressable onPress={next} style={({ pressed }) => [styles.primaryButton, { backgroundColor: p.graphite, opacity: pressed ? 0.72 : 1 }]}>
          <Text style={[styles.primaryText, { color: p.dark ? '#111113' : '#FFFFFF' }]}>{index === slides.length - 1 ? 'Continue to NEVER' : 'Continue'}</Text>
          <OneIcon name={index === slides.length - 1 ? icons.check : icons.chevron} size={13.5} color={p.dark ? '#111113' : '#FFFFFF'} />
        </Pressable>

        <Text style={[styles.privacy, { color: p.tertiary }]}>Private by default. Your memory belongs to you.</Text>
      </View>
    </SafeAreaView>
  );

  function ProductVignette({ slide }: { slide: Slide }) {
    return (
      <V5Group style={styles.visual}>
        <View style={styles.visualHeader}>
          <Text style={[styles.visualWordmark, { color: p.label }]}>NEVER</Text>
          <Text style={[styles.visualMeta, { color: p.tertiary }]}>{slide.eyebrow}</Text>
        </View>

        {slide.eyebrow === 'CAPTURE' ? (
          <View style={styles.vignetteBody}>
            <View style={[styles.captureField, { backgroundColor: p.fillSoft }]}>
              <View style={[styles.smallIcon, { backgroundColor: p.surface }]}><OneIcon name={icons.plus} size={14.5} color={p.chrome} /></View>
              <Text style={[styles.captureText, { color: p.label }]}>Dinner Friday at 8 in London</Text>
            </View>
            <View style={[styles.resultCard, { backgroundColor: p.fillSoft }]}>
              <View style={styles.resultTop}><OneIcon name={icons.check} size={13.5} color={p.success} /><Text style={[styles.resultEyebrow, { color: p.tertiary }]}>ORGANIZED</Text></View>
              <Text style={[styles.resultTitle, { color: p.label }]}>Dinner in London</Text>
              <View style={styles.detailRow}><Detail icon={icons.calendar} text="Friday" /><Detail icon={icons.reminder} text="20:00" /></View>
            </View>
          </View>
        ) : null}

        {slide.eyebrow === 'SHARE' ? (
          <View style={styles.vignetteBody}>
            <View style={[styles.sharedCard, { backgroundColor: p.fillSoft }]}>
              <View style={[styles.sharedPreview, { backgroundColor: p.fill }]}><OneIcon name={icons.screenshot} size={22} color={p.chrome} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sharedLabel, { color: p.tertiary }]}>SHARED TO NEVER</Text>
                <Text style={[styles.sharedTitle, { color: p.label }]}>Flight confirmation</Text>
                <Text style={[styles.sharedMeta, { color: p.secondary }]}>Screenshot · Travel</Text>
              </View>
            </View>
            <View style={[styles.contextLine, { backgroundColor: p.fillSoft }]}>
              <OneIcon name={icons.travel} size={14.5} color={p.chrome} />
              <View style={{ flex: 1 }}><Text style={[styles.contextTitle, { color: p.label }]}>London → Hamburg</Text><Text style={[styles.contextMeta, { color: p.secondary }]}>23 Sep · 18:45 · BA</Text></View>
            </View>
          </View>
        ) : null}

        {slide.eyebrow === 'RECALL' ? (
          <View style={styles.vignetteBody}>
            <View style={[styles.question, { backgroundColor: p.graphite }]}><Text style={[styles.questionText, { color: p.dark ? '#111113' : '#FFFFFF' }]}>When is my London dinner?</Text></View>
            <View style={[styles.answer, { backgroundColor: p.fillSoft }]}>
              <View style={styles.answerHeader}><Text style={[styles.answerBrand, { color: p.chrome }]}>NEVER</Text><Text style={[styles.answerGrounded, { color: p.tertiary }]}>GROUNDED</Text></View>
              <Text style={[styles.answerText, { color: p.label }]}>Friday at 8:00 PM.</Text>
              <View style={[styles.sourceMini, { borderTopColor: p.separator }]}><OneIcon name={icons.document} size={12.5} color={p.chrome} /><Text style={[styles.sourceText, { color: p.secondary }]}>Dinner reservation · 1 source</Text></View>
            </View>
          </View>
        ) : null}
      </V5Group>
    );
  }

  function Detail({ icon, text }: { icon: (typeof icons)[keyof typeof icons]; text: string }) {
    return <View style={styles.detail}><OneIcon name={icon} size={11.5} color={p.tertiary} /><Text style={[styles.detailText, { color: p.secondary }]}>{text}</Text></View>;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  top: { width: '100%', maxWidth: 760, alignSelf: 'center', height: 52, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  skip: { fontSize: 12.5, lineHeight: 16, fontWeight: '500' },
  pager: { flex: 1 },
  slide: { paddingHorizontal: 20, justifyContent: 'center' },
  slideContent: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  visual: { height: 284, padding: 16 },
  visualHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  visualWordmark: { fontSize: 9.5, fontWeight: '700', letterSpacing: 2.7 },
  visualMeta: { fontSize: 7.5, fontWeight: '700', letterSpacing: 1.2 },
  vignetteBody: { flex: 1, justifyContent: 'center', gap: 10, paddingHorizontal: 1 },
  captureField: { minHeight: 50, borderRadius: 14, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 9 },
  smallIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  captureText: { flex: 1, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  resultCard: { borderRadius: 14, padding: 13 },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultEyebrow: { fontSize: 7.5, fontWeight: '700', letterSpacing: 1 },
  resultTitle: { marginTop: 8, fontSize: 15, lineHeight: 19, fontWeight: '600' },
  detailRow: { marginTop: 10, flexDirection: 'row', gap: 13 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 10, lineHeight: 13 },
  sharedCard: { minHeight: 78, borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  sharedPreview: { width: 54, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sharedLabel: { fontSize: 7.5, fontWeight: '700', letterSpacing: 0.9 },
  sharedTitle: { marginTop: 4, fontSize: 13.5, lineHeight: 17, fontWeight: '600' },
  sharedMeta: { marginTop: 2, fontSize: 10, lineHeight: 13 },
  contextLine: { minHeight: 58, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  contextTitle: { fontSize: 12, lineHeight: 15, fontWeight: '600' },
  contextMeta: { marginTop: 2, fontSize: 10, lineHeight: 13 },
  question: { alignSelf: 'flex-end', maxWidth: '82%', borderRadius: 15, borderBottomRightRadius: 5, paddingHorizontal: 12, paddingVertical: 9 },
  questionText: { fontSize: 11.5, lineHeight: 16 },
  answer: { borderRadius: 14, padding: 13 },
  answerHeader: { flexDirection: 'row', alignItems: 'center' },
  answerBrand: { fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  answerGrounded: { marginLeft: 'auto', fontSize: 7, fontWeight: '700', letterSpacing: 0.75 },
  answerText: { marginTop: 10, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  sourceMini: { marginTop: 11, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceText: { fontSize: 10, lineHeight: 13 },
  copy: { marginTop: 26, paddingHorizontal: 2 },
  eyebrow: { fontSize: 8.5, lineHeight: 11, fontWeight: '700', letterSpacing: 1.8 },
  title: { marginTop: 8, maxWidth: 500, fontSize: 30, lineHeight: 35, fontWeight: '700', letterSpacing: -0.95 },
  body: { marginTop: 8, maxWidth: 480, fontSize: 13, lineHeight: 19 },
  bottom: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  dots: { height: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  primaryButton: { minHeight: 46, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryText: { fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  privacy: { textAlign: 'center', fontSize: 10.5, lineHeight: 14 }
});