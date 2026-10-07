import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type NewbornProfile = {
  babyName: string;
  birthDate: string;
  birthWeight: string;
  feedingPreference: string;
  createdAt: number;
};

type FeedingLog = {
  id: string;
  type: string;
  amount?: string;
  createdAt: number;
};

type DiaperLog = {
  id: string;
  type: string;
  createdAt: number;
};

type SleepLog = {
  id: string;
  startedAt: number;
  endedAt: number | null;
};

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  createdAt: number;
  icon: keyof typeof Ionicons.glyphMap;
};

const PROFILE_KEY = 'preggy:newborn-profile';
const FEEDING_KEY = 'preggy:newborn-feedings';
const DIAPER_KEY = 'preggy:newborn-diapers';
const SLEEP_KEY = 'preggy:newborn-sleep';

function parseArray<Value>(saved: string | null): Value[] {
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getBabyAge(birthDate: string) {
  const birth = new Date(`${birthDate}T12:00:00`);

  if (Number.isNaN(birth.getTime())) return 'Newborn';

  const today = new Date();
  const milliseconds = today.getTime() - birth.getTime();
  const days = Math.max(0, Math.floor(milliseconds / 86400000));

  if (days === 0) return 'Born today';
  if (days === 1) return '1 day old';
  if (days < 14) return `${days} days old`;

  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;

  return remainingDays
    ? `${weeks} weeks, ${remainingDays} days`
    : `${weeks} weeks old`;
}

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export default function NewbornDashboardScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<NewbornProfile | null>(null);
  const [feedings, setFeedings] = useState<FeedingLog[]>([]);
  const [diapers, setDiapers] = useState<DiaperLog[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const values = await AsyncStorage.multiGet([
        PROFILE_KEY,
        FEEDING_KEY,
        DIAPER_KEY,
        SLEEP_KEY,
      ]);

      const savedProfile = values[0]?.[1];

      setProfile(
        savedProfile
          ? (JSON.parse(savedProfile) as NewbornProfile)
          : null
      );

      setFeedings(parseArray<FeedingLog>(values[1]?.[1] ?? null));
      setDiapers(parseArray<DiaperLog>(values[2]?.[1] ?? null));
      setSleepLogs(parseArray<SleepLog>(values[3]?.[1] ?? null));
    } catch (error) {
      console.log('Newborn dashboard load error:', error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard])
  );

  const todayStart = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, []);

  const todayFeedings = feedings.filter(
    (item) => item.createdAt >= todayStart
  );

  const todayDiapers = diapers.filter(
    (item) => item.createdAt >= todayStart
  );

  const sleepMinutes = sleepLogs
    .filter(
      (item) =>
        item.startedAt >= todayStart &&
        typeof item.endedAt === 'number'
    )
    .reduce((total, item) => {
      const duration = Math.max(
        0,
        Math.round(((item.endedAt ?? item.startedAt) - item.startedAt) / 60000)
      );

      return total + duration;
    }, 0);

  const lastFeeding = [...feedings].sort(
    (a, b) => b.createdAt - a.createdAt
  )[0];

  const recentActivity = useMemo<ActivityItem[]>(() => {
    const feedingActivity: ActivityItem[] = feedings.map((item) => ({
      id: `feeding-${item.id}`,
      title: item.type || 'Feeding',
      detail: item.amount
        ? `${item.amount} • ${formatTime(item.createdAt)}`
        : formatTime(item.createdAt),
      createdAt: item.createdAt,
      icon: 'restaurant-outline',
    }));

    const diaperActivity: ActivityItem[] = diapers.map((item) => ({
      id: `diaper-${item.id}`,
      title: `${item.type || 'Diaper'} diaper`,
      detail: formatTime(item.createdAt),
      createdAt: item.createdAt,
      icon: 'water-outline',
    }));

    const sleepActivity: ActivityItem[] = sleepLogs
      .filter((item) => item.endedAt)
      .map((item) => ({
        id: `sleep-${item.id}`,
        title: 'Sleep session',
        detail: `${formatDuration(
          Math.max(
            0,
            Math.round(
              ((item.endedAt ?? item.startedAt) - item.startedAt) / 60000
            )
          )
        )} • ${formatTime(item.startedAt)}`,
        createdAt: item.startedAt,
        icon: 'moon-outline',
      }));

    return [...feedingActivity, ...diaperActivity, ...sleepActivity]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [diapers, feedings, sleepLogs]);

  if (!loaded) {
    return (
      <Screen>
        <Header title="" back />
        <Text style={[styles.loading, { color: palette.text }]}>
          Loading newborn dashboard...
        </Text>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        <Header title="" back />

        <View
          style={[
            styles.setupCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.setupIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="happy-outline"
              size={34}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.setupTitle, { color: palette.ink }]}>
            Create baby’s profile
          </Text>

          <Text style={[styles.setupCopy, { color: palette.text }]}>
            Add your baby’s name and birth date before opening the newborn
            dashboard.
          </Text>

          <AnimatedPressable
            onPress={() => router.replace('/newborn-profile' as never)}
            style={[
              styles.primaryButton,
              { backgroundColor: palette.accent },
            ]}
          >
            <Text style={styles.primaryButtonText}>Create profile</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </AnimatedPressable>
        </View>
      </Screen>
    );
  }

  return (
    <Screen bottomSpace={140}>
      <Header title="" back />

      <View style={styles.topRow}>
        <View>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            NEWBORN TODAY
          </Text>

          <Text style={[styles.title, { color: palette.ink }]}>
            Hi, {profile.babyName}
          </Text>

          <Text style={[styles.subtitle, { color: palette.text }]}>
            {getBabyAge(profile.birthDate)}
          </Text>
        </View>

        <AnimatedPressable
          onPress={() => router.push('/newborn-profile' as never)}
          style={[
            styles.profileButton,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Ionicons name="person-outline" size={22} color={palette.accent} />
        </AnimatedPressable>
      </View>

      <View
        style={[
          styles.hero,
          {
            backgroundColor: palette.accent,
            borderColor: palette.accent,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="heart" size={27} color={palette.accent} />
          </View>

          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>TODAY</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>
          A calm view of baby’s day
        </Text>

        <Text style={styles.heroCopy}>
          Log feeding, diapers, and sleep to build a simple daily routine.
        </Text>

        <View style={styles.heroSummary}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{todayFeedings.length}</Text>
            <Text style={styles.heroStatLabel}>Feedings</Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{todayDiapers.length}</Text>
            <Text style={styles.heroStatLabel}>Diapers</Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>
              {formatDuration(sleepMinutes)}
            </Text>
            <Text style={styles.heroStatLabel}>Sleep</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: palette.accent }]}>
        QUICK LOG
      </Text>

      <View style={styles.quickGrid}>
        <AnimatedPressable
          onPress={() => router.push('/newborn-feeding' as never)}
          style={[
            styles.quickCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.quickIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="restaurant-outline"
              size={24}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.quickTitle, { color: palette.ink }]}>
            Feeding
          </Text>

          <Text style={[styles.quickCopy, { color: palette.text }]}>
            {lastFeeding
              ? `Last at ${formatTime(lastFeeding.createdAt)}`
              : 'No feeding logged'}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/newborn-diaper' as never)}
          style={[
            styles.quickCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.quickIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="water-outline"
              size={24}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.quickTitle, { color: palette.ink }]}>
            Diaper
          </Text>

          <Text style={[styles.quickCopy, { color: palette.text }]}>
            {todayDiapers.length} changes today
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/newborn-sleep' as never)}
          style={[
            styles.quickCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.quickIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="moon-outline"
              size={24}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.quickTitle, { color: palette.ink }]}>
            Sleep
          </Text>

          <Text style={[styles.quickCopy, { color: palette.text }]}>
            {formatDuration(sleepMinutes)} today
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/newborn-profile' as never)}
          style={[
            styles.quickCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.quickIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="happy-outline"
              size={24}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.quickTitle, { color: palette.ink }]}>
            Baby profile
          </Text>

          <Text style={[styles.quickCopy, { color: palette.text }]}>
            View and edit details
          </Text>
        </AnimatedPressable>
      </View>

      <View style={styles.activityHeader}>
        <View>
          <Text style={[styles.activityTitle, { color: palette.ink }]}>
            Recent activity
          </Text>

          <Text style={[styles.activitySubtitle, { color: palette.text }]}>
            Latest newborn logs
          </Text>
        </View>

        <View
          style={[
            styles.activityBadge,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Text style={[styles.activityBadgeText, { color: palette.accent }]}>
            {recentActivity.length}
          </Text>
        </View>
      </View>

      {recentActivity.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={27}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>
            Baby’s day starts here
          </Text>

          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Your feeding, diaper, and sleep logs will appear here.
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.activityCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          {recentActivity.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.activityRow,
                index < recentActivity.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.activityIcon,
                  { backgroundColor: palette.accentSoft },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={19}
                  color={palette.accent}
                />
              </View>

              <View style={styles.activityContent}>
                <Text style={[styles.activityRowTitle, { color: palette.ink }]}>
                  {item.title}
                </Text>

                <Text style={[styles.activityDetail, { color: palette.text }]}>
                  {item.detail}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...type.body,
    marginTop: 30,
    textAlign: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  eyebrow: {
    ...type.section,
    marginBottom: 4,
  },
  title: {
    ...type.hero,
  },
  subtitle: {
    ...type.body,
    marginTop: 2,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderWidth: 1,
    borderRadius: 29,
    padding: 20,
    marginBottom: 24,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    ...type.tiny,
    color: '#FFFFFF',
  },
  heroTitle: {
    ...type.title,
    color: '#FFFFFF',
    marginTop: 18,
  },
  heroCopy: {
    ...type.body,
    color: 'rgba(255,255,255,0.84)',
    marginTop: 5,
  },
  heroSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 19,
  },
  heroStatLabel: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  heroDivider: {
    width: 1,
    height: 31,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  sectionLabel: {
    ...type.section,
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 26,
  },
  quickCard: {
    width: '48%',
    minHeight: 145,
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTitle: {
    ...type.bodyStrong,
    marginTop: 13,
  },
  quickCopy: {
    ...type.small,
    marginTop: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
  },
  activitySubtitle: {
    ...type.small,
    marginTop: 2,
  },
  activityBadge: {
    minWidth: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBadgeText: {
    ...type.bodyStrong,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...type.bodyStrong,
    marginTop: 13,
  },
  emptyCopy: {
    ...type.small,
    textAlign: 'center',
    marginTop: 4,
  },
  activityCard: {
    borderWidth: 1,
    borderRadius: 23,
    paddingHorizontal: 14,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 11,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityRowTitle: {
    ...type.bodyStrong,
  },
  activityDetail: {
    ...type.small,
    marginTop: 2,
  },
  setupCard: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 24,
    alignItems: 'center',
    marginTop: 30,
  },
  setupIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupTitle: {
    ...type.title,
    marginTop: 16,
    textAlign: 'center',
  },
  setupCopy: {
    ...type.body,
    textAlign: 'center',
    marginTop: 6,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 20,
  },
  primaryButtonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
});
