import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type NurseryZone = 'Sleep' | 'Changing' | 'Feeding' | 'Storage' | 'Clothes' | 'Other';

type NurseryTask = {
  id: string;
  title: string;
  zone: NurseryZone;
  done: boolean;
  createdAt: number;
};

type NurseryDetails = {
  theme: string;
  room: string;
  colors: string;
  notes: string;
};

const TASKS_KEY = 'preggy:nursery-tasks';
const DETAILS_KEY = 'preggy:nursery-details';

const zones: NurseryZone[] = ['Sleep', 'Changing', 'Feeding', 'Storage', 'Clothes', 'Other'];

const starterTasks: Array<{ title: string; zone: NurseryZone }> = [
  { title: 'Choose nursery theme', zone: 'Other' },
  { title: 'Set up baby sleep area', zone: 'Sleep' },
  { title: 'Prepare changing station', zone: 'Changing' },
  { title: 'Organize baby clothes', zone: 'Clothes' },
  { title: 'Create feeding corner', zone: 'Feeding' },
];

function parseTasks(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as NurseryTask[]) : [];
  } catch {
    return [];
  }
}

function parseDetails(raw: string | null): NurseryDetails {
  try {
    const parsed = raw ? JSON.parse(raw) : null;

    return {
      theme: typeof parsed?.theme === 'string' ? parsed.theme : '',
      room: typeof parsed?.room === 'string' ? parsed.room : '',
      colors: typeof parsed?.colors === 'string' ? parsed.colors : '',
      notes: typeof parsed?.notes === 'string' ? parsed.notes : '',
    };
  } catch {
    return {
      theme: '',
      room: '',
      colors: '',
      notes: '',
    };
  }
}

function createTask(title: string, zone: NurseryZone): NurseryTask {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    zone,
    done: false,
    createdAt: Date.now(),
  };
}

export default function NurseryPlannerScreen() {
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [tasks, setTasks] = useState<NurseryTask[]>([]);
  const [details, setDetails] = useState<NurseryDetails>({
    theme: '',
    room: '',
    colors: '',
    notes: '',
  });
  const [taskTitle, setTaskTitle] = useState('');
  const [zone, setZone] = useState<NurseryZone>('Sleep');

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
        console.log('Nursery planner load error:', error);
      }
    }

    void loadPlanner();
  }, []);

  const readyCount = tasks.filter((task) => task.done).length;
  const openCount = tasks.length - readyCount;

  function updateDetails(key: keyof NurseryDetails, value: string) {
    setDetails((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveDetails() {
    try {
      await AsyncStorage.setItem(DETAILS_KEY, JSON.stringify(details));
      Alert.alert('Saved', 'Nursery details saved.');
    } catch (error) {
      console.log('Nursery details save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  async function saveTasks(nextTasks: NurseryTask[]) {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(nextTasks));
    } catch (error) {
      console.log('Nursery task save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  function addTask() {
    const cleanTitle = taskTitle.trim();

    if (!cleanTitle) {
      Alert.alert('Add a task', 'Type what needs to be done first.');
      return;
    }

    const nextTasks = [createTask(cleanTitle, zone), ...tasks];

    setTasks(nextTasks);
    void saveTasks(nextTasks);
    setTaskTitle('');
  }

  function addStarterTask(task: { title: string; zone: NurseryZone }) {
    const nextTasks = [createTask(task.title, task.zone), ...tasks];

    setTasks(nextTasks);
    void saveTasks(nextTasks);
  }

  function toggleTask(taskId: string) {
    const nextTasks = tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task));

    setTasks(nextTasks);
    void saveTasks(nextTasks);
  }

  function removeTask(taskId: string) {
    Alert.alert('Remove task?', 'This will remove it from your nursery planner.', [
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
      <Header title="Nursery Planner" back />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="home-outline" size={26} color={palette.accent} />
        </View>

        <Text style={styles.eyebrow}>PLANNING</Text>
        <Text style={styles.title}>Nursery planner</Text>
        <Text style={styles.copy}>Plan the baby room, save ideas, and track what is ready.</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{readyCount}</Text>
          <Text style={styles.summaryLabel}>ready</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{openCount}</Text>
          <Text style={styles.summaryLabel}>left</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{details.theme || '--'}</Text>
          <Text style={styles.summaryLabel}>theme</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Room details</Text>

        <TextInput
          value={details.theme}
          onChangeText={(value) => updateDetails('theme', value)}
          placeholder="Theme, example Woodland"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={details.room}
          onChangeText={(value) => updateDetails('room', value)}
          placeholder="Room or space"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={details.colors}
          onChangeText={(value) => updateDetails('colors', value)}
          placeholder="Colors, example cream, sage, rose"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={details.notes}
          onChangeText={(value) => updateDetails('notes', value)}
          placeholder="Notes or ideas"
          placeholderTextColor={palette.muted}
          multiline
          style={[styles.input, styles.notesInput]}
        />

        <AnimatedPressable onPress={saveDetails} style={styles.primaryButton}>
          <Ionicons name="save-outline" size={20} color={palette.onAccent} />
          <Text style={styles.primaryButtonText}>Save room details</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add setup task</Text>

        <TextInput
          value={taskTitle}
          onChangeText={setTaskTitle}
          placeholder="Task name"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <View style={styles.chips}>
          {zones.map((currentZone) => {
            const active = currentZone === zone;

            return (
              <AnimatedPressable
                key={currentZone}
                onPress={() => setZone(currentZone)}
                style={[styles.chip, active && styles.activeChip]}
              >
                <Text style={[styles.chipText, active && styles.activeChipText]}>{currentZone}</Text>
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
            <Text style={styles.starterZone}>{task.zone}</Text>
          </AnimatedPressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>ROOM CHECKLIST</Text>

      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="home-outline" size={30} color={palette.accent} />
          <Text style={styles.emptyTitle}>No nursery tasks yet</Text>
          <Text style={styles.emptyCopy}>Add your first setup task above or tap a quick-start card.</Text>
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
              <Text style={styles.taskMeta}>{task.zone}</Text>
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
    notesInput: {
      minHeight: 104,
      paddingTop: 14,
      textAlignVertical: 'top',
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
    starterZone: {
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
