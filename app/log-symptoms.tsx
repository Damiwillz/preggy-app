import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { supabase } from '@/lib/supabase';

const moods = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '🤢', label: 'Queasy' },
  { emoji: '😣', label: 'Uncomfortable' },
];

const symptomOptions = [
  'Nausea',
  'Back pain',
  'Fatigue',
  'Swelling',
  'Headache',
  'Baby kicks',
  'Heartburn',
  'Cramps',
];

const intensityLevels = [1, 2, 3, 4, 5];

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function LogSymptomsScreen() {
  const { palette } = useAppTheme();

  const [mood, setMood] = useState('Calm');
  const [symptoms, setSymptoms] = useState<string[]>(['Baby kicks']);
  const [intensity, setIntensity] = useState(2);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => {
    if (symptoms.length === 0) return 'No symptoms selected';

    return symptoms.join(', ');
  }, [symptoms]);

  function toggleSymptom(symptom: string) {
    setSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom]
    );
  }

  async function saveLog() {
    setSaving(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = userData.user?.id;

      if (!userId) {
        throw new Error('No logged in user.');
      }

      const { error } = await supabase.from('symptom_logs').insert({
        user_id: userId,
        mood,
        symptoms,
        intensity,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      Alert.alert('Saved', 'Your symptom log has been saved.', [
        {
          text: 'Go Home',
          onPress: () => router.replace('/(tabs)/home' as never),
        },
      ]);
    } catch (error) {
      console.log('Save symptom log error:', error);

      Alert.alert('Could not save', 'Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen bottomSpace={40}>
      <Header title="Log Symptoms" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>DAILY CHECK IN</Text>
        <Text style={[styles.title, { color: palette.ink }]}>How are you feeling?</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          {getTodayLabel()} • Track your mood, symptoms, and notes.
        </Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <View style={[styles.summaryIcon, { backgroundColor: palette.accent }]}>
          <Ionicons name="pulse" size={28} color={palette.onAccent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.summaryLabel, { color: palette.accent }]}>TODAY’S SUMMARY</Text>
          <Text style={[styles.summaryTitle, { color: palette.ink }]}>{mood} • Level {intensity}</Text>
          <Text style={[styles.summaryCopy, { color: palette.text }]}>{summary}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Mood</Text>

      <View style={styles.moodGrid}>
        {moods.map((item) => {
          const selected = mood === item.label;

          return (
            <AnimatedPressable
              key={item.label}
              onPress={() => setMood(item.label)}
              style={[
                styles.moodCard,
                {
                  backgroundColor: selected ? palette.accentSoft : palette.surface,
                  borderColor: selected ? palette.accent : palette.line,
                },
              ]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.moodText, { color: selected ? palette.accent : palette.text }]}>
                {item.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Symptoms</Text>

      <View style={styles.symptomWrap}>
        {symptomOptions.map((symptom) => {
          const selected = symptoms.includes(symptom);

          return (
            <AnimatedPressable
              key={symptom}
              onPress={() => toggleSymptom(symptom)}
              style={[
                styles.symptomChip,
                {
                  backgroundColor: selected ? palette.accent : palette.surface,
                  borderColor: selected ? palette.accent : palette.line,
                },
              ]}
            >
              <Text style={[styles.symptomText, { color: selected ? palette.onAccent : palette.ink }]}>
                {symptom}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Intensity</Text>

      <View style={[styles.intensityCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        {intensityLevels.map((level) => {
          const selected = intensity === level;

          return (
            <AnimatedPressable
              key={level}
              onPress={() => setIntensity(level)}
              style={[
                styles.levelButton,
                {
                  backgroundColor: selected ? palette.accent : palette.softSurface,
                  borderColor: selected ? palette.accent : palette.line,
                },
              ]}
            >
              <Text style={[styles.levelText, { color: selected ? palette.onAccent : palette.text }]}>
                {level}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Notes</Text>

      <View style={[styles.notesCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add anything you want to remember..."
          placeholderTextColor={palette.muted}
          style={[styles.notesInput, { color: palette.ink }]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <AnimatedPressable
        onPress={saveLog}
        disabled={saving}
        style={[styles.saveButton, { backgroundColor: palette.accent }]}
      >
        {saving ? (
          <ActivityIndicator color={palette.onAccent} />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={22} color={palette.onAccent} />
            <Text style={[styles.saveText, { color: palette.onAccent }]}>Save today’s log</Text>
          </>
        )}
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
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
  summaryCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    ...type.section,
  },
  summaryTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    marginTop: 4,
  },
  summaryCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    marginBottom: 10,
    marginTop: 6,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  moodCard: {
    width: '31%',
    minHeight: 94,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 7,
  },
  moodText: {
    ...type.small,
    fontWeight: '800',
    textAlign: 'center',
  },
  symptomWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 14,
  },
  symptomChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  symptomText: {
    ...type.small,
    fontWeight: '800',
  },
  intensityCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  levelButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  notesCard: {
    minHeight: 135,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
  },
  notesInput: {
    ...type.body,
    minHeight: 105,
    lineHeight: 22,
  },
  saveButton: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
    marginTop: 18,
  },
  saveText: {
    ...type.bodyStrong,
  },
});
