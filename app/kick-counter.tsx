import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getKickStorageKey(dateKey: string) {
  return `preggy:kicks:${dateKey}`;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function KickCounterScreen() {
  const { palette } = useAppTheme();

  const dateKey = useMemo(() => toDateKey(new Date()), []);
  const [kicks, setKicks] = useState(0);
  const [sessionKicks, setSessionKicks] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);


  useEffect(() => {
    async function loadKicks() {
      try {
        const saved = await AsyncStorage.getItem(getKickStorageKey(dateKey));
        const parsed = saved ? Number.parseInt(saved, 10) : 0;
        setKicks(Number.isFinite(parsed) ? Math.max(parsed, 0) : 0);
      } catch (error) {
        console.log('Kick counter load error:', error);
      }
    }

    void loadKicks();
  }, [dateKey]);

  useEffect(() => {
    if (!sessionActive) return;

    const timer = setInterval(() => {
      setSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionActive]);

  async function saveKicks(next: number) {
    setKicks(next);

    try {
      await AsyncStorage.setItem(getKickStorageKey(dateKey), String(next));
    } catch (error) {
      console.log('Kick counter save error:', error);
    }
  }

  async function addKick() {
    if (!sessionActive) setSessionActive(true);

    setSessionKicks((current) => current + 1);
    await saveKicks(kicks + 1);
  }

  function resetSession() {
    setSessionActive(false);
    setSessionKicks(0);
    setSeconds(0);
  }

  async function clearToday() {
    resetSession();
    await saveKicks(0);
  }

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />


      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>BABY MOVEMENT</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Kick Counter</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Count gentle movements when your provider recommends tracking.
          </Text>
        </View>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroLabel, { color: palette.onAccent }]}>TODAY’S TOTAL</Text>
            <Text style={[styles.heroTitle, { color: palette.onAccent }]}>{kicks} kicks</Text>
          </View>

          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>👶</Text>
          </View>
        </View>

        <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
          Current session: {sessionKicks} kicks • {formatTimer(seconds)}
        </Text>
      </View>

      <AnimatedPressable
        onPress={addKick}
        style={[styles.tapCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
      >
        <View style={[styles.tapCircle, { backgroundColor: palette.accentSoft, borderColor: palette.accent }]}>
          <Ionicons name="add" size={42} color={palette.accent} />
        </View>

        <Text style={[styles.tapTitle, { color: palette.ink }]}>Tap when baby moves</Text>
        <Text style={[styles.tapCopy, { color: palette.text }]}>
          The timer starts automatically with your first tap.
        </Text>
      </AnimatedPressable>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="timer-outline" size={22} color={palette.accent} />
          <Text style={[styles.statValue, { color: palette.ink }]}>{formatTimer(seconds)}</Text>
          <Text style={[styles.statLabel, { color: palette.text }]}>Session time</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Ionicons name="heart-circle-outline" size={22} color={palette.accent} />
          <Text style={[styles.statValue, { color: palette.ink }]}>{sessionKicks}</Text>
          <Text style={[styles.statLabel, { color: palette.text }]}>Session kicks</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <AnimatedPressable
          onPress={resetSession}
          style={[styles.actionButton, { backgroundColor: palette.canvas, borderColor: palette.line }]}
        >
          <Ionicons name="refresh" size={19} color={palette.ink} />
          <Text style={[styles.actionText, { color: palette.ink }]}>Reset session</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={clearToday}
          style={[styles.actionButton, { backgroundColor: palette.accentSoft, borderColor: palette.accentSoft }]}
        >
          <Ionicons name="trash-outline" size={19} color={palette.accent} />
          <Text style={[styles.actionText, { color: palette.accent }]}>Clear today</Text>
        </AnimatedPressable>
      </View>

      <View style={[styles.noteCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Ionicons name="information-circle-outline" size={24} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          This tracker is for personal organization only. Contact your healthcare provider right away if you notice reduced movement or anything feels unusual.
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
    fontSize: 32,
    lineHeight: 38,
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
  heroEmoji: {
    fontSize: 34,
  },
  heroCopy: {
    ...type.small,
    lineHeight: 20,
    fontWeight: '900',
    opacity: 0.92,
  },
  tapCard: {
    minHeight: 220,
    borderRadius: 34,
    borderWidth: 1,
    padding: 22,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  tapTitle: {
    ...type.title,
    fontSize: 25,
    lineHeight: 30,
  },
  tapCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 7,
    textAlign: 'center',
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minHeight: 124,
    borderRadius: 26,
    borderWidth: 1,
    padding: 14,
  },
  statValue: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 26,
    marginTop: 12,
  },
  statLabel: {
    ...type.tiny,
    fontWeight: '900',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionText: {
    ...type.small,
    fontWeight: '900',
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
