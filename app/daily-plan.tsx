import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { getMyProfile, type UserProfile } from '@/services/profile';

const DAILY_CARE_TOTAL = 5;
const WATER_TARGET = 8;

type PlanItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  route: string;
  done: boolean;
  canMarkDone?: boolean;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getChecklistStorageKey(dateKey: string) {
  return `preggy:daily-care:${dateKey}`;
}

function getWaterStorageKey(dateKey: string) {
  return `preggy:water-cups:${dateKey}`;
}

function getKickStorageKey(dateKey: string) {
  return `preggy:kicks:${dateKey}`;
}

function getPlanDoneStorageKey(dateKey: string) {
  return `preggy:daily-plan-done:${dateKey}`;
}

function parseSavedArray(raw: string | null) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function getGentleFocus(week: number): {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  copy: string;
  route: string;
  action: string;
} {
  if (week >= 28) {
    return {
      icon: 'bag-handle-outline',
      title: 'Tonight prep',
      copy: 'Choose one small birth-prep task tonight: bag, questions, documents, or support plan.',
      route: '/hospital-bag-checklist',
      action: 'Open checklist',
    };
  }

  if (week >= 14) {
    return {
      icon: 'pulse-outline',
      title: 'Body note',
      copy: 'Take one minute to log how your body feels today, even if it is just a simple mood note.',
      route: '/log-symptoms',
      action: 'Log symptoms',
    };
  }

  return {
    icon: 'water-outline',
    title: 'Small routine',
    copy: 'Keep today light: drink water, do one care task, and write down anything you want to remember.',
    route: '/daily-care',
    action: 'Start care',
  };
}

