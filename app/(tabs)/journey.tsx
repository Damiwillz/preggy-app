import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import {
  getMyProfile,
  type UserProfile,
} from '@/services/profile';

type JourneyDetails = {
  week: number;
  day: number;
  daysRemaining: number;
  progress: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function getJourneyDetails(
  profile: UserProfile | null
): JourneyDetails {
  if (profile?.due_date) {
    const dueDate = new Date(profile.due_date + 'T12:00:00');
    const today = new Date();

    if (!Number.isNaN(dueDate.getTime())) {
      const dayMs = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil(
        (dueDate.getTime() - today.getTime()) / dayMs
      );
      const pregnancyDay = clamp(
        280 - daysRemaining,
        0,
        280
      );

      return {
        week: clamp(Math.floor(pregnancyDay / 7) + 1, 1, 40),
        day: pregnancyDay % 7,
        daysRemaining: clamp(daysRemaining, 0, 280),
        progress: Math.round((pregnancyDay / 280) * 100),
      };
    }
  }

  const week = clamp(profile?.pregnancy_week ?? 24, 1, 40);
  const day = clamp(profile?.pregnancy_days ?? 0, 0, 6);
  const pregnancyDay = (week - 1) * 7 + day;

  return {
    week,
    day,
    daysRemaining: clamp(280 - pregnancyDay, 0, 280),
    progress: Math.round((pregnancyDay / 280) * 100),
  };
}

function formatDueDate(value: string | null | undefined) {
  if (!value) return 'Add due date';

  const date = new Date(value + 'T12:00:00');

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function JourneyScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const details = getJourneyDetails(profile);
  const babyName = profile?.baby_nickname || 'Baby';

  const trimester =
    details.week <= 13
      ? 'First trimester'
      : details.week <= 27
        ? 'Second trimester'
        : 'Third trimester';

  const chapter =
    details.week <= 13
      ? 'The beginning'
      : details.week <= 27
        ? 'Growing together'
        : 'Getting ready to meet';

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadJourney() {
        setLoading(true);

        try {
          const nextProfile = await getMyProfile();

          if (!active) return;

          setProfile(nextProfile);

          const nextDetails = getJourneyDetails(nextProfile);
          const savedNote = await AsyncStorage.getItem(
            'preggy:journey-note:' + String(nextDetails.week)
          );

          if (active) {
            setReflection(savedNote ?? '');
          }
        } catch (error) {
          console.log('Journey load error:', error);
        } finally {
          if (active) setLoading(false);
        }
      }

      void loadJourney();

      return () => {
        active = false;
      };
    }, [])
  );

  async function saveReflection() {
    setSaving(true);

    try {
      await AsyncStorage.setItem(
        'preggy:journey-note:' + String(details.week),
        reflection.trim()
      );

      Alert.alert(
        'Reflection saved',
        'Your Week ' + String(details.week) + ' memory is safe.'
      );
    } catch (error) {
      console.log('Journey reflection save error:', error);
      Alert.alert('Could not save', 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen bottomSpace={110}>
        <Header title="Journey" />
        <View style={styles.loading}>
          <ActivityIndicator color={palette.accent} />
          <Text style={[styles.loadingText, { color: palette.text }]}>
            Opening your journey...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen bottomSpace={110}>
      <Header title="Journey" />

      <View
        style={[
          styles.hero,
          { backgroundColor: palette.accent },
        ]}
      >
        <View style={styles.heroTop}>
          <View
            style={[
              styles.chapterBadge,
              { backgroundColor: 'rgba(255,255,255,0.18)' },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={17}
              color={palette.onAccent}
            />
            <Text
              style={[
                styles.chapterBadgeText,
                { color: palette.onAccent },
              ]}
            >
              {chapter}
            </Text>
          </View>

          <View
            style={[
              styles.weekBadge,
              { backgroundColor: palette.onAccent },
            ]}
          >
            <Text
              style={[
                styles.weekBadgeValue,
                { color: palette.accent },
              ]}
            >
              {details.week}
            </Text>
            <Text
              style={[
                styles.weekBadgeLabel,
                { color: palette.accent },
              ]}
            >
              WEEK
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.heroTitle,
            { color: palette.onAccent },
          ]}
        >
          You and {babyName}, one week at a time.
        </Text>

        <Text
          style={[
            styles.heroCopy,
            { color: palette.onAccent },
          ]}
        >
          {trimester} · Week {details.week}, Day {details.day}
        </Text>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: (details.progress + '%') as any },
            ]}
          />
        </View>

        <View style={styles.progressFooter}>
          <Text
            style={[
              styles.progressText,
              { color: palette.onAccent },
            ]}
          >
            {details.progress}% of pregnancy
          </Text>
          <Text
            style={[
              styles.progressText,
              { color: palette.onAccent },
            ]}
          >
            {details.daysRemaining} days to go
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <AnimatedPressable
          onPress={() =>
            router.push('/(tabs)/calculator?fromTools=1' as never)
          }
          style={[
            styles.summaryCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color={palette.accent}
            />
          </View>
          <Text style={[styles.summaryLabel, { color: palette.text }]}>
            Due date
          </Text>
          <Text
            style={[styles.summaryValue, { color: palette.ink }]}
            numberOfLines={2}
          >
            {formatDueDate(profile?.due_date)}
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/baby-growth' as never)}
          style={[
            styles.summaryCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="leaf-outline"
              size={22}
              color={palette.accent}
            />
          </View>
          <Text style={[styles.summaryLabel, { color: palette.text }]}>
            Current stage
          </Text>
          <Text style={[styles.summaryValue, { color: palette.ink }]}>
            {trimester}
          </Text>
        </AnimatedPressable>
      </View>

      <View
        style={[
          styles.timelineCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <Text style={[styles.kicker, { color: palette.accent }]}>
          YOUR ROADMAP
        </Text>
        <Text style={[styles.sectionTitle, { color: palette.ink }]}>
          The three chapters
        </Text>

        {[
          {
            title: 'First trimester',
            weeks: 'Weeks 1–13',
            complete: details.week > 13,
            active: details.week <= 13,
          },
          {
            title: 'Second trimester',
            weeks: 'Weeks 14–27',
            complete: details.week > 27,
            active: details.week >= 14 && details.week <= 27,
          },
          {
            title: 'Third trimester',
            weeks: 'Weeks 28–40',
            complete: false,
            active: details.week >= 28,
          },
        ].map((phase, index) => (
          <View key={phase.title} style={styles.phaseRow}>
            <View style={styles.phaseRail}>
              <View
                style={[
                  styles.phaseDot,
                  {
                    backgroundColor:
                      phase.active || phase.complete
                        ? palette.accent
                        : palette.accentSoft,
                  },
                ]}
              >
                <Ionicons
                  name={
                    phase.complete
                      ? 'checkmark'
                      : phase.active
                        ? 'heart'
                        : 'ellipse-outline'
                  }
                  size={15}
                  color={
                    phase.active || phase.complete
                      ? palette.onAccent
                      : palette.accent
                  }
                />
              </View>

              {index < 2 ? (
                <View
                  style={[
                    styles.phaseLine,
                    {
                      backgroundColor: phase.complete
                        ? palette.accent
                        : palette.line,
                    },
                  ]}
                />
              ) : null}
            </View>

            <View
              style={[
                styles.phaseContent,
                phase.active && {
                  backgroundColor: palette.accentSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.phaseTitle,
                  { color: palette.ink },
                ]}
              >
                {phase.title}
              </Text>
              <Text
                style={[
                  styles.phaseWeeks,
                  { color: palette.text },
                ]}
              >
                {phase.weeks}
                {phase.active ? ' · You are here' : ''}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View
        style={[
          styles.reflectionCard,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.reflectionHeader}>
          <View
            style={[
              styles.reflectionIcon,
              { backgroundColor: palette.accent },
            ]}
          >
            <Ionicons
              name="journal-outline"
              size={23}
              color={palette.onAccent}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: palette.accent }]}>
              WEEK {details.week} REFLECTION
            </Text>
            <Text
              style={[
                styles.reflectionTitle,
                { color: palette.ink },
              ]}
            >
              Remember this chapter
            </Text>
          </View>
        </View>

        <TextInput
          value={reflection}
          onChangeText={setReflection}
          placeholder="How are you feeling? What do you want to remember?"
          placeholderTextColor={palette.muted}
          multiline
          textAlignVertical="top"
          style={[
            styles.reflectionInput,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              color: palette.ink,
            },
          ]}
        />

        <AnimatedPressable
          onPress={saveReflection}
          disabled={saving}
          style={[
            styles.saveButton,
            { backgroundColor: palette.accent },
          ]}
        >
          {saving ? (
            <ActivityIndicator color={palette.onAccent} />
          ) : (
            <>
              <Ionicons
                name="bookmark-outline"
                size={20}
                color={palette.onAccent}
              />
              <Text
                style={[
                  styles.saveButtonText,
                  { color: palette.onAccent },
                ]}
              >
                Save this week
              </Text>
            </>
          )}
        </AnimatedPressable>
      </View>

      <AnimatedPressable
        onPress={() => router.push('/journey-story' as never)}
        style={[
          styles.storyButton,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <View
          style={[
            styles.storyButtonIcon,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Ionicons
            name="book-outline"
            size={25}
            color={palette.accent}
          />
        </View>

        <View style={styles.storyButtonContent}>
          <Text
            style={[
              styles.storyButtonKicker,
              { color: palette.accent },
            ]}
          >
            MY PREGNANCY STORY
          </Text>
          <Text
            style={[
              styles.storyButtonTitle,
              { color: palette.ink },
            ]}
          >
            Read all your weekly chapters
          </Text>
          <Text
            style={[
              styles.storyButtonCopy,
              { color: palette.text },
            ]}
          >
            Your Journey reflections, collected in one beautiful timeline.
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={21}
          color={palette.muted}
        />
      </AnimatedPressable>

      <Text style={[styles.quickTitle, { color: palette.ink }]}>
        Continue your story
      </Text>

      <View style={styles.quickGrid}>
        {[
          {
            title: 'Timeline',
            copy: 'See your moments',
            icon: 'albums-outline' as const,
            route: '/timeline',
          },
          {
            title: 'Bump gallery',
            copy: 'Save a photo',
            icon: 'camera-outline' as const,
            route: '/bump-gallery',
          },
          {
            title: 'Journal',
            copy: 'Write freely',
            icon: 'book-outline' as const,
            route: '/pregnancy-journal',
          },
          {
            title: 'Baby growth',
            copy: 'Explore this week',
            icon: 'leaf-outline' as const,
            route: '/baby-growth',
          },
        ].map((item) => (
          <AnimatedPressable
            key={item.title}
            onPress={() => router.push(item.route as never)}
            style={[
              styles.quickCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <View
              style={[
                styles.quickIcon,
                { backgroundColor: palette.accentSoft },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={palette.accent}
              />
            </View>
            <Text style={[styles.quickCardTitle, { color: palette.ink }]}>
              {item.title}
            </Text>
            <Text style={[styles.quickCardCopy, { color: palette.text }]}>
              {item.copy}
            </Text>
          </AnimatedPressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    minHeight: 500,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    ...type.small,
  },
  hero: {
    borderRadius: 34,
    padding: 23,
    marginTop: 12,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  chapterBadge: {
    minHeight: 39,
    borderRadius: 19,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  chapterBadgeText: {
    ...type.small,
  },
  weekBadge: {
    width: 65,
    height: 65,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeValue: {
    ...type.title,
    fontSize: 23,
    lineHeight: 24,
  },
  weekBadgeLabel: {
    ...type.tiny,
    fontSize: 9,
  },
  heroTitle: {
    ...type.hero,
    fontSize: 34,
    lineHeight: 40,
  },
  heroCopy: {
    ...type.body,
    marginTop: 8,
    opacity: 0.88,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.24)',
    overflow: 'hidden',
    marginTop: 22,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  progressText: {
    ...type.tiny,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    minHeight: 145,
    borderWidth: 1,
    borderRadius: 25,
    padding: 15,
  },
  summaryIcon: {
    width: 43,
    height: 43,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    ...type.tiny,
  },
  summaryValue: {
    ...type.bodyStrong,
    marginTop: 4,
  },
  timelineCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    marginBottom: 14,
  },
  kicker: {
    ...type.tiny,
    letterSpacing: 1.1,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 23,
    marginTop: 3,
    marginBottom: 18,
  },
  phaseRow: {
    flexDirection: 'row',
    minHeight: 78,
  },
  phaseRail: {
    width: 38,
    alignItems: 'center',
  },
  phaseDot: {
    width: 31,
    height: 31,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLine: {
    width: 2,
    flex: 1,
  },
  phaseContent: {
    flex: 1,
    borderRadius: 18,
    padding: 11,
    marginLeft: 7,
    marginBottom: 8,
  },
  phaseTitle: {
    ...type.bodyStrong,
  },
  phaseWeeks: {
    ...type.small,
    marginTop: 3,
  },
  reflectionCard: {
    borderWidth: 1,
    borderRadius: 28,
    padding: 18,
    marginBottom: 20,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 14,
  },
  reflectionIcon: {
    width: 47,
    height: 47,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    marginTop: 2,
  },
  reflectionInput: {
    minHeight: 110,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    ...type.body,
  },
  saveButton: {
    minHeight: 54,
    borderRadius: 21,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    ...type.bodyStrong,
  },
  storyButton: {
    minHeight: 112,
    borderWidth: 1,
    borderRadius: 26,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyButtonIcon: {
    width: 53,
    height: 53,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyButtonContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  storyButtonKicker: {
    ...type.tiny,
    fontSize: 10,
    letterSpacing: 0.9,
  },
  storyButtonTitle: {
    ...type.bodyStrong,
    fontSize: 17,
    marginTop: 3,
  },
  storyButtonCopy: {
    ...type.tiny,
    lineHeight: 16,
    marginTop: 3,
  },
  quickTitle: {
    ...type.title,
    fontSize: 23,
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickCard: {
    width: '48%',
    minHeight: 135,
    borderWidth: 1,
    borderRadius: 23,
    padding: 14,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },
  quickCardTitle: {
    ...type.bodyStrong,
  },
  quickCardCopy: {
    ...type.small,
    marginTop: 3,
  },
});
