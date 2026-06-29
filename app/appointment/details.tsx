import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { supabase } from '@/lib/supabase';

type Appointment = {
  id: string;
  user_id: string;
  title: string | null;
  doctor: string | null;
  clinic: string | null;
  doctor_name: string | null;
  clinic_name: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  date: string | null;
  time: string | null;
  location: string | null;
  type: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
};

function displayTitle(appointment: Appointment | null) {
  return appointment?.title || appointment?.type || 'Prenatal appointment';
}

function displayDoctor(appointment: Appointment | null) {
  return appointment?.doctor_name || appointment?.doctor || 'Care team not set';
}

function displayClinic(appointment: Appointment | null) {
  return appointment?.clinic_name || appointment?.location || appointment?.clinic || 'Clinic not set';
}

function displayDate(appointment: Appointment | null) {
  return appointment?.appointment_date || appointment?.date || null;
}

function displayTime(appointment: Appointment | null) {
  return appointment?.appointment_time || appointment?.time || null;
}

function formatAppointmentDate(value?: string | null, time?: string | null) {
  if (!value) return time || 'Date not set';

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return time || 'Date not set';

  const label = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return time ? `${label} at ${time}` : label;
}

export default function AppointmentDetailsScreen() {
  const { palette } = useAppTheme();
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
        .select('*')
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

    Alert.alert(
      'Cancel appointment?',
      'This will mark the appointment as cancelled. You can still keep it in your records.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel appointment',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appointments')
                .update({
                  status: 'Cancelled',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', appointment.id)
                .eq('user_id', appointment.user_id);

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
          },
        },
      ]
    );
  };

  const deleteAppointment = async () => {
    if (!appointment) return;

    Alert.alert(
      'Delete appointment?',
      'This will permanently remove this appointment from Preggy.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', appointment.id)
                .eq('user_id', appointment.user_id);

              if (error) throw error;

              Alert.alert('Appointment deleted', 'This appointment has been removed.', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/(tabs)/appointments' as never),
                },
              ]);
            } catch (error) {
              console.log('Delete appointment error:', error);
              Alert.alert('Delete failed', 'We could not delete this appointment.');
            }
          },
        },
      ]
    );
  };

  const isCancelled = appointment?.status === 'Cancelled';

  return (
    <Screen bottomSpace={44}>
      <Header title="Appointment" back />

      {loading ? (
        <View style={[styles.loadingCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text }]}>Loading appointment...</Text>
        </View>
      ) : (
        <>
          <View style={[styles.heroCard, { backgroundColor: isCancelled ? palette.danger : palette.accent }]}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}>
                <Ionicons name="calendar-outline" size={31} color={palette.onAccent} />
              </View>

              <View style={[styles.statusBadge, isCancelled && styles.cancelledBadge]}>
                <Text style={[styles.statusText, { color: palette.onAccent }]}>
                  {appointment?.status || 'Upcoming'}
                </Text>
              </View>
            </View>

            <Text style={styles.eyebrow}>CARE VISIT</Text>
            <Text style={[styles.title, { color: palette.onAccent }]}>{displayTitle(appointment)}</Text>
            <Text style={[styles.heroDate, { color: palette.onAccent }]}>
              {formatAppointmentDate(displayDate(appointment), displayTime(appointment))}
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name="person-outline" size={22} color={palette.accent} />
              </View>
              <Text style={[styles.infoLabel, { color: palette.accent }]}>Doctor</Text>
              <Text style={[styles.infoValue, { color: palette.ink }]}>{displayDoctor(appointment)}</Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name="location-outline" size={22} color={palette.accent} />
              </View>
              <Text style={[styles.infoLabel, { color: palette.accent }]}>Clinic</Text>
              <Text style={[styles.infoValue, { color: palette.ink }]}>{displayClinic(appointment)}</Text>
            </View>
          </View>

          <View style={[styles.notesCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: palette.ink }]}>Notes</Text>
              <Ionicons name="document-text-outline" size={21} color={palette.accent} />
            </View>

            <Text style={[styles.notesText, { color: palette.text }]}>
              {appointment?.notes || 'No notes yet. Add questions, reminders, or anything you want to discuss at this appointment.'}
            </Text>
          </View>

          <Text style={[styles.heading, { color: palette.ink }]}>Preparation checklist</Text>

          {[
            'Bring your questions and symptom notes',
            'Take any reports or test results with you',
            'Confirm clinic address and appointment time',
          ].map((item) => (
            <View key={item} style={[styles.checkCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <View style={[styles.checkIcon, { backgroundColor: palette.accent }]}>
                <Ionicons name="checkmark" size={18} color={palette.onAccent} />
              </View>
              <Text style={[styles.checkText, { color: palette.text }]}>{item}</Text>
            </View>
          ))}

          <View style={styles.actionRow}>
            <AnimatedPressable
              onPress={() => {
                if (appointment?.id) {
                  router.push(`/appointment/add?id=${appointment.id}` as never);
                }
              }}
              style={[styles.primaryButton, { backgroundColor: palette.accent }]}
            >
              <Ionicons name="create-outline" size={20} color={palette.onAccent} />
              <Text style={[styles.primaryButtonText, { color: palette.onAccent }]}>Edit</Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => router.push('/(tabs)/appointments' as never)}
              style={[styles.secondaryButton, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}
            >
              <Text style={[styles.secondaryButtonText, { color: palette.accentStrong }]}>Back</Text>
            </AnimatedPressable>
          </View>

          {!isCancelled && (
            <AnimatedPressable onPress={cancelAppointment} style={styles.warningButton}>
              <Ionicons name="close-circle-outline" size={20} color="#A45A62" />
              <Text style={styles.warningButtonText}>Cancel appointment</Text>
            </AnimatedPressable>
          )}

          <AnimatedPressable onPress={deleteAppointment} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#B84D57" />
            <Text style={styles.deleteButtonText}>Delete appointment</Text>
          </AnimatedPressable>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingCard: {
    minHeight: 220,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  loadingText: {
    ...type.small,
    color: colors.text,
  },
  heroCard: {
    marginTop: 18,
    backgroundColor: '#CE6F79',
    borderRadius: 34,
    padding: 24,
    minHeight: 260,
    justifyContent: 'space-between',
  },
  cancelledHero: {
    backgroundColor: '#A45A62',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  cancelledBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  statusText: {
    ...type.tiny,
    color: '#fff',
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cancelledBadgeText: {
    color: '#fff',
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 24,
  },
  title: {
    ...type.title,
    color: '#fff',
    fontSize: 33,
    lineHeight: 38,
    marginTop: 8,
  },
  heroDate: {
    ...type.bodyStrong,
    color: '#FFF4F5',
    marginTop: 12,
    lineHeight: 22,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    minHeight: 145,
  },
  infoIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    ...type.tiny,
    color: '#CE6F79',
    fontWeight: '900',
    marginTop: 13,
    textTransform: 'uppercase',
  },
  infoValue: {
    ...type.bodyStrong,
    color: colors.ink,
    marginTop: 4,
    lineHeight: 21,
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...type.title,
    color: colors.ink,
    fontSize: 24,
  },
  notesText: {
    ...type.body,
    color: colors.text,
    marginTop: 10,
    lineHeight: 23,
  },
  heading: {
    ...type.title,
    color: colors.ink,
    fontSize: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  checkCard: {
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 15,
    marginBottom: 10,
  },
  checkIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    ...type.bodyStrong,
    color: colors.ink,
    flex: 1,
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  primaryButton: {
    flex: 1.2,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    ...type.bodyStrong,
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#FFF0F1',
    borderWidth: 1,
    borderColor: '#EFDCDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...type.bodyStrong,
    color: colors.plum,
  },
  warningButton: {
    height: 54,
    borderRadius: 20,
    backgroundColor: '#FFF7F4',
    borderWidth: 1,
    borderColor: '#F0D4D7',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  warningButtonText: {
    ...type.bodyStrong,
    color: '#A45A62',
  },
  deleteButton: {
    height: 54,
    borderRadius: 20,
    backgroundColor: '#FFF4F4',
    borderWidth: 1,
    borderColor: '#F1C9CD',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  deleteButtonText: {
    ...type.bodyStrong,
    color: '#B84D57',
  },
});
