import { goBackOrHome } from '@/src/ui/navigation';
import { neverType } from '@/src/theme/tokens';
import { NeverNavigation } from '@/src/ui/utility';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { OneIcon, icons } from '@/src/ui/icons';
import { V5Group, V5LargeHeader, useNeverV5Palette } from '@/src/ui/appleV5';

const steps = [
  ['1', 'Open any app', 'Safari, Mail, Photos and other apps can send supported content to NEVER.'],
  ['2', 'Tap Share', 'Use the normal iOS Share button on the content you want to keep.'],
  ['3', 'Choose NEVER', 'Add useful context, review what NEVER recognized, then save it to your memory.']
] as const;

export default function ShareGuideScreen() {
  const p = useNeverV5Palette();

  return (
    <NeverScreen style={[styles.safe, { backgroundColor: p.canvas }]} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.content, p.pageStyle]}>
        <NeverNavigation title="Share" onBack={() => goBackOrHome()} />

        <V5LargeHeader title="Save from anywhere." subtitle="Send a link, message, screenshot or document to NEVER without breaking your flow." />

        <V5Group style={styles.shareVignette}>
          <View style={styles.sourceCard}>
            <View style={[styles.previewIcon, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft, borderColor: p.border }]}><OneIcon name={icons.screenshot} size={17} color={p.chrome} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sourceLabel, { color: p.tertiary }]}>FROM PHOTOS</Text>
              <Text style={[styles.sourceTitle, { color: p.label }]}>Flight confirmation</Text>
              <Text style={[styles.sourceMeta, { color: p.secondary }]}>Screenshot</Text>
            </View>
          </View>

          <View style={styles.flowLine}>
            <View style={[styles.flowRule, { backgroundColor: p.separator }]} />
            <View style={[styles.shareNode, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft, borderColor: p.border }]}><OneIcon name={icons.upload} size={14} color={p.chrome} /></View>
            <View style={[styles.flowRule, { backgroundColor: p.separator }]} />
          </View>

          <View style={[styles.neverCard, { borderTopColor: p.separator }]}>
            <View style={styles.neverHeader}>
              <Text style={[styles.neverLabel, { color: p.label }]}>NEVER</Text>
              <Text style={[styles.organizedLabel, { color: p.tertiary }]}>RECOGNIZED</Text>
            </View>
            <Text style={[styles.neverTitle, { color: p.label }]}>London → Hamburg</Text>
            <Text style={[styles.neverMeta, { color: p.secondary }]}>23 Sep · 18:45 · Travel</Text>
          </View>
        </V5Group>

        <V5Group>
          {steps.map(([number, title, body], index) => (
            <View key={number} style={[styles.row, index < steps.length - 1 && { borderBottomColor: p.separator, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.numberCircle, { borderRadius: p.radius.icon, backgroundColor: p.fillSoft, borderColor: p.border }]}><Text style={[styles.numberText, { color: p.chrome }]}>{number}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: p.label }]}>{title}</Text>
                <Text style={[styles.rowBody, { color: p.secondary }]}>{body}</Text>
              </View>
            </View>
          ))}
        </V5Group>

        <View style={styles.notice}>
          <OneIcon name={icons.shield} size={12.5} color={p.chrome} />
          <Text style={[styles.noticeText, { color: p.tertiary }]}>Supported screenshots can be read on-device before you save them.</Text>
        </View>
      </ScrollView>
    </NeverScreen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 26, gap: 18 },
  shareVignette: { padding: 13 },
  sourceCard: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewIcon: { width: 38, height: 38, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  sourceLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  sourceTitle: { marginTop: 3, fontSize: 14, lineHeight: 18, fontWeight: '600' },
  sourceMeta: { marginTop: 1, ...neverType.caption },
  flowLine: { height: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 44 },
  flowRule: { flex: 1, height: StyleSheet.hairlineWidth },
  shareNode: { width: 26, height: 26, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginHorizontal: 7 },
  neverCard: { minHeight: 64, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 11 },
  neverHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  neverLabel: { fontSize: 8.5, fontWeight: '800', letterSpacing: 1.2 },
  organizedLabel: { fontSize: 7.5, fontWeight: '700', letterSpacing: 0.75 },
  neverTitle: { marginTop: 8, fontSize: 14.5, lineHeight: 18, fontWeight: '600' },
  neverMeta: { marginTop: 2, ...neverType.caption },
  row: { minHeight: 64, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  numberCircle: { width: 28, height: 28, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  numberText: { ...neverType.caption, fontWeight: '700' },
  rowTitle: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
  rowBody: { marginTop: 2, ...neverType.caption },
  notice: { marginTop: 'auto', paddingHorizontal: 3, flexDirection: 'row', alignItems: 'center', gap: 7 },
  noticeText: { flex: 1, ...neverType.caption }
});
