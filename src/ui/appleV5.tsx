import { resolveMaterialAppearance } from '@/src/theme/editions';
import { NeverInput } from '@/src/ui/NeverInput';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverMaterial, NeverPressable, selectionFeedback } from '@/src/ui/material';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';

type IconName = (typeof icons)[keyof typeof icons];

export function useNeverV5Palette() {
  const { resolvedMode, reduceTransparency } = useThemePreference();
  const dark = resolvedMode === 'dark';
  const t = useTheme();
  const cardAppearance = resolveMaterialAppearance(t, 'card', { reduceTransparency });
  const inputAppearance = resolveMaterialAppearance(t, 'input', { reduceTransparency });
  const modalAppearance = resolveMaterialAppearance(t, 'modal', { reduceTransparency });
  const pageStyle: ViewStyle = { paddingHorizontal: t.spacing.page, gap: t.spacing.section };
  return {
    dark, canvas: t.background, surface: cardAppearance.style.backgroundColor, elevated: modalAppearance.style.backgroundColor,
    fill: t.fillStrong, fillSoft: t.accentSoft, label: t.text, secondary: t.textSecondary,
    tertiary: t.textTertiary, separator: t.border, border: t.border, graphite: t.accent,
    chrome: t.chrome, chromeSoft: t.chromeSoft, warning: t.warning,
    success: t.success, danger: t.danger, glass: t.glassStrong,
    glassBorder: t.glassBorder, reflection: t.reflection, shadow: t.shadow,
    onAccent: t.onAccent, heading: t.typography.heading, wordmark: t.typography.wordmark,
    radius: t.radius, cardStyle: cardAppearance.style, inputStyle: inputAppearance.style,
    pageStyle,
    rowHeight: t.spacing.row
  } as const;
}

export function V5Wordmark() { const p=useNeverV5Palette(); return <View style={styles.wordmarkRow}><Text style={[styles.wordmark,p.wordmark,{color:p.label}]}>NEVER</Text><View style={styles.signal}><View style={[styles.signalLong,{backgroundColor:p.chrome}]}/><View style={[styles.signalShort,{backgroundColor:p.tertiary}]}/></View></View> }
export function V5LargeHeader({eyebrow,title,subtitle,action}:{eyebrow?:string;title:string;subtitle?:string;action?:ReactNode}){const p=useNeverV5Palette();return <View style={styles.largeHeader}><View style={{flex:1,minWidth:0}}>{eyebrow?<Text style={[styles.eyebrow,{color:p.secondary}]}>{eyebrow}</Text>:null}<Text accessibilityRole="header" style={[styles.largeTitle,p.heading,{color:p.label}]}>{title}</Text>{subtitle?<Text style={[styles.subtitle,{color:p.secondary}]}>{subtitle}</Text>:null}</View>{action}</View>}
export function V5SectionHeader({title,meta,action}:{title:string;meta?:string;action?:ReactNode}){const p=useNeverV5Palette();return <View style={styles.sectionHeader}><Text accessibilityRole="header" style={[styles.sectionTitle,{color:p.label}]}>{title}</Text><View style={styles.sectionRight}>{meta?<Text style={[styles.sectionMeta,{color:p.tertiary}]}>{meta}</Text>:null}{action}</View></View>}
export function V5Chevron(){const p=useNeverV5Palette();return <OneIcon name={icons.chevron} size={13} color={p.tertiary}/>}
export function V5IconButton({icon,onPress,accessibilityLabel}:{icon:IconName;onPress:()=>void;accessibilityLabel:string}){const p=useNeverV5Palette();return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({pressed})=>[styles.iconButton,{backgroundColor:pressed?p.fillSoft:'transparent',borderRadius:p.radius.icon}]}><OneIcon name={icon} size={17} color={p.label}/></Pressable>}
export function V5SearchField({value,onChangeText,placeholder='Search',ask=false,onSubmit}:{value:string;onChangeText:(v:string)=>void;placeholder?:string;ask?:boolean;onSubmit?:()=>void}){const p=useNeverV5Palette();return <View style={[styles.search,p.inputStyle,{borderRadius:p.radius.button}]}><OneIcon name={ask?icons.ask:icons.search} size={16} color={p.chrome}/><NeverInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={p.tertiary} style={[styles.searchInput,{color:p.label}]} returnKeyType="search" onSubmitEditing={onSubmit}/>{value?<Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={()=>onChangeText('')} style={styles.clear}><OneIcon name={icons.close} size={14} color={p.tertiary}/></Pressable>:null}</View>}
export function V5Segmented({options,selected,onSelect}:{options:readonly string[];selected:string;onSelect:(v:string)=>void}){const p=useNeverV5Palette();return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segmented}>{options.map((option)=>{const active=option===selected;return <NeverPressable key={option} accessibilityRole="button" accessibilityState={{selected:active}} onPress={()=>{selectionFeedback();onSelect(option)}} style={[styles.segment,{borderRadius:p.radius.chip,backgroundColor:active?p.graphite:p.fillSoft,borderColor:active?p.graphite:p.border}]}><Text style={[styles.segmentText,{color:active?p.onAccent:p.secondary}]}>{option}</Text></NeverPressable>})}</ScrollView>}
export function V5MaterialCard({children,style}:{children:ReactNode;style?:ViewStyle}){return <NeverMaterial role="card" style={style}>{children}</NeverMaterial>}
export function V5Group({children,style}:{children:ReactNode;style?:ViewStyle}){const p=useNeverV5Palette();return <View style={[styles.group,p.cardStyle,{borderRadius:p.radius.card},style]}>{children}</View>}

const styles=StyleSheet.create({wordmarkRow:{flexDirection:'row',alignItems:'center',gap:8},wordmark:{fontSize:13,lineHeight:16,fontWeight:'700'},signal:{gap:2},signalLong:{width:11,height:1.5,borderRadius:2},signalShort:{width:7,height:1.5,borderRadius:2},largeHeader:{flexDirection:'row',alignItems:'flex-start',justifyContent:'space-between',gap:16},eyebrow:{fontSize:11,lineHeight:14,fontWeight:'600',letterSpacing:.8,textTransform:'uppercase'},largeTitle:{fontSize:38,lineHeight:43,fontWeight:'600',letterSpacing:-1.2,marginTop:4},subtitle:{fontSize:14,lineHeight:20,marginTop:6,maxWidth:520},sectionHeader:{minHeight:30,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},sectionTitle:{fontSize:17,lineHeight:21,fontWeight:'600'},sectionRight:{flexDirection:'row',alignItems:'center',gap:8},sectionMeta:{fontSize:12,lineHeight:16},iconButton:{width:44,height:44,alignItems:'center',justifyContent:'center'},search:{minHeight:50,borderWidth:StyleSheet.hairlineWidth,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:9},searchInput:{flex:1,minHeight:44,fontSize:15,lineHeight:19,paddingVertical:0},clear:{width:32,height:44,alignItems:'center',justifyContent:'center'},segmented:{gap:7,paddingVertical:2},segment:{minHeight:44,paddingHorizontal:14,borderWidth:StyleSheet.hairlineWidth,alignItems:'center',justifyContent:'center'},segmentText:{fontSize:12,lineHeight:16,fontWeight:'600'},group:{overflow:'hidden',borderWidth:StyleSheet.hairlineWidth}});
