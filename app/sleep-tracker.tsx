import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type SleepEntry = {
  id: string;
  hours: string;
  quality: number;
  symptom: string;
  note: string;
  date: string;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:sleep-tracker';

const symptoms = ['None', 'Back pain', 'Heartburn', 'Bathroom trips', 'Restless', 'Other'];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateKey: string) {
  const parsed = new Date(`${dateKey}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return dateKey;

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function SleepTrackerScreen() {
  const { palette } = useAppTheme();

  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [hours, setHours] = useState('');
  const [quality, setQuality] = useState(3);
  const [symptom, setSymptom] = useState('None');
  const [note, setNote] = useState('');

  const latestEntry = entries[0] ?? null;

  const averageHours = useMemo(() => {
    if (!entries.length) return 0;

    const valid = entries
      .map((entry) => Number.parseFloat(entry.hours))
      .filter((value) => Number.isFinite(value));

    if (!valid.length) return 0;

    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
  }, [entries]);

  const averageQuality = useMemo(() => {
    if (!entries.length) return 0;

    return Math.round(entries.reduce((sum, entry) => sum + entry.quality, 0) / entries.length);
  }, [entries]);

  useEffect(() => {
    async function loadEntries() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setEntries(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Sleep tracker load error:', error);
      }
    }

    void loadEntries();
  }, []);

  async function saveEntries(next: SleepEntry[]) {
    setEntries(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Sleep tracker save error:', error);
    }
  }

  async function addEntry() {
    const cleanHours = hours.trim();
    const parsedHours = Number.parseFloat(cleanHours);

    if (!cleanHours || !Number.isFinite(parsedHours)) {
      Alert.alert('Add sleep', 'Enter valid sleep hours.');
      return;
    }

    const next: SleepEntry[] = [
      {
        id: String(Date.now()),
        hours: cleanHours,
        quality,
        symptom,
        note: note.trim(),
        date: todayKey(),
        createdAt: Date.now(),
      },
      ...entries,
    ];

    setHours('');
    setQuality(3);
    setSymptom('None');
    setNote('');

    await saveEntries(next);
  }

  async function deleteEntry(id: string) {
    const next = entries.filter((entry) => entry.id !== id);
    await saveEntries(next);
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete sleep entry?', 'This sleep entry will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteEntry(id) },
    ]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>REST</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Sleep Tracker</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Log your sleep, quality, and night symptoms gently.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="moon-outline" size={30} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>LATEST SLEEP</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              {latestEntry ? `${latestEntry.hours} hours` : 'No sleep yet'}
            </Text>
            <Text style={[styles.heroCopy, { color: palette.text }]}>
              {entries.length ? `Average ${averageHours.toFixed(1)} hrs • Quality ${averageQuality}/5` : 'Add your first sleep entry below.'}
            </Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <Text style={[styles.summaryValue, { color: palette.ink }]}>{averageHours.toFixed(1)}</Text>
            <Text style={[styles.summaryLabel, { color: palette.text }]}>Avg hours</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <Text style={[styles.summaryValue, { color: palette.ink }]}>{averageQuality}/5</Text>
            <Text style={[styles.summaryLabel, { color: palette.text }]}>Avg quality</Text>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.fieldLabel, { color: palette.accent }]}>NEW SLEEP ENTRY</Text>

          <TextInput
            value={hours}
            onChangeText={setHours}
            placeholder="Hours slept"
            placeholderTextColor={palette.muted}
            keyboardType="decimal-pad"
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <Text style={[styles.chipLabel, { color: palette.text }]}>Sleep quality</Text>

          <View style={styles.scoreRow}>
            {[1, 2, 3, 4, 5].map((score) => {
              const active = score === quality;

              return (
                <AnimatedPressable
                  key={score}
                  onPress={() => setQuality(score)}
                  style={[
                    styles.scoreDot,
                    {
                      backgroundColor: active ? palette.accent : palette.canvas,
                      borderColor: active ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <Text style={[styles.scoreText, { color: active ? palette.onAccent : palette.text }]}>
                    {score}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text style={[styles.chipLabel, { color: palette.text }]}>Night symptom</Text>

          <View style={styles.symptomRow}>
            {symptoms.map((item) => {
              const active = item === symptom;

              return (
                <AnimatedPressable
                  key={item}
                  onPress={() => setSymptom(item)}
                  style={[
                    styles.symptomChip,
                    {
                      backgroundColor: active ? palette.accent : palette.canvas,
                      borderColor: active ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <Text style={[styles.symptomText, { color: active ? palette.onAccent : palette.ink }]}>
                    {item}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note"
            placeholderTextColor={palette.muted}
            multiline
            textAlignVertical="top"
            style={[
              styles.noteInput,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <AnimatedPressable
            onPress={addEntry}
            style={[styles.addButton, { backgroundColor: palette.accent }]}
          >
            <Ionicons name="add" size={20} color={palette.onAccent} />
            <Text style={[styles.addButtonText, { color: palette.onAccent }]}>Save sleep</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
          <Text style={[styles.noteText, { color: palette.text }]}>
            Sleep can change during pregnancy. Contact your care provider if symptoms feel worrying.
          </Text>
        </View>

        <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>SLEEP HISTORY</Text>

          {entries.length ? (
            <View style={styles.entryList}>
              {entries.map((entry) => (
                <View
                  key={entry.id}
                  style={[styles.entryItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
                >
                  <View style={[styles.entryIcon, { backgroundColor: palette.accentSoft }]}>
                    <Ionicons name="moon-outline" size={20} color={palette.accent} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryTitle, { color: palette.ink }]}>
                      {entry.hours} hours
                    </Text>
                    <Text style={[styles.entryMeta, { color: palette.text }]}>
                      {formatDate(entry.date)} • Quality {entry.quality}/5 • {entry.symptom}
                    </Text>

                    {entry.note ? (
                      <Text style={[styles.entryNote, { color: palette.muted }]}>{entry.note}</Text>
                    ) : null}
                  </View>

                  <AnimatedPressable onPress={() => confirmDelete(entry.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={19} color={palette.danger} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: palette.text }]}>
              No sleep entries yet.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    marginTop: 18,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '800',
  },
  heroCard: {
    minHeight: 116,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.1,
  },
  heroTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    lineHeight: 27,
    marginTop: 5,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: 15,
  },
  summaryValue: {
    ...type.bodyStrong,
    fontSize: 24,
    lineHeight: 29,
  },
  summaryLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginTop: 3,
  },
  formCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    ...type.section,
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 14,
    ...type.bodyStrong,
    fontSize: 15,
  },
  chipLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  scoreDot: {
    width: 42,
    height: 42,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    ...type.small,
    fontWeight: '900',
  },
  symptomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  symptomChip: {
    minHeight: 40,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomText: {
    ...type.tiny,
    fontWeight: '900',
  },
  noteInput: {
    minHeight: 90,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    ...type.bodyStrong,
    fontSize: 15,
    lineHeight: 22,
  },
  addButton: {
    minHeight: 52,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  noteCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
    fontWeight: '800',
  },
  listCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  entryList: {
    gap: 10,
    marginTop: 14,
  },
  entryItem: {
    minHeight: 82,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
  },
  entryMeta: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 3,
    fontWeight: '800',
  },
  entryNote: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 5,
    fontWeight: '800',
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...type.small,
    lineHeight: 20,
    marginTop: 14,
    fontWeight: '800',
  },
});
