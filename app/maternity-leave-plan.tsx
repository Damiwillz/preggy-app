import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type LeaveCategory = 'Work' | 'Benefits' | 'Home' | 'Baby' | 'Recovery';

type LeaveTask = {
  id: string;
  title: string;
  owner: string;
  category: LeaveCategory;
  done: boolean;
  createdAt: number;
};

type LeaveSettings = {
  leaveStart: string;
  returnDate: string;
  payNotes: string;
};

const TASKS_KEY = 'preggy:maternity-leave-tasks';
const SETTINGS_KEY = 'preggy:maternity-leave-settings';

const categories: LeaveCategory[] = ['Work', 'Benefits', 'Home', 'Baby', 'Recovery'];

const starterTasks: Array<{ title: string; category: LeaveCategory }> = [
  { title: 'Confirm leave dates with work', category: 'Work' },
  { title: 'Ask HR about pay and benefits', category: 'Benefits' },
  { title: 'Write handover notes', category: 'Work' },
  { title: 'Choose backup contact while away', category: 'Work' },
];

function parseTasks(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as LeaveTask[]) : [];
  } catch {
    return [];
  }
}

function parseSettings(raw: string | null): LeaveSettings {
  try {
    const parsed = raw ? JSON.parse(raw) : null;

    return {
      leaveStart: typeof parsed?.leaveStart === 'string' ? parsed.leaveStart : '',
      returnDate: typeof parsed?.returnDate === 'string' ? parsed.returnDate : '',
      payNotes: typeof parsed?.payNotes === 'string' ? parsed.payNotes : '',
    };
  } catch {
    return {
      leaveStart: '',
      returnDate: '',
      payNotes: '',
    };
  }
}

function createTask(title: string, owner: string, category: LeaveCategory): LeaveTask {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    owner,
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

function daysBetween(start: Date, end: Date) {
  const startTime = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endTime = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();

  return Math.ceil((endTime - startTime) / 86400000);
}

function formatStartCopy(value: string) {
  const date = parseDateInput(value);

  if (!date) return 'Add date';

  const today = new Date();
  const diff = daysBetween(today, date);

  if (diff === 0) return 'Starts today';
  if (diff > 0) return `In ${diff} days`;

  return `${Math.abs(diff)} days ago`;
}

function formatLeaveLength(startValue: string, returnValue: string) {
  const startDate = parseDateInput(startValue);
  const returnDate = parseDateInput(returnValue);

  if (!startDate || !returnDate) return '--';

  const days = daysBetween(startDate, returnDate);

  if (days <= 0) return '--';

  return `${days} days`;
}

export default function MaternityLeavePlanScreen() {
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [tasks, setTasks] = useState<LeaveTask[]>([]);
  const [leaveStart, setLeaveStart] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [category, setCategory] = useState<LeaveCategory>('Work');

  useEffect(() => {
    async function loadPlan() {
      try {
        const [savedTasks, savedSettings] = await Promise.all([
          AsyncStorage.getItem(TASKS_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);

        const settings = parseSettings(savedSettings);

        setTasks(parseTasks(savedTasks));
        setLeaveStart(settings.leaveStart);
        setReturnDate(settings.returnDate);
        setPayNotes(settings.payNotes);
      } catch (error) {
        console.log('Maternity leave load error:', error);
      }
    }

    void loadPlan();
  }, []);

  const completedCount = tasks.filter((task) => task.done).length;
  const openCount = tasks.length - completedCount;
  const startCopy = formatStartCopy(leaveStart);
  const leaveLength = formatLeaveLength(leaveStart, returnDate);

  async function saveTasks(nextTasks: LeaveTask[]) {
    try {
      await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(nextTasks));
    } catch (error) {
      console.log('Maternity leave task save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  async function saveSettings() {
    try {
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          leaveStart,
          returnDate,
          payNotes,
        })
      );

      Alert.alert('Saved', 'Your maternity leave plan has been saved.');
    } catch (error) {
      console.log('Maternity leave settings save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  function addTask() {
    const cleanTitle = taskTitle.trim();
    const cleanOwner = owner.trim() || 'Me';

    if (!cleanTitle) {
      Alert.alert('Add a task', 'Type what needs to be done first.');
      return;
    }

    const nextTasks = [createTask(cleanTitle, cleanOwner, category), ...tasks];

    setTasks(nextTasks);
    void saveTasks(nextTasks);
    setTaskTitle('');
    setOwner('');
  }

  function addStarterTask(task: { title: string; category: LeaveCategory }) {
    const nextTasks = [createTask(task.title, 'Me', task.category), ...tasks];

    setTasks(nextTasks);
    void saveTasks(nextTasks);
  }

  function toggleTask(taskId: string) {
    const nextTasks = tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task));

    setTasks(nextTasks);
    void saveTasks(nextTasks);
  }

  function removeTask(taskId: string) {
    Alert.alert('Remove task?', 'This will remove it from your leave plan.', [
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
      <Header title="Maternity Leave" back />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="briefcase-outline" size={26} color={palette.accent} />
        </View>
        <Text style={styles.eyebrow}>PLANNING</Text>
        <Text style={styles.title}>Maternity leave plan</Text>
        <Text style={styles.copy}>Keep your leave dates, HR notes, and handover tasks in one calm place.</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{startCopy}</Text>
          <Text style={styles.summaryLabel}>leave start</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{leaveLength}</Text>
          <Text style={styles.summaryLabel}>leave length</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{openCount}</Text>
          <Text style={styles.summaryLabel}>open tasks</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Leave details</Text>

        <Text style={styles.label}>Leave start date</Text>
        <TextInput
          value={leaveStart}
          onChangeText={setLeaveStart}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Expected return date</Text>
        <TextInput
          value={returnDate}
          onChangeText={setReturnDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <Text style={styles.label}>Pay, HR, or benefits notes</Text>
        <TextInput
          value={payNotes}
          onChangeText={setPayNotes}
          placeholder="Example: Ask HR about pay schedule, benefits, and forms."
          placeholderTextColor={palette.muted}
          multiline
          style={[styles.input, styles.notesInput]}
        />

        <AnimatedPressable onPress={saveSettings} style={styles.primaryButton}>
          <Ionicons name="save-outline" size={20} color={palette.onAccent} />
          <Text style={styles.primaryButtonText}>Save leave details</Text>
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

        <TextInput
          value={owner}
          onChangeText={setOwner}
          placeholder="Owner, optional"
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
          <Ionicons name="clipboard-outline" size={30} color={palette.accent} />
          <Text style={styles.emptyTitle}>No leave tasks yet</Text>
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
              <Text style={styles.taskMeta}>
                {task.category} • {task.owner}
              </Text>
            </View>

            <AnimatedPressable onPress={() => removeTask(task.id)} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={18} color={palette.muted} />
            </AnimatedPressable>
          </View>
        ))
      )}

      <View style={styles.noteCard}>
        <Ionicons name="information-circle-outline" size={20} color={palette.accent} />
        <Text style={styles.noteText}>
          This planner is for organization only. Your actual leave, pay, and benefits depend on your employer and local rules.
        </Text>
      </View>
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
    summaryGrid: {
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
      fontSize: 16,
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
    label: {
      ...type.tiny,
      color: palette.text,
      marginBottom: 6,
      textTransform: 'uppercase',
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
    noteCard: {
      flexDirection: 'row',
      gap: 10,
      borderRadius: 22,
      padding: 14,
      backgroundColor: palette.accentSoft,
      marginTop: 4,
    },
    noteText: {
      ...type.small,
      color: palette.text,
      flex: 1,
    },
  });
}
