import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

const milestones = [
  ['hand-back-left-outline','Tiny fingers are forming','Your baby’s fingers and toes are no longer webbed and are starting to develop individual nails.'],
  ['heart','Heartbeat is strong','Beating at about 160 times per minute, the heart is now fully formed and audible via Doppler.'],
  ['walk','Baby can make small movements','Reflexes are developing. Baby may squint, open their mouth, or wiggle their tiny toes.'],
];

export default function GrowthScreen(){return <Screen bottomSpace={105}>
  <Header/>
  <Text style={styles.title}>Week 12: Your baby is{`\n`}growing fast</Text>
  <Text style={styles.subtitle}>You’ve reached a major milestone! The risk of miscarriage drops significantly this week.</Text>
  <View style={styles.hero}><Image source={require('../../assets/images/week12-baby.jpg')} style={styles.heroImage}/><View style={styles.sizeCard}><View><Text style={styles.label}>CURRENT SIZE</Text><Text style={styles.size}>Plum-sized</Text></View><View style={styles.round}><Text style={{fontSize:22}}>👶</Text></View></View></View>
  <View style={styles.stats}><View style={styles.stat}><Ionicons name="resize-outline" size={18} color="#5A5873"/><Text style={styles.statLabel}>Length</Text><Text style={styles.statValue}>5.4 cm</Text></View><View style={styles.stat}><Ionicons name="scale-outline" size={18} color="#5A5873"/><Text style={styles.statLabel}>Weight</Text><Text style={styles.statValue}>14 g</Text></View></View>
  <View style={styles.milestoneCard}><Text style={styles.cardTitle}>This Week’s Milestones</Text>{milestones.map(([icon,title,copy],i)=><View key={title} style={styles.milestone}><View style={[styles.iconBubble,{backgroundColor:i===0?'#F0EEFF':i===1?'#FCECED':'#FFF0E5'}]}><MaterialCommunityIcons name={icon as any} size={24} color="#75595E"/></View><View style={{flex:1}}><Text style={styles.milestoneTitle}>{title}</Text><Text style={styles.milestoneCopy}>{copy}</Text></View></View>)}</View>
  <Button label="Log Symptoms  +" onPress={()=>router.push('/(tabs)/log')} style={{marginTop:20}}/>
  <AnimatedPressable onPress={()=>router.push('/timeline')} style={styles.timelineLink}><Text style={styles.timelineText}>View pregnancy timeline</Text><Ionicons name="chevron-forward" size={20} color={colors.plum}/></AnimatedPressable>
</Screen>}
const styles=StyleSheet.create({title:{...type.title,fontSize:31,lineHeight:38,color:'#755E61',marginTop:24},subtitle:{...type.body,color:'#514648',marginTop:8,marginBottom:18},hero:{borderRadius:24,overflow:'hidden',height:430,position:'relative'},heroImage:{width:'100%',height:'100%'},sizeCard:{position:'absolute',left:18,right:18,bottom:18,borderRadius:16,backgroundColor:'rgba(238,236,238,.75)',padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},label:{...type.section,color:'#8A7479'},size:{...type.body,fontSize:20,color:'#755E61',marginTop:3},round:{width:58,height:58,borderRadius:29,backgroundColor:'#FFDDE3',alignItems:'center',justifyContent:'center'},stats:{flexDirection:'row',gap:14,marginTop:18},stat:{flex:1,borderRadius:22,backgroundColor:colors.surface,padding:22,minHeight:128},statLabel:{...type.body,color:'#67627B',marginTop:8},statValue:{...type.body,fontSize:20,color:'#755E61',marginTop:10},milestoneCard:{backgroundColor:colors.surface,borderRadius:26,padding:22,marginTop:18},cardTitle:{...type.body,fontSize:18,color:'#755E61',marginBottom:12},milestone:{flexDirection:'row',gap:14,marginBottom:20},iconBubble:{width:52,height:52,borderRadius:26,alignItems:'center',justifyContent:'center'},milestoneTitle:{...type.bodyStrong,color:'#1F1A1A'},milestoneCopy:{...type.body,color:'#4D4545',marginTop:2},timelineLink:{height:58,borderRadius:20,backgroundColor:colors.surface,marginTop:12,paddingHorizontal:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},timelineText:{...type.bodyStrong,color:colors.plum}});
