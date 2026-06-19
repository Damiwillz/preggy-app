import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

export default function CurrentStatusScreen() {
  return (
    <Screen bottomSpace={44}>
      <Header title="Current Status" back />
      <View style={styles.hero}>
        <Image source={require('../../assets/images/tips-status-hero.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(34,24,20,.78)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.heroText}><Text style={styles.kicker}>CURRENT PROGRESS</Text><Text style={styles.heroTitle}>12 Weeks, 4 Days</Text></View>
      </View>
      <View style={styles.heroStats}>
        <View style={styles.stat}><View style={styles.dot} /><Text style={styles.statText}>Second Trimester starts soon</Text></View>
        <View style={styles.stat}><Text style={styles.statNumber}>88</Text><Text style={styles.statText}>Days Logged</Text></View>
      </View>

      <View style={styles.actions}>
        <AnimatedPressable onPress={() => router.push('/(tabs)/log')} style={[styles.action, { backgroundColor: '#F9DDE2' }]}>
          <Ionicons name="happy-outline" size={20} color={colors.plum} /><Text style={styles.actionText}>Log Today’s Mood</Text>
        </AnimatedPressable>
        <AnimatedPressable onPress={() => router.push('/(tabs)/log')} style={[styles.action, { backgroundColor: '#E7E6FF' }]}>
          <Ionicons name="create-outline" size={20} color={colors.plum} /><Text style={styles.actionText}>Add Daily Note</Text>
        </AnimatedPressable>
      </View>

      <Text style={styles.sectionTitle}>Today’s Focus</Text>
      <View style={styles.card}>
        <View style={styles.cardHeading}><View style={styles.iconBubble}><Ionicons name="fitness-outline" size={22} color={colors.plum} /></View><Text style={styles.cardTitle}>Physical Wellness</Text></View>
        <View style={styles.metricRow}><Text style={styles.metricLabel}>Hydration</Text><Text style={styles.metricValue}>6/8 glasses</Text></View>
        <View style={styles.track}><View style={[styles.fill, { width: '75%' }]} /></View>
        <View style={styles.metricRow}><Text style={styles.metricLabel}>Movement</Text><Text style={styles.metricValue}>20 min completed</Text></View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeading}><View style={[styles.iconBubble, { backgroundColor: '#FFF2E9' }]}><Ionicons name="heart-outline" size={22} color="#8A624C" /></View><Text style={styles.cardTitle}>Emotional Check-in</Text></View>
        <View style={styles.moodRow}><View><Text style={styles.smallLabel}>Current Mood</Text><Text style={styles.mood}>Calm & Happy</Text></View><Text style={styles.emoji}>😊</Text></View>
      </View>

      <View style={styles.growthCard}>
        <View style={styles.growthTop}><Text style={styles.growthTitle}>Baby’s Daily Growth</Text><View style={styles.dayBadge}><Text style={styles.smallLabel}>Day</Text><Text style={styles.day}>88</Text></View></View>
        <View style={styles.growthBody}>
          <Image source={require('../../assets/images/tips-status-baby.jpg')} style={styles.babyImage} resizeMode="cover" />
          <Text style={styles.quote}>“Your baby is busy developing tiny taste buds and practicing swallowing!”</Text>
        </View>
      </View>

      <View style={styles.milestone}>
        <View><Text style={styles.kickerDark}>NEXT MAJOR MILESTONE</Text><Text style={styles.milestoneTitle}>Anatomy Scan</Text><Text style={styles.copy}>October 24, 2024 • in 8 weeks</Text></View>
        <View style={styles.milestoneIcon}><Ionicons name="calendar-outline" size={24} color={colors.plum} /></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 270, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden', marginTop: 12, justifyContent: 'flex-end' },
  heroText: { padding: 22 },
  kicker: { ...type.section, color: '#fff' },
  heroTitle: { ...type.hero, color: '#fff', marginTop: 4 },
  heroStats: { marginTop: -1, flexDirection: 'row', backgroundColor: colors.surface, borderBottomLeftRadius: 26, borderBottomRightRadius: 26, padding: 18, justifyContent: 'space-between', borderWidth: 1, borderTopWidth: 0, borderColor: colors.line },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 9, maxWidth: '48%' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F8D6DE' },
  statText: { ...type.small, color: colors.text, flexShrink: 1 },
  statNumber: { ...type.title, fontSize: 25, color: colors.plum },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  action: { flex: 1, minHeight: 54, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  actionText: { ...type.small, color: colors.plum },
  sectionTitle: { ...type.title, fontSize: 25, color: colors.ink, marginTop: 25, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.line },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 16 },
  iconBubble: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.softSurface, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { ...type.bodyStrong, fontSize: 18, color: colors.ink },
  metricRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5 },
  metricLabel: { ...type.body, color: colors.text },
  metricValue: { ...type.bodyStrong, color: colors.text },
  track: { height: 7, backgroundColor: '#EEE8E6', borderRadius: 4, marginVertical: 10, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#786064', borderRadius: 4 },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallLabel: { ...type.small, color: colors.text },
  mood: { ...type.title, fontSize: 23, color: '#8A624C', marginTop: 2 },
  emoji: { fontSize: 44 },
  growthCard: { backgroundColor: '#FFF3F2', borderRadius: 26, padding: 20, borderWidth: 1, borderColor: '#ECDAD8' },
  growthTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  growthTitle: { ...type.title, fontSize: 25, color: colors.text, maxWidth: 190 },
  dayBadge: { width: 72, borderRadius: 14, backgroundColor: colors.surface, padding: 10 },
  day: { ...type.bodyStrong, fontSize: 18, color: colors.text },
  growthBody: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 18 },
  babyImage: { width: 112, height: 112, borderRadius: 56, borderWidth: 7, borderColor: '#fff' },
  quote: { ...type.body, color: colors.text, flex: 1, fontSize: 18, lineHeight: 27 },
  milestone: { marginTop: 16, borderRadius: 22, padding: 18, backgroundColor: '#F0EEFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kickerDark: { ...type.section, color: colors.plum },
  milestoneTitle: { ...type.bodyStrong, fontSize: 20, color: colors.ink, marginTop: 3 },
  copy: { ...type.small, color: colors.text, marginTop: 4 },
  milestoneIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
