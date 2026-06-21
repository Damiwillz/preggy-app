import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const milestones = [
  { week: '12', title: 'First trimester check', icon: 'medkit' },
  { week: '20', title: 'Anatomy scan', icon: 'eye' },
  { week: '28', title: 'Third trimester', icon: 'sunny' },
  { week: '40', title: 'Due date week', icon: 'gift' },
] as const;

export default function TrackMilestonesScreen() {
  const { palette } = useAppTheme();

  return (
    <View style={[styles.page, { backgroundColor: palette.canvas }]}>
      <View style={styles.topRow}>
        <AnimatedPressable
          onPress={() => router.replace('/onboarding/personal-guidance' as never)}
          style={[styles.roundButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="chevron-back" size={22} color={palette.ink} />
        </AnimatedPressable>

        <Text style={[styles.step, { color: palette.muted }]}>3 of 3</Text>
      </View>

      <View style={styles.dots}>
        <View style={[styles.dot, { backgroundColor: palette.line }]} />
        <View style={[styles.dot, { backgroundColor: palette.line }]} />
        <View style={[styles.dotActive, { backgroundColor: palette.accent }]} />
      </View>

      <Text style={[styles.eyebrow, { color: palette.accent }]}>TRACK MILESTONES</Text>

      <Text style={[styles.title, { color: palette.ink }]}>Follow each week with confidence</Text>

      <Text style={[styles.subtitle, { color: palette.text }]}>
        See weekly growth, timeline milestones, symptoms, medications, and appointments in one beautiful dashboard.
      </Text>

      <View style={[styles.timelineCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.verticalLine, { backgroundColor: palette.accentSoft }]} />

        {milestones.map((item, index) => (
          <View key={item.week} style={styles.milestoneRow}>
            <View style={[styles.milestoneIcon, { backgroundColor: index === 1 ? palette.accent : palette.accentSoft }]}>
              <Ionicons
                name={item.icon}
                size={20}
                color={index === 1 ? palette.onAccent : palette.accent}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.week, { color: palette.accent }]}>Week {item.week}</Text>
              <Text style={[styles.milestoneTitle, { color: palette.ink }]}>{item.title}</Text>
            </View>

            {index === 1 ? (
              <View style={[styles.currentBadge, { backgroundColor: palette.accentSoft }]}>
                <Text style={[styles.currentText, { color: palette.accent }]}>Preview</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={[styles.callout, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="shield-checkmark" size={24} color={palette.accent} />
        <Text style={[styles.calloutText, { color: palette.text }]}>
          Your account keeps your pregnancy journey synced securely with Supabase.
        </Text>
      </View>

      <AnimatedPressable
        onPress={() => router.replace('/auth/create-account' as never)}
        style={[styles.primaryButton, { backgroundColor: palette.accent }]}
      >
        <Text style={[styles.primaryText, { color: palette.onAccent }]}>Create account</Text>
        <Ionicons name="arrow-forward" size={20} color={palette.onAccent} />
      </AnimatedPressable>

      <AnimatedPressable onPress={() => router.replace('/auth/log-in' as never)} style={styles.loginLink}>
        <Text style={[styles.loginText, { color: palette.accent }]}>I already have an account</Text>
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
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginTop: 28,
    marginBottom: 24,
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
    fontSize: 31,
    lineHeight: 37,
    textAlign: 'center',
    marginTop: 7,
  },
  subtitle: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 9,
  },
  timelineCard: {
    position: 'relative',
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    marginTop: 28,
  },
  verticalLine: {
    position: 'absolute',
    left: 41,
    top: 42,
    bottom: 42,
    width: 3,
    borderRadius: 999,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  milestoneIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  week: {
    ...type.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  milestoneTitle: {
    ...type.bodyStrong,
    fontSize: 16,
    marginTop: 2,
  },
  currentBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  currentText: {
    ...type.tiny,
    fontWeight: '900',
  },
  callout: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  calloutText: {
    ...type.small,
    flex: 1,
    lineHeight: 19,
  },
  primaryButton: {
    height: 60,
    borderRadius: 30,
    marginTop: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryText: {
    ...type.bodyStrong,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 18,
    marginBottom: 10,
  },
  loginText: {
    ...type.small,
    fontWeight: '900',
  },
});
