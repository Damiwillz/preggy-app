import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { getMyProfile, type UserProfile } from '@/services/profile';

const babyImage = require('../assets/images/home-foetus.png');

const sizeComparisons = [
  'a poppy seed', 'a sesame seed', 'a lentil', 'a blueberry', 'a raspberry',
  'a cherry', 'a strawberry', 'a fig', 'a lime', 'a lemon',
  'a peach', 'an apple', 'an avocado', 'a pear', 'a mango',
  'a banana', 'a sweet potato', 'a bell pepper', 'a coconut', 'a small melon',
  'a papaya', 'an ear of corn', 'a grapefruit', 'a cabbage', 'a cauliflower',
  'an eggplant', 'a butternut squash', 'a large cabbage', 'a pineapple', 'a cantaloupe',
  'a honeydew melon', 'a squash', 'a celery bunch', 'a small pumpkin', 'a romaine lettuce',
  'a bunch of kale', 'a watermelon', 'a larger pumpkin', 'a birth-ready baby', 'a newborn'
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '');

  if (clean.length !== 6) return hex;

  const red = Number.parseInt(clean.slice(0, 2), 16);
  const green = Number.parseInt(clean.slice(2, 4), 16);
  const blue = Number.parseInt(clean.slice(4, 6), 16);

  return 'rgba(' + red + ', ' + green + ', ' + blue + ', ' + alpha + ')';
}

function percentWidth(value: number): DimensionValue {
  return (String(clamp(value, 0, 100)) + '%') as DimensionValue;
}

