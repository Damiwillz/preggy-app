import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Header } from '@/components/layout/Header';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

const supportEmail = 'dammywillz@gmail.com';

export default function ContactSupportScreen() {
  const { palette } = useAppTheme();
  async function emailSupport() {
    const subject = encodeURIComponent('Preggy Support Request');
    const body = encodeURIComponent(
      'Hi Preggy Support,\n\nI need help with:\n\n'
    );

    const url = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Email unavailable', `Please email us directly at ${supportEmail}`);
    }
  }

  return (
    <Screen bottomSpace={36} style={[styles.screen, { backgroundColor: palette.canvas }]}>
      <Header title="Contact Support" back />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <View style={[styles.iconCircle, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="chatbubbles-outline" size={34} color={palette.accent} />
          </View>

          <Text style={[styles.title, { color: palette.ink }]}>How can we help?</Text>

          <Text style={[styles.subtitle, { color: palette.text }]}>
            Contact Preggy support for account help, privacy questions, app issues, or feedback.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>Support email</Text>
          <Text style={[styles.copy, { color: palette.text }]}>{supportEmail}</Text>

          <AnimatedPressable style={[styles.button, { backgroundColor: palette.accent }]} onPress={emailSupport}>
            <Ionicons name="mail-outline" size={21} color={palette.onAccent} />
            <Text style={[styles.buttonText, { color: palette.onAccent }]}>Email Support</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={[styles.secondaryButton, { backgroundColor: palette.accentSoft, borderColor: palette.line }]}
            onPress={() => Alert.alert('Support email', supportEmail)}
          >
            <Ionicons name="information-circle-outline" size={20} color={palette.accent} />
            <Text style={[styles.secondaryButtonText, { color: palette.accent }]}>Show Email Address</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.sectionTitle, { color: palette.ink }]}>Before you contact us</Text>

          <Text style={[styles.item, { color: palette.text }]}>• Include the email linked to your Preggy account.</Text>
          <Text style={[styles.item, { color: palette.text }]}>• Describe what you were trying to do.</Text>
          <Text style={[styles.item, { color: palette.text }]}>• Add screenshots if there is an error.</Text>
          <Text style={[styles.item, { color: palette.text }]}>• Do not send passwords or private medical records.</Text>
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
    fontSize: 30,
    lineHeight: 36,
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
    marginBottom: 16,
  },
  item: {
    ...type.body,
    color: '#675157',
    lineHeight: 25,
    marginBottom: 8,
  },
  button: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#CE6F79',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  buttonText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
    fontSize: 16,
  },

  secondaryButton: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F1CDD2',
  },
  secondaryButtonText: {
    ...type.bodyStrong,
    color: '#CE6F79',
    fontSize: 15,
  },
});
