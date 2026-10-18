import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type EnergyLevel = 1 | 2 | 3 | 4 | 5;
type TaskCost = 1 | 2 | 3;
type TaskOwner = 'Me' | 'Delegate';

type EnergyTask = {
  id: string;
  title: string;
  cost: TaskCost;
  owner: TaskOwner;
  completed: boolean;
  createdAt: number;
};

type EnergyPlan = {
  date: string;
  energy: EnergyLevel;
  tasks: EnergyTask[];
};

const STORAGE_KEY = 'preggy:energy-budget';

const energyLabels: Record<EnergyLevel, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Steady',
  4: 'Good',
  5: 'Strong',
};

const costOptions: {
  value: TaskCost;
  label: string;
  copy: string;
}[] = [
  {
    value: 1,
    label: 'Light',
    copy: 'Small effort',
  },
  {
    value: 2,
    label: 'Medium',
    copy: 'Some effort',
  },
  {
    value: 3,
    label: 'Heavy',
    copy: 'More effort',
  },
];

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function emptyPlan(): EnergyPlan {
  return {
    date: todayKey(),
    energy: 3,
    tasks: [],
  };
}

function parsePlan(raw: string | null): EnergyPlan {
  try {
    const parsed = raw ? JSON.parse(raw) : null;

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.date !== todayKey()
    ) {
      return emptyPlan();
    }

    return {
      date: parsed.date,
      energy:
        typeof parsed.energy === 'number'
          ? parsed.energy
          : 3,
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks
        : [],
    };
  } catch {
    return emptyPlan();
  }
}

