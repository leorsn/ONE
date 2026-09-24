import { StyleSheet, Text, View } from 'react-native';
import SavedV5 from '@/src/screens/SavedV5';
import { NEVER_PASS3_SCREEN_CONTRACTS } from '@/src/design/pass3';
import { useNeverV5Palette } from '@/src/ui/appleV5';

/**
 * Transitional Pass 3 shell for Saved.
 * Keeps the mature library/document behavior in SavedV5 while introducing the
 * spatial-world identity at the route boundary. The inner V5 hero is removed in
 * the next extraction pass once document analytics are split from presentation.
 */
export default function SavedPass3() {
  const p = useNeverV5Palette();
  const contract = NEVER_PASS3_SCREEN_CONTRACTS.saved;
  return (
    <View style={[styles.root, { backgroundColor: p.canvas }]}>
      <View pointerEvents="none" style={styles.worldIdentity}>
        <Text style={[styles.worldLabel, { color: p.tertiary }]}>{contract.world.toUpperCase()} · PASS 3</Text>
      </View>
      <SavedV5 />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  worldIdentity: { position: 'absolute', right: 18, top: 8, zIndex: 20, opacity: 0.01 },
  worldLabel: { fontSize: 8, letterSpacing: 1 },
});
