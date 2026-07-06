import React, { useCallback, useMemo, useState } from 'react';
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

      <View style={styles.intro}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: palette.text }]}>
            {greeting()}, {firstName}
          </Text>
          <Text style={[styles.title, { color: palette.ink }]}>
            A calm day for you and {babyName}
          </Text>
        </View>

        <AnimatedPressable
          onPress={() => router.push('/tools' as never)}
          style={[styles.toolsCircle, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="grid-outline" size={22} color={palette.accent} />
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
        style={[styles.hero, { backgroundColor: palette.accent, borderColor: palette.accent }]}
      >
        <View style={styles.heroBlobOne} />
        <View style={styles.heroBlobTwo} />

        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.onAccent }]}>PREGNANCY JOURNEY</Text>
            <Text style={[styles.heroTitle, { color: palette.onAccent }]}>
              Week {progress.week}, Day {progress.day}
            </Text>
            <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
              {progress.daysRemaining > 0
                ? `${progress.daysRemaining} days until your estimated due date.`
                : 'You are in your due date window.'}
            </Text>
          </View>

          <View style={styles.heroBaby}>
            <Text style={styles.heroEmoji}>🤰</Text>
          </View>
        </View>

        <View style={styles.heroTrack}>
          <View style={[styles.heroFill, { width: `${progress.progress}%` }]} />
        </View>

        <View style={styles.heroFooter}>
          <Text style={[styles.heroFooterText, { color: palette.onAccent }]}>
            {progress.progress}% complete
          </Text>
          <Ionicons name="arrow-forward" size={19} color={palette.onAccent} />
        </View>
      </AnimatedPressable>

      <View style={styles.summaryRow}>
        <SummaryCard
          icon="water-outline"
          label="Care"
          value={`${dailyCareDone}/${DAILY_CARE_TOTAL}`}
          copy={`${waterCups}/${WATER_TARGET} water`}
          onPress={() => router.push('/daily-care' as never)}
        />

        <SummaryCard
          icon="footsteps-outline"
          label="Movement"
          value={`${todayKicks}`}
          copy="kicks today"
          onPress={() => router.push('/kick-counter' as never)}
        />

        <SummaryCard
          icon="medkit-outline"
          label="Meds"
          value={medicationTotal ? `${medicationDone}/${medicationTotal}` : '—'}
          copy={medicationTotal ? 'taken' : 'no routine'}
          onPress={() => router.push('/medication' as never)}
        />
      </View>

      <AnimatedPressable
        onPress={() => router.push('/daily-care' as never)}
        style={[styles.careCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
      >
        <View style={styles.careTop}>
          <View style={[styles.careIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="heart-circle-outline" size={26} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>TODAY’S CARE</Text>
            <Text style={[styles.careTitle, { color: palette.ink }]}>
              {dailyCareProgress}% of your routine complete
            </Text>
            <Text style={[styles.careCopy, { color: palette.text }]}>
              Checklist, hydration, and gentle daily support.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={22} color={palette.muted} />
        </View>

        <View style={[styles.careTrack, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.careFill, { width: `${dailyCareProgress}%`, backgroundColor: palette.accent }]} />
        </View>
      </AnimatedPressable>

      {loading ? (
        <View style={[styles.loadingCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text }]}>Refreshing dashboard...</Text>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>Quick actions</Text>

          <View style={styles.actionGrid}>
            <ActionCard
              icon="add-circle-outline"
              title="Symptoms"
              copy="Log mood and notes"
              onPress={() => router.push('/log-symptoms' as never)}
            />

            <ActionCard
              icon="calendar-outline"
              title="Appointments"
              copy={
                nextAppointment
                  ? `${formatDate(appointmentDate)} ${appointmentTime ?? ''}`.trim()
                  : 'No visit today'
              }
              onPress={() => router.push('/(tabs)/appointments' as never)}
            />

            <ActionCard
              icon="grid-outline"
              title="Tools"
              copy="Trackers and guides"
              onPress={() => router.push('/tools' as never)}
            />
          </View>

          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name="calendar" size={23} color={palette.accent} />
              </View>

              <Text style={[styles.eyebrow, { color: palette.accent }]}>NEXT VISIT</Text>
              <Text style={[styles.infoTitle, { color: palette.ink }]}>
                {nextAppointment?.title || nextAppointment?.type || 'No appointment on this day'}
              </Text>
              <Text style={[styles.infoCopy, { color: palette.text }]}>
                {nextAppointment
                  ? `${formatDate(appointmentDate)}${appointmentTime ? ` at ${appointmentTime}` : ''}${
                      appointmentPlace ? ` • ${appointmentPlace}` : ''
                    }`
                  : 'Nothing scheduled for this selected day.'}
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name="heart-outline" size={23} color={palette.accent} />
              </View>

              <Text style={[styles.eyebrow, { color: palette.accent }]}>CHECK-IN</Text>
              <Text style={[styles.infoTitle, { color: palette.ink }]}>
                {latestLog?.mood || 'No check in yet'}
              </Text>
              <Text style={[styles.infoCopy, { color: palette.text }]}>{symptoms}</Text>

              {latestLog?.notes ? (
                <Text style={[styles.quote, { color: palette.muted }]}>“{latestLog.notes}”</Text>
              ) : null}
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  copy,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  copy: string;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.summaryIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={20} color={palette.accent} />
      </View>
      <Text style={[styles.summaryLabel, { color: palette.text }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: palette.ink }]}>{value}</Text>
      <Text style={[styles.summaryCopy, { color: palette.muted }]}>{copy}</Text>
    </AnimatedPressable>
  );
}

function ActionCard({
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
      style={[styles.actionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.actionIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={22} color={palette.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.actionTitle, { color: palette.ink }]}>{title}</Text>
        <Text style={[styles.actionCopy, { color: palette.text }]}>{copy}</Text>
      </View>

      <Ionicons name="chevron-forward" size={19} color={palette.muted} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  greeting: {
    ...type.body,
    lineHeight: 22,
  },
  title: {
    ...type.title,
    fontSize: 31,
    lineHeight: 36,
    letterSpacing: -0.8,
    marginTop: 5,
  },
  toolsCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  hero: {
    minHeight: 250,
    borderRadius: 36,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 22,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  heroBlobOne: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.16)',
    right: -80,
    top: -90,
  },
  heroBlobTwo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.12)',
    left: -60,
    bottom: -60,
  },
  heroTop: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  heroTitle: {
    ...type.title,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    marginTop: 6,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 21,
    fontWeight: '900',
    marginTop: 9,
    opacity: 0.92,
  },
  heroBaby: {
    width: 72,
    height: 72,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 40,
  },
  heroTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
    marginTop: 18,
  },
  heroFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  heroFooter: {
    marginTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroFooterText: {
    ...type.small,
    fontWeight: '900',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: 26,
    borderWidth: 1,
    padding: 13,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    ...type.tiny,
    fontWeight: '900',
  },
  summaryValue: {
    ...type.bodyStrong,
    fontSize: 20,
    marginTop: 3,
  },
  summaryCopy: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 2,
    fontWeight: '800',
  },
  careCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  careTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  careIcon: {
    width: 56,
    height: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  careTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    lineHeight: 24,
    marginTop: 5,
  },
  careCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  careTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 15,
  },
  careFill: {
    height: '100%',
    borderRadius: 999,
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
    marginBottom: 12,
  },
  actionGrid: {
    gap: 10,
    marginBottom: 16,
  },
  actionCard: {
    minHeight: 82,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  actionCopy: {
    ...type.small,
    lineHeight: 18,
    marginTop: 3,
    fontWeight: '800',
  },
  infoGrid: {
    gap: 14,
  },
  infoCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  infoIcon: {
    width: 52,
    height: 52,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  infoTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 25,
    marginTop: 5,
  },
  infoCopy: {
    ...type.body,
    lineHeight: 23,
    marginTop: 10,
  },
  quote: {
    ...type.small,
    lineHeight: 20,
    marginTop: 10,
    fontWeight: '700',
  },
});
