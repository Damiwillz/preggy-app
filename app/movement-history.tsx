import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type MovementDay = {
  dateKey: string;
  kicks: number;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function dateFromKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function formatDate(dateKey: string) {
  const parsed = dateFromKey(dateKey);

  if (Number.isNaN(parsed.getTime())) return dateKey;

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function kickStorageKey(dateKey: string) {
  return `preggy:kicks:${dateKey}`;
}

function buildRecentDates(days = 21) {
  const today = dateFromKey(todayKey());

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return date.toISOString().slice(0, 10);
  });
}

export default function MovementHistoryScreen() {
  const { palette } = useAppTheme();

  const [days, setDays] = useState<MovementDay[]>([]);
  const [loading, setLoading] = useState(true);

  const totalKicks = useMemo(() => days.reduce((sum, item) => sum + item.kicks, 0), [days]);
  const activeDays = useMemo(() => days.filter((item) => item.kicks > 0).length, [days]);
  const bestDay = useMemo(
    () => [...days].sort((a, b) => b.kicks - a.kicks)[0] ?? null,
    [days]
  );

  async function loadHistory() {
    setLoading(true);

    try {
      const dateKeys = buildRecentDates(21);
      const values = await Promise.all(
        dateKeys.map(async (dateKey) => {
          const saved = await AsyncStorage.getItem(kickStorageKey(dateKey));
          const kicks = saved ? Number.parseInt(saved, 10) : 0;

          return {
            dateKey,
            kicks: Number.isFinite(kicks) ? kicks : 0,
          };
        })
      );

      setDays(values);
    } catch (error) {
      console.log('Movement history load error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>MOVEMENT</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Movement History</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Review recent baby movement logs from your kick counter.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="footsteps-outline" size={30} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.heroLabel, { color: palette.accent }]}>LAST 21 DAYS</Text>
          <Text style={[styles.heroTitle, { color: palette.ink }]}>
            {totalKicks} total kicks
          </Text>
          <Text style={[styles.heroCopy, { color: palette.text }]}>
            {activeDays} days with movement logs.
          </Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.summaryValue, { color: palette.ink }]}>{activeDays}</Text>
          <Text style={[styles.summaryLabel, { color: palette.text }]}>Active days</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.summaryValue, { color: palette.ink }]}>
            {bestDay ? bestDay.kicks : 0}
          </Text>
          <Text style={[styles.summaryLabel, { color: palette.text }]}>Best day</Text>
        </View>
      </View>

      <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          Movement patterns can vary. Contact your care provider if you notice a worrying change.
        </Text>
      </View>

      <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.listHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>DAILY LOGS</Text>
            <Text style={[styles.listTitle, { color: palette.ink }]}>
              {loading ? 'Loading...' : 'Recent movement'}
            </Text>
          </View>

          <AnimatedPressable
            onPress={() => void loadHistory()}
            style={[styles.refreshButton, { backgroundColor: palette.accentSoft }]}
          >
            <Ionicons name="refresh" size={18} color={palette.accent} />
          </AnimatedPressable>
        </View>

        <View style={styles.dayList}>
          {days.map((item) => {
            const percent = Math.min(100, Math.round((item.kicks / Math.max(bestDay?.kicks || 1, 1)) * 100));

            return (
              <View
                key={item.dateKey}
                style={[styles.dayItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.dayTop}>
                    <Text style={[styles.dayDate, { color: palette.ink }]}>{formatDate(item.dateKey)}</Text>
                    <Text style={[styles.dayKicks, { color: palette.accent }]}>{item.kicks} kicks</Text>
                  </View>

                  <View style={[styles.track, { backgroundColor: palette.accentSoft }]}>
                    <View style={[styles.fill, { width: `${percent}%`, backgroundColor: palette.accent }]} />
                  </View>
                </View>
              </View>
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
    fontSize: 22,
    lineHeight: 27,
    marginTop: 5,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 4,
    fontWeight: '800',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    padding: 15,
  },
  summaryValue: {
    ...type.title,
    fontSize: 28,
    lineHeight: 32,
  },
  summaryLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginTop: 3,
  },
  noteCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
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
  listCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    marginTop: 5,
  },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayList: {
    gap: 10,
    marginTop: 14,
  },
  dayItem: {
    minHeight: 72,
    borderRadius: 22,
    borderWidth: 1,
    padding: 13,
    justifyContent: 'center',
  },
  dayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 9,
  },
  dayDate: {
    ...type.small,
    fontWeight: '900',
  },
  dayKicks: {
    ...type.small,
    fontWeight: '900',
  },
  track: {
    height: 9,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
