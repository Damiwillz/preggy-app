import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { getMyProfile, type UserProfile } from '@/services/profile';

type GrowthInfo = {
  size: string;
  length: string;
  weight: string;
  headline: string;
  copy: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const growthByWeek: Record<number, GrowthInfo> = {
  8: {
    size: 'Raspberry',
    length: '0.6 in',
    weight: '0.04 oz',
    headline: 'Tiny features are forming',
    copy: 'Baby’s arms, legs, fingers, and toes are starting to take shape.',
    icon: 'leaf',
  },
  12: {
    size: 'Lime',
    length: '2.1 in',
    weight: '0.5 oz',
    headline: 'Reflexes are beginning',
    copy: 'Baby may start making small movements, even if you cannot feel them yet.',
    icon: 'sparkles',
  },
  16: {
    size: 'Avocado',
    length: '4.6 in',
    weight: '3.5 oz',
    headline: 'Growth is picking up',
    copy: 'Baby’s muscles are developing and movements may become more coordinated.',
    icon: 'body',
  },
  20: {
    size: 'Banana',
    length: '10 in',
    weight: '10.6 oz',
    headline: 'Halfway milestone',
    copy: 'Baby is growing fast, and the anatomy scan may show more development detail.',
    icon: 'eye',
  },
  24: {
    size: 'Corn cob',
    length: '11.8 in',
    weight: '1.3 lb',
    headline: 'More active and responsive',
    copy: 'Baby may respond to sounds and movement patterns can feel more noticeable.',
    icon: 'pulse',
  },
  28: {
    size: 'Eggplant',
    length: '14.8 in',
    weight: '2.2 lb',
    headline: 'Third trimester begins',
    copy: 'Baby is gaining fat, opening eyes, and practicing breathing movements.',
    icon: 'sunny',
  },
  32: {
    size: 'Squash',
    length: '16.7 in',
    weight: '3.8 lb',
    headline: 'Filling out beautifully',
    copy: 'Baby is gaining weight quickly and may settle into a birth position soon.',
    icon: 'heart',
  },
  36: {
    size: 'Papaya',
    length: '18.7 in',
    weight: '5.8 lb',
    headline: 'Almost ready',
    copy: 'Baby is continuing to gain weight while lungs and feeding skills mature.',
    icon: 'happy',
  },
  40: {
    size: 'Watermelon',
    length: '20.2 in',
    weight: '7.6 lb',
    headline: 'Due date window',
    copy: 'Baby is ready to meet you. Keep your care team updated with any changes.',
    icon: 'gift',
  },
};

const weeklyTips = [
  'Drink water often and rest when your body asks for it.',
  'Track baby movements and contact your care team if patterns change.',
  'Keep meals simple, balanced, and gentle on your stomach.',
  'Stretch lightly, walk when comfortable, and avoid overdoing it.',
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function nearestWeek(week: number) {
  const weeks = Object.keys(growthByWeek).map(Number);
  return weeks.reduce((closest, current) =>
    Math.abs(current - week) < Math.abs(closest - week) ? current : closest
  );
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
    progress: Math.round((pregnancyDay / 280) * 100),
  };
}

export default function WeeklyGrowthScreen() {
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
          console.log('Weekly growth profile error:', error);
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
  const growth = growthByWeek[nearestWeek(progress.week)];
  const babyName = profile?.baby_nickname || 'Baby';

  return (
    <Screen bottomSpace={40}>
      <Header title="Weekly Growth" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>LIVE GROWTH</Text>
        <Text style={[styles.title, { color: palette.ink }]}>This week with {babyName}</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Based on your saved pregnancy profile.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={palette.accent} />
            <Text style={[styles.loadingText, { color: palette.text }]}>Loading growth details...</Text>
          </View>
        ) : (
          <>
            <View style={styles.heroTop}>
              <View>
                <Text style={[styles.weekLabel, { color: palette.accent }]}>WEEK {progress.week}, DAY {progress.day}</Text>
                <Text style={[styles.heroTitle, { color: palette.ink }]}>{growth.size}</Text>
                <Text style={[styles.heroSubtitle, { color: palette.text }]}>Baby is about this size</Text>
              </View>

              <View style={[styles.babyIcon, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name={growth.icon} size={54} color={palette.accent} />
              </View>
            </View>

            <View style={[styles.progressTrack, { backgroundColor: palette.softSurface }]}>
              <View style={[styles.progressFill, { width: `${progress.progress}%`, backgroundColor: palette.accent }]} />
            </View>

            <Text style={[styles.progressText, { color: palette.text }]}>
              {progress.progress}% through your pregnancy journey
            </Text>
          </>
        )}
      </View>

      <View style={styles.measureGrid}>
        <View style={[styles.measureCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Text style={[styles.measureValue, { color: palette.ink }]}>{growth.length}</Text>
          <Text style={[styles.measureLabel, { color: palette.text }]}>Length</Text>
        </View>

        <View style={[styles.measureCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Text style={[styles.measureValue, { color: palette.ink }]}>{growth.weight}</Text>
          <Text style={[styles.measureLabel, { color: palette.text }]}>Weight</Text>
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="sparkles" size={24} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, { color: palette.ink }]}>{growth.headline}</Text>
          <Text style={[styles.infoCopy, { color: palette.text }]}>{growth.copy}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Gentle reminders</Text>

      <View style={styles.tips}>
        {weeklyTips.map((tip, index) => (
          <View key={tip} style={[styles.tipRow, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <View style={[styles.tipNumber, { backgroundColor: palette.accentSoft }]}>
              <Text style={[styles.tipNumberText, { color: palette.accent }]}>{index + 1}</Text>
            </View>

            <Text style={[styles.tipText, { color: palette.text }]}>{tip}</Text>
          </View>
        ))}
      </View>

      <AnimatedPressable
        onPress={() => router.push('/timeline' as never)}
        style={[styles.timelineButton, { backgroundColor: palette.accent }]}
      >
        <Ionicons name="map" size={21} color={palette.onAccent} />
        <Text style={[styles.timelineText, { color: palette.onAccent }]}>View full timeline</Text>
      </AnimatedPressable>
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
    marginTop: 3,
  },
  subtitle: {
    ...type.body,
    marginTop: 7,
  },
  heroCard: {
    minHeight: 230,
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
  },
  loading: {
    minHeight: 188,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    ...type.small,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  weekLabel: {
    ...type.section,
  },
  heroTitle: {
    ...type.title,
    fontSize: 34,
    marginTop: 5,
  },
  heroSubtitle: {
    ...type.body,
    marginTop: 3,
  },
  babyIcon: {
    width: 112,
    height: 112,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 12,
    borderRadius: 20,
    marginTop: 28,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 20,
  },
  progressText: {
    ...type.small,
    marginTop: 10,
  },
  measureGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  measureCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  measureValue: {
    ...type.bodyStrong,
    fontSize: 22,
  },
  measureLabel: {
    ...type.small,
    marginTop: 5,
  },
  infoCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  infoIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  infoCopy: {
    ...type.body,
    lineHeight: 23,
    marginTop: 5,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    marginBottom: 10,
  },
  tips: {
    gap: 10,
  },
  tipRow: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumberText: {
    ...type.small,
    fontWeight: '900',
  },
  tipText: {
    ...type.small,
    flex: 1,
    lineHeight: 19,
  },
  timelineButton: {
    height: 58,
    borderRadius: 29,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  timelineText: {
    ...type.bodyStrong,
  },
});
