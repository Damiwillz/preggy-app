import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { getMyProfile, type UserProfile } from '@/services/profile';

type TimelineItem = {
  week: number;
  title: string;
  copy: string;
  image?: number;
  icon: keyof typeof Ionicons.glyphMap;
  trimester: string;
};

const items: TimelineItem[] = [
  {
    week: 8,
    title: 'First heartbeat',
    copy: 'A beautiful moment when you may hear that tiny, rapid pulse for the first time.',
    image: require('../assets/images/timeline-heartbeat.jpg'),
    icon: 'heart',
    trimester: 'First trimester',
  },
  {
    week: 12,
    title: 'First trimester checkup',
    copy: 'Baby’s vital organs are formed, and you are moving toward the second trimester.',
    image: require('../assets/images/week12-baby.jpg'),
    icon: 'medkit',
    trimester: 'First trimester',
  },
  {
    week: 20,
    title: 'Anatomy scan',
    copy: 'A detailed ultrasound checks baby’s development and growth.',
    image: require('../assets/images/timeline-ultrasound.jpg'),
    icon: 'eye',
    trimester: 'Second trimester',
  },
  {
    week: 24,
    title: 'Viability milestone',
    copy: 'Baby is more responsive, and movements may become stronger and more regular.',
    icon: 'sparkles',
    trimester: 'Second trimester',
  },
  {
    week: 28,
    title: 'Third trimester begins',
    copy: 'Baby is opening their eyes, practicing breathing, and gaining weight steadily.',
    icon: 'sunny',
    trimester: 'Third trimester',
  },
  {
    week: 32,
    title: 'Growth and position check',
    copy: 'Baby is filling out and may begin settling into a head-down position.',
    icon: 'body',
    trimester: 'Third trimester',
  },
  {
    week: 36,
    title: 'Baby drops lower',
    copy: 'Baby may move lower into the pelvis as your body prepares for birth.',
    icon: 'happy',
    trimester: 'Third trimester',
  },
  {
    week: 40,
    title: 'Due date week',
    copy: 'The big week is here. Keep your bag ready and stay close to your care team.',
    icon: 'briefcase',
    trimester: 'Birth window',
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPregnancyProgress(profile: UserProfile | null) {
  if (profile?.due_date) {
    const dueDate = new Date(`${profile.due_date}T12:00:00`);
    const today = new Date();

    if (!Number.isNaN(dueDate.getTime())) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / msPerDay);
      const pregnancyDay = clamp(280 - daysRemaining, 0, 280);
      const week = clamp(Math.floor(pregnancyDay / 7) + 1, 1, 40);
      const day = pregnancyDay % 7;

      return {
        week,
        day,
        daysRemaining: clamp(daysRemaining, 0, 280),
        progress: Math.round((pregnancyDay / 280) * 100),
      };
    }
  }

  const week = clamp(profile?.pregnancy_week ?? 24, 1, 40);
  const day = clamp(profile?.pregnancy_days ?? 0, 0, 6);
  const pregnancyDay = (week - 1) * 7 + day;

  return {
    week,
    day,
    daysRemaining: clamp(280 - pregnancyDay, 0, 280),
    progress: Math.round((pregnancyDay / 280) * 100),
  };
}

function getStatus(itemWeek: number, currentWeek: number) {
  if (currentWeek > itemWeek) return 'Completed';
  if (currentWeek === itemWeek) return 'This week';
  return 'Upcoming';
}

