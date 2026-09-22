import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NeverNotice } from '@/src/ui/NeverNotice';
import { V5Wordmark, useNeverV5Palette } from '@/src/ui/appleV5';

export default function MissingRoute() {
  const p = useNeverV5Palette();
  return <SafeAreaView style={[styles.safe, { backgroundColor: p.canvas }]}>
    <ScrollView contentContainerStyle={styles.content}>
      <V5Wordmark />
      <NeverNotice title="This page is unavailable" body="The link may be incomplete or no longer available. Your memories are still in NEVER." action="Return to Home" onAction={() => router.replace('/(tabs)')} />
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { flexGrow: 1, width: '100%', maxWidth: 540, alignSelf: 'center', justifyContent: 'center', padding: 24, gap: 24 }
});
