import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NeverSignal, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';
import { editorialFontFamily } from '@/src/theme/typography';

const steps = [
  ['1', 'Open any app', 'Safari, Mail, Photos and other apps can send supported content to NEVER.'],
  ['2', 'Tap Share', 'Use the normal iOS Share button on the content you want to keep.'],
  ['3', 'Choose NEVER', 'Add useful context, review what NEVER recognized, then save it to your memory.']
] as const;

export default function ShareGuideScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.chevronLeft} size={16} color={theme.text} />
          </Pressable>
          <View style={styles.navBrand}>
            <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
            <NeverSignal compact />
          </View>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.textTertiary }]}>SHARE</Text>
          <Text style={[styles.title, { color: theme.text }]}>Save from anywhere.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Send a link, message, screenshot or document to NEVER without breaking your flow.</Text>
        </View>

        <View style={[styles.shareVignette, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sourceCard}>
            <View style={[styles.previewSpine, { borderColor: theme.border }]}>
              <OneIcon name={icons.screenshot} size={18} color={theme.sky} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sourceEyebrow, { color: theme.textTertiary }]}>FROM PHOTOS</Text>
              <Text style={[styles.sourceTitle, { color: theme.text }]}>Flight confirmation</Text>
              <Text style={[styles.sourceMeta, { color: theme.textSecondary }]}>Screenshot</Text>
            </View>
          </View>

          <View style={styles.flowLine}>
            <View style={[styles.flowRule, { backgroundColor: theme.border }]} />
            <View style={[styles.shareNode, { borderColor: theme.border }]}>
              <OneIcon name={icons.upload} size={15} color={theme.chrome} />
            </View>
            <View style={[styles.flowRule, { backgroundColor: theme.border }]} />
          </View>

          <View style={[styles.neverCard, { borderTopColor: theme.border }]}>
            <View style={styles.neverHeader}>
              <View style={styles.neverBrand}>
                <Text style={[styles.neverLabel, { color: theme.text }]}>NEVER</Text>
                <NeverSignal compact />
              </View>
              <Text style={[styles.organizedLabel, { color: theme.textTertiary }]}>RECOGNIZED</Text>
            </View>
            <Text style={[styles.neverTitle, { color: theme.text }]}>London → Hamburg</Text>
            <Text style={[styles.neverMeta, { color: theme.textSecondary }]}>23 Sep · 18:45 · Travel</Text>
          </View>
        </View>

        <Surface>
          {steps.map(([number, title, body], index) => (
            <View
              key={number}
              style={[
                styles.row,
                index < steps.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }
              ]}
            >
              <Text style={[styles.numberText, { color: theme.sky }]}>{number}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{body}</Text>
              </View>
            </View>
          ))}
        </Surface>

        <View style={styles.notice}>
          <OneIcon name={icons.shield} size={13} color={theme.sky} />
          <Text style={[styles.noticeText, { color: theme.textTertiary }]}>Supported screenshots can be read on-device before you save them.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30, gap: 19 },
  nav: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 38, height: 38, borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  wordmark: { fontSize: 10.75, fontWeight: '700', letterSpacing: 3.2 },
  hero: { paddingTop: 8, paddingBottom: 2 },
  eyebrow: { fontSize: 8.5, fontWeight: '700', letterSpacing: 2 },
  title: { marginTop: 10, fontFamily: editorialFontFamily, fontSize: 31, lineHeight: 35, fontWeight: '400', letterSpacing: -0.8 },
  subtitle: { marginTop: 8, maxWidth: 520, fontSize: 12.5, lineHeight: 18.5 },
  shareVignette: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  sourceCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewSpine: { width: 29, height: 38, borderLeftWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sourceEyebrow: { fontSize: 7.25, fontWeight: '700', letterSpacing: 1.0 },
  sourceTitle: { marginTop: 4, fontSize: 13, fontWeight: '600' },
  sourceMeta: { marginTop: 2, fontSize: 10.1 },
  flowLine: { height: 34, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 44 },
  flowRule: { flex: 1, height: StyleSheet.hairlineWidth },
  shareNode: { width: 28, height: 28, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginHorizontal: 8 },
  neverCard: { minHeight: 72, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
  neverHeader: { flexDirection: 'row', alignItems: 'center' },
  neverBrand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  neverLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.35 },
  organizedLabel: { marginLeft: 'auto', fontSize: 7.25, fontWeight: '700', letterSpacing: 0.86 },
  neverTitle: { marginTop: 9, fontSize: 14.75, lineHeight: 18.5, fontWeight: '600', letterSpacing: -0.15 },
  neverMeta: { marginTop: 3, fontSize: 10.5 },
  row: { minHeight: 68, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  numberText: { width: 16, paddingTop: 1, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.72 },
  rowTitle: { fontSize: 13.75, lineHeight: 17.5, fontWeight: '600', letterSpacing: -0.07 },
  rowBody: { marginTop: 3, fontSize: 11, lineHeight: 15.5 },
  notice: { marginTop: 'auto', paddingTop: 4, flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeText: { flex: 1, fontSize: 10.25, lineHeight: 14.5 }
});
