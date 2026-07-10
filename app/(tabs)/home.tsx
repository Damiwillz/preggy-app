import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

const gentleReminders = [
  'You are doing something beautiful, one calm day at a time.',
  'Your body is working hard. Rest is productive too.',
  'Small steps still count on heavy days.',
  'You and baby are growing through this together.',
  'Breathe softly. You do not have to do everything today.',
  'Every check-in is an act of care.',
  'You are allowed to move gently and rest deeply.',
];

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

function dateFromKey(dateKey: string) {
  const parsed = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function buildDateStrip(selectedDateKey: string) {
  const today = new Date();
  const todayKey = toDateKey(today);

  const dates = Array.from({ length: 120 }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const key = toDateKey(date);

    return {
      key,
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toLocaleDateString('en-US', { day: '2-digit' }),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: key === todayKey,
      isSelected: key === selectedDateKey,
    };
  });

  const selectedExists = dates.some((item) => item.key === selectedDateKey);

  if (!selectedExists) {
    const selectedDate = dateFromKey(selectedDateKey);

    dates.unshift({
      key: selectedDateKey,
      day: selectedDate.toLocaleDateString('en-US', { weekday: 'short' }),
      date: selectedDate.toLocaleDateString('en-US', { day: '2-digit' }),
      month: selectedDate.toLocaleDateString('en-US', { month: 'short' }),
      isToday: selectedDateKey === todayKey,
      isSelected: true,
    });
  }

  return dates;
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
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateDraft, setDateDraft] = useState(() => toDateKey(new Date()));


  function openDatePicker() {
    setDateDraft(selectedDateKey);
    setDatePickerOpen(true);
  }

  function applyManualDate() {
    const clean = dateDraft.trim();
    const parsed = new Date(`${clean}T12:00:00`);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean) || Number.isNaN(parsed.getTime())) {
      return;
    }

    setSelectedDateKey(toDateKey(parsed));
    setDatePickerOpen(false);
  }

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
  const dateStrip = useMemo(() => buildDateStrip(selectedDateKey), [selectedDateKey]);
  const babyName = profile?.baby_nickname || 'Baby';
  const firstName = profile?.full_name?.split(' ')?.[0] || 'Mama';
  const medicationDone = medications.filter((item) => item.taken).length;
  const medicationTotal = medications.length;
  const symptoms = latestLog?.symptoms?.length ? latestLog.symptoms.join(', ') : 'No symptoms logged for this day';
  const appointmentDate = nextAppointment?.appointment_date || nextAppointment?.date;
  const appointmentTime = nextAppointment?.appointment_time || nextAppointment?.time;
  const appointmentPlace = nextAppointment?.clinic_name || nextAppointment?.location;
  const dailyCareProgress = Math.round(((dailyCareDone + waterCups) / (DAILY_CARE_TOTAL + WATER_TARGET)) * 100);
  const reminderIndex = Math.abs(selectedDateKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % gentleReminders.length;
  const gentleReminder = gentleReminders[reminderIndex];

  return (
    <Screen bottomSpace={120}>
      <Header />

      <View style={[styles.heroIntroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.heroIntroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: palette.text }]}>
              {greeting()}, {firstName}
            </Text>
            <Text style={[styles.title, { color: palette.ink }]}>
              Your calm pregnancy space
            </Text>
            <Text style={[styles.introSubtext, { color: palette.text }]}>
              Track today, plan ahead, and care for you and {babyName}.
            </Text>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/tools' as never)}
            style={[styles.toolsCircle, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}
          >
            <Ionicons name="grid-outline" size={22} color={palette.accent} />
          </AnimatedPressable>
        </View>

        <View style={styles.heroIntroStats}>
          <View style={[styles.introMiniPill, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="calendar-outline" size={15} color={palette.accent} />
            <Text style={[styles.introMiniText, { color: palette.accent }]}>Week {progress.week}</Text>
          </View>

          <View style={[styles.introMiniPill, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="heart-outline" size={15} color={palette.accent} />
            <Text style={[styles.introMiniText, { color: palette.accent }]}>{progress.progress}% complete</Text>
          </View>
        </View>
      </View>

      <View style={[styles.datePickerPanel, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.dateHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.dateHeaderLabel, { color: palette.accent }]}>SELECT DAY</Text>
          <Text style={[styles.dateHeaderTitle, { color: palette.ink }]}>
            {dateFromKey(selectedDateKey).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        <View style={styles.dateHeaderActions}>

          <AnimatedPressable
            onPress={openDatePicker}
            style={[styles.chooseDateButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
          >
            <Ionicons name="calendar-outline" size={17} color={palette.accent} />
            <Text style={[styles.chooseDateText, { color: palette.accent }]}>Choose</Text>
          </AnimatedPressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateScroller}
        style={styles.dateScroll}
      >
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
                  transform: [{ scale: active ? 1.03 : 1 }],
                },
              ]}
            >
              <Text style={[styles.dateMonth, { color: active ? palette.onAccent : palette.muted }]}>
                {item.month}
              </Text>

              <Text style={[styles.dateDay, { color: active ? palette.onAccent : palette.text }]}>
                {item.isToday ? 'Today' : item.day}
              </Text>

              <Text style={[styles.dateNumber, { color: active ? palette.onAccent : palette.ink }]}>
                {item.date}
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      </View>

      <Modal visible={datePickerOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.dateModal, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <View style={styles.dateModalTop}>
              <Text style={[styles.dateModalTitle, { color: palette.ink }]}>Choose date</Text>
              <AnimatedPressable onPress={() => setDatePickerOpen(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={palette.muted} />
              </AnimatedPressable>
            </View>

            <Text style={[styles.dateModalCopy, { color: palette.text }]}>
              Type a date in this format: YYYY-MM-DD
            </Text>

            <TextInput
              value={dateDraft}
              onChangeText={setDateDraft}
              placeholder="2026-07-10"
              placeholderTextColor={palette.muted}
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              style={[
                styles.dateInput,
                {
                  color: palette.ink,
                  backgroundColor: palette.canvas,
                  borderColor: palette.line,
                },
              ]}
            />

            <AnimatedPressable
              onPress={applyManualDate}
              style={[styles.applyDateButton, { backgroundColor: palette.accent }]}
            >
              <Text style={[styles.applyDateText, { color: palette.onAccent }]}>Use this date</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      <AnimatedPressable
        onPress={() => router.push('/timeline' as never)}
        style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.line }]}
      >
        <View style={styles.heroTopClean}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>PREGNANCY JOURNEY</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>Week {progress.week}</Text>
            <Text style={[styles.heroSubtitle, { color: palette.text }]}>
              Day {progress.day} • {progress.daysRemaining > 0 ? `${progress.daysRemaining} days left` : 'Due date window'}
            </Text>
          </View>

          <View style={[styles.heroWeekBadge, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
            <Text style={[styles.heroWeekBadgeText, { color: palette.accent }]}>D{progress.day}</Text>
          </View>
        </View>

        <View style={styles.heroBodyClean}>
          <View style={[styles.heroDiagramClean, { backgroundColor: palette.accentSoft }]}>
            <View style={[styles.heroDiagramRingLarge, { borderColor: palette.accent }]} />
            <View style={[styles.heroDiagramRingSmall, { borderColor: palette.accent }]} />
            <View style={[styles.heroDiagramCenter, { backgroundColor: palette.surface }]}>
              <Text style={styles.heroDiagramEmoji}>🤰</Text>
            </View>
          </View>

          <View style={styles.heroMetricClean}>
            <Text style={[styles.heroMetricValue, { color: palette.ink }]}>{progress.progress}%</Text>
            <Text style={[styles.heroMetricLabel, { color: palette.text }]}>complete</Text>

            <View style={[styles.heroDueChip, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name="time-outline" size={14} color={palette.accent} />
              <Text style={[styles.heroDueText, { color: palette.accent }]}>
                {progress.daysRemaining > 0 ? `${progress.daysRemaining} days left` : 'Due window'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.heroTrack, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.heroFill, { width: `${progress.progress}%`, backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.heroFooter}>
          <Text style={[styles.heroFooterText, { color: palette.text }]}>View timeline</Text>
          <View style={[styles.heroArrow, { backgroundColor: palette.accent }]}>
            <Ionicons name="arrow-forward" size={17} color={palette.onAccent} />
          </View>
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
        onPress={() => router.push('/timeline' as never)}
        style={[styles.timelineFeatureCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
      >
        <View style={[styles.timelineFeatureIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="map-outline" size={25} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>CONTINUE JOURNEY</Text>
          <Text style={[styles.timelineFeatureTitle, { color: palette.ink }]}>
            View your pregnancy timeline
          </Text>
          <Text style={[styles.timelineFeatureCopy, { color: palette.text }]}>
            Follow your weekly progress, milestones, and baby growth.
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={22} color={palette.muted} />
      </AnimatedPressable>

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

      <AnimatedPressable
        onPress={() => router.push('/tools' as never)}
        style={[styles.toolsFeatureCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
      >
        <View style={[styles.toolsFeatureIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="grid-outline" size={26} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>TOOLS & TRACKERS</Text>
          <Text style={[styles.toolsFeatureTitle, { color: palette.ink }]}>
            Open your pregnancy toolkit
          </Text>
          <Text style={[styles.toolsFeatureCopy, { color: palette.text }]}>
            Kick counter, journal, hospital bag, birth plan, doctor questions, and more.
          </Text>
        </View>

        <View style={[styles.toolsFeatureArrow, { backgroundColor: palette.accent }]}>
          <Ionicons name="arrow-forward" size={19} color={palette.onAccent} />
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
              icon="sparkles-outline"
              title="Preggy AI"
              copy="Ask a pregnancy question"
              onPress={() => router.push('/ai-chat?fromTools=1' as never)}
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

      <AnimatedPressable
        onPress={() => router.push('/ai-chat?fromTools=1' as never)}
        style={[styles.quoteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}
      >
        <View style={[styles.quoteIcon, { backgroundColor: palette.surface }]}>
          <Ionicons name="sparkles-outline" size={22} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.quoteLabel, { color: palette.accent }]}>TODAY’S GENTLE REMINDER</Text>
          <Text style={[styles.quoteMessage, { color: palette.ink }]}>{gentleReminder}</Text>
          <Text style={[styles.quoteAction, { color: palette.accent }]}>Tap to ask Preggy AI</Text>
        </View>

        <Ionicons name="chevron-forward" size={21} color={palette.accent} />
      </AnimatedPressable>
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
      <View style={styles.summaryTop}>
        <View style={[styles.summaryIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name={icon} size={19} color={palette.accent} />
        </View>

        <Ionicons name="chevron-forward" size={16} color={palette.muted} />
      </View>

      <Text style={[styles.summaryValue, { color: palette.ink }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: palette.accent }]}>{label}</Text>
      <Text style={[styles.summaryCopy, { color: palette.text }]}>{copy}</Text>
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
  heroIntroCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
    marginBottom: 14,
  },
  heroIntroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  greeting: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '800',
  },
  title: {
    ...type.title,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.9,
    marginTop: 4,
  },
  introSubtext: {
    ...type.small,
    lineHeight: 20,
    marginTop: 7,
    fontWeight: '800',
  },
  toolsCircle: {
    width: 50,
    height: 50,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIntroStats: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  introMiniPill: {
    minHeight: 36,
    borderRadius: 16,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  introMiniText: {
    ...type.tiny,
    fontWeight: '900',
  },
  datePickerPanel: {
    borderRadius: 30,
    borderWidth: 1,
    paddingTop: 16,
    paddingBottom: 12,
    marginBottom: 14,
  },
  dateHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateHeaderLabel: {
    ...type.section,
    letterSpacing: 1.1,
  },
  dateHeaderTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
    marginTop: 3,
  },
  dateHeaderActions: {
    flexDirection: 'row',
    gap: 8,
  },

  chooseDateButton: {
    minHeight: 40,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chooseDateText: {
    ...type.tiny,
    fontWeight: '900',
  },
  dateScroll: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  dateScroller: {
    paddingHorizontal: 16,
    gap: 9,
  },
  dateChip: {
    width: 86,
    minHeight: 96,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
  },
  dateMonth: {
    ...type.tiny,
    fontWeight: '900',
    marginBottom: 2,
  },
  dateDay: {
    ...type.tiny,
    fontWeight: '900',
  },
  dateNumber: {
    ...type.bodyStrong,
    fontSize: 19,
    marginTop: 3,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 13, 18, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  dateModal: {
    width: '100%',
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  dateModalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateModalTitle: {
    ...type.bodyStrong,
    fontSize: 22,
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateModalCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 8,
    fontWeight: '800',
  },
  dateInput: {
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginTop: 14,
    ...type.bodyStrong,
    fontSize: 16,
  },
  applyDateButton: {
    minHeight: 52,
    borderRadius: 20,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyDateText: {
    ...type.small,
    fontWeight: '900',
  },
  hero: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  heroTopClean: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.15,
  },
  heroTitle: {
    ...type.title,
    fontSize: 31,
    lineHeight: 35,
    letterSpacing: -0.9,
    marginTop: 3,
  },
  heroSubtitle: {
    ...type.small,
    lineHeight: 19,
    fontWeight: '800',
    marginTop: 4,
  },
  heroWeekBadge: {
    minWidth: 48,
    height: 44,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  heroWeekBadgeText: {
    ...type.small,
    fontWeight: '900',
  },
  heroBodyClean: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  heroDiagramClean: {
    width: 94,
    height: 94,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDiagramRingLarge: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    opacity: 0.24,
  },
  heroDiagramRingSmall: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    opacity: 0.32,
  },
  heroDiagramCenter: {
    width: 45,
    height: 45,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDiagramEmoji: {
    fontSize: 25,
  },
  heroMetricClean: {
    flex: 1,
  },
  heroMetricValue: {
    ...type.title,
    fontSize: 36,
    lineHeight: 39,
    letterSpacing: -1.1,
  },
  heroMetricLabel: {
    ...type.small,
    fontWeight: '900',
    marginTop: 0,
  },
  heroDueChip: {
    minHeight: 33,
    borderRadius: 15,
    paddingHorizontal: 10,
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroDueText: {
    ...type.tiny,
    fontWeight: '900',
  },
  heroTrack: {
    height: 9,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 15,
  },
  heroFill: {
    height: '100%',
    borderRadius: 999,
  },
  heroFooter: {
    marginTop: 11,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroFooterText: {
    ...type.small,
    fontWeight: '900',
  },
  heroArrow: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    minHeight: 124,
    borderRadius: 24,
    borderWidth: 1,
    padding: 13,
    justifyContent: 'space-between',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryIcon: {
    width: 39,
    height: 39,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    ...type.tiny,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  summaryValue: {
    ...type.bodyStrong,
    fontSize: 24,
    lineHeight: 28,
    marginTop: 9,
  },
  summaryCopy: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 2,
    fontWeight: '800',
  },
  timelineFeatureCard: {
    minHeight: 106,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  timelineFeatureIcon: {
    width: 56,
    height: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineFeatureTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    lineHeight: 24,
    marginTop: 5,
  },
  timelineFeatureCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
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
  toolsFeatureCard: {
    minHeight: 112,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  toolsFeatureIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsFeatureTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    lineHeight: 24,
    marginTop: 5,
  },
  toolsFeatureCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  toolsFeatureArrow: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
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
  quoteCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  quoteIcon: {
    width: 52,
    height: 52,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteLabel: {
    ...type.section,
    letterSpacing: 1.1,
  },
  quoteMessage: {
    ...type.bodyStrong,
    fontSize: 17,
    lineHeight: 23,
    marginTop: 5,
  },
  quoteAction: {
    ...type.tiny,
    fontWeight: '900',
    marginTop: 8,
  },
});
