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
import { getGuestAppointments, isGuestMode } from '@/services/guest';

type AppointmentFilter = 'Upcoming' | 'Past' | 'Cancelled';

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

function isCancelledAppointment(appointment: Appointment) {
  return appointment.status?.toLowerCase() === 'cancelled';
}

function isPastAppointment(appointment: Appointment) {
  if (appointment.status?.toLowerCase() === 'completed') {
    return true;
  }

  const value = displayDate(appointment);

  if (!value) return false;

  const appointmentDate = new Date(`${value}T23:59:59`);

  if (Number.isNaN(appointmentDate.getTime())) return false;

  return appointmentDate.getTime() < Date.now();
}

export default function AppointmentsScreen() {
  const { palette } = useAppTheme();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<AppointmentFilter>('Upcoming');

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
    if (await isGuestMode()) {
      const guestAppointments = await getGuestAppointments();

      setAppointments(guestAppointments as Appointment[]);
      return;
    }

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

  const upcomingAppointments = appointments.filter(
    (appointment) =>
      !isCancelledAppointment(appointment) &&
      !isPastAppointment(appointment)
  );

  const pastAppointments = appointments.filter(
    (appointment) =>
      !isCancelledAppointment(appointment) &&
      isPastAppointment(appointment)
  );

  const cancelledAppointments = appointments.filter(
    isCancelledAppointment
  );

  const visibleAppointments =
    filter === 'Upcoming'
      ? upcomingAppointments
      : filter === 'Past'
        ? pastAppointments
        : cancelledAppointments;

  const filters: AppointmentFilter[] = [
    'Upcoming',
    'Past',
    'Cancelled',
  ];

  return (
    <Screen bottomSpace={120}>
      <Header title="Appointments" back />

      <View
        style={[
          styles.scheduleHero,
          {
            backgroundColor: palette.accent,
            borderColor: palette.accent,
          },
        ]}
      >
        <View style={styles.scheduleHeroTop}>
          <View style={styles.scheduleLabel}>
            <Ionicons
              name="calendar-clear-outline"
              size={17}
              color={palette.onAccent}
            />
            <Text
              style={[
                styles.scheduleLabelText,
                { color: palette.onAccent },
              ]}
            >
              CARE CALENDAR
            </Text>
          </View>

          <AnimatedPressable
            onPress={addAppointment}
            disabled={adding}
            style={styles.heroAddButton}
          >
            {adding ? (
              <ActivityIndicator color={palette.onAccent} />
            ) : (
              <>
                <Ionicons
                  name="add"
                  size={20}
                  color={palette.onAccent}
                />
                <Text
                  style={[
                    styles.heroAddText,
                    { color: palette.onAccent },
                  ]}
                >
                  Add visit
                </Text>
              </>
            )}
          </AnimatedPressable>
        </View>

        <Text
          style={[
            styles.scheduleHeroTitle,
            { color: palette.onAccent },
          ]}
        >
          Your care, beautifully organised.
        </Text>

        <Text style={styles.scheduleHeroCopy}>
          Keep every checkup, scan and maternity visit in one calm place.
        </Text>

        <View style={styles.scheduleStats}>
          <View style={styles.scheduleStat}>
            <Text style={styles.scheduleStatValue}>
              {upcomingAppointments.length}
            </Text>
            <Text style={styles.scheduleStatLabel}>
              Upcoming
            </Text>
          </View>

          <View style={styles.scheduleStatDivider} />

          <View style={styles.scheduleStat}>
            <Text style={styles.scheduleStatValue}>
              {pastAppointments.length}
            </Text>
            <Text style={styles.scheduleStatLabel}>
              Completed
            </Text>
          </View>

          <View style={styles.scheduleStatDivider} />

          <View style={styles.scheduleStat}>
            <Text style={styles.scheduleStatValue}>
              {appointments.length}
            </Text>
            <Text style={styles.scheduleStatLabel}>
              Total
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.filterRow}>
        {filters.map((item) => {
          const active = filter === item;

          return (
            <AnimatedPressable
              key={item}
              onPress={() => setFilter(item)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: active
                    ? palette.accent
                    : palette.surface,
                  borderColor: active
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: active
                      ? palette.onAccent
                      : palette.text,
                  },
                ]}
              >
                {item}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={styles.listHeading}>
        <View>
          <Text style={[styles.listTitle, { color: palette.ink }]}>
            {filter} visits
          </Text>
          <Text style={[styles.listCopy, { color: palette.text }]}>
            {visibleAppointments.length}{' '}
            {visibleAppointments.length === 1 ? 'appointment' : 'appointments'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>Loading appointments...</Text>
        </View>
      ) : visibleAppointments.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.emptyIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="calendar-outline" size={34} color={palette.accent} />
          </View>

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>No appointments yet</Text>
          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            {filter === 'Upcoming'
              ? 'Add your next checkup, scan, or maternity visit.'
              : `No ${filter.toLowerCase()} appointments to show.`}
          </Text>
        </View>
      ) : (
        visibleAppointments.map((appointment) => {
          const isCancelled = isCancelledAppointment(appointment);

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
  scheduleHero: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 21,
    marginTop: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },
  scheduleHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  scheduleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  scheduleLabelText: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  heroAddButton: {
    minHeight: 40,
    borderRadius: 16,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(255,255,255,0.17)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  heroAddText: {
    ...type.small,
  },
  scheduleHeroTitle: {
    ...type.title,
    fontSize: 29,
    lineHeight: 35,
    maxWidth: 310,
    marginTop: 28,
  },
  scheduleHeroCopy: {
    ...type.small,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 20,
    maxWidth: 315,
    marginTop: 7,
  },
  scheduleStats: {
    minHeight: 76,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 21,
    paddingHorizontal: 10,
  },
  scheduleStat: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleStatValue: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 25,
  },
  scheduleStatLabel: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.76)',
    marginTop: 2,
  },
  scheduleStatDivider: {
    width: 1,
    height: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  filterButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    ...type.small,
    fontWeight: '800',
  },
  listHeading: {
    marginBottom: 12,
  },
  listTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 28,
  },
  listCopy: {
    ...type.small,
    marginTop: 2,
  },
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
