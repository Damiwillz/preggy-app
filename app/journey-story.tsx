import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type StoryEntry = {
  week: number;
  note: string;
};

const KEY_PREFIX = 'preggy:journey-note:';

export default function JourneyStoryScreen() {
  const { palette } = useAppTheme();

  const [entries, setEntries] = useState<StoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStory = useCallback(async () => {
    setLoading(true);

    try {
      const keys = await AsyncStorage.getAllKeys();
      const storyKeys = keys.filter((key) =>
        key.startsWith(KEY_PREFIX)
      );

      const pairs = await AsyncStorage.multiGet(storyKeys);

      const nextEntries = pairs
        .map(([key, value]) => ({
          week: Number(key.replace(KEY_PREFIX, '')),
          note: value?.trim() ?? '',
        }))
        .filter(
          (entry) =>
            Number.isFinite(entry.week) &&
            entry.week >= 1 &&
            entry.week <= 40 &&
            entry.note.length > 0
        )
        .sort((first, second) => second.week - first.week);

      setEntries(nextEntries);
    } catch (error) {
      console.log('Pregnancy Story load error:', error);
      Alert.alert(
        'Could not load your story',
        'Please try again in a moment.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStory();
    }, [loadStory])
  );

  const earliestWeek = useMemo(
    () =>
      entries.length
        ? Math.min(...entries.map((entry) => entry.week))
        : null,
    [entries]
  );

  const latestWeek = useMemo(
    () =>
      entries.length
        ? Math.max(...entries.map((entry) => entry.week))
        : null,
    [entries]
  );

  async function shareStory() {
    if (!entries.length) {
      Alert.alert(
        'Your story is still beginning',
        'Save a weekly reflection from Journey first.'
      );
      return;
    }

    const chronological = [...entries].sort(
      (first, second) => first.week - second.week
    );

    const lines = [
      'My Pregnancy Story',
      '',
      ...chronological.flatMap((entry) => [
        'Week ' + String(entry.week),
        entry.note,
        '',
      ]),
      'Created with Preggy.',
    ];

    await Share.share({
      title: 'My Pregnancy Story',
      message: lines.join('\n'),
    });
  }

  function deleteEntry(entry: StoryEntry) {
    Alert.alert(
      'Delete Week ' + String(entry.week) + '?',
      'This reflection will be permanently removed.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(
                KEY_PREFIX + String(entry.week)
              );
              await loadStory();
            } catch (error) {
              console.log('Story delete error:', error);
            }
          },
        },
      ]
    );
  }

  return (
    <Screen bottomSpace={70}>
      <Header title="My Pregnancy Story" back />

      <View
        style={[
          styles.hero,
          { backgroundColor: palette.accent },
        ]}
      >
        <View style={styles.heroTop}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: 'rgba(255,255,255,0.18)' },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={31}
              color={palette.onAccent}
            />
          </View>

          <AnimatedPressable
            onPress={shareStory}
            style={[
              styles.shareButton,
              { backgroundColor: palette.onAccent },
            ]}
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={palette.accent}
            />
            <Text
              style={[
                styles.shareText,
                { color: palette.accent },
              ]}
            >
              Share
            </Text>
          </AnimatedPressable>
        </View>

        <Text
          style={[
            styles.heroTitle,
            { color: palette.onAccent },
          ]}
        >
          The little moments become the whole story.
        </Text>

        <Text
          style={[
            styles.heroCopy,
            { color: palette.onAccent },
          ]}
        >
          Every weekly Journey reflection is collected here automatically.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text
              style={[
                styles.heroStatValue,
                { color: palette.onAccent },
              ]}
            >
              {entries.length}
            </Text>
            <Text
              style={[
                styles.heroStatLabel,
                { color: palette.onAccent },
              ]}
            >
              chapters
            </Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStat}>
            <Text
              style={[
                styles.heroStatValue,
                { color: palette.onAccent },
              ]}
            >
              {earliestWeek ?? '—'}
            </Text>
            <Text
              style={[
                styles.heroStatLabel,
                { color: palette.onAccent },
              ]}
            >
              first week
            </Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStat}>
            <Text
              style={[
                styles.heroStatValue,
                { color: palette.onAccent },
              ]}
            >
              {latestWeek ?? '—'}
            </Text>
            <Text
              style={[
                styles.heroStatLabel,
                { color: palette.onAccent },
              ]}
            >
              latest week
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text }]}>
            Gathering your chapters...
          </Text>
        </View>
      ) : entries.length ? (
        <View style={styles.storyList}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.kicker, { color: palette.accent }]}>
                YOUR CHAPTERS
              </Text>
              <Text style={[styles.sectionTitle, { color: palette.ink }]}>
                Newest moments first
              </Text>
            </View>

            <View
              style={[
                styles.countBadge,
                { backgroundColor: palette.accentSoft },
              ]}
            >
              <Text style={[styles.countText, { color: palette.accent }]}>
                {entries.length}
              </Text>
            </View>
          </View>

          {entries.map((entry, index) => (
            <View key={entry.week} style={styles.chapterRow}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.weekDot,
                    { backgroundColor: palette.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.weekNumber,
                      { color: palette.onAccent },
                    ]}
                  >
                    {entry.week}
                  </Text>
                </View>

                {index < entries.length - 1 ? (
                  <View
                    style={[
                      styles.railLine,
                      { backgroundColor: palette.line },
                    ]}
                  />
                ) : null}
              </View>

              <View
                style={[
                  styles.chapterCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.line,
                  },
                ]}
              >
                <View style={styles.chapterHeader}>
                  <View>
                    <Text
                      style={[
                        styles.chapterKicker,
                        { color: palette.accent },
                      ]}
                    >
                      WEEK {entry.week}
                    </Text>
                    <Text
                      style={[
                        styles.chapterTitle,
                        { color: palette.ink },
                      ]}
                    >
                      A moment to remember
                    </Text>
                  </View>

                  <AnimatedPressable
                    onPress={() => deleteEntry(entry)}
                    style={styles.deleteButton}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={palette.danger}
                    />
                  </AnimatedPressable>
                </View>

                <Text
                  style={[
                    styles.chapterNote,
                    { color: palette.text },
                  ]}
                >
                  {entry.note}
                </Text>

                <View
                  style={[
                    styles.chapterFooter,
                    { borderTopColor: palette.line },
                  ]}
                >
                  <Ionicons
                    name="heart-outline"
                    size={17}
                    color={palette.accent}
                  />
                  <Text
                    style={[
                      styles.chapterFooterText,
                      { color: palette.muted },
                    ]}
                  >
                    Saved during Week {entry.week}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="book-outline"
              size={34}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.emptyTitle, { color: palette.ink }]}>
            Your first chapter is waiting
          </Text>

          <Text style={[styles.emptyCopy, { color: palette.text }]}>
            Go to Journey and save a weekly reflection. It will appear here automatically.
          </Text>
        </View>
      )}

      <View
        style={[
          styles.note,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={21}
          color={palette.accent}
        />
        <Text style={[styles.noteText, { color: palette.text }]}>
          Your reflections are private and stored with your local Preggy data.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 34,
    padding: 23,
    marginTop: 12,
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroIcon: {
    width: 63,
    height: 63,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    minHeight: 43,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  shareText: {
    ...type.small,
  },
  heroTitle: {
    ...type.hero,
    fontSize: 33,
    lineHeight: 39,
  },
  heroCopy: {
    ...type.body,
    lineHeight: 23,
    marginTop: 9,
    opacity: 0.88,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.13)',
    paddingVertical: 14,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    ...type.title,
    fontSize: 22,
  },
  heroStatLabel: {
    ...type.tiny,
    marginTop: 2,
    opacity: 0.86,
  },
  heroDivider: {
    width: 1,
    height: 33,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  loading: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  loadingText: {
    ...type.small,
  },
  storyList: {
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  kicker: {
    ...type.tiny,
    letterSpacing: 1.1,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 23,
    marginTop: 3,
  },
  countBadge: {
    width: 43,
    height: 43,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    ...type.bodyStrong,
  },
  chapterRow: {
    flexDirection: 'row',
  },
  rail: {
    width: 51,
    alignItems: 'center',
  },
  weekDot: {
    width: 40,
    height: 40,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNumber: {
    ...type.bodyStrong,
  },
  railLine: {
    width: 2,
    flex: 1,
    minHeight: 25,
  },
  chapterCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    padding: 17,
    marginLeft: 6,
    marginBottom: 13,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chapterKicker: {
    ...type.tiny,
    letterSpacing: 1,
  },
  chapterTitle: {
    ...type.bodyStrong,
    fontSize: 18,
    marginTop: 3,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNote: {
    ...type.body,
    lineHeight: 23,
    marginTop: 15,
  },
  chapterFooter: {
    borderTopWidth: 1,
    marginTop: 17,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chapterFooterText: {
    ...type.tiny,
  },
  emptyCard: {
    minHeight: 310,
    borderWidth: 1,
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...type.title,
    fontSize: 23,
    marginTop: 18,
    textAlign: 'center',
  },
  emptyCopy: {
    ...type.body,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  note: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noteText: {
    ...type.small,
    lineHeight: 19,
    flex: 1,
  },
});
