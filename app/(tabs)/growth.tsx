import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

const milestones = [
  {
    icon: 'hand-back-left-outline',
    title: 'Tiny fingers are forming',
    copy: 'Fingers and toes are becoming more defined, with tiny nails beginning to develop.',
    tint: '#F0EEFF',
  },
  {
    icon: 'heart',
    title: 'Heartbeat is strong',
    copy: 'Baby’s heart is beating quickly and may be heard during some prenatal visits.',
    tint: '#FFF0F1',
  },
  {
    icon: 'walk',
    title: 'Small movements begin',
    copy: 'Reflexes are developing, even if you cannot feel those little wiggles yet.',
    tint: '#FFF0E5',
  },
] as const;

export default function GrowthScreen() {
  return (
    <Screen bottomSpace={105}>
      <Header />

      <View style={styles.heading}>
        <Text style={styles.eyebrow}>WEEKLY GROWTH</Text>
        <Text style={styles.title}>Week 12: baby is growing fast</Text>
        <Text style={styles.subtitle}>
          You’ve reached a beautiful milestone. Here’s what may be developing this week.
        </Text>
      </View>

      <View style={styles.hero}>
        <Image
          source={require('../../assets/images/week12-baby.jpg')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        <View style={styles.heroShade} />

        <View style={styles.weekBadge}>
          <Text style={styles.weekBadgeText}>12w</Text>
        </View>

        <View style={styles.sizeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>CURRENT SIZE</Text>
            <Text style={styles.size}>Plum-sized</Text>
            <Text style={styles.sizeCopy}>About 5.4 cm and 14 g</Text>
          </View>

          <View style={styles.round}>
            <Text style={{ fontSize: 24 }}>👶</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <View>
            <Text style={styles.progressLabel}>Pregnancy progress</Text>
            <Text style={styles.progressTitle}>30% complete</Text>
          </View>

          <Text style={styles.progressValue}>84 / 280</Text>
        </View>

        <View style={styles.track}>
          <View style={styles.fill} />
        </View>

        <View style={styles.progressFooter}>
          <Text style={styles.progressMini}>Week 1</Text>
          <Text style={styles.progressMini}>Due date</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <View style={styles.statIcon}>
            <Ionicons name="resize-outline" size={20} color={colors.plum} />
          </View>
          <Text style={styles.statLabel}>Length</Text>
          <Text style={styles.statValue}>5.4 cm</Text>
        </View>

        <View style={styles.stat}>
          <View style={styles.statIcon}>
            <Ionicons name="scale-outline" size={20} color={colors.plum} />
          </View>
          <Text style={styles.statLabel}>Weight</Text>
          <Text style={styles.statValue}>14 g</Text>
        </View>
      </View>

      <View style={styles.milestoneCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>This week’s milestones</Text>
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>3 updates</Text>
          </View>
        </View>

        {milestones.map((item, index) => (
          <View key={item.title} style={[styles.milestone, index < milestones.length - 1 && styles.milestoneDivider]}>
            <View style={[styles.iconBubble, { backgroundColor: item.tint }]}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color={colors.plum} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.milestoneTitle}>{item.title}</Text>
              <Text style={styles.milestoneCopy}>{item.copy}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <AnimatedPressable onPress={() => router.push('/log-symptoms' as never)} style={styles.primaryButton}>
          <Ionicons name="add-circle-outline" size={21} color="#fff" />
          <Text style={styles.primaryButtonText}>Log symptoms</Text>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.push('/(tabs)/timeline' as never)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Timeline</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.plum} />
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 22,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
    color: '#CE6F79',
  },
  title: {
    ...type.title,
    fontSize: 31,
    lineHeight: 37,
    color: colors.ink,
    marginTop: 5,
    letterSpacing: -0.6,
  },
  subtitle: {
    ...type.body,
    color: colors.text,
    marginTop: 8,
    lineHeight: 23,
  },
  hero: {
    height: 410,
    borderRadius: 34,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    backgroundColor: '#FFF0F1',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(52,28,34,0.08)',
  },
  weekBadge: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeText: {
    ...type.bodyStrong,
    color: '#fff',
    fontSize: 18,
  },
  sizeCard: {
    margin: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(255,248,245,0.88)',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...type.section,
    color: '#CE6F79',
  },
  size: {
    ...type.title,
    fontSize: 26,
    color: colors.ink,
    marginTop: 4,
  },
  sizeCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 4,
    fontWeight: '800',
  },
  round: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#FFDDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  progressLabel: {
    ...type.tiny,
    color: '#CE6F79',
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  progressTitle: {
    ...type.title,
    fontSize: 25,
    color: colors.ink,
    marginTop: 4,
  },
  progressValue: {
    ...type.small,
    color: colors.text,
    fontWeight: '900',
    marginTop: 3,
  },
  track: {
    height: 13,
    borderRadius: 999,
    backgroundColor: '#FFF0F1',
    marginTop: 18,
    overflow: 'hidden',
  },
  fill: {
    width: '30%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#CE6F79',
  },
  progressFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMini: {
    ...type.tiny,
    color: colors.muted,
    fontWeight: '900',
  },
  stats: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 16,
  },
  stat: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: colors.surface,
    padding: 18,
    minHeight: 126,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    ...type.small,
    color: colors.text,
    marginTop: 12,
    fontWeight: '800',
  },
  statValue: {
    ...type.title,
    fontSize: 24,
    color: colors.plum,
    marginTop: 4,
  },
  milestoneCard: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    ...type.title,
    fontSize: 24,
    color: colors.ink,
  },
  cardBadge: {
    backgroundColor: '#FFF0F1',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  cardBadgeText: {
    ...type.tiny,
    color: '#CE6F79',
    fontWeight: '900',
  },
  milestone: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
  },
  milestoneDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneTitle: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  milestoneCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 4,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  primaryButton: {
    flex: 1.25,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...type.bodyStrong,
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#FFF0F1',
    borderWidth: 1,
    borderColor: '#EFDCDD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    ...type.bodyStrong,
    color: colors.plum,
  },
});
