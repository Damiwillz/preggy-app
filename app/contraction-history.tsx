import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

function formatTimer(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDate(dateKey: string) {
  const parsed = new Date(`${dateKey}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) return dateKey;

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function ContractionHistoryScreen() {
  const { palette } = useAppTheme();

  const [sessions, setSessions] = useState<ContractionSession[]>([]);
  const [loading, setLoading] = useState(true);

  const totalContractions = useMemo(
    () => sessions.reduce((sum, session) => sum + session.entries.length, 0),
    [sessions]
  );

  const averageDuration = useMemo(() => {
    const entries = sessions.flatMap((session) => session.entries);
    if (!entries.length) return 0;

    return entries.reduce((sum, item) => sum + item.durationMs, 0) / entries.length;
  }, [sessions]);

  async function loadSessions() {
    setLoading(true);

    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      const next = Array.isArray(parsed) ? parsed : [];

      setSessions(next.filter((session) => Array.isArray(session.entries)));
    } catch (error) {
      console.log('Contraction history load error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>LABOUR LOG</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Contraction History</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Review saved contraction sessions from your timer.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="pulse-outline" size={30} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.heroLabel, { color: palette.accent }]}>SAVED SESSIONS</Text>
          <Text style={[styles.heroTitle, { color: palette.ink }]}>
            {totalContractions} contractions
          </Text>
          <Text style={[styles.heroCopy, { color: palette.text }]}>
            Avg duration {formatTimer(averageDuration)}
          </Text>
        </View>

        <AnimatedPressable
          onPress={() => void loadSessions()}
          style={[styles.refreshButton, { backgroundColor: palette.accentSoft }]}
        >
          <Ionicons name="refresh" size={18} color={palette.accent} />
        </AnimatedPressable>
      </View>

      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.summaryValue, { color: palette.ink }]}>{sessions.length}</Text>
          <Text style={[styles.summaryLabel, { color: palette.text }]}>Sessions</Text>
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
          This history is only a personal log. Follow your doctor or midwife’s labour advice.
        </Text>
      </View>

      <View style={[styles.listCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>SESSION HISTORY</Text>

        {loading ? (
          <Text style={[styles.emptyText, { color: palette.text }]}>Loading...</Text>
        ) : sessions.length ? (
          <View style={styles.sessionList}>
            {sessions.map((session) => {
              const avg = session.entries.length
                ? session.entries.reduce((sum, item) => sum + item.durationMs, 0) / session.entries.length
                : 0;

              return (
                <View
                  key={session.id}
                  style={[styles.sessionItem, { backgroundColor: palette.canvas, borderColor: palette.line }]}
                >
                  <View style={[styles.sessionIcon, { backgroundColor: palette.accentSoft }]}>
                    <Ionicons name="timer-outline" size={20} color={palette.accent} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionDate, { color: palette.ink }]}>
                      {formatDate(session.dateKey)}
                    </Text>
                    <Text style={[styles.sessionMeta, { color: palette.text }]}>
                      {session.entries.length} contractions • Avg {formatTimer(avg)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: palette.text }]}>
            No saved contraction sessions yet. Use the Contraction Timer first.
          </Text>
        )}
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
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
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
  listCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  sessionList: {
    gap: 10,
    marginTop: 14,
  },
  sessionItem: {
    minHeight: 76,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sessionIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDate: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
  },
  sessionMeta: {
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
});
