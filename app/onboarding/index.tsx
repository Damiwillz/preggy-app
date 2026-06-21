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
    <ScrollView style={[styles.page, { backgroundColor: palette.canvas }]} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.heroWrap}>
        <Image
          source={require('../../assets/images/onboarding-journey-photo.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
        />

        <View style={styles.heroOverlay} />

        <AnimatedPressable
          onPress={() => router.replace('/auth/log-in' as never)}
          style={[styles.skipButton, { backgroundColor: 'rgba(255,255,255,0.92)' }]}
        >
          <Text style={styles.skipText}>Log in</Text>
        </AnimatedPressable>

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
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43,25,31,0.24)',
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
    color: '#5F424D',
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
