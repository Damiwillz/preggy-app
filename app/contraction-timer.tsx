import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type ContractionEntry = {
  id: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
};

type ContractionSession = {
  id: string;
  dateKey: string;
  entries: ContractionEntry[];
  createdAt: number;
};

const STORAGE_KEY = 'preggy:contraction-sessions';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatTimer(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatClock(value: number) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ContractionTimerScreen() {
  const { palette } = useAppTheme();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [activeStart, setActiveStart] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [entries, setEntries] = useState<ContractionEntry[]>([]);

  const averageDuration = useMemo(() => {
    if (!entries.length) return 0;
    return entries.reduce((sum, item) => sum + item.durationMs, 0) / entries.length;
  }, [entries]);

  const lastInterval = useMemo(() => {
    if (entries.length < 2) return 0;
    return entries[0].startedAt - entries[1].startedAt;
  }, [entries]);

  useEffect(() => {
    if (!activeStart) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setElapsedMs(0);
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsedMs(Date.now() - activeStart);
    }, 500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeStart]);

  async function saveSession(nextEntries: ContractionEntry[]) {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      const sessions: ContractionSession[] = Array.isArray(parsed) ? parsed : [];

      const dateKey = todayKey();
      const todaySessionIndex = sessions.findIndex((session) => session.dateKey === dateKey);

      if (todaySessionIndex >= 0) {
        sessions[todaySessionIndex] = {
          ...sessions[todaySessionIndex],
          entries: nextEntries,
        };
      } else {
        sessions.unshift({
          id: String(Date.now()),
          dateKey,
          entries: nextEntries,
          createdAt: Date.now(),
        });
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.log('Contraction session save error:', error);
    }
  }

  async function toggleTimer() {
    if (!activeStart) {
      setActiveStart(Date.now());
      return;
    }

    const endedAt = Date.now();
    const nextEntry: ContractionEntry = {
      id: String(endedAt),
      startedAt: activeStart,
      endedAt,
      durationMs: endedAt - activeStart,
    };

    const nextEntries = [nextEntry, ...entries];

    setEntries(nextEntries);
    setActiveStart(null);
    setElapsedMs(0);
    await saveSession(nextEntries);
  }

  async function clearSession() {
    Alert.alert('Clear session?', 'This will clear today’s contraction entries from this screen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setEntries([]);
          setActiveStart(null);
          setElapsedMs(0);
          void saveSession([]);
        },
      },
    ]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>LABOUR TOOL</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Contraction Timer</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Track contraction duration and rest time during a session.
        </Text>
      </View>

      <View style={[styles.timerCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.timerCircle, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Text style={[styles.timerValue, { color: palette.ink }]}>
            {formatTimer(activeStart ? elapsedMs : 0)}
          </Text>
          <Text style={[styles.timerLabel, { color: palette.text }]}>
            {activeStart ? 'Contraction running' : 'Ready'}
          </Text>
        </View>

        <AnimatedPressable
          onPress={toggleTimer}
          style={[
            styles.mainButton,
            { backgroundColor: activeStart ? palette.danger : palette.accent },
          ]}
        >
          <Ionicons
            name={activeStart ? 'stop' : 'play'}
            size={20}
            color={palette.onAccent}
          />
          <Text style={[styles.mainButtonText, { color: palette.onAccent }]}>
            {activeStart ? 'Stop contraction' : 'Start contraction'}
          </Text>
        </AnimatedPressable>
      </View>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.summaryValue, { color: palette.ink }]}>{entries.length}</Text>
          <Text style={[styles.summaryLabel, { color: palette.text }]}>Logged</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.summaryValue, { color: palette.ink }]}>
            {formatTimer(averageDuration)}
          </Text>
          <Text style={[styles.summaryLabel, { color: palette.text }]}>Average</Text>
        </View>
      </View>

      <View style={[styles.noteCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="information-circle-outline" size={22} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          Contact your care provider if contractions become regular, painful, or you feel concerned.
        </Text>
      </View>

      <View style={[styles.historyCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>THIS SESSION</Text>
            <Text style={[styles.historyTitle, { color: palette.ink }]}>Recent contractions</Text>
          </View>

          <AnimatedPressable
            onPress={clearSession}
            style={[styles.clearButton, { backgroundColor: palette.accentSoft }]}
          >
            <Text style={[styles.clearText, { color: palette.accent }]}>Clear</Text>
          </AnimatedPressable>
        </View>

        {entries.length ? (
          <View style={styles.entryList}>
            {entries.map((entry, index) => (
              <View
                key={entry.id}
                style={[styles.entryItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
              >
                <View style={[styles.entryNumber, { backgroundColor: palette.accentSoft }]}>
                  <Text style={[styles.entryNumberText, { color: palette.accent }]}>
                    {entries.length - index}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.entryTitle, { color: palette.ink }]}>
                    {formatTimer(entry.durationMs)}
                  </Text>
                  <Text style={[styles.entryMeta, { color: palette.text }]}>
                    Started {formatClock(entry.startedAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: palette.text }]}>
            No contractions logged in this session yet.
          </Text>
        )}

        {lastInterval ? (
          <Text style={[styles.intervalText, { color: palette.muted }]}>
            Last interval: {formatTimer(lastInterval)}
          </Text>
        ) : null}
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
  timerCard: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
  },
  timerCircle: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  timerValue: {
    ...type.title,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1,
  },
  timerLabel: {
    ...type.small,
    fontWeight: '900',
    marginTop: 6,
  },
  mainButton: {
    minHeight: 54,
    borderRadius: 21,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  mainButtonText: {
    ...type.small,
    fontWeight: '900',
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
    ...type.bodyStrong,
    fontSize: 24,
    lineHeight: 29,
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
  historyCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    marginTop: 5,
  },
  clearButton: {
    minHeight: 38,
    borderRadius: 16,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    ...type.tiny,
    fontWeight: '900',
  },
  entryList: {
    gap: 10,
    marginTop: 14,
  },
  entryItem: {
    minHeight: 70,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryNumber: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryNumberText: {
    ...type.small,
    fontWeight: '900',
  },
  entryTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
  },
  entryMeta: {
    ...type.small,
    lineHeight: 18,
    marginTop: 2,
    fontWeight: '800',
  },
  emptyText: {
    ...type.small,
    lineHeight: 20,
    marginTop: 14,
    fontWeight: '800',
  },
  intervalText: {
    ...type.tiny,
    fontWeight: '900',
    marginTop: 12,
  },
});
