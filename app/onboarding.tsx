import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/src/context/OnboardingContext';
import { IconTile, PrimaryButton } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const WIDTH = Dimensions.get('window').width;

const slides = [
  {
    icon: icons.inbox,
    eyebrow: 'CAPTURE',
    title: 'Get it out of your head.',
    body: 'Tasks, appointments, links and ideas. Type naturally and ONE organizes the details for you.'
  },
  {
    icon: icons.upload,
    eyebrow: 'SHARE',
    title: 'Send anything to ONE.',
    body: 'Share links, text and screenshots from other apps. ONE keeps the content together with the context that matters.'
  },
  {
    icon: icons.ask,
    eyebrow: 'RECALL',
    title: 'Remember by asking.',
    body: 'You do not need to remember where something was saved. Ask ONE and search your personal memory by meaning.'
  }
] as const;

export default function OnboardingScreen() {
  const theme = useTheme();
  const { complete } = useOnboarding();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / WIDTH);
    if (next !== index && next >= 0 && next < slides.length) setIndex(next);
  }

  async function finish() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await complete();
    router.replace('/(tabs)');
  }

  async function next() {
    await Haptics.selectionAsync();
    if (index === slides.length - 1) {
      await finish();
      return;
    }

    scrollRef.current?.scrollTo({ x: WIDTH * (index + 1), animated: true });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <Text style={[styles.brand, { color: theme.text }]}>ONE</Text>
        <Pressable onPress={finish} hitSlop={10}>
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
          <View key={slide.eyebrow} style={[styles.slide, { width: WIDTH }]}>
            <View style={[styles.visual, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.ringOuter, { borderColor: theme.border }]}>
                <View style={[styles.ringInner, { backgroundColor: theme.accentSoft }]}>
                  <IconTile icon={slide.icon} size={74} />
                </View>
              </View>

              <View style={[styles.miniCard, { backgroundColor: theme.fill }]}>
                <OneIcon name={icons.check} size={14} color={theme.success} />
                <View style={{ flex: 1 }}>
                  <View style={[styles.lineStrong, { backgroundColor: theme.text }]} />
                  <View style={[styles.lineSoft, { backgroundColor: theme.textTertiary }]} />
                </View>
              </View>

              <View style={[styles.miniCard, styles.miniCardSecond, { backgroundColor: theme.fill }]}>
                <OneIcon name={slide.icon} size={15} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <View style={[styles.lineStrong, { width: '62%', backgroundColor: theme.text }]} />
                  <View style={[styles.lineSoft, { width: '43%', backgroundColor: theme.textTertiary }]} />
                </View>
              </View>
            </View>

            <View style={styles.copy}>
              <Text style={[styles.eyebrow, { color: theme.accent }]}>{slide.eyebrow}</Text>
              <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
              <Text style={[styles.body, { color: theme.textSecondary }]}>{slide.body}</Text>
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
                  backgroundColor: dotIndex === index ? theme.accent : theme.fillStrong
                }
              ]}
            />
          ))}
        </View>

        <PrimaryButton
          label={index === slides.length - 1 ? 'Start using ONE' : 'Continue'}
          icon={index === slides.length - 1 ? icons.check : icons.chevron}
          onPress={next}
        />

        <Text style={[styles.privacy, { color: theme.textTertiary }]}>
          Private by default. Your memory belongs to you.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  top: { height: 54, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  skip: { fontSize: 13, fontWeight: '700' },
  pager: { flex: 1 },
  slide: { paddingHorizontal: 20, justifyContent: 'center' },
  visual: { height: 310, borderWidth: StyleSheet.hairlineWidth, borderRadius: 32, padding: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  ringOuter: { width: 168, height: 168, borderRadius: 84, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 118, height: 118, borderRadius: 59, alignItems: 'center', justifyContent: 'center' },
  miniCard: { position: 'absolute', left: 22, bottom: 26, width: 155, minHeight: 54, borderRadius: 16, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  miniCardSecond: { left: undefined, right: 22, bottom: 92, width: 142 },
  lineStrong: { width: '74%', height: 5, borderRadius: 3, opacity: 0.75 },
  lineSoft: { width: '54%', height: 4, borderRadius: 2, marginTop: 7, opacity: 0.35 },
  copy: { marginTop: 30, alignItems: 'center', paddingHorizontal: 8 },
  eyebrow: { fontSize: 11.5, fontWeight: '900', letterSpacing: 1.5 },
  title: { marginTop: 10, textAlign: 'center', fontSize: 31, lineHeight: 36, fontWeight: '800', letterSpacing: -0.9 },
  body: { marginTop: 12, maxWidth: 340, textAlign: 'center', fontSize: 14, lineHeight: 21 },
  bottom: { paddingHorizontal: 20, paddingBottom: 8, gap: 14 },
  dots: { height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dot: { height: 7, borderRadius: 4 },
  privacy: { textAlign: 'center', fontSize: 11.5 }
});
