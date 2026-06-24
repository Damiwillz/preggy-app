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

const focusItems = [
  ['water-outline', 'Hydration', 'Aim for steady water intake throughout the day.'],
  ['walk-outline', 'Gentle movement', 'Light walking or stretching can support comfort.'],
  ['moon-outline', 'Rest cues', 'Pause when your body asks for slower moments.'],
] as const;

export default function CurrentStatusScreen() {
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
        <View style={styles.statCard}>
          <Text style={styles.statValue}>12w</Text>
          <Text style={styles.statLabel}>Current stage</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statValue}>88</Text>
          <Text style={styles.statLabel}>Days logged</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <AnimatedPressable onPress={() => router.push('/log-symptoms' as never)} style={styles.primaryAction}>
          <Ionicons name="happy-outline" size={20} color="#fff" />
          <Text style={styles.primaryActionText}>Log today</Text>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => router.push('/(tabs)/timeline' as never)} style={styles.secondaryAction}>
          <Ionicons name="calendar-outline" size={20} color={colors.plum} />
          <Text style={styles.secondaryActionText}>View timeline</Text>
        </AnimatedPressable>
      </View>

      <Text style={styles.sectionTitle}>Today’s gentle focus</Text>

      <View style={styles.focusList}>
        {focusItems.map(([icon, title, copy], index) => (
          <View key={title} style={styles.focusCard}>
            <View style={[styles.focusIcon, { backgroundColor: index === 0 ? '#E7F4F1' : index === 1 ? '#FFF0E7' : '#F7E8EE' }]}>
              <Ionicons name={icon} size={22} color={colors.plum} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.focusTitle}>{title}</Text>
              <Text style={styles.focusCopy}>{copy}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.note}>
        <Ionicons name="shield-checkmark-outline" size={21} color={colors.plum} />
        <Text style={styles.noteText}>
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
