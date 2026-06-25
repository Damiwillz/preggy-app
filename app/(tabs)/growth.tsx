import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const milestones = [
  {
    icon: 'hand-back-left-outline',
    title: 'Tiny fingers are forming',
    copy: 'Fingers and toes are becoming more defined, with tiny nails beginning to develop.',
  },
  {
    icon: 'heart',
    title: 'Heartbeat is strong',
    copy: 'Baby’s heart is beating quickly and may be heard during some prenatal visits.',
  },
  {
    icon: 'walk',
    title: 'Small movements begin',
    copy: 'Reflexes are developing, even if you cannot feel those little wiggles yet.',
  },
] as const;

export default function GrowthScreen() {
  const { palette } = useAppTheme();

  return (
    <Screen bottomSpace={105}>
      <Header />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>WEEKLY GROWTH</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Week 12: baby is growing fast</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          You’ve reached a beautiful milestone. Here’s what may be developing this week.
        </Text>
      </View>

      <View style={[styles.hero, { backgroundColor: palette.accentSoft }]}>
        <Image
          source={require('../../assets/images/week12-baby.jpg')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        <View style={styles.heroShade} />

        <View style={[styles.weekBadge, { backgroundColor: palette.accent }]}>
          <Text style={[styles.weekBadgeText, { color: palette.onAccent }]}>12w</Text>
        </View>

        <View style={styles.sizeCard}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: palette.accent }]}>CURRENT SIZE</Text>
            <Text style={[styles.size, { color: palette.ink }]}>Plum-sized</Text>
            <Text style={[styles.sizeCopy, { color: palette.text }]}>About 5.4 cm and 14 g</Text>
          </View>

          <View style={[styles.round, { backgroundColor: palette.accentSoft }]}>
            <Text style={{ fontSize: 24 }}>👶</Text>
          </View>
        </View>
      </View>

      <View style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.progressTop}>
          <View>
            <Text style={[styles.progressLabel, { color: palette.accent }]}>Pregnancy progress</Text>
            <Text style={[styles.progressTitle, { color: palette.ink }]}>30% complete</Text>
          </View>

          <Text style={[styles.progressValue, { color: palette.text }]}>84 / 280</Text>
        </View>

        <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.fill, { backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.progressFooter}>
          <Text style={[styles.progressMini, { color: palette.muted }]}>Week 1</Text>
          <Text style={[styles.progressMini, { color: palette.muted }]}>Due date</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={[styles.stat, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.statIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="resize-outline" size={20} color={palette.accent} />
          </View>
          <Text style={[styles.statLabel, { color: palette.text }]}>Length</Text>
          <Text style={[styles.statValue, { color: palette.accent }]}>5.4 cm</Text>
        </View>

        <View style={[styles.stat, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.statIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="scale-outline" size={20} color={palette.accent} />
          </View>
          <Text style={[styles.statLabel, { color: palette.text }]}>Weight</Text>
          <Text style={[styles.statValue, { color: palette.accent }]}>14 g</Text>
        </View>
      </View>

      <View style={[styles.milestoneCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: palette.ink }]}>This week’s milestones</Text>
          <View style={[styles.cardBadge, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.cardBadgeText, { color: palette.accent }]}>3 updates</Text>
          </View>
        </View>

        {milestones.map((item, index) => (
          <View
            key={item.title}
            style={[
              styles.milestone,
              index < milestones.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.line },
            ]}
          >
            <View style={[styles.iconBubble, { backgroundColor: palette.accentSoft }]}>
              <MaterialCommunityIcons name={item.icon as any} size={24} color={palette.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.milestoneTitle, { color: palette.ink }]}>{item.title}</Text>
              <Text style={[styles.milestoneCopy, { color: palette.text }]}>{item.copy}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <AnimatedPressable
          onPress={() => router.push('/log-symptoms' as never)}
          style={[styles.primaryButton, { backgroundColor: palette.accent }]}
        >
          <Ionicons name="add-circle-outline" size={21} color={palette.onAccent} />
          <Text style={[styles.primaryButtonText, { color: palette.onAccent }]}>Log symptoms</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/timeline' as never)}
          style={[styles.secondaryButton, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}
        >
          <Text style={[styles.secondaryButtonText, { color: palette.accentStrong }]}>Timeline</Text>
          <Ionicons name="chevron-forward" size={20} color={palette.accent} />
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
  },
  title: {
    ...type.title,
    fontSize: 31,
    lineHeight: 37,
    marginTop: 5,
    letterSpacing: -0.6,
  },
  subtitle: {
    ...type.body,
    marginTop: 8,
    lineHeight: 23,
  },
  hero: {
    height: 410,
    borderRadius: 34,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeText: {
    ...type.bodyStrong,
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
  },
  size: {
    ...type.title,
    fontSize: 26,
    marginTop: 4,
  },
  sizeCopy: {
    ...type.small,
    marginTop: 4,
    fontWeight: '800',
  },
  round: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCard: {
    marginTop: 16,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  progressLabel: {
    ...type.tiny,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  progressTitle: {
    ...type.title,
    fontSize: 25,
    marginTop: 4,
  },
  progressValue: {
    ...type.small,
    fontWeight: '900',
    marginTop: 3,
  },
  track: {
    height: 13,
    borderRadius: 999,
    marginTop: 18,
    overflow: 'hidden',
  },
  fill: {
    width: '30%',
    height: '100%',
    borderRadius: 999,
  },
  progressFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMini: {
    ...type.tiny,
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
    padding: 18,
    minHeight: 126,
    borderWidth: 1,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    ...type.small,
    marginTop: 12,
    fontWeight: '800',
  },
  statValue: {
    ...type.title,
    fontSize: 24,
    marginTop: 4,
  },
  milestoneCard: {
    borderRadius: 30,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
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
  },
  cardBadge: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  cardBadgeText: {
    ...type.tiny,
    fontWeight: '900',
  },
  milestone: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
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
  },
  milestoneCopy: {
    ...type.small,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...type.bodyStrong,
  },
  secondaryButton: {
    flex: 1,
    height: 58,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    ...type.bodyStrong,
  },
});
