import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { signInWithEmail } from '@/services/auth';

export default function LoginScreen() {
  const { palette } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)/home' as never);
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Could not log in', 'Check your email and password, then try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.page, { backgroundColor: palette.canvas }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <Image source={require('../../assets/images/login-hero.jpg')} style={styles.heroImage} resizeMode="cover" />

        <View style={[styles.logo, { backgroundColor: palette.surface }]}>
          <Ionicons name="heart" size={30} color={palette.accent} />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <Text style={[styles.eyebrow, { color: palette.accent }]}>WELCOME BACK</Text>
        <Text style={[styles.title, { color: palette.ink }]}>Log in to Preggy</Text>
        <Text style={[styles.subtitle, { color: palette.text }]}>
          Continue tracking your pregnancy journey, appointments, reminders, and daily wellness.
        </Text>

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

        <AnimatedPressable onPress={() => router.push('/auth/forgot-password' as never)} style={styles.forgot}>
          <Text style={[styles.forgotText, { color: palette.accent }]}>Forgot password?</Text>
        </AnimatedPressable>

        <AnimatedPressable
          onPress={handleLogin}
          disabled={loading}
          style={[styles.primaryButton, { backgroundColor: palette.accent, opacity: loading ? 0.75 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color={palette.onAccent} />
          ) : (
            <>
              <Text style={[styles.primaryText, { color: palette.onAccent }]}>Log in</Text>
              <Ionicons name="arrow-forward" size={20} color={palette.onAccent} />
            </>
          )}
        </AnimatedPressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: palette.text }]}>New to Preggy?</Text>
          <AnimatedPressable onPress={() => router.push('/auth/create-account' as never)}>
            <Text style={[styles.footerLink, { color: palette.accent }]}>Create account</Text>
          </AnimatedPressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  hero: {
    height: 275,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  logo: {
    position: 'absolute',
    bottom: -30,
    left: 26,
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    marginTop: -10,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 44,
  },
  eyebrow: {
    ...type.section,
  },
  title: {
    ...type.title,
    fontSize: 32,
    marginTop: 5,
  },
  subtitle: {
    ...type.body,
    lineHeight: 23,
    marginTop: 8,
    marginBottom: 22,
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
  forgot: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginBottom: 18,
  },
  forgotText: {
    ...type.small,
    fontWeight: '900',
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
    marginTop: 22,
  },
  footerText: {
    ...type.small,
  },
  footerLink: {
    ...type.small,
    fontWeight: '900',
  },
});
