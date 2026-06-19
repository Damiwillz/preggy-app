import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { supabase } from '@/lib/supabase';

const moods = [
  ['😊', 'Happy'],
  ['😌', 'Calm'],
  ['😴', 'Tired'],
  ['🤢', 'Queasy'],
  ['🤯', 'Tense'],
];

const symptoms = ['Nausea', 'Back Pain', 'Fatigue', 'Swelling', 'Baby Kicks', 'Other'];

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function LogScreen() {
  const [selectedMood, setSelectedMood] = useState('Calm');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Nausea', 'Back Pain', 'Fatigue']);
  const [intensity, setIntensity] = useState(4);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom]
    );
  };

  const saveEntry = async () => {
    try {
      setSaving(true);

      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      const userId = userData.user?.id;

      if (!userId) {
        Alert.alert('Login needed', 'Please log in before saving your symptom entry.');
        return;
      }

      const { error } = await supabase.from('symptom_logs').insert({
        user_id: userId,
        mood: selectedMood,
        symptoms: selectedSymptoms,
        intensity,
        notes: notes.trim(),
      });

      if (error) throw error;

      Alert.alert('Entry saved', 'Your daily symptom log has been saved.');

      setNotes('');
    } catch {
      Alert.alert('Save failed', 'We could not save your symptom log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="Daily Log" />

      <Text style={styles.eyebrow}>TODAY’S FOCUS</Text>
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.date}>{getTodayLabel()}</Text>
      <Text style={styles.week}>Track your symptoms and mood today</Text>

      <Card style={styles.card}>
        <Text style={styles.section}>Current Mood</Text>

        <View style={styles.moodRow}>
          {moods.map(([emoji, label]) => {
            const active = selectedMood === label;

            return (
              <AnimatedPressable
                key={label}
                onPress={() => setSelectedMood(label)}
                style={[styles.mood, active && styles.moodActive]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
                <Text style={[styles.moodText, active && styles.moodActiveText]}>{label}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <Text style={styles.section}>Physical Symptoms</Text>

        <View style={styles.chips}>
          {symptoms.map((item) => {
            const active = selectedSymptoms.includes(item);

            return (
              <AnimatedPressable
                key={item}
                onPress={() => toggleSymptom(item)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipActiveText]}>{item}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <View style={styles.levelRow}>
          <Text style={styles.section}>Overall Intensity</Text>
          <Text style={styles.level}>Level {intensity}</Text>
        </View>

        <View style={styles.levelButtons}>
          {[1, 2, 3, 4, 5].map((level) => {
            const active = intensity === level;

            return (
              <AnimatedPressable
                key={level}
                onPress={() => setIntensity(level)}
                style={[styles.levelButton, active && styles.levelButtonActive]}
              >
                <Text style={[styles.levelButtonText, active && styles.levelButtonTextActive]}>
                  {level}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <View style={styles.slider}>
          <View style={[styles.sliderFill, { width: `${intensity * 20}%` }]} />
          <View style={[styles.knob, { left: `${intensity * 20 - 4}%` }]} />
        </View>

        <View style={styles.sliderLabels}>
          <Text style={styles.copy}>Mild</Text>
          <Text style={styles.copy}>Intense</Text>
        </View>

        <Text style={styles.section}>Additional Notes</Text>

        <TextInput
          multiline
          placeholder="How are you feeling today? Any specific symptoms or cravings?"
          placeholderTextColor={colors.muted}
          style={styles.notes}
          value={notes}
          onChangeText={setNotes}
        />
      </Card>

      <Card style={styles.suggested}>
        <Text style={styles.section}>Suggested for You</Text>
        <Text style={styles.strong}>10 min Gentle Back Stretch</Text>
      </Card>

      <Button
        label={saving ? 'Saving Entry...' : 'Save Entry'}
        style={{ marginTop: 18 }}
        onPress={saveEntry}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...type.section,
    color: colors.rose,
    marginTop: 24,
  },
  title: {
    ...type.title,
    color: colors.ink,
    marginTop: 6,
  },
  date: {
    ...type.bodyStrong,
    color: colors.ink,
    marginTop: 18,
  },
  week: {
    ...type.small,
    color: colors.text,
    marginTop: 4,
    marginBottom: 18,
  },
  card: {
    gap: 16,
  },
  section: {
    ...type.section,
    color: colors.rose,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mood: {
    flex: 1,
    minHeight: 78,
    borderRadius: 20,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodActive: {
    backgroundColor: colors.softSurface,
    borderColor: colors.blushDeep,
  },
  emoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  moodText: {
    ...type.tiny,
    color: colors.text,
  },
  moodActiveText: {
    color: colors.plum,
    fontWeight: '800',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: {
    backgroundColor: colors.plum,
  },
  chipText: {
    ...type.small,
    color: colors.text,
  },
  chipActiveText: {
    color: colors.surface,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  level: {
    ...type.small,
    color: colors.plum,
  },
  levelButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  levelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelButtonActive: {
    backgroundColor: colors.plum,
    borderColor: colors.plum,
  },
  levelButtonText: {
    ...type.bodyStrong,
    color: colors.text,
  },
  levelButtonTextActive: {
    color: colors.surface,
  },
  slider: {
    height: 10,
    borderRadius: 99,
    backgroundColor: colors.softSurface,
    overflow: 'visible',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: colors.plum,
  },
  knob: {
    position: 'absolute',
    top: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 5,
    borderColor: colors.plum,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  copy: {
    ...type.small,
    color: colors.text,
  },
  notes: {
    minHeight: 110,
    borderRadius: 22,
    padding: 16,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    ...type.body,
    textAlignVertical: 'top',
  },
  suggested: {
    marginTop: 18,
  },
  strong: {
    ...type.bodyStrong,
    color: colors.ink,
    marginTop: 8,
  },
});