import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Card } from '@/components/cards/Card';
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
  time: string | null;
  location: string | null;
  status: string | null;
};

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
  if (!date) return 'No date set';

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

  async function loadDashboard() {
    setLoading(true);

    const profileData = await getMyProfile();
    setProfile(profileData);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    const userId = userData.user?.id;

    if (!userId) {
      throw new Error('No logged in user.');
    }

    const [logResult, medsResult, appointmentResult] = await Promise.all([
      supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', userId)
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
        .order('date', { ascending: true })
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

      loadDashboard()
        .catch((error) => {
          console.log('Home dashboard error:', error);
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
  const firstName = profile?.full_name?.split(' ')?.[0] || 'Mama';
  const medicationDone = medications.filter((item) => item.taken).length;
  const medicationTotal = medications.length;
  const symptoms = latestLog?.symptoms?.length ? latestLog.symptoms.join(', ') : 'No symptoms logged yet';

  return (
    <Screen bottomSpace={120}>
      <Header />

      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: palette.text }]}>{greeting()}, {firstName}</Text>
          <Text style={[styles.title, { color: palette.ink }]}>How are you and {babyName} today?</Text>
        </View>

        <View style={[styles.weekPill, { backgroundColor: palette.accentSoft }]}>
          <Text style={[styles.weekPillText, { color: palette.accent }]}>Week {progress.week}</Text>
        </View>
      </View>

      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>TODAY’S JOURNEY</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              Week {progress.week}, Day {progress.day}
            </Text>
          </View>

          <View style={[styles.progressCircle, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.progressText, { color: palette.accent }]}>{progress.progress}%</Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: palette.softSurface }]}>
          <View style={[styles.fill, { width: `${progress.progress}%`, backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.heroBottom}>
          <View>
            <Text style={[styles.smallLabel, { color: palette.muted }]}>Estimated countdown</Text>
            <Text style={[styles.smallValue, { color: palette.ink }]}>
              {progress.daysRemaining > 0 ? `${progress.daysRemaining} days to go` : 'Due date window'}
            </Text>
          </View>

          <AnimatedPressable onPress={() => router.push('/timeline' as never)} style={[styles.heroButton, { backgroundColor: palette.accent }]}>
            <Text style={[styles.heroButtonText, { color: palette.onAccent }]}>Timeline</Text>
          </AnimatedPressable>
        </View>
      </Card>

      {loading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text }]}>Refreshing your live dashboard...</Text>
        </Card>
      ) : (
        <>
          <View style={styles.quickGrid}>
            <QuickAction
              icon="add-circle-outline"
              title="Log symptoms"
              copy="Mood, notes, intensity"
              onPress={() => router.push('/log-symptoms' as never)}
            />

            <QuickAction
              icon="medkit-outline"
              title="Medication"
              copy={medicationTotal ? `${medicationDone}/${medicationTotal} taken` : 'No routine yet'}
              onPress={() => router.push('/medication' as never)}
            />
          </View>

          <View style={styles.quickGrid}>
            <QuickAction
              icon="calendar-outline"
              title="Appointments"
              copy={nextAppointment ? `${formatDate(nextAppointment.date)} ${nextAppointment.time ?? ''}`.trim() : 'No upcoming visit'}
              onPress={() => router.push('/(tabs)/appointments' as never)}
            />

            <QuickAction
              icon="sparkles-outline"
              title="Preggy AI"
              copy="Ask anything"
              onPress={() => router.push('/ai-chat' as never)}
            />
          </View>

          <Card style={styles.sectionCard}>
            <View style={styles.sectionTop}>
              <View>
                <Text style={[styles.sectionLabel, { color: palette.accent }]}>LATEST LOG</Text>
                <Text style={[styles.sectionTitle, { color: palette.ink }]}>
                  {latestLog?.mood || 'No mood logged yet'}
                </Text>
              </View>

              <View style={[styles.iconBadge, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name="pulse-outline" size={24} color={palette.accent} />
              </View>
            </View>

            <Text style={[styles.sectionCopy, { color: palette.text }]}>
              {symptoms}
            </Text>

            {latestLog?.notes ? (
              <Text style={[styles.note, { color: palette.muted }]}>
                “{latestLog.notes}”
              </Text>
            ) : null}

            <AnimatedPressable onPress={() => router.push('/log-symptoms' as never)} style={[styles.linkButton, { borderColor: palette.line }]}>
              <Text style={[styles.linkText, { color: palette.accent }]}>Update today’s log</Text>
              <Ionicons name="arrow-forward" size={18} color={palette.accent} />
            </AnimatedPressable>
          </Card>

          <Card style={styles.sectionCard}>
            <View style={styles.sectionTop}>
              <View>
                <Text style={[styles.sectionLabel, { color: palette.accent }]}>NEXT APPOINTMENT</Text>
                <Text style={[styles.sectionTitle, { color: palette.ink }]}>
                  {nextAppointment?.title || nextAppointment?.type || 'No upcoming appointment'}
                </Text>
              </View>

              <View style={[styles.iconBadge, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name="calendar" size={24} color={palette.accent} />
              </View>
            </View>

            <Text style={[styles.sectionCopy, { color: palette.text }]}>
              {nextAppointment
                ? `${formatDate(nextAppointment.date)}${nextAppointment.time ? ` at ${nextAppointment.time}` : ''}${nextAppointment.location ? ` • ${nextAppointment.location}` : ''}`
                : 'Add your next prenatal visit to keep everything in one place.'}
            </Text>

            <AnimatedPressable onPress={() => router.push('/(tabs)/appointments' as never)} style={[styles.linkButton, { borderColor: palette.line }]}>
              <Text style={[styles.linkText, { color: palette.accent }]}>View appointments</Text>
              <Ionicons name="arrow-forward" size={18} color={palette.accent} />
            </AnimatedPressable>
          </Card>

          <View style={[styles.aiBanner, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
            <View style={[styles.aiIcon, { backgroundColor: palette.accent }]}>
              <Ionicons name="sparkles" size={25} color={palette.onAccent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.aiTitle, { color: palette.ink }]}>Need quick guidance?</Text>
              <Text style={[styles.aiCopy, { color: palette.text }]}>
                Ask Preggy AI about symptoms, meals, movement, and appointment prep.
              </Text>
            </View>

            <AnimatedPressable onPress={() => router.push('/ai-chat' as never)} style={[styles.askButton, { backgroundColor: palette.accent }]}>
              <Text style={[styles.askText, { color: palette.onAccent }]}>Ask</Text>
            </AnimatedPressable>
          </View>
        </>
      )}
    </Screen>
  );
}

function QuickAction({
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
    <AnimatedPressable onPress={onPress} style={[styles.quickCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={[styles.quickIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={24} color={palette.accent} />
      </View>

      <Text style={[styles.quickTitle, { color: palette.ink }]}>{title}</Text>
      <Text style={[styles.quickCopy, { color: palette.text }]}>{copy}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 22,
    marginBottom: 16,
  },
  greeting: {
    ...type.body,
  },
  title: {
    ...type.title,
    fontSize: 28,
    lineHeight: 34,
    marginTop: 4,
  },
  weekPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 3,
  },
  weekPillText: {
    ...type.small,
    fontWeight: '900',
  },
  hero: {
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {
    ...type.section,
  },
  heroTitle: {
    ...type.title,
    fontSize: 27,
    marginTop: 4,
  },
  progressCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    ...type.bodyStrong,
  },
  track: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 18,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  heroBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  smallLabel: {
    ...type.tiny,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  smallValue: {
    ...type.bodyStrong,
    marginTop: 3,
  },
  heroButton: {
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  loadingCard: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    ...type.small,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quickCard: {
    flex: 1,
    minHeight: 132,
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
  },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  quickTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  quickCopy: {
    ...type.small,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionCard: {
    marginTop: 4,
    marginBottom: 14,
  },
  sectionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'flex-start',
  },
  sectionLabel: {
    ...type.section,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 26,
    marginTop: 4,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCopy: {
    ...type.body,
    lineHeight: 23,
    marginTop: 10,
  },
  note: {
    ...type.small,
    lineHeight: 20,
    marginTop: 9,
  },
  linkButton: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    ...type.small,
    fontWeight: '900',
  },
  aiBanner: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginTop: 2,
  },
  aiIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  aiCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
  },
  askButton: {
    minHeight: 42,
    borderRadius: 21,
    paddingHorizontal: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askText: {
    ...type.small,
    fontWeight: '900',
  },
});
