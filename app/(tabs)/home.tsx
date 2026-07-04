import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { supabase } from '@/lib/supabase';
import { getMyProfile, type UserProfile } from '@/services/profile';

type SymptomLog = {
  id: string;
  mood: string | null;
  symptoms: string[] | null;
  intensity: number | null;
  notes: string | null;
  created_at: string;
};

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  time: string | null;
  taken: boolean | null;
};

type Appointment = {
  id: string;
  title: string | null;
  type: string | null;
  date: string | null;
  appointment_date: string | null;
  time: string | null;
  appointment_time: string | null;
  location: string | null;
  clinic_name: string | null;
  status: string | null;
};

const DAILY_CARE_TOTAL = 5;
const WATER_TARGET = 8;

function getChecklistStorageKey(dateKey: string) {
  return `preggy:daily-care:${dateKey}`;
}

function getWaterStorageKey(dateKey: string) {
  return `preggy:water-cups:${dateKey}`;
}

function getKickStorageKey(dateKey: string) {
  return `preggy:kicks:${dateKey}`;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateStrip() {
  const today = new Date();

  return [-2, -1, 0, 1, 2].map((offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    return {
      key: toDateKey(date),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toLocaleDateString('en-US', { day: '2-digit' }),
      isToday: offset === 0,
    };
  });
}

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
        progress: Math.round((pregnancyDay / 280) * 100),
        daysRemaining: clamp(daysRemaining, 0, 280),
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
    daysRemaining: clamp(280 - pregnancyDay, 0, 280),
  };
}

