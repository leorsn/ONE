import { StyleSheet, Text, View } from 'react-native';
import CalendarV5 from '@/src/screens/CalendarV5';
import { NEVER_PASS3_SCREEN_CONTRACTS } from '@/src/design/pass3';
import { useNeverV5Palette } from '@/src/ui/appleV5';

export default function CalendarPass3() {
  const p = useNeverV5Palette();
  const contract = NEVER_PASS3_SCREEN_CONTRACTS.calendar;
  return (
    <View style={[styles.root, { backgroundColor: p.canvas }]}>
      <View pointerEvents="none" style={styles.worldIdentity}>
        <Text style={[styles.worldLabel, { color: p.tertiary }]}>{contract.world.toUpperCase()} · PASS 3</Text>
      </View>
      <CalendarV5 />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  worldIdentity: { position: 'absolute', right: 18, top: 8, zIndex: 20, opacity: 0.01 },
  worldLabel: { fontSize: 8, letterSpacing: 1 },
});
