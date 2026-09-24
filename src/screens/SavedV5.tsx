import { useLocalDay } from '@/src/ui/useLocalDay';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { NeverScreen } from '@/src/ui/NeverScreen';
import { useItems } from '@/src/context/ItemsContext';
import { filterDocuments, formatCurrencyTotal, formatItemAmount, getDocumentSummary, groupDocumentsByMonth } from '@/src/documents/analytics';
import { OneIcon, icons } from '@/src/ui/icons';
import { MemoryRow } from '@/src/ui/MemoryRow';
import { V5SearchField, V5Segmented, useNeverV5Palette } from '@/src/ui/appleV5';
import { Pass3Divider, Pass3Section } from '@/src/ui/pass3/Pass3Section';
import { Pass3ScreenIntro } from '@/src/ui/pass3/Pass3ScreenIntro';
import type { OneDocumentKind, OneItem } from '@/src/types/item';

const filters = ['All', 'Documents', 'Images', 'Links', 'Ideas'] as const;
const documentFilters: { label: string; value: 'all' | OneDocumentKind }[] = [
  { label: 'All', value: 'all' }, { label: 'Receipts', value: 'receipt' }, { label: 'Invoices', value: 'invoice' },
  { label: 'Tickets', value: 'ticket' }, { label: 'Reservations', value: 'reservation' }, { label: 'Contracts', value: 'contract' }
];

