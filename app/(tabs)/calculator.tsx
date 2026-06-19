import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { TextField } from '@/components/forms/TextField';
import { Button } from '@/components/ui/Button';
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

      if (ivfValue) {
        dueDate = addDays(ivfValue, 263);
        estimatedLastPeriod = addDays(ivfValue, -17);
      } else if (conceptionValue) {
        dueDate = addDays(conceptionValue, 266);
        estimatedLastPeriod = addDays(conceptionValue, -14);
      } else if (lastPeriodValue) {
        dueDate = addDays(lastPeriodValue, 280 + (cycleDays - 28));
        estimatedLastPeriod = lastPeriodValue;
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

      Alert.alert(
        'Due date saved',
        `Your estimated due date is ${formatDate(dueDate)}.`,
        [
          {
            text: 'View profile',
            onPress: () => router.push('/(tabs)/profile'),
          },
        ]
      );
    } catch {
      Alert.alert('Could not calculate', 'Please check your dates and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header title="Calculator" />

      <Text style={styles.eyebrow}>PLANNING AHEAD</Text>
      <Text style={styles.title}>Find your magic date</Text>
      <Text style={styles.intro}>
        Fill in your details below to estimate your pregnancy timeline. All dates are calculated
        based on standard medical formulas.
      </Text>

      <Card style={styles.form}>
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

        <Button
          label={saving ? 'Saving...' : 'Calculate Due Date'}
          onPress={calculateDueDate}
          style={{ marginTop: 6 }}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...type.section,
    color: colors.rose,
    marginTop: 28,
  },
  title: {
    ...type.hero,
    color: colors.ink,
    marginTop: 6,
  },
  intro: {
    ...type.body,
    color: colors.text,
    marginTop: 12,
    marginBottom: 22,
  },
  form: {
    paddingTop: 22,
  },
});