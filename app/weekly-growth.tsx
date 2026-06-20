import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { getMyProfile, type UserProfile } from '@/services/profile';

type GrowthInfo = {
  size: string;
  length: string;
  weight: string;
  title: string;
  copy: string;
  tip: string;
};

const growthByWeek: Record<number, GrowthInfo> = {
  8: {
    size: 'Raspberry',
    length: '1.6 cm',
    weight: '1 g',
    title: 'Tiny features are forming',
    copy: 'Baby’s arms, legs, fingers, and toes are starting to take shape. The heartbeat is strong and development is moving quickly.',
    tip: 'Small, frequent meals may help with nausea this week.',
  },
  12: {
    size: 'Lime',
    length: '5.4 cm',
    weight: '14 g',
    title: 'First trimester milestone',
    copy: 'Baby’s organs are formed and will keep maturing. Reflexes are beginning, even if you cannot feel movement yet.',
    tip: 'Keep taking prenatal vitamins and stay hydrated.',
  },
  16: {
    size: 'Avocado',
    length: '11.6 cm',
    weight: '100 g',
    title: 'Growing stronger',
    copy: 'Baby’s muscles are developing and facial expressions are becoming possible. Some parents begin to feel flutters soon.',
    tip: 'Gentle movement can support energy and circulation.',
  },
  20: {
    size: 'Banana',
    length: '25.6 cm',
    weight: '300 g',
    title: 'Halfway there',
    copy: 'Baby is growing hair, practicing swallowing, and becoming more active. This is often around the anatomy scan window.',
    tip: 'Write down questions before appointments so nothing gets forgotten.',
  },
  24: {
    size: 'Corn',
    length: '30 cm',
    weight: '600 g',
    title: 'Hearing your voice',
    copy: 'Baby can hear more sounds and may respond to your voice. Movements may feel stronger and more regular.',
    tip: 'Try a calm bedtime routine to help your body rest.',
  },
  28: {
    size: 'Eggplant',
    length: '37.6 cm',
    weight: '1 kg',
    title: 'Third trimester begins',
    copy: 'Baby’s eyes can open and close. The brain, lungs, and body fat are developing quickly now.',
    tip: 'Start tracking patterns of movement and report major changes to your care team.',
  },
  32: {
    size: 'Squash',
    length: '42.4 cm',
    weight: '1.7 kg',
    title: 'Filling out',
    copy: 'Baby is gaining weight, practicing breathing motions, and may be settling into a head down position.',
    tip: 'Use pillows to support your hips, belly, and back while sleeping.',
  },
  36: {
    size: 'Papaya',
    length: '47.4 cm',
    weight: '2.6 kg',
    title: 'Almost ready',
    copy: 'Baby is gaining final weight and preparing for birth. You may feel more pelvic pressure as baby moves lower.',
    tip: 'Keep your hospital bag, documents, and birth plan within easy reach.',
  },
  40: {
    size: 'Watermelon',
    length: '51 cm',
    weight: '3.4 kg',
    title: 'Due date window',
    copy: 'Baby is fully developed and ready to meet you. Some babies arrive before or after the estimated due date.',
    tip: 'Call your maternity care team if you notice contractions, waters breaking, bleeding, or reduced movement.',
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getWeek(profile: UserProfile | null) {
  if (profile?.due_date) {
    const dueDate = new Date(`${profile.due_date}T12:00:00`);
    const today = new Date();

    if (!Number.isNaN(dueDate.getTime())) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / msPerDay);
      const pregnancyDay = clamp(280 - daysRemaining, 0, 280);

      return clamp(Math.floor(pregnancyDay / 7) + 1, 1, 40);
    }
  }

  return clamp(profile?.pregnancy_week ?? 24, 1, 40);
}

function getGrowthInfo(week: number) {
  const availableWeeks = Object.keys(growthByWeek).map(Number).sort((a, b) => a - b);
  const closestWeek = availableWeeks.reduce((best, current) => {
    if (current <= week) return current;
    return best;
  }, availableWeeks[0]);

  return growthByWeek[closestWeek];
}

