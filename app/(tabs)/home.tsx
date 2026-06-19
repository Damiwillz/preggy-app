import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { CalendarIcon, HeartIcon, WaterIcon } from '@/components/ui/icons';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { wisdom } from '@/data/mockData';

export default function HomeScreen() {
  return (
    <Screen>
      <Header />
      <Text style={styles.eyebrow}>CURRENT PROGRESS</Text>
      <Text style={styles.title}>You’re glowing, Mama</Text>
      <LinearGradient colors={[colors.blush, '#FFF3EF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <View style={styles.progressTop}><Text style={styles.muted}>Current Stage</Text><Text style={styles.week}>Week 12</Text></View>
        <View style={styles.progressBar}><View style={styles.progressFill} /></View>
        <View style={styles.progressBottom}><Text style={styles.muted}>Completion</Text><Text style={styles.percent}>31%</Text></View>
        <Text style={styles.days}>193 days to go</Text><Text style={styles.daysSub}>Until your big day</Text>
      </LinearGradient>
      <Card style={styles.development}>
        <View style={styles.cardHeader}><Text style={styles.section}>Baby Development</Text><Text style={styles.badge}>UPDATE</Text></View>
        <View style={styles.limeWrap}><View style={styles.lime}><Text style={styles.limeText}>🍋‍🟩</Text></View><View style={{ flex: 1 }}><Text style={styles.copy}>Your baby is currently the size of a</Text><Text style={styles.limeTitle}>Lime</Text><Text style={styles.copy}>Weight: ~14g | Length: ~5.4cm</Text></View></View>
      </Card>
      <AnimatedPressable onPress={() => router.push('/appointment/details')}>
        <Card style={styles.milestone}>
          <View style={styles.iconBubble}><CalendarIcon color={colors.plum} /></View>
          <View style={{ flex: 1 }}><Text style={styles.section}>NEXT MILESTONE</Text><Text style={styles.mileTitle}>First trimester almost complete</Text><Text style={styles.copy}>Just 2 weeks until you reach the golden second trimester!</Text></View>
        </Card>
      </AnimatedPressable>
      <Text style={styles.heading}>Today’s Wisdom</Text>
      <View style={styles.wisdomGrid}>{wisdom.map((item, index) => <Card key={item.title} style={styles.wisdom}><View style={styles.wisdomIcon}>{index === 0 ? <WaterIcon /> : <HeartIcon />}</View><Text style={styles.wisdomTitle}>{item.title}</Text><Text style={styles.copy}>{item.body}</Text></Card>)}</View>
      <Text style={styles.heading}>Explore your journey</Text>
      <View style={styles.actions}>
        <AnimatedPressable onPress={() => router.push('/medication')} style={styles.actionCard}><Ionicons name="medical-outline" size={26} color={colors.plum}/><Text style={styles.actionTitle}>Medication</Text><Text style={styles.copy}>Track supplements and doses</Text></AnimatedPressable>
        <AnimatedPressable onPress={() => router.push('/timeline')} style={styles.actionCard}><Ionicons name="git-branch-outline" size={26} color={colors.plum}/><Text style={styles.actionTitle}>Timeline</Text><Text style={styles.copy}>See every milestone ahead</Text></AnimatedPressable>
      </View>
      <Button label="Log symptoms" onPress={() => router.push('/(tabs)/log')} style={{ marginTop: 18 }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  eyebrow: { ...type.section, color: colors.rose, marginTop: 22 },
  title: { ...type.title, color: colors.ink, marginTop: 4, marginBottom: 18 },
  heroCard: { borderRadius: 32, padding: 22, overflow: 'hidden' },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  muted: { ...type.small, color: colors.text },
  week: { ...type.title, color: colors.plum },
  progressBar: { height: 12, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.8)', marginVertical: 16, overflow: 'hidden' },
  progressFill: { width: '31%', height: '100%', borderRadius: 99, backgroundColor: colors.plum },
  progressBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  percent: { ...type.bodyStrong, color: colors.plum },
  days: { ...type.title, color: colors.ink, marginTop: 20 },
  daysSub: { ...type.small, color: colors.text },
  development: { marginTop: 18 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  section: { ...type.section, color: colors.rose },
  badge: { ...type.tiny, color: colors.plum, backgroundColor: colors.softSurface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  limeWrap: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  lime: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#E8F0D5', alignItems: 'center', justifyContent: 'center' },
  limeText: { fontSize: 35 },
  limeTitle: { ...type.title, color: colors.plum },
  copy: { ...type.small, color: colors.text },
  milestone: { marginTop: 18, flexDirection: 'row', gap: 15, alignItems: 'center' },
  iconBubble: { width: 54, height: 54, borderRadius: 22, backgroundColor: colors.softSurface, alignItems: 'center', justifyContent: 'center' },
  mileTitle: { ...type.bodyStrong, color: colors.ink, marginVertical: 4 },
  heading: { ...type.bodyStrong, color: colors.ink, marginTop: 24, marginBottom: 12 },
  wisdomGrid: { flexDirection: 'row', gap: 12 },
  wisdom: { flex: 1, minHeight: 142 },
  wisdomIcon: { width: 42, height: 42, borderRadius: 16, backgroundColor: colors.softSurface, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  wisdomTitle: { ...type.bodyStrong, color: colors.ink, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 22, padding: 18, minHeight: 130, borderWidth: 1, borderColor: colors.line },
  actionTitle: { ...type.bodyStrong, color: colors.ink, marginTop: 10, marginBottom: 4 }
});