function getPregnancyProgress(profile: UserProfile | null) {
  if (profile?.due_date) {
    const dueDate = new Date(profile.due_date + 'T12:00:00');
    const today = new Date();

    if (!Number.isNaN(dueDate.getTime())) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / msPerDay);
      const pregnancyDay = clamp(280 - daysRemaining, 0, 280);
      const week = clamp(Math.floor(pregnancyDay / 7) + 1, 1, 40);
      const day = pregnancyDay % 7;

      return {
        week,
        day,
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

function getTrimester(week: number) {
  if (week >= 28) return 'Third trimester';
  if (week >= 14) return 'Second trimester';
  return 'First trimester';
}

function getWeekCopy(week: number, babyName: string) {
  if (week >= 37) {
    return {
      title: babyName + ' is getting ready to meet you',
      baby: 'Baby is mostly focused on gaining weight, practicing breathing motions, and settling for birth.',
      body: 'You may feel more pressure, stronger practice contractions, tiredness, or nesting energy.',
      focus: 'Keep hospital details, contacts, and your birth preferences easy to reach.',
      checklist: ['Review your birth preferences', 'Keep your hospital bag ready', 'Save important contacts'],
    };
  }

  if (week >= 28) {
    return {
      title: babyName + ' is building rhythm',
      baby: 'Baby is growing steadily, responding to sound and light, and movements may feel more patterned.',
      body: 'You may notice more back pressure, sleep changes, swelling, or stronger daily movement patterns.',
      focus: 'Track movement, rest, appointments, and anything you want to ask your provider.',
      checklist: ['Track baby movement', 'Prepare appointment questions', 'Review your hospital plan'],
    };
  }

  if (week >= 14) {
    return {
      title: babyName + ' is growing beautifully',
      baby: 'Baby is adding length, practicing tiny movements, and features are becoming more defined.',
      body: 'Energy may improve, your bump may grow more clearly, and you may begin noticing movement.',
      focus: 'Capture memories, plan gently, and keep simple notes about how you feel.',
      checklist: ['Save a bump photo', 'Log symptoms or mood', 'Add one memory from this week'],
    };
  }

  return {
    title: babyName + ' is beginning quietly',
    baby: 'Early development is moving quickly as tiny structures begin forming week by week.',
    body: 'You may feel tired, emotional, nauseous, or different from day to day.',
    focus: 'Keep routines gentle and write down questions for your next appointment.',
    checklist: ['Log how you feel', 'Save questions for your doctor', 'Rest when your body asks'],
  };
}

function buildWeekChips(currentWeek: number) {
  const start = clamp(currentWeek - 3, 1, 34);
  return Array.from({ length: 7 }, (_, index) => start + index);
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.infoPill, { backgroundColor: palette.surface, borderColor: palette.line }]}>
      <View style={[styles.infoIcon, { backgroundColor: palette.accentSoft }]}>
        <Ionicons name={icon} size={17} color={palette.accent} />
      </View>

      <Text style={[styles.infoValue, { color: palette.ink }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.infoLabel, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

export default function BabyGrowthScreen() {
  const { palette } = useAppTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getMyProfile()
        .then((nextProfile) => {
          if (active) setProfile(nextProfile);
        })
        .catch((error) => {
          console.log('Baby growth profile load error:', error);
          if (active) setProfile(null);
        });

      return () => {
        active = false;
      };
    }, [])
  );

  const progress = useMemo(() => getPregnancyProgress(profile), [profile]);
  const babyName = profile?.baby_nickname || 'Baby';

  useEffect(() => {
    setSelectedWeek(progress.week);
  }, [progress.week]);

  const activeWeek = selectedWeek ?? progress.week;
  const activeDay = activeWeek === progress.week ? progress.day : 0;
  const weekCopy = useMemo(() => getWeekCopy(activeWeek, babyName), [activeWeek, babyName]);
  const weekChips = useMemo(() => buildWeekChips(activeWeek), [activeWeek]);

  const trimester = getTrimester(activeWeek);
  const sizeText = sizeComparisons[activeWeek - 1] || 'growing baby';
  const growthPercent = Math.round((activeWeek / 40) * 100);
  const imageScale = 0.82 + clamp(activeWeek / 40, 0.2, 1) * 0.22;

  return (
    <Screen bottomSpace={130}>
      <Header title="" back />

      <View style={styles.top}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>BABY GROWTH</Text>
        <Text style={[styles.title, { color: palette.ink }]}>This week with {babyName}</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Follow baby’s growth, week by week, with a calm visual guide.
        </Text>
      </View>

      <LinearGradient
        colors={[
          palette.surface,
          withAlpha(palette.accent, palette.isDark ? 0.22 : 0.14),
          palette.softSurface,
        ]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { borderColor: palette.line }]}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroLabel, { color: palette.accent }]}>{trimester}</Text>
            <Text style={[styles.heroTitle, { color: palette.ink }]}>
              Week {activeWeek} {activeDay ? '• Day ' + activeDay : ''}
            </Text>
          </View>

          <View style={[styles.weekBubble, { backgroundColor: palette.accent }]}>
            <Text style={[styles.weekBubbleText, { color: palette.onAccent }]}>{growthPercent}%</Text>
          </View>
        </View>

        <View style={styles.visualWrap}>
          <View style={[styles.glowOne, { backgroundColor: withAlpha(palette.accent, 0.16) }]} />
          <View style={[styles.glowTwo, { backgroundColor: withAlpha(palette.accent, 0.1) }]} />
          <Image
            source={babyImage}
            resizeMode="contain"
            style={[
              styles.babyImage,
              {
                transform: [{ scale: imageScale }],
              },
            ]}
          />
        </View>

        <View style={[styles.sizeCard, { backgroundColor: withAlpha('#FFFFFF', palette.isDark ? 0.12 : 0.68) }]}>
          <Text style={[styles.sizeLabel, { color: palette.text }]}>About the size of</Text>
          <Text style={[styles.sizeValue, { color: palette.ink }]}>{sizeText}</Text>
        </View>
      </LinearGradient>

      <View style={[styles.progressTrack, { backgroundColor: palette.accentSoft }]}>
        <View style={[styles.progressFill, { width: percentWidth(growthPercent), backgroundColor: palette.accent }]} />
      </View>

      <View style={styles.weekControls}>
        <AnimatedPressable
          onPress={() => setSelectedWeek((week) => clamp((week ?? activeWeek) - 1, 1, 40))}
          style={[styles.arrowButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="chevron-back" size={19} color={palette.accent} />
        </AnimatedPressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStrip}>
          {weekChips.map((week) => {
            const active = week === activeWeek;

            return (
              <AnimatedPressable
                key={week}
                onPress={() => setSelectedWeek(week)}
                style={[
                  styles.weekChip,
                  {
                    backgroundColor: active ? palette.accent : palette.surface,
                    borderColor: active ? palette.accent : palette.line,
                  },
                ]}
              >
                <Text style={[styles.weekChipText, { color: active ? palette.onAccent : palette.ink }]}>
                  {week}
                </Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>

        <AnimatedPressable
          onPress={() => setSelectedWeek((week) => clamp((week ?? activeWeek) + 1, 1, 40))}
          style={[styles.arrowButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="chevron-forward" size={19} color={palette.accent} />
        </AnimatedPressable>
      </View>

      <View style={styles.infoGrid}>
        <InfoPill icon="leaf-outline" label="Stage" value={trimester} />
        <InfoPill icon="resize-outline" label="Size" value={sizeText} />
        <InfoPill icon="calendar-outline" label="Progress" value={'Week ' + activeWeek + '/40'} />
      </View>

      <View style={[styles.detailCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.cardEyebrow, { color: palette.accent }]}>THIS WEEK</Text>
        <Text style={[styles.cardTitle, { color: palette.ink }]}>{weekCopy.title}</Text>

        <View style={styles.detailBlock}>
          <Ionicons name="sparkles-outline" size={21} color={palette.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.detailTitle, { color: palette.ink }]}>Baby</Text>
            <Text style={[styles.detailCopy, { color: palette.text }]}>{weekCopy.baby}</Text>
          </View>
        </View>

        <View style={styles.detailBlock}>
          <Ionicons name="body-outline" size={21} color={palette.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.detailTitle, { color: palette.ink }]}>You may notice</Text>
            <Text style={[styles.detailCopy, { color: palette.text }]}>{weekCopy.body}</Text>
          </View>
        </View>

        <View style={[styles.focusBox, { backgroundColor: palette.accentSoft }]}>
          <Text style={[styles.focusLabel, { color: palette.accent }]}>FOCUS</Text>
          <Text style={[styles.focusText, { color: palette.text }]}>{weekCopy.focus}</Text>
        </View>
      </View>

      <View style={[styles.checklistCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.cardEyebrow, { color: palette.accent }]}>GENTLE CHECKLIST</Text>

        {weekCopy.checklist.map((item) => (
          <View key={item} style={styles.checkRow}>
            <Ionicons name="checkmark-circle" size={20} color={palette.accent} />
            <Text style={[styles.checkText, { color: palette.text }]}>{item}</Text>
          </View>
        ))}
      </View>

      <AnimatedPressable
        onPress={() => router.push('/ai-chat?fromGrowth=1' as never)}
        style={[styles.aiButton, { backgroundColor: palette.accent }]}
      >
        <Ionicons name="sparkles-outline" size={20} color={palette.onAccent} />
        <Text style={[styles.aiButtonText, { color: palette.onAccent }]}>Ask Preggy AI about week {activeWeek}</Text>
        <Ionicons name="arrow-forward" size={20} color={palette.onAccent} />
      </AnimatedPressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: {
    marginTop: 18,
    marginBottom: 16,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    lineHeight: 21,
    marginTop: 7,
  },
  heroCard: {
    minHeight: 390,
    borderRadius: 32,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  heroLabel: {
    ...type.section,
  },
  heroTitle: {
    ...type.bodyStrong,
    fontSize: 24,
    lineHeight: 29,
    marginTop: 4,
  },
  weekBubble: {
    width: 58,
    height: 58,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBubbleText: {
    ...type.bodyStrong,
    fontWeight: '900',
  },
  visualWrap: {
    height: 255,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  babyImage: {
    width: '112%',
    height: '112%',
    zIndex: 3,
  },
  glowOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  glowTwo: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    right: -90,
    bottom: -60,
  },
  sizeCard: {
    alignSelf: 'center',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    alignItems: 'center',
    minWidth: 190,
  },
  sizeLabel: {
    ...type.tiny,
  },
  sizeValue: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 23,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  progressTrack: {
    height: 8,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 99,
  },
  weekControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStrip: {
    gap: 8,
    paddingVertical: 1,
  },
  weekChip: {
    width: 42,
    height: 42,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekChipText: {
    ...type.small,
    fontWeight: '900',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  infoPill: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    minHeight: 105,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  infoValue: {
    ...type.small,
    fontWeight: '900',
  },
  infoLabel: {
    ...type.tiny,
    marginTop: 3,
  },
  detailCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  cardEyebrow: {
    ...type.section,
  },
  cardTitle: {
    ...type.bodyStrong,
    fontSize: 23,
    lineHeight: 29,
    marginTop: 7,
    marginBottom: 15,
  },
  detailBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginBottom: 16,
  },
  detailTitle: {
    ...type.bodyStrong,
    fontSize: 16,
    lineHeight: 21,
  },
  detailCopy: {
    ...type.small,
    lineHeight: 21,
    marginTop: 3,
  },
  focusBox: {
    borderRadius: 22,
    padding: 14,
  },
  focusLabel: {
    ...type.tiny,
    letterSpacing: 1,
  },
  focusText: {
    ...type.small,
    lineHeight: 21,
    marginTop: 5,
  },
  checklistCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    gap: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    ...type.small,
    lineHeight: 20,
    flex: 1,
  },
  aiButton: {
    minHeight: 58,
    borderRadius: 22,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  aiButtonText: {
    ...type.small,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
  },
});
