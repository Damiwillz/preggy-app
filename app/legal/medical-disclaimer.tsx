import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

export default function MedicalDisclaimerScreen() {
  const { palette } = useAppTheme();
  return (
    <Screen bottomSpace={36} style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <Header title="Medical Disclaimer" back />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.iconCircle, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="medkit-outline" size={34} color={palette.accent} />
          </View>

          <Text style={[styles.title, { color: palette.ink }]}>Preggy is not medical advice</Text>

          <Text style={[styles.subtitle, { color: palette.text }]}>
            Preggy is designed to support pregnancy wellness, organization, and daily tracking.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>Important safety note</Text>

          <Text style={[styles.copy, { color: palette.text }]}>
            Preggy does not replace professional medical advice, diagnosis, treatment, or emergency care.
          </Text>

          <Text style={[styles.copy, { color: palette.text }]}>
            Always speak with your doctor, midwife, nurse, or qualified healthcare provider about health questions, symptoms, medication, supplements, appointments, and pregnancy concerns.
          </Text>
        </View>

        <View style={[styles.warningCard, { backgroundColor: palette.softSurface, borderColor: palette.line }]}>
          <Ionicons name="warning-outline" size={24} color={palette.warning} />

          <View style={styles.warningTextWrap}>
            <Text style={[styles.warningTitle, { color: palette.warning }]}>For urgent symptoms</Text>
            <Text style={[styles.warningText, { color: palette.text }]}>
              Contact your healthcare provider or emergency services immediately if you have severe pain, heavy bleeding, breathing difficulty, fainting, severe headache, vision changes, reduced baby movement, or any urgent concern.
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>Preggy AI</Text>

          <Text style={[styles.copy, { color: palette.text }]}>
            Preggy AI can provide general wellness information and help you organize questions, but it cannot diagnose medical conditions or decide treatment.
          </Text>

          <Text style={[styles.copy, { color: palette.text }]}>
            Do not rely on Preggy AI for emergencies or serious symptoms. Use it as a support tool, not as a medical professional.
          </Text>
        </View>

        <AnimatedPressable style={[styles.button, { backgroundColor: palette.accent }]} onPress={() => router.back()}>
          <Text style={[styles.buttonText, { color: palette.onAccent }]}>I Understand</Text>
        </AnimatedPressable>
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
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    ...type.title,
    color: '#2A151B',
    fontSize: 29,
    lineHeight: 35,
    textAlign: 'center',
    letterSpacing: -0.7,
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
  copy: {
    ...type.body,
    color: '#675157',
    lineHeight: 24,
    marginBottom: 10,
  },
  warningCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF0E8',
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F2D4C8',
  },
  warningTextWrap: {
    flex: 1,
  },
  warningTitle: {
    ...type.bodyStrong,
    color: '#8B3A2E',
    fontSize: 17,
    marginBottom: 6,
  },
  warningText: {
    ...type.small,
    color: '#8B3A2E',
    lineHeight: 21,
    fontWeight: '700',
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
