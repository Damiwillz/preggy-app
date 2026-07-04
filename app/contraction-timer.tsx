import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  durationSeconds: number;
};

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatClock(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ContractionTimerScreen() {
  const { palette } = useAppTheme();

  const [activeStart, setActiveStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [entries, setEntries] = useState<ContractionEntry[]>([]);

  const activeDuration = activeStart ? Math.max(Math.floor((now - activeStart) / 1000), 0) : 0;
  const latestEntry = entries[0] ?? null;
  const restSeconds = latestEntry && !activeStart ? Math.max(Math.floor((now - latestEntry.endedAt) / 1000), 0) : 0;

  const averageDuration = useMemo(() => {
    if (!entries.length) return 0;

    const total = entries.reduce((sum, entry) => sum + entry.durationSeconds, 0);
    return Math.round(total / entries.length);
  }, [entries]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function startContraction() {
    setActiveStart(Date.now());
  }

  function stopContraction() {
    if (!activeStart) return;

    const endedAt = Date.now();
    const durationSeconds = Math.max(Math.floor((endedAt - activeStart) / 1000), 1);

    setEntries((current) => [
      {
        id: String(endedAt),
        startedAt: activeStart,
        endedAt,
        durationSeconds,
      },
      ...current,
    ]);

    setActiveStart(null);
  }

  function clearSession() {
    setActiveStart(null);
    setEntries([]);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>LABOUR SUPPORT</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Contraction Timer</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Track contraction duration and rest time during a session.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroLabel, { color: palette.onAccent }]}>
              {activeStart ? 'CONTRACTION ACTIVE' : 'CURRENT REST'}
            </Text>
            <Text style={[styles.heroTitle, { color: palette.onAccent }]}>
              {activeStart ? formatTimer(activeDuration) : formatTimer(restSeconds)}
            </Text>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name={activeStart ? 'pulse' : 'timer-outline'} size={30} color={palette.onAccent} />
          </View>
        </View>

        <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
          {entries.length} contractions logged • Avg {formatTimer(averageDuration)}
        </Text>
      </View>

      <AnimatedPressable
        onPress={activeStart ? stopContraction : startContraction}
        style={[
          styles.mainButton,
          {
            backgroundColor: activeStart ? palette.danger : palette.accent,
            borderColor: activeStart ? palette.danger : palette.accent,
          },
        ]}
      >
        <Ionicons name={activeStart ? 'stop' : 'play'} size={26} color={palette.onAccent} />
        <Text style={[styles.mainButtonText, { color: palette.onAccent }]}>
          {activeStart ? 'Stop contraction' : 'Start contraction'}
        </Text>
      </AnimatedPressable>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="pulse-outline" size={22} color={palette.accent} />
          <Text style={[styles.statValue, { color: palette.ink }]}>{entries.length}</Text>
          <Text style={[styles.statLabel, { color: palette.text }]}>Contractions</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="time-outline" size={22} color={palette.accent} />
          <Text style={[styles.statValue, { color: palette.ink }]}>{formatTimer(averageDuration)}</Text>
          <Text style={[styles.statLabel, { color: palette.text }]}>Average</Text>
        </View>
      </View>

      <View style={[styles.historyCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>SESSION HISTORY</Text>
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
          <View style={styles.historyList}>
            {entries.slice(0, 5).map((entry, index) => (
              <View key={entry.id} style={[styles.historyItem, { borderColor: palette.line }]}>
                <View style={[styles.historyNumber, { backgroundColor: palette.accentSoft }]}>
                  <Text style={[styles.historyNumberText, { color: palette.accent }]}>{index + 1}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyItemTitle, { color: palette.ink }]}>
                    {formatTimer(entry.durationSeconds)}
                  </Text>
                  <Text style={[styles.historyItemCopy, { color: palette.text }]}>
                    Started {formatClock(entry.startedAt)} • Ended {formatClock(entry.endedAt)}
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
      </View>

      <View style={[styles.noteCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Ionicons name="information-circle-outline" size={24} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          This timer is for personal tracking only. Contact your doctor, midwife, or emergency services if you are concerned or advised to seek care.
        </Text>
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
    minHeight: 174,
    borderRadius: 34,
    borderWidth: 1,
    padding: 22,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroLabel: {
    ...type.section,
    letterSpacing: 1.2,
    opacity: 0.9,
  },
  heroTitle: {
    ...type.title,
    fontSize: 36,
    lineHeight: 42,
    marginTop: 6,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '900',
    opacity: 0.92,
  },
  mainButton: {
    minHeight: 64,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mainButtonText: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minHeight: 116,
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
  },
  statValue: {
    ...type.bodyStrong,
    fontSize: 22,
    lineHeight: 28,
    marginTop: 12,
  },
  statLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginTop: 4,
  },
  historyCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    marginTop: 5,
  },
  clearButton: {
    minHeight: 38,
    borderRadius: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    ...type.tiny,
    fontWeight: '900',
  },
  historyList: {
    marginTop: 16,
    gap: 10,
  },
  historyItem: {
    minHeight: 68,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  historyNumber: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyNumberText: {
    ...type.small,
    fontWeight: '900',
  },
  historyItemTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  historyItemCopy: {
    ...type.tiny,
    lineHeight: 17,
    marginTop: 3,
    fontWeight: '800',
  },
  emptyText: {
    ...type.small,
    lineHeight: 20,
    marginTop: 16,
    fontWeight: '800',
  },
  noteCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  noteText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
    fontWeight: '800',
  },
});
