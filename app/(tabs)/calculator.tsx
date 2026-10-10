import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TextField } from '@/components/forms/TextField';
import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { updateMyProfile } from '@/services/profile';

type CalculationMethod = 'period' | 'conception' | 'ivf';

const methods: {
  id: CalculationMethod;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  shortTitle: string;
  copy: string;
}[] = [
  {
    id: 'period',
    icon: 'calendar-outline',
    title: 'Last period',
    shortTitle: 'Period',
    copy: 'The most commonly used method',
  },
  {
    id: 'conception',
    icon: 'heart-outline',
    title: 'Conception date',
    shortTitle: 'Conception',
    copy: 'Use when the date is known',
  },
  {
    id: 'ivf',
    icon: 'medical-outline',
    title: 'IVF transfer',
    shortTitle: 'IVF',
    copy: 'Use your embryo transfer date',
  },
];

function parseDate(value: string) {
  const clean = value.trim();
  const parts = clean.split('/');

  if (parts.length !== 3) {
    return null;
  }

  const month = Number(parts[0]);
  const day = Number(parts[1]);
  const year = Number(parts[2]);

  if (
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(year) ||
    year < 1900 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

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

  today.setHours(12, 0, 0, 0);

  const normalizedPeriod = new Date(lastPeriodDate);
  normalizedPeriod.setHours(12, 0, 0, 0);

  const difference =
    today.getTime() - normalizedPeriod.getTime();

  const totalDays = Math.max(
    0,
    Math.floor(difference / 86400000)
  );

  return {
    pregnancyWeek: Math.min(40, Math.floor(totalDays / 7)),
    pregnancyDays: totalDays % 7,
    progress: Math.min(
      100,
      Math.max(0, Math.round((totalDays / 280) * 100))
    ),
    daysRemaining: Math.max(0, 280 - totalDays),
  };
}

export default function CalculatorScreen() {
  const params = useLocalSearchParams<{
    fromTools?: string;
  }>();

  const fromTools = params.fromTools === '1';
  const { palette } = useAppTheme();

  const [method, setMethod] =
    useState<CalculationMethod>('period');
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [conceptionDate, setConceptionDate] = useState('');
  const [ivfTransferDate, setIvfTransferDate] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedMethod =
    methods.find((item) => item.id === method) ?? methods[0];

  async function calculateDueDate() {
    try {
      let dueDate: Date | null = null;
      let estimatedLastPeriod: Date | null = null;
      let methodLabel = '';

      if (method === 'period') {
        const lastPeriodValue = parseDate(lastPeriod);
        const cycleDays = Number(cycleLength.trim()) || 28;

        if (!lastPeriodValue) {
          Alert.alert(
            'Check the date',
            'Enter the first day of your last period using mm/dd/yyyy.'
          );
          return;
        }

        if (cycleDays < 21 || cycleDays > 45) {
          Alert.alert(
            'Check cycle length',
            'Enter a cycle length between 21 and 45 days.'
          );
          return;
        }

        dueDate = addDays(
          lastPeriodValue,
          280 + (cycleDays - 28)
        );

        estimatedLastPeriod = lastPeriodValue;
        methodLabel = 'Last period date';
      }

      if (method === 'conception') {
        const conceptionValue = parseDate(conceptionDate);

        if (!conceptionValue) {
          Alert.alert(
            'Check the date',
            'Enter the conception date using mm/dd/yyyy.'
          );
          return;
        }

        dueDate = addDays(conceptionValue, 266);
        estimatedLastPeriod = addDays(conceptionValue, -14);
        methodLabel = 'Conception date';
      }

      if (method === 'ivf') {
        const ivfValue = parseDate(ivfTransferDate);

        if (!ivfValue) {
          Alert.alert(
            'Check the date',
            'Enter the IVF transfer date using mm/dd/yyyy.'
          );
          return;
        }

        dueDate = addDays(ivfValue, 263);
        estimatedLastPeriod = addDays(ivfValue, -17);
        methodLabel = 'IVF transfer date';
      }

      if (!dueDate || !estimatedLastPeriod) {
        return;
      }

      if (estimatedLastPeriod.getTime() > Date.now()) {
        Alert.alert(
          'Check the date',
          'The date cannot be in the future.'
        );
        return;
      }

      setSaving(true);

      const progress =
        getPregnancyProgress(estimatedLastPeriod);

      await updateMyProfile({
        due_date: toIsoDate(dueDate),
        pregnancy_week: progress.pregnancyWeek,
        pregnancy_days: progress.pregnancyDays,
      });

      router.push({
        pathname: '/calculator/result',
        params: {
          dueDate: formatDate(dueDate),
          dueDateIso: toIsoDate(dueDate),
          week: String(progress.pregnancyWeek),
          day: String(progress.pregnancyDays),
          progress: String(progress.progress),
          remaining: String(progress.daysRemaining),
          method: methodLabel,
        },
      } as never);
    } catch (error) {
      console.log('Due date calculation error:', error);

      Alert.alert(
        'Could not calculate',
        'Please check your information and try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen bottomSpace={fromTools ? 55 : 115}>
      <Header
        title={fromTools ? 'Due Date' : 'Preggy'}
        back={fromTools}
      />

      <View style={styles.intro}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          YOUR PREGNANCY TIMELINE
        </Text>

        <Text style={[styles.title, { color: palette.ink }]}>
          When might baby arrive?
        </Text>

        <Text style={[styles.subtitle, { color: palette.text }]}>
          Choose the date you know best and we’ll estimate your
          pregnancy timeline.
        </Text>
      </View>

      <LinearGradient
        colors={[
          palette.accentSoft,
          palette.softSurface,
          palette.surface,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.hero,
          { borderColor: palette.line },
        ]}
      >
        <View
          style={[
            styles.heroOrbLarge,
            {
              backgroundColor: palette.accent,
              opacity: palette.isDark ? 0.1 : 0.08,
            },
          ]}
        />

        <Image
          source={require('../../assets/images/home-foetus.png')}
          style={styles.heroImage}
          resizeMode="contain"
        />

        <View style={styles.heroContent}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: palette.surface },
            ]}
          >
            <Ionicons
              name="calendar-clear-outline"
              size={25}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.heroLabel, { color: palette.accent }]}>
            ESTIMATED JOURNEY
          </Text>

          <Text style={[styles.heroTitle, { color: palette.ink }]}>
            40 weeks
          </Text>

          <Text style={[styles.heroCopy, { color: palette.text }]}>
            Your result will be saved to your profile and used
            throughout Preggy.
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            STEP 1
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.ink }]}>
            Choose a method
          </Text>
        </View>
      </View>

      <View style={styles.methodRow}>
        {methods.map((item) => {
          const active = method === item.id;

          return (
            <AnimatedPressable
              key={item.id}
              onPress={() => setMethod(item.id)}
              style={[
                styles.methodCard,
                {
                  backgroundColor: active
                    ? palette.accent
                    : palette.surface,
                  borderColor: active
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <View
                style={[
                  styles.methodIcon,
                  {
                    backgroundColor: active
                      ? 'rgba(255,255,255,0.18)'
                      : palette.accentSoft,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={21}
                  color={active ? '#FFFFFF' : palette.accent}
                />
              </View>

              <Text
                style={[
                  styles.methodTitle,
                  { color: active ? '#FFFFFF' : palette.ink },
                ]}
              >
                {item.shortTitle}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View
        style={[
          styles.formCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.formHeader}>
          <View
            style={[
              styles.formNumber,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Text
              style={[
                styles.formNumberText,
                { color: palette.accent },
              ]}
            >
              2
            </Text>
          </View>

          <View style={styles.formHeaderText}>
            <Text style={[styles.formTitle, { color: palette.ink }]}>
              {selectedMethod.title}
            </Text>

            <Text style={[styles.formCopy, { color: palette.text }]}>
              {selectedMethod.copy}
            </Text>
          </View>
        </View>

        {method === 'period' ? (
          <>
            <TextField
              label="First day of last period"
              helper="Enter the first day, not the last day"
              placeholder="mm/dd/yyyy"
              value={lastPeriod}
              onChangeText={setLastPeriod}
              keyboardType="numbers-and-punctuation"
            />

            <TextField
              label="Average cycle length"
              helper="Most cycles are between 21 and 35 days"
              placeholder="28"
              value={cycleLength}
              onChangeText={setCycleLength}
              keyboardType="number-pad"
            />
          </>
        ) : null}

        {method === 'conception' ? (
          <TextField
            label="Conception date"
            helper="Use this only when the date is known"
            placeholder="mm/dd/yyyy"
            value={conceptionDate}
            onChangeText={setConceptionDate}
            keyboardType="numbers-and-punctuation"
          />
        ) : null}

        {method === 'ivf' ? (
          <TextField
            label="IVF transfer date"
            helper="Use the date provided by your fertility clinic"
            placeholder="mm/dd/yyyy"
            value={ivfTransferDate}
            onChangeText={setIvfTransferDate}
            keyboardType="numbers-and-punctuation"
          />
        ) : null}

        <AnimatedPressable
          onPress={() => void calculateDueDate()}
          disabled={saving}
          style={[
            styles.calculateButton,
            { backgroundColor: palette.accent },
          ]}
        >
          <Ionicons
            name="sparkles-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.calculateText}>
            {saving
              ? 'Calculating...'
              : 'Calculate my due date'}
          </Text>

          {!saving ? (
            <Ionicons
              name="arrow-forward"
              size={19}
              color="#FFFFFF"
            />
          ) : null}
        </AnimatedPressable>
      </View>

      <View
        style={[
          styles.informationCard,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="information-circle-outline"
          size={23}
          color={palette.accent}
        />

        <Text
          style={[
            styles.informationText,
            { color: palette.text },
          ]}
        >
          Due dates are estimates. Your healthcare professional may
          adjust your date using scans and clinical information.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: 12,
    marginBottom: 18,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.25,
  },
  title: {
    ...type.hero,
    fontSize: 35,
    lineHeight: 42,
    letterSpacing: -1,
    marginTop: 5,
  },
  subtitle: {
    ...type.body,
    marginTop: 8,
    maxWidth: 350,
  },
  hero: {
    minHeight: 240,
    borderRadius: 32,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    right: -90,
    top: -30,
  },
  heroImage: {
    position: 'absolute',
    width: 235,
    height: 235,
    right: -30,
    bottom: -25,
    opacity: 0.63,
  },
  heroContent: {
    width: '62%',
    zIndex: 2,
  },
  heroIcon: {
    width: 49,
    height: 49,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 19,
  },
  heroLabel: {
    ...type.section,
  },
  heroTitle: {
    ...type.hero,
    fontSize: 36,
    lineHeight: 43,
    marginTop: 3,
  },
  heroCopy: {
    ...type.small,
    marginTop: 6,
    lineHeight: 19,
  },
  sectionHeader: {
    marginTop: 28,
    marginBottom: 13,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 3,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 9,
  },
  methodCard: {
    flex: 1,
    minHeight: 105,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  methodIcon: {
    width: 41,
    height: 41,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    ...type.small,
    marginTop: 10,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 29,
    padding: 18,
    marginTop: 14,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  formNumber: {
    width: 45,
    height: 45,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formNumberText: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  formHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  formTitle: {
    ...type.bodyStrong,
    fontSize: 18,
  },
  formCopy: {
    ...type.small,
    marginTop: 2,
  },
  calculateButton: {
    minHeight: 59,
    borderRadius: 19,
    marginTop: 3,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  calculateText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  informationCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 15,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  informationText: {
    ...type.small,
    flex: 1,
    marginLeft: 10,
    lineHeight: 19,
  },
});
