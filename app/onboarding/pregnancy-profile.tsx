import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { TextField } from '@/components/forms/TextField';
import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { updateMyProfile } from '@/services/profile';

const TOTAL_PREGNANCY_DAYS = 280;
const DAY_MS = 24 * 60 * 60 * 1000;

function getSaveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return 'Please try again in a moment.';
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDueDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  const todayAtNoon = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  const pregnancyStart = new Date(date);
  pregnancyStart.setDate(pregnancyStart.getDate() - TOTAL_PREGNANCY_DAYS);

  const elapsedDays = clampNumber(
    Math.round((todayAtNoon.getTime() - pregnancyStart.getTime()) / DAY_MS),
    0,
    TOTAL_PREGNANCY_DAYS - 1
  );

  return {
    dueDate: toDateInput(date),
    week: clampNumber(Math.floor(elapsedDays / 7) + 1, 1, 40),
    days: elapsedDays % 7,
  };
}

export default function PregnancyProfileScreen() {
  const { palette } = useAppTheme();

  const [babyNickname, setBabyNickname] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [pregnancyWeek, setPregnancyWeek] = useState('24');
  const [pregnancyDays, setPregnancyDays] = useState('0');
  const [saving, setSaving] = useState(false);

  const dueDatePreview = useMemo(() => parseDueDate(dueDate), [dueDate]);

  const previewWeek = dueDatePreview
    ? dueDatePreview.week
    : clampNumber(Number(pregnancyWeek) || 24, 1, 40);

  const previewDays = dueDatePreview
    ? dueDatePreview.days
    : clampNumber(Number(pregnancyDays) || 0, 0, 6);

  async function saveProfile() {
    const nickname = babyNickname.trim() || 'Peanut';
    const parsedDueDate = parseDueDate(dueDate);

    if (dueDate.trim() && !parsedDueDate) {
      Alert.alert('Check due date', 'Use this format: 2027-03-18');
      return;
    }

    const nextWeek = parsedDueDate
      ? parsedDueDate.week
      : clampNumber(Number(pregnancyWeek) || 24, 1, 40);

    const nextDays = parsedDueDate
      ? parsedDueDate.days
      : clampNumber(Number(pregnancyDays) || 0, 0, 6);

    try {
      setSaving(true);

      await updateMyProfile({
        baby_nickname: nickname,
        due_date: parsedDueDate?.dueDate ?? null,
        pregnancy_week: nextWeek,
        pregnancy_days: nextDays,
      });

      router.replace('/(tabs)/home' as never);
    } catch (error) {
      const message = getSaveErrorMessage(error);
      console.log('Pregnancy profile save error:', message, error);
      Alert.alert('Could not save', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen bottomSpace={48}>
      <Header title="Preggy Setup" back showAvatar={false} />

      <View style={[styles.heroCard, { backgroundColor: palette.accentSoft }]}>
        <View style={[styles.iconBubble, { backgroundColor: palette.surface }]}>
          <Ionicons name="heart" size={34} color={palette.accent} />
        </View>

        <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGNANCY PROFILE</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Personalize your journey</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Add your baby nickname and pregnancy progress so Preggy can make your home screen feel personal.
        </Text>
      </View>

      <View style={[styles.previewCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.previewIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="sparkles-outline" size={24} color={palette.accent} />
        </View>

        <View style={styles.previewTextWrap}>
          <Text style={[styles.previewLabel, { color: palette.accent }]}>TODAY</Text>
          <Text style={[styles.previewTitle, { color: palette.ink }]}>
            {babyNickname.trim() || 'Peanut'} is at week {previewWeek}
          </Text>
          <Text style={[styles.previewSubtitle, { color: palette.text }]}>
            {previewWeek} weeks and {previewDays} days
          </Text>
        </View>
      </View>

      <View style={[styles.formCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <TextField
          label="Baby nickname"
          helper="You can change this later."
          value={babyNickname}
          onChangeText={setBabyNickname}
          placeholder="Peanut"
          autoCapitalize="words"
        />

        <TextField
          label="Due date"
          helper="Optional. Use yyyy-mm-dd."
          value={dueDate}
          onChangeText={setDueDate}
          placeholder="2027-03-18"
          keyboardType="numbers-and-punctuation"
        />

        <Text style={[styles.dividerText, { color: palette.muted }]}>
          Or enter your pregnancy progress
        </Text>

        <View style={styles.row}>
          <View style={styles.rowItem}>
            <TextField
              label="Week"
              value={pregnancyWeek}
              onChangeText={setPregnancyWeek}
              placeholder="24"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.rowItem}>
            <TextField
              label="Days"
              value={pregnancyDays}
              onChangeText={setPregnancyDays}
              placeholder="0"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <AnimatedPressable
          disabled={saving}
          onPress={saveProfile}
          style={[styles.saveButton, { backgroundColor: palette.accent }]}
        >
          {saving ? (
            <ActivityIndicator color={palette.onAccent} />
          ) : (
            <>
              <Text style={[styles.saveText, { color: palette.onAccent }]}>Save and continue</Text>
              <Ionicons name="arrow-forward" size={20} color={palette.onAccent} />
            </>
          )}
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 30,
    padding: 22,
    marginTop: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  eyebrow: {
    ...type.section,
    marginBottom: 8,
  },
  title: {
    ...type.title,
    marginBottom: 8,
  },
  subtitle: {
    ...type.body,
  },
  previewCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTextWrap: {
    flex: 1,
  },
  previewLabel: {
    ...type.tiny,
    marginBottom: 3,
  },
  previewTitle: {
    ...type.bodyStrong,
  },
  previewSubtitle: {
    ...type.small,
    marginTop: 2,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
  },
  dividerText: {
    ...type.small,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  saveButton: {
    minHeight: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  saveText: {
    ...type.bodyStrong,
  },
});
