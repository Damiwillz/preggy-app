import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type DayName = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
type MealName = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

type MealEntry = {
  text: string;
  done: boolean;
};

type WeekPlan = Record<DayName, Record<MealName, MealEntry>>;

const STORAGE_KEY = 'preggy:weekly-meal-planner';

const DAYS: DayName[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEALS: MealName[] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const mealIcons: Record<MealName, keyof typeof Ionicons.glyphMap> = {
  Breakfast: 'sunny-outline',
  Lunch: 'restaurant-outline',
  Dinner: 'moon-outline',
  Snack: 'nutrition-outline',
};

function createEmptyPlan(): WeekPlan {
  return DAYS.reduce((week, day) => {
    week[day] = MEALS.reduce((meals, meal) => {
      meals[meal] = { text: '', done: false };
      return meals;
    }, {} as Record<MealName, MealEntry>);

    return week;
  }, {} as WeekPlan);
}

export default function MealPlannerScreen() {
  const { palette } = useAppTheme();

  const [selectedDay, setSelectedDay] = useState<DayName>('Mon');
  const [plan, setPlan] = useState<WeekPlan>(createEmptyPlan);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (saved) {
          setPlan(JSON.parse(saved) as WeekPlan);
        }
      } catch (error) {
        console.log('Meal planner load error:', error);
      } finally {
        setLoaded(true);
      }
    }

    void loadPlan();
  }, []);

  async function savePlan(next: WeekPlan) {
    setPlan(next);

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.log('Meal planner save error:', error);
    }
  }

  function updateMeal(meal: MealName, text: string) {
    const next: WeekPlan = {
      ...plan,
      [selectedDay]: {
        ...plan[selectedDay],
        [meal]: {
          ...plan[selectedDay][meal],
          text,
        },
      },
    };

    void savePlan(next);
  }

  function toggleMeal(meal: MealName) {
    const current = plan[selectedDay][meal];

    if (!current.text.trim()) {
      Alert.alert('Add a meal first', 'Type your meal before marking it complete.');
      return;
    }

    const next: WeekPlan = {
      ...plan,
      [selectedDay]: {
        ...plan[selectedDay],
        [meal]: {
          ...current,
          done: !current.done,
        },
      },
    };

    void savePlan(next);
  }

  function resetWeek() {
    Alert.alert(
      'Clear this meal plan?',
      'All meals and completed items for the week will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => void savePlan(createEmptyPlan()),
        },
      ]
    );
  }

  const totalMeals = useMemo(
    () =>
      DAYS.reduce(
        (total, day) =>
          total + MEALS.filter((meal) => plan[day][meal].text.trim()).length,
        0
      ),
    [plan]
  );

  const completedMeals = useMemo(
    () =>
      DAYS.reduce(
        (total, day) =>
          total + MEALS.filter((meal) => plan[day][meal].done).length,
        0
      ),
    [plan]
  );

  const dayCompleted = MEALS.filter(
    (meal) => plan[selectedDay][meal].done
  ).length;

  const progress =
    totalMeals > 0 ? Math.round((completedMeals / totalMeals) * 100) : 0;

  if (!loaded) {
    return (
      <Screen>
        <Header title="" back />
        <Text style={[styles.loading, { color: palette.text }]}>
          Loading your meal plan...
        </Text>
      </Screen>
    );
  }

  return (
    <Screen bottomSpace={130}>
      <Header title="" back />

      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          WEEKLY WELLNESS
        </Text>

        <Text style={[styles.title, { color: palette.ink }]}>
          Meal Planner
        </Text>

        <Text style={[styles.subtitle, { color: palette.text }]}>
          Plan simple meals for your week and check them off as you go.
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
            <Ionicons name="nutrition-outline" size={25} color={palette.accent} />
          </View>

          <AnimatedPressable onPress={resetWeek} style={styles.resetButton}>
            <Ionicons name="refresh-outline" size={17} color="#FFFFFF" />
            <Text style={styles.resetText}>Clear week</Text>
          </AnimatedPressable>
        </View>

        <Text style={styles.heroTitle}>{progress}% complete</Text>

        <Text style={styles.heroCopy}>
          {completedMeals} of {totalMeals} planned meals completed
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%` as `${number}%` },
            ]}
          />
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: palette.accent }]}>
        SELECT A DAY
      </Text>

      <View style={styles.daysRow}>
        {DAYS.map((day) => {
          const active = selectedDay === day;
          const completed = MEALS.filter((meal) => plan[day][meal].done).length;

          return (
            <AnimatedPressable
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[
                styles.dayButton,
                {
                  backgroundColor: active ? palette.accent : palette.surface,
                  borderColor: active ? palette.accent : palette.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: active ? '#FFFFFF' : palette.ink },
                ]}
              >
                {day}
              </Text>

              <Text
                style={[
                  styles.dayCount,
                  { color: active ? '#FFFFFF' : palette.muted },
                ]}
              >
                {completed}/4
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={styles.dayHeading}>
        <View>
          <Text style={[styles.dayTitle, { color: palette.ink }]}>
            {selectedDay} meals
          </Text>

          <Text style={[styles.daySubtitle, { color: palette.text }]}>
            {dayCompleted} of 4 completed
          </Text>
        </View>

        <View
          style={[
            styles.dayBadge,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={17}
            color={palette.accent}
          />
        </View>
      </View>

      <View style={styles.mealsList}>
        {MEALS.map((meal) => {
          const entry = plan[selectedDay][meal];

          return (
            <View
              key={meal}
              style={[
                styles.mealCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: entry.done ? palette.accent : palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.mealIcon,
                  { backgroundColor: palette.accentSoft },
                ]}
              >
                <Ionicons
                  name={mealIcons[meal]}
                  size={21}
                  color={palette.accent}
                />
              </View>

              <View style={styles.mealContent}>
                <Text style={[styles.mealName, { color: palette.ink }]}>
                  {meal}
                </Text>

                <TextInput
                  value={entry.text}
                  onChangeText={(value) => updateMeal(meal, value)}
                  placeholder={`Add ${meal.toLowerCase()}`}
                  placeholderTextColor={palette.muted}
                  style={[
                    styles.mealInput,
                    {
                      color: palette.ink,
                      borderColor: palette.line,
                      backgroundColor: palette.canvas,
                    },
                  ]}
                />
              </View>

              <AnimatedPressable
                onPress={() => toggleMeal(meal)}
                style={[
                  styles.checkButton,
                  {
                    backgroundColor: entry.done
                      ? palette.accent
                      : palette.canvas,
                    borderColor: entry.done
                      ? palette.accent
                      : palette.line,
                  },
                ]}
              >
                <Ionicons
                  name={entry.done ? 'checkmark' : 'ellipse-outline'}
                  size={20}
                  color={entry.done ? '#FFFFFF' : palette.muted}
                />
              </AnimatedPressable>
            </View>
          );
        })}
      </View>

      <View
        style={[
          styles.noteCard,
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

        <Text style={[styles.noteText, { color: palette.text }]}>
          Use this planner for organisation only. Ask your doctor or dietitian
          for nutrition advice that matches your pregnancy and medical needs.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    ...type.body,
    marginTop: 30,
    textAlign: 'center',
  },
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
    maxWidth: 350,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    marginBottom: 24,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  resetText: {
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
    color: 'rgba(255,255,255,0.88)',
    marginTop: 3,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  sectionLabel: {
    ...type.section,
    marginBottom: 10,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 24,
  },
  dayButton: {
    flex: 1,
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    ...type.small,
    fontWeight: '800',
  },
  dayCount: {
    ...type.tiny,
    marginTop: 2,
  },
  dayHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
  },
  daySubtitle: {
    ...type.small,
    marginTop: 2,
  },
  dayBadge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 22,
    padding: 13,
    gap: 11,
  },
  mealIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealContent: {
    flex: 1,
  },
  mealName: {
    ...type.bodyStrong,
    marginBottom: 6,
  },
  mealInput: {
    ...type.small,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    padding: 15,
    gap: 10,
    marginTop: 22,
  },
  noteText: {
    ...type.small,
    flex: 1,
  },
});
