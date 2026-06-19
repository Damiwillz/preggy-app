import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { colors } from '@/constants/colors';
import { LOCAL_AUTH } from '@/constants/auth';

type CompactInputProps = TextInputProps & {
  label: string;
  error?: boolean;
  password?: boolean;
};

function CompactInput({ label, error, password, secureTextEntry, style, ...props }: CompactInputProps) {
  const [visible, setVisible] = useState(false);
  const hidden = password ? !visible : secureTextEntry;

  return (
    <View style={styles.inputBlock}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
        <TextInput
          {...props}
          secureTextEntry={hidden}
          placeholderTextColor={colors.muted}
          style={[styles.input, password ? styles.inputWithEye : null, style]}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            onPress={() => setVisible((current) => !current)}
            hitSlop={12}
            style={styles.eyeButton}
          >
            <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.plum} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const canSubmit = useMemo(
    () => username.trim().length > 0 && newPassword.length > 0 && confirmPassword.length > 0,
    [username, newPassword, confirmPassword]
  );

  const clearFeedback = () => {
    setError('');
    setMessage('');
    setSent(false);
  };

  const reset = () => {
    Keyboard.dismiss();
    setMessage('');
    setError('');

    if (username.trim() !== LOCAL_AUTH.username) {
      setError('Username not found. Use Damilare.');
      return;
    }

    if (newPassword.length < 7) {
      setError('New password needs at least 7 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSent(true);
    setMessage('Reset request confirmed. Use your current demo password: 1234567.');
  };

  return (
    <Screen scroll={false} bottomSpace={0} style={styles.screen}>
      <View style={styles.topBar}>
        <AnimatedPressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={23} color="#6A5B5B" />
        </AnimatedPressable>
        <Text style={styles.brand}>Preggers</Text>
        <View style={styles.topSpacer} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={31} color={colors.plum} />
        </View>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>Create a fresh password request and keep your pregnancy journey protected.</Text>
      </View>

      <View style={styles.card}>
        <CompactInput
          label="Username"
          placeholder="Damilare"
          autoCapitalize="none"
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            clearFeedback();
          }}
        />

        <CompactInput
          label="New Password"
          placeholder="At least 7 characters"
          value={newPassword}
          onChangeText={(value) => {
            setNewPassword(value);
            clearFeedback();
          }}
          password
        />

        <CompactInput
          label="Confirm Password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            clearFeedback();
          }}
          password
          error={Boolean(error)}
          onSubmitEditing={reset}
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : message ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={18} color={colors.green} />
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        <Button
          label={sent ? 'Back to Login' : 'Reset Password'}
          onPress={sent ? () => router.replace('/auth/log-in') : reset}
          style={[styles.button, !canSubmit && !sent ? styles.dimmedButton : null]}
        />

        <AnimatedPressable style={styles.loginLink} onPress={() => router.replace('/auth/log-in')}>
          <Text style={styles.loginLinkText}>Remembered it? <Text style={styles.loginLinkStrong}>Log in</Text></Text>
        </AnimatedPressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.canvas,
    paddingHorizontal: 24,
    justifyContent: 'flex-start',
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  brand: {
    ...type.bodyStrong,
    color: colors.ink,
    fontSize: 18,
  },
  topSpacer: {
    width: 46,
    height: 46,
  },
  heroCard: {
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: colors.softSurface,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: colors.line,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    ...type.title,
    color: colors.ink,
    textAlign: 'center',
    fontSize: 29,
    lineHeight: 34,
  },
  subtitle: {
    ...type.body,
    color: colors.text,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 23,
  },
  card: {
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 19,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: '#603B3B',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  inputBlock: {
    marginBottom: 12,
  },
  inputLabel: {
    ...type.bodyStrong,
    color: colors.ink,
    marginBottom: 7,
  },
  inputShell: {
    height: 50,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputShellError: {
    borderColor: colors.rose,
  },
  input: {
    height: 48,
    flex: 1,
    paddingHorizontal: 16,
    color: colors.ink,
    ...type.body,
  },
  inputWithEye: {
    paddingRight: 4,
  },
  eyeButton: {
    width: 50,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...type.small,
    color: colors.rose,
    marginTop: -2,
    marginBottom: 10,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.softSurface,
    marginTop: -2,
    marginBottom: 10,
  },
  successText: {
    ...type.small,
    flex: 1,
    color: colors.text,
    lineHeight: 18,
  },
  button: {
    marginTop: 2,
    minHeight: 52,
  },
  dimmedButton: {
    opacity: 0.82,
  },
  loginLink: {
    minHeight: 38,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkText: {
    ...type.small,
    color: colors.text,
    textAlign: 'center',
  },
  loginLinkStrong: {
    color: colors.plum,
    fontWeight: '900',
  },
});
