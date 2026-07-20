import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type SupportCategory = 'Appointments' | 'Home' | 'Recovery' | 'Baby' | 'Emotional';

type SupportTask = {
  id: string;
  title: string;
  helper: string;
  category: SupportCategory;
  done: boolean;
  createdAt: number;
};

const STORAGE_KEY = 'preggy:partner-support-tasks';

const categories: SupportCategory[] = ['Appointments', 'Home', 'Recovery', 'Baby', 'Emotional'];

const starterTasks: Array<{ title: string; category: SupportCategory }> = [
  { title: 'Drive to next appointment', category: 'Appointments' },
  { title: 'Pack hospital bag together', category: 'Baby' },
  { title: 'Handle dinner this week', category: 'Home' },
  { title: 'Help with night routine plan', category: 'Recovery' },
];

function parseTasks(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SupportTask[]) : [];
  } catch {
    return [];
  }
}

function createTask(title: string, helper: string, category: SupportCategory): SupportTask {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    helper,
    category,
    done: false,
    createdAt: Date.now(),
  };
}

export default function PartnerSupportScreen() {
  const { palette } = useAppTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [tasks, setTasks] = useState<SupportTask[]>([]);
  const [title, setTitle] = useState('');
  const [helper, setHelper] = useState('');
  const [category, setCategory] = useState<SupportCategory>('Home');

  useEffect(() => {
    async function loadTasks() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        setTasks(parseTasks(saved));
      } catch (error) {
        console.log('Partner support load error:', error);
      }
    }

    void loadTasks();
  }, []);

  const completedCount = tasks.filter((task) => task.done).length;
  const openCount = tasks.length - completedCount;

  async function saveTasks(nextTasks: SupportTask[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
    } catch (error) {
      console.log('Partner support save error:', error);
      Alert.alert('Could not save', 'Please try again in a moment.');
    }
  }

  function addTask() {
    const cleanTitle = title.trim();
    const cleanHelper = helper.trim() || 'Support person';

    if (!cleanTitle) {
      Alert.alert('Add a support task', 'Type what you need help with first.');
      return;
    }

    const nextTasks = [createTask(cleanTitle, cleanHelper, category), ...tasks];

    setTasks(nextTasks);
    void saveTasks(nextTasks);
    setTitle('');
    setHelper('');
  }

  function addStarterTask(task: { title: string; category: SupportCategory }) {
    const nextTasks = [createTask(task.title, 'Support person', task.category), ...tasks];

    setTasks(nextTasks);
    void saveTasks(nextTasks);
  }

  function toggleTask(taskId: string) {
    const nextTasks = tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task));

    setTasks(nextTasks);
    void saveTasks(nextTasks);
  }

  function removeTask(taskId: string) {
    Alert.alert('Remove task?', 'This will remove it from your support plan.', [
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

  const quickLinks = [
    {
      icon: 'call-outline' as const,
      title: 'Emergency Contacts',
      copy: 'Important numbers',
      route: '/emergency-contacts',
    },
    {
      icon: 'folder-open-outline' as const,
      title: 'Doctor Visit Pack',
      copy: 'Visit notes',
      route: '/doctor-visit-pack',
    },
    {
      icon: 'home-outline' as const,
      title: 'Postpartum Plan',
      copy: 'Recovery help',
      route: '/postpartum-plan',
    },
  ];

  return (
    <Screen>
      <Header title="Partner Support" back />

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="people-outline" size={26} color={palette.accent} />
        </View>
        <Text style={styles.eyebrow}>SUPPORT</Text>
        <Text style={styles.title}>Partner support plan</Text>
        <Text style={styles.copy}>Write down the real-life help you need so your people know exactly how to show up.</Text>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{tasks.length}</Text>
          <Text style={styles.summaryLabel}>tasks</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{openCount}</Text>
          <Text style={styles.summaryLabel}>open</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>done</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add support task</Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What do you need help with?"
          placeholderTextColor={palette.muted}
          style={styles.input}
        />

        <TextInput
          value={helper}
          onChangeText={setHelper}
          placeholder="Who can help? Optional"
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

      <Text style={styles.sectionLabel}>HELPFUL LINKS</Text>

      <View style={styles.linkGrid}>
        {quickLinks.map((link) => (
          <AnimatedPressable key={link.title} onPress={() => router.push(link.route as never)} style={styles.linkCard}>
            <View style={styles.linkIcon}>
              <Ionicons name={link.icon} size={20} color={palette.accent} />
            </View>
            <Text style={styles.linkTitle}>{link.title}</Text>
            <Text style={styles.linkCopy}>{link.copy}</Text>
          </AnimatedPressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>YOUR PLAN</Text>

      {tasks.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="heart-outline" size={28} color={palette.accent} />
          <Text style={styles.emptyTitle}>No support tasks yet</Text>
          <Text style={styles.emptyCopy}>Add one thing someone can do to make life easier.</Text>
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
                {task.category} • {task.helper}
              </Text>
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
      fontSize: 20,
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
    linkGrid: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },
    linkCard: {
      flex: 1,
      borderRadius: 22,
      padding: 12,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.line,
    },
    linkIcon: {
      width: 38,
      height: 38,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.accentSoft,
      marginBottom: 10,
    },
    linkTitle: {
      ...type.tiny,
      color: palette.ink,
    },
    linkCopy: {
      ...type.tiny,
      color: palette.text,
      marginTop: 3,
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
