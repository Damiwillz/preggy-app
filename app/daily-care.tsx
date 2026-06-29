import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const dailyCareItems = [
  {
    key: 'vitamin',
    icon: 'medkit-outline',
    title: 'Prenatal vitamin',
    copy: 'Keep your care routine steady.',
  },
  {
    key: 'symptoms',
    icon: 'heart-circle-outline',
    title: 'Log symptoms',
    copy: 'Capture mood, symptoms, or notes.',
  },
  {
    key: 'appointment',
    icon: 'calendar-outline',
    title: 'Check appointment',
    copy: 'Review your next care visit.',
  },
  {
    key: 'movement',
    icon: 'walk-outline',
    title: 'Gentle movement',
    copy: 'A short walk or stretch if you feel well.',
  },
  {
    key: 'tip',
    icon: 'sparkles-outline',
    title: 'Read one tip',
    copy: 'Learn one helpful thing today.',
  },
] as const;

type DailyCareKey = (typeof dailyCareItems)[number]['key'];

const WATER_TARGET = 8;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateStrip() {
  const today = new Date();

  return [-2, -1, 0, 1, 2].map((offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    return {
      key: toDateKey(date),
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toLocaleDateString('en-US', { day: '2-digit' }),
      isToday: offset === 0,
    };
  });
}

function getChecklistStorageKey(dateKey: string) {
  return `preggy:daily-care:${dateKey}`;
}

function getWaterStorageKey(dateKey: string) {
  return `preggy:water-cups:${dateKey}`;
}

