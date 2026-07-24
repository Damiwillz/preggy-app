import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type ShowerCategory = 'Guests' | 'Food' | 'Decor' | 'Games' | 'Gifts' | 'Thank You';

type ShowerTask = {
  id: string;
  title: string;
  category: ShowerCategory;
  done: boolean;
  createdAt: number;
};

type ShowerDetails = {
  date: string;
  location: string;
  host: string;
  theme: string;
  guestCount: string;
};

const TASKS_KEY = 'preggy:baby-shower-tasks';
const DETAILS_KEY = 'preggy:baby-shower-details';

const categories: ShowerCategory[] = ['Guests', 'Food', 'Decor', 'Games', 'Gifts', 'Thank You'];

const starterTasks: Array<{ title: string; category: ShowerCategory }> = [
  { title: 'Choose baby shower date', category: 'Guests' },
  { title: 'Create guest list', category: 'Guests' },
  { title: 'Pick theme colors', category: 'Decor' },
  { title: 'Plan simple games', category: 'Games' },
  { title: 'Track gifts received', category: 'Gifts' },
];

function parseTasks(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ShowerTask[]) : [];
  } catch {
    return [];
  }
}

function parseDetails(raw: string | null): ShowerDetails {
  try {
    const parsed = raw ? JSON.parse(raw) : null;

    return {
      date: typeof parsed?.date === 'string' ? parsed.date : '',
      location: typeof parsed?.location === 'string' ? parsed.location : '',
      host: typeof parsed?.host === 'string' ? parsed.host : '',
      theme: typeof parsed?.theme === 'string' ? parsed.theme : '',
      guestCount: typeof parsed?.guestCount === 'string' ? parsed.guestCount : '',
    };
  } catch {
    return {
      date: '',
      location: '',
      host: '',
      theme: '',
      guestCount: '',
    };
  }
}

function createTask(title: string, category: ShowerCategory): ShowerTask {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    category,
    done: false,
    createdAt: Date.now(),
  };
}

