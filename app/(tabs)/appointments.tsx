import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { supabase } from '@/lib/supabase';

type Appointment = {
  id: string;
  user_id: string;
  title: string | null;
  doctor: string | null;
  clinic: string | null;
  appointment_at: string | null;
  status: string | null;
  notes: string | null;
  doctor_name: string | null;
  clinic_name: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  type: string | null;
};

function formatDate(date?: string | null) {
  if (!date) return 'No date set';

  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function displayTitle(appointment: Appointment) {
  return appointment.title || appointment.type || 'Prenatal appointment';
}

function displayDoctor(appointment: Appointment) {
  return appointment.doctor_name || appointment.doctor || 'Care team';
}

function displayClinic(appointment: Appointment) {
  return appointment.clinic_name || appointment.location || appointment.clinic || 'Clinic not set';
}

function displayDate(appointment: Appointment) {
  return appointment.date || appointment.appointment_date;
}

function displayTime(appointment: Appointment) {
  return appointment.time || appointment.appointment_time || 'Time not set';
}

export default function AppointmentsScreen() {
  const { palette } = useAppTheme();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  async function getUserId() {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    const userId = data.user?.id;

    if (!userId) {
      throw new Error('No logged in user.');
    }

    return userId;
  }

  async function loadAppointments() {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('appointment_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    setAppointments((data ?? []) as Appointment[]);
  }

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      setLoading(true);

      loadAppointments()
        .catch((error) => {
          console.log('Appointments load error:', error);
          Alert.alert('Appointments', 'Could not load appointments.');
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });

      return () => {
        mounted = false;
      };
    }, [])
  );

  async function addAppointment() {
    router.push('/appointment/add' as never);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="Appointments" back />

      <View style={styles.heading}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>CARE SCHEDULE</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Appointments</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Keep prenatal visits, doctors, clinics, and appointment notes in one place.
          </Text>
        </View>

        <AnimatedPressable
          onPress={addAppointment}
          disabled={adding}
          style={[styles.addButton, { backgroundColor: palette.accent }]}
        >
          {adding ? (
            <ActivityIndicator color={palette.onAccent} />
          ) : (
            <Ionicons name="add" size={26} color={palette.onAccent} />
          )}
        </AnimatedPressable>
      </View>

      {loading ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>Loading appointments...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.emptyIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="calendar-outline" size={34} color={palette.accent} />
          </View>

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>No appointments yet</Text>
          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Tap the plus button to add your next checkup, scan, or maternity visit.
          </Text>
        </View>
      ) : (
        appointments.map((appointment) => {
          const isCancelled = appointment.status === 'Cancelled';

          return (
            <AnimatedPressable
              key={appointment.id}
              onPress={() => router.push(`/appointment/details?id=${appointment.id}` as never)}
              style={[
                styles.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: isCancelled ? palette.danger : palette.line,
                  opacity: isCancelled ? 0.68 : 1,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.dateBox, { backgroundColor: palette.accentSoft }]}>
                  <Text style={[styles.dateMonth, { color: palette.accent }]}>
                    {formatDate(displayDate(appointment)).split(' ')[1] ?? 'Date'}
                  </Text>
                  <Text style={[styles.dateDay, { color: palette.ink }]}>
                    {formatDate(displayDate(appointment)).split(' ')[2] ?? ''}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: palette.ink }]}>{displayTitle(appointment)}</Text>
                  <Text style={[styles.cardMeta, { color: palette.text }]}>
                    {displayTime(appointment)} • {displayDoctor(appointment)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.status,
                    { backgroundColor: isCancelled ? palette.danger + '22' : palette.accentSoft },
                  ]}
                >
                  <Text style={[styles.statusText, { color: isCancelled ? palette.danger : palette.accent }]}>
                    {appointment.status || 'Upcoming'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={19} color={palette.muted} />
                <Text style={[styles.infoText, { color: palette.text }]}>{displayClinic(appointment)}</Text>
              </View>

              {appointment.notes ? (
                <View style={[styles.note, { backgroundColor: palette.softSurface }]}>
                  <Text style={[styles.noteText, { color: palette.text }]}>{appointment.notes}</Text>
                </View>
              ) : null}

              <View style={[styles.detailsButton, { borderColor: palette.line }]}>
                <Text style={[styles.detailsText, { color: palette.accent }]}>View Appointment Details</Text>
                <Ionicons name="arrow-forward" size={18} color={palette.accent} />
              </View>
            </AnimatedPressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginTop: 22,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 31,
    marginTop: 3,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 7,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  empty: {
    minHeight: 240,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyCopy: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 6,
  },
  card: {
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
  },
  dateBox: {
    width: 58,
    height: 66,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateMonth: {
    ...type.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  dateDay: {
    ...type.title,
    fontSize: 22,
    marginTop: 1,
  },
  cardTitle: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  cardMeta: {
    ...type.small,
    marginTop: 4,
  },
  status: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    ...type.tiny,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  infoText: {
    ...type.small,
    flex: 1,
  },
  note: {
    borderRadius: 18,
    padding: 13,
    marginTop: 13,
  },
  noteText: {
    ...type.small,
    lineHeight: 19,
  },
  detailsButton: {
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
  detailsText: {
    ...type.small,
    fontWeight: '900',
  },
});
