import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type CareItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  copy: string;
  route: string;
};

type CareMode = 'Baby' | 'My Recovery' | 'Family';

const LAST_MODE_KEY = 'preggy:last-family-care-mode';

const modes: CareMode[] = [
  'Baby',
  'My Recovery',
  'Family',
];

const modeMeta: Record<
  CareMode,
  {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    copy: string;
  }
> = {
  Baby: {
    icon: 'happy-outline',
    title: 'Baby care',
    copy: 'Profiles, feeding, diapers, sleep, and daily newborn tracking.',
  },
  'My Recovery': {
    icon: 'heart-circle-outline',
    title: 'Your recovery',
    copy: 'Protect your energy, comfort, rest, and postpartum wellbeing.',
  },
  Family: {
    icon: 'people-outline',
    title: 'Your care circle',
    copy: 'Make decisions, set boundaries, and coordinate practical support.',
  },
};

const babyCare: CareItem[] = [
  {
    icon: 'grid-outline',
    title: 'Newborn Dashboard',
    copy: 'See feeding, diapers, sleep and recent activity.',
    route: '/newborn-dashboard',
  },
  {
    icon: 'restaurant-outline',
    title: 'Feeding',
    copy: 'Record breastfeeding, bottles and formula.',
    route: '/newborn-feeding',
  },
  {
    icon: 'water-outline',
    title: 'Diapers',
    copy: 'Track wet, dirty and mixed diaper changes.',
    route: '/newborn-diaper',
  },
  {
    icon: 'moon-outline',
    title: 'Sleep',
    copy: 'Time naps and review sleep sessions.',
    route: '/newborn-sleep',
  },
  {
    icon: 'happy-outline',
    title: 'Baby Profile',
    copy: 'Update your baby’s name and birth information.',
    route: '/newborn-profile',
  },
];

const recoveryCare: CareItem[] = [
  {
    icon: 'battery-half-outline',
    title: 'Energy Budget',
    copy: 'Plan your day around your real energy.',
    route: '/energy-budget',
  },
  {
    icon: 'heart-circle-outline',
    title: 'Comfort Profile',
    copy: 'Share what helps you feel safe and supported.',
    route: '/comfort-profile',
  },
  {
    icon: 'home-outline',
    title: 'Postpartum Plan',
    copy: 'Prepare recovery, rest and support at home.',
    route: '/postpartum-plan',
  },
];

const familyCircle: CareItem[] = [
  {
    icon: 'git-branch-outline',
    title: 'Family Decisions',
    copy: 'Discuss, record and remember important family choices.',
    route: '/family-decisions',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Visitor Plan',
    copy: 'Set and share calm visiting boundaries.',
    route: '/visitor-plan',
  },
  {
    icon: 'swap-horizontal-outline',
    title: 'Care Handoff',
    copy: 'Pass important information to the next caregiver.',
    route: '/care-handoff',
  },
  {
    icon: 'people-outline',
    title: 'Partner Support',
    copy: 'Organize practical support from your people.',
    route: '/partner-support',
  },
];

function CareCard({
  item,
  featured = false,
}: {
  item: CareItem;
  featured?: boolean;
}) {
  const { palette } = useAppTheme();

  return (
    <AnimatedPressable
      onPress={() => router.push(item.route as never)}
      style={[
        featured ? styles.featuredCard : styles.card,
        {
          backgroundColor: featured
            ? palette.accent
            : palette.surface,
          borderColor: featured
            ? palette.accent
            : palette.line,
        },
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: featured
              ? 'rgba(255,255,255,0.18)'
              : palette.accentSoft,
          },
        ]}
      >
        <Ionicons
          name={item.icon}
          size={featured ? 28 : 23}
          color={featured ? '#FFFFFF' : palette.accent}
        />
      </View>

      <View style={styles.cardContent}>
        <Text
          style={[
            featured ? styles.featuredTitle : styles.cardTitle,
            { color: featured ? '#FFFFFF' : palette.ink },
          ]}
        >
          {item.title}
        </Text>

        <Text
          style={[
            featured ? styles.featuredCopy : styles.cardCopy,
            {
              color: featured
                ? 'rgba(255,255,255,0.86)'
                : palette.text,
            },
          ]}
        >
          {item.copy}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={21}
        color={featured ? '#FFFFFF' : palette.muted}
      />
    </AnimatedPressable>
  );
}

