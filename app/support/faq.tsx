import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const faqs = [
  {
    icon: 'create-outline',
    question: 'How do I update my pregnancy details?',
    answer: 'Go to Profile and open Pregnancy Details. You can update your baby nickname, due date, week, and days there.',
  },
  {
    icon: 'grid-outline',
    question: 'How do I find tools?',
    answer: 'Open Tools from the bottom tab, then choose a section like Tracking, Planning, Wellness, Memories, or Support.',
  },
  {
    icon: 'color-palette-outline',
    question: 'How do I change the app color?',
    answer: 'Go to Profile, tap Appearance, then choose the accent color that feels best to you.',
  },
  {
    icon: 'phone-portrait-outline',
    question: 'Why did my app show an error screen?',
    answer: 'Usually it means one screen had a small code issue. Close and reopen the app, then send a screenshot if it keeps happening.',
  },
  {
    icon: 'shield-checkmark-outline',
    question: 'Is Preggy medical advice?',
    answer: 'No. Preggy helps you stay organized, but your doctor, midwife, or care team should guide medical decisions.',
  },
  {
    icon: 'cloud-offline-outline',
    question: 'Where is my app data saved?',
    answer: 'Some tools save on your device, while account features may use your signed-in profile. Avoid deleting the app unless you are okay losing local-only data.',
  },
] as const;

const quickActions = [
  {
    icon: 'person-outline',
    title: 'Edit Profile',
    detail: 'Update name and pregnancy details',
    route: '/edit-profile',
  },
  {
    icon: 'mail-outline',
    title: 'Contact Support',
    detail: 'Send feedback or ask for help',
    route: '/support/contact',
  },
  {
    icon: 'medkit-outline',
    title: 'Medical Disclaimer',
    detail: 'Read the safety note',
    route: '/legal/medical-disclaimer',
  },
] as const;

export default function HelpFaqScreen() {
  const { palette } = useAppTheme();

  return (
    <Screen bottomSpace={36} style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <Header title="Help & FAQ" back />

      <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.heroIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="help-circle-outline" size={34} color={palette.accent} />
        </View>

        <Text style={[styles.kicker, { color: palette.accentStrong }]}>PREGGY HELP</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Quick answers, calm support</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Find answers to common questions about your profile, tools, app colors, and safety.
        </Text>
      </View>

      <View style={styles.quickGrid}>
        {quickActions.map((item) => (
          <AnimatedPressable
            key={item.title}
            style={[styles.quickCard, { backgroundColor: palette.surface, borderColor: palette.line }]}
            onPress={() => router.push(item.route as never)}
          >
            <View style={[styles.quickIcon, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name={item.icon} size={20} color={palette.accent} />
            </View>

            <View style={styles.quickText}>
              <Text style={[styles.quickTitle, { color: palette.ink }]}>{item.title}</Text>
              <Text style={[styles.quickDetail, { color: palette.text }]}>{item.detail}</Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={palette.muted} />
          </AnimatedPressable>
        ))}
      </View>

      <Text style={[styles.section, { color: palette.ink }]}>Common questions</Text>

      <View style={[styles.faqCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        {faqs.map((item, index) => (
          <View
            key={item.question}
            style={[
              styles.faqItem,
              index < faqs.length - 1 && { borderBottomColor: palette.line, borderBottomWidth: 1 },
            ]}
          >
            <View style={[styles.faqIcon, { backgroundColor: palette.accentSoft }]}>
              <Ionicons name={item.icon} size={20} color={palette.accent} />
            </View>

            <View style={styles.faqText}>
              <Text style={[styles.question, { color: palette.ink }]}>{item.question}</Text>
              <Text style={[styles.answer, { color: palette.text }]}>{item.answer}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.note, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}>
        <Ionicons name="heart-outline" size={22} color={palette.accentStrong} />
        <Text style={[styles.noteText, { color: palette.text }]}>
          If something feels urgent or unsafe, contact your doctor, midwife, local emergency number, or care team.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFF8F5',
  },
  hero: {
    borderRadius: 30,
    padding: 22,
    marginTop: 18,
    borderWidth: 1,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  kicker: {
    ...type.tiny,
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '900',
    marginBottom: 8,
  },
  title: {
    ...type.title,
    fontSize: 32,
    lineHeight: 37,
    letterSpacing: -0.8,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 10,
  },
  quickGrid: {
    gap: 12,
    marginTop: 16,
  },
  quickCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    flex: 1,
  },
  quickTitle: {
    ...type.bodyStrong,
    fontSize: 16,
  },
  quickDetail: {
    ...type.small,
    marginTop: 3,
    lineHeight: 19,
  },
  section: {
    ...type.bodyStrong,
    fontSize: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  faqCard: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqItem: {
    padding: 18,
    flexDirection: 'row',
    gap: 13,
  },
  faqIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqText: {
    flex: 1,
  },
  question: {
    ...type.bodyStrong,
    fontSize: 16,
    lineHeight: 21,
  },
  answer: {
    ...type.small,
    lineHeight: 21,
    marginTop: 6,
  },
  note: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  noteText: {
    ...type.small,
    flex: 1,
    lineHeight: 21,
    fontWeight: '700',
  },
});
