import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const C={bg:'#FFF9F6',ink:'#171214',body:'#5E5052',plum:'#765A61',blush:'#FFD9D3',line:'#E9DEDB'};

export default function TrackMilestones(){
 return <View style={s.screen}>
   <StatusBar style="dark"/>
   <View style={s.heroWrap}>
     <Image source={require('../../assets/images/onboarding-milestones-photo.jpg')} style={s.hero} resizeMode="cover"/>
     <SafeAreaView style={s.brandSafe} edges={['top']}><View style={s.brandRow}><Ionicons name="leaf-outline" size={27} color={C.plum}/><Text style={s.brand}>Preggers</Text></View></SafeAreaView>
   </View>
   <View style={s.sheet}>
     <View style={s.handle}/>
     <Text style={s.title}>Track every milestone{`\n`}with confidence</Text>
     <Text style={s.copy}>From the first heartbeat to your due date, we’re with you every step of the way with medical insights and warm guidance.</Text>
     <View style={s.dots}><View style={s.dot}/><View style={s.activeDot}/><View style={s.dot}/></View>
     <Pressable onPress={()=>router.push('/onboarding/personal-guidance')} style={({pressed})=>[s.primary,pressed&&s.pressed]}><Text style={s.primaryText}>Next</Text><Ionicons name="arrow-forward" size={25} color="#604A50"/></Pressable>
     <Pressable onPress={()=>router.replace('/auth/log-in')} style={s.skip}><Text style={s.skipText}>Skip for now</Text></Pressable>
   </View>
 </View>
}
const s=StyleSheet.create({screen:{flex:1,backgroundColor:C.bg},heroWrap:{height:'54%',overflow:'hidden'},hero:{width:'100%',height:'100%'},brandSafe:{position:'absolute',top:0,left:0,right:0},brandRow:{alignSelf:'center',flexDirection:'row',alignItems:'center',gap:7,marginTop:4},brand:{fontFamily:'Avenir Next',fontSize:29,fontWeight:'700',color:C.plum},sheet:{position:'absolute',left:0,right:0,bottom:0,minHeight:'51%',backgroundColor:C.bg,borderTopLeftRadius:40,borderTopRightRadius:40,paddingHorizontal:28,paddingTop:17,paddingBottom:22,alignItems:'center'},handle:{width:48,height:5,borderRadius:3,backgroundColor:C.line,marginBottom:28},title:{fontFamily:'Avenir Next',fontSize:30,lineHeight:36,fontWeight:'800',letterSpacing:-.6,textAlign:'center',color:C.ink},copy:{fontFamily:'Avenir Next',fontSize:17,lineHeight:26,fontWeight:'500',textAlign:'center',color:C.body,marginTop:19,maxWidth:360},dots:{flexDirection:'row',gap:8,alignItems:'center',marginTop:27,marginBottom:24},dot:{width:8,height:8,borderRadius:4,backgroundColor:'#E5D9D7'},activeDot:{width:34,height:8,borderRadius:4,backgroundColor:'#D7A4AC'},primary:{height:64,width:'100%',borderRadius:32,backgroundColor:C.blush,flexDirection:'row',gap:10,alignItems:'center',justifyContent:'center',shadowColor:'#75585B',shadowOpacity:.12,shadowRadius:14,shadowOffset:{width:0,height:7}},pressed:{transform:[{scale:.98}],opacity:.92},primaryText:{fontFamily:'Avenir Next',fontSize:20,fontWeight:'700',color:'#604A50'},skip:{height:50,justifyContent:'center',paddingHorizontal:20},skipText:{fontFamily:'Avenir Next',fontSize:17,fontWeight:'700',color:'#3B3337'}});
