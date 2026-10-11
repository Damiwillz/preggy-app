import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
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
    <ScrollView style={[styles.page, { backgroundColor: palette.canvas }]} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <AnimatedPressable
          onPress={() => router.replace('/onboarding' as never)}
          style={[styles.roundButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="chevron-back" size={22} color={palette.ink} />
        </AnimatedPressable>

        <Text style={[styles.step, { color: palette.muted }]}>2 of 3</Text>
      </View>

      <View
        style={[
          styles.modernIllustration,
          { borderColor: palette.line },
        ]}
      >
        <Image
          source={require('../../assets/images/onboarding-guidance-photo.jpg')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        <View style={styles.modernIllustrationShade} />

        <View style={styles.modernIllustrationTop}>
          <View style={styles.modernIllustrationBadge}>
            <Ionicons
              name="sparkles"
              size={15}
              color="#FFFFFF"
            />

            <Text style={styles.modernIllustrationBadgeText}>
              MADE FOR YOUR JOURNEY
            </Text>
          </View>
        </View>

        <View style={styles.modernIllustrationBottom}>
          <Text style={styles.modernIllustrationTitle}>
            Guidance that grows with you
          </Text>

          <Text style={styles.modernIllustrationCopy}>
            Week-by-week support in one calm place.
          </Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 22,
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
  modernIllustration: {
    height: 255,
    borderRadius: 31,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  modernIllustrationShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34,18,25,0.32)',
  },
  modernIllustrationTop: {
    zIndex: 2,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modernIllustrationBadge: {
    minHeight: 32,
    borderRadius: 15,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  modernIllustrationBadgeText: {
    ...type.tiny,
    color: '#FFFFFF',
    fontSize: 9,
    letterSpacing: 0.7,
  },
  modernIllustrationBottom: {
    zIndex: 2,
    padding: 19,
  },
  modernIllustrationTitle: {
    ...type.title,
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 30,
  },
  modernIllustrationCopy: {
    ...type.small,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 4,
  },
  illustration: {
    height: 150,
    borderRadius: 28,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bigCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBubble: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 17,
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
    gap: 7,
    marginTop: 14,
    marginBottom: 15,
  },
  dotActive: {
    flex: 2,
    height: 5,
    borderRadius: 3,
  },
  dot: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  eyebrow: {
    ...type.section,
    textAlign: 'center',
  },
  title: {
    ...type.title,
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 7,
  },
  cards: {
    gap: 8,
    marginTop: 12,
  },
  card: {
    borderRadius: 23,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...type.bodyStrong,
    fontSize: 15,
  },
  cardCopy: {
    ...type.small,
    lineHeight: 17,
    marginTop: 2,
  },
  primaryButton: {
    height: 58,
    borderRadius: 19,
    marginTop: 16,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryText: {
    ...type.bodyStrong,
  },
});
