import type { ErrorBoundaryProps } from 'expo-router';
import { useColorScheme, ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lightTheme, darkTheme } from '@/src/theme/colors';
import { neverType } from '@/src/theme/tokens';

/** Also works when a provider fails, without reading the failed provider tree. */
export function RouteError({ retry }: ErrorBoundaryProps) {
  const t = useColorScheme() === 'dark' ? darkTheme : lightTheme;
  return <SafeAreaView style={[styles.safe, { backgroundColor: t.background }]}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.title, { color: t.text }]}>Let’s try that again.</Text>
      <Text accessibilityRole="alert" style={[styles.body, { color: t.textSecondary }]}>NEVER could not display this screen. Try opening it again. Your saved memories have not been cleared.</Text>
      <Pressable accessibilityRole="button" onPress={() => void retry()} style={({ pressed }) => [styles.button, { backgroundColor: t.accent, opacity: pressed ? 0.65 : 1 }]}><Text style={[styles.label, { color: t.onAccent }]}>Try again</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'center', width: '100%', maxWidth: 540, alignSelf: 'center', padding: 24, gap: 20 },
  title: { ...neverType.hero }, body: { ...neverType.body }, label: { ...neverType.bodyStrong, textAlign: 'center' },
  button: { minHeight: 52, borderRadius: 16, padding: 16, alignItems: 'center', justifyContent: 'center' }
});
