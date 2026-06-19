import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

const moods = [
  ['Pensive', 'cloud-outline', '😶‍🌫️'],
  ['Calm', 'water-outline', '😌'],
  ['Joyful', 'sunny-outline', '😊'],
  ['Tired', 'moon-outline', '🥱'],
  ['Serene', 'flower-outline', '🌸'],
] as const;

const intentions = [
  ['phone-portrait-outline', 'Create a screen-free zone', 'Reclaim your mental space before sleep.'],
  ['body-outline', 'Gentle evening stretching', 'Release tension from your back and hips.'],
  ['journal-outline', 'Mindful journaling', 'Write down three things you are grateful for.'],
] as const;

export default function SanctuaryScreen() {
  const [mood, setMood] = useState('Calm');
  const [playing, setPlaying] = useState(false);
  const [sound, setSound] = useState('Rainfall');

  return (
    <Screen bottomSpace={44}>
      <Header title="Your Sanctuary" back />
      <View style={styles.hero}>
        <Image source={require('../../assets/images/tips-sanctuary-hero.jpg')} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(32,22,20,.72)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.heroText}><Text style={styles.heroTitle}>Peaceful Moments</Text><Text style={styles.heroCopy}>Find your center today</Text></View>
      </View>

      <Text style={styles.sectionTitle}>How are you feeling?</Text>
      <View style={styles.moods}>
        {moods.map(([label, , emoji]) => (
          <AnimatedPressable key={label} onPress={() => setMood(label)} style={[styles.mood, mood === label && styles.moodActive]}>
            <Text style={styles.moodEmoji}>{emoji}</Text>
            <Text style={[styles.moodLabel, mood === label && styles.moodLabelActive]}>{label}</Text>
          </AnimatedPressable>
        ))}
      </View>

      <View style={styles.sessionCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sessionBadge}>GUIDED SESSION</Text>
          <Text style={styles.sessionTitle}>10-minute Calming Breath</Text>
          <Text style={styles.sessionNarrator}>Narrated by Dr. Elena Grace</Text>
        </View>
        <AnimatedPressable onPress={() => setPlaying(v => !v)} style={styles.playButton}>
          <Ionicons name={playing ? 'pause' : 'play'} size={27} color={colors.plum} />
        </AnimatedPressable>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: playing ? '54%' : '34%' }]} /></View>
        <View style={styles.timeRow}><Text style={styles.time}>3:42</Text><Text style={styles.time}>10:00</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Ambient Sanctuary</Text>
      <View style={styles.sounds}>
        {[
          ['Rainfall', 'rainy-outline'],
          ['Soft Piano', 'musical-notes-outline'],
          ['Forest Birds', 'leaf-outline'],
        ].map(([label, icon]) => (
          <AnimatedPressable key={label} onPress={() => setSound(label)} style={[styles.sound, sound === label && styles.soundActive]}>
            <View style={styles.soundIcon}><Ionicons name={icon as any} size={24} color={colors.plum} /></View>
            <Text style={styles.soundLabel}>{label}</Text>
            {sound === label && <Ionicons name="checkmark-circle" size={20} color={colors.rose} />}
          </AnimatedPressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Daily Intentions</Text>
      <View style={styles.intentions}>
        {intentions.map(([icon, title, copy], index) => (
          <View key={title} style={styles.intention}>
            <View style={[styles.intentionIcon, { backgroundColor: index === 0 ? '#E9E5FF' : index === 1 ? '#F9E0E7' : '#FFEADB' }]}>
              <Ionicons name={icon} size={21} color={colors.plum} />
            </View>
            <View style={{ flex: 1 }}><Text style={styles.intentionTitle}>{title}</Text><Text style={styles.intentionCopy}>{copy}</Text></View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: 245, borderRadius: 25, overflow: 'hidden', marginTop: 12, justifyContent: 'flex-end' },
  heroText: { padding: 22 },
  heroTitle: { ...type.hero, color: '#fff' },
  heroCopy: { ...type.body, color: '#fff' },
  sectionTitle: { ...type.title, fontSize: 24, color: colors.ink, marginTop: 24, marginBottom: 12 },
  moods: { flexDirection: 'row', justifyContent: 'space-between', gap: 7 },
  mood: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  moodActive: { backgroundColor: '#F9DDE2', borderColor: '#E8BBC6' },
  moodEmoji: { fontSize: 25 },
  moodLabel: { ...type.tiny, color: colors.text, marginTop: 3 },
  moodLabelActive: { color: colors.plum },
  sessionCard: { marginTop: 24, backgroundColor: colors.surface, borderRadius: 25, padding: 20, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 },
  sessionBadge: { ...type.tiny, color: colors.rose },
  sessionTitle: { ...type.title, fontSize: 24, lineHeight: 29, color: colors.ink, marginTop: 3 },
  sessionNarrator: { ...type.small, color: colors.text, marginTop: 2 },
  playButton: { width: 58, height: 50, borderRadius: 20, backgroundColor: '#F8DDE0', alignItems: 'center', justifyContent: 'center' },
  progressTrack: { width: '100%', height: 5, borderRadius: 3, backgroundColor: '#EDE6E3', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.plum, borderRadius: 3 },
  timeRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
  time: { ...type.tiny, color: colors.text },
  sounds: { flexDirection: 'row', gap: 10 },
  sound: { flex: 1, minHeight: 110, backgroundColor: colors.surface, borderRadius: 22, padding: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  soundActive: { backgroundColor: colors.softSurface, borderColor: '#E9C5CD' },
  soundIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  soundLabel: { ...type.small, color: colors.ink, marginTop: 7, textAlign: 'center' },
  intentions: { gap: 11 },
  intention: { flexDirection: 'row', gap: 13, backgroundColor: colors.surface, borderRadius: 20, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  intentionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  intentionTitle: { ...type.bodyStrong, color: colors.ink },
  intentionCopy: { ...type.small, color: colors.text, marginTop: 2 },
});
