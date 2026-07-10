import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type WeightEntry = {
  id: string;
  weight: string;
  date: string;
  note: string;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:weight-tracker';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateKey: string) {
  const parsed = new Date(`${dateKey}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return dateKey;

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function WeightTrackerScreen() {
  const { palette } = useAppTheme();

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(todayKey());
  const [note, setNote] = useState('');

  const latestEntry = entries[0] ?? null;

  const weightChange = useMemo(() => {
    if (entries.length < 2) return null;

    const latest = Number.parseFloat(entries[0].weight);
    const previous = Number.parseFloat(entries[1].weight);

    if (!Number.isFinite(latest) || !Number.isFinite(previous)) return null;

    const diff = latest - previous;
    const sign = diff > 0 ? '+' : '';

    return `${sign}${diff.toFixed(1)} kg`;
  }, [entries]);

  useEffect(() => {
    async function loadEntries() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setEntries(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Weight tracker load error:', error);
      }
    }

    void loadEntries();
  }, []);

  async function saveEntries(next: WeightEntry[]) {
    setEntries(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Weight tracker save error:', error);
    }
  }

  async function addEntry() {
    const cleanWeight = weight.trim();
    const cleanDate = date.trim();
    const parsedWeight = Number.parseFloat(cleanWeight);
    const parsedDate = new Date(`${cleanDate}T12:00:00`);

    if (!cleanWeight || !Number.isFinite(parsedWeight)) {
      Alert.alert('Add weight', 'Enter a valid weight number.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate) || Number.isNaN(parsedDate.getTime())) {
      Alert.alert('Check date', 'Use date format YYYY-MM-DD.');
      return;
    }

    const next: WeightEntry[] = [
      {
        id: String(Date.now()),
        weight: cleanWeight,
        date: cleanDate,
        note: note.trim(),
        createdAt: Date.now(),
      },
      ...entries,
    ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

    setWeight('');
    setDate(todayKey());
    setNote('');
    await saveEntries(next);
  }

  async function deleteEntry(id: string) {
    const next = entries.filter((entry) => entry.id !== id);
    await saveEntries(next);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>BODY TRACKING</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Weight Tracker</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Log weight gently and keep notes for your care conversations.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="scale-outline" size={30} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>LATEST ENTRY</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              {latestEntry ? `${latestEntry.weight} kg` : 'No weight yet'}
            </Text>
            <Text style={[styles.heroCopy, { color: palette.text }]}>
              {latestEntry ? `${formatDate(latestEntry.date)}${weightChange ? ` • ${weightChange}` : ''}` : 'Add your first entry below.'}
            </Text>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.fieldLabel, { color: palette.accent }]}>NEW ENTRY</Text>

          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder="Weight in kg"
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

          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={palette.muted}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

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
            <Text style={[styles.addButtonText, { color: palette.onAccent }]}>Save weight</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
          <Text style={[styles.noteText, { color: palette.text }]}>
            Weight changes during pregnancy vary. Use this as a personal log, not medical advice.
          </Text>
        </View>

        <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>WEIGHT HISTORY</Text>

          {entries.length ? (
            <View style={styles.entryList}>
              {entries.map((entry) => (
                <View
                  key={entry.id}
                  style={[styles.entryItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
                >
                  <View style={[styles.entryIcon, { backgroundColor: palette.accentSoft }]}>
                    <Ionicons name="scale-outline" size={20} color={palette.accent} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.entryWeight, { color: palette.ink }]}>
                      {entry.weight} kg
                    </Text>
                    <Text style={[styles.entryDate, { color: palette.text }]}>
                      {formatDate(entry.date)}
                    </Text>
                    {entry.note ? (
                      <Text style={[styles.entryNote, { color: palette.muted }]}>{entry.note}</Text>
                    ) : null}
                  </View>

                  <AnimatedPressable onPress={() => deleteEntry(entry.id)} style={styles.deleteButton}>
                    <Ionicons name="trash-outline" size={19} color={palette.danger} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: palette.text }]}>
              No weight entries yet.
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
  input: {
    minHeight: 54,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 10,
    ...type.bodyStrong,
    fontSize: 15,
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
    minHeight: 78,
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
  entryWeight: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
  },
  entryDate: {
    ...type.small,
    lineHeight: 18,
    marginTop: 2,
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
