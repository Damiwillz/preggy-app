import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

export default function AboutPreggyScreen() {
  const { palette } = useAppTheme();
  return (
    <Screen bottomSpace={36} style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <Header title="About Preggy" back />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.iconCircle, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="heart-outline" size={36} color={palette.accent} />
          </View>

          <Text style={[styles.title, { color: palette.ink }]}>Preggy</Text>

          <Text style={[styles.subtitle, { color: palette.text }]}>
            A calm pregnancy companion for tracking, planning, reminders, and wellness support.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>What Preggy helps with</Text>

          <Text style={[styles.item, { color: palette.text }]}>• Pregnancy progress and weekly growth</Text>
          <Text style={[styles.item, { color: palette.text }]}>• Symptom and mood logging</Text>
          <Text style={[styles.item, { color: palette.text }]}>• Appointments and medication reminders</Text>
          <Text style={[styles.item, { color: palette.text }]}>• Tips, articles, and pregnancy preparation</Text>
          <Text style={[styles.item, { color: palette.text }]}>• Privacy controls and data export</Text>
          <Text style={[styles.item, { color: palette.text }]}>• Preggy AI wellness guidance</Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>Version</Text>
          <Text style={[styles.copy, { color: palette.text }]}>Preggy 1.1.0</Text>
        </View>

        <View style={[styles.note, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
          <Ionicons name="medkit-outline" size={22} color={palette.accentStrong} />
          <Text style={[styles.noteText, { color: palette.text }]}>
            Preggy is not medical advice. Contact your doctor, midwife, or emergency services for urgent concerns.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFF8F5',
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 24,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  iconCircle: {
    width: 82,
    height: 82,
    borderRadius: 30,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    ...type.title,
    color: '#2A151B',
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  subtitle: {
    ...type.body,
    color: '#9C7B82',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#EFDCDD',
  },
  sectionTitle: {
    ...type.bodyStrong,
    color: '#2A151B',
    fontSize: 18,
    marginBottom: 10,
  },
  item: {
    ...type.body,
    color: '#675157',
    lineHeight: 25,
    marginBottom: 8,
  },
  copy: {
    ...type.body,
    color: '#675157',
    lineHeight: 24,
  },
  note: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF0E8',
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F2D4C8',
  },
  noteText: {
    ...type.small,
    flex: 1,
    color: '#8B3A2E',
    lineHeight: 21,
    fontWeight: '700',
  },
});
