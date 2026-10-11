import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/AppThemeContext';
import { signInWithEmail } from '@/services/auth';

export default function LoginScreen() {
  const { palette } = useAppTheme();
  const { startGuestMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [focused, setFocused] = useState<
    'email' | 'password' | null
  >(null);
  const [loading, setLoading] = useState<
    'login' | 'guest' | null
  >(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert(
        'Enter your details',
        'Add your email address and password.'
      );
      return;
    }

    setLoading('login');

    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)/home' as never);
    } catch (error) {
      console.log('Login error:', error);

      Alert.alert(
        'Could not log in',
        'Check your email and password, then try again.'
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleGuestMode() {
    setLoading('guest');

    try {
      await startGuestMode();
      router.replace('/(tabs)/home' as never);
    } catch (error) {
      console.log('Guest mode error:', error);

      Alert.alert(
        'Guest mode unavailable',
        'Please try again in a moment.'
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: palette.canvas },
      ]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.hero}>
            <Image
              source={require('../../assets/images/login-hero-clean.jpg')}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />

            <View style={styles.heroShade} />

            <View style={styles.heroTop}>
              <AnimatedPressable
                onPress={() =>
                  router.replace('/onboarding' as never)
                }
                accessibilityLabel="Go back"
                style={styles.glassButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color="#FFFFFF"
                />
              </AnimatedPressable>

              <View style={styles.heroBrand}>
                <Ionicons
                  name="heart"
                  size={15}
                  color="#FFFFFF"
                />

                <Text style={styles.heroBrandText}>
                  PREGGY
                </Text>
              </View>

              <AnimatedPressable
                onPress={() =>
                  router.replace(
                    '/auth/create-account' as never
                  )
                }
                style={styles.joinButton}
              >
                <Text style={styles.joinText}>Join</Text>
              </AnimatedPressable>
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.heroEyebrow}>
                YOUR PREGNANCY, YOUR SPACE
              </Text>

              <Text style={styles.heroTitle}>
                Feel supported,{'\n'}every day.
              </Text>

              <Text style={styles.heroSubtitle}>
                A calm home for your pregnancy journey.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.formSheet,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
                shadowColor: palette.ink,
              },
            ]}
          >
            <View
              style={[
                styles.sheetHandle,
                { backgroundColor: palette.line },
              ]}
            />

            <Text style={[styles.eyebrow, { color: palette.accent }]}>
              WELCOME BACK
            </Text>

            <Text style={[styles.title, { color: palette.ink }]}>
              Log in
            </Text>

            <Text style={[styles.subtitle, { color: palette.text }]}>
              Continue from exactly where you left off.
            </Text>

            <View style={styles.form}>
              <Text style={[styles.label, { color: palette.ink }]}>
                Email
              </Text>

              <View
                style={[
                  styles.inputShell,
                  {
                    backgroundColor: palette.canvas,
                    borderColor:
                      focused === 'email'
                        ? palette.accent
                        : palette.line,
                  },
                  focused === 'email' &&
                    styles.focusedInput,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color={
                    focused === 'email'
                      ? palette.accent
                      : palette.muted
                  }
                />

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="you@example.com"
                  placeholderTextColor={palette.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  style={[
                    styles.input,
                    { color: palette.ink },
                  ]}
                />
              </View>

              <View style={styles.passwordHeading}>
                <Text style={[styles.label, { color: palette.ink }]}>
                  Password
                </Text>

                <AnimatedPressable
                  onPress={() =>
                    router.push(
                      '/auth/forgot-password' as never
                    )
                  }
                >
                  <Text
                    style={[
                      styles.forgot,
                      { color: palette.accent },
                    ]}
                  >
                    Forgot password?
                  </Text>
                </AnimatedPressable>
              </View>

              <View
                style={[
                  styles.inputShell,
                  {
                    backgroundColor: palette.canvas,
                    borderColor:
                      focused === 'password'
                        ? palette.accent
                        : palette.line,
                  },
                  focused === 'password' &&
                    styles.focusedInput,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={
                    focused === 'password'
                      ? palette.accent
                      : palette.muted
                  }
                />

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="Your password"
                  placeholderTextColor={palette.muted}
                  secureTextEntry={secure}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleLogin()}
                  style={[
                    styles.input,
                    { color: palette.ink },
                  ]}
                />

                <AnimatedPressable
                  onPress={() =>
                    setSecure((current) => !current)
                  }
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={
                      secure
                        ? 'eye-outline'
                        : 'eye-off-outline'
                    }
                    size={20}
                    color={palette.muted}
                  />
                </AnimatedPressable>
              </View>
            </View>

            <AnimatedPressable
              onPress={() => void handleLogin()}
              disabled={loading !== null}
              style={[
                styles.primaryButton,
                { backgroundColor: palette.accent },
              ]}
            >
              {loading === 'login' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryText}>
                    Continue
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color="#FFFFFF"
                  />
                </>
              )}
            </AnimatedPressable>

            <View style={styles.dividerRow}>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: palette.line },
                ]}
              />

              <Text
                style={[
                  styles.dividerText,
                  { color: palette.muted },
                ]}
              >
                OR
              </Text>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: palette.line },
                ]}
              />
            </View>

            <AnimatedPressable
              onPress={() => void handleGuestMode()}
              disabled={loading !== null}
              style={[
                styles.guestButton,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.line,
                },
              ]}
            >
              {loading === 'guest' ? (
                <ActivityIndicator color={palette.accent} />
              ) : (
                <>
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={palette.accent}
                  />

                  <Text
                    style={[
                      styles.guestText,
                      { color: palette.ink },
                    ]}
                  >
                    Explore without an account
                  </Text>
                </>
              )}
            </AnimatedPressable>

            <View style={styles.signupRow}>
              <Text
                style={[
                  styles.signupText,
                  { color: palette.text },
                ]}
              >
                New to Preggy?
              </Text>

              <AnimatedPressable
                onPress={() =>
                  router.replace(
                    '/auth/create-account' as never
                  )
                }
              >
                <Text
                  style={[
                    styles.signupLink,
                    { color: palette.accent },
                  ]}
                >
                  Create account
                </Text>
              </AnimatedPressable>
            </View>
          </View>

          <View style={styles.privacy}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={palette.muted}
            />

            <Text
              style={[
                styles.privacyText,
                { color: palette.muted },
              ]}
            >
              Your information stays private and protected.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 5,
    paddingBottom: 35,
  },
  hero: {
    height: 385,
    borderRadius: 32,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(43,24,31,0.24)',
  },
  heroTop: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  glassButton: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBrand: {
    minHeight: 36,
    borderRadius: 16,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBrandText: {
    ...type.tiny,
    color: '#FFFFFF',
    letterSpacing: 1.1,
  },
  joinButton: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinText: {
    ...type.small,
    color: '#5D3446',
  },
  heroContent: {
    padding: 21,
    paddingBottom: 58,
    zIndex: 2,
  },
  heroEyebrow: {
    ...type.section,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1.2,
  },
  heroTitle: {
    ...type.hero,
    color: '#FFFFFF',
    fontSize: 39,
    lineHeight: 44,
    letterSpacing: -1.3,
    marginTop: 7,
  },
  heroSubtitle: {
    ...type.body,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 9,
  },
  formSheet: {
    borderRadius: 31,
    borderWidth: 1,
    padding: 20,
    marginTop: -39,
    marginHorizontal: 7,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 6,
    zIndex: 4,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 17,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.2,
  },
  title: {
    ...type.hero,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  subtitle: {
    ...type.small,
    marginTop: 5,
  },
  form: {
    marginTop: 21,
  },
  label: {
    ...type.small,
    fontSize: 13,
    marginBottom: 7,
  },
  passwordHeading: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgot: {
    ...type.tiny,
    marginBottom: 7,
  },
  inputShell: {
    minHeight: 57,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  focusedInput: {
    borderWidth: 1.5,
  },
  input: {
    ...type.body,
    flex: 1,
    paddingVertical: 0,
  },
  eyeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    marginTop: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    ...type.bodyStrong,
    color: '#FFFFFF',
  },
  dividerRow: {
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...type.tiny,
    fontSize: 9,
    letterSpacing: 1,
  },
  guestButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guestText: {
    ...type.small,
  },
  signupRow: {
    marginTop: 19,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  signupText: {
    ...type.small,
  },
  signupLink: {
    ...type.small,
  },
  privacy: {
    marginTop: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  privacyText: {
    ...type.tiny,
  },
});