export default function WeeklyGrowth() {
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
          console.log('Weekly growth profile error:', error);
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

  const week = useMemo(() => getWeek(profile), [profile]);
  const growth = useMemo(() => getGrowthInfo(week), [week]);
  const babyName = profile?.baby_nickname || 'Baby';

  return (
    <Screen bottomSpace={32}>
      <Header title="Weekly Growth" back />

      <Text style={styles.title}>Week {week} Growth</Text>
      <Text style={styles.subtitle}>
        A live update on how {babyName} may be growing this week.
      </Text>

      <View style={styles.hero}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#765B60" />
            <Text style={styles.loadingText}>Loading growth update...</Text>
          </View>
        ) : (
          <>
            <View style={styles.imageWrap}>
              <View style={styles.babyCircle}>
                <Ionicons name="heart" size={78} color="#765B60" />
              </View>
              <Text style={styles.heroWeek}>Week {week}</Text>
            </View>

            <View style={styles.sizeBadge}>
              <Text style={styles.sizeLabel}>ABOUT THE SIZE OF</Text>
              <Text style={styles.sizeText}>{growth.size}</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="resize-outline" size={24} color="#765B60" />
          <Text style={styles.statValue}>{growth.length}</Text>
          <Text style={styles.statLabel}>Length</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="scale-outline" size={24} color="#765B60" />
          <Text style={styles.statValue}>{growth.weight}</Text>
          <Text style={styles.statLabel}>Weight</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color="#765B60" />
          <Text style={styles.statValue}>{week}/40</Text>
          <Text style={styles.statLabel}>Week</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardIcon}>
          <Ionicons name="sparkles" size={24} color="#FFF" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{growth.title}</Text>
          <Text style={styles.cardCopy}>{growth.copy}</Text>
        </View>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipLabel}>THIS WEEK’S TIP</Text>
        <Text style={styles.tipText}>{growth.tip}</Text>
      </View>

      <AnimatedPressable style={styles.button}>
        <Text style={styles.buttonText}>View full weekly guide</Text>
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...type.title,
    fontSize: 30,
    color: '#211A1D',
    textAlign: 'center',
    marginTop: 22,
  },
  subtitle: {
    ...type.body,
    color: '#5E5356',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 23,
  },
  hero: {
    backgroundColor: '#FFF',
    borderRadius: 30,
    minHeight: 265,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E2DF',
  },
  loading: {
    minHeight: 265,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    ...type.small,
    color: '#765B60',
  },
  imageWrap: {
    height: 210,
    backgroundColor: '#FFE7EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  babyCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#FFF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F2C8CF',
  },
  heroWeek: {
    ...type.title,
    color: '#765B60',
    fontSize: 24,
    marginTop: 14,
  },
  sizeBadge: {
    padding: 18,
    alignItems: 'center',
  },
  sizeLabel: {
    ...type.section,
    color: '#9B7B82',
  },
  sizeText: {
    ...type.title,
    color: '#765B60',
    fontSize: 27,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 22,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E2DF',
  },
  statValue: {
    ...type.bodyStrong,
    color: '#2E2528',
    fontSize: 17,
    marginTop: 8,
  },
  statLabel: {
    ...type.tiny,
    color: '#74686B',
    marginTop: 3,
  },
  card: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#FFF',
    borderRadius: 26,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#F0E2DF',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#765B60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...type.bodyStrong,
    color: '#2E2528',
    fontSize: 19,
  },
  cardCopy: {
    ...type.body,
    color: '#5A5053',
    marginTop: 6,
    lineHeight: 23,
  },
  tipCard: {
    backgroundColor: '#FFF0F2',
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
  },
  tipLabel: {
    ...type.section,
    color: '#9B6771',
  },
  tipText: {
    ...type.body,
    color: '#3F3437',
    lineHeight: 23,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#765B60',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  buttonText: {
    ...type.bodyStrong,
    color: '#FFF',
  },
});