function formatDate(date?: string | null) {
  if (!date) return 'No date';

  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestLog, setLatestLog] = useState<SymptomLog | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [dailyCareDone, setDailyCareDone] = useState(0);
  const [waterCups, setWaterCups] = useState(0);
  const [todayKicks, setTodayKicks] = useState(0);

  async function loadDailyCareSummary(dateKey = selectedDateKey) {
    try {
      const savedCare = await AsyncStorage.getItem(getChecklistStorageKey(dateKey));
      const parsedCare = savedCare ? JSON.parse(savedCare) : [];

      const savedWater = await AsyncStorage.getItem(getWaterStorageKey(dateKey));
      const parsedWater = savedWater ? Number.parseInt(savedWater, 10) : 0;

      setDailyCareDone(Array.isArray(parsedCare) ? Math.min(parsedCare.length, DAILY_CARE_TOTAL) : 0);
      setWaterCups(Number.isFinite(parsedWater) ? Math.min(Math.max(parsedWater, 0), WATER_TARGET) : 0);
    } catch (error) {
      console.log('Daily care summary load error:', error);
      setDailyCareDone(0);
      setWaterCups(0);
    }
  }

  async function loadKickSummary(dateKey = selectedDateKey) {
    try {
      const savedKicks = await AsyncStorage.getItem(getKickStorageKey(dateKey));
      const parsedKicks = savedKicks ? Number.parseInt(savedKicks, 10) : 0;

      setTodayKicks(Number.isFinite(parsedKicks) ? Math.max(parsedKicks, 0) : 0);
    } catch (error) {
      console.log('Kick summary load error:', error);
      setTodayKicks(0);
    }
  }

  async function loadDashboard(dateKey = selectedDateKey) {
    setLoading(true);

    const profileData = await getMyProfile();
    setProfile(profileData);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    const userId = userData.user?.id;

    if (!userId) throw new Error('No logged in user.');

    const [logResult, medsResult, appointmentResult] = await Promise.all([
      supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', `${dateKey}T00:00:00`)
        .lt('created_at', `${dateKey}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'Cancelled')
        .or(`appointment_date.eq.${dateKey},date.eq.${dateKey}`)
        .order('appointment_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (logResult.error) throw logResult.error;
    if (medsResult.error) throw medsResult.error;
    if (appointmentResult.error) throw appointmentResult.error;

    setLatestLog((logResult.data as SymptomLog | null) ?? null);
    setMedications((medsResult.data ?? []) as Medication[]);
    setNextAppointment((appointmentResult.data as Appointment | null) ?? null);
  }

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      Promise.all([loadDashboard(), loadDailyCareSummary(), loadKickSummary()])
        .catch((error) => {
          console.log('Home dashboard error:', error);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [selectedDateKey])
  );

  const progress = useMemo(() => getPregnancyProgress(profile), [profile]);
  const dateStrip = useMemo(() => buildDateStrip(), []);
  const babyName = profile?.baby_nickname || 'Baby';
  const firstName = profile?.full_name?.split(' ')?.[0] || 'Mama';
  const medicationDone = medications.filter((item) => item.taken).length;
  const medicationTotal = medications.length;
  const symptoms = latestLog?.symptoms?.length ? latestLog.symptoms.join(', ') : 'No symptoms logged for this day';
  const appointmentDate = nextAppointment?.appointment_date || nextAppointment?.date;
  const appointmentTime = nextAppointment?.appointment_time || nextAppointment?.time;
  const appointmentPlace = nextAppointment?.clinic_name || nextAppointment?.location;
  const dailyCareProgress = Math.round(((dailyCareDone + waterCups) / (DAILY_CARE_TOTAL + WATER_TARGET)) * 100);

  return (
    <Screen bottomSpace={120}>
      <Header />

      <View style={styles.topIntro}>
        <View>
          <Text style={[styles.greeting, { color: palette.text }]}>
            {greeting()}, {firstName}
          </Text>
          <Text style={[styles.title, { color: palette.ink }]}>How are you and {babyName} today?</Text>
        </View>

        <AnimatedPressable
          onPress={() => router.push('/timeline' as never)}
          style={[styles.searchButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="search" size={20} color={palette.ink} />
        </AnimatedPressable>
      </View>

      <View style={styles.dateRow}>
        {dateStrip.map((item) => {
          const active = selectedDateKey === item.key;

          return (
            <AnimatedPressable
              key={item.key}
              onPress={() => setSelectedDateKey(item.key)}
              style={[
                styles.dateChip,
                {
                  backgroundColor: active ? palette.accent : palette.surface,
                  borderColor: active ? palette.accent : palette.line,
                },
              ]}
            >
              <Text style={[styles.dateDay, { color: active ? palette.onAccent : palette.text }]}>
                {item.isToday ? 'Today' : item.day}
              </Text>
              <Text style={[styles.dateNumber, { color: active ? palette.onAccent : palette.ink }]}>
                {item.date}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <AnimatedPressable
        onPress={() => router.push('/timeline' as never)}
        style={[styles.babyCard, { backgroundColor: '#FFD5DC', borderColor: palette.line }]}
      >
        <View style={styles.blobOne} />
        <View style={styles.blobTwo} />

        <View style={styles.babyVisual}>
          <View style={styles.motherCircle}>
            <Text style={styles.motherEmoji}>🤰</Text>
          </View>

          <View style={styles.orbitLine} />
          <View style={[styles.orbitDot, { backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.journeyPill}>
          <View style={styles.thumbCircle}>
            <Text style={styles.thumbEmoji}>👶</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.journeyLabel}>Your Pregnancy Journey</Text>
            <Text style={styles.journeySub}>Tap to view timeline • Week {progress.week}, Day {progress.day}</Text>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/timeline' as never)}
            style={styles.arrowCircle}
          >
            <Ionicons name="arrow-forward" size={19} color={palette.ink} />
          </AnimatedPressable>
        </View>
      </AnimatedPressable>

      <View style={[styles.progressPanel, { borderColor: palette.line }]}>
        <View style={styles.progressTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGNANCY PROGRESS</Text>
            <Text style={[styles.progressTitle, { color: palette.ink }]}>
              {progress.progress}% complete
            </Text>
            <Text style={[styles.progressCopy, { color: palette.text }]}>
              {progress.daysRemaining > 0 ? `${progress.daysRemaining} days until your estimated due date.` : 'You are in your due date window.'}
            </Text>
          </View>

          <View style={[styles.progressBadge, { backgroundColor: palette.accent }]}>
            <Text style={[styles.progressBadgeText, { color: palette.onAccent }]}>
              {progress.week}w
            </Text>
          </View>
        </View>

        <View style={styles.progressTrackWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress.progress}%`, backgroundColor: palette.accent }]} />
          </View>

          <View style={styles.progressLabels}>
            <Text style={styles.progressMiniText}>Start</Text>
            <Text style={styles.progressMiniText}>Due date</Text>
          </View>
        </View>
      </View>

      <AnimatedPressable
        onPress={() => router.push('/daily-care' as never)}
        style={[styles.dailyCareSummary, { backgroundColor: palette.surface, borderColor: palette.line }]}
      >
        <View style={styles.dailyCareSummaryTop}>
          <View style={[styles.dailyCareSummaryIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="water-outline" size={25} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>DAILY CARE</Text>
            <Text style={[styles.dailyCareSummaryTitle, { color: palette.ink }]}>
              {dailyCareDone}/{DAILY_CARE_TOTAL} checklist • {waterCups}/{WATER_TARGET} water
            </Text>
            <Text style={[styles.dailyCareSummaryCopy, { color: palette.text }]}>
              Continue your gentle daily routine.
            </Text>
          </View>

          <View style={[styles.dailyCareSummaryBadge, { backgroundColor: palette.accent }]}>
            <Text style={[styles.dailyCareSummaryBadgeText, { color: palette.onAccent }]}>
              {dailyCareProgress}%
            </Text>
          </View>
        </View>

        <View style={[styles.dailyCareSummaryTrack, { backgroundColor: palette.accentSoft }]}>
          <View
            style={[
              styles.dailyCareSummaryFill,
              { width: `${dailyCareProgress}%`, backgroundColor: palette.accent },
            ]}
          />
        </View>
      </AnimatedPressable>

      <AnimatedPressable
        onPress={() => router.push('/kick-counter' as never)}
        style={[styles.movementSummary, { backgroundColor: palette.surface, borderColor: palette.line }]}
      >
        <View style={styles.movementSummaryTop}>
          <View style={[styles.movementSummaryIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="footsteps-outline" size={25} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>BABY MOVEMENT SUMMARY</Text>
            <Text style={[styles.movementSummaryTitle, { color: palette.ink }]}>
              {todayKicks} kicks today
            </Text>
            <Text style={[styles.movementSummaryCopy, { color: palette.text }]}>
              Open the counter when you want to track a movement session.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color={palette.muted} />
        </View>
      </AnimatedPressable>

      {loading ? (
        <View style={[styles.loadingCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text }]}>Refreshing dashboard...</Text>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>My daily insights</Text>

          <View style={styles.insightGrid}>
            <InsightCard
              icon="add-circle-outline"
              title="Log symptoms"
              copy="Mood and notes"
              onPress={() => router.push('/log-symptoms' as never)}
            />

            <InsightCard
              icon="medkit-outline"
              title="Medication"
              copy={medicationTotal ? `${medicationDone}/${medicationTotal} taken` : 'No routine'}
              onPress={() => router.push('/medication' as never)}
            />

            <InsightCard
              icon="calendar-outline"
              title="Appointments"
              copy={
                nextAppointment
                  ? `${formatDate(appointmentDate)} ${appointmentTime ?? ''}`.trim()
                  : 'No visit'
              }
              onPress={() => router.push('/(tabs)/appointments' as never)}
            />

            <InsightCard
              icon="water-outline"
              title="Daily Care"
              copy="Checklist and water"
              onPress={() => router.push('/daily-care' as never)}
            />

            <InsightCard
              icon="footsteps-outline"
              title="Kick Counter"
              copy="Track movement"
              onPress={() => router.push('/kick-counter' as never)}
            />

            <InsightCard
              icon="pulse-outline"
              title="Contractions"
              copy="Time sessions"
              onPress={() => router.push('/contraction-timer' as never)}
            />

            <InsightCard
              icon="document-text-outline"
              title="Birth Plan"
              copy="Care preferences"
              onPress={() => router.push('/birth-plan' as never)}
            />
          </View>

          <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <View style={styles.infoTop}>
              <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name="calendar" size={24} color={palette.accent} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: palette.accent }]}>NEXT VISIT</Text>
                <Text style={[styles.infoTitle, { color: palette.ink }]}>
                  {nextAppointment?.title || nextAppointment?.type || 'No appointment on this day'}
                </Text>
              </View>
            </View>

            <Text style={[styles.infoCopy, { color: palette.text }]}>
              {nextAppointment
                ? `${formatDate(appointmentDate)}${appointmentTime ? ` at ${appointmentTime}` : ''}${
                    appointmentPlace ? ` • ${appointmentPlace}` : ''
                  }`
                : 'Nothing scheduled for this selected day.'}
            </Text>
          </View>

          <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <View style={styles.infoTop}>
              <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name="heart-circle-outline" size={25} color={palette.accent} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.eyebrow, { color: palette.accent }]}>LATEST CHECK IN</Text>
                <Text style={[styles.infoTitle, { color: palette.ink }]}>
                  {latestLog?.mood || 'No check in for this day'}
                </Text>
              </View>
            </View>

            <Text style={[styles.infoCopy, { color: palette.text }]}>{symptoms}</Text>

            {latestLog?.notes ? (
              <Text style={[styles.quote, { color: palette.muted }]}>“{latestLog.notes}”</Text>
            ) : null}
          </View>
        </>
      )}
    </Screen>
  );
}

