import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/context/AuthContext';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { IconTile, PrimaryButton } from '@/src/ui/primitives';
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

export default function OnboardingScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { configured, session } = useAuth();
  const { complete } = useOnboarding();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

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
              <View style={[styles.visual, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
                <View style={[styles.ringOuter, { borderColor: theme.border }]}>
                  <View style={[styles.ringMiddle, { borderColor: theme.fillStrong }]}>
                    <View style={[styles.ringInner, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                      <IconTile icon={slide.icon} size={70} />
                    </View>
                  </View>
                </View>

                <View style={[styles.miniCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <OneIcon name={icons.check} size={14} color={theme.success} />
                  <View style={{ flex: 1 }}>
                    <View style={[styles.lineStrong, { backgroundColor: theme.text }]} />
                    <View style={[styles.lineSoft, { backgroundColor: theme.textTertiary }]} />
                  </View>
                </View>

                <View style={[styles.miniCard, styles.miniCardSecond, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <OneIcon name={slide.icon} size={15} color={theme.chrome} />
                  <View style={{ flex: 1 }}>
                    <View style={[styles.lineStrong, { width: '62%', backgroundColor: theme.text }]} />
                    <View style={[styles.lineSoft, { width: '43%', backgroundColor: theme.textTertiary }]} />
                  </View>
                </View>
              </View>

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
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  top: { width: '100%', maxWidth: 760, alignSelf: 'center', height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 16, fontWeight: '700', letterSpacing: 1.8 },
  skip: { fontSize: 12.5, fontWeight: '600' },
  pager: { flex: 1 },
  slide: { paddingHorizontal: 20, justifyContent: 'center' },
  slideContent: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  visual: { height: 304, borderWidth: StyleSheet.hairlineWidth, borderRadius: 24, padding: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', shadowOpacity: 0.065, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 1 },
  ringOuter: { width: 174, height: 174, borderRadius: 87, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  ringMiddle: { width: 146, height: 146, borderRadius: 73, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 116, height: 116, borderRadius: 58, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  miniCard: { position: 'absolute', left: 22, bottom: 26, width: 155, minHeight: 54, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniCardSecond: { left: undefined, right: 22, bottom: 92, width: 142 },
  lineStrong: { width: '74%', height: 4, borderRadius: 2, opacity: 0.72 },
  lineSoft: { width: '54%', height: 3, borderRadius: 2, marginTop: 7, opacity: 0.34 },
  copy: { marginTop: 31, alignItems: 'center', paddingHorizontal: 8 },
  eyebrow: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.8 },
  title: { marginTop: 11, textAlign: 'center', fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.95 },
  body: { marginTop: 13, maxWidth: 340, textAlign: 'center', fontSize: 13.75, lineHeight: 21 },
  bottom: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 8, gap: 14 },
  dots: { height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { height: 7, borderRadius: 4 },
  privacy: { textAlign: 'center', fontSize: 11 }
});