function parseDateInput(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue || !/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) {
    return null;
  }

  const date = new Date(`${cleanValue}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(value: string) {
  const date = parseDateInput(value);

  if (!date) return '--';

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.ceil((end - start) / 86400000);

  if (diff === 0) return 'Today';
  if (diff > 0) return `${diff} days`;

  return 'Passed';
}

export default function BabyShowerPlannerScreen() {
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [tasks, setTasks] = useState<ShowerTask[]>([]);
  const [details, setDetails] = useState<ShowerDetails>({
    date: '',
    location: '',
    host: '',
    theme: '',
    guestCount: '',
  });
  const [taskTitle, setTaskTitle] = useState('');
  const [category, setCategory] = useState<ShowerCategory>('Guests');

  useEffect(() => {
    async function loadPlanner() {
      try {
        const [savedTasks, savedDetails] = await Promise.all([
          AsyncStorage.getItem(TASKS_KEY),
          AsyncStorage.getItem(DETAILS_KEY),
        ]);

        setTasks(parseTasks(savedTasks));
        setDetails(parseDetails(savedDetails));
      } catch (error) {
        console.log('Baby shower load error:', error);
      }
    }

    void loadPlanner();
  }, []);

  const completedCount = tasks.filter((task) => task.done).length;
  const openCount = tasks.length - completedCount;

  function updateDetails(key: keyof ShowerDetails, value: string) {
    setDetails((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveDetails() {
    try {
      await AsyncStorage.setItem(DETAILS_KEY, JSON.stringify(details));
      Alert.alert('Saved', 'Baby shower details saved.');
    } catch (error) {
      console.log('Baby shower details save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  async function saveTasks(nextTasks: ShowerTask[]) {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(nextTasks));
    } catch (error) {
      console.log('Baby shower task save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  function addTask() {
    const cleanTitle = taskTitle.trim();

    if (!cleanTitle) {
      Alert.alert('Add a task', 'Type what needs to be done first.');
      return;
    }

    const nextTasks = [createTask(cleanTitle, category), ...tasks];

    setTasks(nextTasks);
    void saveTasks(nextTasks);
    setTaskTitle('');
  }

  function addStarterTask(task: { title: string; category: ShowerCategory }) {
    const nextTasks = [createTask(task.title, task.category), ...tasks];

    setTasks(nextTasks);
    void saveTasks(nextTasks);
  }

  function toggleTask(taskId: string) {
    const nextTasks = tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task));

    setTasks(nextTasks);
    void saveTasks(nextTasks);
  }

  function removeTask(taskId: string) {
    Alert.alert('Remove task?', 'This will remove it from your shower planner.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const nextTasks = tasks.filter((task) => task.id !== taskId);
          setTasks(nextTasks);
          void saveTasks(nextTasks);
        },
      },
    ]);
  }

  return (
    <Screen>
      <Header title="Baby Shower" back />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="balloon-outline" size={26} color={palette.accent} />
        </View>

        <Text style={styles.eyebrow}>PLANNING</Text>
        <Text style={styles.title}>Baby shower planner</Text>
        <Text style={styles.copy}>Plan the date, theme, guest count, and all the little party tasks.</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{daysUntil(details.date)}</Text>
          <Text style={styles.summaryLabel}>until shower</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{openCount}</Text>
          <Text style={styles.summaryLabel}>open tasks</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>done</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Shower details</Text>

        <TextInput
          value={details.date}
          onChangeText={(value) => updateDetails('date', value)}
          placeholder="Date, example 2026-09-12"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={details.location}
          onChangeText={(value) => updateDetails('location', value)}
          placeholder="Location"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={details.host}
          onChangeText={(value) => updateDetails('host', value)}
          placeholder="Host"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={details.theme}
          onChangeText={(value) => updateDetails('theme', value)}
          placeholder="Theme or color idea"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={details.guestCount}
          onChangeText={(value) => updateDetails('guestCount', value)}
          placeholder="Guest count"
          placeholderTextColor={palette.muted}
          keyboardType="number-pad"
          style={styles.input}
        />

        <AnimatedPressable onPress={saveDetails} style={styles.primaryButton}>
          <Ionicons name="save-outline" size={20} color={palette.onAccent} />
          <Text style={styles.primaryButtonText}>Save details</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add task</Text>

        <TextInput
          value={taskTitle}
          onChangeText={setTaskTitle}
          placeholder="Task name"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <View style={styles.chips}>
          {categories.map((currentCategory) => {
            const active = currentCategory === category;

            return (
              <AnimatedPressable
                key={currentCategory}
                onPress={() => setCategory(currentCategory)}
                style={[styles.chip, active && styles.activeChip]}
              >
                <Text style={[styles.chipText, active && styles.activeChipText]}>{currentCategory}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        <AnimatedPressable onPress={addTask} style={styles.primaryButton}>
          <Ionicons name="add-outline" size={20} color={palette.onAccent} />
          <Text style={styles.primaryButtonText}>Add task</Text>
        </AnimatedPressable>
      </View>

      <Text style={styles.sectionLabel}>QUICK START</Text>

      <View style={styles.starterGrid}>
        {starterTasks.map((task) => (
          <AnimatedPressable key={task.title} onPress={() => addStarterTask(task)} style={styles.starterCard}>
            <Text style={styles.starterName}>{task.title}</Text>
            <Text style={styles.starterCategory}>{task.category}</Text>
          </AnimatedPressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>YOUR CHECKLIST</Text>

      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="sparkles-outline" size={30} color={palette.accent} />
          <Text style={styles.emptyTitle}>No shower tasks yet</Text>
          <Text style={styles.emptyCopy}>Add your first task above or tap a quick-start card.</Text>
        </View>
      ) : (
        tasks.map((task) => (
          <View key={task.id} style={styles.taskCard}>
            <AnimatedPressable onPress={() => toggleTask(task.id)} style={styles.checkButton}>
              <Ionicons
                name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={27}
                color={task.done ? palette.accent : palette.muted}
              />
            </AnimatedPressable>

            <View style={styles.taskContent}>
              <Text style={[styles.taskTitle, task.done && styles.doneText]}>{task.title}</Text>
              <Text style={styles.taskMeta}>{task.category}</Text>
            </View>

            <AnimatedPressable onPress={() => removeTask(task.id)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={18} color={palette.muted} />
            </AnimatedPressable>
          </View>
        ))
      )}
    </Screen>
  );
}

type AppPalette = ReturnType<typeof useAppTheme>['palette'];

function createStyles(palette: AppPalette) {
  return StyleSheet.create({
    hero: {
      borderRadius: 30,
      padding: 22,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginTop: 12,
      marginBottom: 14,
    },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.accentSoft,
      marginBottom: 16,
    },
    eyebrow: {
      ...type.section,
      color: palette.accent,
      marginBottom: 4,
    },
    title: {
      ...type.title,
      color: palette.ink,
    },
    copy: {
      ...type.body,
      color: palette.text,
      marginTop: 8,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 22,
      padding: 14,
      backgroundColor: palette.accentSoft,
      borderWidth: 1,
      borderColor: palette.line,
    },
    summaryValue: {
      ...type.bodyStrong,
      color: palette.ink,
      fontSize: 18,
    },
    summaryLabel: {
      ...type.tiny,
      color: palette.text,
      marginTop: 4,
      textTransform: 'uppercase',
    },
    card: {
      borderRadius: 28,
      padding: 18,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginBottom: 16,
    },
    cardTitle: {
      ...type.bodyStrong,
      color: palette.ink,
      marginBottom: 12,
      fontSize: 18,
    },
    input: {
      ...type.body,
      color: palette.ink,
      minHeight: 54,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.line,
      backgroundColor: palette.canvas,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    chip: {
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
      backgroundColor: palette.canvas,
      borderWidth: 1,
      borderColor: palette.line,
    },
    activeChip: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    chipText: {
      ...type.small,
      color: palette.text,
    },
    activeChipText: {
      color: palette.onAccent,
    },
    primaryButton: {
      minHeight: 56,
      borderRadius: 20,
      backgroundColor: palette.accent,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    primaryButtonText: {
      ...type.bodyStrong,
      color: palette.onAccent,
    },
    sectionLabel: {
      ...type.section,
      color: palette.accent,
      marginBottom: 10,
      marginTop: 4,
    },
    starterGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    starterCard: {
      width: '48%',
      borderRadius: 22,
      padding: 14,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    starterName: {
      ...type.small,
      color: palette.ink,
    },
    starterCategory: {
      ...type.tiny,
      color: palette.accent,
      marginTop: 6,
      textTransform: 'uppercase',
    },
    emptyCard: {
      borderRadius: 28,
      padding: 24,
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    emptyTitle: {
      ...type.bodyStrong,
      color: palette.ink,
      marginTop: 12,
    },
    emptyCopy: {
      ...type.small,
      color: palette.text,
      textAlign: 'center',
      marginTop: 4,
    },
    taskCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 22,
      padding: 14,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
      marginBottom: 10,
    },
    checkButton: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    taskContent: {
      flex: 1,
    },
    taskTitle: {
      ...type.bodyStrong,
      color: palette.ink,
    },
    doneText: {
      textDecorationLine: 'line-through',
      color: palette.muted,
    },
    taskMeta: {
      ...type.tiny,
      color: palette.text,
      marginTop: 3,
      textTransform: 'uppercase',
    },
    deleteButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.canvas,
    },
  });
}