export default function DailyPlanScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailyCareDone, setDailyCareDone] = useState(0);
  const [waterCups, setWaterCups] = useState(0);
  const [kicks, setKicks] = useState(0);
  const [manualDone, setManualDone] = useState<string[]>([]);

  const dateKey = useMemo(() => toDateKey(new Date()), []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadPlan() {
        try {
          setLoading(true);

          const [profileData, savedCare, savedWater, savedKicks, savedManualDone] = await Promise.all([
            getMyProfile(),
            AsyncStorage.getItem(getChecklistStorageKey(dateKey)),
            AsyncStorage.getItem(getWaterStorageKey(dateKey)),
            AsyncStorage.getItem(getKickStorageKey(dateKey)),
            AsyncStorage.getItem(getPlanDoneStorageKey(dateKey)),
          ]);

          if (!mounted) return;

          const parsedCare = parseSavedArray(savedCare);
          const parsedWater = savedWater ? Number.parseInt(savedWater, 10) : 0;
          const parsedKicks = savedKicks ? Number.parseInt(savedKicks, 10) : 0;

          setProfile(profileData);
          setDailyCareDone(Math.min(parsedCare.length, DAILY_CARE_TOTAL));
          setWaterCups(Number.isFinite(parsedWater) ? clamp(parsedWater, 0, WATER_TARGET) : 0);
          setKicks(Number.isFinite(parsedKicks) ? Math.max(parsedKicks, 0) : 0);
          setManualDone(parseSavedArray(savedManualDone).filter((item): item is string => typeof item === 'string'));
        } catch (error) {
          console.log('Daily plan load error:', error);
        } finally {
          if (mounted) setLoading(false);
        }
      }

      void loadPlan();

      return () => {
        mounted = false;
      };
    }, [dateKey])
  );

  async function toggleManualDone(itemId: string) {
    const nextDone = manualDone.includes(itemId)
      ? manualDone.filter((item) => item !== itemId)
      : [...manualDone, itemId];

    setManualDone(nextDone);

    try {
      await AsyncStorage.setItem(getPlanDoneStorageKey(dateKey), JSON.stringify(nextDone));
    } catch (error) {
      console.log('Daily plan save error:', error);
    }
  }

  const babyName = profile?.baby_nickname || 'baby';
  const week = profile?.pregnancy_week ?? 20;
  const carePercent = Math.round(((dailyCareDone + waterCups) / (DAILY_CARE_TOTAL + WATER_TARGET)) * 100);
  const gentleFocus = getGentleFocus(week);

  const planItems: PlanItem[] = [
    {
      id: 'daily-care',
      icon: 'checkmark-circle-outline',
      title: 'Daily care',
      detail: `${dailyCareDone}/${DAILY_CARE_TOTAL} care tasks • ${waterCups}/${WATER_TARGET} water`,
      route: '/daily-care',
      done: dailyCareDone >= DAILY_CARE_TOTAL && waterCups >= WATER_TARGET,
    },
    {
      id: 'symptoms',
      icon: 'pulse-outline',
      title: 'Symptom check-in',
      detail: 'Log mood, symptoms, and notes for today',
      route: '/log-symptoms',
      done: manualDone.includes('symptoms'),
      canMarkDone: true,
    },
    {
      id: 'movement',
      icon: 'footsteps-outline',
      title: 'Baby movement',
      detail: `${kicks} movements logged today`,
      route: '/kick-counter',
      done: kicks > 0,
    },
    {
      id: 'medication',
      icon: 'medkit-outline',
      title: 'Medication routine',
      detail: 'Review vitamins, supplements, or care routines',
      route: '/medication',
      done: manualDone.includes('medication'),
      canMarkDone: true,
    },
    {
      id: 'appointments',
      icon: 'calendar-outline',
      title: 'Appointment prep',
      detail: 'Check visits, questions, and notes',
      route: '/(tabs)/appointments',
      done: manualDone.includes('appointments'),
      canMarkDone: true,
    },
  ];

  const completedItems = planItems.filter((item) => item.done).length;
  const planPercent = Math.round((completedItems / planItems.length) * 100);

  return (
    <Screen bottomSpace={40} style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <Header title="Daily Plan" back />

      <View style={[styles.hero, { backgroundColor: palette.accent }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="sunny-outline" size={32} color={palette.onAccent} />
          </View>

          <View style={styles.weekPill}>
            <Text style={styles.weekPillText}>Week {week}</Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>TODAY'S PLAN</Text>
        <Text style={[styles.title, { color: palette.onAccent }]}>A calm plan for you and {babyName}</Text>
        <Text style={[styles.subtitle, { color: palette.onAccent }]}>
          {todayLabel()} • Start small, track what matters, and keep the day simple.
        </Text>
      </View>

      <View style={[styles.summary, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View>
          <Text style={[styles.cardLabel, { color: palette.accent }]}>PROGRESS</Text>
          <Text style={[styles.summaryTitle, { color: palette.ink }]}>{planPercent}% of plan started</Text>
          <Text style={[styles.summaryCopy, { color: palette.text }]}>
            Daily care is {carePercent}% complete.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={palette.accent} />
        ) : (
          <View style={[styles.percentBadge, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.percentText, { color: palette.accent }]}>{completedItems}/{planItems.length}</Text>
          </View>
        )}
      </View>

      <View style={[styles.focusCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.focusIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name={gentleFocus.icon} size={24} color={palette.accent} />
        </View>

        <View style={styles.focusText}>
          <Text style={[styles.focusKicker, { color: palette.accent }]}>GENTLE FOCUS</Text>
          <Text style={[styles.focusTitle, { color: palette.ink }]}>{gentleFocus.title}</Text>
          <Text style={[styles.focusCopy, { color: palette.text }]}>{gentleFocus.copy}</Text>

          <AnimatedPressable
            onPress={() => router.push(gentleFocus.route as never)}
            style={[styles.focusButton, { backgroundColor: palette.accentSoft }]}
          >
            <Text style={[styles.focusButtonText, { color: palette.accent }]}>{gentleFocus.action}</Text>
            <Ionicons name="arrow-forward" size={17} color={palette.accent} />
          </AnimatedPressable>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Start here</Text>
      <Text style={[styles.planHint, { color: palette.text }]}>Open an item or tap the circle to mark it done.</Text>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        {planItems.map((item, index) => (
          <View
            key={item.id}
            style={[
              styles.planRow,
              index < planItems.length - 1 && { borderBottomColor: palette.line, borderBottomWidth: 1 },
            ]}
          >
            <AnimatedPressable onPress={() => router.push(item.route as never)} style={styles.planMain}>
              <View style={[styles.planIcon, { backgroundColor: item.done ? palette.accent : palette.accentSoft }]}>
                <Ionicons name={item.done ? 'checkmark' : item.icon} size={21} color={item.done ? palette.onAccent : palette.accent} />
              </View>

              <View style={styles.planText}>
                <Text style={[styles.planTitle, { color: palette.ink }]}>{item.title}</Text>
                <Text style={[styles.planDetail, { color: palette.text }]}>{item.detail}</Text>
              </View>
            </AnimatedPressable>

            {item.canMarkDone ? (
              <AnimatedPressable
                onPress={() => toggleManualDone(item.id)}
                style={[styles.doneButton, { backgroundColor: item.done ? palette.accent : palette.accentSoft }]}
              >
                <Ionicons name={item.done ? 'checkmark' : 'ellipse-outline'} size={20} color={item.done ? palette.onAccent : palette.accent} />
              </AnimatedPressable>
            ) : (
              <Ionicons name="chevron-forward" size={18} color={palette.muted} />
            )}
          </View>
        ))}
      </View>

      <View style={[styles.note, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="heart-outline" size={22} color={palette.accentStrong} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          Preggy helps you organize your day. For medical worries or urgent symptoms, contact your care team.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFF8F5',
  },
  hero: {
    borderRadius: 32,
    padding: 22,
    marginTop: 18,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekPill: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  weekPillText: {
    ...type.small,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontWeight: '900',
    opacity: 0.9,
  },
  title: {
    ...type.title,
    fontSize: 31,
    lineHeight: 36,
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 9,
    opacity: 0.9,
  },
  summary: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  cardLabel: {
    ...type.tiny,
    letterSpacing: 1.4,
    fontWeight: '900',
  },
  summaryTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 25,
    marginTop: 4,
  },
  summaryCopy: {
    ...type.small,
    marginTop: 3,
  },
  percentBadge: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  focusCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  focusIcon: {
    width: 50,
    height: 50,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusText: {
    flex: 1,
  },
  focusKicker: {
    ...type.tiny,
    letterSpacing: 1.3,
    fontWeight: '900',
  },
  focusTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 25,
    marginTop: 4,
  },
  focusCopy: {
    ...type.small,
    lineHeight: 21,
    marginTop: 6,
  },
  focusButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    borderRadius: 17,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 13,
  },
  focusButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 22,
    marginTop: 22,
    marginBottom: 12,
  },
  planHint: {
    ...type.small,
    lineHeight: 20,
    marginTop: -6,
    marginBottom: 12,
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  planRow: {
    minHeight: 78,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  planMain: {
    flex: 1,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  doneButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planIcon: {
    width: 44,
    height: 44,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planText: {
    flex: 1,
  },
  planTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  planDetail: {
    ...type.small,
    lineHeight: 20,
    marginTop: 3,
  },
  note: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  noteText: {
    ...type.small,
    flex: 1,
    lineHeight: 21,
    fontWeight: '700',
  },
});
