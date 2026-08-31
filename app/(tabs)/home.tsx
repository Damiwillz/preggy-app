import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { supabase } from '@/lib/supabase';
import { getGuestAppointments, getGuestMedications, isGuestMode } from '@/services/guest';
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

type WeeklySummary = {
  careDays: number;
  waterCups: number;
  kickDays: number;
  symptomLogs: number;
};

type DailyStreak = {
  current: number;
  best: number;
  checkedInToday: boolean;
};

type CopilotSuggestion = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  route: string;
};

const DAILY_CARE_TOTAL = 5;
const WATER_TARGET = 8;
const GUEST_SYMPTOM_LOGS_KEY = 'preggy:guest-symptom-logs';
const homeFoetusImage = require('../../assets/images/home-foetus.png');

const emptyWeeklySummary: WeeklySummary = {
  careDays: 0,
  waterCups: 0,
  kickDays: 0,
  symptomLogs: 0,
};

const emptyDailyStreak: DailyStreak = {
  current: 0,
  best: 0,
  checkedInToday: false,
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getChecklistStorageKey(dateKey: string) {
  return `preggy:daily-care:${dateKey}`;
}

function getWaterStorageKey(dateKey: string) {
  return `preggy:water-cups:${dateKey}`;
}

function getKickStorageKey(dateKey: string) {
  return `preggy:kicks:${dateKey}`;
}

function getPlanDoneStorageKey(dateKey: string) {
  return `preggy:daily-plan-done:${dateKey}`;
}

function getReflectionStorageKey(dateKey: string) {
  return `preggy:daily-reflection:${dateKey}`;
}

function parseSavedArray<T = Record<string, unknown>>(raw: string | null): T[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function percentWidth(value: number) {
  return `${clamp(value, 0, 100)}%` as `${number}%`;
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '');

  if (clean.length !== 6) return hex;

  const red = Number.parseInt(clean.slice(0, 2), 16);
  const green = Number.parseInt(clean.slice(2, 4), 16);
  const blue = Number.parseInt(clean.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function buildLastSevenDateKeys() {
  const today = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);

    return toDateKey(date);
  });
}

function buildRecentDateKeys(days = 60) {
  const today = new Date();

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);

    return toDateKey(date);
  });
}

async function hasDailyCheckIn(dateKey: string) {
  const [doneRaw, reflectionRaw, careRaw, waterRaw, kicksRaw] = await Promise.all([
    AsyncStorage.getItem(getPlanDoneStorageKey(dateKey)),
    AsyncStorage.getItem(getReflectionStorageKey(dateKey)),
    AsyncStorage.getItem(getChecklistStorageKey(dateKey)),
    AsyncStorage.getItem(getWaterStorageKey(dateKey)),
    AsyncStorage.getItem(getKickStorageKey(dateKey)),
  ]);

  const manualDone = parseSavedArray(doneRaw).length > 0;
  const reflectionDone = Boolean(reflectionRaw?.trim());
  const careDone = parseSavedArray(careRaw).length > 0;
  const waterCount = waterRaw ? Number.parseInt(waterRaw, 10) : 0;
  const kickCount = kicksRaw ? Number.parseInt(kicksRaw, 10) : 0;

  return (
    manualDone ||
    reflectionDone ||
    careDone ||
    (Number.isFinite(waterCount) && waterCount > 0) ||
    (Number.isFinite(kickCount) && kickCount > 0)
  );
}

