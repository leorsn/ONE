import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconTile, Surface } from '@/src/ui/primitives';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const protections = [
  {
    icon: icons.lock,
    title: 'Private account data',
    body: 'Supabase Row Level Security limits synced items to the authenticated owner.'
  },
  {
    icon: icons.screenshot,
    title: 'Private attachments',
    body: 'Shared screenshots and documents live in a private per-user storage path.'
  },
  {
    icon: icons.ask,
    title: 'Scoped semantic recall',
    body: 'Meaning search only matches memories belonging to the signed-in ONE account.'
  },
  {
    icon: icons.cloud,
    title: 'Local-first fallback',
    body: 'Core capture and recall continue locally when cloud services are unavailable.'
  }
] as const;

export default function PrivacyScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={[styles.navButton, { backgroundColor: theme.fill }]}>
            <OneIcon name={icons.chevronLeft} size={18} color={theme.text} />
          </Pressable>
          <Text style={[styles.navTitle, { color: theme.text }]}>Privacy</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.hero}>
          <IconTile icon={icons.shield} size={52} />
          <Text style={[styles.title, { color: theme.text }]}>Private by default.</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            ONE is designed around personal memory. Access boundaries are part of the architecture, not an afterthought.
          </Text>
        </View>

        <Surface>
          {protections.map((protection, index) => (
            <View
              key={protection.title}
              style={[
                styles.row,
                index < protections.length - 1 && {
                  borderBottomColor: theme.border,
                  borderBottomWidth: StyleSheet.hairlineWidth
                }
              ]}
            >
              <IconTile icon={protection.icon} tone="neutral" size={38} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.text }]}>{protection.title}</Text>
                <Text style={[styles.rowBody, { color: theme.textSecondary }]}>{protection.body}</Text>
              </View>
            </View>
          ))}
        </Surface>

        <View style={[styles.notice, { backgroundColor: theme.accentSoft }]}>
          <OneIcon name={icons.shield} size={17} color={theme.accent} />
          <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
            A complete consumer privacy policy and legal disclosure still need to be added before public release.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 8, gap: 24 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 16, fontWeight: '800' },
  hero: { alignItems: 'center', paddingTop: 10 },
  title: { marginTop: 14, fontSize: 27, lineHeight: 32, fontWeight: '800', letterSpacing: -0.7, textAlign: 'center' },
  subtitle: { marginTop: 8, maxWidth: 340, fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  row: { minHeight: 82, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontSize: 14.5, fontWeight: '700' },
  rowBody: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  notice: { minHeight: 62, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeText: { flex: 1, fontSize: 11.5, lineHeight: 16 }
});
