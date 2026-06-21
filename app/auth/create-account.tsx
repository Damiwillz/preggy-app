import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { signUpWithEmail } from '@/services/auth';

export default function CreateAccountScreen() {
  const { palette } = useAppTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleCreateAccount() {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your name, email, and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(email.trim(), password, fullName.trim());

      Alert.alert('Account created', 'Welcome to Preggy.', [
        {
          text: 'Continue',
          onPress: () => router.replace('/(tabs)/home' as never),
        },
      ]);
    } catch (error) {
      console.log('Create account error:', error);
      Alert.alert('Could not create account', 'Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.page, { backgroundColor: palette.canvas }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <AnimatedPressable
            onPress={() => router.replace('/onboarding/track-milestones' as never)}
            style={[styles.roundButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
          >
            <Ionicons name="chevron-back" size={22} color={palette.ink} />
          </AnimatedPressable>

          <AnimatedPressable onPress={() => router.replace('/auth/log-in' as never)}>
            <Text style={[styles.topLink, { color: palette.accent }]}>Log in</Text>
          </AnimatedPressable>
        </View>

        <View style={[styles.hero, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.heroCircle, { backgroundColor: palette.surface }]}>
            <Ionicons name="heart" size={52} color={palette.accent} />
          </View>

          <View style={[styles.floatCard, styles.floatOne, { backgroundColor: palette.surface }]}>
            <Ionicons name="calendar" size={20} color={palette.accent} />
            <Text style={[styles.floatText, { color: palette.ink }]}>Appointments</Text>
          </View>

          <View style={[styles.floatCard, styles.floatTwo, { backgroundColor: palette.surface }]}>
            <Ionicons name="pulse" size={20} color={palette.accent} />
            <Text style={[styles.floatText, { color: palette.ink }]}>Symptoms</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
          <Text style={[styles.eyebrow, { color: palette.accent }]}>JOIN PREGGY</Text>
          <Text style={[styles.title, { color: palette.ink }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: palette.text }]}>
            Save your profile, due date, weekly growth, reminders, and private wellness settings.
          </Text>

          <View style={[styles.inputWrap, { backgroundColor: palette.softSurface, borderColor: palette.line }]}>
            <Ionicons name="person-outline" size={20} color={palette.muted} />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={palette.muted}
              style={[styles.input, { color: palette.ink }]}
            />
          </View>

          <View style={[styles.inputWrap, { backgroundColor: palette.softSurface, borderColor: palette.line }]}>
            <Ionicons name="mail-outline" size={20} color={palette.muted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={palette.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { color: palette.ink }]}
            />
          </View>

          <View style={[styles.inputWrap, { backgroundColor: palette.softSurface, borderColor: palette.line }]}>
            <Ionicons name="lock-closed-outline" size={20} color={palette.muted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={palette.muted}
              secureTextEntry={secure}
              style={[styles.input, { color: palette.ink }]}
            />

            <AnimatedPressable onPress={() => setSecure((value) => !value)}>
              <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={20} color={palette.muted} />
            </AnimatedPressable>
          </View>

          <View style={[styles.privacyNote, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="shield-checkmark" size={18} color={palette.accent} />
            <Text style={[styles.privacyText, { color: palette.text }]}>
              Your information stays connected to your account and can be exported from Privacy.
            </Text>
          </View>

          <AnimatedPressable
            onPress={handleCreateAccount}
            disabled={loading}
            style={[styles.primaryButton, { backgroundColor: palette.accent, opacity: loading ? 0.72 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color={palette.onAccent} />
            ) : (
              <>
                <Text style={[styles.primaryText, { color: palette.onAccent }]}>Create account</Text>
                <Ionicons name="arrow-forward" size={20} color={palette.onAccent} />
              </>
            )}
          </AnimatedPressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 36,
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
  topLink: {
    ...type.small,
    fontWeight: '900',
  },
  hero: {
    height: 160,
    borderRadius: 28,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatCard: {
    position: 'absolute',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  floatOne: {
    left: 18,
    top: 30,
  },
  floatTwo: {
    right: 18,
    bottom: 30,
  },
  floatText: {
    ...type.tiny,
    fontWeight: '900',
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 28,
    marginTop: 5,
  },
  subtitle: {
    ...type.body,
    lineHeight: 21,
    marginTop: 6,
    marginBottom: 12,
  },
  inputWrap: {
    height: 54,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 9,
  },
  input: {
    flex: 1,
    ...type.body,
    paddingVertical: 0,
  },
  privacyNote: {
    borderRadius: 17,
    padding: 12,
    flexDirection: 'row',
    gap: 9,
    marginBottom: 12,
  },
  privacyText: {
    ...type.tiny,
    flex: 1,
    lineHeight: 18,
  },
  primaryButton: {
    height: 54,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryText: {
    ...type.bodyStrong,
  },
});
