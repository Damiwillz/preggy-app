import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

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
  const { palette } = useAppTheme();
  const params = useLocalSearchParams();

  const dueDate = getParam(params.dueDate, 'Your saved due date');
  const method = getParam(params.method, 'Pregnancy dates');
  const week = Number(getParam(params.week, '12'));
  const day = Number(getParam(params.day, '0'));
  const progress = Number(getParam(params.progress, '30'));
  const remaining = Number(getParam(params.remaining, '196'));
  const trimester = getTrimester(week);
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <Screen bottomSpace={44}>
      <Header title="Due Date Result" back />

      <View style={[styles.heroCard, { backgroundColor: palette.accent }]}>
        <Text style={styles.eyebrow}>THE BIG DAY</Text>
        <Text style={[styles.title, { color: palette.onAccent }]}>Your estimated due date is</Text>
        <Text style={[styles.date, { color: palette.onAccent }]}>{dueDate}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: palette.onAccent }]}>{trimester}</Text>
          </View>

          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: palette.onAccent }]}>{method}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.progressCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.progressTop}>
          <View>
            <Text style={[styles.section, { color: palette.accent }]}>YOUR JOURNEY</Text>
            <Text style={[styles.strong, { color: palette.ink }]}>Week {week}, Day {day}</Text>
          </View>

          <View style={[styles.percentCircle, { backgroundColor: palette.accentSoft }]}>
            <Text style={[styles.percent, { color: palette.accent }]}>{progress}%</Text>
          </View>
        </View>

        <View style={[styles.progressBar, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.progressFill, { width: `${safeProgress}%`, backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.split}>
          <Text style={[styles.copy, { color: palette.text }]}>Week 1</Text>
          <Text style={[styles.copy, { color: palette.text }]}>{remaining} days remaining</Text>
          <Text style={[styles.copy, { color: palette.text }]}>Week 40</Text>
        </View>
      </View>

      <Text style={[styles.heading, { color: palette.ink }]}>Next steps</Text>

      {[
        {
          icon: 'calendar-outline',
          title: 'Book or confirm your next visit',
          copy: 'Keep your prenatal appointment schedule up to date.',
        },
        {
          icon: 'nutrition-outline',
          title: 'Keep taking prenatal vitamins',
          copy: 'Follow your clinician’s supplement guidance.',
        },
        {
          icon: 'heart-outline',
          title: 'Track how you feel',
          copy: 'Log symptoms, mood, and changes as your journey continues.',
        },
      ].map((step) => (
        <View key={step.title} style={[styles.step, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.icon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name={step.icon as keyof typeof Ionicons.glyphMap} size={23} color={palette.accent} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.stepTitle, { color: palette.ink }]}>{step.title}</Text>
            <Text style={[styles.stepCopy, { color: palette.text }]}>{step.copy}</Text>
          </View>
        </View>
      ))}

      <View style={styles.actionRow}>
        <AnimatedPressable
          onPress={() => router.push('/(tabs)/home' as never)}
          style={[styles.primaryButton, { backgroundColor: palette.accent }]}
        >
          <Text style={[styles.primaryButtonText, { color: palette.onAccent }]}>Go to dashboard</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.back()}
          style={[styles.secondaryButton, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}
        >
          <Text style={[styles.secondaryButtonText, { color: palette.accentStrong }]}>Recalculate</Text>
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginTop: 16,
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
    textAlign: 'center',
    marginTop: 10,
  },
  date: {
    ...type.title,
    fontSize: 36,
    lineHeight: 42,
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
    fontWeight: '900',
  },
  progressCard: {
    marginTop: 16,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'center',
  },
  section: {
    ...type.section,
  },
  strong: {
    ...type.title,
    fontSize: 25,
    marginTop: 5,
  },
  percentCircle: {
    width: 62,
    height: 62,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  progressBar: {
    height: 13,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 18,
  },
  progressFill: {
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
    fontWeight: '900',
  },
  heading: {
    ...type.title,
    fontSize: 25,
    marginTop: 26,
    marginBottom: 12,
  },
  step: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    ...type.bodyStrong,
  },
  stepCopy: {
    ...type.small,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...type.bodyStrong,
  },
  secondaryButton: {
    flex: 1,
    height: 58,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...type.bodyStrong,
  },
});
