import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type CravingCategory = 'Sweet' | 'Salty' | 'Spicy' | 'Sour' | 'Savory' | 'Other';

type CravingEntry = {
  id: string;
  title: string;
  category: CravingCategory;
  intensity: number;
  note: string;
  favorite: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:cravings-tracker';

const categories: CravingCategory[] = ['Sweet', 'Salty', 'Spicy', 'Sour', 'Savory', 'Other'];

function formatDate(value: number) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function categoryIcon(category: CravingCategory): keyof typeof Ionicons.glyphMap {
  switch (category) {
    case 'Sweet':
      return 'ice-cream-outline';
    case 'Salty':
      return 'fast-food-outline';
    case 'Spicy':
      return 'flame-outline';
    case 'Sour':
      return 'nutrition-outline';
    case 'Savory':
      return 'restaurant-outline';
    default:
      return 'sparkles-outline';
  }
}

export default function CravingsTrackerScreen() {
  const { palette } = useAppTheme();

  const [entries, setEntries] = useState<CravingEntry[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CravingCategory>('Sweet');
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState('');

  const favoriteCount = useMemo(() => entries.filter((item) => item.favorite).length, [entries]);

  const topCategory = useMemo(() => {
    if (!entries.length) return 'None yet';

    const counts = entries.reduce<Record<string, number>>((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None yet';
  }, [entries]);

  useEffect(() => {
    async function loadEntries() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        setEntries(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Cravings tracker load error:', error);
      }
    }

    void loadEntries();
  }, []);

  async function saveEntries(next: CravingEntry[]) {
    setEntries(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Cravings tracker save error:', error);
    }
  }

  async function addCraving() {
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      Alert.alert('Add craving', 'Type what you are craving before saving.');
      return;
    }

    const next: CravingEntry[] = [
      {
        id: String(Date.now()),
        title: cleanTitle,
        category,
        intensity,
        note: note.trim(),
        favorite: false,
        createdAt: Date.now(),
      },
      ...entries,
    ];

    setTitle('');
    setCategory('Sweet');
    setIntensity(3);
    setNote('');

    await saveEntries(next);
  }

  async function toggleFavorite(id: string) {
    const next = entries.map((item) =>
      item.id === id ? { ...item, favorite: !item.favorite } : item
    );

    await saveEntries(next);
  }

  async function deleteCraving(id: string) {
    const next = entries.filter((item) => item.id !== id);
    await saveEntries(next);
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete craving?', 'This craving entry will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteCraving(id) },
    ]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topRow}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGNANCY NOTES</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Cravings Tracker</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Save cravings, intensity, and little notes about what sounds good.
          </Text>
        </View>

        <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="restaurant-outline" size={30} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>CRAVING SUMMARY</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              {entries.length} saved cravings
            </Text>
            <Text style={[styles.heroCopy, { color: palette.text }]}>
              Top category: {topCategory} • {favoriteCount} favorites
            </Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <Text style={[styles.summaryValue, { color: palette.ink }]}>{entries.length}</Text>
            <Text style={[styles.summaryLabel, { color: palette.text }]}>Total</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <Text style={[styles.summaryValue, { color: palette.ink }]}>{favoriteCount}</Text>
            <Text style={[styles.summaryLabel, { color: palette.text }]}>Favorites</Text>
          </View>
        </View>

        <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.fieldLabel, { color: palette.accent }]}>NEW CRAVING</Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What are you craving?"
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <Text style={[styles.chipLabel, { color: palette.text }]}>Category</Text>

          <View style={styles.categoryRow}>
            {categories.map((item) => {
              const active = item === category;

              return (
                <AnimatedPressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: active ? palette.accent : palette.canvas,
                      borderColor: active ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <Ionicons
                    name={categoryIcon(item)}
                    size={16}
                    color={active ? palette.onAccent : palette.accent}
                  />
                  <Text style={[styles.categoryText, { color: active ? palette.onAccent : palette.ink }]}>
                    {item}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text style={[styles.chipLabel, { color: palette.text }]}>Intensity</Text>

          <View style={styles.intensityRow}>
            {[1, 2, 3, 4, 5].map((score) => {
              const active = score === intensity;

              return (
                <AnimatedPressable
                  key={score}
                  onPress={() => setIntensity(score)}
                  style={[
                    styles.intensityDot,
                    {
                      backgroundColor: active ? palette.accent : palette.canvas,
                      borderColor: active ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <Text style={[styles.intensityText, { color: active ? palette.onAccent : palette.text }]}>
                    {score}
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
            onPress={addCraving}
            style={[styles.addButton, { backgroundColor: palette.accent }]}
          >
            <Ionicons name="add" size={20} color={palette.onAccent} />
            <Text style={[styles.addButtonText, { color: palette.onAccent }]}>Save craving</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
          <Text style={[styles.noteText, { color: palette.text }]}>
            Cravings are common. Contact your care provider if you crave non-food items or feel concerned.
          </Text>
        </View>

        <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>CRAVING HISTORY</Text>

          {entries.length ? (
            <View style={styles.entryList}>
              {entries.map((entry) => (
                <View
                  key={entry.id}
                  style={[styles.entryItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
                >
                  <View style={[styles.entryIcon, { backgroundColor: palette.accentSoft }]}>
                    <Ionicons name={categoryIcon(entry.category)} size={20} color={palette.accent} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.entryTop}>
                      <Text style={[styles.entryTitle, { color: palette.ink }]}>{entry.title}</Text>

                      <View style={[styles.categoryBadge, { backgroundColor: palette.accentSoft }]}>
                        <Text style={[styles.categoryBadgeText, { color: palette.accent }]}>
                          {entry.category}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.entryMeta, { color: palette.text }]}>
                      {formatDate(entry.createdAt)} • Intensity {entry.intensity}/5
                    </Text>

                    {entry.note ? (
                      <Text style={[styles.entryNote, { color: palette.muted }]}>{entry.note}</Text>
                    ) : null}
                  </View>

                  <View style={styles.sideActions}>
                    <AnimatedPressable
                      onPress={() => toggleFavorite(entry.id)}
                      style={[
                        styles.iconButton,
                        { backgroundColor: entry.favorite ? palette.accentSoft : palette.surface },
                      ]}
                    >
                      <Ionicons
                        name={entry.favorite ? 'heart' : 'heart-outline'}
                        size={19}
                        color={entry.favorite ? palette.accent : palette.muted}
                      />
                    </AnimatedPressable>

                    <AnimatedPressable onPress={() => confirmDelete(entry.id)} style={styles.iconButton}>
                      <Ionicons name="trash-outline" size={19} color={palette.danger} />
                    </AnimatedPressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: palette.text }]}>
              No cravings saved yet.
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
    ...type.title,
    fontSize: 28,
    lineHeight: 32,
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
    marginBottom: 13,
    ...type.bodyStrong,
    fontSize: 15,
  },
  chipLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginBottom: 8,
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  categoryChip: {
    minHeight: 40,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    ...type.tiny,
    fontWeight: '900',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  intensityDot: {
    width: 42,
    height: 42,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityText: {
    ...type.small,
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
    minHeight: 88,
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
  entryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  entryTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
  },
  categoryBadge: {
    minHeight: 25,
    borderRadius: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  categoryBadgeText: {
    ...type.tiny,
    fontWeight: '900',
  },
  entryMeta: {
    ...type.small,
    lineHeight: 18,
    marginTop: 3,
    fontWeight: '800',
  },
  entryNote: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 5,
    fontWeight: '800',
  },
  sideActions: {
    gap: 6,
  },
  iconButton: {
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