export default function DailyCareScreen() {
  const { palette } = useAppTheme();

  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [completedCare, setCompletedCare] = useState<DailyCareKey[]>([]);
  const [waterCups, setWaterCups] = useState(0);

  const dateStrip = useMemo(() => buildDateStrip(), []);
  const completedCareCount = completedCare.length;
  const careProgress = Math.round((completedCareCount / dailyCareItems.length) * 100);
  const waterProgress = Math.round((waterCups / WATER_TARGET) * 100);
  const totalProgress = Math.round(((completedCareCount + waterCups) / (dailyCareItems.length + WATER_TARGET)) * 100);

  useEffect(() => {
    let active = true;

    async function loadDailyCare() {
      try {
        const savedCare = await AsyncStorage.getItem(getChecklistStorageKey(selectedDateKey));
        const parsedCare = savedCare ? (JSON.parse(savedCare) as DailyCareKey[]) : [];

        const savedWater = await AsyncStorage.getItem(getWaterStorageKey(selectedDateKey));
        const parsedWater = savedWater ? Number.parseInt(savedWater, 10) : 0;

        if (active) {
          setCompletedCare(Array.isArray(parsedCare) ? parsedCare : []);
          setWaterCups(Number.isFinite(parsedWater) ? Math.min(Math.max(parsedWater, 0), WATER_TARGET) : 0);
        }
      } catch (error) {
        console.log('Daily care load error:', error);
        if (active) {
          setCompletedCare([]);
          setWaterCups(0);
        }
      }
    }

    void loadDailyCare();

    return () => {
      active = false;
    };
  }, [selectedDateKey]);

  async function toggleCareItem(key: DailyCareKey) {
    setCompletedCare((current) => {
      const next = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];

      AsyncStorage.setItem(getChecklistStorageKey(selectedDateKey), JSON.stringify(next)).catch((error) => {
        console.log('Daily care save error:', error);
      });

      return next;
    });
  }

  async function updateWaterCups(nextValue: number) {
    const next = Math.min(Math.max(nextValue, 0), WATER_TARGET);
    setWaterCups(next);

    try {
      await AsyncStorage.setItem(getWaterStorageKey(selectedDateKey), String(next));
    } catch (error) {
      console.log('Water tracker save error:', error);
    }
  }

  return (
    <Screen bottomSpace={120}>
      <Header />

      <View style={styles.topRow}>
        <AnimatedPressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="chevron-back" size={22} color={palette.ink} />
        </AnimatedPressable>

        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>DAILY WELLNESS</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Today’s Care</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Checklist, hydration, and gentle daily support.
          </Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        {dateStrip.map((item) => {
          const active = selectedDateKey === item.key;

          return (
            <AnimatedPressable
              key={item.key}
              onPress={() => setSelectedDateKey(item.key)}
              style={[
                styles.dateChip,
                {
                  backgroundColor: active ? palette.accent : palette.surface,
                  borderColor: active ? palette.accent : palette.line,
                },
              ]}
            >
              <Text style={[styles.dateDay, { color: active ? palette.onAccent : palette.text }]}>
                {item.isToday ? 'Today' : item.day}
              </Text>
              <Text style={[styles.dateNumber, { color: active ? palette.onAccent : palette.ink }]}>
                {item.date}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
        <View style={styles.heroBlobOne} />
        <View style={styles.heroBlobTwo} />

        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroLabel, { color: palette.onAccent }]}>TODAY’S PROGRESS</Text>
            <Text style={[styles.heroTitle, { color: palette.onAccent }]}>{totalProgress}% complete</Text>
          </View>

          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>🤰</Text>
          </View>
        </View>

        <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
          {completedCareCount}/{dailyCareItems.length} care items • {waterCups}/{WATER_TARGET} cups of water
        </Text>

        <View style={styles.heroTrack}>
          <View style={[styles.heroFill, { width: `${totalProgress}%` }]} />
        </View>
      </View>

      <View style={[styles.waterCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.waterHeader}>
          <View style={[styles.waterIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="water-outline" size={28} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>WATER INTAKE</Text>
            <Text style={[styles.cardTitle, { color: palette.ink }]}>{waterCups}/{WATER_TARGET} cups</Text>
            <Text style={[styles.cardCopy, { color: palette.text }]}>Tap a cup or use the buttons below.</Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.fill, { width: `${waterProgress}%`, backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.waterGrid}>
          {Array.from({ length: WATER_TARGET }).map((_, index) => {
            const active = index < waterCups;

            return (
              <AnimatedPressable
                key={index}
                onPress={() => updateWaterCups(index + 1)}
                style={[
                  styles.waterCup,
                  {
                    backgroundColor: active ? palette.accent : palette.canvas,
                    borderColor: active ? palette.accent : palette.line,
                  },
                ]}
              >
                <Ionicons
                  name={active ? 'water' : 'water-outline'}
                  size={20}
                  color={active ? palette.onAccent : palette.accent}
                />
              </AnimatedPressable>
            );
          })}
        </View>

        <View style={styles.waterActions}>
          <AnimatedPressable
            onPress={() => updateWaterCups(waterCups - 1)}
            style={[styles.waterButton, { backgroundColor: palette.canvas, borderColor: palette.line }]}
          >
            <Ionicons name="remove" size={20} color={palette.ink} />
            <Text style={[styles.waterButtonText, { color: palette.ink }]}>Remove</Text>
          </AnimatedPressable>

          <AnimatedPressable
            onPress={() => updateWaterCups(waterCups + 1)}
            style={[
              styles.waterButton,
              {
                backgroundColor: waterCups >= WATER_TARGET ? palette.accentSoft : palette.accent,
                borderColor: waterCups >= WATER_TARGET ? palette.accentSoft : palette.accent,
              },
            ]}
          >
            <Ionicons name="add" size={20} color={waterCups >= WATER_TARGET ? palette.accent : palette.onAccent} />
            <Text style={[styles.waterButtonText, { color: waterCups >= WATER_TARGET ? palette.accent : palette.onAccent }]}>
              Add cup
            </Text>
          </AnimatedPressable>
        </View>
      </View>

      <View style={[styles.careCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>CARE CHECKLIST</Text>
            <Text style={[styles.cardTitle, { color: palette.ink }]}>
              {completedCareCount}/{dailyCareItems.length} completed
            </Text>
          </View>

          <View style={[styles.percentBadge, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.percentText, { color: palette.accent }]}>{careProgress}%</Text>
          </View>
        </View>

        <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.fill, { width: `${careProgress}%`, backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.careList}>
          {dailyCareItems.map((item) => {
            const done = completedCare.includes(item.key);

            return (
              <AnimatedPressable
                key={item.key}
                onPress={() => toggleCareItem(item.key)}
                style={[
                  styles.careItem,
                  {
                    backgroundColor: done ? palette.accentSoft : palette.canvas,
                    borderColor: done ? palette.accent : palette.line,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkCircle,
                    {
                      backgroundColor: done ? palette.accent : palette.surface,
                      borderColor: done ? palette.accent : palette.line,
                    },
                  ]}
                >
                  <Ionicons
                    name={done ? 'checkmark' : item.icon}
                    size={19}
                    color={done ? palette.onAccent : palette.accent}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: palette.ink }]}>{item.title}</Text>
                  <Text style={[styles.itemCopy, { color: palette.text }]}>{item.copy}</Text>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    marginTop: 18,
    marginBottom: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  dateRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 14,
  },
  dateChip: {
    width: 64,
    height: 72,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDay: {
    ...type.tiny,
    fontWeight: '900',
  },
  dateNumber: {
    ...type.bodyStrong,
    fontSize: 16,
    marginTop: 4,
  },
  heroCard: {
    minHeight: 190,
    borderRadius: 34,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 22,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  heroBlobOne: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255,255,255,0.16)',
    right: -80,
    top: -90,
  },
  heroBlobTwo: {
    position: 'absolute',
    width: 155,
    height: 155,
    borderRadius: 78,
    backgroundColor: 'rgba(255,255,255,0.13)',
    left: -45,
    bottom: -60,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.2,
    opacity: 0.86,
  },
  heroTitle: {
    ...type.title,
    fontSize: 31,
    lineHeight: 36,
    letterSpacing: -0.8,
    marginTop: 5,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '900',
    opacity: 0.9,
    marginTop: 18,
  },
  heroTrack: {
    height: 11,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.26)',
    marginTop: 12,
  },
  heroFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  waterCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  waterIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  cardTitle: {
    ...type.title,
    fontSize: 25,
    lineHeight: 30,
    marginTop: 5,
  },
  cardCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 5,
    fontWeight: '800',
  },
  track: {
    height: 11,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 16,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  waterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 16,
  },
  waterCup: {
    width: 44,
    height: 44,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  waterButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waterButtonText: {
    ...type.small,
    fontWeight: '900',
  },
  careCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  percentBadge: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  careList: {
    gap: 10,
    marginTop: 16,
  },
  careItem: {
    minHeight: 74,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkCircle: {
    width: 42,
    height: 42,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    ...type.bodyStrong,
    fontSize: 15,
  },
  itemCopy: {
    ...type.tiny,
    lineHeight: 17,
    marginTop: 3,
    fontWeight: '800',
  },
});
