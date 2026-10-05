import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type CareCategory = 'Test' | 'Scan' | 'Vaccine' | 'Other';
type FilterName = 'Upcoming' | 'Completed' | 'All';

type CareItem = {
  id: string;
  title: string;
  category: CareCategory;
  dueDate: string;
  note: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:care-schedule';

const categories: CareCategory[] = ['Test', 'Scan', 'Vaccine', 'Other'];
const filters: FilterName[] = ['Upcoming', 'Completed', 'All'];

const categoryIcons: Record<
  CareCategory,
  keyof typeof Ionicons.glyphMap
> = {
  Test: 'flask-outline',
  Scan: 'scan-outline',
  Vaccine: 'shield-checkmark-outline',
  Other: 'calendar-outline',
};

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime());
}

function formatDate(value: string) {
  if (!validDate(value)) return value;

  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function CareScheduleScreen() {
  const { palette } = useAppTheme();

  const [items, setItems] = useState<CareItem[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CareCategory>('Test');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState<FilterName>('Upcoming');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function loadItems() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Care schedule load error:', error);
      }
    }

    void loadItems();
  }, []);

  async function saveItems(next: CareItem[]) {
    setItems(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Care schedule save error:', error);
    }
  }

  async function addItem() {
    const cleanTitle = title.trim();
    const cleanDate = dueDate.trim();

    if (!cleanTitle) {
      Alert.alert('Add a title', 'Enter the name of the test, scan, or care item.');
      return;
    }

    if (!validDate(cleanDate)) {
      Alert.alert('Check the date', 'Enter the date as YYYY-MM-DD.');
      return;
    }

    const next: CareItem[] = [
      {
        id: String(Date.now()),
        title: cleanTitle,
        category,
        dueDate: cleanDate,
        note: note.trim(),
        completed: false,
        createdAt: Date.now(),
      },
      ...items,
    ];

    await saveItems(next);

    setTitle('');
    setCategory('Test');
    setDueDate('');
    setNote('');
    setShowForm(false);
    setFilter('Upcoming');
  }

  async function toggleComplete(id: string) {
    const next = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );

    await saveItems(next);
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete this item?', 'This care schedule item will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void saveItems(items.filter((item) => item.id !== id));
        },
      },
    ]);
  }

  const upcomingCount = useMemo(
    () => items.filter((item) => !item.completed).length,
    [items]
  );

  const completedCount = useMemo(
    () => items.filter((item) => item.completed).length,
    [items]
  );

  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      if (filter === 'Upcoming') return !item.completed;
      if (filter === 'Completed') return item.completed;
      return true;
    });

    return [...filtered].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [filter, items]);

  return (
    <Screen bottomSpace={140}>
      <Header title="" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          CARE ORGANISER
        </Text>

        <Text style={[styles.title, { color: palette.ink }]}>
          Care Schedule
        </Text>

        <Text style={[styles.subtitle, { color: palette.text }]}>
          Keep doctor-recommended tests, scans, vaccines, and care milestones
          in one place.
        </Text>
      </View>

      <View
        style={[
          styles.hero,
          {
            backgroundColor: palette.accent,
            borderColor: palette.accent,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="calendar-clear-outline"
              size={27}
              color={palette.accent}
            />
          </View>

          <AnimatedPressable
            onPress={() => setShowForm((current) => !current)}
            style={styles.addButton}
          >
            <Ionicons
              name={showForm ? 'close' : 'add'}
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.addButtonText}>
              {showForm ? 'Close' : 'Add item'}
            </Text>
          </AnimatedPressable>
        </View>

        <Text style={styles.heroTitle}>
          {upcomingCount} upcoming
        </Text>

        <Text style={styles.heroCopy}>
          {completedCount} completed • {items.length} total care items
        </Text>
      </View>

      {showForm ? (
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Text style={[styles.formTitle, { color: palette.ink }]}>
            New care item
          </Text>

          <Text style={[styles.label, { color: palette.text }]}>
            What is it?
          </Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Example: Anatomy scan"
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

          <Text style={[styles.label, { color: palette.text }]}>
            Category
          </Text>

          <View style={styles.categoryRow}>
            {categories.map((item) => {
              const active = category === item;

              return (
                <AnimatedPressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: active
                        ? palette.accent
                        : palette.canvas,
                      borderColor: active
                        ? palette.accent
                        : palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: active ? '#FFFFFF' : palette.ink },
                    ]}
                  >
                    {item}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <Text style={[styles.label, { color: palette.text }]}>
            Due date
          </Text>

          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={palette.muted}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            style={[
              styles.input,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <Text style={[styles.label, { color: palette.text }]}>
            Notes
          </Text>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Instructions or questions for your care team"
            placeholderTextColor={palette.muted}
            multiline
            style={[
              styles.input,
              styles.noteInput,
              {
                color: palette.ink,
                backgroundColor: palette.canvas,
                borderColor: palette.line,
              },
            ]}
          />

          <AnimatedPressable
            onPress={() => void addItem()}
            style={[
              styles.saveButton,
              { backgroundColor: palette.accent },
            ]}
          >
            <Text style={styles.saveButtonText}>Save care item</Text>
            <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
          </AnimatedPressable>
        </View>
      ) : null}

      <View style={styles.filterRow}>
        {filters.map((item) => {
          const active = filter === item;

          return (
            <AnimatedPressable
              key={item}
              onPress={() => setFilter(item)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: active
                    ? palette.accent
                    : palette.surface,
                  borderColor: active
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? '#FFFFFF' : palette.ink },
                ]}
              >
                {item}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={styles.sectionHeading}>
        <View>
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>
            {filter}
          </Text>

          <Text style={[styles.sectionCopy, { color: palette.text }]}>
            {visibleItems.length} items
          </Text>
        </View>
      </View>

      {visibleItems.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={30}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>
            Nothing here yet
          </Text>

          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Add an item recommended by your doctor or care team.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visibleItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.itemCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: item.completed
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <AnimatedPressable
                onPress={() => void toggleComplete(item.id)}
                style={[
                  styles.checkButton,
                  {
                    backgroundColor: item.completed
                      ? palette.accent
                      : palette.accentSoft,
                  },
                ]}
              >
                <Ionicons
                  name={
                    item.completed
                      ? 'checkmark'
                      : categoryIcons[item.category]
                  }
                  size={21}
                  color={item.completed ? '#FFFFFF' : palette.accent}
                />
              </AnimatedPressable>

              <View style={styles.itemContent}>
                <View style={styles.itemTop}>
                  <Text
                    style={[
                      styles.itemTitle,
                      {
                        color: palette.ink,
                        textDecorationLine: item.completed
                          ? 'line-through'
                          : 'none',
                      },
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text style={[styles.categoryLabel, { color: palette.accent }]}>
                    {item.category}
                  </Text>
                </View>

                <Text style={[styles.itemDate, { color: palette.text }]}>
                  {item.completed ? 'Completed' : 'Due'} •{' '}
                  {formatDate(item.dueDate)}
                </Text>

                {item.note ? (
                  <Text style={[styles.itemNote, { color: palette.muted }]}>
                    {item.note}
                  </Text>
                ) : null}
              </View>

              <AnimatedPressable
                onPress={() => confirmDelete(item.id)}
                style={styles.deleteButton}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={palette.muted}
                />
              </AnimatedPressable>
            </View>
          ))}
        </View>
      )}

      <View
        style={[
          styles.disclaimer,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={palette.accent}
        />

        <Text style={[styles.disclaimerText, { color: palette.text }]}>
          This organiser does not recommend a medical schedule. Only add care
          items and dates advised by your doctor or midwife.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    marginTop: 4,
    marginBottom: 20,
  },
  eyebrow: {
    ...type.section,
    marginBottom: 5,
  },
  title: {
    ...type.hero,
  },
  subtitle: {
    ...type.body,
    marginTop: 7,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  addButtonText: {
    ...type.small,
    color: '#FFFFFF',
  },
  heroTitle: {
    ...type.title,
    color: '#FFFFFF',
    marginTop: 20,
  },
  heroCopy: {
    ...type.small,
    color: 'rgba(255,255,255,0.86)',
    marginTop: 3,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 25,
    padding: 17,
    marginBottom: 20,
  },
  formTitle: {
    ...type.title,
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 14,
  },
  label: {
    ...type.small,
    marginTop: 11,
    marginBottom: 7,
  },
  input: {
    ...type.body,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  noteInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  categoryText: {
    ...type.small,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 17,
    paddingVertical: 15,
    marginTop: 18,
  },
  saveButtonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 11,
    alignItems: 'center',
  },
  filterText: {
    ...type.small,
  },
  sectionHeading: {
    marginBottom: 12,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
  },
  sectionCopy: {
    ...type.small,
    marginTop: 2,
  },
  list: {
    gap: 11,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    borderWidth: 1,
    borderRadius: 21,
    padding: 13,
  },
  checkButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    ...type.bodyStrong,
    flex: 1,
  },
  categoryLabel: {
    ...type.tiny,
    textTransform: 'uppercase',
  },
  itemDate: {
    ...type.small,
    marginTop: 4,
  },
  itemNote: {
    ...type.small,
    marginTop: 6,
  },
  deleteButton: {
    padding: 5,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...type.bodyStrong,
    marginTop: 13,
  },
  emptyCopy: {
    ...type.small,
    textAlign: 'center',
    marginTop: 4,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    marginTop: 22,
  },
  disclaimerText: {
    ...type.small,
    flex: 1,
  },
});
