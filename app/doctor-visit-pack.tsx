import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { supabase } from '@/lib/supabase';
import { getMyProfile, type UserProfile } from '@/services/profile';

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

type Medication = {
  id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  instructions: string | null;
  taken: boolean | null;
};

type SymptomLog = {
  id: string;
  mood: string | null;
  symptoms: string[] | null;
  intensity: number | null;
  notes: string | null;
  created_at: string;
};

type DoctorQuestion = {
  id: string;
  text: string;
  answered: boolean;
  createdAt: number;
};

const DOCTOR_QUESTIONS_KEY = 'preggy:doctor-questions';

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
    daysRemaining: clamp(280 - pregnancyDay, 0, 280),
  };
}

function formatDate(value?: string | null) {
  if (!value) return 'Not set';

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatLogDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Recent';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function parseQuestions(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? (parsed as DoctorQuestion[]) : [];
  } catch {
    return [];
  }
}

export default function DoctorVisitPackScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [questions, setQuestions] = useState<DoctorQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPack() {
    const profileData = await getMyProfile();
    setProfile(profileData);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) throw userError;

    const userId = userData.user?.id;

    if (!userId) {
      throw new Error('No logged in user.');
    }

    const [appointmentResult, medsResult, logsResult, questionsRaw] = await Promise.all([
      supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'Cancelled')
        .order('appointment_at', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(4),
      AsyncStorage.getItem(DOCTOR_QUESTIONS_KEY),
    ]);

    if (appointmentResult.error) throw appointmentResult.error;
    if (medsResult.error) throw medsResult.error;
    if (logsResult.error) throw logsResult.error;

    setAppointment((appointmentResult.data as Appointment | null) ?? null);
    setMedications((medsResult.data ?? []) as Medication[]);
    setSymptomLogs((logsResult.data ?? []) as SymptomLog[]);
    setQuestions(parseQuestions(questionsRaw));
  }

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);

      loadPack()
        .catch((error) => {
          console.log('Doctor visit pack load error:', error);
          Alert.alert('Doctor Visit Pack', 'Could not load your visit pack right now.');
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [])
  );

  const progress = useMemo(() => getPregnancyProgress(profile), [profile]);
  const unansweredQuestions = questions.filter((item) => !item.answered);
  const appointmentDate = appointment?.appointment_date || appointment?.date;
  const appointmentTime = appointment?.appointment_time || appointment?.time;
  const appointmentPlace = appointment?.clinic_name || appointment?.location;
  const appointmentTitle = appointment?.title || appointment?.type || 'Next appointment';
  const babyName = profile?.baby_nickname || 'Baby';

  const visitSummary = useMemo(() => {
    const symptomSummary = symptomLogs.length
      ? symptomLogs
          .map((log) => {
            const symptoms = log.symptoms?.length ? log.symptoms.join(', ') : 'No symptom names';
            const mood = log.mood ? `Mood: ${log.mood}` : 'Mood not logged';
            const intensity = log.intensity ? `Intensity: ${log.intensity}/10` : 'Intensity not logged';

            return `- ${formatLogDate(log.created_at)}: ${symptoms}. ${mood}. ${intensity}.`;
          })
          .join('\n')
      : '- No recent symptoms logged.';

    const medicationSummary = medications.length
      ? medications
          .map((med) => {
            const dosage = med.dosage || 'As directed';
            const frequency = med.frequency || 'Frequency not set';

            return `- ${med.name}: ${dosage}, ${frequency}`;
          })
          .join('\n')
      : '- No medications saved.';

    const questionSummary = unansweredQuestions.length
      ? unansweredQuestions.map((question) => `- ${question.text}`).join('\n')
      : '- No unanswered questions saved.';

    return [
      'Doctor Visit Pack',
      '',
      `Patient: ${profile?.full_name || 'Not set'}`,
      `Pregnancy: Week ${progress.week}, day ${progress.day}`,
      `Baby nickname: ${babyName}`,
      `Days to due date: ${progress.daysRemaining}`,
      '',
      `Appointment: ${appointment ? appointmentTitle : 'Not set'}`,
      `Date/time: ${appointment ? `${formatDate(appointmentDate)} ${appointmentTime ?? ''}`.trim() : 'Not set'}`,
      `Place: ${appointmentPlace || 'Not set'}`,
      '',
      'Recent symptoms:',
      symptomSummary,
      '',
      'Medications:',
      medicationSummary,
      '',
      'Questions to ask:',
      questionSummary,
    ].join('\n');
  }, [appointment, appointmentDate, appointmentPlace, appointmentTime, appointmentTitle, babyName, medications, profile, progress, symptomLogs, unansweredQuestions]);

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>APPOINTMENT PREP</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Doctor Visit Pack</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          A simple view of what to mention, ask, and review before your visit.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.accentRail, { backgroundColor: palette.accent }]} />

        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>PREGNANCY</Text>
            <Text style={[styles.weekTitle, { color: palette.ink }]}>Week {progress.week}</Text>
            <Text style={[styles.weekCopy, { color: palette.text }]}>
              Day {progress.day} with {babyName} • {progress.daysRemaining} days to go
            </Text>
          </View>

          <View style={[styles.weekBadge, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="document-text-outline" size={24} color={palette.accent} />
          </View>
        </View>
      </View>

      <View style={styles.quickRow}>
        <MiniCard label="Questions" value={String(unansweredQuestions.length)} icon="chatbubbles-outline" />
        <MiniCard label="Meds" value={String(medications.length)} icon="medkit-outline" />
        <MiniCard label="Logs" value={String(symptomLogs.length)} icon="pulse-outline" />
      </View>

      {loading ? (
        <View style={[styles.loadingCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text }]}>Building your visit pack...</Text>
        </View>
      ) : null}

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>NEXT VISIT</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>{appointment ? appointmentTitle : 'No appointment saved'}</Text>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/(tabs)/appointments' as never)}
            style={[styles.smallButton, { backgroundColor: palette.accentSoft }]}
          >
            <Text style={[styles.smallButtonText, { color: palette.accent }]}>Open</Text>
          </AnimatedPressable>
        </View>

        <InfoLine icon="calendar-outline" label="Date" value={appointment ? formatDate(appointmentDate) : 'Add your next appointment'} />
        <InfoLine icon="time-outline" label="Time" value={appointmentTime || 'Not set'} />
        <InfoLine icon="business-outline" label="Place" value={appointmentPlace || 'Not set'} />
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>ASK</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Questions to bring up</Text>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/doctor-questions' as never)}
            style={[styles.smallButton, { backgroundColor: palette.accentSoft }]}
          >
            <Text style={[styles.smallButtonText, { color: palette.accent }]}>Edit</Text>
          </AnimatedPressable>
        </View>

        {unansweredQuestions.length ? (
          unansweredQuestions.slice(0, 4).map((question) => (
            <BulletLine key={question.id} text={question.text} />
          ))
        ) : (
          <Text style={[styles.emptyText, { color: palette.text }]}>
            No unanswered questions yet. Add questions before your visit.
          </Text>
        )}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>MENTION</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Recent symptoms</Text>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/log-symptoms' as never)}
            style={[styles.smallButton, { backgroundColor: palette.accentSoft }]}
          >
            <Text style={[styles.smallButtonText, { color: palette.accent }]}>Log</Text>
          </AnimatedPressable>
        </View>

        {symptomLogs.length ? (
          symptomLogs.slice(0, 3).map((log) => (
            <View key={log.id} style={[styles.logItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
              <Text style={[styles.logDate, { color: palette.accent }]}>{formatLogDate(log.created_at)}</Text>
              <Text style={[styles.logText, { color: palette.ink }]}>
                {log.symptoms?.length ? log.symptoms.join(', ') : 'No symptom names'}
              </Text>
              <Text style={[styles.logMeta, { color: palette.text }]}>
                {log.mood ? `Mood: ${log.mood}` : 'Mood not logged'}
                {log.intensity ? ` • Intensity: ${log.intensity}/10` : ''}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: palette.text }]}>
            No recent symptoms logged.
          </Text>
        )}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>REVIEW</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Medicines</Text>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/medication' as never)}
            style={[styles.smallButton, { backgroundColor: palette.accentSoft }]}
          >
            <Text style={[styles.smallButtonText, { color: palette.accent }]}>Open</Text>
          </AnimatedPressable>
        </View>

        {medications.length ? (
          medications.slice(0, 4).map((medication) => (
            <InfoLine
              key={medication.id}
              icon="medkit-outline"
              label={medication.name}
              value={`${medication.dosage || 'As directed'} • ${medication.frequency || 'Frequency not set'}`}
            />
          ))
        ) : (
          <Text style={[styles.emptyText, { color: palette.text }]}>
            No medicines saved.
          </Text>
        )}
      </View>

      <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={[styles.cardLabel, { color: palette.accent }]}>SUMMARY</Text>
            <Text style={[styles.sectionTitle, { color: palette.ink }]}>Read this at your visit</Text>
          </View>
        </View>

        <TextInput
          value={visitSummary}
          editable={false}
          multiline
          textAlignVertical="top"
          style={[
            styles.summaryInput,
            {
              backgroundColor: palette.canvas,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />
      </View>

      <View style={[styles.safetyNote, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name="warning-outline" size={19} color={palette.accent} />
        <Text style={[styles.safetyText, { color: palette.text }]}>
          If anything feels urgent, contact your care team or emergency services.
        </Text>
      </View>
    </Screen>
  );
}

function MiniCard({
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
    <View style={[styles.miniCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={[styles.miniIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={18} color={palette.accent} />
      </View>
      <Text style={[styles.miniValue, { color: palette.ink }]}>{value}</Text>
      <Text style={[styles.miniLabel, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

function InfoLine({
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
    <View style={styles.infoLine}>
      <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={17} color={palette.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: palette.accent }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: palette.ink }]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function BulletLine({ text }: { text: string }) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.bulletLine}>
      <View style={[styles.bulletDot, { backgroundColor: palette.accent }]} />
      <Text style={[styles.bulletText, { color: palette.ink }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 10,
    marginBottom: 14,
  },
  eyebrow: {
    ...type.tiny,
    letterSpacing: 1.4,
  },
  title: {
    ...type.title,
    fontSize: 35,
    lineHeight: 40,
    letterSpacing: 0,
    marginTop: 2,
  },
  subtitle: {
    ...type.body,
    marginTop: 6,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accentRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardLabel: {
    ...type.tiny,
    letterSpacing: 1.3,
  },
  weekTitle: {
    fontSize: 37,
    lineHeight: 42,
    fontWeight: '900',
    marginTop: 3,
  },
  weekCopy: {
    ...type.small,
    marginTop: 2,
  },
  weekBadge: {
    width: 58,
    height: 58,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  miniCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    minHeight: 106,
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  miniValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
  },
  miniLabel: {
    ...type.tiny,
    marginTop: 1,
  },
  loadingCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...type.small,
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    lineHeight: 27,
    marginTop: 2,
  },
  smallButton: {
    minHeight: 36,
    borderRadius: 15,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  infoLine: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    ...type.tiny,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoValue: {
    ...type.bodyStrong,
    marginTop: 1,
  },
  bulletLine: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  bulletText: {
    ...type.body,
    flex: 1,
  },
  emptyText: {
    ...type.body,
  },
  logItem: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 8,
  },
  logDate: {
    ...type.tiny,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  logText: {
    ...type.bodyStrong,
    marginTop: 4,
  },
  logMeta: {
    ...type.small,
    marginTop: 2,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 12,
  },
  summaryInput: {
    minHeight: 260,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    ...type.small,
  },
  safetyNote: {
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  safetyText: {
    ...type.small,
    flex: 1,
  },
});