export default function EnergyBudgetScreen() {
  const { palette } = useAppTheme();

  const [plan, setPlan] = useState<EnergyPlan>(emptyPlan());
  const [showForm, setShowForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCost, setTaskCost] = useState<TaskCost>(1);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => setPlan(parsePlan(saved)))
      .catch((error) => {
        console.log('Energy budget load error:', error);
      });
  }, []);

  async function savePlan(next: EnergyPlan) {
    setPlan(next);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch (error) {
      console.log('Energy budget save error:', error);
      Alert.alert(
        'Could not save',
        'Please try again.'
      );
    }
  }

  function chooseEnergy(value: EnergyLevel) {
    void savePlan({
      ...plan,
      energy: value,
    });
  }

  async function addTask() {
    const cleanTitle = taskTitle.trim();

    if (!cleanTitle) {
      Alert.alert(
        'Add a task',
        'Enter something you want to do today.'
      );
      return;
    }

    const next: EnergyPlan = {
      ...plan,
      tasks: [
        {
          id: String(Date.now()),
          title: cleanTitle,
          cost: taskCost,
          owner: 'Me',
          completed: false,
          createdAt: Date.now(),
        },
        ...plan.tasks,
      ],
    };

    await savePlan(next);

    setTaskTitle('');
    setTaskCost(1);
    setShowForm(false);
  }

  function toggleComplete(id: string) {
    void savePlan({
      ...plan,
      tasks: plan.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
            }
          : task
      ),
    });
  }

  function toggleOwner(id: string) {
    void savePlan({
      ...plan,
      tasks: plan.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              owner:
                task.owner === 'Me'
                  ? 'Delegate'
                  : 'Me',
            }
          : task
      ),
    });
  }

  function deleteTask(id: string) {
    Alert.alert(
      'Remove this task?',
      'This task will be removed from today’s plan.',
      [
        {
          text: 'Keep it',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void savePlan({
              ...plan,
              tasks: plan.tasks.filter(
                (task) => task.id !== id
              ),
            });
          },
        },
      ]
    );
  }

  const energyBudget = plan.energy * 2;

  const plannedEnergy = useMemo(
    () =>
      plan.tasks
        .filter(
          (task) =>
            task.owner === 'Me' &&
            !task.completed
        )
        .reduce(
          (total, task) => total + task.cost,
          0
        ),
    [plan.tasks]
  );

  const delegatedCount = plan.tasks.filter(
    (task) =>
      task.owner === 'Delegate' &&
      !task.completed
  ).length;

  const completedCount = plan.tasks.filter(
    (task) => task.completed
  ).length;

  const remainingEnergy = Math.max(
    energyBudget - plannedEnergy,
    0
  );

  const overBudget = plannedEnergy > energyBudget;

  return (
    <Screen bottomSpace={110}>
      <Header title="Energy Budget" back />

      <View
        style={[
          styles.hero,
          {
            backgroundColor: overBudget
              ? palette.warning
              : palette.accent,
            borderColor: overBudget
              ? palette.warning
              : palette.accent,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="flash-outline"
              size={28}
              color="#FFFFFF"
            />
          </View>

          <AnimatedPressable
            onPress={() =>
              setShowForm((current) => !current)
            }
            style={styles.addButton}
          >
            <Ionicons
              name={showForm ? 'close' : 'add'}
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.addButtonText}>
              {showForm ? 'Close' : 'Add task'}
            </Text>
          </AnimatedPressable>
        </View>

        <Text style={styles.eyebrow}>
          TODAY’S CAPACITY
        </Text>

        <Text style={styles.heroTitle}>
          {overBudget
            ? 'Your day may be too full.'
            : 'Protect your energy today.'}
        </Text>

        <Text style={styles.heroCopy}>
          {overBudget
            ? 'Delegate, postpone, or remove a task to create more breathing room.'
            : `${remainingEnergy} energy points remain in your plan.`}
        </Text>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {energyBudget}
            </Text>
            <Text style={styles.summaryLabel}>
              Available
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {plannedEnergy}
            </Text>
            <Text style={styles.summaryLabel}>
              Planned
            </Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {delegatedCount}
            </Text>
            <Text style={styles.summaryLabel}>
              Delegated
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.energyCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionEyebrow,
            { color: palette.accent },
          ]}
        >
          CHECK IN
        </Text>

        <Text
          style={[
            styles.sectionTitle,
            { color: palette.ink },
          ]}
        >
          How is your energy?
        </Text>

        <Text
          style={[
            styles.sectionCopy,
            { color: palette.text },
          ]}
        >
          Choose honestly. The plan should fit you—not the other way around.
        </Text>

        <View style={styles.energyRow}>
          {([1, 2, 3, 4, 5] as EnergyLevel[]).map(
            (level) => {
              const active = plan.energy === level;

              return (
                <AnimatedPressable
                  key={level}
                  onPress={() => chooseEnergy(level)}
                  style={[
                    styles.energyButton,
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
                      styles.energyNumber,
                      {
                        color: active
                          ? palette.onAccent
                          : palette.ink,
                      },
                    ]}
                  >
                    {level}
                  </Text>
                </AnimatedPressable>
              );
            }
          )}
        </View>

        <Text
          style={[
            styles.energyLabel,
            { color: palette.accent },
          ]}
        >
          {energyLabels[plan.energy]}
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
          <Text
            style={[
              styles.sectionEyebrow,
              { color: palette.accent },
            ]}
          >
            NEW TASK
          </Text>

          <Text
            style={[
              styles.formTitle,
              { color: palette.ink },
            ]}
          >
            What needs your energy?
          </Text>

          <TextInput
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholder="Example: Prepare hospital documents"
            placeholderTextColor={palette.muted}
            style={[
              styles.input,
              {
                backgroundColor: palette.canvas,
                borderColor: palette.line,
                color: palette.ink,
              },
            ]}
          />

          <Text
            style={[
              styles.costLabel,
              { color: palette.text },
            ]}
          >
            How much effort will it take?
          </Text>

          <View style={styles.costRow}>
            {costOptions.map((option) => {
              const active =
                taskCost === option.value;

              return (
                <AnimatedPressable
                  key={option.value}
                  onPress={() =>
                    setTaskCost(option.value)
                  }
                  style={[
                    styles.costButton,
                    {
                      backgroundColor: active
                        ? palette.accentSoft
                        : palette.canvas,
                      borderColor: active
                        ? palette.accent
                        : palette.line,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.costValue,
                      {
                        color: active
                          ? palette.accent
                          : palette.ink,
                      },
                    ]}
                  >
                    {option.value}
                  </Text>

                  <Text
                    style={[
                      styles.costTitle,
                      { color: palette.ink },
                    ]}
                  >
                    {option.label}
                  </Text>

                  <Text
                    style={[
                      styles.costCopy,
                      { color: palette.text },
                    ]}
                  >
                    {option.copy}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <AnimatedPressable
            onPress={() => void addTask()}
            style={[
              styles.saveButton,
              { backgroundColor: palette.accent },
            ]}
          >
            <Text
              style={[
                styles.saveButtonText,
                { color: palette.onAccent },
              ]}
            >
              Add to today
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={palette.onAccent}
            />
          </AnimatedPressable>
        </View>
      ) : null}

      <View style={styles.tasksHeading}>
        <View>
          <Text
            style={[
              styles.sectionEyebrow,
              { color: palette.accent },
            ]}
          >
            TODAY’S PLAN
          </Text>

          <Text
            style={[
              styles.sectionTitle,
              { color: palette.ink },
            ]}
          >
            Your energy list
          </Text>
        </View>

        <View
          style={[
            styles.completedBadge,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Text
            style={[
              styles.completedBadgeText,
              { color: palette.accent },
            ]}
          >
            {completedCount} done
          </Text>
        </View>
      </View>

      {plan.tasks.length === 0 ? (
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
              name="battery-half-outline"
              size={31}
              color={palette.accent}
            />
          </View>

          <Text
            style={[
              styles.emptyTitle,
              { color: palette.ink },
            ]}
          >
            Your day is open
          </Text>

          <Text
            style={[
              styles.emptyCopy,
              { color: palette.text },
            ]}
          >
            Add only what matters. Rest can also be part of the plan.
          </Text>

          <AnimatedPressable
            onPress={() => setShowForm(true)}
            style={[
              styles.emptyButton,
              { backgroundColor: palette.accent },
            ]}
          >
            <Ionicons
              name="add"
              size={19}
              color={palette.onAccent}
            />

            <Text
              style={[
                styles.emptyButtonText,
                { color: palette.onAccent },
              ]}
            >
              Add first task
            </Text>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.taskList}>
          {plan.tasks.map((task) => {
            const delegated =
              task.owner === 'Delegate';

            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: task.completed
                      ? palette.success
                      : palette.line,
                    opacity: task.completed
                      ? 0.7
                      : 1,
                  },
                ]}
              >
                <AnimatedPressable
                  onPress={() =>
                    toggleComplete(task.id)
                  }
                  style={[
                    styles.checkButton,
                    {
                      backgroundColor: task.completed
                        ? palette.success
                        : palette.accentSoft,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      task.completed
                        ? 'checkmark'
                        : 'flash-outline'
                    }
                    size={20}
                    color={
                      task.completed
                        ? '#FFFFFF'
                        : palette.accent
                    }
                  />
                </AnimatedPressable>

                <View style={styles.taskContent}>
                  <Text
                    style={[
                      styles.taskTitle,
                      {
                        color: palette.ink,
                        textDecorationLine:
                          task.completed
                            ? 'line-through'
                            : 'none',
                      },
                    ]}
                  >
                    {task.title}
                  </Text>

                  <View style={styles.taskMeta}>
                    <Text
                      style={[
                        styles.taskCost,
                        { color: palette.text },
                      ]}
                    >
                      {task.cost}{' '}
                      {task.cost === 1
                        ? 'point'
                        : 'points'}
                    </Text>

                    <AnimatedPressable
                      onPress={() =>
                        toggleOwner(task.id)
                      }
                      style={[
                        styles.ownerButton,
                        {
                          backgroundColor: delegated
                            ? palette.accent
                            : palette.accentSoft,
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          delegated
                            ? 'people-outline'
                            : 'person-outline'
                        }
                        size={15}
                        color={
                          delegated
                            ? palette.onAccent
                            : palette.accent
                        }
                      />

                      <Text
                        style={[
                          styles.ownerText,
                          {
                            color: delegated
                              ? palette.onAccent
                              : palette.accent,
                          },
                        ]}
                      >
                        {delegated
                          ? 'Ask for help'
                          : 'Mine'}
                      </Text>
                    </AnimatedPressable>
                  </View>
                </View>

                <AnimatedPressable
                  onPress={() =>
                    deleteTask(task.id)
                  }
                  style={styles.deleteButton}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={palette.muted}
                  />
                </AnimatedPressable>
              </View>
            );
          })}
        </View>
      )}

      <View
        style={[
          styles.restCard,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="moon-outline"
          size={23}
          color={palette.accent}
        />

        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.restTitle,
              { color: palette.ink },
            ]}
          >
            Rest is productive
          </Text>

          <Text
            style={[
              styles.restCopy,
              { color: palette.text },
            ]}
          >
            Your body is already doing important work. An unfinished task is not a failure.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 32,
    padding: 21,
    marginTop: 12,
    marginBottom: 18,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIcon: {
    width: 55,
    height: 55,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    minHeight: 42,
    borderRadius: 17,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(255,255,255,0.17)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addButtonText: {
    ...type.small,
    color: '#FFFFFF',
  },
  eyebrow: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.76)',
    letterSpacing: 1.3,
    marginTop: 25,
  },
  heroTitle: {
    ...type.title,
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 35,
    marginTop: 5,
  },
  heroCopy: {
    ...type.small,
    color: 'rgba(255,255,255,0.84)',
    lineHeight: 20,
    marginTop: 7,
  },
  summaryRow: {
    minHeight: 74,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 21,
    paddingHorizontal: 10,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 21,
    lineHeight: 24,
  },
  summaryLabel: {
    ...type.tiny,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  energyCard: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 18,
    marginBottom: 16,
  },
  sectionEyebrow: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 2,
  },
  sectionCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 5,
  },
  energyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 17,
  },
  energyButton: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyNumber: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  energyLabel: {
    ...type.small,
    textAlign: 'center',
    marginTop: 10,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 18,
    marginBottom: 21,
  },
  formTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 28,
    marginTop: 2,
    marginBottom: 15,
  },
  input: {
    ...type.body,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  costLabel: {
    ...type.small,
    marginTop: 17,
    marginBottom: 8,
  },
  costRow: {
    flexDirection: 'row',
    gap: 8,
  },
  costButton: {
    flex: 1,
    minHeight: 105,
    borderWidth: 1,
    borderRadius: 19,
    padding: 12,
  },
  costValue: {
    ...type.bodyStrong,
    fontSize: 20,
  },
  costTitle: {
    ...type.small,
    marginTop: 5,
  },
  costCopy: {
    ...type.tiny,
    marginTop: 2,
  },
  saveButton: {
    minHeight: 56,
    borderRadius: 19,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    ...type.bodyStrong,
  },
  tasksHeading: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  completedBadge: {
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  completedBadgeText: {
    ...type.tiny,
  },
  emptyCard: {
    minHeight: 260,
    borderWidth: 1,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    marginTop: 14,
  },
  emptyCopy: {
    ...type.small,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginTop: 5,
  },
  emptyButton: {
    minHeight: 49,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginTop: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emptyButtonText: {
    ...type.small,
  },
  taskList: {
    gap: 10,
  },
  taskCard: {
    minHeight: 91,
    borderWidth: 1,
    borderRadius: 23,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    ...type.bodyStrong,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 7,
  },
  taskCost: {
    ...type.tiny,
  },
  ownerButton: {
    minHeight: 31,
    borderRadius: 13,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownerText: {
    ...type.tiny,
  },
  deleteButton: {
    padding: 5,
  },
  restCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginTop: 22,
  },
  restTitle: {
    ...type.bodyStrong,
  },
  restCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 3,
  },
});