export default function SavedV5() {
  const p = useNeverV5Palette();
  const { items } = useItems();
  const [filter, setFilter] = useState<(typeof filters)[number]>('All');
  const [documentFilter, setDocumentFilter] = useState<'all' | OneDocumentKind>('all');
  const [query, setQuery] = useState('');
  const today = useLocalDay();
  const documentSummary = useMemo(() => getDocumentSummary(items, new Date(`${today}T12:00:00`)), [items, today]);
  const documents = useMemo(() => filterDocuments(items, documentFilter, query), [items, documentFilter, query]);
  const documentGroups = useMemo(() => groupDocumentsByMonth(documents), [documents]);
  const libraryItems = useMemo(() => items.filter((item) => item.saved || ['link','idea','shopping','travel','document'].includes(item.type)).sort((a,b) => new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()), [items]);
  const counts = useMemo(() => ({
    Documents: libraryItems.filter((i) => i.type === 'document' || i.documentKind).length,
    Images: libraryItems.filter((i) => i.kind === 'image' || i.sourceType === 'screenshot' || Boolean(i.imageUrl) || Boolean(i.localAttachmentMimeType?.startsWith('image/'))).length,
    Links: libraryItems.filter((i) => i.type === 'link' || Boolean(i.url)).length,
    Ideas: libraryItems.filter((i) => i.type === 'idea' || i.type === 'note').length,
  }), [libraryItems]);
  const savedItems = useMemo(() => {
    const clean = query.trim().toLowerCase();
    const base = libraryItems.filter((item) => !clean || [item.title,item.category,item.userContext,item.url,item.extractedText,item.merchant].filter(Boolean).some((v) => v!.toLowerCase().includes(clean)));
    if (filter === 'All') return base;
    if (filter === 'Documents') return [];
    if (filter === 'Images') return base.filter((i) => i.kind === 'image' || i.sourceType === 'screenshot' || Boolean(i.imageUrl) || Boolean(i.localAttachmentMimeType?.startsWith('image/')));
    if (filter === 'Links') return base.filter((i) => i.type === 'link' || Boolean(i.url));
    return base.filter((i) => i.type === 'idea' || i.type === 'note');
  }, [libraryItems, filter, query]);
  const groups = useMemo(() => {
    const grouped = new Map<string, OneItem[]>();
    for (const item of savedItems) { const label = item.category?.trim() || 'Unfiled'; const entries = grouped.get(label); entries ? entries.push(item) : grouped.set(label,[item]); }
    return [...grouped].map(([label, entries]) => ({ label, items: entries }));
  }, [savedItems]);

  return <NeverScreen style={[styles.safe,{ backgroundColor:p.canvas }]} edges={['top','left','right']}>
    <ScrollView contentContainerStyle={[styles.content,p.pageStyle]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets keyboardDismissMode="interactive">
      <Pass3ScreenIntro eyebrow="Library" title={filter === 'Documents' ? 'Documents' : 'Saved'} body="Everything worth keeping, without the file-manager feeling." trailing={<Pressable accessibilityRole="button" accessibilityLabel="Capture a memory" onPress={() => router.push('/(tabs)')} style={({pressed}) => [styles.capture,{backgroundColor:p.graphite,borderRadius:p.radius.button,opacity:pressed?.62:1}]}><OneIcon name={icons.plus} size={18} color={p.onAccent}/></Pressable>} />

      <View style={styles.controls}><V5SearchField value={query} onChangeText={setQuery} placeholder={filter === 'Documents' ? 'Search documents' : 'Search saved memory'} /><V5Segmented options={[...filters]} selected={filter} onSelect={(value) => setFilter(value as typeof filter)} /></View>

      {filter === 'All' && !query.trim() ? <Pass3Section title="Library" meta={`${libraryItems.length} saved`}><View style={[styles.libraryStrip,{borderTopColor:p.separator,borderBottomColor:p.separator}]}>{(['Documents','Images','Links','Ideas'] as const).map((label,index) => <Pressable key={label} accessibilityRole="button" onPress={() => setFilter(label)} style={({pressed}) => [styles.libraryItem,{opacity:pressed?.55:1},index ? {borderLeftColor:p.separator,borderLeftWidth:StyleSheet.hairlineWidth}:null]}><Text style={[styles.libraryCount,{color:p.label}]}>{counts[label]}</Text><Text style={[styles.libraryLabel,{color:p.secondary}]}>{label}</Text></Pressable>)}</View></Pass3Section> : null}

      {filter === 'Documents' ? <DocumentsView groups={documentGroups} summary={documentSummary} selectedFilter={documentFilter} setSelectedFilter={setDocumentFilter}/> : <Pass3Section title={filter === 'All' ? 'Collections' : filter} meta={`${savedItems.length}`}>
        {savedItems.length ? groups.map((group) => <View key={group.label} style={styles.group}><View style={styles.groupHeader}><View><Text style={[styles.groupTitle,{color:p.label}]}>{group.label}</Text><Text style={[styles.groupMeta,{color:p.tertiary}]}>{group.items.length} {group.items.length===1?'memory':'memories'}</Text></View><OneIcon name={icons.saved} size={14} color={p.chrome}/></View><View style={[styles.rows,{borderTopColor:p.separator,borderBottomColor:p.separator}]}>{group.items.map((item,index) => <View key={item.id}><MemoryRow item={item} last={true}/>{index < group.items.length-1 ? <Pass3Divider/>:null}</View>)}</View></View>) : <EmptyState query={query}/>} 
      </Pass3Section>}
    </ScrollView>
  </NeverScreen>;
}

function DocumentsView({groups,summary,selectedFilter,setSelectedFilter}:{groups:{label:string;items:OneItem[]}[];summary:ReturnType<typeof getDocumentSummary>;selectedFilter:'all'|OneDocumentKind;setSelectedFilter:(v:'all'|OneDocumentKind)=>void}) {
  const p=useNeverV5Palette(); const primaryTotal=summary.totals[0];
  return <View style={styles.documents}>
    <Pass3Section title="Document intelligence" meta={summary.monthLabel}><View style={[styles.facts,{borderTopColor:p.separator,borderBottomColor:p.separator}]}><Fact label="Documents" value={String(summary.documents.length)}/><Fact label="Receipts" value={String(summary.receipts)}/><Fact label="Invoices" value={String(summary.invoices)}/><Fact label="Value" value={primaryTotal?formatCurrencyTotal(primaryTotal,'de-DE'):'—'}/></View></Pass3Section>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.documentFilters}>{documentFilters.map((entry)=>{const active=selectedFilter===entry.value;return <Pressable key={entry.value} accessibilityRole="button" onPress={()=>{void Haptics.selectionAsync().catch(()=>undefined);setSelectedFilter(entry.value);}} style={({pressed})=>[styles.filterChip,{borderRadius:p.radius.chip,backgroundColor:active?p.graphite:pressed?p.fill:p.fillSoft,borderColor:active?p.graphite:p.border}]}><Text style={{color:active?p.onAccent:p.secondary,fontSize:12,fontWeight:active?'600':'500'}}>{entry.label}</Text></Pressable>})}</ScrollView>
    {groups.length ? groups.map((group)=><Pass3Section key={group.label} title={group.label} meta={`${group.items.length}`}><View style={[styles.rows,{borderTopColor:p.separator,borderBottomColor:p.separator}]}>{group.items.map((item,index)=><View key={item.id}><DocumentRow item={item}/>{index<group.items.length-1?<Pass3Divider/>:null}</View>)}</View></Pass3Section>) : <EmptyState query="documents"/>}
  </View>;
}
function Fact({label,value}:{label:string;value:string}){const p=useNeverV5Palette();return <View style={styles.fact}><Text style={[styles.factValue,{color:p.label}]}>{value}</Text><Text style={[styles.factLabel,{color:p.tertiary}]}>{label}</Text></View>}
function DocumentRow({item}:{item:OneItem}){const subtitle=[item.merchant,formatKind(item.documentKind),prettyDate(item.date),formatItemAmount(item,'de-DE')].filter(Boolean).join(' · ');return <MemoryRow item={item} subtitle={subtitle} last={true} onPress={()=>router.push({pathname:'/item/[id]',params:{id:item.id}})}/>}
function EmptyState({query}:{query:string}){const p=useNeverV5Palette();return <View style={styles.empty}><OneIcon name={icons.saved} size={20} color={p.chrome}/><Text style={[styles.emptyTitle,{color:p.label}]}>{query.trim()?'Nothing here yet':'A place for what matters'}</Text><Text style={[styles.emptyBody,{color:p.secondary}]}>{query.trim()?'Try another phrase or filter.':'Save a capture and build your personal library.'}</Text></View>}
function formatKind(kind?:OneDocumentKind){if(!kind||kind==='other')return'Document';return kind.split('_').map((part)=>part.charAt(0).toUpperCase()+part.slice(1)).join(' ')}
function prettyDate(iso?:string){if(!iso||!Number.isFinite(new Date(`${iso}T12:00:00`).getTime()))return undefined;return new Intl.DateTimeFormat('en',{month:'short',day:'numeric'}).format(new Date(`${iso}T12:00:00`))}

