import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function dateFromKey(dateKey: string) {
  const parsed = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseSavedArray(raw: string | null) {
  try {
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function buildDateStrip(selectedDateKey: string) {
  const today = new Date();
  const todayKey = toDateKey(today);

  return Array.from({ length: 10 }, (_, offset) => {
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

function StatCard({
  icon,
  label,
  value,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  detail: string;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
    >
      <View style={[styles.statIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={19} color={palette.accent} />
      </View>

      <Text style={[styles.statValue, { color: palette.ink }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.accent }]}>{label}</Text>
      <Text style={[styles.statDetail, { color: palette.text }]}>{detail}</Text>
    </AnimatedPressable>
  );
}

function ActionRow({
  icon,
  title,
  detail,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  onPress: () => void;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable onPress={onPress} style={[styles.actionRow, { borderBottomColor: palette.line }]}>
      <View style={[styles.actionIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={19} color={palette.accent} />
      </View>

      <View style={styles.actionTextWrap}>
        <Text style={[styles.actionTitle, { color: palette.ink }]}>{title}</Text>
        <Text style={[styles.actionDetail, { color: palette.text }]} numberOfLines={1}>
          {detail}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={palette.muted} />
    </AnimatedPressable>
  );
}

function WellnessPill({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.wellnessPill, { backgroundColor: palette.accentSoft }]}>
      <Ionicons name={icon} size={16} color={palette.accent} />
      <Text style={[styles.wellnessLabel, { color: palette.text }]}>{label}</Text>
      <Text style={[styles.wellnessValue, { color: palette.ink }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
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
  const [wellnessSnapshot, setWellnessSnapshot] = useState({
    mood: 'No mood yet',
    sleep: 'No sleep yet',
    cravings: 0,
    weight: 'No weight yet',
  });
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

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadHome() {
        try {
          setLoading(true);

          const profileData = await getMyProfile();
          if (!mounted) return;

          setProfile(profileData);

          const { data: userData, error: userError } = await supabase.auth.getUser();

          if (userError) throw userError;

          const userId = userData.user?.id;
          if (!userId) throw new Error('No logged in user.');

          const [
            logResult,
            medsResult,
            appointmentResult,
            savedCare,
            savedWater,
            savedKicks,
            moodRaw,
            sleepRaw,
            cravingsRaw,
            weightRaw,
          ] = await Promise.all([
            supabase
              .from('symptom_logs')
              .select('*')
              .eq('user_id', userId)
              .gte('created_at', `${selectedDateKey}T00:00:00`)
              .lt('created_at', `${selectedDateKey}T23:59:59`)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase.from('medications').select('*').eq('user_id', userId),
            supabase
              .from('appointments')
              .select('*')
              .eq('user_id', userId)
              .neq('status', 'Cancelled')
              .or(`appointment_date.eq.${selectedDateKey},date.eq.${selectedDateKey}`)
              .order('appointment_at', { ascending: true, nullsFirst: false })
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            AsyncStorage.getItem(getChecklistStorageKey(selectedDateKey)),
            AsyncStorage.getItem(getWaterStorageKey(selectedDateKey)),
            AsyncStorage.getItem(getKickStorageKey(selectedDateKey)),
            AsyncStorage.getItem('preggy:mood-tracker'),
            AsyncStorage.getItem('preggy:sleep-tracker'),
            AsyncStorage.getItem('preggy:cravings-tracker'),
            AsyncStorage.getItem('preggy:weight-tracker'),
          ]);

          if (!mounted) return;

          if (logResult.error) throw logResult.error;
          if (medsResult.error) throw medsResult.error;
          if (appointmentResult.error) throw appointmentResult.error;

          setLatestLog((logResult.data as SymptomLog | null) ?? null);
          setMedications((medsResult.data ?? []) as Medication[]);
          setNextAppointment((appointmentResult.data as Appointment | null) ?? null);

          const parsedCare = parseSavedArray(savedCare);
          const parsedWater = savedWater ? Number.parseInt(savedWater, 10) : 0;
          const parsedKicks = savedKicks ? Number.parseInt(savedKicks, 10) : 0;

          setDailyCareDone(Math.min(parsedCare.length, DAILY_CARE_TOTAL));
          setWaterCups(Number.isFinite(parsedWater) ? clamp(parsedWater, 0, WATER_TARGET) : 0);
          setTodayKicks(Number.isFinite(parsedKicks) ? Math.max(parsedKicks, 0) : 0);

          const moods = parseSavedArray(moodRaw);
          const sleeps = parseSavedArray(sleepRaw);
          const cravings = parseSavedArray(cravingsRaw);
          const weights = parseSavedArray(weightRaw);

          const latestMood = moods[0];
          const latestSleep = sleeps[0];
          const latestWeight = weights[0];

          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const recentCravings = cravings.filter((item) => Number(item.createdAt) >= sevenDaysAgo).length;

          setWellnessSnapshot({
            mood: latestMood?.mood ? String(latestMood.mood) : 'No mood yet',
            sleep: latestSleep?.hours ? String(latestSleep.hours).replace(/\s*(hours|hrs)$/i, '') + ' hrs' : 'No sleep yet',
            cravings: recentCravings,
            weight: latestWeight?.weight ? `${latestWeight.weight} kg` : 'No weight yet',
          });
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
  const appointmentTitle = nextAppointment?.title || nextAppointment?.type || 'No appointment today';
  const dailyCareProgress = Math.round(((dailyCareDone + waterCups) / (DAILY_CARE_TOTAL + WATER_TARGET)) * 100);

  return (
    <Screen bottomSpace={118}>
      <Header />

      <View style={styles.heroHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>{greeting()}, {firstName}</Text>
          <Text style={[styles.pageTitle, { color: palette.ink }]}>Your day at a glance</Text>
        </View>

        <AnimatedPressable
          onPress={() => router.push('/ai-chat?fromTools=1' as never)}
          style={[styles.aiButton, { backgroundColor: palette.accentSoft }]}
        >
          <Ionicons name="sparkles-outline" size={18} color={palette.accent} />
          <Text style={[styles.aiButtonText, { color: palette.accent }]}>AI</Text>
        </AnimatedPressable>
      </View>

      <View style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.accentRail, { backgroundColor: palette.accent }]} />

        <View style={styles.progressTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>PREGNANCY</Text>
            <Text style={[styles.weekTitle, { color: palette.ink }]}>Week {progress.week}</Text>
            <Text style={[styles.weekDetail, { color: palette.text }]}>
              Day {progress.day} with {babyName} • {progress.daysRemaining > 0 ? `${progress.daysRemaining} days to go` : 'Due date window'}
            </Text>
          </View>

          <View style={[styles.percentBadge, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.percentValue, { color: palette.accent }]}>{progress.progress}%</Text>
            <Text style={[styles.percentLabel, { color: palette.text }]}>done</Text>
          </View>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.progressFill, { width: `${progress.progress}%`, backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.progressActions}>
          <AnimatedPressable onPress={() => router.push('/timeline' as never)} style={styles.inlineAction}>
            <Text style={[styles.inlineActionText, { color: palette.accent }]}>Timeline</Text>
            <Ionicons name="chevron-forward" size={15} color={palette.accent} />
          </AnimatedPressable>

          <AnimatedPressable onPress={() => router.push('/weekly-growth' as never)} style={styles.inlineAction}>
            <Text style={[styles.inlineActionText, { color: palette.accent }]}>Growth</Text>
            <Ionicons name="chevron-forward" size={15} color={palette.accent} />
          </AnimatedPressable>
        </View>
      </View>

      <View style={[styles.dateCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.dateTop}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>SELECTED DAY</Text>
            <Text style={[styles.dateTitle, { color: palette.ink }]}>
              {dateFromKey(selectedDateKey).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          <AnimatedPressable
            onPress={openDatePicker}
            style={[styles.chooseButton, { backgroundColor: palette.accentSoft }]}
          >
            <Ionicons name="calendar-outline" size={16} color={palette.accent} />
            <Text style={[styles.chooseText, { color: palette.accent }]}>Choose</Text>
          </AnimatedPressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
          {dateStrip.map((item) => {
            const active = selectedDateKey === item.key;

            return (
              <AnimatedPressable
                key={item.key}
                onPress={() => setSelectedDateKey(item.key)}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: active ? palette.accent : palette.canvas,
                    borderColor: active ? palette.accent : palette.line,
                  },
                ]}
              >
                <Text style={[styles.dateChipDay, { color: active ? palette.onAccent : palette.text }]}>
                  {item.isToday ? 'Today' : item.day}
                </Text>
                <Text style={[styles.dateChipNumber, { color: active ? palette.onAccent : palette.ink }]}>
                  {item.date}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          icon="water-outline"
          label="Care"
          value={`${dailyCareDone}/${DAILY_CARE_TOTAL}`}
          detail={`${waterCups}/${WATER_TARGET} water`}
          onPress={() => router.push('/daily-care' as never)}
        />

        <StatCard
          icon="footsteps-outline"
          label="Movement"
          value={`${todayKicks}`}
          detail="kicks today"
          onPress={() => router.push('/kick-counter' as never)}
        />

        <StatCard
          icon="medkit-outline"
          label="Meds"
          value={medicationTotal ? `${medicationDone}/${medicationTotal}` : '0'}
          detail={medicationTotal ? 'taken' : 'no routine'}
          onPress={() => router.push('/medication' as never)}
        />
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>TODAY</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Priority check-in</Text>
          </View>

          {loading ? <ActivityIndicator color={palette.accent} /> : null}
        </View>

        <ActionRow
          icon="calendar-outline"
          title={appointmentTitle}
          detail={nextAppointment ? `${formatDate(appointmentDate)} ${appointmentTime ?? ''} ${appointmentPlace ?? ''}`.trim() : 'Add or review your next visit'}
          onPress={() => router.push('/(tabs)/appointments' as never)}
        />

        <ActionRow
          icon="pulse-outline"
          title="Symptoms"
          detail={symptoms}
          onPress={() => router.push('/log-symptoms' as never)}
        />

        <ActionRow
          icon="checkmark-circle-outline"
          title="Daily care"
          detail={`${dailyCareProgress}% complete for this day`}
          onPress={() => router.push('/daily-care' as never)}
        />
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>WELLNESS</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Body notes</Text>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/weekly-report' as never)}
            style={[styles.reportButton, { backgroundColor: palette.accentSoft }]}
          >
            <Text style={[styles.reportText, { color: palette.accent }]}>Report</Text>
          </AnimatedPressable>
        </View>

        <View style={styles.wellnessGrid}>
          <WellnessPill icon="happy-outline" label="Mood" value={wellnessSnapshot.mood} />
          <WellnessPill icon="moon-outline" label="Sleep" value={wellnessSnapshot.sleep} />
          <WellnessPill icon="restaurant-outline" label="Cravings" value={`${wellnessSnapshot.cravings}`} />
          <WellnessPill icon="scale-outline" label="Weight" value={wellnessSnapshot.weight} />
        </View>
      </View>

      <View style={styles.quickRow}>
        <AnimatedPressable
          onPress={() => router.push('/log-symptoms' as never)}
          style={[styles.primaryButton, { backgroundColor: palette.accent }]}
        >
          <Ionicons name="add-outline" size={19} color={palette.onAccent} />
          <Text style={[styles.primaryButtonText, { color: palette.onAccent }]}>Log symptoms</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/tools' as never)}
          style={[styles.secondaryButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="grid-outline" size={19} color={palette.accent} />
          <Text style={[styles.secondaryButtonText, { color: palette.ink }]}>Tools</Text>
        </AnimatedPressable>
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
              placeholder="2026-07-18"
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    marginTop: 4,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.4,
  },
  pageTitle: {
    ...type.title,
    marginTop: 4,
  },
  aiButton: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  aiButtonText: {
    ...type.small,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    overflow: 'hidden',
  },
  accentRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardLabel: {
    ...type.tiny,
    letterSpacing: 1.3,
  },
  weekTitle: {
    fontSize: 38,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 4,
  },
  weekDetail: {
    ...type.small,
    marginTop: 2,
  },
  percentBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentValue: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
  },
  percentLabel: {
    ...type.tiny,
    marginTop: 1,
  },
  progressTrack: {
    height: 9,
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 15,
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  progressActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 18,
  },
  inlineAction: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  inlineActionText: {
    ...type.small,
    fontWeight: '900',
  },
  dateCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 15,
    marginBottom: 14,
  },
  dateTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  dateTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    lineHeight: 26,
    marginTop: 2,
  },
  chooseButton: {
    minHeight: 38,
    borderRadius: 15,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chooseText: {
    ...type.small,
  },
  dateStrip: {
    gap: 9,
    paddingTop: 14,
    paddingRight: 4,
  },
  dateChip: {
    width: 63,
    minHeight: 72,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipDay: {
    ...type.tiny,
    marginBottom: 6,
  },
  dateChipNumber: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    padding: 12,
    minHeight: 134,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '900',
  },
  statLabel: {
    ...type.small,
    marginTop: 1,
  },
  statDetail: {
    ...type.tiny,
    marginTop: 3,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 2,
  },
  actionRow: {
    minHeight: 68,
    borderBottomWidth: 1,
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
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    ...type.bodyStrong,
  },
  actionDetail: {
    ...type.small,
    marginTop: 1,
  },
  reportButton: {
    minHeight: 36,
    borderRadius: 15,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportText: {
    ...type.small,
  },
  wellnessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  wellnessPill: {
    width: '48%',
    minHeight: 82,
    borderRadius: 18,
    padding: 12,
  },
  wellnessLabel: {
    ...type.tiny,
    marginTop: 7,
  },
  wellnessValue: {
    ...type.bodyStrong,
    marginTop: 2,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1.45,
    minHeight: 56,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    ...type.bodyStrong,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondaryButtonText: {
    ...type.bodyStrong,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(37,23,29,0.42)',
    justifyContent: 'center',
    padding: 24,
  },
  dateModal: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 20,
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
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateModalCopy: {
    ...type.body,
    marginTop: 10,
  },
  dateInput: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginTop: 16,
    ...type.body,
  },
  applyDateButton: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  applyDateText: {
    ...type.bodyStrong,
  },
});