async function getDailyStreak(): Promise<DailyStreak> {
  const dateKeys = buildRecentDateKeys();
  const statuses = await Promise.all(
    dateKeys.map(async (dateKey) => ({
      dateKey,
      checked: await hasDailyCheckIn(dateKey),
    }))
  );

  const checkedInToday = statuses[0]?.checked ?? false;
  const startIndex = checkedInToday ? 0 : 1;

  let current = 0;

  for (let index = startIndex; index < statuses.length; index += 1) {
    if (!statuses[index]?.checked) break;
    current += 1;
  }

  let best = 0;
  let running = 0;

  [...statuses].reverse().forEach((item) => {
    if (item.checked) {
      running += 1;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  });

  return {
    current,
    best: Math.max(best, current),
    checkedInToday,
  };
}

async function getWeeklyLocalSummary(): Promise<WeeklySummary> {
  const dateKeys = buildLastSevenDateKeys();

  const [careValues, waterValues, kickValues, guestSymptomsRaw] = await Promise.all([
    Promise.all(dateKeys.map((key) => AsyncStorage.getItem(getChecklistStorageKey(key)))),
    Promise.all(dateKeys.map((key) => AsyncStorage.getItem(getWaterStorageKey(key)))),
    Promise.all(dateKeys.map((key) => AsyncStorage.getItem(getKickStorageKey(key)))),
    AsyncStorage.getItem(GUEST_SYMPTOM_LOGS_KEY),
  ]);

  const careLists = careValues.map(parseSavedArray);
  const waterCounts = waterValues.map((value) => {
    const parsed = value ? Number.parseInt(value, 10) : 0;
    return Number.isFinite(parsed) ? clamp(parsed, 0, WATER_TARGET) : 0;
  });
  const kickCounts = kickValues.map((value) => {
    const parsed = value ? Number.parseInt(value, 10) : 0;
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  });

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const symptomLogs = parseSavedArray<SymptomLog>(guestSymptomsRaw).filter((item) => {
    const createdAt = typeof item.created_at === 'string' ? Date.parse(item.created_at) : 0;

    return Number.isFinite(createdAt) && createdAt >= sevenDaysAgo;
  }).length;

  return {
    careDays: careLists.filter((list) => list.length > 0).length,
    waterCups: waterCounts.reduce((sum, value) => sum + value, 0),
    kickDays: kickCounts.filter((value) => value > 0).length,
    symptomLogs,
  };
}

function getPregnancyProgress(profile: UserProfile | null) {
  if (profile?.due_date) {
    const dueDate = new Date(`${profile.due_date}T12:00:00`);
    const today = new Date();

    if (!Number.isNaN(dueDate.getTime())) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / msPerDay);
      const pregnancyDay = clamp(280 - daysRemaining, 0, 280);

      return {
        week: clamp(Math.floor(pregnancyDay / 7) + 1, 1, 40),
        day: pregnancyDay % 7,
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

function buildWeekChips(currentWeek: number) {
  const start = clamp(currentWeek - 2, 1, 36);

  return Array.from({ length: 5 }, (_, index) => start + index).filter((week) => week >= 1 && week <= 40);
}

function getStageCopy(week: number, babyName: string) {
  if (week >= 37) {
    return {
      label: 'Term window',
      title: `${babyName} is getting ready`,
      copy: 'Keep your care team, hospital info, and daily notes close.',
    };
  }

  if (week >= 28) {
    return {
      label: 'Third trimester',
      title: `${babyName} is building rhythm`,
      copy: 'Track movement, appointments, and your daily comfort gently.',
    };
  }

  if (week >= 14) {
    return {
      label: 'Second trimester',
      title: `${babyName} is growing steadily`,
      copy: 'A soft daily check-in helps you notice patterns over time.',
    };
  }

  return {
    label: 'First trimester',
    title: `${babyName} is beginning beautifully`,
    copy: 'Keep notes simple: symptoms, water, rest, and questions.',
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

  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

function buildCopilotSuggestions({
  progress,
  dailyCareDone,
  waterCups,
  todayKicks,
  medicationTotal,
  medicationDone,
  nextAppointment,
  latestLog,
  dailyStreak,
  babyName,
}: {
  progress: { week: number; day: number; daysRemaining: number; progress: number };
  dailyCareDone: number;
  waterCups: number;
  todayKicks: number;
  medicationTotal: number;
  medicationDone: number;
  nextAppointment: Appointment | null;
  latestLog: SymptomLog | null;
  dailyStreak: DailyStreak;
  babyName: string;
}) {
  const suggestions: CopilotSuggestion[] = [];
  const careStarted = dailyCareDone > 0 || waterCups > 0;

  if (!careStarted) {
    suggestions.push({
      icon: 'list-circle-outline',
      title: 'Start today gently',
      detail: 'Open care, water, rest, and small daily tasks.',
      route: '/daily-plan',
    });
  } else if (waterCups < WATER_TARGET) {
    suggestions.push({
      icon: 'water-outline',
      title: 'Top up your water',
      detail: `${WATER_TARGET - waterCups} cups left for today’s goal.`,
      route: '/daily-care',
    });
  }

  if (progress.week >= 28 && todayKicks === 0) {
    suggestions.push({
      icon: 'footsteps-outline',
      title: 'Check movement',
      detail: `Log ${babyName}’s kicks when you have a calm moment.`,
      route: '/kick-counter',
    });
  }

  if (progress.week >= 34) {
    suggestions.push({
      icon: 'timer-outline',
      title: 'Open labour tools',
      detail: 'Time contractions and review saved sessions.',
      route: '/contraction-timer',
    });
  }

  if (medicationTotal > 0 && medicationDone < medicationTotal) {
    suggestions.push({
      icon: 'medkit-outline',
      title: 'Review meds',
      detail: `${medicationTotal - medicationDone} still marked as not taken.`,
      route: '/medication',
    });
  }

  if (nextAppointment) {
    const visitTitle = nextAppointment.title || nextAppointment.type || 'Today’s visit';
    const visitDate = nextAppointment.appointment_date || nextAppointment.date;
    const visitTime = nextAppointment.appointment_time || nextAppointment.time;

    suggestions.push({
      icon: 'calendar-outline',
      title: 'Prep for appointment',
      detail: `${visitTitle} • ${formatDate(visitDate)}${visitTime ? ` at ${visitTime}` : ''}`,
      route: '/(tabs)/appointments',
    });
  } else if (!latestLog) {
    suggestions.push({
      icon: 'pulse-outline',
      title: 'Log how you feel',
      detail: 'Save mood, symptoms, and notes for today.',
      route: '/log-symptoms',
    });
  }

  if (suggestions.length < 3 && progress.week >= 32) {
    suggestions.push({
      icon: 'bag-handle-outline',
      title: 'Review birth prep',
      detail: 'Check plans, hospital info, and important notes.',
      route: '/birth-preferences',
    });
  }

  if (suggestions.length < 3 && dailyStreak.checkedInToday) {
    suggestions.push({
      icon: 'stats-chart-outline',
      title: 'See your weekly pattern',
      detail: 'Open your soft progress report.',
      route: '/weekly-report',
    });
  }

  if (suggestions.length < 3) {
    suggestions.push({
      icon: 'sparkles-outline',
      title: 'Ask Preggy AI',
      detail: 'Get help with planning, questions, or reminders.',
      route: '/ai-chat?fromHome=1',
    });
  }

  return suggestions.slice(0, 3);
}

function CopilotCard({
  suggestions,
  babyName,
}: {
  suggestions: CopilotSuggestion[];
  babyName: string;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.copilotCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={styles.copilotTop}>
        <View style={styles.copilotTitleWrap}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGGY COPILOT</Text>
          <Text style={[styles.copilotTitle, { color: palette.ink }]}>Your next gentle moves</Text>
          <Text style={[styles.copilotCopy, { color: palette.text }]}>
            Smart suggestions for today with {babyName}.
          </Text>
        </View>

        <AnimatedPressable
          onPress={() => router.push('/ai-chat?fromHome=1' as never)}
          style={[styles.copilotAsk, { backgroundColor: palette.accentSoft }]}
        >
          <Ionicons name="sparkles-outline" size={16} color={palette.accent} />
          <Text style={[styles.copilotAskText, { color: palette.accent }]}>Ask</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.copilotList}>
        {suggestions.map((item, index) => (
          <AnimatedPressable
            key={`${item.route}-${index}`}
            onPress={() => router.push(item.route as never)}
            style={[styles.copilotItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
          >
            <View style={[styles.copilotItemIcon, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name={item.icon} size={18} color={palette.accent} />
            </View>

            <View style={styles.copilotItemText}>
              <Text style={[styles.copilotItemTitle, { color: palette.ink }]}>{item.title}</Text>
              <Text style={[styles.copilotItemDetail, { color: palette.text }]} numberOfLines={1}>
                {item.detail}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={palette.muted} />
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}

function BabyVisual({
  week,
  palette,
}: {
  week: number;
  palette: ReturnType<typeof useAppTheme>['palette'];
}) {
  const development = clamp(week / 40, 0.35, 1);
  const imageScale = 0.9 + development * 0.12;

  return (
    <View style={styles.visualWrap}>
      <View style={[styles.visualGlowOne, { backgroundColor: withAlpha(palette.accent, 0.16) }]} />
      <View style={[styles.visualGlowTwo, { backgroundColor: withAlpha(palette.accent, 0.1) }]} />

      <Image
        source={homeFoetusImage}
        resizeMode="contain"
        style={[
          styles.foetusImage,
          {
            transform: [{ scale: imageScale }],
          },
        ]}
      />
    </View>
  );
}

function MetricCard({
  icon,
  value,
  label,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  detail: string;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.metricCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.metricIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={19} color={palette.accent} />
      </View>

      <Text style={[styles.metricValue, { color: palette.ink }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: palette.text }]}>{label}</Text>
      <Text style={[styles.metricDetail, { color: palette.muted }]}>{detail}</Text>
    </AnimatedPressable>
  );
}

function ActionCard({
  icon,
  title,
  detail,
  route,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  route: string;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={() => router.push(route as never)}
      style={[styles.actionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.actionIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={21} color={palette.accent} />
      </View>

      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, { color: palette.ink }]}>{title}</Text>
        <Text style={[styles.actionDetail, { color: palette.text }]} numberOfLines={1}>
          {detail}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={19} color={palette.muted} />
    </AnimatedPressable>
  );
}

export default function HomeScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestLog, setLatestLog] = useState<SymptomLog | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [dailyCareDone, setDailyCareDone] = useState(0);
  const [waterCups, setWaterCups] = useState(0);
  const [todayKicks, setTodayKicks] = useState(0);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>(emptyWeeklySummary);
  const [dailyStreak, setDailyStreak] = useState<DailyStreak>(emptyDailyStreak);
  const [loading, setLoading] = useState(true);
  const [previewWeek, setPreviewWeek] = useState<number | null>(null);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const progress = useMemo(() => getPregnancyProgress(profile), [profile]);
  const babyName = profile?.baby_nickname || 'Baby';
  const firstName = profile?.full_name?.split(' ')?.[0] || 'Mama';

  useEffect(() => {
    setPreviewWeek(null);
  }, [progress.week]);

  const activeWeek = previewWeek ?? progress.week;
  const activeDay = activeWeek === progress.week ? progress.day : 0;
  const activePregnancyDay = clamp((activeWeek - 1) * 7 + activeDay, 0, 280);
  const activeProgress = Math.round((activePregnancyDay / 280) * 100);
  const activeDaysRemaining = clamp(280 - activePregnancyDay, 0, 280);
  const stage = useMemo(() => getStageCopy(activeWeek, babyName), [activeWeek, babyName]);
  const weekChips = useMemo(() => buildWeekChips(progress.week), [progress.week]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadHome() {
        setLoading(true);

        try {
          const guest = await isGuestMode().catch(() => false);

          try {
            const profileData = await getMyProfile();
            if (mounted) setProfile(profileData);
          } catch (error) {
            console.log('Home profile skipped:', error);
            if (mounted) setProfile(null);
          }

          const [savedCare, savedWater, savedKicks] = await Promise.all([
            AsyncStorage.getItem(getChecklistStorageKey(todayKey)),
            AsyncStorage.getItem(getWaterStorageKey(todayKey)),
            AsyncStorage.getItem(getKickStorageKey(todayKey)),
          ]);

          if (!mounted) return;

          const parsedCare = parseSavedArray(savedCare);
          const parsedWater = savedWater ? Number.parseInt(savedWater, 10) : 0;
          const parsedKicks = savedKicks ? Number.parseInt(savedKicks, 10) : 0;

          setDailyCareDone(Math.min(parsedCare.length, DAILY_CARE_TOTAL));
          setWaterCups(Number.isFinite(parsedWater) ? clamp(parsedWater, 0, WATER_TARGET) : 0);
          setTodayKicks(Number.isFinite(parsedKicks) ? Math.max(parsedKicks, 0) : 0);

          if (guest) {
            const [guestSymptomRaw, guestMedications, guestAppointments] = await Promise.all([
              AsyncStorage.getItem(GUEST_SYMPTOM_LOGS_KEY),
              getGuestMedications(),
              getGuestAppointments(),
            ]);

            if (!mounted) return;

            const guestSymptoms = parseSavedArray<SymptomLog>(guestSymptomRaw);
            const latestGuestLog = guestSymptoms.find((item) =>
              typeof item.created_at === 'string' && item.created_at.startsWith(todayKey)
            );

            setLatestLog(latestGuestLog ?? null);
            setMedications(
              guestMedications.map((item) => ({
                id: item.id,
                name: item.name,
                dosage: item.dosage,
                time: item.time,
                taken: item.taken,
              }))
            );

            const upcomingGuestAppointment = guestAppointments.find((item) => {
              const appointmentDate = item.appointment_date || item.date;
              return item.status !== 'Cancelled' && appointmentDate === todayKey;
            });

            setNextAppointment(
              upcomingGuestAppointment
                ? {
                    id: upcomingGuestAppointment.id,
                    title: upcomingGuestAppointment.title,
                    type: upcomingGuestAppointment.type,
                    date: upcomingGuestAppointment.date,
                    appointment_date: upcomingGuestAppointment.appointment_date,
                    time: upcomingGuestAppointment.time,
                    appointment_time: upcomingGuestAppointment.appointment_time,
                    location: upcomingGuestAppointment.location,
                    clinic_name: upcomingGuestAppointment.clinic_name,
                    status: upcomingGuestAppointment.status,
                  }
                : null
            );
          } else {
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user?.id;

            if (userId) {
              const [logResult, medsResult, appointmentResult] = await Promise.all([
                supabase
                  .from('symptom_logs')
                  .select('*')
                  .eq('user_id', userId)
                  .gte('created_at', `${todayKey}T00:00:00`)
                  .lt('created_at', `${todayKey}T23:59:59`)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle(),
                supabase.from('medications').select('*').eq('user_id', userId),
                supabase
                  .from('appointments')
                  .select('*')
                  .eq('user_id', userId)
                  .neq('status', 'Cancelled')
                  .or(`appointment_date.eq.${todayKey},date.eq.${todayKey}`)
                  .limit(1)
                  .maybeSingle(),
              ]);

              if (!mounted) return;

              if (!logResult.error) setLatestLog((logResult.data as SymptomLog | null) ?? null);
              if (!medsResult.error) setMedications((medsResult.data ?? []) as Medication[]);
              if (!appointmentResult.error) setNextAppointment((appointmentResult.data as Appointment | null) ?? null);
            }
          }

          const [nextWeeklySummary, nextDailyStreak] = await Promise.all([
            getWeeklyLocalSummary(),
            getDailyStreak(),
          ]);

          if (!mounted) return;

          setWeeklySummary(nextWeeklySummary);
          setDailyStreak(nextDailyStreak);
        } catch (error) {
          console.log('Home dashboard error:', error);
        } finally {
          if (mounted) setLoading(false);
        }
      }

      void loadHome();

      return () => {
        mounted = false;
      };
    }, [todayKey])
  );

  const medicationDone = medications.filter((item) => item.taken).length;
  const medicationTotal = medications.length;
  const dailyCareProgress = Math.round(((dailyCareDone + waterCups) / (DAILY_CARE_TOTAL + WATER_TARGET)) * 100);

  const symptomText = latestLog?.symptoms?.length
    ? latestLog.symptoms.join(', ')
    : latestLog?.mood
      ? `${latestLog.mood} mood logged`
      : 'No symptoms logged today';

  const appointmentDate = nextAppointment?.appointment_date || nextAppointment?.date;
  const appointmentTime = nextAppointment?.appointment_time || nextAppointment?.time;
  const appointmentTitle = nextAppointment?.title || nextAppointment?.type || 'No appointment today';
  const appointmentDetail = nextAppointment
    ? `${formatDate(appointmentDate)}${appointmentTime ? ` • ${appointmentTime}` : ''}`
    : 'Add or review your next visit';

  const copilotSuggestions = useMemo(
    () =>
      buildCopilotSuggestions({
        progress,
        dailyCareDone,
        waterCups,
        todayKicks,
        medicationTotal,
        medicationDone,
        nextAppointment,
        latestLog,
        dailyStreak,
        babyName,
      }),
    [progress, dailyCareDone, waterCups, todayKicks, medicationTotal, medicationDone, nextAppointment, latestLog, dailyStreak, babyName]
  );

  return (
    <Screen bottomSpace={118}>
      <Header title="Preggy" />

      <View style={styles.topCenter}>
        <Text style={[styles.daysTitle, { color: palette.ink }]}>
          {activeDaysRemaining > 0 ? `${activeDaysRemaining} days to go` : 'Due date window'}
        </Text>
        <Text style={[styles.daysSubtitle, { color: palette.text }]}>
          Week {activeWeek} {activeDay ? `• Day ${activeDay}` : ''} • {stage.label}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekStrip}
      >
        {weekChips.map((week) => {
          const active = week === activeWeek;

          return (
            <AnimatedPressable
              key={week}
              onPress={() => setPreviewWeek(week)}
              style={[
                styles.weekChip,
                {
                  backgroundColor: active ? palette.accent : palette.accentSoft,
                  borderColor: active ? palette.accent : palette.line,
                },
              ]}
            >
              <Text style={[styles.weekChipText, { color: active ? palette.onAccent : palette.accent }]}>
                {week} week
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      <CopilotCard suggestions={copilotSuggestions} babyName={babyName} />

      <AnimatedPressable onPress={() => router.push('/baby-growth' as never)}>
        <LinearGradient
          colors={[
            palette.surface,
            withAlpha(palette.accent, palette.isDark ? 0.2 : 0.16),
            palette.softSurface,
          ]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.babyCard, { borderColor: palette.line }]}
        >
          <View style={styles.openPill}>
            <Ionicons name="play-circle" size={16} color="#FFFFFF" />
            <Text style={styles.openText}>Growth</Text>
          </View>

          <BabyVisual week={activeWeek} palette={palette} />

          <View style={styles.glassPill}>
            <Text style={[styles.stageLabel, { color: palette.text }]}>{stage.label}</Text>
            <View style={styles.glassLine}>
              <Text style={[styles.glassWeek, { color: palette.ink }]}>{activeWeek}</Text>
              <Text style={[styles.glassSmall, { color: palette.text }]}>Weeks</Text>
              <Text style={[styles.glassWeek, { color: palette.ink }]}>{activeDay}</Text>
              <Text style={[styles.glassSmall, { color: palette.text }]}>Days</Text>
            </View>
          </View>
        </LinearGradient>
      </AnimatedPressable>

      <View style={[styles.progressMini, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>TODAY WITH {babyName.toUpperCase()}</Text>
          <Text style={[styles.stageTitle, { color: palette.ink }]}>{stage.title}</Text>
          <Text style={[styles.stageCopy, { color: palette.text }]}>{stage.copy}</Text>
        </View>

        <View style={[styles.percentBubble, { backgroundColor: palette.accentSoft }]}>
          <Text style={[styles.percentValue, { color: palette.accent }]}>{activeProgress}%</Text>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: palette.accentSoft }]}>
        <View style={[styles.progressFill, { width: percentWidth(activeProgress), backgroundColor: palette.accent }]} />
      </View>

      <View style={styles.metricGrid}>
        <MetricCard
          icon="water-outline"
          value={`${dailyCareDone}/${DAILY_CARE_TOTAL}`}
          label="Care"
          detail={`${waterCups}/${WATER_TARGET} water`}
          onPress={() => router.push('/daily-care' as never)}
        />

        <MetricCard
          icon="footsteps-outline"
          value={`${todayKicks}`}
          label="Movement"
          detail="kicks today"
          onPress={() => router.push('/kick-counter' as never)}
        />

        <MetricCard
          icon="medkit-outline"
          value={medicationTotal ? `${medicationDone}/${medicationTotal}` : '0'}
          label="Meds"
          detail={medicationTotal ? 'taken' : 'no routine'}
          onPress={() => router.push('/medication' as never)}
        />
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.sectionTop}>
          <View>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>{greeting().toUpperCase()}, {firstName.toUpperCase()}</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Today’s plan</Text>
          </View>

          {loading ? <ActivityIndicator color={palette.accent} /> : null}
        </View>

        <ActionCard
          icon="list-circle-outline"
          title="Open daily plan"
          detail={`${dailyCareProgress}% care complete • ${dailyStreak.current} day streak`}
          route="/daily-plan"
        />

        <ActionCard
          icon="pulse-outline"
          title="Log symptoms"
          detail={symptomText}
          route="/log-symptoms"
        />

        <ActionCard
          icon="calendar-outline"
          title={appointmentTitle}
          detail={appointmentDetail}
          route="/(tabs)/appointments"
        />
      </View>

      <View style={[styles.weeklyCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.sectionTop}>
          <View>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>WEEKLY SNAPSHOT</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Soft progress</Text>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/weekly-report' as never)}
            style={[styles.reportButton, { backgroundColor: palette.accentSoft }]}
          >
            <Text style={[styles.reportText, { color: palette.accent }]}>Report</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.snapshotRow}>
          <View style={[styles.snapshotItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
            <Text style={[styles.snapshotValue, { color: palette.ink }]}>{weeklySummary.careDays}/7</Text>
            <Text style={[styles.snapshotLabel, { color: palette.text }]}>care days</Text>
          </View>

          <View style={[styles.snapshotItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
            <Text style={[styles.snapshotValue, { color: palette.ink }]}>{weeklySummary.waterCups}</Text>
            <Text style={[styles.snapshotLabel, { color: palette.text }]}>water</Text>
          </View>

          <View style={[styles.snapshotItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
            <Text style={[styles.snapshotValue, { color: palette.ink }]}>{weeklySummary.kickDays}</Text>
            <Text style={[styles.snapshotLabel, { color: palette.text }]}>kick days</Text>
          </View>

          <View style={[styles.snapshotItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
            <Text style={[styles.snapshotValue, { color: palette.ink }]}>{weeklySummary.symptomLogs}</Text>
            <Text style={[styles.snapshotLabel, { color: palette.text }]}>logs</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomActions}>
        <AnimatedPressable
          onPress={() => router.push('/timeline' as never)}
          style={[styles.bottomButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="calendar-outline" size={20} color={palette.accent} />
          <Text style={[styles.bottomButtonText, { color: palette.ink }]}>Timeline</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/tools' as never)}
          style={[styles.bottomButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="grid-outline" size={20} color={palette.accent} />
          <Text style={[styles.bottomButtonText, { color: palette.ink }]}>Tools</Text>
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topCenter: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  daysTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    lineHeight: 24,
  },
  daysSubtitle: {
    ...type.small,
    marginTop: 2,
  },
  weekStrip: {
    gap: 9,
    paddingBottom: 16,
    paddingRight: 8,
  },
  weekChip: {
    minHeight: 34,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekChipText: {
    ...type.tiny,
    fontSize: 12,
  },
  babyCard: {
    height: 290,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openPill: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 5,
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(255,255,255,0.42)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  openText: {
    ...type.tiny,
    color: '#FFFFFF',
  },
  visualWrap: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foetusImage: {
    width: '112%',
    height: '112%',
    zIndex: 3,
  },
  fetusSvg: {
    zIndex: 2,
  },
  visualGlowOne: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    top: 48,
  },
  visualGlowTwo: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    bottom: -70,
    right: -80,
  },
  babyShape: {
    width: 190,
    height: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
  babyHead: {
    width: 102,
    height: 108,
    borderRadius: 54,
    marginBottom: -10,
    opacity: 0.92,
  },
  babyBody: {
    width: 126,
    height: 145,
    borderRadius: 65,
    opacity: 0.78,
  },
  babyBelly: {
    position: 'absolute',
    width: 86,
    height: 96,
    borderRadius: 45,
    bottom: 24,
    right: 32,
  },
  babyArm: {
    position: 'absolute',
    width: 54,
    height: 20,
    borderRadius: 99,
    right: 19,
    top: 124,
    transform: [{ rotate: '26deg' }],
  },
  glassPill: {
    position: 'absolute',
    bottom: 22,
    minWidth: 138,
    minHeight: 64,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageLabel: {
    ...type.tiny,
    opacity: 0.78,
  },
  glassLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 2,
  },
  glassWeek: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  glassSmall: {
    ...type.tiny,
  },
  progressMini: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  eyebrow: {
    ...type.tiny,
    letterSpacing: 1.25,
  },
  stageTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 25,
    marginTop: 3,
  },
  stageCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 4,
  },
  percentBubble: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  copilotCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
  },
  copilotTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 13,
  },
  copilotTitleWrap: {
    flex: 1,
  },
  copilotTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    lineHeight: 23,
    marginTop: 3,
  },
  copilotCopy: {
    ...type.small,
    marginTop: 4,
  },
  copilotAsk: {
    minHeight: 38,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copilotAskText: {
    ...type.small,
    fontWeight: '800',
  },
  copilotList: {
    gap: 9,
  },
  copilotItem: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  copilotItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copilotItemText: {
    flex: 1,
  },
  copilotItemTitle: {
    ...type.small,
    fontWeight: '800',
  },
  copilotItemDetail: {
    ...type.tiny,
    marginTop: 2,
  },
  aiCard: {
    minHeight: 68,
    borderRadius: 24,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aiIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  aiDetail: {
    ...type.tiny,
    opacity: 0.84,
    marginTop: 1,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    minHeight: 126,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
  },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  metricValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  metricLabel: {
    ...type.small,
    marginTop: 1,
  },
  metricDetail: {
    ...type.tiny,
    marginTop: 3,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
  },
  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 11,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 25,
    lineHeight: 30,
    marginTop: 2,
  },
  actionCard: {
    minHeight: 66,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
  },
  actionTitle: {
    ...type.bodyStrong,
  },
  actionDetail: {
    ...type.small,
    marginTop: 1,
  },
  weeklyCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 16,
    marginBottom: 14,
  },
  reportButton: {
    minHeight: 38,
    borderRadius: 16,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportText: {
    ...type.small,
    fontWeight: '900',
  },
  snapshotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  snapshotItem: {
    flex: 1,
    minHeight: 82,
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
    justifyContent: 'center',
  },
  snapshotValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
  },
  snapshotLabel: {
    ...type.tiny,
    marginTop: 4,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 10,
  },
  bottomButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 21,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bottomButtonText: {
    ...type.bodyStrong,
  },
});
