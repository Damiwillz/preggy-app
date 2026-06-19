import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const C={bg:'#FFF9F6',ink:'#171214',body:'#655556',plum:'#765A61',blush:'#FFD9D3',line:'#E9D8D4'};
export default function PersonalGuidance(){const login=()=>router.replace('/auth/log-in');return <View style={s.screen}>
 <StatusBar style="dark"/>
 <View style={s.heroWrap}><Image source={require('../../assets/images/onboarding-guidance-photo.jpg')} style={s.hero} resizeMode="cover"/><SafeAreaView style={s.top} edges={['top']}><View style={s.topRow}><View style={s.brandRow}><Ionicons name="leaf" size={25} color={C.plum}/><Text style={s.brand}>Preggers</Text></View><Pressable onPress={login} hitSlop={14}><Text style={s.topSkip}>Skip</Text></Pressable></View></SafeAreaView></View>
 <View style={s.sheet}>
   <Text style={s.title}>Your personal guide to{`\n`}motherhood</Text>
   <Text style={s.copy}>Get daily health tips, nutrition advice, and trimester-specific insights tailored to your unique journey.</Text>
   <View style={s.cards}>
    <View style={s.card}><Ionicons name="nutrition-outline" size={27} color={C.plum}/><Text style={s.cardTitle}>Nutrition Guide</Text><Text style={s.cardCopy}>Trimester tips</Text></View>
    <View style={s.card}><Ionicons name="fitness-outline" size={27} color={C.plum}/><Text style={s.cardTitle}>Daily Wellness</Text><Text style={s.cardCopy}>Low impact yoga</Text></View>
   </View>
   <View style={s.dots}><View style={s.dot}/><View style={s.dot}/><View style={s.activeDot}/></View>
   <Pressable onPress={login} style={({pressed})=>[s.primary,pressed&&s.pressed]}><Text style={s.primaryText}>Get Started</Text><Ionicons name="arrow-forward" size={25} color="#604A50"/></Pressable>
   <Pressable onPress={login} style={s.link}><Text style={s.linkText}>I already have an account</Text></Pressable>
 </View>
 </View>}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:C.bg},heroWrap:{height:'49%',overflow:'hidden'},hero:{width:'100%',height:'100%'},top:{position:'absolute',left:0,right:0,top:0},topRow:{paddingHorizontal:24,paddingTop:4,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},brandRow:{flexDirection:'row',alignItems:'center',gap:7},brand:{fontFamily:'Avenir Next',fontSize:28,fontWeight:'700',color:C.plum},topSkip:{fontFamily:'Avenir Next',fontSize:16,fontWeight:'700',color:C.plum},sheet:{position:'absolute',left:0,right:0,bottom:0,minHeight:'56%',backgroundColor:C.bg,borderTopLeftRadius:40,borderTopRightRadius:40,paddingHorizontal:26,paddingTop:29,paddingBottom:20,alignItems:'center'},title:{fontFamily:'Avenir Next',fontSize:29,lineHeight:36,fontWeight:'800',letterSpacing:-.6,textAlign:'center',color:C.ink},copy:{fontFamily:'Avenir Next',fontSize:17,lineHeight:26,fontWeight:'500',textAlign:'center',color:C.body,marginTop:18,maxWidth:365},cards:{width:'100%',flexDirection:'row',gap:14,marginTop:24},card:{flex:1,minHeight:116,borderRadius:19,borderWidth:1,borderColor:C.line,backgroundColor:'rgba(255,255,255,.45)',padding:16,justifyContent:'center'},cardTitle:{fontFamily:'Avenir Next',fontSize:16,fontWeight:'800',color:C.ink,marginTop:9},cardCopy:{fontFamily:'Avenir Next',fontSize:13,fontWeight:'600',color:'#8D7779',marginTop:3},dots:{flexDirection:'row',gap:8,alignItems:'center',marginTop:21,marginBottom:20},dot:{width:8,height:8,borderRadius:4,backgroundColor:'#E1D6D4'},activeDot:{width:34,height:8,borderRadius:4,backgroundColor:C.plum},primary:{height:64,width:'100%',borderRadius:32,backgroundColor:C.blush,flexDirection:'row',gap:10,alignItems:'center',justifyContent:'center',shadowColor:'#75585B',shadowOpacity:.12,shadowRadius:14,shadowOffset:{width:0,height:7}},pressed:{transform:[{scale:.98}],opacity:.92},primaryText:{fontFamily:'Avenir Next',fontSize:19,fontWeight:'700',color:'#604A50'},link:{height:48,justifyContent:'center',paddingHorizontal:20},linkText:{fontFamily:'Avenir Next',fontSize:16,fontWeight:'700',color:'#3B3337'}});
