import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
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
      <View style={styles.top}>
        <AnimatedPressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: palette.surface, borderColor: palette.line }]}
        >
          <Ionicons name="chevron-back" size={22} color={palette.ink} />
        </AnimatedPressable>

        <View style={[styles.iconBubble, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name="heart" size={46} color={palette.accent} />
        </View>

        <Text style={[styles.eyebrow, { color: palette.accent }]}>START YOUR JOURNEY</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Save your pregnancy profile, reminders, symptoms, appointments, and weekly growth.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
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

        <Text style={[styles.helper, { color: palette.text }]}>
          By continuing, you agree to use Preggy as a wellness companion and to contact your care team for urgent medical concerns.
        </Text>

        <AnimatedPressable
          onPress={handleCreateAccount}
          disabled={loading}
          style={[styles.primaryButton, { backgroundColor: palette.accent, opacity: loading ? 0.75 : 1 }]}
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

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: palette.text }]}>Already have an account?</Text>
          <AnimatedPressable onPress={() => router.replace('/auth/log-in' as never)}>
            <Text style={[styles.footerLink, { color: palette.accent }]}>Log in</Text>
          </AnimatedPressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 58,
  },
  top: {
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubble: {
    width: 118,
    height: 118,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 32,
    textAlign: 'center',
    marginTop: 5,
  },
  subtitle: {
    ...type.body,
    textAlign: 'center',
    lineHeight: 23,
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 18,
  },
  inputWrap: {
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    ...type.body,
    paddingVertical: 0,
  },
  helper: {
    ...type.tiny,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 16,
  },
  primaryButton: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  primaryText: {
    ...type.bodyStrong,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
  },
  footerText: {
    ...type.small,
  },
  footerLink: {
    ...type.small,
    fontWeight: '900',
  },
});
