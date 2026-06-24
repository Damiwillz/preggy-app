import React, { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { TextField } from '@/components/forms/TextField';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { sendPasswordReset } from '@/services/auth';

const LOGIN_PLUM = '#CE6F79';
const LOGIN_PLUM_SOFT = '#FFF0F1';
const LOGIN_TEXT = '#2A151B';
const LOGIN_MUTED = '#9C7B82';
const LOGIN_LINE = '#EFDCDD';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const canSubmit = useMemo(() => cleanEmail.includes('@'), [cleanEmail]);

  async function submit() {
    Keyboard.dismiss();

    if (!cleanEmail.includes('@')) {
      Alert.alert('Email required', 'Enter the email address linked to your Preggy account.');
      return;
    }

    setSubmitting(true);

    try {
      await sendPasswordReset(cleanEmail);

      Alert.alert(
        'Check your email',
        'We sent a secure password reset link to your email. Open the newest link to create a new password.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/log-in' as never),
          },
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Reset failed', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen bottomSpace={26} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.topBar}>
          <AnimatedPressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={24} color={LOGIN_TEXT} />
          </AnimatedPressable>

          <Text style={styles.brand}>Preggy</Text>

          <View style={styles.topSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.iconShell}>
            <View style={styles.iconTint}>
              <Ionicons name="key-outline" size={30} color={LOGIN_PLUM} />
            </View>
          </View>

          <Text style={styles.title}>Reset your password</Text>

          <Text style={styles.subtitle}>
            Enter your email and we’ll send a secure link to help you get back in.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.note}>
            <Ionicons name="shield-checkmark-outline" size={20} color={LOGIN_PLUM} />
            <Text style={styles.noteText}>
              Reset links expire quickly. Use the newest email link only.
            </Text>
          </View>

          <TextField
            label="Email address"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={submit}
          />

          <Button
            label={submitting ? 'Sending reset link...' : 'Send Reset Link'}
            onPress={submit}
            disabled={submitting}
            style={!canSubmit ? styles.inactiveButton : styles.primaryButton}
          />

          <AnimatedPressable style={styles.loginLink} onPress={() => router.replace('/auth/log-in' as never)}>
            <Text style={styles.loginLinkText}>
              Remembered it? <Text style={styles.loginLinkStrong}>Log in</Text>
            </Text>
          </AnimatedPressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFF8F5',
    paddingHorizontal: 22,
  },
  keyboard: {
    flex: 1,
  },
  topBar: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: LOGIN_LINE,
    shadowColor: LOGIN_TEXT,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  brand: {
    ...type.bodyStrong,
    color: LOGIN_TEXT,
    fontSize: 18,
  },
  topSpacer: {
    width: 46,
    height: 46,
  },
  hero: {
    marginTop: 18,
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 26,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LOGIN_LINE,
    shadowColor: LOGIN_TEXT,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  iconShell: {
    width: 78,
    height: 78,
    borderRadius: 28,
    backgroundColor: LOGIN_PLUM_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  iconTint: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F7D6DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...type.title,
    color: LOGIN_TEXT,
    fontSize: 30,
    lineHeight: 35,
    textAlign: 'center',
    letterSpacing: -0.7,
  },
  subtitle: {
    ...type.body,
    color: LOGIN_MUTED,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
    maxWidth: 305,
  },
  card: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: LOGIN_LINE,
    shadowColor: LOGIN_TEXT,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  note: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: LOGIN_PLUM_SOFT,
    borderRadius: 18,
    padding: 13,
    marginBottom: 18,
  },
  noteText: {
    ...type.small,
    flex: 1,
    color: LOGIN_MUTED,
    lineHeight: 18,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: LOGIN_PLUM,
  },
  inactiveButton: {
    backgroundColor: LOGIN_PLUM,
    opacity: 0.55,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },
  loginLinkText: {
    ...type.small,
    color: LOGIN_MUTED,
  },
  loginLinkStrong: {
    color: LOGIN_PLUM,
    fontWeight: '900',
  },
});
