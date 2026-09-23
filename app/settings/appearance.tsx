import { NeverNotice } from '@/src/ui/NeverNotice';
import { goBackOrHome } from '@/src/ui/navigation';
import { NeverSettingsSection, NeverNavigation } from '@/src/ui/utility';
import { themeIds, themes, appearanceLabel } from '@/src/theme/editions';
import { ThemePreview } from '@/src/ui/ThemePreview';
import { neverType } from '@/src/theme/tokens';
import { useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { useThemePreference } from '@/src/theme/useTheme';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5LargeHeader, useNeverV5Palette } from '@/src/ui/appleV5';
import type { ThemePreference } from '@/src/context/ThemeContext';
import { getNeverAppIcon, setNeverAppIcon, supportsNeverAppIcons, type NeverAppIconName } from '@/modules/never-app-icon/src/NeverAppIcon';

const iconOptions: { value: NeverAppIconName; title: string; body: string; source: number }[] = [
  { value: 'nature', title: 'Nature', body: 'Default NEVER app icon.', source: require('../../assets/icons/never-nature.png') },
  { value: 'wordmark', title: 'Wordmark', body: 'Minimal NEVER wordmark.', source: require('../../assets/icons/never-wordmark.png') }
];

export default function AppearanceScreen() {
  const p = useNeverV5Palette();
  const { fontScale, width } = useWindowDimensions();
  const singleColumn = fontScale > 1.3 || width < 340;
  const { preference, setPreference } = useThemePreference();
  const [appIcon, setAppIcon] = useState<NeverAppIconName>(() => getNeverAppIcon());
  const [iconError, setIconError] = useState<string | null>(null);
  const canSwitchAppIcon = supportsNeverAppIcons();
  const changingRef = useRef(false);
  const [changing, setChanging] = useState(false);
  const [appearanceError, setAppearanceError] = useState<string | null>(null);

  async function select(value: ThemePreference) {
    if (changingRef.current || value === preference) return;
    void Haptics.selectionAsync().catch(() => undefined);
    changingRef.current = true; setChanging(true); setAppearanceError(null);
    try { await setPreference(value); }
    catch { setAppearanceError('Your previous appearance was restored. Please try again.'); }
    finally { changingRef.current = false; setChanging(false); }
  }

  async function selectAppIcon(value: NeverAppIconName) {
    if (value === appIcon || !canSwitchAppIcon || changingRef.current) return;
    changingRef.current = true; setChanging(true);
    void Haptics.selectionAsync().catch(() => undefined);
    setIconError(null);
    try {
      await setNeverAppIcon(value);
      setAppIcon(value);
    } catch {
      setIconError('NEVER could not change the app icon. Reopen the app and try again.');
    } finally { changingRef.current = false; setChanging(false); }
  }

  return (
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.content, p.pageStyle]} showsVerticalScrollIndicator={false}>
        <NeverNavigation title="Appearance" onBack={() => goBackOrHome()} />

        <V5LargeHeader title="Appearance" subtitle="Same experience. A different atmosphere." />

        <View style={styles.collectionHeading}>
          <Text style={[styles.collectionTitle, { color: p.label }]}>Choose your perspective.</Text>
          <Text style={[styles.rowBody, { color: p.secondary }]}>Six material worlds. One NEVER.</Text>
        </View>
        <View accessibilityRole="radiogroup" accessibilityLabel="Interface theme" style={styles.themeGrid}>
          {[...themeIds, 'system' as const].map((value) => {
            const active = preference === value;
            const name = appearanceLabel(value);
            const optionTheme = value === 'system' ? null : themes[value];
            const descriptor = value === 'system' ? 'Adapts automatically.' : optionTheme!.descriptor;
            const optionSurface = optionTheme?.materials.card.color ?? p.surface;
            const optionBorder = active ? (optionTheme?.accent ?? p.graphite) : (optionTheme?.materials.card.border ?? p.border);
            const optionText = optionTheme?.text ?? p.label;
            const optionSecondary = optionTheme?.textSecondary ?? p.secondary;
            const optionTertiary = optionTheme?.textTertiary ?? p.tertiary;
            const optionAccent = optionTheme?.accent ?? p.graphite;
            const optionOnAccent = optionTheme?.onAccent ?? p.onAccent;
            const optionRadius = optionTheme?.radius.card ?? p.radius.card;
            return <Pressable key={value} accessible accessibilityRole="radio"
              accessibilityLabel={`${name}. ${descriptor}${value === 'platinum' ? ' Default NEVER appearance.' : ''}`}
              accessibilityHint="Applies immediately and saves on this device"
              disabled={changing} accessibilityState={{ checked: active, disabled: changing }}
              onPress={() => void select(value)}
              style={({ pressed }) => [styles.themeOption, singleColumn && { flexBasis: '100%' }, { backgroundColor: optionSurface, borderColor: optionBorder, borderWidth: active ? 1.5 : StyleSheet.hairlineWidth, opacity: pressed ? 0.75 : 1, borderRadius: optionRadius }]}>
              <View style={[styles.previewClip, { borderRadius: Math.max(6, optionRadius - 4) }]}><ThemePreview preference={value} /></View>
              <View style={styles.themeCopy}>
                <View style={styles.themeNameRow}>
                  <Text style={[styles.rowTitle, { color: optionText, flex: 1 }]}>{name}</Text>
                  <SelectionMark active={active} accent={optionAccent} onAccent={optionOnAccent} tertiary={optionTertiary} />
                </View>
                <Text style={[styles.rowBody, { color: optionSecondary }]}>{descriptor}</Text>
                {value === 'platinum' ? <Text style={[styles.defaultLabel, { color: optionTertiary }]}>NEVER ORIGINAL</Text> : null}
                {value === 'system' ? <Text style={[styles.rowBody, { color: optionTertiary }]}>Platinum by day. Monolith in dark mode.</Text> : null}
              </View>
            </Pressable>;
          })}
        </View>
        {appearanceError ? <NeverNotice tone="error" title="Appearance could not be saved" body={appearanceError} /> : null}

        <NeverSettingsSection title="App Icon">
          {iconOptions.map((option, index) => {
            const active = appIcon === option.value;
            return (
              <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: active, disabled: !canSwitchAppIcon || changing }} disabled={!canSwitchAppIcon || changing} onPress={() => selectAppIcon(option.value)} style={({ pressed }) => [styles.row, index < iconOptions.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }, { backgroundColor: pressed ? p.fillSoft : 'transparent', opacity: !canSwitchAppIcon ? 0.55 : 1 }]}>
                <Image source={option.source} style={styles.appIconPreview} />
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: p.label }]}>{option.title}</Text>
                  <Text style={[styles.rowBody, { color: p.secondary }]}>{option.body}</Text>
                </View>
                <SelectionMark active={active} accent={p.graphite} onAccent={p.onAccent} tertiary={p.tertiary} />
              </Pressable>
            );
          })}
        </NeverSettingsSection>

        {!canSwitchAppIcon ? (
          <View style={styles.note}><OneIcon name={icons.appearance} size={12.5} color={p.chrome} /><Text style={[styles.noteText, { color: p.tertiary }]}>Icon switching becomes available in the installed iOS native build.</Text></View>
        ) : null}
        {iconError ? <Text style={[styles.errorText, { color: p.danger }]}>{iconError}</Text> : null}
      </ScrollView>
    </NeverScreen>
  );
}
function SelectionMark({ active, accent, onAccent, tertiary }: { active: boolean; accent: string; onAccent: string; tertiary: string }) {
  return <View style={[styles.radio, { borderColor: active ? accent : tertiary, backgroundColor: active ? accent : 'transparent' }]}>
    {active ? <OneIcon name={icons.check} size={10} color={onAccent} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  collectionHeading: { gap: 4 }, collectionTitle: { ...neverType.section },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' },
  themeOption: { flexBasis: '46%', flexGrow: 1, minWidth: 130, overflow: 'hidden' },
  previewClip: { overflow: 'hidden', margin: 5 },
  themeCopy: { padding: 12, gap: 5 }, themeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  defaultLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 1.1, marginTop: 3 },

  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 34, gap: 18 },
  row: { minHeight: 72, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowCopy: { flex: 1, minWidth: 0 },
  appIconPreview: { width: 46, height: 46, borderRadius: 11 },
  rowTitle: { fontSize: 15, lineHeight: 18, fontWeight: '600' },
  rowBody: { marginTop: 2, ...neverType.caption },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.25, alignItems: 'center', justifyContent: 'center' },
  note: { paddingHorizontal: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  noteText: { flex: 1, ...neverType.caption },
  errorText: { paddingHorizontal: 4, ...neverType.caption }
});
