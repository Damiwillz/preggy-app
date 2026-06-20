import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { CalendarIcon, HeartIcon, WaterIcon } from '@/components/ui/icons';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { wisdom } from '@/data/mockData';
import { getMyProfile, type UserProfile } from '@/services/profile';
import { supabase } from '@/lib/supabase';

type SymptomLog = {
  id: string;
  mood: string | null;
  symptoms: string[] | null;
  intensity: number | null;
  notes: string | null;
  created_at: string;
};

function getDaysToGo(dueDate?: string | null) {
  if (!dueDate) return 193;

  const today = new Date();
  const due = new Date(`${dueDate}T00:00:00`);
  const difference = due.getTime() - today.getTime();

  return Math.max(0, Math.ceil(difference / 86400000));
}

function getCompletion(week?: number | null) {
  const currentWeek = week ?? 12;
  return Math.min(100, Math.max(0, Math.round((currentWeek / 40) * 100)));
}

function getBabySize(week?: number | null) {
  const currentWeek = week ?? 12;

  if (currentWeek < 13) {
    return {
      emoji: '🍋‍🟩',
      size: 'Lime',
      detail: 'Weight: ~14g | Length: ~5.4cm',
    };
  }

  if (currentWeek < 20) {
    return {
      emoji: '🥑',
      size: 'Avocado',
      detail: 'Growing stronger every week',
    };
  }

  if (currentWeek < 28) {
    return {
      emoji: '🍊',
      size: 'Grapefruit',
      detail: 'Hearing and movement are developing',
    };
  }

  if (currentWeek < 35) {
    return {
      emoji: '🍍',
      size: 'Pineapple',
      detail: 'Gaining weight and preparing for birth',
    };
  }

  return {
    emoji: '🎃',
    size: 'Pumpkin',
    detail: 'Almost ready for your big day',
  };
}

