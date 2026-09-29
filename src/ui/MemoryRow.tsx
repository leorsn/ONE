import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';
import { neverControl, neverIcon, neverType, neverSpacing, neverRadius } from '@/src/theme/tokens';
import { OneIcon, icons } from '@/src/ui/icons';
import { iconForType } from '@/src/ui/OneItemRow';
import type { OneItem } from '@/src/types/item';

import { memoryDateLabel, memoryPreview } from './memoryPresentation';

export function MemoryRow({ item, last = false, reason, subtitle, onPress, status, floating = false }: { item: OneItem; last?: boolean; reason?: string; subtitle?: string; onPress?: () => void; status?: string; floating?: boolean }) {
  const t = useTheme();
  const { reduceTransparency } = useThemePreference();
  const preview = memoryPreview(item);
  const [failedPreview, setFailedPreview] = useState<string | null>(null);
  const dateLabel = memoryDateLabel(item.updatedAt);
  const kind = item.kind === 'image' ? 'Image' : item.type.charAt(0).toUpperCase() + item.type.slice(1);
  const category = item.category?.toLowerCase() === `${kind.toLowerCase()}s` ? undefined : item.category;
  const meta = subtitle || [kind, category, dateLabel].filter(Boolean).join(' · ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}. ${meta}${status ? `. ${status}` : ''}`} accessibilityHint="Opens memory details"
      onPress={onPress ?? (() => router.push({ pathname: '/item/[id]', params: { id: item.id } }))}
      style={({ pressed }) => [styles.row, floating && styles.floating, { backgroundColor: pressed ? t.fill : floating ? (reduceTransparency ? t.surface : t.surface + (t.mode === 'dark' ? 'CC' : 'B8')) : 'transparent' }]}>
      <View style={[styles.preview, { backgroundColor: t.fill }]}>
        {preview && failedPreview !== preview ? <Image onError={() => setFailedPreview(preview)} source={{ uri: preview }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <OneIcon name={iconForType(item.type)} size={neverIcon.medium} color={t.chrome} />}
      </View>
      <View style={[styles.content, !last && !floating && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }]}>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: t.text }]} numberOfLines={2} ellipsizeMode="tail">{item.title}</Text>
          {status ? <Text style={[styles.status, { color: t.textSecondary }]}>{status}</Text> : null}
          {reason ? <Text style={[styles.reason, { color: t.textTertiary }]}>{reason}</Text> : null}
          <Text style={[styles.meta, { color: t.textSecondary }]} numberOfLines={2}>{meta}</Text>
        </View>

        <OneIcon name={icons.chevron} size={12} color={t.textTertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  floating: { borderRadius: 12, marginBottom: 8 },
  row: { minHeight: neverControl.row, paddingLeft: neverSpacing.md, flexDirection: 'row', alignItems: 'center', gap: neverSpacing.md },
  preview: { width: neverIcon.preview, height: neverIcon.preview, borderRadius: neverRadius.sm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  content: { minHeight: neverControl.row, flex: 1, paddingVertical: neverSpacing.md, paddingRight: neverSpacing.md, flexDirection: 'row', alignItems: 'center', gap: neverSpacing.sm },
  status: { ...neverType.caption, marginTop: 4, fontWeight: '500' },
  copy: { flex: 1, minWidth: 0 }, title: { ...neverType.bodyStrong }, meta: { ...neverType.caption, marginTop: 3 }, reason: { ...neverType.caption }
});
