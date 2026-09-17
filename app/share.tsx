import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

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
            style={({ pressed }) => [styles.navButton, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.chevronLeft} size={17} color={theme.text} />
          </Pressable>
          <Text style={[styles.wordmark, { color: theme.text }]}>NEVER</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <Text style={[styles.eyebrow, { color: theme.chrome }]}>SHARE</Text>
          <Text style={[styles.title, { color: theme.text }]}>Save from anywhere.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Send a link, message, screenshot or document to NEVER without breaking your flow.</Text>
        </View>

        <View style={[styles.shareVignette, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <View style={[styles.sourceCard, { backgroundColor: theme.fill, borderColor: theme.border }]}>
            <View style={[styles.previewTile, { backgroundColor: theme.fillStrong }]}>
              <OneIcon name={icons.screenshot} size={22} color={theme.chrome} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sourceEyebrow, { color: theme.textTertiary }]}>FROM PHOTOS</Text>
              <Text style={[styles.sourceTitle, { color: theme.text }]}>Flight confirmation</Text>
              <Text style={[styles.sourceMeta, { color: theme.textSecondary }]}>Screenshot</Text>
            </View>
          </View>

          <View style={styles.flowLine}>
            <View style={[styles.flowRule, { backgroundColor: theme.fillStrong }]} />
            <View style={[styles.shareNode, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
              <OneIcon name={icons.upload} size={16} color={theme.chrome} />
            </View>
            <View style={[styles.flowRule, { backgroundColor: theme.fillStrong }]} />
          </View>

          <View style={[styles.neverCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.neverHeader}>
              <Text style={[styles.neverLabel, { color: theme.chrome }]}>NEVER</Text>
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
              <Text style={[styles.numberText, { color: theme.textTertiary }]}>{number}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{body}</Text>
              </View>
            </View>
          ))}
        </Surface>

        <View style={[styles.notice, { borderTopColor: theme.border }]}>
          <OneIcon name={icons.shield} size={14} color={theme.chrome} />
          <Text style={[styles.noticeText, { color: theme.textTertiary }]}>Supported screenshots can be read on-device before you save them.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, gap: 22 },
  nav: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  wordmark: { fontSize: 11, fontWeight: '600', letterSpacing: 3.2 },
  hero: { paddingTop: 9, paddingBottom: 2 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.1 },
  title: { marginTop: 11, fontSize: 31, lineHeight: 36, fontWeight: '600', letterSpacing: -1.05 },
  subtitle: { marginTop: 9, maxWidth: 520, fontSize: 13, lineHeight: 19.5 },
  shareVignette: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 15, shadowOpacity: 0.035, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 1 },
  sourceCard: { minHeight: 72, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 11 },
  previewTile: { width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sourceEyebrow: { fontSize: 7.5, fontWeight: '700', letterSpacing: 1.05 },
  sourceTitle: { marginTop: 4, fontSize: 13, fontWeight: '600' },
  sourceMeta: { marginTop: 2, fontSize: 10.25 },
  flowLine: { height: 42, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 46 },
  flowRule: { flex: 1, height: StyleSheet.hairlineWidth },
  shareNode: { width: 32, height: 32, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginHorizontal: 9 },
  neverCard: { minHeight: 86, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 13 },
  neverHeader: { flexDirection: 'row', alignItems: 'center' },
  neverLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.35 },
  organizedLabel: { marginLeft: 'auto', fontSize: 7.5, fontWeight: '700', letterSpacing: 0.9 },
  neverTitle: { marginTop: 10, fontSize: 15, lineHeight: 19, fontWeight: '600', letterSpacing: -0.18 },
  neverMeta: { marginTop: 4, fontSize: 10.75 },
  row: { minHeight: 80, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  numberText: { width: 18, paddingTop: 1, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  rowTitle: { fontSize: 14, lineHeight: 18, fontWeight: '600', letterSpacing: -0.08 },
  rowBody: { marginTop: 4, fontSize: 11.5, lineHeight: 16.5 },
  notice: { marginTop: 'auto', paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeText: { flex: 1, fontSize: 10.5, lineHeight: 15 }
});