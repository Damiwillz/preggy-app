import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

export default function OnboardingScreen() {
  const { palette } = useAppTheme();

  return (
    <ScrollView
      style={[styles.page, { backgroundColor: palette.canvas }]}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View style={[styles.brandMark, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="heart" size={22} color={palette.accent} />
        </View>

        <AnimatedPressable onPress={() => router.replace('/auth/log-in' as never)}>
          <Text style={[styles.loginText, { color: palette.accent }]}>Log in</Text>
        </AnimatedPressable>
      </View>

      <View style={[styles.heroCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Image
          source={require('../../assets/images/login-hero.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.heroOverlay} />

        <View style={[styles.heroLabel, { backgroundColor: 'rgba(255,255,255,0.94)' }]}>
          <Ionicons name="sparkles" size={18} color="#C96D73" />
          <Text style={styles.heroLabelText}>Pregnancy wellness</Text>
        </View>
      </View>

      <View style={styles.dots}>
        <View style={[styles.dotActive, { backgroundColor: palette.accent }]} />
        <View style={[styles.dot, { backgroundColor: palette.line }]} />
        <View style={[styles.dot, { backgroundColor: palette.line }]} />
      </View>

      <Text style={[styles.eyebrow, { color: palette.accent }]}>PREGGY COMPANION</Text>

      <Text style={[styles.title, { color: palette.ink }]}>
        Feel supported through every week
      </Text>

      <Text style={[styles.subtitle, { color: palette.text }]}>
        Track baby growth, symptoms, appointments, medications, and gentle daily guidance in one calm space.
      </Text>

      <View style={styles.featureGrid}>
        <View style={[styles.feature, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.featureIcon, { backgroundColor: palette.surface }]}>
            <Ionicons name="pulse" size={20} color={palette.accent} />
          </View>
          <Text style={[styles.featureTitle, { color: palette.ink }]}>Daily logs</Text>
          <Text style={[styles.featureCopy, { color: palette.text }]}>Mood and symptoms</Text>
        </View>

        <View style={[styles.feature, { backgroundColor: palette.softSurface }]}>
          <View style={[styles.featureIcon, { backgroundColor: palette.surface }]}>
            <Ionicons name="calendar" size={20} color={palette.accent} />
          </View>
          <Text style={[styles.featureTitle, { color: palette.ink }]}>Reminders</Text>
          <Text style={[styles.featureCopy, { color: palette.text }]}>Visits and meds</Text>
        </View>
      </View>

      <AnimatedPressable
        onPress={() => router.push('/onboarding/personal-guidance' as never)}
        style={[styles.primaryButton, { backgroundColor: palette.accent }]}
      >
        <Text style={[styles.primaryText, { color: palette.onAccent }]}>Get started</Text>
        <Ionicons name="arrow-forward" size={20} color={palette.onAccent} />
      </AnimatedPressable>

      <AnimatedPressable
        onPress={() => router.replace('/auth/create-account' as never)}
        style={[styles.secondaryButton, { borderColor: palette.line, backgroundColor: palette.surface }]}
      >
        <Text style={[styles.secondaryText, { color: palette.accent }]}>Create account</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    ...type.small,
    fontWeight: '900',
  },
  heroCard: {
    height: 255,
    borderRadius: 30,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
  },
  heroImage: {
    position: 'absolute',
    left: -42,
    top: 0,
    width: '118%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(48, 29, 36, 0.16)',
  },
  heroLabel: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  heroLabelText: {
    ...type.small,
    color: '#5F424D',
    fontWeight: '900',
  },
  dots: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 16,
    marginBottom: 12,
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
    fontSize: 32,
    lineHeight: 36,
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    lineHeight: 22,
    marginTop: 9,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  feature: {
    flex: 1,
    borderRadius: 24,
    padding: 14,
    minHeight: 108,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    ...type.bodyStrong,
    fontSize: 15,
  },
  featureCopy: {
    ...type.tiny,
    lineHeight: 17,
    marginTop: 4,
  },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryText: {
    ...type.bodyStrong,
  },
  secondaryButton: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    ...type.small,
    fontWeight: '900',
  },
});
