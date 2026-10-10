import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type SleepLog = {
  id: string;
  startedAt: number;
  endedAt: number | null;
};

const STORAGE_KEY = 'preggy:newborn-sleep';

function isToday(timestamp: number) {
  return new Date(timestamp).toDateString() === new Date().toDateString();
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(timestamp: number) {
  if (isToday(timestamp)) {
    return 'Today';
  }

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(milliseconds: number) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalMinutes = Math.floor(safeMilliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function formatTimer(milliseconds: number) {
  const safeMilliseconds = Math.max(0, milliseconds);
  const totalSeconds = Math.floor(safeMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export default function NewbornSleepScreen() {
  const { palette } = useAppTheme();

  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [now, setNow] = useState(Date.now());
  const [saving, setSaving] = useState(false);

  const activeSleep =
    logs.find((item) => item.endedAt === null) ?? null;

  useEffect(() => {
    async function loadLogs() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!saved) {
          return;
        }

        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setLogs(parsed);
        }
      } catch (error) {
        console.log('Load newborn sleep error:', error);
      }
    }

    void loadLogs();
  }, []);

  useEffect(() => {
    if (!activeSleep) {
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSleep]);

  const completedLogs = useMemo(
    () => logs.filter((item) => item.endedAt !== null),
    [logs]
  );

  const todayMinutes = useMemo(() => {
    const totalMilliseconds = logs.reduce((total, item) => {
      if (!isToday(item.startedAt)) {
        return total;
      }

      const endTime = item.endedAt ?? now;
      return total + Math.max(0, endTime - item.startedAt);
    }, 0);

    return Math.floor(totalMilliseconds / 60000);
  }, [logs, now]);

  async function saveLogs(nextLogs: SleepLog[]) {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(nextLogs)
    );

    setLogs(nextLogs);
  }

  async function startSleep() {
    if (activeSleep || saving) {
      return;
    }

    setSaving(true);

    const nextLog: SleepLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      startedAt: Date.now(),
      endedAt: null,
    };

    try {
      await saveLogs([nextLog, ...logs]);
      setNow(Date.now());
    } catch (error) {
      console.log('Start newborn sleep error:', error);

      Alert.alert(
        'Could not start timer',
        'Please try again in a moment.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function finishSleep() {
    if (!activeSleep || saving) {
      return;
    }

    setSaving(true);

    const endedAt = Date.now();

    const nextLogs = logs.map((item) =>
      item.id === activeSleep.id
        ? { ...item, endedAt }
        : item
    );

    try {
      await saveLogs(nextLogs);

      Alert.alert(
        'Sleep saved',
        `Sleep duration: ${formatDuration(
          endedAt - activeSleep.startedAt
        )}`
      );
    } catch (error) {
      console.log('Finish newborn sleep error:', error);

      Alert.alert(
        'Could not save sleep',
        'Please try again in a moment.'
      );
    } finally {
      setSaving(false);
    }
  }

  function removeLog(id: string) {
    Alert.alert(
      'Delete this sleep session?',
      'This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const nextLogs = logs.filter((item) => item.id !== id);

            try {
              await saveLogs(nextLogs);
            } catch (error) {
              console.log('Delete newborn sleep error:', error);

              Alert.alert(
                'Could not delete',
                'Please try again.'
              );
            }
          },
        },
      ]
    );
  }

  const activeDuration = activeSleep
    ? now - activeSleep.startedAt
    : 0;

  const todayHours = Math.floor(todayMinutes / 60);
  const remainingMinutes = todayMinutes % 60;

  return (
    <Screen bottomSpace={70}>
      <Header title="Sleep Tracker" back />

      <View
        style={[
          styles.hero,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <View
          style={[
            styles.heroIcon,
            { backgroundColor: palette.surface },
          ]}
        >
          <Ionicons
            name="moon-outline"
            size={30}
            color={palette.accent}
          />
        </View>

        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          TODAY
        </Text>

        <Text style={[styles.total, { color: palette.ink }]}>
          {todayHours}h {remainingMinutes}m
        </Text>

        <Text style={[styles.heroCopy, { color: palette.text }]}>
          Total sleep recorded today
        </Text>
      </View>

      <View
        style={[
          styles.timerCard,
          {
            backgroundColor: palette.surface,
            borderColor: activeSleep
              ? palette.accent
              : palette.line,
          },
        ]}
      >
        <View style={styles.timerTop}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: activeSleep
                  ? palette.accent
                  : palette.line,
              },
            ]}
          />

          <Text style={[styles.statusText, { color: palette.text }]}>
            {activeSleep ? 'Baby is sleeping' : 'Baby is awake'}
          </Text>
        </View>

        <Text style={[styles.timer, { color: palette.ink }]}>
          {activeSleep
            ? formatTimer(activeDuration)
            : '00:00:00'}
        </Text>

        <Text style={[styles.timerCopy, { color: palette.muted }]}>
          {activeSleep
            ? `Started at ${formatTime(activeSleep.startedAt)}`
            : 'Start the timer when baby falls asleep'}
        </Text>

        <AnimatedPressable
          onPress={() =>
            activeSleep
              ? void finishSleep()
              : void startSleep()
          }
          style={[
            styles.timerButton,
            {
              backgroundColor: activeSleep
                ? palette.ink
                : palette.accent,
            },
          ]}
        >
          <Ionicons
            name={
              activeSleep
                ? 'stop-circle-outline'
                : 'play-circle-outline'
            }
            size={23}
            color="#FFFFFF"
          />

          <Text style={styles.timerButtonText}>
            {saving
              ? 'Saving...'
              : activeSleep
                ? 'Baby woke up'
                : 'Start sleep'}
          </Text>
        </AnimatedPressable>
      </View>

      <View style={styles.historyHeader}>
        <View>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            HISTORY
          </Text>

          <Text style={[styles.historyTitle, { color: palette.ink }]}>
            Recent sleep
          </Text>
        </View>

        <Text style={[styles.historyCount, { color: palette.muted }]}>
          {completedLogs.length} sessions
        </Text>
      </View>

      {completedLogs.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="bed-outline"
            size={30}
            color={palette.accent}
          />

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>
            No completed sleep yet
          </Text>

          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Completed sleep sessions will appear here.
          </Text>
        </View>
      ) : (
        completedLogs.slice(0, 12).map((item) => (
          <View
            key={item.id}
            style={[
              styles.logCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <View
              style={[
                styles.logIcon,
                { backgroundColor: palette.accentSoft },
              ]}
            >
              <Ionicons
                name="moon-outline"
                size={21}
                color={palette.accent}
              />
            </View>

            <View style={styles.logContent}>
              <Text style={[styles.logTitle, { color: palette.ink }]}>
                {formatDuration(
                  (item.endedAt ?? item.startedAt) - item.startedAt
                )}
              </Text>

              <Text style={[styles.logTime, { color: palette.muted }]}>
                {formatDate(item.startedAt)} ·{' '}
                {formatTime(item.startedAt)} –{' '}
                {formatTime(item.endedAt ?? item.startedAt)}
              </Text>
            </View>

            <AnimatedPressable
              onPress={() => removeLog(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons
                name="trash-outline"
                size={19}
                color={palette.muted}
              />
            </AnimatedPressable>
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 22,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  eyebrow: {
    ...type.section,
    marginBottom: 5,
  },
  total: {
    ...type.hero,
    fontSize: 38,
    lineHeight: 45,
  },
  heroCopy: {
    ...type.small,
    marginTop: 3,
  },
  timerCard: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 22,
    alignItems: 'center',
    marginBottom: 28,
  },
  timerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },
  statusText: {
    ...type.small,
  },
  timer: {
    ...type.hero,
    fontSize: 42,
    lineHeight: 52,
    letterSpacing: 1,
    marginTop: 13,
  },
  timerCopy: {
    ...type.small,
    marginTop: 2,
    textAlign: 'center',
  },
  timerButton: {
    width: '100%',
    height: 58,
    borderRadius: 19,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  timerButtonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
  },
  historyCount: {
    ...type.small,
    marginBottom: 3,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  emptyTitle: {
    ...type.bodyStrong,
    marginTop: 11,
  },
  emptyCopy: {
    ...type.small,
    textAlign: 'center',
    marginTop: 4,
  },
  logCard: {
    borderWidth: 1,
    borderRadius: 21,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIcon: {
    width: 47,
    height: 47,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContent: {
    flex: 1,
    marginLeft: 12,
  },
  logTitle: {
    ...type.bodyStrong,
  },
  logTime: {
    ...type.tiny,
    marginTop: 2,
  },
  deleteButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
