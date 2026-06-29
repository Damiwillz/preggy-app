import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const focusItems = [
  ['water-outline', 'Hydration', 'Aim for steady water intake throughout the day.'],
  ['walk-outline', 'Gentle movement', 'Light walking or stretching can support comfort.'],
  ['moon-outline', 'Rest cues', 'Pause when your body asks for slower moments.'],
] as const;

export default function CurrentStatusScreen() {
  const { palette } = useAppTheme();
  return (
    <Screen bottomSpace={44}>
      <Header title="Current Status" back />

      <View style={styles.hero}>
        <Image
          source={require('../../assets/images/tips-status-baby.jpg')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient colors={['rgba(40,20,26,0.05)', 'rgba(40,20,26,0.76)']} style={StyleSheet.absoluteFillObject} />

        <View style={styles.heroText}>
          <Text style={styles.kicker}>TODAY’S CHECK-IN</Text>
          <Text style={styles.heroTitle}>Your body is doing something amazing</Text>
          <Text style={styles.heroCopy}>A gentle overview to help you notice what matters today.</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.statValue, { color: palette.accent }]}>12w</Text>
          <Text style={[styles.statLabel, { color: palette.text }]}>Current stage</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.statValue, { color: palette.accent }]}>88</Text>
          <Text style={[styles.statLabel, { color: palette.text }]}>Days logged</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <AnimatedPressable onPress={() => router.push('/log-symptoms' as never)} style={[styles.primaryAction, { backgroundColor: palette.accent }]}>
          <Ionicons name="happy-outline" size={20} color={palette.onAccent} />
          <Text style={[styles.primaryActionText, { color: palette.onAccent }]}>Log today</Text>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.push('/(tabs)/timeline' as never)} style={[styles.secondaryAction, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Ionicons name="calendar-outline" size={20} color={palette.accent} />
          <Text style={[styles.secondaryActionText, { color: palette.accentStrong }]}>View timeline</Text>
        </AnimatedPressable>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Today’s gentle focus</Text>

      <View style={styles.focusList}>
        {focusItems.map(([icon, title, copy], index) => (
          <View key={title} style={[styles.focusCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <View style={[styles.focusIcon, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name={icon} size={22} color={palette.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.focusTitle, { color: palette.ink }]}>{title}</Text>
              <Text style={[styles.focusCopy, { color: palette.text }]}>{copy}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.note, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="shield-checkmark-outline" size={21} color={palette.accent} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          This guidance is supportive only. Contact your clinician for urgent symptoms, bleeding, severe pain, fever, or reduced movement later in pregnancy.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 315,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginTop: 14,
    backgroundColor: '#F9DDE2',
  },
  heroText: {
    padding: 24,
  },
  kicker: {
    ...type.tiny,
    color: '#FFE7EC',
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  heroTitle: {
    ...type.title,
    fontSize: 31,
    lineHeight: 36,
    color: '#fff',
    marginTop: 7,
  },
  heroCopy: {
    ...type.body,
    color: '#FFF4F5',
    marginTop: 8,
    maxWidth: 310,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    padding: 18,
  },
  statValue: {
    ...type.title,
    fontSize: 30,
    color: colors.plum,
  },
  statLabel: {
    ...type.small,
    color: colors.text,
    marginTop: 3,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryAction: {
    flex: 1,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#CE6F79',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionText: {
    ...type.bodyStrong,
    color: '#fff',
  },
  secondaryAction: {
    flex: 1,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#FFF0F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  secondaryActionText: {
    ...type.bodyStrong,
    color: colors.plum,
  },
  sectionTitle: {
    ...type.title,
    fontSize: 25,
    color: colors.ink,
    marginTop: 26,
    marginBottom: 12,
  },
  focusList: {
    gap: 12,
  },
  focusCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  focusIcon: {
    width: 48,
    height: 48,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusTitle: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  focusCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 3,
    lineHeight: 20,
  },
  note: {
    marginTop: 20,
    backgroundColor: '#FFF0F1',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
    flexDirection: 'row',
    gap: 12,
  },
  noteText: {
    ...type.small,
    color: colors.text,
    lineHeight: 20,
    flex: 1,
    fontWeight: '700',
  },
});
