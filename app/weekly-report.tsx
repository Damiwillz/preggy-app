import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type MoodEntry = {
  id: string;
  mood: string;
  energy: number;
  stress: number;
  sleep: number;
  note: string;
  date: string;
  createdAt: number;
};

type SleepEntry = {
  id: string;
  hours: string;
  quality: number;
  symptom: string;
  note: string;
  date: string;
  createdAt: number;
};

type WeightEntry = {
  id: string;
  weight: string;
  date: string;
  note: string;
  createdAt: number;
};

type CravingEntry = {
  id: string;
  title: string;
  category: string;
  intensity: number;
  note: string;
  favorite: boolean;
  createdAt: number;
};

type ReportData = {
  totalKicks: number;
  activeKickDays: number;
  averageWater: number;
  moodEntries: number;
  topMood: string;
  averageSleep: number;
  sleepEntries: number;
  cravings: number;
  weightLogs: number;
  latestWeight: string | null;
};

const MOOD_KEY = 'preggy:mood-tracker';
const SLEEP_KEY = 'preggy:sleep-tracker';
const WEIGHT_KEY = 'preggy:weight-tracker';
const CRAVINGS_KEY = 'preggy:cravings-tracker';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateFromKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function buildRecentDates(days = 7) {
  const today = dateFromKey(todayKey());

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return date.toISOString().slice(0, 10);
  });
}

