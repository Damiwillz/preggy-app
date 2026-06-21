import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

export default function OnboardingScreen() {
  const { palette } = useAppTheme();

  return (
    <ScrollView style={[styles.page, { backgroundColor: palette.canvas }]} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroWrap, { backgroundColor: palette.accentSoft }]}>
        <View style={[styles.softCircleOne, { backgroundColor: palette.surface }]} />
        <View style={[styles.softCircleTwo, { backgroundColor: palette.surface }]} />
        <View style={[styles.softCircleThree, { backgroundColor: palette.accent }]} />

        <AnimatedPressable
          onPress={() => router.replace('/auth/log-in' as never)}
          style={[styles.skipButton, { backgroundColor: palette.surface }]}
        >
          <Text style={[styles.skipText, { color: palette.accent }]}>Log in</Text>
        </AnimatedPressable>

        <View style={[styles.mamaCard, { backgroundColor: palette.surface }]}>
          <View style={[styles.mamaIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="heart" size={54} color={palette.accent} />
          </View>

          <Text style={[styles.mamaTitle, { color: palette.ink }]}>Preggy</Text>
          <Text style={[styles.mamaCopy, { color: palette.text }]}>A calmer way to follow your pregnancy journey</Text>
        </View>

        <View style={[styles.floatBadge, styles.floatBadgeOne, { backgroundColor: palette.surface }]}>
          <Ionicons name="pulse" size={19} color={palette.accent} />
          <Text style={[styles.floatBadgeText, { color: palette.ink }]}>Symptoms</Text>
        </View>

        <View style={[styles.floatBadge, styles.floatBadgeTwo, { backgroundColor: palette.surface }]}>
          <Ionicons name="calendar" size={19} color={palette.accent} />
          <Text style={[styles.floatBadgeText, { color: palette.ink }]}>Appointments</Text>
        </View>

        <View style={[styles.logoBubble, { backgroundColor: palette.surface }]}>
          <Ionicons name="heart" size={30} color={palette.accent} />
        </View>
      </View>

      <View style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={styles.dots}>
          <View style={[styles.dotActive, { backgroundColor: palette.accent }]} />
          <View style={[styles.dot, { backgroundColor: palette.line }]} />
          <View style={[styles.dot, { backgroundColor: palette.line }]} />
        </View>

        <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGGY COMPANION</Text>

        <Text style={[styles.title, { color: palette.ink }]}>
          Your calm pregnancy guide, all in one place
        </Text>

        <Text style={[styles.subtitle, { color: palette.text }]}>
          Track weekly growth, appointments, symptoms, medications, privacy settings, and gentle daily guidance.
        </Text>

        <View style={styles.featureGrid}>
          <View style={[styles.feature, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="pulse" size={22} color={palette.accent} />
            <Text style={[styles.featureText, { color: palette.ink }]}>Daily logs</Text>
          </View>

          <View style={[styles.feature, { backgroundColor: palette.softSurface }]}>
            <Ionicons name="calendar" size={22} color={palette.accent} />
            <Text style={[styles.featureText, { color: palette.ink }]}>Appointments</Text>
          </View>

          <View style={[styles.feature, { backgroundColor: palette.softSurface }]}>
            <Ionicons name="sparkles" size={22} color={palette.accent} />
            <Text style={[styles.featureText, { color: palette.ink }]}>AI support</Text>
          </View>
        </View>

        <AnimatedPressable
          onPress={() => router.push('/onboarding/personal-guidance' as never)}
          style={[styles.primaryButton, { backgroundColor: palette.accent }]}
        >
          <Text style={[styles.primaryText, { color: palette.onAccent }]}>Get started</Text>
          <Ionicons name="arrow-forward" size={20} color={palette.onAccent} />
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.replace('/auth/create-account' as never)} style={styles.secondaryButton}>
          <Text style={[styles.secondaryText, { color: palette.accent }]}>Create account now</Text>
        </AnimatedPressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  heroWrap: {
    height: 390,
  },
  softCircleOne: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    opacity: 0.58,
    left: -70,
    top: 58,
  },
  softCircleTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.52,
    right: -38,
    top: 118,
  },
  softCircleThree: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    opacity: 0.18,
    right: 60,
    top: 58,
  },
  mamaCard: {
    position: 'absolute',
    left: 56,
    right: 56,
    top: 118,
    height: 178,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  mamaIcon: {
    width: 86,
    height: 86,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mamaTitle: {
    ...type.title,
    fontSize: 26,
  },
  mamaCopy: {
    ...type.small,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 3,
  },
  floatBadge: {
    position: 'absolute',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  floatBadgeOne: {
    left: 24,
    top: 274,
  },
  floatBadgeTwo: {
    right: 22,
    top: 306,
  },
  floatBadgeText: {
    ...type.tiny,
    fontWeight: '900',
  },
  skipButton: {
    position: 'absolute',
    top: 58,
    right: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  skipText: {
    ...type.small,
    fontWeight: '900',
  },
  logoBubble: {
    position: 'absolute',
    left: 24,
    bottom: -32,
    width: 68,
    height: 68,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    minHeight: 520,
    marginTop: -30,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 52,
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 20,
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
  },
  title: {
    ...type.title,
    fontSize: 34,
    lineHeight: 39,
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    lineHeight: 24,
    marginTop: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 22,
  },
  feature: {
    flex: 1,
    minHeight: 86,
    borderRadius: 22,
    padding: 12,
    justifyContent: 'space-between',
  },
  featureText: {
    ...type.tiny,
    fontWeight: '900',
  },
  primaryButton: {
    height: 60,
    borderRadius: 30,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryText: {
    ...type.bodyStrong,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  secondaryText: {
    ...type.small,
    fontWeight: '900',
  },
});