const styles=StyleSheet.create({
  safe:{flex:1},content:{width:'100%',maxWidth:720,alignSelf:'center',paddingHorizontal:20,paddingTop:18,paddingBottom:126},capture:{width:44,height:44,alignItems:'center',justifyContent:'center'},controls:{gap:10},libraryStrip:{flexDirection:'row',borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth},libraryItem:{flex:1,minHeight:72,alignItems:'center',justifyContent:'center'},libraryCount:{fontSize:18,lineHeight:22,fontWeight:'650'},libraryLabel:{fontSize:10.5,lineHeight:14,marginTop:2},group:{gap:8,marginBottom:22},groupHeader:{paddingHorizontal:2,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},groupTitle:{fontSize:15,lineHeight:19,fontWeight:'600'},groupMeta:{fontSize:11,lineHeight:14,marginTop:2},rows:{borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth},documents:{gap:4},facts:{flexDirection:'row',flexWrap:'wrap',borderTopWidth:StyleSheet.hairlineWidth,borderBottomWidth:StyleSheet.hairlineWidth},fact:{flex:1,minWidth:82,minHeight:66,alignItems:'center',justifyContent:'center'},factValue:{fontSize:16,lineHeight:20,fontWeight:'650'},factLabel:{fontSize:10.5,lineHeight:13,marginTop:2},documentFilters:{gap:7,paddingVertical:4,paddingRight:8},filterChip:{minHeight:44,paddingHorizontal:13,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center'},empty:{minHeight:150,alignItems:'center',justifyContent:'center',paddingHorizontal:24},emptyTitle:{fontSize:16,lineHeight:20,fontWeight:'600',marginTop:10},emptyBody:{fontSize:12.5,lineHeight:18,textAlign:'center',marginTop:4,maxWidth:260}
});
