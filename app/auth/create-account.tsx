import React, { useState } from 'react';
import { Keyboard, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/layout/Screen';
import { Header } from '@/components/layout/Header';
import { TextField } from '@/components/forms/TextField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/cards/Card';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { signUpWithEmail } from '@/services/auth';

export default function CreateAccountScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const createAccount = async () => {
    Keyboard.dismiss();

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      setError('Please enter your full name, email, and password.');
      setSuccess('');
      return;
    }

    if (!cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      setSuccess('');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setSuccess('');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const data = await signUpWithEmail(cleanEmail, password, cleanName);

      if (data.session) {
        router.replace('/(tabs)/home');
        return;
      }

      setSuccess('Account created. Please check your email, then log in.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create account.';
      setError(message);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen bottomSpace={40}>
      <Header title="Preggers" showAvatar={false} />

      <Text style={styles.title}>Join Our Sanctuary</Text>
      <Text style={styles.subtitle}>
        Start your journey with a community that nurtures your wellness and growth.
      </Text>

      <Card>
        <TextField
          label="Full Name"
          placeholder="E.g. Sarah Mitchell"
          value={fullName}
          onChangeText={(value) => {
            setFullName(value);
            setError('');
            setSuccess('');
          }}
        />

        <TextField
          label="Email Address"
          placeholder="sarah@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError('');
            setSuccess('');
          }}
        />

        <TextField
          label="Password"
          placeholder="At least 6 characters"
          secureTextEntry
          enablePasswordToggle
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError('');
            setSuccess('');
          }}
          onSubmitEditing={createAccount}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <Button
          label={loading ? 'Creating Account...' : 'Create Account'}
          onPress={createAccount}
          style={{ marginTop: 8 }}
        />

        <Text style={styles.divider}>or continue with</Text>

        <View style={styles.socialRow}>
          <Button label="Google" variant="secondary" style={styles.social} />
          <Button label="Apple" variant="secondary" style={styles.social} />
        </View>
      </Card>

      <AnimatedPressable onPress={() => router.push('/auth/log-in')} style={styles.linkWrap}>
        <Text style={styles.link}>
          Already have an account? <Text style={styles.strong}>Log in</Text>
        </Text>
      </AnimatedPressable>

      <Text style={styles.legal}>
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...type.hero,
    color: colors.ink,
    marginTop: 34,
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    color: colors.text,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  error: {
    ...type.small,
    color: '#D85D67',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 10,
  },
  success: {
    ...type.small,
    color: '#5B8A68',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 10,
  },
  divider: {
    ...type.small,
    color: colors.muted,
    textAlign: 'center',
    marginVertical: 20,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  social: {
    flex: 1,
    minHeight: 52,
  },
  linkWrap: {
    alignItems: 'center',
    marginTop: 22,
  },
  link: {
    ...type.body,
    color: colors.text,
  },
  strong: {
    color: colors.plum,
    fontWeight: '800',
  },
  legal: {
    ...type.tiny,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
});