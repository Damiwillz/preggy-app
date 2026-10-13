import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { supabase } from '@/lib/supabase';
import { getGuestAppointment, isGuestMode, saveGuestAppointment } from '@/services/guest';

export default function AddAppointmentScreen() {
  const { palette } = useAppTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const appointmentId = typeof params.id === 'string' ? params.id : null;
  const isEditing = !!appointmentId;
  const [title, setTitle] = useState('');
  const [doctor, setDoctor] = useState('');
  const [clinic, setClinic] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadAppointment() {
      if (!appointmentId) return;

      try {
        if (await isGuestMode()) {
          const guestAppointment = await getGuestAppointment(appointmentId);

          if (guestAppointment) {
            setTitle(guestAppointment.title || guestAppointment.type || '');
            setDoctor(guestAppointment.doctor_name || guestAppointment.doctor || '');
            setClinic(guestAppointment.clinic_name || guestAppointment.clinic || guestAppointment.location || '');
            setDate(guestAppointment.appointment_date || guestAppointment.date || '');
            setTime(guestAppointment.appointment_time || guestAppointment.time || '');
            setNotes(guestAppointment.notes || '');
          }

          return;
        }

        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', appointmentId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setTitle(data.title || data.type || '');
          setDoctor(data.doctor_name || data.doctor || '');
          setClinic(data.clinic_name || data.clinic || data.location || '');
          setDate(data.appointment_date || data.date || '');
          setTime(data.appointment_time || data.time || '');
          setNotes(data.notes || '');
        }
      } catch (error) {
        console.log('Load appointment edit error:', error);
        Alert.alert('Appointment', 'Could not load this appointment.');
      }
    }

    void loadAppointment();
  }, [appointmentId]);

  async function saveAppointment() {
    Keyboard.dismiss();

    if (!title.trim()) {
      Alert.alert('Appointment title required', 'Enter a title like Prenatal checkup or Scan appointment.');
      return;
    }

    if (!date.trim()) {
      Alert.alert('Date required', 'Enter the appointment date. Example: 2026-10-09');
      return;
    }

    setSaving(true);

    try {
      if (await isGuestMode()) {
        const cleanDate = date.trim();
        const cleanTime = time.trim() || 'Time not set';

        await saveGuestAppointment(
          {
            title: title.trim(),
            type: title.trim(),
            doctor: doctor.trim() || null,
            doctor_name: doctor.trim() || null,
            clinic: clinic.trim() || null,
            clinic_name: clinic.trim() || null,
            location: clinic.trim() || null,
            appointment_date: cleanDate,
            appointment_time: cleanTime,
            date: cleanDate,
            time: cleanTime,
            status: 'Upcoming',
            notes: notes.trim() || null,
          },
          appointmentId
        );

        Alert.alert(
          isEditing ? 'Appointment updated' : 'Appointment added',
          isEditing ? 'Your guest appointment has been updated on this device.' : 'Your guest appointment has been saved on this device.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );

        return;
      }

      const { data, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = data.user?.id;

      if (!userId) throw new Error('No logged in user.');

      const cleanDate = date.trim();
      const cleanTime = time.trim() || 'Time not set';

      const timeForDate = cleanTime !== 'Time not set'
        ? cleanTime.replace(/\s+/g, '').toUpperCase()
        : '';

      const appointmentAt =
        cleanDate && timeForDate
          ? new Date(`${cleanDate}T${timeForDate.includes('PM') || timeForDate.includes('AM') ? '09:00:00' : `${timeForDate}:00`}`).toISOString()
          : null;

      const payload = {
        user_id: userId,
        title: title.trim(),
        type: title.trim(),
        doctor: doctor.trim() || null,
        doctor_name: doctor.trim() || null,
        clinic: clinic.trim() || null,
        clinic_name: clinic.trim() || null,
        location: clinic.trim() || null,
        appointment_date: cleanDate,
        appointment_time: cleanTime,
        date: cleanDate,
        time: cleanTime,
        appointment_at: appointmentAt,
        status: 'Upcoming',
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const query = isEditing && appointmentId
        ? supabase.from('appointments').update(payload).eq('id', appointmentId).eq('user_id', userId)
        : supabase.from('appointments').insert(payload);

      const { error } = await query;

      if (error) throw error;

      Alert.alert(
        isEditing ? 'Appointment updated' : 'Appointment added',
        isEditing ? 'Your appointment has been updated.' : 'Your appointment has been saved.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not save appointment', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen bottomSpace={36} style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <Header title={isEditing ? "Edit Appointment" : "Add Appointment"} back />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View
          style={[
            styles.hero,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: palette.surface },
            ]}
          >
            <Ionicons
              name={isEditing ? 'create-outline' : 'calendar-outline'}
              size={27}
              color={palette.accent}
            />
          </View>

          <View style={styles.heroContent}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>
              {isEditing ? 'UPDATE VISIT' : 'NEW CARE VISIT'}
            </Text>

            <Text style={[styles.title, { color: palette.ink }]}>
              {isEditing ? 'Edit appointment' : 'Plan your next visit'}
            </Text>

            <Text style={[styles.subtitle, { color: palette.text }]}>
              Keep the important details together and arrive prepared.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: palette.accent }]}>
            VISIT INFORMATION
          </Text>

          <Field
            palette={palette}
            icon="medical-outline"
            label="Appointment title"
            placeholder="Prenatal checkup"
            value={title}
            onChangeText={setTitle}
          />

          <Field
            palette={palette}
            icon="person-outline"
            label="Doctor or care team"
            placeholder="Dr. Grace"
            value={doctor}
            onChangeText={setDoctor}
          />

          <Field
            palette={palette}
            icon="location-outline"
            label="Clinic or location"
            placeholder="Women’s Wellness Clinic"
            value={clinic}
            onChangeText={setClinic}
          />

          <View style={styles.divider} />

          <Text style={[styles.sectionLabel, { color: palette.accent }]}>
            DATE AND TIME
          </Text>

          <Field
            palette={palette}
            icon="calendar-outline"
            label="Date"
            placeholder="2026-10-09"
            value={date}
            onChangeText={setDate}
          />

          <Field
            palette={palette}
            icon="time-outline"
            label="Time"
            placeholder="10:00 AM"
            value={time}
            onChangeText={setTime}
          />

          <View style={styles.divider} />

          <Text style={[styles.sectionLabel, { color: palette.accent }]}>
            PREPARATION
          </Text>

          <Field
            palette={palette}
            icon="document-text-outline"
            label="Notes"
            placeholder="Bring questions, reports, or symptom notes"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <AnimatedPressable
            style={[styles.button, { backgroundColor: palette.accent }, saving && styles.disabled]}
            onPress={saveAppointment}
            disabled={saving}
          >
            <Text style={[styles.buttonText, { color: palette.onAccent }]}>{saving ? 'Saving...' : isEditing ? 'Update Appointment' : 'Save Appointment'}</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Field({
  icon,
  label,
  palette,
  ...props
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  palette: ReturnType<typeof useAppTheme>['palette'];
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: palette.ink }]}>
        {label}
      </Text>

      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: palette.canvas,
            borderColor: palette.line,
          },
          props.multiline && styles.textareaShell,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={palette.accent}
          style={styles.fieldIcon}
        />

        <TextInput
          {...props}
          placeholderTextColor={palette.muted}
          style={[
            styles.input,
            { color: palette.ink },
            props.multiline && styles.textarea,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFF8F5',
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    borderRadius: 28,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    flex: 1,
  },
  eyebrow: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 2,
  },
  subtitle: {
    ...type.small,
    marginTop: 4,
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  sectionLabel: {
    ...type.tiny,
    letterSpacing: 1.3,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150,120,130,0.18)',
    marginTop: 2,
    marginBottom: 20,
  },
  field: {
    marginBottom: 17,
  },
  label: {
    ...type.small,
    fontWeight: '900',
    marginBottom: 8,
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  textareaShell: {
    minHeight: 112,
    alignItems: 'flex-start',
  },
  fieldIcon: {
    marginRight: 11,
    marginTop: 1,
  },
  input: {
    ...type.body,
    flex: 1,
    minHeight: 54,
    paddingVertical: 11,
  },
  textarea: {
    minHeight: 105,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
