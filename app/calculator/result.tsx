import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

function getParam(value: string | string[] | undefined, fallback: string) {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

function getTrimester(week: number) {
  if (week <= 13) return 'Trimester 1';
  if (week <= 27) return 'Trimester 2';
  return 'Trimester 3';
}

export default function DueDateResultScreen() {
  const params = useLocalSearchParams();

  const dueDate = getParam(params.dueDate, 'Your saved due date');
  const method = getParam(params.method, 'Pregnancy dates');
  const week = Number(getParam(params.week, '12'));
  const day = Number(getParam(params.day, '0'));
  const progress = Number(getParam(params.progress, '30'));
  const remaining = Number(getParam(params.remaining, '196'));
  const trimester = getTrimester(week);

  return (
    <Screen bottomSpace={44}>
      <Header title="Due Date Result" back />

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>THE BIG DAY</Text>
        <Text style={styles.title}>Your estimated due date is</Text>
        <Text style={styles.date}>{dueDate}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{trimester}</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{method}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <View>
            <Text style={styles.section}>YOUR JOURNEY</Text>
            <Text style={styles.strong}>Week {week}, Day {day}</Text>
          </View>

          <View style={styles.percentCircle}>
            <Text style={styles.percent}>{progress}%</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress))}%` }]} />
        </View>

        <View style={styles.split}>
          <Text style={styles.copy}>Week 1</Text>
          <Text style={styles.copy}>{remaining} days remaining</Text>
          <Text style={styles.copy}>Week 40</Text>
        </View>
      </View>

      <Text style={styles.heading}>Next steps</Text>

      <View style={styles.step}>
        <View style={styles.icon}>
          <Ionicons name="calendar-outline" size={23} color={colors.plum} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>Book or confirm your next visit</Text>
          <Text style={styles.stepCopy}>Keep your prenatal appointment schedule up to date.</Text>
        </View>
      </View>

      <View style={styles.step}>
        <View style={styles.icon}>
          <Ionicons name="nutrition-outline" size={23} color={colors.plum} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>Keep taking prenatal vitamins</Text>
          <Text style={styles.stepCopy}>Follow your clinician’s supplement guidance.</Text>
        </View>
      </View>

      <View style={styles.step}>
        <View style={styles.icon}>
          <Ionicons name="heart-outline" size={23} color={colors.plum} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>Track how you feel</Text>
          <Text style={styles.stepCopy}>Log symptoms, mood, and changes as your journey continues.</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <AnimatedPressable onPress={() => router.push('/(tabs)/home' as never)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Go to dashboard</Text>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.back()} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Recalculate</Text>
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginTop: 16,
    backgroundColor: '#CE6F79',
    borderRadius: 34,
    padding: 24,
    minHeight: 255,
    justifyContent: 'center',
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  title: {
    ...type.bodyStrong,
    color: '#FFF4F5',
    textAlign: 'center',
    marginTop: 10,
  },
  date: {
    ...type.title,
    fontSize: 36,
    lineHeight: 42,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    ...type.tiny,
    color: '#fff',
    fontWeight: '900',
  },
  progressCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'center',
  },
  section: {
    ...type.section,
    color: '#CE6F79',
  },
  strong: {
    ...type.title,
    color: colors.ink,
    fontSize: 25,
    marginTop: 5,
  },
  percentCircle: {
    width: 62,
    height: 62,
    borderRadius: 23,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    ...type.bodyStrong,
    color: '#CE6F79',
    fontSize: 17,
  },
  progressBar: {
    height: 13,
    borderRadius: 999,
    backgroundColor: '#FFF0F1',
    overflow: 'hidden',
    marginTop: 18,
  },
  progressFill: {
    backgroundColor: '#CE6F79',
    height: '100%',
    borderRadius: 999,
  },
  split: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
    gap: 8,
  },
  copy: {
    ...type.tiny,
    color: colors.text,
    fontWeight: '900',
  },
  heading: {
    ...type.title,
    color: colors.ink,
    fontSize: 25,
    marginTop: 26,
    marginBottom: 12,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 12,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 20,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  stepCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 3,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1.2,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...type.bodyStrong,
    color: '#fff',
  },
  secondaryButton: {
    flex: 1,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#FFF0F1',
    borderWidth: 1,
    borderColor: '#EFDCDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...type.bodyStrong,
    color: colors.plum,
  },
});
