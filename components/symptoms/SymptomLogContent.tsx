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

type Props = {
  back?: boolean;
};

export function SymptomLogContent({ back = false }: Props) {
  const { palette } = useAppTheme();

  const [mood, setMood] = useState('Calm');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(2);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => {
    if (symptoms.length === 0) return 'No symptoms selected yet';
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
    <Screen bottomSpace={44}>
      <Header title="Log Symptoms" back={back} />

      <View style={[styles.heroCard, { backgroundColor: palette.accent }]}>
        <View style={styles.heroIcon}>
          <Ionicons name="pulse" size={29} color={palette.onAccent} />
        </View>

        <Text style={styles.eyebrow}>DAILY CHECK IN</Text>
        <Text style={[styles.title, { color: palette.onAccent }]}>How are you feeling today?</Text>
        <Text style={[styles.subtitle, { color: palette.onAccent }]}>{getTodayLabel()} • Track mood, symptoms, and notes.</Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View>
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

      <View style={styles.intensityLabels}>
        <Text style={[styles.intensityHint, { color: palette.muted }]}>Mild</Text>
        <Text style={[styles.intensityHint, { color: palette.muted }]}>Strong</Text>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Notes</Text>

      <View style={[styles.notesCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add anything you want to remember, such as when symptoms started or what helped..."
          placeholderTextColor={palette.muted}
          style={[styles.notesInput, { color: palette.ink }]}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={[styles.safetyNote, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="shield-checkmark-outline" size={21} color={palette.accentStrong} />
        <Text style={[styles.safetyText, { color: palette.text }]}>
          If you have bleeding, severe pain, fever, dizziness, or reduced movement later in pregnancy, contact your clinician urgently.
        </Text>
      </View>

      <AnimatedPressable
        onPress={saveLog}
        disabled={saving}
        style={[styles.saveButton, { backgroundColor: palette.accent }, saving && { opacity: 0.72 }]}
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
  heroCard: {
    marginTop: 16,
    backgroundColor: '#CE6F79',
    borderRadius: 34,
    padding: 24,
    minHeight: 220,
    justifyContent: 'center',
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 31,
    lineHeight: 36,
    color: '#fff',
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    color: '#FFF4F5',
    marginTop: 8,
    lineHeight: 23,
  },
  summaryCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
    marginBottom: 20,
  },
  summaryLabel: {
    ...type.section,
  },
  summaryTitle: {
    ...type.title,
    fontSize: 23,
    marginTop: 5,
  },
  summaryCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 5,
    fontWeight: '800',
  },
  sectionTitle: {
    ...type.title,
    fontSize: 24,
    marginBottom: 12,
    marginTop: 8,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  moodCard: {
    width: '31%',
    minHeight: 98,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  emoji: {
    fontSize: 29,
    marginBottom: 7,
  },
  moodText: {
    ...type.small,
    fontWeight: '900',
    textAlign: 'center',
  },
  symptomWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 16,
  },
  symptomChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  symptomText: {
    ...type.small,
    fontWeight: '900',
  },
  intensityCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelButton: {
    width: 52,
    height: 52,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  intensityHint: {
    ...type.tiny,
    fontWeight: '900',
  },
  notesCard: {
    minHeight: 140,
    borderRadius: 26,
    borderWidth: 1,
    padding: 14,
  },
  notesInput: {
    ...type.body,
    minHeight: 110,
    lineHeight: 23,
  },
  safetyNote: {
    marginTop: 16,
    backgroundColor: '#FFF0F1',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    flexDirection: 'row',
    gap: 12,
  },
  safetyText: {
    ...type.small,
    color: '#6E555A',
    lineHeight: 20,
    flex: 1,
    fontWeight: '700',
  },
  saveButton: {
    height: 58,
    borderRadius: 22,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  saveText: {
    ...type.bodyStrong,
  },
});
