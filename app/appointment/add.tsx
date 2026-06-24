import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { supabase } from '@/lib/supabase';

export default function AddAppointmentScreen() {
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
      const { data, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = data.user?.id;

      if (!userId) throw new Error('No logged in user.');

      const cleanDate = date.trim();
      const cleanTime = time.trim() || 'Time not set';

      const appointmentAt =
        cleanDate && cleanTime !== 'Time not set'
          ? new Date(`${cleanDate}T09:00:00`).toISOString()
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
    <Screen bottomSpace={36} style={styles.screen}>
      <Header title={isEditing ? "Edit Appointment" : "Add Appointment"} back />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="calendar-outline" size={34} color="#CE6F79" />
          </View>

          <Text style={styles.title}>{isEditing ? 'Edit appointment' : 'New appointment'}</Text>
          <Text style={styles.subtitle}>Save your next checkup, scan, clinic visit, or maternity appointment.</Text>
        </View>

        <View style={styles.card}>
          <Field label="Title" placeholder="Prenatal checkup" value={title} onChangeText={setTitle} />
          <Field label="Doctor or care team" placeholder="Dr. Grace" value={doctor} onChangeText={setDoctor} />
          <Field label="Clinic or location" placeholder="Women’s Wellness Clinic" value={clinic} onChangeText={setClinic} />
          <Field label="Date" placeholder="2026-10-09" value={date} onChangeText={setDate} />
          <Field label="Time" placeholder="10:00 AM" value={time} onChangeText={setTime} />
          <Field
            label="Notes"
            placeholder="Bring questions, reports, or symptom notes"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <AnimatedPressable
            style={[styles.button, saving && styles.disabled]}
            onPress={saveAppointment}
            disabled={saving}
          >
            <Text style={styles.buttonText}>{saving ? 'Saving...' : isEditing ? 'Update Appointment' : 'Save Appointment'}</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#A98C93"
        style={[styles.input, props.multiline && styles.textarea]}
      />
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
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  iconCircle: {
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    ...type.title,
    color: '#2A151B',
    fontSize: 30,
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    color: '#9C7B82',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    ...type.small,
    color: '#2A151B',
    fontWeight: '900',
    marginBottom: 8,
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    backgroundColor: '#FFF8F5',
    paddingHorizontal: 16,
    color: '#2A151B',
    ...type.body,
  },
  textarea: {
    minHeight: 104,
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
