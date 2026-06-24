import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { supabase } from '@/lib/supabase';
import { updatePassword } from '@/services/auth';

const LOGIN_PLUM = '#CE6F79';
const LOGIN_PLUM_SOFT = '#FFF0F1';
const LOGIN_TEXT = '#2A151B';
const LOGIN_MUTED = '#9C7B82';
const LOGIN_LINE = '#EFDCDD';

type PasswordInputProps = TextInputProps & {
  label: string;
};

function PasswordInput({ label, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.inputShell}>
        <TextInput
          {...props}
          secureTextEntry={!visible}
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Pressable onPress={() => setVisible((current) => !current)} hitSlop={12}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={LOGIN_PLUM} />
        </Pressable>
      </View>
    </View>
  );
}

function readUrlParams(url: string) {
  const values: Record<string, string> = {};

  const query = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';
  const hash = url.includes('#') ? url.split('#')[1] ?? '' : '';

  for (const source of [query, hash]) {
    const params = new URLSearchParams(source);

    params.forEach((value, key) => {
      values[key] = value;
    });
  }

  return values;
}

export default function UpdatePasswordScreen() {
  const params = useLocalSearchParams();

  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(
    () => password.length >= 7 && confirmPassword.length >= 7,
    [password, confirmPassword]
  );

  useEffect(() => {
    async function prepareSessionFromUrl(url: string | null) {
      try {
        const urlValues = url ? readUrlParams(url) : {};
        const paramValues: Record<string, string> = {};

        Object.entries(params).forEach(([key, value]) => {
          if (typeof value === 'string') {
            paramValues[key] = value;
          }
        });

        const merged = {
          ...urlValues,
          ...paramValues,
        };

        console.log('Password recovery params:', Object.keys(merged));

        const tokenHash = merged.token_hash;
        const typeValue = merged.type;
        const accessToken = merged.access_token;
        const refreshToken = merged.refresh_token;
        const code = merged.code;

        if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery',
          });

          if (error) {
            throw error;
          }

          setHasRecoverySession(true);
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          setHasRecoverySession(true);
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }

          setHasRecoverySession(true);
          return;
        }

        const { data } = await supabase.auth.getSession();

        if (data.session && typeValue === 'recovery') {
          setHasRecoverySession(true);
        }
      } catch (error) {
        console.log('Password recovery session error:', error);
      } finally {
        setReady(true);
      }
    }

    Linking.getInitialURL().then((url) => {
      void prepareSessionFromUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void prepareSessionFromUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [params]);

  async function submit() {
    Keyboard.dismiss();

    if (password.length < 7) {
      Alert.alert('Password too short', 'Use at least 7 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Enter the same password twice.');
      return;
    }

    if (!hasRecoverySession) {
      Alert.alert(
        'Reset link expired',
        'Open the newest password reset email link again, then enter your new password.'
      );
      return;
    }

    setSubmitting(true);

    try {
      await updatePassword(password);

      Alert.alert('Password updated', 'You can now log in with your new password.', [
        {
          text: 'OK',
          onPress: () => router.replace('/auth/log-in' as never),
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      Alert.alert('Could not update password', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen bottomSpace={28} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.topBar}>
          <AnimatedPressable onPress={() => router.replace('/auth/log-in' as never)} style={styles.back}>
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </AnimatedPressable>

          <Text style={styles.brand}>Preggy</Text>

          <View style={styles.topSpacer} />
        </View>

        <View style={styles.hero}>
          <View style={styles.badge}>
            <View style={styles.badgeGlow} />
            <Ionicons name="lock-closed-outline" size={34} color={LOGIN_PLUM} />
          </View>

          <Text style={styles.title}>Create new password</Text>

          <Text style={styles.subtitle}>
            Choose a new password that is easy for you to remember and hard for others to guess.
          </Text>
        </View>

        <View style={styles.card}>
          {!hasRecoverySession && ready ? (
            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={20} color={LOGIN_PLUM} />
              <Text style={styles.noticeText}>
                Open the newest password reset email link before updating your password.
              </Text>
            </View>
          ) : (
            <View style={styles.notice}>
              <Ionicons name="checkmark-circle-outline" size={20} color={LOGIN_PLUM} />
              <Text style={styles.noticeText}>
                Reset link detected. Enter and confirm your new password below.
              </Text>
            </View>
          )}

          <PasswordInput
            label="New password"
            placeholder="At least 7 characters"
            value={password}
            onChangeText={setPassword}
          />

          <PasswordInput
            label="Confirm password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            onSubmitEditing={submit}
          />

          <Button
            label={!ready || submitting ? 'Please wait...' : 'Update Password'}
            onPress={submit}
            disabled={!ready || !canSubmit || submitting}
            style={!ready || !canSubmit || submitting ? styles.dimmedButton : styles.primaryButton}
          />

          <AnimatedPressable style={styles.loginLink} onPress={() => router.replace('/auth/log-in' as never)}>
            <Text style={styles.loginLinkText}>Back to <Text style={styles.loginLinkStrong}>Log in</Text></Text>
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
    shadowColor: colors.ink,
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
    marginTop: 20,
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 30,
    alignItems: 'center',
    backgroundColor: '#F7EDEA',
    borderWidth: 1,
    borderColor: '#E9D8D5',
    overflow: 'hidden',
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: LOGIN_LINE,
  },
  badgeGlow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F6D3DA',
  },
  title: {
    ...type.title,
    color: LOGIN_TEXT,
    fontSize: 31,
    lineHeight: 36,
    textAlign: 'center',
    letterSpacing: -0.7,
  },
  subtitle: {
    ...type.body,
    color: LOGIN_MUTED,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
    maxWidth: 310,
  },
  card: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 22,
    borderWidth: 1,
    borderColor: LOGIN_LINE,
    shadowColor: colors.ink,
    shadowOpacity: 0.07,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: LOGIN_PLUM_SOFT,
    borderRadius: 18,
    padding: 13,
    marginBottom: 18,
  },
  noticeText: {
    ...type.small,
    flex: 1,
    color: LOGIN_MUTED,
    lineHeight: 18,
  },
  inputBlock: {
    marginBottom: 16,
  },
  inputLabel: {
    ...type.small,
    color: LOGIN_TEXT,
    fontWeight: '900',
    marginBottom: 8,
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LOGIN_LINE,
    backgroundColor: '#FFF8F5',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    ...type.body,
    color: LOGIN_TEXT,
  },
  primaryButton: {
    backgroundColor: LOGIN_PLUM,
  },
  dimmedButton: {
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
    color: colors.plum,
    fontWeight: '900',
  },
});