function formatSymptoms(log: SymptomLog | null) {
  if (!log?.symptoms?.length) return 'No symptoms saved yet';

  return log.symptoms.join(', ');
}

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestLog, setLatestLog] = useState<SymptomLog | null>(null);

  const loadHomeData = useCallback(async () => {
    const nextProfile = await getMyProfile();
    setProfile(nextProfile);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) return;

    const { data } = await supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setLatestLog((data as SymptomLog | null) ?? null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  const displayName = profile?.full_name?.split(' ')[0] || 'Mama';
  const week = profile?.pregnancy_week ?? 12;
  const days = profile?.pregnancy_days ?? 0;
  const completion = getCompletion(week);
  const daysToGo = getDaysToGo(profile?.due_date);
  const baby = getBabySize(week);

  return (
    <Screen>
      <Header />

      <Text style={styles.eyebrow}>CURRENT PROGRESS</Text>
      <Text style={styles.title}>You’re glowing, {displayName}</Text>

      <LinearGradient
        colors={[colors.blush, '#FFF3EF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.progressTop}>
          <Text style={styles.muted}>Current Stage</Text>
          <Text style={styles.week}>Week {week}</Text>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${completion}%` }]} />
        </View>

        <View style={styles.progressBottom}>
          <Text style={styles.muted}>{days > 0 ? `${days} extra days` : 'Pregnancy progress'}</Text>
          <Text style={styles.percent}>{completion}%</Text>
        </View>

        <Text style={styles.days}>{daysToGo} days to go</Text>
        <Text style={styles.daysSub}>Until your big day</Text>
      </LinearGradient>

      <Card style={styles.development}>
        <View style={styles.cardHeader}>
          <Text style={styles.section}>Baby Development</Text>
          <Text style={styles.badge}>LIVE</Text>
        </View>

        <View style={styles.limeWrap}>
          <View style={styles.lime}>
            <Text style={styles.limeText}>{baby.emoji}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.copy}>Your baby is currently the size of a</Text>
            <Text style={styles.limeTitle}>{baby.size}</Text>
            <Text style={styles.copy}>{baby.detail}</Text>
          </View>
        </View>
      </Card>

      <AnimatedPressable onPress={() => router.push('/log-symptoms' as never)}>
        <Card style={styles.milestone}>
          <View style={styles.iconBubble}>
            <Ionicons name="pulse-outline" size={25} color={colors.plum} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.section}>LATEST SYMPTOM LOG</Text>
            <Text style={styles.mileTitle}>
              {latestLog ? `${latestLog.mood || 'Mood'} • Level ${latestLog.intensity || 1}` : 'No entry yet'}
            </Text>
            <Text style={styles.copy}>{formatSymptoms(latestLog)}</Text>
          </View>
        </Card>
      </AnimatedPressable>

      <AnimatedPressable onPress={() => router.push('/appointment/details')}>
        <Card style={styles.milestone}>
          <View style={styles.iconBubble}>
            <CalendarIcon color={colors.plum} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.section}>NEXT MILESTONE</Text>
            <Text style={styles.mileTitle}>Keep tracking your journey</Text>
            <Text style={styles.copy}>Your profile and symptoms now sync with Supabase.</Text>
          </View>
        </Card>
      </AnimatedPressable>

      <Text style={styles.heading}>Today’s Wisdom</Text>

      <View style={styles.wisdomGrid}>
        {wisdom.map((item, index) => (
          <Card key={item.title} style={styles.wisdom}>
            <View style={styles.wisdomIcon}>{index === 0 ? <WaterIcon /> : <HeartIcon />}</View>
            <Text style={styles.wisdomTitle}>{item.title}</Text>
            <Text style={styles.copy}>{item.body}</Text>
          </Card>
        ))}
      </View>

      <Text style={styles.heading}>Explore your journey</Text>

      <View style={styles.actions}>
        <AnimatedPressable onPress={() => router.push('/medication')} style={styles.actionCard}>
          <Ionicons name="medical-outline" size={26} color={colors.plum} />
          <Text style={styles.actionTitle}>Medication</Text>
          <Text style={styles.copy}>Track supplements and doses</Text>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.push('/timeline')} style={styles.actionCard}>
          <Ionicons name="git-branch-outline" size={26} color={colors.plum} />
          <Text style={styles.actionTitle}>Timeline</Text>
          <Text style={styles.copy}>See every milestone ahead</Text>
        </AnimatedPressable>
      </View>

      <Button label="Log symptoms" onPress={() => router.push('/log-symptoms' as never)} style={{ marginTop: 18 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...type.section,
    color: colors.rose,
    marginTop: 22,
  },
  title: {
    ...type.title,
    color: colors.ink,
    marginTop: 4,
    marginBottom: 18,
  },
  heroCard: {
    borderRadius: 32,
    padding: 22,
    overflow: 'hidden',
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  muted: {
    ...type.small,
    color: colors.text,
  },
  week: {
    ...type.title,
    color: colors.plum,
  },
  progressBar: {
    height: 12,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.8)',
    marginVertical: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: colors.plum,
  },
  progressBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  percent: {
    ...type.bodyStrong,
    color: colors.plum,
  },
  days: {
    ...type.title,
    color: colors.ink,
    marginTop: 20,
  },
  daysSub: {
    ...type.small,
    color: colors.text,
  },
  development: {
    marginTop: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  section: {
    ...type.section,
    color: colors.rose,
  },
  badge: {
    ...type.tiny,
    color: colors.plum,
    backgroundColor: colors.softSurface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  limeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  lime: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E8F0D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  limeText: {
    fontSize: 35,
  },
  limeTitle: {
    ...type.title,
    color: colors.plum,
  },
  copy: {
    ...type.small,
    color: colors.text,
  },
  milestone: {
    marginTop: 18,
    flexDirection: 'row',
    gap: 15,
    alignItems: 'center',
  },
  iconBubble: {
    width: 54,
    height: 54,
    borderRadius: 22,
    backgroundColor: colors.softSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mileTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    marginVertical: 4,
  },
  heading: {
    ...type.bodyStrong,
    color: colors.ink,
    marginTop: 24,
    marginBottom: 12,
  },
  wisdomGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  wisdom: {
    flex: 1,
    minHeight: 142,
  },
  wisdomIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: colors.softSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  wisdomTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    minHeight: 130,
    borderWidth: 1,
    borderColor: colors.line,
  },
  actionTitle: {
    ...type.bodyStrong,
    color: colors.ink,
    marginTop: 10,
    marginBottom: 4,
  },
});