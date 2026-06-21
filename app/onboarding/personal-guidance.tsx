import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const cards = [
  {
    icon: 'chatbubble-ellipses',
    title: 'Ask Preggy AI',
    copy: 'Get gentle explanations, next steps, and reminders to contact your care team when needed.',
  },
  {
    icon: 'book',
    title: 'Daily guidance',
    copy: 'Read focused pregnancy tips for comfort, movement, food, and preparation.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Privacy first',
    copy: 'Control health data sharing, AI history, app lock, and data export from one place.',
  },
] as const;

export default function PersonalGuidanceScreen() {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.page, { backgroundColor: palette.canvas }]}>
      <View style={styles.topRow}>
        <AnimatedPressable
          onPress={() => router.replace('/onboarding' as never)}
          style={[styles.roundButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="chevron-back" size={22} color={palette.ink} />
        </AnimatedPressable>

        <Text style={[styles.step, { color: palette.muted }]}>2 of 3</Text>
      </View>

      <View style={[styles.illustration, { backgroundColor: palette.accentSoft }]}>
        <View style={[styles.smallBubble, styles.bubbleOne, { backgroundColor: palette.surface }]}>
          <Ionicons name="heart" size={24} color={palette.accent} />
        </View>

        <View style={[styles.bigCircle, { backgroundColor: palette.surface }]}>
          <Ionicons name="sparkles" size={72} color={palette.accent} />
        </View>

        <View style={[styles.smallBubble, styles.bubbleTwo, { backgroundColor: palette.surface }]}>
          <Ionicons name="chatbubbles" size={24} color={palette.accent} />
        </View>
      </View>

      <View style={styles.dots}>
        <View style={[styles.dot, { backgroundColor: palette.line }]} />
        <View style={[styles.dotActive, { backgroundColor: palette.accent }]} />
        <View style={[styles.dot, { backgroundColor: palette.line }]} />
      </View>

      <Text style={[styles.eyebrow, { color: palette.accent }]}>PERSONAL GUIDANCE</Text>

      <Text style={[styles.title, { color: palette.ink }]}>Support that feels calm, clear, and personal</Text>

      <Text style={[styles.subtitle, { color: palette.text }]}>
        Preggy brings your tools together so you can feel more organized from week to week.
      </Text>

      <View style={styles.cards}>
        {cards.map((card) => (
          <View key={card.title} style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <View style={[styles.cardIcon, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name={card.icon} size={23} color={palette.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: palette.ink }]}>{card.title}</Text>
              <Text style={[styles.cardCopy, { color: palette.text }]}>{card.copy}</Text>
            </View>
          </View>
        ))}
      </View>

      <AnimatedPressable
        onPress={() => router.push('/onboarding/track-milestones' as never)}
        style={[styles.primaryButton, { backgroundColor: palette.accent }]}
      >
        <Text style={[styles.primaryText, { color: palette.onAccent }]}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color={palette.onAccent} />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 58,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  step: {
    ...type.small,
    fontWeight: '900',
  },
  illustration: {
    height: 210,
    borderRadius: 42,
    marginTop: 26,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bigCircle: {
    width: 136,
    height: 136,
    borderRadius: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBubble: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleOne: {
    left: 34,
    top: 38,
  },
  bubbleTwo: {
    right: 34,
    bottom: 38,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: 24,
    marginBottom: 22,
  },
  dotActive: {
    width: 28,
    height: 8,
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  eyebrow: {
    ...type.section,
    textAlign: 'center',
  },
  title: {
    ...type.title,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 9,
  },
  cards: {
    gap: 10,
    marginTop: 20,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  cardCopy: {
    ...type.small,
    lineHeight: 19,
    marginTop: 3,
  },
  primaryButton: {
    height: 60,
    borderRadius: 30,
    marginTop: 'auto',
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryText: {
    ...type.bodyStrong,
  },
});