function InsightCard({
  icon,
  title,
  copy,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.insightCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.insightIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={22} color={palette.accent} />
      </View>

      <Text style={[styles.insightTitle, { color: palette.ink }]}>{title}</Text>
      <Text style={[styles.insightCopy, { color: palette.text }]}>{copy}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  topIntro: {
    marginTop: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  greeting: {
    ...type.body,
    lineHeight: 22,
  },
  title: {
    ...type.title,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.8,
    marginTop: 5,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 14,
  },
  dateChip: {
    width: 64,
    height: 72,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    ...type.tiny,
    fontWeight: '900',
  },
  dateNumber: {
    ...type.bodyStrong,
    fontSize: 16,
    marginTop: 4,
  },
  babyCard: {
    minHeight: 286,
    borderRadius: 34,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18,
    marginBottom: 16,
  },
  blobOne: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.28)',
    right: -70,
    top: -60,
  },
  blobTwo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.18)',
    left: -60,
    bottom: 40,
  },
  babyVisual: {
    height: 188,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motherCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: 'rgba(255,255,255,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  motherEmoji: {
    fontSize: 76,
  },
  orbitLine: {
    position: 'absolute',
    bottom: 54,
    width: 220,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  orbitDot: {
    position: 'absolute',
    bottom: 46,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  journeyPill: {
    minHeight: 66,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
  },
  thumbCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 24,
  },
  journeyLabel: {
    ...type.small,
    color: '#2A151B',
    fontWeight: '900',
  },
  journeySub: {
    ...type.tiny,
    color: '#765B60',
    marginTop: 2,
    fontWeight: '800',
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPanel: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#2A151B',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  progressBadge: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBadgeText: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  progressTitle: {
    ...type.title,
    fontSize: 27,
    lineHeight: 32,
    marginTop: 5,
    letterSpacing: -0.6,
  },
  progressCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 7,
    fontWeight: '800',
  },
  progressTrackWrap: {
    marginTop: 18,
  },
  progressTrack: {
    height: 13,
    borderRadius: 999,
    backgroundColor: '#FFF0F1',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  progressLabels: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMiniText: {
    ...type.tiny,
    color: '#A98C93',
    fontWeight: '900',
  },
  track: {
    height: 11,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 16,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  dailyCareSummary: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  dailyCareSummaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  dailyCareSummaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyCareSummaryTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
    marginTop: 5,
  },
  dailyCareSummaryCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  dailyCareSummaryBadge: {
    minWidth: 54,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  dailyCareSummaryBadgeText: {
    ...type.small,
    fontWeight: '900',
  },
  dailyCareSummaryTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 15,
  },
  dailyCareSummaryFill: {
    height: '100%',
    borderRadius: 999,
  },
  movementSummary: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  movementSummaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  movementSummaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movementSummaryTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 25,
    marginTop: 5,
  },
  movementSummaryCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  loadingCard: {
    minHeight: 120,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    ...type.small,
    fontWeight: '800',
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    marginTop: 4,
    marginBottom: 12,
  },
  insightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    width: '48%',
    minHeight: 130,
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  insightCopy: {
    ...type.small,
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '700',
  },
  infoCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    marginTop: 16,
  },
  infoTop: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
  },
  infoIcon: {
    width: 54,
    height: 54,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    marginTop: 4,
  },
  infoCopy: {
    ...type.body,
    lineHeight: 23,
    marginTop: 14,
  },
  quote: {
    ...type.small,
    lineHeight: 20,
    marginTop: 10,
    fontWeight: '700',
  },
});
