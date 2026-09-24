import { StyleSheet, Text, View } from 'react-native';
import SearchV5 from '@/src/screens/SearchV5';
import { NEVER_PASS3_SCREEN_CONTRACTS } from '@/src/design/pass3';
import { useNeverV5Palette } from '@/src/ui/appleV5';

export default function SearchPass3() {
  const p = useNeverV5Palette();
  const contract = NEVER_PASS3_SCREEN_CONTRACTS.search;
  return (
    <View style={[styles.root, { backgroundColor: p.canvas }]}>
      <View pointerEvents="none" style={styles.worldIdentity}>
        <Text style={[styles.worldLabel, { color: p.tertiary }]}>{contract.world.toUpperCase()} · PASS 3</Text>
      </View>
      <SearchV5 />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  worldIdentity: { position: 'absolute', right: 18, top: 8, zIndex: 20, opacity: 0.01 },
  worldLabel: { fontSize: 8, letterSpacing: 1 },
});
