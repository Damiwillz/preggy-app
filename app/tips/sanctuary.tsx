import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const moods = [
  ['Pensive', '😶‍🌫️'],
  ['Calm', '😌'],
  ['Joyful', '😊'],
  ['Tired', '🥱'],
  ['Serene', '🌸'],
] as const;

const intentions = [
  ['phone-portrait-outline', 'Create a screen-free zone', 'Reclaim your mental space before sleep.'],
  ['body-outline', 'Gentle evening stretching', 'Release tension from your back and hips.'],
  ['journal-outline', 'Mindful journaling', 'Write down three things you are grateful for.'],
] as const;

export default function SanctuaryScreen() {
  const { palette } = useAppTheme();
  const [mood, setMood] = useState('Calm');
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState('Rainfall');

  return (
    <Screen bottomSpace={44}>
      <Header title="Your Sanctuary" back />

      <View style={styles.hero}>
        <Image source={require('../../assets/images/tips-sanctuary-hero.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <LinearGradient colors={['rgba(40,20,26,0.04)', 'rgba(40,20,26,0.74)']} style={StyleSheet.absoluteFillObject} />

        <View style={styles.heroText}>
          <Text style={styles.kicker}>MINDFUL CARE</Text>
          <Text style={styles.heroTitle}>A softer moment for you</Text>
          <Text style={styles.heroCopy}>Choose a mood, settle your body, and create a calming pause.</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>How are you feeling?</Text>

      <View style={styles.moods}>
        {moods.map(([label, emoji]) => {
          const active = mood === label;

          return (
            <AnimatedPressable key={label} onPress={() => setMood(label)} style={[styles.mood, { backgroundColor: active ? palette.accentSoft : palette.surface, borderColor: active ? palette.accent : palette.line }]}>
              <Text style={styles.moodEmoji}>{emoji}</Text>
              <Text style={[styles.moodLabel, { color: active ? palette.accent : palette.text }]}>{label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>

      <View style={[styles.sessionCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sessionBadge, { color: palette.accent }]}>GUIDED SESSION</Text>
          <Text style={[styles.sessionTitle, { color: palette.ink }]}>10-minute calming breath</Text>
          <Text style={[styles.sessionNarrator, { color: palette.text }]}>A gentle breathing reset for pregnancy comfort.</Text>
        </View>

        <AnimatedPressable onPress={() => setPlaying((value) => !value)} style={[styles.playButton, { backgroundColor: palette.accent }]}>
          <Ionicons name={playing ? 'pause' : 'play'} size={27} color={palette.onAccent} />
        </AnimatedPressable>

        <View style={[styles.progressTrack, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.progressFill, { width: playing ? '54%' : '34%', backgroundColor: palette.accent }]} />
        </View>

        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: palette.text }]}>3:42</Text>
          <Text style={[styles.time, { color: palette.text }]}>10:00</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Ambient sanctuary</Text>

      <View style={styles.sounds}>
        {[
          ['Rainfall', 'rainy-outline'],
          ['Soft piano', 'musical-notes-outline'],
          ['Forest birds', 'leaf-outline'],
        ].map(([label, icon]) => {
          const active = sound === label;

          return (
            <AnimatedPressable key={label} onPress={() => setSound(label)} style={[styles.sound, { backgroundColor: active ? palette.accentSoft : palette.surface, borderColor: active ? palette.accent : palette.line }]}>
              <View style={[styles.soundIcon, { backgroundColor: palette.canvas }]}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={24} color={colors.plum} />
              </View>

              <Text style={[styles.soundLabel, { color: palette.ink }]}>{label}</Text>

              {active && <Ionicons name="checkmark-circle" size={20} color={palette.accent} />}
            </AnimatedPressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: palette.ink }]}>Daily intentions</Text>

      <View style={styles.intentions}>
        {intentions.map(([icon, title, copy], index) => (
          <View key={title} style={[styles.intention, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <View style={[styles.intentionIcon, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={21} color={colors.plum} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.intentionTitle, { color: palette.ink }]}>{title}</Text>
              <Text style={[styles.intentionCopy, { color: palette.text }]}>{copy}</Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 300,
    borderRadius: 32,
    overflow: 'hidden',
    marginTop: 14,
    justifyContent: 'flex-end',
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
  sectionTitle: {
    ...type.title,
    fontSize: 25,
    color: colors.ink,
    marginTop: 26,
    marginBottom: 12,
  },
  moods: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 7,
  },
  mood: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  moodActive: {
    backgroundColor: '#FFF0F1',
    borderColor: '#EFDCDD',
  },
  moodEmoji: {
    fontSize: 25,
  },
  moodLabel: {
    ...type.tiny,
    color: colors.text,
    marginTop: 4,
    fontWeight: '800',
  },
  moodLabelActive: {
    color: colors.plum,
  },
  sessionCard: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 14,
  },
  sessionBadge: {
    ...type.tiny,
    color: '#CE6F79',
    fontWeight: '900',
  },
  sessionTitle: {
    ...type.title,
    fontSize: 24,
    lineHeight: 29,
    color: colors.ink,
    marginTop: 3,
  },
  sessionNarrator: {
    ...type.small,
    color: colors.text,
    marginTop: 4,
    lineHeight: 20,
  },
  playButton: {
    width: 58,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#FFF0F1',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#CE6F79',
    borderRadius: 999,
  },
  timeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    ...type.tiny,
    color: colors.text,
    fontWeight: '900',
  },
  sounds: {
    flexDirection: 'row',
    gap: 10,
  },
  sound: {
    flex: 1,
    minHeight: 116,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  soundActive: {
    backgroundColor: '#FFF0F1',
    borderColor: '#EFDCDD',
  },
  soundIcon: {
    width: 44,
    height: 44,
    borderRadius: 19,
    backgroundColor: '#FFF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundLabel: {
    ...type.small,
    color: colors.ink,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '800',
  },
  intentions: {
    gap: 12,
  },
  intention: {
    flexDirection: 'row',
    gap: 13,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  intentionIcon: {
    width: 48,
    height: 48,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentionTitle: {
    ...type.bodyStrong,
    color: colors.ink,
  },
  intentionCopy: {
    ...type.small,
    color: colors.text,
    marginTop: 3,
    lineHeight: 20,
  },
});