export default function FamilyCareScreen() {
  const { palette } = useAppTheme();
  const [activeMode, setActiveMode] =
    useState<CareMode>('Baby');

  useEffect(() => {
    AsyncStorage.getItem(LAST_MODE_KEY)
      .then((saved) => {
        if (
          saved === 'Baby' ||
          saved === 'My Recovery' ||
          saved === 'Family'
        ) {
          setActiveMode(saved);
        }
      })
      .catch((error) => {
        console.log('Family Care mode load error:', error);
      });
  }, []);

  function selectMode(mode: CareMode) {
    setActiveMode(mode);

    AsyncStorage.setItem(LAST_MODE_KEY, mode).catch(
      (error) => {
        console.log('Family Care mode save error:', error);
      }
    );
  }

  const activeItems =
    activeMode === 'Baby'
      ? babyCare
      : activeMode === 'My Recovery'
        ? recoveryCare
        : familyCircle;

  const activeMeta = modeMeta[activeMode];

  return (
    <Screen bottomSpace={70}>
      <Header title="Family Care" back />

      <View
        style={[
          styles.intro,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View
            style={[
              styles.heroLabel,
              { backgroundColor: palette.surface },
            ]}
          >
            <Ionicons
              name="people-circle-outline"
              size={17}
              color={palette.accent}
            />
            <Text style={[styles.heroLabelText, { color: palette.accent }]}>
              FAMILY CARE
            </Text>
          </View>

          <View
            style={[
              styles.heroMark,
              { backgroundColor: palette.accent },
            ]}
          >
            <Ionicons name="heart" size={24} color={palette.onAccent} />
          </View>
        </View>

        <Text style={[styles.title, { color: palette.ink }]}>
          One calm place for everyone.
        </Text>

        <Text style={[styles.introCopy, { color: palette.text }]}>
          Care for baby, support recovery and keep your family connected
          through every new stage.
        </Text>

        <View style={styles.journeyRow}>
          {['Pregnancy', 'Recovery', 'Newborn'].map((label, index) => (
            <React.Fragment key={label}>
              <View style={styles.journeyItem}>
                <View
                  style={[
                    styles.journeyDot,
                    { backgroundColor: palette.accent },
                  ]}
                />
                <Text style={[styles.journeyText, { color: palette.text }]}>
                  {label}
                </Text>
              </View>

              {index < 2 ? (
                <View
                  style={[
                    styles.journeyLine,
                    { backgroundColor: palette.line },
                  ]}
                />
              ) : null}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View
        style={[
          styles.modeSelector,
          {
            backgroundColor: palette.surface,
            borderColor: palette.line,
          },
        ]}
      >
        {modes.map((mode) => {
          const active = activeMode === mode;
          const meta = modeMeta[mode];

          return (
            <AnimatedPressable
              key={mode}
              onPress={() => selectMode(mode)}
              style={[
                styles.modeButton,
                {
                  backgroundColor: active
                    ? palette.accent
                    : 'transparent',
                },
              ]}
            >
              <View
                style={[
                  styles.modeButtonIcon,
                  {
                    backgroundColor: active
                      ? 'rgba(255,255,255,0.18)'
                      : palette.accentSoft,
                  },
                ]}
              >
                <Ionicons
                  name={meta.icon}
                  size={19}
                  color={
                    active
                      ? palette.onAccent
                      : palette.accent
                  }
                />
              </View>

              <Text
                style={[
                  styles.modeButtonText,
                  {
                    color: active
                      ? palette.onAccent
                      : palette.text,
                  },
                ]}
                numberOfLines={1}
              >
                {mode}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View
        style={[
          styles.modeSummary,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <View
          style={[
            styles.modeSummaryIcon,
            { backgroundColor: palette.accent },
          ]}
        >
          <Ionicons
            name={activeMeta.icon}
            size={25}
            color={palette.onAccent}
          />
        </View>

        <View style={styles.modeSummaryContent}>
          <Text
            style={[
              styles.modeSummaryEyebrow,
              { color: palette.accent },
            ]}
          >
            {activeMode.toUpperCase()}
          </Text>

          <Text
            style={[
              styles.modeSummaryTitle,
              { color: palette.ink },
            ]}
          >
            {activeMeta.title}
          </Text>

          <Text
            style={[
              styles.modeSummaryCopy,
              { color: palette.text },
            ]}
          >
            {activeMeta.copy}
          </Text>
        </View>

        <View
          style={[
            styles.modeCount,
            { backgroundColor: palette.surface },
          ]}
        >
          <Text
            style={[
              styles.modeCountValue,
              { color: palette.accent },
            ]}
          >
            {activeItems.length}
          </Text>

          <Text
            style={[
              styles.modeCountLabel,
              { color: palette.text },
            ]}
          >
            tools
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {activeItems.map((item, index) => (
          <CareCard
            key={item.route}
            item={item}
            featured={
              activeMode === 'Baby' &&
              index === 0
            }
          />
        ))}
      </View>

      <View
        style={[
          styles.message,
          {
            backgroundColor: palette.accentSoft,
            borderColor: palette.line,
          },
        ]}
      >
        <Ionicons
          name="heart-outline"
          size={23}
          color={palette.accent}
        />

        <Text style={[styles.messageText, { color: palette.text }]}>
          Caring for the parent is part of caring for the baby.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 30,
    padding: 22,
    overflow: 'hidden',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  heroLabel: {
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  heroLabelText: {
    ...type.tiny,
    letterSpacing: 1.2,
  },
  heroMark: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '5deg' }],
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
  },
  journeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  journeyDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  journeyText: {
    ...type.tiny,
  },
  journeyLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 8,
  },
  modeSelector: {
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 25,
    padding: 6,
    flexDirection: 'row',
    gap: 5,
    marginBottom: 14,
  },
  modeButton: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 5,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  modeButtonIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonText: {
    ...type.tiny,
    textAlign: 'center',
  },
  modeSummary: {
    minHeight: 118,
    borderWidth: 1,
    borderRadius: 25,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  modeSummaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSummaryContent: {
    flex: 1,
  },
  modeSummaryEyebrow: {
    ...type.tiny,
    letterSpacing: 1.1,
  },
  modeSummaryTitle: {
    ...type.bodyStrong,
    fontSize: 19,
    lineHeight: 23,
    marginTop: 2,
  },
  modeSummaryCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
  },
  modeCount: {
    minWidth: 48,
    minHeight: 51,
    borderRadius: 17,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeCountValue: {
    ...type.bodyStrong,
    fontSize: 18,
    lineHeight: 20,
  },
  modeCountLabel: {
    ...type.tiny,
  },
  eyebrow: {
    ...type.section,
    marginBottom: 5,
  },
  title: {
    ...type.hero,
    fontSize: 34,
    lineHeight: 41,
  },
  introCopy: {
    ...type.body,
    marginTop: 8,
    maxWidth: 350,
  },
  featuredCard: {
    minHeight: 145,
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  featuredTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 30,
  },
  featuredCopy: {
    ...type.small,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 23,
    lineHeight: 29,
  },
  countBadge: {
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 2,
  },
  countText: {
    ...type.tiny,
  },
  icon: {
    width: 57,
    height: 57,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    marginHorizontal: 14,
  },
  card: {
    minHeight: 102,
    borderWidth: 1,
    borderRadius: 22,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    ...type.bodyStrong,
  },
  cardCopy: {
    ...type.small,
    marginTop: 3,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 31,
  },
  gridCard: {
    flex: 1,
    minHeight: 164,
    borderWidth: 1,
    borderRadius: 22,
    padding: 13,
  },
  gridIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridTitle: {
    ...type.bodyStrong,
  },
  gridCopy: {
    ...type.tiny,
    marginTop: 4,
  },
  list: {
    gap: 10,
  },
  message: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  messageText: {
    ...type.small,
    flex: 1,
    marginLeft: 11,
  },
});
