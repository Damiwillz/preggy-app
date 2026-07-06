import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const toolSections = [
  {
    title: 'Tracking',
    copy: 'Daily body, baby, and labour trackers',
    items: [
      {
        icon: 'footsteps-outline',
        title: 'Kick Counter',
        copy: 'Track baby movement sessions',
        route: '/kick-counter',
      },
      {
        icon: 'pulse-outline',
        title: 'Contractions',
        copy: 'Time labour contractions',
        route: '/contraction-timer',
      },
      {
        icon: 'water-outline',
        title: 'Daily Care',
        copy: 'Checklist and water intake',
        route: '/daily-care',
      },
      {
        icon: 'calculator-outline',
        title: 'Due Date Calculator',
        copy: 'Estimate pregnancy dates',
        route: '/(tabs)/calculator?fromTools=1',
      },
    ],
  },
  {
    title: 'Planning',
    copy: 'Prepare for birth and appointments',
    items: [
      {
        icon: 'document-text-outline',
        title: 'Birth Plan',
        copy: 'Save care preferences',
        route: '/birth-plan',
      },
      {
        icon: 'bag-handle-outline',
        title: 'Hospital Bag',
        copy: 'Packing checklist',
        route: '/hospital-bag-checklist',
      },
      {
        icon: 'chatbubbles-outline',
        title: 'Doctor Questions',
        copy: 'Prepare for visits',
        route: '/doctor-questions',
      },
    ],
  },
  {
    title: 'Memories',
    copy: 'Capture your pregnancy journey',
    items: [
      {
        icon: 'book-outline',
        title: 'Journal',
        copy: 'Save memories and moods',
        route: '/pregnancy-journal',
      },
      {
        icon: 'map-outline',
        title: 'Timeline',
        copy: 'View pregnancy journey',
        route: '/timeline?fromTools=1',
      },
    ],
  },
  {
    title: 'Learning & support',
    copy: 'Helpful guidance and AI support',
    items: [
      {
        icon: 'bulb-outline',
        title: 'Pregnancy Tips',
        copy: 'Guides and helpful articles',
        route: '/(tabs)/tips?fromTools=1',
      },
      {
        icon: 'sparkles-outline',
        title: 'Preggy AI',
        copy: 'Ask a pregnancy question',
        route: '/ai-chat?fromTools=1',
      },
    ],
  },
] as const;

export default function ToolsScreen() {
  const { palette } = useAppTheme();

  const totalTools = toolSections.reduce((sum, section) => sum + section.items.length, 0);

  return (
    <Screen bottomSpace={120}>
      <Header title="" back />

      <View style={styles.topRow}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGGY TOOLS</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Tools & Trackers</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Everything useful, organized in one calm place.
        </Text>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: palette.onAccent }]}>QUICK ACCESS</Text>
            <Text style={[styles.heroTitle, { color: palette.onAccent }]}>
              {totalTools} helpful tools
            </Text>
          </View>

          <View style={styles.heroIcon}>
            <Ionicons name="grid-outline" size={30} color={palette.onAccent} />
          </View>
        </View>

        <Text style={[styles.heroCopy, { color: palette.onAccent }]}>
          Track, plan, learn, and save memories throughout your pregnancy.
        </Text>
      </View>

      {toolSections.map((section) => (
        <View key={section.title} style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: palette.ink }]}>{section.title}</Text>
              <Text style={[styles.sectionCopy, { color: palette.text }]}>{section.copy}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {section.items.map((item) => (
              <AnimatedPressable
                key={item.title}
                onPress={() => router.push(item.route as never)}
                style={[styles.toolCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
              >
                <View style={[styles.toolIcon, { backgroundColor: palette.accentSoft }]}>
                  <Ionicons name={item.icon} size={24} color={palette.accent} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.toolTitle, { color: palette.ink }]}>{item.title}</Text>
                  <Text style={[styles.toolCopy, { color: palette.text }]}>{item.copy}</Text>
                </View>

                <Ionicons name="chevron-forward" size={19} color={palette.muted} />
              </AnimatedPressable>
            ))}
          </View>
        </View>
      ))}
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
    minHeight: 170,
    borderRadius: 34,
    borderWidth: 1,
    padding: 22,
    marginBottom: 18,
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
    fontSize: 31,
    lineHeight: 37,
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
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    ...type.bodyStrong,
    fontSize: 21,
    lineHeight: 26,
  },
  sectionCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
    fontWeight: '800',
  },
  grid: {
    gap: 10,
  },
  toolCard: {
    minHeight: 88,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolIcon: {
    width: 50,
    height: 50,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: {
    ...type.bodyStrong,
    fontSize: 16,
    lineHeight: 21,
  },
  toolCopy: {
    ...type.small,
    lineHeight: 18,
    marginTop: 3,
    fontWeight: '800',
  },
});
