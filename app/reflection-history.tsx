import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const REFLECTION_PREFIX = 'preggy:daily-reflection:';

type ReflectionEntry = {
  key: string;
  dateKey: string;
  note: string;
};

function formatDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);

  if (Number.isNaN(date.getTime())) return dateKey;

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function shortDate(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);

  if (Number.isNaN(date.getTime())) return 'Day';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function ReflectionHistoryScreen() {
  const { palette } = useAppTheme();

  const [reflections, setReflections] = useState<ReflectionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const latestReflection = reflections[0];

  const totalWords = useMemo(() => {
    return reflections.reduce((sum, item) => {
      return sum + item.note.split(/\s+/).filter(Boolean).length;
    }, 0);
  }, [reflections]);

  const loadReflections = useCallback(async () => {
    try {
      setLoading(true);

      const keys = await AsyncStorage.getAllKeys();
      const reflectionKeys = keys
        .filter((key) => key.startsWith(REFLECTION_PREFIX))
        .sort()
        .reverse();

      const values = await AsyncStorage.multiGet(reflectionKeys);

      const entries = values
        .map(([key, value]) => ({
          key,
          dateKey: key.replace(REFLECTION_PREFIX, ''),
          note: value?.trim() ?? '',
        }))
        .filter((item) => item.note.length > 0);

      setReflections(entries);
    } catch (error) {
      console.log('Reflection history load error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReflections();
    }, [loadReflections])
  );

  function deleteReflection(entry: ReflectionEntry) {
    Alert.alert('Delete reflection?', 'This will remove this saved note from your phone.', [
      {
        text: 'Keep it',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem(entry.key);
            setReflections((current) => current.filter((item) => item.key !== entry.key));
          } catch (error) {
            console.log('Delete reflection error:', error);
            Alert.alert('Could not delete', 'Please try again in a moment.');
          }
        },
      },
    ]);
  }

  return (
    <Screen bottomSpace={40} style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <Header title="Reflections" back />

      <View style={[styles.hero, { backgroundColor: palette.accent }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons name="book-outline" size={32} color={palette.onAccent} />
          </View>

          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{reflections.length} notes</Text>
          </View>
        </View>

        <Text style={styles.eyebrow}>PRIVATE NOTES</Text>
        <Text style={[styles.title, { color: palette.onAccent }]}>Reflection history</Text>
        <Text style={[styles.subtitle, { color: palette.onAccent }]}>
          Review the little moments, patterns, and thoughts you saved along the way.
        </Text>
      </View>

      <View style={[styles.summary, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.summaryIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="sparkles-outline" size={23} color={palette.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.cardLabel, { color: palette.accent }]}>JOURNEY SNAPSHOT</Text>
          <Text style={[styles.summaryTitle, { color: palette.ink }]}>
            {reflections.length ? `${reflections.length} saved reflections` : 'No reflections yet'}
          </Text>
          <Text style={[styles.summaryCopy, { color: palette.text }]}>
            {reflections.length ? `${totalWords} words saved privately on this device.` : 'Save your first reflection from Daily Plan.'}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.emptyTitle, { color: palette.ink }]}>Loading reflections...</Text>
        </View>
      ) : reflections.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.emptyIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="moon-outline" size={34} color={palette.accent} />
          </View>

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>No reflections yet</Text>
          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Open Daily Plan and save one small note about your day.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {latestReflection ? (
            <View style={[styles.latestCard, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
              <Text style={[styles.cardLabel, { color: palette.accent }]}>LATEST</Text>
              <Text style={[styles.latestDate, { color: palette.ink }]}>{formatDate(latestReflection.dateKey)}</Text>
              <Text style={[styles.latestNote, { color: palette.text }]}>{latestReflection.note}</Text>
            </View>
          ) : null}

          {reflections.map((entry) => (
            <View key={entry.key} style={[styles.reflectionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <View style={styles.reflectionTop}>
                <View style={[styles.dateBadge, { backgroundColor: palette.accentSoft }]}>
                  <Text style={[styles.dateBadgeText, { color: palette.accent }]}>{shortDate(entry.dateKey)}</Text>
                </View>

                <View style={styles.reflectionText}>
                  <Text style={[styles.reflectionDate, { color: palette.ink }]}>{formatDate(entry.dateKey)}</Text>
                  <Text style={[styles.reflectionNote, { color: palette.text }]}>{entry.note}</Text>
                </View>

                <AnimatedPressable onPress={() => deleteReflection(entry)} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={20} color={palette.danger} />
                </AnimatedPressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFF8F5',
  },
  hero: {
    borderRadius: 32,
    padding: 22,
    marginTop: 18,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countPillText: {
    ...type.small,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  eyebrow: {
    ...type.tiny,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontWeight: '900',
    opacity: 0.9,
  },
  title: {
    ...type.title,
    fontSize: 31,
    lineHeight: 36,
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 9,
    opacity: 0.9,
  },
  summary: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    marginTop: 16,
    flexDirection: 'row',
    gap: 13,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    ...type.tiny,
    letterSpacing: 1.4,
    fontWeight: '900',
  },
  summaryTitle: {
    ...type.bodyStrong,
    fontSize: 20,
    lineHeight: 25,
    marginTop: 4,
  },
  summaryCopy: {
    ...type.small,
    lineHeight: 20,
    marginTop: 3,
  },
  empty: {
    minHeight: 230,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 16,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyCopy: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 6,
  },
  list: {
    marginTop: 16,
    gap: 12,
  },
  latestCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
  },
  latestDate: {
    ...type.bodyStrong,
    fontSize: 18,
    marginTop: 5,
  },
  latestNote: {
    ...type.body,
    lineHeight: 23,
    marginTop: 8,
  },
  reflectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  reflectionTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  dateBadge: {
    width: 58,
    minHeight: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  dateBadgeText: {
    ...type.tiny,
    fontWeight: '900',
    textAlign: 'center',
  },
  reflectionText: {
    flex: 1,
  },
  reflectionDate: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  reflectionNote: {
    ...type.small,
    lineHeight: 21,
    marginTop: 6,
  },
  deleteButton: {
    width: 38,
    height: 38,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
