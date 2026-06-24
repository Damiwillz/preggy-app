import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { CalendarIcon, PinIcon } from '@/components/ui/icons';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
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

function formatAppointmentDate(value?: string | null, time?: string | null) {
  if (!value) return time || 'Date not set';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return time || 'Date not set';

  const label = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return time ? `${label} at ${time}` : label;
}

export default function AppointmentDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const appointmentId = typeof params.id === 'string' ? params.id : null;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAppointment = useCallback(async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = userData.user?.id;

      if (!userId) {
        Alert.alert('Login needed', 'Please log in to view appointment details.');
        return;
      }

      if (!appointmentId) {
        Alert.alert('Appointment missing', 'Please open this appointment from the appointment list.');
        router.back();
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('id,user_id,title,doctor_name,clinic_name,appointment_date,appointment_time,status,notes,created_at')
        .eq('user_id', userId)
        .eq('id', appointmentId)
        .maybeSingle();

      if (error) throw error;

      setAppointment((data as Appointment | null) ?? null);
    } catch (error) {
      console.log('Appointment details error:', error);
      Alert.alert('Appointment error', 'We could not load this appointment.');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useFocusEffect(
    useCallback(() => {
      loadAppointment();
    }, [loadAppointment])
  );

  const cancelAppointment = async () => {
    if (!appointment) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'Cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', appointment.id);

      if (error) throw error;

      setAppointment({
        ...appointment,
        status: 'Cancelled',
      });

      Alert.alert('Appointment cancelled', 'This appointment has been marked as cancelled.');
    } catch (error) {
      console.log('Cancel appointment error:', error);
      Alert.alert('Cancel failed', 'We could not cancel this appointment.');
    }
  };

  return (
    <Screen>
      <Header title="Appointment" back />

      <Card style={styles.hero}>
        <Text style={styles.badge}>{appointment?.status || (loading ? 'Loading' : 'No appointment')}</Text>
        <Text style={styles.title}>{appointment?.title || 'No appointment found'}</Text>

        <View style={styles.infoRow}>
          <CalendarIcon color={colors.plum} />
          <Text style={styles.copy}>
            {formatAppointmentDate(appointment?.appointment_date, appointment?.appointment_time)}
          </Text>
        </View>

        <Text style={styles.doctor}>{appointment?.doctor_name || 'Doctor not set'}</Text>

        <View style={styles.infoRow}>
          <PinIcon color={colors.plum} />
          <Text style={styles.copy}>{appointment?.clinic_name || 'Clinic not set'}</Text>
        </View>

        {appointment?.notes ? <Text style={styles.notes}>{appointment.notes}</Text> : null}

        <Button label="Get Directions" variant="secondary" style={{ marginTop: 18 }} />
      </Card>

      <Text style={styles.heading}>Preparation Checklist</Text>

      {[
        'Drink 32oz of water 1 hour before',
        'Bring insurance card',
        'Wear comfortable clothing',
      ].map((item) => (
        <Card key={item} style={styles.check}>
          <View style={styles.checkDot} />
          <Text style={styles.checkText}>{item}</Text>
        </Card>
      ))}

      <View style={styles.sectionRow}>
        <Text style={styles.heading}>Notes & Questions</Text>
        <Text style={styles.add}>Synced</Text>
      </View>

      {[
        'Ask about prenatal vitamin adjustments.',
        'Can I continue my yoga routine?',
        'When should we schedule the next screening?',
      ].map((item) => (
        <Card key={item} style={styles.note}>
          <Text style={styles.copy}>{item}</Text>
        </Card>
      ))}

      <Button
        label="Back to Appointments"
        variant="secondary"
        style={{ marginTop: 18 }}
        onPress={() => router.push('/(tabs)/appointments' as never)}
      />

      <Button
        label="Cancel Appointment"
        variant="ghost"
        onPress={cancelAppointment}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: 24,
  },
  badge: {
    ...type.section,
    color: colors.rose,
    marginBottom: 12,
  },
  title: {
    ...type.title,
    color: colors.ink,
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  copy: {
    ...type.body,
    color: colors.text,
  },
  notes: {
    ...type.body,
    color: colors.text,
    marginTop: 14,
  },
  doctor: {
    ...type.bodyStrong,
    color: colors.ink,
    marginTop: 18,
  },
  heading: {
    ...type.bodyStrong,
    color: colors.ink,
    marginTop: 24,
    marginBottom: 12,
  },
  check: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    paddingVertical: 16,
  },
  checkDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 6,
    borderColor: colors.plum,
    backgroundColor: colors.surface,
  },
  checkText: {
    ...type.bodyStrong,
    color: colors.ink,
    flex: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  add: {
    ...type.small,
    color: colors.plum,
    marginTop: 16,
  },
  note: {
    marginBottom: 10,
    backgroundColor: colors.cream,
  },
});