export default function Timeline() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      setLoading(true);

      getMyProfile()
        .then((data) => {
          if (mounted) setProfile(data);
        })
        .catch((error) => {
          console.log('Timeline profile error:', error);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  const progress = useMemo(() => getPregnancyProgress(profile), [profile]);
  const babyName = profile?.baby_nickname || 'baby';

  return (
    <Screen bottomSpace={44}>
      <Header title="Timeline" back />

      <View style={styles.hero}>
        <Image source={require('../assets/images/timeline-ultrasound.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <View style={styles.heroShade} />

        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>PREGNANCY TIMELINE</Text>
          <Text style={styles.title}>Your journey with {babyName}</Text>
          <Text style={styles.sub}>Track meaningful milestones from early heartbeat to due date week.</Text>
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={palette.accent} />
            <Text style={[styles.loadingText, { color: '#765B60' }]}>Loading timeline...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.summaryLabel, { color: palette.accent }]}>CURRENT STAGE</Text>
                <Text style={[styles.summaryTitle, { color: '#2A151B' }]}>
                  Week {progress.week}, Day {progress.day}
                </Text>
                <Text style={[styles.summaryNote, { color: '#765B60' }]}>
                  {progress.daysRemaining > 0
                    ? `${progress.daysRemaining} days until your estimated due date`
                    : 'You have reached your due date window'}
                </Text>
              </View>

              <View style={[styles.percentBadge, { backgroundColor: palette.accent }]}>
                <Text style={[styles.percentText, { color: palette.surface }]}>{progress.progress}%</Text>
              </View>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: palette.softSurface }]}>
              <View style={[styles.progressFill, { width: `${progress.progress}%`, backgroundColor: palette.accent }]} />
            </View>

            <View style={styles.summaryBottom}>
              <Text style={[styles.progressMini, { color: '#9C7B82' }]}>Week 1</Text>
              <AnimatedPressable onPress={() => router.push('/calculator/result' as never)}>
                <Text style={[styles.updateLink, { color: palette.accent }]}>Update due date</Text>
              </AnimatedPressable>
              <Text style={[styles.progressMini, { color: '#9C7B82' }]}>Week 40</Text>
            </View>
          </>
        )}
      </View>

      <Text style={[styles.sectionTitle, { color: '#2A151B' }]}>Milestone path</Text>

      <View style={styles.timelineWrap}>
        <View style={[styles.line, { backgroundColor: palette.accentSoft }]} />

        {items.map((item) => {
          const status = getStatus(item.week, progress.week);
          const isCompleted = status === 'Completed';
          const isCurrent = status === 'This week';

          return (
            <View key={item.week} style={styles.item}>
              <View
                style={[
                  styles.icon,
                  { backgroundColor: palette.accentSoft },
                  isCompleted && { backgroundColor: palette.accent },
                  isCurrent && { backgroundColor: palette.accent },
                ]}
              >
                <Ionicons
                  name={isCompleted ? 'checkmark' : item.icon}
                  size={21}
                  color={isCompleted || isCurrent ? palette.onAccent : palette.accent}
                />
              </View>

              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isCurrent ? palette.accentSoft : palette.surface,
                    borderColor: isCurrent ? palette.accent : palette.line,
                  },
                ]}
              >
                {item.image ? <Image source={item.image} style={styles.image} resizeMode="cover" /> : null}

                <View style={styles.cardTop}>
                  <Text style={[styles.week, { color: palette.accent }]}>WEEK {item.week}</Text>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: palette.softSurface },
                      isCompleted && { backgroundColor: palette.accentSoft },
                      isCurrent && { backgroundColor: palette.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: '#765B60' },
                        isCompleted && { color: palette.accent },
                        isCurrent && { color: palette.surface },
                      ]}
                    >
                      {status}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.trimester, { color: '#9C7B82' }]}>{item.trimester}</Text>
                <Text style={[styles.itemTitle, { color: '#2A151B' }]}>{item.title}</Text>
                <Text style={[styles.copy, { color: '#765B60' }]}>{item.copy}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 285,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginTop: 14,
    backgroundColor: '#FFF0F1',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(42,20,27,0.54)',
  },
  heroText: {
    padding: 24,
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 31,
    lineHeight: 36,
    color: '#fff',
    marginTop: 7,
  },
  sub: {
    ...type.body,
    color: '#FFF4F5',
    marginTop: 8,
    lineHeight: 23,
  },
  summaryCard: {
    borderRadius: 28,
    padding: 20,
    marginTop: 16,
    marginBottom: 22,
    borderWidth: 1,
  },
  loadingRow: {
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    ...type.small,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 14,
  },
  summaryLabel: {
    ...type.section,
  },
  summaryTitle: {
    ...type.title,
    fontSize: 26,
    marginTop: 5,
  },
  summaryNote: {
    ...type.small,
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '800',
  },
  percentBadge: {
    width: 62,
    height: 62,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  progressTrack: {
    height: 13,
    borderRadius: 999,
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  summaryBottom: {
    marginTop: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  progressMini: {
    ...type.tiny,
    fontWeight: '900',
  },
  updateLink: {
    ...type.small,
    fontWeight: '900',
  },
  sectionTitle: {
    ...type.title,
    fontSize: 25,
    marginBottom: 14,
  },
  timelineWrap: {
    position: 'relative',
  },
  line: {
    position: 'absolute',
    left: 24,
    top: 8,
    bottom: 30,
    width: 3,
    borderRadius: 99,
  },
  item: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 18,
    zIndex: 2,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  card: {
    flex: 1,
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
  },
  image: {
    height: 145,
    width: '100%',
    borderRadius: 22,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  week: {
    ...type.section,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    ...type.tiny,
    fontWeight: '900',
  },
  trimester: {
    ...type.tiny,
    marginTop: 8,
    fontWeight: '900',
  },
  itemTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    marginTop: 4,
  },
  copy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 5,
  },
});
