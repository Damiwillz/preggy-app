import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { TextField } from '@/components/forms/TextField';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { updateMyProfile } from '@/services/profile';

function parseDate(value: string) {
  const clean = value.trim();

  if (!clean) return null;

  const parts = clean.split('/');

  if (parts.length !== 3) return null;

  const month = Number(parts[0]);
  const day = Number(parts[1]);
  const year = Number(parts[2]);

  if (!month || !day || !year) return null;

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getPregnancyProgress(lastPeriodDate: Date) {
  const today = new Date();
  const difference = today.getTime() - lastPeriodDate.getTime();
  const totalDays = Math.max(0, Math.floor(difference / 86400000));

  return {
    pregnancy_week: Math.floor(totalDays / 7),
    pregnancy_days: totalDays % 7,
    pregnancy_day: totalDays,
    progress: Math.min(100, Math.max(0, Math.round((totalDays / 280) * 100))),
    days_remaining: Math.max(0, 280 - totalDays),
  };
}

export default function CalculatorScreen() {
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [conceptionDate, setConceptionDate] = useState('');
  const [ivfTransferDate, setIvfTransferDate] = useState('');
  const [saving, setSaving] = useState(false);

  const calculateDueDate = async () => {
    try {
      const lastPeriodValue = parseDate(lastPeriod);
      const conceptionValue = parseDate(conceptionDate);
      const ivfValue = parseDate(ivfTransferDate);
      const cycleDays = Number(cycleLength.trim()) || 28;

      let dueDate: Date | null = null;
      let estimatedLastPeriod: Date | null = null;
      let method = '';

      if (ivfValue) {
        dueDate = addDays(ivfValue, 263);
        estimatedLastPeriod = addDays(ivfValue, -17);
        method = 'IVF transfer date';
      } else if (conceptionValue) {
        dueDate = addDays(conceptionValue, 266);
        estimatedLastPeriod = addDays(conceptionValue, -14);
        method = 'Conception date';
      } else if (lastPeriodValue) {
        dueDate = addDays(lastPeriodValue, 280 + (cycleDays - 28));
        estimatedLastPeriod = lastPeriodValue;
        method = 'Last period date';
      }

      if (!dueDate || !estimatedLastPeriod) {
        Alert.alert(
          'Date needed',
          'Enter your last period date, conception date, or IVF transfer date using mm/dd/yyyy.'
        );
        return;
      }

      setSaving(true);

      const progress = getPregnancyProgress(estimatedLastPeriod);

      await updateMyProfile({
        due_date: toIsoDate(dueDate),
        pregnancy_week: progress.pregnancy_week,
        pregnancy_days: progress.pregnancy_days,
      });

      router.push({
        pathname: '/calculator/result',
        params: {
          dueDate: formatDate(dueDate),
          dueDateIso: toIsoDate(dueDate),
          week: String(progress.pregnancy_week),
          day: String(progress.pregnancy_days),
          progress: String(progress.progress),
          remaining: String(progress.days_remaining),
          method,
        },
      } as never);
    } catch {
      Alert.alert('Could not calculate', 'Please check your dates and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen bottomSpace={44}>
      <Header title="Due Date Calculator" />

      <View style={styles.hero}>
        <Image source={require('../../assets/images/week12-baby.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <View style={styles.heroShade} />

        <View style={styles.heroText}>
          <Text style={styles.eyebrow}>PLANNING AHEAD</Text>
          <Text style={styles.title}>Find your estimated due date</Text>
          <Text style={styles.intro}>
            Choose the detail you know best. Preggy will save your timeline to your profile.
          </Text>
        </View>
      </View>

      <View style={styles.tipCard}>
        <View style={styles.tipIcon}>
          <Ionicons name="calendar-outline" size={22} color={colors.plum} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Use one method</Text>
          <Text style={styles.tipCopy}>
            Last period is most common. Use conception or IVF date only if you know it.
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        <TextField
          label="First day of last period"
          helper="The start of your last menstrual cycle"
          placeholder="mm/dd/yyyy"
          value={lastPeriod}
          onChangeText={setLastPeriod}
          keyboardType="numbers-and-punctuation"
        />

        <TextField
          label="Average cycle length"
          helper="Usually between 21 and 35 days"
          placeholder="28 days"
          value={cycleLength}
          onChangeText={setCycleLength}
          keyboardType="number-pad"
        />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        <TextField
          label="Conception date"
          placeholder="mm/dd/yyyy"
          value={conceptionDate}
          onChangeText={setConceptionDate}
          keyboardType="numbers-and-punctuation"
        />

        <TextField
          label="IVF transfer date"
          placeholder="mm/dd/yyyy"
          value={ivfTransferDate}
          onChangeText={setIvfTransferDate}
          keyboardType="numbers-and-punctuation"
        />

        <AnimatedPressable
          onPress={calculateDueDate}
          disabled={saving}
          style={[styles.calculateButton, saving && { opacity: 0.7 }]}
        >
          <Ionicons name="sparkles-outline" size={21} color="#fff" />
          <Text style={styles.calculateText}>{saving ? 'Saving...' : 'Calculate and save'}</Text>
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 285,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginTop: 14,
    backgroundColor: '#FFF0F1',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(42,20,27,0.45)',
  },
  heroText: {
    padding: 24,
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    ...type.title,
    fontSize: 31,
    lineHeight: 36,
    color: '#fff',
    marginTop: 7,
  },
  intro: {
    ...type.body,
    color: '#FFF4F5',
    marginTop: 8,
    lineHeight: 23,
  },
  tipCard: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 19,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  tipCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 3,
    lineHeight: 20,
    fontWeight: '700',
  },
  form: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  dividerText: {
    ...type.tiny,
    color: colors.muted,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  calculateButton: {
    marginTop: 4,
    height: 58,
    borderRadius: 22,
    backgroundColor: '#CE6F79',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  calculateText: {
    ...type.bodyStrong,
    color: '#fff',
  },
});
