import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { supabase } from '@/lib/supabase';
import { isGuestMode, updateGuestAppointment } from '@/services/guest';

type VisitNotes = {
  advice: string;
  testResults: string;
  medicationChanges: string;
  nextSteps: string;
  followUpDate: string;
  updatedAt: number | null;
};

const STORAGE_PREFIX = 'preggy:appointment-follow-up';
const emptyNotes: VisitNotes = {
  advice: '',
  testResults: '',
  medicationChanges: '',
  nextSteps: '',
  followUpDate: '',
  updatedAt: null,
};

function parseNotes(raw: string | null): VisitNotes {
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...emptyNotes, ...(parsed && typeof parsed === 'object' ? parsed : {}) };
  } catch {
    return emptyNotes;
  }
}

function NoteField({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  multiline = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.fieldCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={styles.fieldHeader}>
        <View style={[styles.fieldIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name={icon} size={19} color={palette.accent} />
        </View>
        <Text style={[styles.fieldLabel, { color: palette.ink }]}>{label}</Text>
      </View>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          !multiline && styles.singleInput,
          { backgroundColor: palette.canvas, borderColor: palette.line, color: palette.ink },
        ]}
      />
    </View>
  );
}

export default function AppointmentFollowUpScreen() {
  const { palette } = useAppTheme();
  const params = useLocalSearchParams<{ id?: string; status?: string }>();
  const appointmentId = typeof params.id === 'string' ? params.id : null;

  const [notes, setNotes] = useState<VisitNotes>(emptyNotes);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(params.status === 'Completed');

  const storageKey = appointmentId ? `${STORAGE_PREFIX}:${appointmentId}` : null;

  useEffect(() => {
    let active = true;

    async function loadNotes() {
      if (!storageKey) {
        Alert.alert('Appointment missing', 'Open these notes from an appointment.');
        router.back();
        return;
      }

      try {
        const saved = await AsyncStorage.getItem(storageKey);
        if (active) setNotes(parseNotes(saved));
      } catch (error) {
        console.log('Visit notes load error:', error);
        Alert.alert('Could not load notes', 'Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadNotes();
    return () => {
      active = false;
    };
  }, [storageKey]);

  function updateNote(field: keyof Omit<VisitNotes, 'updatedAt'>, value: string) {
    setNotes((current) => ({ ...current, [field]: value }));
  }

  async function persistNotes() {
    if (!storageKey) throw new Error('Appointment missing.');

    const next: VisitNotes = {
      advice: notes.advice.trim(),
      testResults: notes.testResults.trim(),
      medicationChanges: notes.medicationChanges.trim(),
      nextSteps: notes.nextSteps.trim(),
      followUpDate: notes.followUpDate.trim(),
      updatedAt: Date.now(),
    };

    await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    setNotes(next);
    return next;
  }

  async function saveNotes() {
    setSaving(true);
    try {
      await persistNotes();
      Alert.alert('Notes saved', 'Your after-visit notes are safe on this device.');
    } catch (error) {
      console.log('Visit notes save error:', error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function shareNotes() {
    setSaving(true);
    try {
      const saved = await persistNotes();
      const message = [
        'Preggy After-Visit Notes',
        '',
        `Doctor’s advice: ${saved.advice || 'Not added'}`,
        '',
        `Test results: ${saved.testResults || 'Not added'}`,
        '',
        `Medication changes: ${saved.medicationChanges || 'Not added'}`,
        '',
        `Next steps: ${saved.nextSteps || 'Not added'}`,
        '',
        `Follow-up date: ${saved.followUpDate || 'Not set'}`,
      ].join('\n');

      await Share.share({ title: 'Preggy After-Visit Notes', message });
    } catch (error) {
      console.log('Visit notes share error:', error);
      Alert.alert('Could not share', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function completeVisit() {
    if (!appointmentId || completed) return;

    Alert.alert(
      'Mark visit complete?',
      'Your notes will be saved and this appointment will move to completed.',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Complete visit',
          onPress: async () => {
            setSaving(true);
            try {
              await persistNotes();

              if (await isGuestMode()) {
                await updateGuestAppointment(appointmentId, { status: 'Completed' });
              } else {
                const { data, error: userError } = await supabase.auth.getUser();
                if (userError) throw userError;
                if (!data.user?.id) throw new Error('Please log in again.');

                const { error } = await supabase
                  .from('appointments')
                  .update({ status: 'Completed', updated_at: new Date().toISOString() })
                  .eq('id', appointmentId)
                  .eq('user_id', data.user.id);

                if (error) throw error;
              }

              setCompleted(true);
              Alert.alert('Visit completed', 'Your appointment and notes are now saved.');
            } catch (error) {
              console.log('Complete visit error:', error);
              Alert.alert('Could not complete visit', 'Please try again.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  return (
    <Screen bottomSpace={90}>
      <Header title="After Visit" back />

      <View style={[styles.hero, { backgroundColor: palette.accent }]}>
        <View style={styles.heroIcon}>
          <Ionicons name="clipboard-outline" size={30} color={palette.onAccent} />
        </View>
        <Text style={[styles.eyebrow, { color: palette.onAccent }]}>AFTER YOUR APPOINTMENT</Text>
        <Text style={[styles.title, { color: palette.onAccent }]}>Keep the plan from your visit</Text>
        <Text style={[styles.subtitle, { color: palette.onAccent }]}>Save what your care team explained and what happens next.</Text>
      </View>

      {loading ? (
        <View style={[styles.loadingCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text }]}>Loading your notes...</Text>
        </View>
      ) : (
        <>
          <NoteField icon="chatbubble-ellipses-outline" label="Doctor’s advice" placeholder="Advice, explanations, or recommendations" value={notes.advice} onChangeText={(value) => updateNote('advice', value)} />
          <NoteField icon="document-text-outline" label="Test results" placeholder="Results discussed during the visit" value={notes.testResults} onChangeText={(value) => updateNote('testResults', value)} />
          <NoteField icon="medkit-outline" label="Medication changes" placeholder="New medicines, dosage changes, or medicines stopped" value={notes.medicationChanges} onChangeText={(value) => updateNote('medicationChanges', value)} />
          <NoteField icon="checkmark-done-outline" label="Next steps" placeholder="Tests, calls, tasks, or things to monitor" value={notes.nextSteps} onChangeText={(value) => updateNote('nextSteps', value)} />
          <NoteField icon="calendar-outline" label="Follow-up date" placeholder="For example: 12 August 2026" value={notes.followUpDate} onChangeText={(value) => updateNote('followUpDate', value)} multiline={false} />

          <View style={styles.actionRow}>
            <AnimatedPressable disabled={saving} onPress={() => void saveNotes()} style={[styles.primaryButton, { backgroundColor: palette.accent }]}>
              {saving ? <ActivityIndicator color={palette.onAccent} /> : <Ionicons name="save-outline" size={20} color={palette.onAccent} />}
              <Text style={[styles.primaryText, { color: palette.onAccent }]}>Save notes</Text>
            </AnimatedPressable>

            <AnimatedPressable disabled={saving} onPress={() => void shareNotes()} style={[styles.secondaryButton, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
              <Ionicons name="share-social-outline" size={20} color={palette.accent} />
              <Text style={[styles.secondaryText, { color: palette.accent }]}>Share</Text>
            </AnimatedPressable>
          </View>

          {completed ? (
            <View style={[styles.completedCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
              <Ionicons name="checkmark-circle" size={23} color={palette.accent} />
              <Text style={[styles.completedText, { color: palette.ink }]}>This visit is completed</Text>
            </View>
          ) : (
            <AnimatedPressable disabled={saving} onPress={completeVisit} style={[styles.completeButton, { borderColor: palette.accent }]}>
              <Ionicons name="checkmark-circle-outline" size={21} color={palette.accent} />
              <Text style={[styles.completeText, { color: palette.accent }]}>Save and mark visit complete</Text>
            </AnimatedPressable>
          )}

          {notes.updatedAt ? (
            <Text style={[styles.savedAt, { color: palette.muted }]}>Last saved {new Date(notes.updatedAt).toLocaleString()}</Text>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 32, padding: 22, marginTop: 12, marginBottom: 16 },
  heroIcon: { width: 54, height: 54, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  eyebrow: { ...type.section },
  title: { ...type.title, fontSize: 31, lineHeight: 37, marginTop: 5 },
  subtitle: { ...type.body, marginTop: 9, opacity: 0.9 },
  loadingCard: { minHeight: 180, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { ...type.small },
  fieldCard: { borderRadius: 25, borderWidth: 1, padding: 16, marginBottom: 12 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 12 },
  fieldIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { ...type.bodyStrong, flex: 1 },
  input: { minHeight: 105, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, ...type.body },
  singleInput: { minHeight: 54, height: 54, paddingVertical: 0 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryButton: { flex: 1.3, minHeight: 58, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { ...type.bodyStrong },
  secondaryButton: { flex: 1, minHeight: 58, borderRadius: 21, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { ...type.bodyStrong },
  completeButton: { minHeight: 58, borderRadius: 21, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  completeText: { ...type.bodyStrong },
  completedCard: { minHeight: 58, borderRadius: 21, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 12 },
  completedText: { ...type.bodyStrong },
  savedAt: { ...type.tiny, textAlign: 'center', marginTop: 12 },
});
