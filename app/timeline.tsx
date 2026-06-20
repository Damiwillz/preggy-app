import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { getMyProfile, type UserProfile } from '@/services/profile';

type TimelineItem = {
  week: number;
  title: string;
  copy: string;
  image?: number;
  icon: keyof typeof Ionicons.glyphMap;
};

const items: TimelineItem[] = [
  {
    week: 8,
    title: 'First Heartbeat',
    copy: 'A magical moment as you may hear that tiny, rapid pulse for the very first time. Baby is now growing quickly.',
    image: require('../assets/images/timeline-heartbeat.jpg'),
    icon: 'heart',
  },
  {
    week: 12,
    title: 'First Trimester Checkup',
    copy: 'You are moving toward the second trimester. Baby’s vital organs are formed, and nausea may begin to ease.',
    icon: 'medkit',
  },
  {
    week: 20,
    title: 'Anatomy Scan',
    copy: 'The mid pregnancy ultrasound checks baby’s development in detail and may reveal baby’s sex if you want to know.',
    image: require('../assets/images/timeline-ultrasound.jpg'),
    icon: 'eye',
  },
  {
    week: 24,
    title: 'Viability Milestone',
    copy: 'Baby is becoming more responsive. You may notice stronger kicks, rolls, and more regular movement patterns.',
    icon: 'sparkles',
  },
  {
    week: 28,
    title: 'Third Trimester Begins',
    copy: 'The home stretch begins. Baby is opening their eyes, practicing breathing, and gaining weight steadily.',
    icon: 'sunny',
  },
  {
    week: 32,
    title: 'Growth & Position Check',
    copy: 'Baby is filling out and may start settling into a head down position. Rest, hydration, and comfort matter more now.',
    icon: 'body',
  },
  {
    week: 36,
    title: 'Baby Drops Lower',
    copy: 'Engagement or lightening may happen as baby moves lower into the pelvis, preparing for birth.',
    icon: 'happy',
  },
  {
    week: 40,
    title: 'Due Date Week',
    copy: 'The big week is here. Keep your hospital bag ready and contact your maternity care team with any concerns.',
    icon: 'briefcase',
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

  return {
    week,
    day,
    daysRemaining: clamp(280 - ((week - 1) * 7 + day), 0, 280),
    progress: Math.round((((week - 1) * 7 + day) / 280) * 100),
  };
}

function getStatus(itemWeek: number, currentWeek: number) {
  if (currentWeek > itemWeek) return 'Completed';
  if (currentWeek === itemWeek) return 'This week';
  return 'Upcoming';
}

export default function Timeline() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      setLoading(true);

      getMyProfile()
        .then((data) => {
          if (mounted) {
            setProfile(data);
          }
        })
        .catch((error) => {
          console.log('Timeline profile error:', error);
        })
        .finally(() => {
          if (mounted) {
            setLoading(false);
          }
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  const progress = useMemo(() => getPregnancyProgress(profile), [profile]);
  const babyName = profile?.baby_nickname || 'Baby';

  return (
    <Screen bottomSpace={40}>
      <Header title="Timeline" back />

      <Text style={styles.title}>Pregnancy Timeline</Text>
      <Text style={styles.sub}>
        Your live journey with {babyName}, updated from your saved pregnancy profile.
      </Text>

      <View style={styles.summaryCard}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#765B60" />
            <Text style={styles.loadingText}>Loading timeline...</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryTop}>
              <View>
                <Text style={styles.summaryLabel}>CURRENT STAGE</Text>
                <Text style={styles.summaryTitle}>
                  Week {progress.week}, Day {progress.day}
                </Text>
              </View>

              <View style={styles.percentBadge}>
                <Text style={styles.percentText}>{progress.progress}%</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress.progress}%` }]} />
            </View>

            <View style={styles.summaryBottom}>
              <Text style={styles.summaryNote}>
                {progress.daysRemaining > 0
                  ? `${progress.daysRemaining} days until your estimated due date`
                  : 'You have reached your due date window'}
              </Text>

              <AnimatedPressable onPress={() => router.push('/calculator/result' as never)}>
                <Text style={styles.updateLink}>Update due date</Text>
              </AnimatedPressable>
            </View>
          </>
        )}
      </View>

      <View style={styles.line} />

      {items.map((item, index) => {
        const status = getStatus(item.week, progress.week);
        const isCompleted = status === 'Completed';
        const isCurrent = status === 'This week';

        return (
          <View key={item.week} style={styles.item}>
            <View
              style={[
                styles.icon,
                isCompleted && styles.completedIcon,
                isCurrent && styles.currentIcon,
              ]}
            >
              <Ionicons
                name={isCompleted ? 'checkmark' : item.icon}
                size={22}
                color={isCompleted || isCurrent ? '#FFF' : '#765B60'}
              />
            </View>

            <View
              style={[
                styles.card,
                index === items.length - 1 && styles.last,
                isCurrent && styles.currentCard,
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.week}>WEEK {item.week}</Text>

                <View
                  style={[
                    styles.statusBadge,
                    isCompleted && styles.completedBadge,
                    isCurrent && styles.currentBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      isCompleted && styles.completedText,
                      isCurrent && styles.currentText,
                    ]}
                  >
                    {status}
                  </Text>
                </View>
              </View>

              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.copy}>{item.copy}</Text>

              {item.image ? <Image source={item.image} style={styles.image} /> : null}
            </View>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...type.title,
    fontSize: 30,
    color: '#201A1A',
    textAlign: 'center',
    marginTop: 22,
  },
  sub: {
    ...type.body,
    color: '#51484A',
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 26,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0E2DF',
  },
  loadingRow: {
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    ...type.small,
    color: '#765B60',
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...type.section,
    color: '#9B7B82',
  },
  summaryTitle: {
    ...type.title,
    color: '#5F474E',
    fontSize: 25,
    marginTop: 5,
  },
  percentBadge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFE1E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    ...type.bodyStrong,
    color: '#72515D',
  },
  progressTrack: {
    height: 11,
    borderRadius: 20,
    backgroundColor: '#F3E7E4',
    marginTop: 18,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#765B60',
  },
  summaryBottom: {
    marginTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryNote: {
    ...type.small,
    color: '#6D6063',
    flex: 1,
  },
  updateLink: {
    ...type.small,
    color: '#72515D',
    fontWeight: '800',
  },
  line: {
    position: 'absolute',
    left: 53,
    top: 326,
    bottom: 50,
    width: 3,
    backgroundColor: '#F4DDE0',
  },
  item: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 22,
    zIndex: 2,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FBE1E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  completedIcon: {
    backgroundColor: '#8AB985',
  },
  currentIcon: {
    backgroundColor: '#765B60',
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
  },
  currentCard: {
    borderWidth: 2,
    borderColor: '#F2B7C1',
    backgroundColor: '#FFF7F8',
  },
  last: {
    backgroundColor: '#FFF0F1',
    borderWidth: 1,
    borderColor: '#fff',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
  },
  week: {
    ...type.body,
    color: '#765B60',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F4EFED',
  },
  completedBadge: {
    backgroundColor: '#E4F3E0',
  },
  currentBadge: {
    backgroundColor: '#765B60',
  },
  statusText: {
    ...type.tiny,
    color: '#706367',
  },
  completedText: {
    color: '#4E7548',
  },
  currentText: {
    color: '#FFF',
  },
  itemTitle: {
    ...type.body,
    fontSize: 20,
    color: '#1F1A1A',
    marginTop: 8,
  },
  copy: {
    ...type.body,
    color: '#4C4444',
    marginTop: 8,
  },
  image: {
    width: '100%',
    height: 135,
    borderRadius: 14,
    marginTop: 14,
  },
});
