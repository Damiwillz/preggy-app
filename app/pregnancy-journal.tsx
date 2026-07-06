import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type JournalEntry = {
  id: string;
  mood: string;
  note: string;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:pregnancy-journal';

const moods = [
  { key: 'Calm', icon: 'leaf-outline' },
  { key: 'Happy', icon: 'happy-outline' },
  { key: 'Tired', icon: 'moon-outline' },
  { key: 'Emotional', icon: 'heart-outline' },
  { key: 'Anxious', icon: 'rainy-outline' },
] as const;

function formatEntryDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function PregnancyJournalScreen() {
  const { palette } = useAppTheme();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [mood, setMood] = useState('Calm');
  const [note, setNote] = useState('');

  const totalEntries = entries.length;
  const latestMood = entries[0]?.mood ?? mood;

  useEffect(() => {
    async function loadEntries() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setEntries(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Pregnancy journal load error:', error);
      }
    }

    void loadEntries();
  }, []);

  async function saveEntries(next: JournalEntry[]) {
    setEntries(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Pregnancy journal save error:', error);
    }
  }

  async function addEntry() {
    const clean = note.trim();

    if (!clean) {
      Alert.alert('Write a note', 'Add a short journal note before saving.');
      return;
    }

    const next: JournalEntry[] = [
      {
        id: String(Date.now()),
        mood,
        note: clean,
        createdAt: Date.now(),
      },
      ...entries,
    ];

    setNote('');
    await saveEntries(next);
  }

  async function deleteEntry(id: string) {
    const next = entries.filter((entry) => entry.id !== id);
    await saveEntries(next);
  }

  const selectedMood = useMemo(
    () => moods.find((item) => item.key === mood) ?? moods[0],
    [mood]
  );

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>MEMORIES</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Pregnancy Journal</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Save thoughts, feelings, questions, and little moments from your journey.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.heroLabel, { color: palette.onAccent }]}>JOURNAL SUMMARY</Text>
              <Text style={[styles.heroTitle, { color: palette.onAccent }]}>
                {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'}
              </Text>
            </View>

            <View style={styles.heroIcon}>
              <Ionicons name="book-outline" size={31} color={palette.onAccent} />
            </View>
          </View>

          <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
            Latest mood: {latestMood}
          </Text>
        </View>

        <View style={[styles.editorCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.fieldLabel, { color: palette.accent }]}>HOW ARE YOU FEELING?</Text>

          <View style={styles.moodRow}>
            {moods.map((item) => {
              const active = item.key === mood;

              return (
                <AnimatedPressable
                  key={item.key}
                  onPress={() => setMood(item.key)}
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
                    {item.key}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <View style={styles.noteHeader}>
            <View style={[styles.noteIcon, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name={selectedMood.icon} size={22} color={palette.accent} />
            </View>

            <Text style={[styles.noteHeaderText, { color: palette.ink }]}>
              Today feels {mood.toLowerCase()}
            </Text>
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Write a memory, feeling, question, or moment..."
            placeholderTextColor={palette.muted}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <AnimatedPressable
            onPress={addEntry}
            style={[styles.saveButton, { backgroundColor: palette.accent, borderColor: palette.accent }]}
          >
            <Ionicons name="add" size={20} color={palette.onAccent} />
            <Text style={[styles.saveButtonText, { color: palette.onAccent }]}>Save journal entry</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.entriesCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={styles.entriesHeader}>
            <View>
              <Text style={[styles.eyebrow, { color: palette.accent }]}>SAVED NOTES</Text>
              <Text style={[styles.entriesTitle, { color: palette.ink }]}>Recent entries</Text>
            </View>
          </View>

          {entries.length ? (
            <View style={styles.entryList}>
              {entries.map((entry) => (
                <View
                  key={entry.id}
                  style={[styles.entryItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
                >
                  <View style={styles.entryTop}>
                    <View style={[styles.entryMood, { backgroundColor: palette.accentSoft }]}>
                      <Text style={[styles.entryMoodText, { color: palette.accent }]}>{entry.mood}</Text>
                    </View>

                    <Text style={[styles.entryDate, { color: palette.muted }]}>
                      {formatEntryDate(entry.createdAt)}
                    </Text>
                  </View>

                  <Text style={[styles.entryNote, { color: palette.ink }]}>{entry.note}</Text>

                  <AnimatedPressable
                    onPress={() => deleteEntry(entry.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={18} color={palette.danger} />
                    <Text style={[styles.deleteText, { color: palette.danger }]}>Delete</Text>
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: palette.text }]}>
              No journal entries yet.
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
    minHeight: 174,
    borderRadius: 34,
    borderWidth: 1,
    padding: 22,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  heroTitle: {
    ...type.title,
    fontSize: 34,
    lineHeight: 39,
    marginTop: 6,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '900',
    opacity: 0.92,
  },
  editorCard: {
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
    marginBottom: 14,
  },
  moodChip: {
    minHeight: 42,
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
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  noteIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteHeaderText: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  input: {
    minHeight: 132,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    ...type.bodyStrong,
    fontSize: 15,
    lineHeight: 22,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  entriesCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  entriesHeader: {
    marginBottom: 14,
  },
  entriesTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    marginTop: 5,
  },
  entryList: {
    gap: 10,
  },
  entryItem: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
  },
  entryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  entryMood: {
    minHeight: 32,
    borderRadius: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryMoodText: {
    ...type.tiny,
    fontWeight: '900',
  },
  entryDate: {
    ...type.tiny,
    fontWeight: '800',
  },
  entryNote: {
    ...type.small,
    lineHeight: 21,
    fontWeight: '800',
  },
  deleteButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    minHeight: 34,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteText: {
    ...type.tiny,
    fontWeight: '900',
  },
  emptyText: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '800',
  },
});
