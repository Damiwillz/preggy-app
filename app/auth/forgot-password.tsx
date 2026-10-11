import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

import { TextField } from '@/components/forms/TextField';
import { Screen } from '@/components/layout/Screen';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';
import { sendPasswordReset } from '@/services/auth';

export default function ForgotPasswordScreen() {
  const { palette } = useAppTheme();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cleanEmail = email.trim().toLowerCase();

  const canSubmit = useMemo(
    () => cleanEmail.includes('@') && cleanEmail.includes('.'),
    [cleanEmail]
  );

  async function submit() {
    Keyboard.dismiss();

    if (!canSubmit) {
      Alert.alert(
        'Check your email',
        'Enter the email address connected to your Preggy account.'
      );
      return;
    }

    setSubmitting(true);

    try {
      await sendPasswordReset(cleanEmail);

      Alert.alert(
        'Check your inbox',
        'We sent a secure password reset link. Open the newest email from Preggy.',
        [
          {
            text: 'Return to login',
            onPress: () =>
              router.replace('/auth/log-in' as never),
          },
        ]
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Please try again.';

      Alert.alert('Reset failed', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      bottomSpace={35}
      style={styles.screen}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.topBar}>
          <AnimatedPressable
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            style={[
              styles.backButton,
              {
                backgroundColor: palette.surface,
                borderColor: palette.line,
              },
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={palette.ink}
            />
          </AnimatedPressable>

          <View style={styles.brand}>
            <View
              style={[
                styles.brandIcon,
                { backgroundColor: palette.accentSoft },
              ]}
            >
              <Ionicons
                name="heart"
                size={15}
                color={palette.accent}
              />
            </View>

            <Text style={[styles.brandText, { color: palette.ink }]}>
              Preggy
            </Text>
          </View>

          <View style={styles.topSpacer} />
        </View>

        <View
          style={[
            styles.hero,
            {
              backgroundColor: palette.accentSoft,
              borderColor: palette.line,
            },
          ]}
        >
          <View
            style={[
              styles.heroDecorationLarge,
              {
                backgroundColor: palette.accent,
                opacity: 0.08,
              },
            ]}
          />

          <View
            style={[
              styles.heroDecorationSmall,
              {
                backgroundColor: palette.surface,
                opacity: 0.55,
              },
            ]}
          />

          <View
            style={[
              styles.keyIcon,
              { backgroundColor: palette.surface },
            ]}
          >
            <Ionicons
              name="key-outline"
              size={31}
              color={palette.accent}
            />
          </View>

          <Text style={[styles.eyebrow, { color: palette.accent }]}>
            ACCOUNT RECOVERY
          </Text>

          <Text style={[styles.title, { color: palette.ink }]}>
            Let’s get you back in
          </Text>

          <Text style={[styles.subtitle, { color: palette.text }]}>
            Enter your account email and we’ll send you a secure
            reset link.
          </Text>
        </View>

        <View
          style={[
            styles.formCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.line,
              shadowColor: palette.ink,
            },
          ]}
        >
          <View
            style={[
              styles.securityNote,
              { backgroundColor: palette.accentSoft },
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={21}
              color={palette.accent}
            />

            <Text
              style={[
                styles.securityText,
                { color: palette.text },
              ]}
            >
              For your safety, reset links expire. Always use the
              newest email link.
            </Text>
          </View>

          <TextField
            label="Email address"
            helper="Use the email connected to your Preggy account"
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="send"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => void submit()}
          />

          <Button
            label={
              submitting
                ? 'Sending reset link...'
                : 'Send reset link'
            }
            onPress={() => void submit()}
            disabled={!canSubmit || submitting}
            loading={submitting}
            icon={submitting ? undefined : 'mail-outline'}
          />

          <AnimatedPressable
            onPress={() =>
              router.replace('/auth/log-in' as never)
            }
            style={styles.loginLink}
          >
            <Ionicons
              name="arrow-back"
              size={16}
              color={palette.accent}
            />

            <Text
              style={[
                styles.loginLinkText,
                { color: palette.accent },
              ]}
            >
              Return to login
            </Text>
          </AnimatedPressable>
        </View>

        <View style={styles.helpRow}>
          <Ionicons
            name="help-circle-outline"
            size={18}
            color={palette.muted}
          />

          <Text style={[styles.helpText, { color: palette.muted }]}>
            Didn’t receive it? Check spam or wait a few minutes
            before requesting another link.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 22,
  },
  topBar: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    ...type.bodyStrong,
    fontSize: 17,
  },
  topSpacer: {
    width: 44,
    height: 44,
  },
  hero: {
    minHeight: 300,
    borderRadius: 31,
    borderWidth: 1,
    padding: 24,
    marginTop: 15,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroDecorationLarge: {
    position: 'absolute',
    width: 235,
    height: 235,
    borderRadius: 118,
    right: -75,
    top: -90,
  },
  heroDecorationSmall: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 63,
    left: -55,
    bottom: 30,
  },
  keyIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 23,
  },
  eyebrow: {
    ...type.section,
    letterSpacing: 1.25,
  },
  title: {
    ...type.hero,
    fontSize: 34,
    lineHeight: 41,
    letterSpacing: -1,
    marginTop: 5,
  },
  subtitle: {
    ...type.body,
    marginTop: 8,
    maxWidth: 310,
  },
  formCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 19,
    marginTop: 15,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  },
  securityNote: {
    borderRadius: 18,
    padding: 13,
    marginBottom: 19,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  securityText: {
    ...type.small,
    flex: 1,
    marginLeft: 9,
    lineHeight: 19,
  },
  loginLink: {
    minHeight: 45,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loginLinkText: {
    ...type.small,
  },
  helpRow: {
    marginTop: 17,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpText: {
    ...type.tiny,
    flex: 1,
    marginLeft: 7,
    lineHeight: 17,
  },
});