function formatDateRange(dateKeys: string[]) {
  const last = dateFromKey(dateKeys[dateKeys.length - 1]);
  const first = dateFromKey(dateKeys[0]);

  const start = last.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const end = first.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${start} - ${end}`;
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const saved = await AsyncStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.log('Weekly report read error:', key, error);
    return fallback;
  }
}

export default function WeeklyReportScreen() {
  const { palette } = useAppTheme();

  const [report, setReport] = useState<ReportData>({
    totalKicks: 0,
    activeKickDays: 0,
    averageWater: 0,
    moodEntries: 0,
    topMood: 'None yet',
    averageSleep: 0,
    sleepEntries: 0,
    cravings: 0,
    weightLogs: 0,
    latestWeight: null,
  });

  const [loading, setLoading] = useState(true);

  const dateKeys = useMemo(() => buildRecentDates(7), []);
  const dateRange = useMemo(() => formatDateRange(dateKeys), [dateKeys]);

  async function loadReport() {
    setLoading(true);

    try {
      const kickValues = await Promise.all(
        dateKeys.map(async (dateKey) => {
          const saved = await AsyncStorage.getItem(`preggy:kicks:${dateKey}`);
          const value = saved ? Number.parseInt(saved, 10) : 0;
          return Number.isFinite(value) ? value : 0;
        })
      );

      const waterValues = await Promise.all(
        dateKeys.map(async (dateKey) => {
          const saved = await AsyncStorage.getItem(`preggy:water-cups:${dateKey}`);
          const value = saved ? Number.parseInt(saved, 10) : 0;
          return Number.isFinite(value) ? value : 0;
        })
      );

      const moods = safeArray<MoodEntry>(await readJson(MOOD_KEY, []));
      const sleeps = safeArray<SleepEntry>(await readJson(SLEEP_KEY, []));
      const weights = safeArray<WeightEntry>(await readJson(WEIGHT_KEY, []));
      const cravings = safeArray<CravingEntry>(await readJson(CRAVINGS_KEY, []));

      const recentMoods = moods.filter((entry) => dateKeys.includes(entry.date));
      const recentSleeps = sleeps.filter((entry) => dateKeys.includes(entry.date));
      const recentWeights = weights.filter((entry) => dateKeys.includes(entry.date));
      const recentCravings = cravings.filter((entry) => {
        const dateKey = new Date(entry.createdAt).toISOString().slice(0, 10);
        return dateKeys.includes(dateKey);
      });

      const moodCounts = recentMoods.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {});

      const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'None yet';

      const validSleepHours = recentSleeps
        .map((entry) => Number.parseFloat(entry.hours))
        .filter((value) => Number.isFinite(value));

      const averageSleep = validSleepHours.length
        ? validSleepHours.reduce((sum, value) => sum + value, 0) / validSleepHours.length
        : 0;

      const totalKicks = kickValues.reduce((sum, value) => sum + value, 0);
      const activeKickDays = kickValues.filter((value) => value > 0).length;
      const averageWater = waterValues.reduce((sum, value) => sum + value, 0) / dateKeys.length;

      const latestWeight = [...recentWeights].sort((a, b) => b.date.localeCompare(a.date))[0]?.weight ?? null;

      setReport({
        totalKicks,
        activeKickDays,
        averageWater,
        moodEntries: recentMoods.length,
        topMood,
        averageSleep,
        sleepEntries: recentSleeps.length,
        cravings: recentCravings.length,
        weightLogs: recentWeights.length,
        latestWeight,
      });
    } catch (error) {
      console.log('Weekly report load error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReport();
  }, []);

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>WEEKLY SUMMARY</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Weekly Report</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          A calm overview of your recent pregnancy logs.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="newspaper-outline" size={30} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.heroLabel, { color: palette.accent }]}>LAST 7 DAYS</Text>
          <Text style={[styles.heroTitle, { color: palette.ink }]}>{dateRange}</Text>
          <Text style={[styles.heroCopy, { color: palette.text }]}>
            {loading ? 'Loading your report...' : 'Based on your saved trackers.'}
          </Text>
        </View>

        <AnimatedPressable
          onPress={() => void loadReport()}
          style={[styles.refreshButton, { backgroundColor: palette.accentSoft }]}
        >
          <Ionicons name="refresh" size={18} color={palette.accent} />
        </AnimatedPressable>
      </View>

      <View style={styles.grid}>
        <ReportCard icon="water-outline" label="Water average" value={`${report.averageWater.toFixed(1)} cups`} />
        <ReportCard icon="footsteps-outline" label="Baby kicks" value={`${report.totalKicks}`} />
        <ReportCard icon="happy-outline" label="Mood checks" value={`${report.moodEntries}`} />
        <ReportCard icon="moon-outline" label="Sleep average" value={`${report.averageSleep.toFixed(1)} hrs`} />
      </View>

      <View style={[styles.insightCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>WEEKLY INSIGHTS</Text>

        <View style={styles.insightList}>
          <InsightRow icon="heart-outline" label="Most logged mood" value={report.topMood} />
          <InsightRow icon="analytics-outline" label="Movement days" value={`${report.activeKickDays}/7 days`} />
          <InsightRow icon="restaurant-outline" label="Cravings saved" value={`${report.cravings}`} />
          <InsightRow icon="scale-outline" label="Weight logs" value={report.latestWeight ? `${report.weightLogs} logs • ${report.latestWeight} kg latest` : `${report.weightLogs} logs`} />
        </View>
      </View>

      <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          This report is a personal summary from your saved app entries, not medical advice.
        </Text>
      </View>
    </Screen>
  );
}

function ReportCard({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.reportCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={[styles.reportIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={20} color={palette.accent} />
      </View>

      <Text style={[styles.reportValue, { color: palette.ink }]}>{value}</Text>
      <Text style={[styles.reportLabel, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

function InsightRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.insightRow, { backgroundColor: palette.canvas, borderColor: palette.line }]}>
      <View style={[styles.insightIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={18} color={palette.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.insightLabel, { color: palette.text }]}>{label}</Text>
        <Text style={[styles.insightValue, { color: palette.ink }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    marginTop: 18,
    marginBottom: 18,
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
  heroCard: {
    minHeight: 116,
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.1,
  },
  heroTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    lineHeight: 26,
    marginTop: 5,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  reportCard: {
    width: '48%',
    minHeight: 128,
    borderRadius: 26,
    borderWidth: 1,
    padding: 15,
  },
  reportIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  reportValue: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 25,
  },
  reportLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginTop: 4,
  },
  insightCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  insightList: {
    gap: 10,
    marginTop: 14,
  },
  insightRow: {
    minHeight: 70,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightLabel: {
    ...type.tiny,
    fontWeight: '900',
  },
  insightValue: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '900',
    marginTop: 3,
  },
  noteCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
    fontWeight: '800',
  },
});
