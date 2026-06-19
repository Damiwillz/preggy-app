import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/cards/Card';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

const moods = [['😊','Happy'],['😌','Calm'],['😴','Tired'],['🤢','Queasy'],['🤯','Tense']];
const symptoms = ['Nausea','Back Pain','Fatigue','Swelling','Baby Kicks','Other'];

export default function LogScreen() {
  return (
    <Screen>
      <Header title="Daily Log" />
      <Text style={styles.eyebrow}>TODAY’S FOCUS</Text>
      <Text style={styles.title}>How are you feeling?</Text>
      <Text style={styles.date}>Wednesday, October 25</Text>
      <Text style={styles.week}>Week 24 • 2nd Trimester</Text>
      <Card style={styles.card}>
        <Text style={styles.section}>Current Mood</Text>
        <View style={styles.moodRow}>{moods.map(([emoji,label], index) => <AnimatedPressable key={label} style={[styles.mood, index === 1 && styles.moodActive]}><Text style={styles.emoji}>{emoji}</Text><Text style={styles.moodText}>{label}</Text></AnimatedPressable>)}</View>
        <Text style={styles.section}>Physical Symptoms</Text>
        <View style={styles.chips}>{symptoms.map((item, index) => <View key={item} style={[styles.chip, index < 3 && styles.chipActive]}><Text style={[styles.chipText, index < 3 && styles.chipActiveText]}>{item}</Text></View>)}</View>
        <View style={styles.levelRow}><Text style={styles.section}>Overall Intensity</Text><Text style={styles.level}>Level 4</Text></View>
        <View style={styles.slider}><View style={styles.sliderFill} /><View style={styles.knob} /></View>
        <View style={styles.sliderLabels}><Text style={styles.copy}>Mild</Text><Text style={styles.copy}>Intense</Text></View>
        <Text style={styles.section}>Additional Notes</Text>
        <TextInput multiline placeholder="How are you feeling today? Any specific symptoms or cravings?" placeholderTextColor={colors.muted} style={styles.notes} />
      </Card>
      <Card style={styles.suggested}><Text style={styles.section}>Suggested for You</Text><Text style={styles.strong}>10-min Gentle Back Stretch</Text></Card>
      <Button label="Save Entry" style={{ marginTop: 18 }} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  eyebrow: { ...type.section, color: colors.rose, marginTop: 24 },
  title: { ...type.title, color: colors.ink, marginTop: 6 },
  date: { ...type.bodyStrong, color: colors.ink, marginTop: 18 },
  week: { ...type.small, color: colors.text, marginTop: 4, marginBottom: 18 },
  card: { gap: 16 },
  section: { ...type.section, color: colors.rose },
  moodRow: { flexDirection: 'row', gap: 8 },
  mood: { flex: 1, minHeight: 78, borderRadius: 20, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  moodActive: { backgroundColor: colors.softSurface, borderColor: colors.blushDeep },
  emoji: { fontSize: 24, marginBottom: 5 },
  moodText: { ...type.tiny, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line },
  chipActive: { backgroundColor: colors.plum },
  chipText: { ...type.small, color: colors.text },
  chipActiveText: { color: colors.surface },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  level: { ...type.small, color: colors.plum },
  slider: { height: 10, borderRadius: 99, backgroundColor: colors.softSurface, overflow: 'visible' },
  sliderFill: { width: '58%', height: '100%', borderRadius: 99, backgroundColor: colors.plum },
  knob: { position: 'absolute', left: '56%', top: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 5, borderColor: colors.plum },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  copy: { ...type.small, color: colors.text },
  notes: { minHeight: 110, borderRadius: 22, padding: 16, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line, color: colors.ink, ...type.body, textAlignVertical: 'top' },
  suggested: { marginTop: 18 },
  strong: { ...type.bodyStrong, color: colors.ink, marginTop: 8 }
});
