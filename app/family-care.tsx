import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
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

const newbornCare: CareItem[] = [
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
];

const familySupport: CareItem[] = [
  {
    icon: 'swap-horizontal-outline',
    title: 'Care Handoff',
    copy: 'Pass important information to the next caregiver.',
    route: '/care-handoff',
  },
  {
    icon: 'happy-outline',
    title: 'Baby Profile',
    copy: 'Update your baby’s name and birth information.',
    route: '/newborn-profile',
  },
  {
    icon: 'home-outline',
    title: 'Postpartum Plan',
    copy: 'Prepare recovery, rest and support at home.',
    route: '/postpartum-plan',
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

  return (
    <Screen bottomSpace={70}>
      <Header title="Family Care" back />

      <View style={styles.intro}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>
          PREGNANCY TO NEWBORN
        </Text>

        <Text style={[styles.title, { color: palette.ink }]}>
          Care, without the clutter
        </Text>

        <Text style={[styles.introCopy, { color: palette.text }]}>
          Everything for baby care, recovery and family support is
          organized in one calm space.
        </Text>
      </View>

      <CareCard item={newbornCare[0]} featured />

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            BABY CARE
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.ink }]}>
            Quick tracking
          </Text>
        </View>

        <View
          style={[
            styles.countBadge,
            { backgroundColor: palette.accentSoft },
          ]}
        >
          <Text style={[styles.countText, { color: palette.accent }]}>
            3 tools
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        {newbornCare.slice(1).map((item) => (
          <AnimatedPressable
            key={item.title}
            onPress={() => router.push(item.route as never)}
            style={[
              styles.gridCard,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <View
              style={[
                styles.gridIcon,
                { backgroundColor: palette.accentSoft },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={palette.accent}
              />
            </View>

            <Text style={[styles.gridTitle, { color: palette.ink }]}>
              {item.title}
            </Text>

            <Text style={[styles.gridCopy, { color: palette.text }]}>
              {item.copy}
            </Text>
          </AnimatedPressable>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            FAMILY SUPPORT
          </Text>

          <Text style={[styles.sectionTitle, { color: palette.ink }]}>
            Your care circle
          </Text>
        </View>
      </View>

      <View style={styles.list}>
        {familySupport.map((item) => (
          <CareCard key={item.title} item={item} />
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
    marginBottom: 22,
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
