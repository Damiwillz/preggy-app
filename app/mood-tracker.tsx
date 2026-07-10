import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type MoodEntry = {
  id: string;
  mood: string;
  energy: number;
  stress: number;
  sleep: number;
  note: string;
  date: string;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:mood-tracker';

const moods = [
  { label: 'Calm', icon: 'leaf-outline' },
  { label: 'Happy', icon: 'happy-outline' },
  { label: 'Tired', icon: 'moon-outline' },
  { label: 'Anxious', icon: 'rainy-outline' },
  { label: 'Emotional', icon: 'heart-outline' },
] as const;

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

function ScoreSelector({
  title,
  value,
  onChange,
}: {
  title: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={styles.scoreBlock}>
      <Text style={[styles.scoreTitle, { color: palette.text }]}>{title}</Text>

      <View style={styles.scoreRow}>
        {[1, 2, 3, 4, 5].map((score) => {
          const active = score === value;

          return (
            <AnimatedPressable
              key={score}
              onPress={() => onChange(score)}
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
    </View>
  );
}

export default function MoodTrackerScreen() {
  const { palette } = useAppTheme();

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [mood, setMood] = useState('Calm');
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [note, setNote] = useState('');

  const latestEntry = entries[0] ?? null;

  const averageEnergy = useMemo(() => {
    if (!entries.length) return 0;
    return Math.round(entries.reduce((sum, item) => sum + item.energy, 0) / entries.length);
  }, [entries]);

  useEffect(() => {
    async function loadEntries() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setEntries(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Mood tracker load error:', error);
      }
    }

    void loadEntries();
  }, []);

  async function saveEntries(next: MoodEntry[]) {
    setEntries(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Mood tracker save error:', error);
    }
  }

  async function addEntry() {
    const cleanNote = note.trim();

    const next: MoodEntry[] = [
      {
        id: String(Date.now()),
        mood,
        energy,
        stress,
        sleep,
        note: cleanNote,
        date: todayKey(),
        createdAt: Date.now(),
      },
      ...entries,
    ];

    setMood('Calm');
    setEnergy(3);
    setStress(3);
    setSleep(3);
    setNote('');

    await saveEntries(next);
  }

  async function deleteEntry(id: string) {
    const next = entries.filter((entry) => entry.id !== id);
    await saveEntries(next);
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete mood entry?', 'This mood entry will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteEntry(id) },
    ]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>WELLNESS</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Mood Tracker</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Check in with your mood, energy, stress, and sleep.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="happy-outline" size={30} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>LATEST MOOD</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              {latestEntry ? latestEntry.mood : 'No check-in yet'}
            </Text>
            <Text style={[styles.heroCopy, { color: palette.text }]}>
              {entries.length ? `${entries.length} entries • Energy average ${averageEnergy}/5` : 'Add your first mood check-in below.'}
            </Text>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.fieldLabel, { color: palette.accent }]}>HOW DO YOU FEEL?</Text>

          <View style={styles.moodRow}>
            {moods.map((item) => {
              const active = item.label === mood;

              return (
                <AnimatedPressable
                  key={item.label}
                  onPress={() => setMood(item.label)}
                  style={[
                    styles.moodChip,
                    {
                      backgroundColor: active ? palette.accent : palette.canvas,
                      borderColor: active ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={17}
                    color={active ? palette.onAccent : palette.accent}
                  />
                  <Text style={[styles.moodText, { color: active ? palette.onAccent : palette.ink }]}>
                    {item.label}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <ScoreSelector title="Energy" value={energy} onChange={setEnergy} />
          <ScoreSelector title="Stress" value={stress} onChange={setStress} />
          <ScoreSelector title="Sleep quality" value={sleep} onChange={setSleep} />

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
            <Text style={[styles.addButtonText, { color: palette.onAccent }]}>Save mood</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>MOOD HISTORY</Text>

          {entries.length ? (
            <View style={styles.entryList}>
              {entries.map((entry) => (
                <View
                  key={entry.id}
                  style={[styles.entryItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
                >
                  <View style={[styles.entryIcon, { backgroundColor: palette.accentSoft }]}>
                    <Ionicons name="heart-outline" size={20} color={palette.accent} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryMood, { color: palette.ink }]}>
                      {entry.mood}
                    </Text>
                    <Text style={[styles.entryMeta, { color: palette.text }]}>
                      {formatDate(entry.date)} • Energy {entry.energy}/5 • Stress {entry.stress}/5 • Sleep {entry.sleep}/5
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
              No mood entries yet.
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
    marginBottom: 16,
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
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  moodChip: {
    minHeight: 40,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moodText: {
    ...type.tiny,
    fontWeight: '900',
  },
  scoreBlock: {
    marginBottom: 14,
  },
  scoreTitle: {
    ...type.tiny,
    fontWeight: '900',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
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
  noteInput: {
    minHeight: 96,
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
  entryMood: {
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
