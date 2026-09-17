import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconTile, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const steps = [
  ['1', 'Open any app', 'Safari, Mail, Photos and other apps can send content to NEVER.'],
  ['2', 'Tap Share', 'Use the normal iOS Share button on the content you want to keep.'],
  ['3', 'Choose NEVER', 'Add a few words of context, then save it to your personal memory.']
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
            style={({ pressed }) => [styles.navButton, { backgroundColor: theme.fill, borderColor: theme.border, opacity: pressed ? 0.62 : 1 }]}
          >
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Share to NEVER</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <IconTile icon={icons.upload} size={54} />
          <Text style={[styles.title, { color: theme.text }]}>Save from anywhere.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>When NEVER is installed, it can appear in the iOS Share Sheet for supported content.</Text>
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
              <View style={[styles.number, { backgroundColor: theme.chromeSoft, borderColor: theme.border }]}>
                <Text style={[styles.numberText, { color: theme.chrome }]}>{number}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{body}</Text>
              </View>
            </View>
          ))}
        </Surface>

        <View style={[styles.notice, { backgroundColor: theme.fill, borderColor: theme.border }]}>
          <OneIcon name={icons.shield} size={17} color={theme.textSecondary} />
          <Text style={[styles.noticeText, { color: theme.textSecondary }]}>Screenshots can be read on-device before they are saved.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, gap: 22 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.1 },
  hero: { alignItems: 'center', paddingTop: 14 },
  title: { marginTop: 15, fontSize: 28, lineHeight: 33, fontWeight: '700', letterSpacing: -0.85, textAlign: 'center' },
  subtitle: { marginTop: 8, maxWidth: 330, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  row: { minHeight: 92, paddingHorizontal: 15, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 13 },
  number: { width: 36, height: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 13, fontWeight: '800' },
  rowTitle: { fontSize: 14.5, fontWeight: '700' },
  rowBody: { marginTop: 4, fontSize: 12.25, lineHeight: 18 },
  notice: { minHeight: 58, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 }
});