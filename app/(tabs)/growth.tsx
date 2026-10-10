import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
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

type Milestone = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  copy: string;
};

type WeekInfo = {
  stage: string;
  comparison: string;
  length: string;
  weight: string;
  headline: string;
  description: string;
  milestones: Milestone[];
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function percentWidth(value: number) {
  return `${clamp(value, 0, 100)}%` as `${number}%`;
}

function getWeekInfo(week: number): WeekInfo {
  if (week <= 4) {
    return {
      stage: 'Early beginning',
      comparison: 'Poppy seed',
      length: 'Very tiny',
      weight: 'Under 1 g',
      headline: 'A remarkable beginning',
      description:
        'The earliest foundations of pregnancy are beginning to form.',
      milestones: [
        {
          icon: 'sparkles-outline',
          title: 'Early development',
          copy: 'Important foundations are beginning at a microscopic scale.',
        },
        {
          icon: 'heart-outline',
          title: 'A new journey',
          copy: 'Your body is beginning many subtle changes.',
        },
        {
          icon: 'leaf-outline',
          title: 'Gentle self-care',
          copy: 'Rest, hydration and prenatal care remain important.',
        },
      ],
    };
  }

  if (week <= 8) {
    return {
      stage: 'Embryonic stage',
      comparison: 'Raspberry',
      length: 'About 1–2 cm',
      weight: 'Around 1 g',
      headline: 'Tiny features are emerging',
      description:
        'Early structures are developing quickly during these important weeks.',
      milestones: [
        {
          icon: 'heart-outline',
          title: 'Heart development',
          copy: 'The early heart is developing and becoming more organized.',
        },
        {
          icon: 'body-outline',
          title: 'Body taking shape',
          copy: 'Small limb buds and facial structures are beginning.',
        },
        {
          icon: 'medical-outline',
          title: 'Early prenatal care',
          copy: 'This is a useful time to plan or attend an early visit.',
        },
      ],
    };
  }

  if (week <= 13) {
    return {
      stage: 'First trimester',
      comparison: 'Plum',
      length: 'About 5–8 cm',
      weight: 'About 14–25 g',
      headline: 'Baby is becoming more defined',
      description:
        'Fingers, facial features and small movements continue developing.',
      milestones: [
        {
          icon: 'hand-left-outline',
          title: 'Tiny fingers',
          copy: 'Fingers and toes are becoming increasingly defined.',
        },
        {
          icon: 'happy-outline',
          title: 'Facial features',
          copy: 'The face continues taking on more recognizable features.',
        },
        {
          icon: 'fitness-outline',
          title: 'Early movement',
          copy: 'Small movements may happen even before you can feel them.',
        },
      ],
    };
  }

  if (week <= 20) {
    return {
      stage: 'Second trimester',
      comparison: 'Avocado',
      length: 'About 12–25 cm',
      weight: 'About 100–320 g',
      headline: 'Movement and senses are growing',
      description:
        'Baby is becoming more active while hearing and movement develop.',
      milestones: [
        {
          icon: 'ear-outline',
          title: 'Hearing develops',
          copy: 'Baby may begin responding to familiar internal sounds.',
        },
        {
          icon: 'footsteps-outline',
          title: 'Growing movement',
          copy: 'You may begin noticing flutters or more distinct movement.',
        },
        {
          icon: 'scan-outline',
          title: 'Anatomy development',
          copy: 'Organs and body structures continue maturing.',
        },
      ],
    };
  }

  if (week <= 27) {
    return {
      stage: 'Second trimester',
      comparison: 'Papaya',
      length: 'About 27–36 cm',
      weight: 'About 430–900 g',
      headline: 'Baby is building a daily rhythm',
      description:
        'Movement, sleep cycles and responses may become more noticeable.',
      milestones: [
        {
          icon: 'moon-outline',
          title: 'Sleep patterns',
          copy: 'Periods of activity and rest may become more recognizable.',
        },
        {
          icon: 'ear-outline',
          title: 'Recognizing sounds',
          copy: 'Baby may respond to voices and sounds outside the womb.',
        },
        {
          icon: 'footsteps-outline',
          title: 'Stronger movement',
          copy: 'Kicks and stretches may feel increasingly distinct.',
        },
      ],
    };
  }

  if (week <= 36) {
    return {
      stage: 'Third trimester',
      comparison: 'Pineapple',
      length: 'About 37–47 cm',
      weight: 'About 1–2.7 kg',
      headline: 'Baby is practicing for life outside',
      description:
        'Growth continues while the lungs, brain and nervous system mature.',
      milestones: [
        {
          icon: 'fitness-outline',
          title: 'Steady movement',
          copy: 'Movement patterns can become an important daily rhythm.',
        },
        {
          icon: 'cloud-outline',
          title: 'Breathing practice',
          copy: 'Baby practices movements used for breathing after birth.',
        },
        {
          icon: 'hardware-chip-outline',
          title: 'Brain development',
          copy: 'The brain and nervous system continue rapid development.',
        },
      ],
    };
  }

  return {
    stage: 'Full term',
    comparison: 'Small pumpkin',
    length: 'About 48–52 cm',
    weight: 'About 2.8–4 kg',
    headline: 'Baby is getting ready to meet you',
    description:
      'Final growth and preparation continue as the birth window approaches.',
    milestones: [
      {
        icon: 'heart-outline',
        title: 'Ready for birth',
        copy: 'Baby continues preparing for the transition after delivery.',
      },
      {
        icon: 'arrow-down-outline',
        title: 'Position changes',
        copy: 'Baby may settle lower as your body prepares for birth.',
      },
      {
        icon: 'bag-handle-outline',
        title: 'Final preparation',
        copy: 'Keep your care team and birth essentials ready.',
      },
    ],
  };
}

function buildWeekChoices(currentWeek: number) {
  const start = clamp(currentWeek - 2, 1, 36);

  return Array.from(
    { length: 5 },
    (_, index) => start + index
  ).filter((week) => week <= 40);
}

export default function GrowthScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function loadProfile() {
        setLoading(true);

        try {
          const nextProfile = await getMyProfile();

          if (mounted) {
            setProfile(nextProfile);
          }
        } catch (error) {
          console.log('Growth profile load skipped:', error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      }

      void loadProfile();

      return () => {
        mounted = false;
      };
    }, [])
  );

  const currentWeek = clamp(
    profile?.pregnancy_week ?? 24,
    1,
    40
  );

  const currentDay = clamp(
    profile?.pregnancy_days ?? 0,
    0,
    6
  );

  const activeWeek = selectedWeek ?? currentWeek;
  const activeDay =
    activeWeek === currentWeek ? currentDay : 0;

  const information = useMemo(
    () => getWeekInfo(activeWeek),
    [activeWeek]
  );

  const weekChoices = useMemo(
    () => buildWeekChoices(currentWeek),
    [currentWeek]
  );

  const pregnancyDays = clamp(
    (activeWeek - 1) * 7 + activeDay,
    0,
    280
  );

  const progress = Math.round(
    (pregnancyDays / 280) * 100
  );

  const babyName = profile?.baby_nickname || 'Baby';

  return (
    <Screen bottomSpace={115}>
      <Header title="Preggy" />

      <View style={styles.intro}>
        <View style={styles.introText}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            BABY DEVELOPMENT
          </Text>

          <Text style={[styles.title, { color: palette.ink }]}>
            Growing with you
          </Text>

          <Text style={[styles.subtitle, { color: palette.text }]}>
            Follow {babyName}’s development one beautiful week at a
            time.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={palette.accent} />
        ) : (
          <View
            style={[
              styles.currentBadge,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Text
              style={[
                styles.currentBadgeLabel,
                { color: palette.accent },
              ]}
            >
              CURRENT
            </Text>

            <Text
              style={[
                styles.currentBadgeValue,
                { color: palette.ink },
              ]}
            >
              {currentWeek}w
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekRow}
      >
        {weekChoices.map((week) => {
          const active = week === activeWeek;

          return (
            <AnimatedPressable
              key={week}
              onPress={() => setSelectedWeek(week)}
              style={[
                styles.weekButton,
                {
                  backgroundColor: active
                    ? palette.accent
                    : palette.surface,
                  borderColor: active
                    ? palette.accent
                    : palette.line,
                },
              ]}
            >
              <Text
                style={[
                  styles.weekNumber,
                  {
                    color: active ? '#FFFFFF' : palette.ink,
                  },
                ]}
              >
                {week}
              </Text>

              <Text
                style={[
                  styles.weekLabel,
                  {
                    color: active
                      ? 'rgba(255,255,255,0.78)'
                      : palette.muted,
                  },
                ]}
              >
                week
              </Text>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

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
            styles.glowLarge,
            {
              backgroundColor: palette.surface,
              opacity: palette.isDark ? 0.08 : 0.45,
            },
          ]}
        />

        <View
          style={[
            styles.glowSmall,
            {
              backgroundColor: palette.accent,
              opacity: 0.12,
            },
          ]}
        />

        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroEyebrow, { color: palette.accent }]}>
              {information.stage.toUpperCase()}
            </Text>

            <Text style={[styles.heroWeek, { color: palette.ink }]}>
              Week {activeWeek}
            </Text>
          </View>

          <AnimatedPressable
            onPress={() => router.push('/baby-growth' as never)}
            style={[
              styles.openButton,
              { backgroundColor: palette.surface },
            ]}
          >
            <Text style={[styles.openText, { color: palette.accent }]}>
              Details
            </Text>

            <Ionicons
              name="arrow-forward"
              size={16}
              color={palette.accent}
            />
          </AnimatedPressable>
        </View>

        <Image
          source={require('../../assets/images/home-foetus.png')}
          style={styles.babyImage}
          resizeMode="contain"
        />

        <View
          style={[
            styles.heroInformation,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Text
            style={[
              styles.heroInformationLabel,
              { color: palette.accent },
            ]}
          >
            APPROXIMATE SIZE
          </Text>

          <Text
            style={[
              styles.heroInformationTitle,
              { color: palette.ink },
            ]}
          >
            {information.comparison}
          </Text>

          <Text
            style={[
              styles.heroInformationCopy,
              { color: palette.text },
            ]}
          >
            {information.length} · {information.weight}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.progressTop}>
          <View>
            <Text style={[styles.eyebrow, { color: palette.accent }]}>
              PREGNANCY JOURNEY
            </Text>

            <Text style={[styles.progressTitle, { color: palette.ink }]}>
              {progress}% complete
            </Text>
          </View>

          <Text style={[styles.progressDays, { color: palette.text }]}>
            {pregnancyDays} / 280 days
          </Text>
        </View>

        <View
          style={[
            styles.progressTrack,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: percentWidth(progress),
                backgroundColor: palette.accent,
              },
            ]}
          />
        </View>

        <View style={styles.progressFooter}>
          <Text style={[styles.progressMini, { color: palette.muted }]}>
            Beginning
          </Text>

          <Text style={[styles.progressMini, { color: palette.muted }]}>
            Due date
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.storyCard,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        <View
          style={[
            styles.storyIcon,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Ionicons
            name="sparkles-outline"
            size={24}
            color={palette.accent}
          />
        </View>

        <Text style={[styles.storyTitle, { color: palette.ink }]}>
          {information.headline}
        </Text>

        <Text style={[styles.storyCopy, { color: palette.text }]}>
          {information.description}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            THIS WEEK
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.ink }]}>
            Development highlights
          </Text>
        </View>

        <View
          style={[
            styles.countBadge,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Text style={[styles.countText, { color: palette.accent }]}>
            3 updates
          </Text>
        </View>
      </View>

      <View style={styles.milestoneList}>
        {information.milestones.map((milestone, index) => (
          <View
            key={milestone.title}
            style={[
              styles.milestoneCard,
              {
                backgroundColor:
                  index === 0
                    ? palette.accentSoft
                    : palette.surface,
                borderColor:
                  index === 0
                    ? palette.accent
                    : palette.line,
              },
            ]}
          >
            <View
              style={[
                styles.milestoneNumber,
                {
                  backgroundColor:
                    index === 0
                      ? palette.surface
                      : palette.accentSoft,
                },
              ]}
            >
              <Text
                style={[
                  styles.milestoneNumberText,
                  { color: palette.accent },
                ]}
              >
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>

            <View
              style={[
                styles.milestoneIcon,
                { backgroundColor: palette.surface },
              ]}
            >
              <Ionicons
                name={milestone.icon}
                size={22}
                color={palette.accent}
              />
            </View>

            <View style={styles.milestoneText}>
              <Text
                style={[
                  styles.milestoneTitle,
                  { color: palette.ink },
                ]}
              >
                {milestone.title}
              </Text>

              <Text
                style={[
                  styles.milestoneCopy,
                  { color: palette.text },
                ]}
              >
                {milestone.copy}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <AnimatedPressable
          onPress={() => router.push('/timeline' as never)}
          style={[
            styles.secondaryButton,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
            },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={20}
            color={palette.accent}
          />

          <Text
            style={[
              styles.secondaryButtonText,
              { color: palette.ink },
            ]}
          >
            Timeline
          </Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={() => router.push('/baby-growth' as never)}
          style={[
            styles.primaryButton,
            { backgroundColor: palette.accent },
          ]}
        >
          <Text style={styles.primaryButtonText}>
            Full growth
          </Text>

          <Ionicons
            name="arrow-forward"
            size={19}
            color="#FFFFFF"
          />
        </AnimatedPressable>
      </View>

      <Text style={[styles.disclaimer, { color: palette.muted }]}>
        Growth estimates are general educational guides. Your care
        provider can give you information specific to your pregnancy.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    minHeight: 125,
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  introText: {
    flex: 1,
    paddingRight: 14,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.25,
  },
  title: {
    ...type.hero,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -0.9,
    marginTop: 5,
  },
  subtitle: {
    ...type.body,
    marginTop: 7,
  },
  currentBadge: {
    width: 67,
    height: 67,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentBadgeLabel: {
    ...type.tiny,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  currentBadgeValue: {
    ...type.bodyStrong,
    fontSize: 20,
    marginTop: 1,
  },
  weekRow: {
    gap: 8,
    paddingBottom: 16,
    paddingRight: 5,
  },
  weekButton: {
    width: 65,
    height: 58,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNumber: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 21,
  },
  weekLabel: {
    ...type.tiny,
    marginTop: 1,
  },
  hero: {
    height: 430,
    borderRadius: 34,
    borderWidth: 1,
    padding: 19,
    overflow: 'hidden',
  },
  glowLarge: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    right: -95,
    top: 34,
  },
  glowSmall: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    left: -65,
    bottom: 40,
  },
  heroTop: {
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroEyebrow: {
    ...type.section,
  },
  heroWeek: {
    ...type.title,
    fontSize: 27,
    lineHeight: 33,
    marginTop: 3,
  },
  openButton: {
    minHeight: 38,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openText: {
    ...type.small,
  },
  babyImage: {
    position: 'absolute',
    width: '108%',
    height: '82%',
    alignSelf: 'center',
    bottom: 16,
  },
  heroInformation: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    minHeight: 83,
    borderRadius: 23,
    borderWidth: 1,
    paddingHorizontal: 17,
    justifyContent: 'center',
    zIndex: 5,
  },
  heroInformationLabel: {
    ...type.tiny,
    letterSpacing: 0.9,
  },
  heroInformationTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 2,
  },
  heroInformationCopy: {
    ...type.small,
    marginTop: 2,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 18,
    marginTop: 14,
  },
  progressTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
    marginTop: 3,
  },
  progressDays: {
    ...type.small,
    marginTop: 3,
  },
  progressTrack: {
    height: 9,
    borderRadius: 5,
    marginTop: 17,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 7,
  },
  progressMini: {
    ...type.tiny,
  },
  storyCard: {
    borderWidth: 1,
    borderRadius: 27,
    padding: 19,
    marginTop: 14,
  },
  storyIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  storyTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 30,
  },
  storyCopy: {
    ...type.body,
    marginTop: 7,
  },
  sectionHeader: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
    marginTop: 3,
  },
  countBadge: {
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 2,
  },
  countText: {
    ...type.tiny,
  },
  milestoneList: {
    gap: 10,
  },
  milestoneCard: {
    minHeight: 130,
    borderWidth: 1,
    borderRadius: 25,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  milestoneNumber: {
    width: 34,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  milestoneNumberText: {
    ...type.tiny,
  },
  milestoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneText: {
    flex: 1,
  },
  milestoneTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  milestoneCopy: {
    ...type.small,
    marginTop: 5,
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 57,
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  secondaryButtonText: {
    ...type.bodyStrong,
  },
  primaryButton: {
    flex: 1.15,
    minHeight: 57,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  primaryButtonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  disclaimer: {
    ...type.tiny,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 17,
    paddingHorizontal: 15,
  },
});
