import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { CalendarIcon, PinIcon, PlusIcon } from '@/components/ui/icons';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { reminders } from '@/data/mockData';
import { supabase } from '@/lib/supabase';

type Appointment = {
  id: string;
  user_id: string;
  title: string;
  doctor_name: string | null;
  clinic_name: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
};

const defaultAppointment = {
  title: 'Anatomy scan',
  doctor_name: 'Dr. Sarah Jenkins',
  clinic_name: 'Riverside Women’s Health Clinic',
  appointment_date: '2026-07-22',
  appointment_time: '10:30 AM',
  status: 'Confirmed',
  notes: 'Routine anatomy scan and wellness check.',
};

function formatAppointmentDate(value?: string | null, time?: string | null) {
  if (!value) return time || 'Date not set';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return time || 'Date not set';

  const label = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

  return time ? `${label}, ${time}` : label;
}

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = userData.user?.id;

      if (!userId) {
        Alert.alert('Login needed', 'Please log in to view your appointments.');
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('id,user_id,title,doctor_name,clinic_name,appointment_date,appointment_time,status,notes,created_at')
        .eq('user_id', userId)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setAppointments(data as Appointment[]);
        return;
      }

      const { data: created, error: createError } = await supabase
        .from('appointments')
        .insert({
          user_id: userId,
          ...defaultAppointment,
        })
        .select('id,user_id,title,doctor_name,clinic_name,appointment_date,appointment_time,status,notes,created_at')
        .single();

      if (createError) throw createError;

      setAppointments(created ? [created as Appointment] : []);
    } catch (error) {
      console.log('Appointments load error:', error);
      Alert.alert('Appointments error', 'We could not load your appointments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const nextAppointment = appointments[0];

  const addDemoAppointment = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = userData.user?.id;

      if (!userId) {
        Alert.alert('Login needed', 'Please log in before adding an appointment.');
        return;
      }

      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const appointmentDate = nextMonth.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: userId,
          title: 'Prenatal checkup',
          doctor_name: 'Dr. Sarah Jenkins',
          clinic_name: 'Riverside Women’s Health Clinic',
          appointment_date: appointmentDate,
          appointment_time: '9:00 AM',
          status: 'Pending',
          notes: 'Monthly prenatal wellness check.',
        })
        .select('id,user_id,title,doctor_name,clinic_name,appointment_date,appointment_time,status,notes,created_at')
        .single();

      if (error) throw error;

      setAppointments((current) => [...current, data as Appointment]);

      Alert.alert('Appointment added', 'A new prenatal checkup has been added.');
    } catch (error) {
      console.log('Appointment add error:', error);
      Alert.alert('Add failed', 'We could not add this appointment.');
    }
  };

  return (
    <Screen>
      <Header />

      <Text style={styles.title}>Appointments</Text>

      <AnimatedPressable onPress={() => router.push('/appointment/details')}>
        <Card>
          <View style={styles.headerRow}>
            <Text style={styles.section}>Appointments</Text>
            <Text style={styles.viewAll}>{loading ? 'Loading' : `${appointments.length} saved`}</Text>
          </View>

          {nextAppointment ? (
            <>
              <View style={styles.row}>
                <View style={styles.icon}>
                  <CalendarIcon color={colors.plum} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{nextAppointment.title}</Text>
                  <Text style={styles.copy}>
                    {formatAppointmentDate(
                      nextAppointment.appointment_date,
                      nextAppointment.appointment_time
                    )}
                  </Text>
                </View>

                <Text style={styles.badge}>{nextAppointment.status || 'Confirmed'}</Text>
              </View>

              <Text style={styles.info}>{nextAppointment.doctor_name || 'Doctor not set'}</Text>

              <View style={styles.location}>
                <PinIcon size={18} />
                <Text style={styles.info}>
                  {nextAppointment.clinic_name || 'Clinic not set'}
                </Text>
              </View>

              <Button label="Get Directions" variant="secondary" style={{ marginTop: 16 }} />
            </>
          ) : (
            <Text style={styles.copy}>No appointments saved yet.</Text>
          )}
        </Card>
      </AnimatedPressable>

      <Card style={styles.reminderCard}>
        <Text style={styles.heading}>Daily Reminders</Text>

        {reminders.map((item) => (
          <View key={item.title} style={styles.reminder}>
            <Text style={styles.reminderTitle}>{item.title}</Text>
            <Text style={styles.reminderTime}>{item.time}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.calendarCard}>
        <Text style={styles.section}>UPCOMING APPOINTMENTS</Text>

        <View style={styles.days}>
          {appointments.slice(0, 5).map((appointment, index) => (
            <View key={appointment.id} style={index === 0 ? styles.dayActive : styles.day}>
              <Text style={index === 0 ? styles.dayActiveText : styles.dayText}>
                {appointment.appointment_date
                  ? new Date(`${appointment.appointment_date}T00:00:00`).toLocaleDateString('en-US', {
                      weekday: 'short',
                      day: 'numeric',
                    })
                  : 'No date'}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <AnimatedPressable style={styles.fab} onPress={addDemoAppointment}>
        <PlusIcon />
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...type.title,
    color: colors.ink,
    marginTop: 20,
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  section: {
    ...type.section,
    color: colors.rose,
  },
  viewAll: {
    ...type.small,
    color: colors.plum,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: colors.softSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  copy: {
    ...type.small,
    color: colors.text,
  },
  badge: {
    ...type.tiny,
    color: colors.green,
    backgroundColor: '#EFF5EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  info: {
    ...type.small,
    color: colors.text,
    marginTop: 10,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reminderCard: {
    marginTop: 18,
  },
  heading: {
    ...type.bodyStrong,
    color: colors.ink,
    marginBottom: 8,
  },
  reminder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  reminderTitle: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  reminderTime: {
    ...type.small,
    color: colors.plum,
    textAlign: 'right',
  },
  calendarCard: {
    marginTop: 18,
  },
  days: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  day: {
    flex: 1,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: {
    flex: 1,
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: colors.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...type.tiny,
    color: colors.text,
    textAlign: 'center',
  },
  dayActiveText: {
    ...type.tiny,
    color: colors.surface,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 108,
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: colors.plum,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
