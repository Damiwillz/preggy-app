import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

type Props = TextInputProps & {
  label: string;
  helper?: string;
  error?: string;
  enablePasswordToggle?: boolean;
  labelActionText?: string;
  onLabelActionPress?: () => void;
};

export function TextField({
  label,
  helper,
  error,
  enablePasswordToggle = false,
  secureTextEntry,
  style,
  labelActionText,
  onLabelActionPress,
  ...props
}: Props) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const shouldHidePassword = enablePasswordToggle
    ? !passwordVisible
    : secureTextEntry;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelActionText ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labelActionText}
            hitSlop={10}
            onPress={onLabelActionPress}
            style={styles.labelAction}
          >
            <Text style={styles.labelActionText}>{labelActionText}</Text>
          </Pressable>
        ) : null}
      </View>
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}

      <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
        <TextInput
          placeholderTextColor={colors.muted}
          style={[styles.input, enablePasswordToggle ? styles.inputWithIcon : null, style]}
          secureTextEntry={shouldHidePassword}
          {...props}
        />

        {enablePasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
            hitSlop={12}
            onPress={() => setPasswordVisible((current) => !current)}
            style={styles.eyeButton}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={23}
              color={colors.plum}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7, marginBottom: 16 },
  labelRow: {
    minHeight: 23,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  label: { ...type.bodyStrong, color: colors.ink, flexShrink: 0 },
  labelAction: {
    minHeight: 28,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelActionText: {
    ...type.small,
    color: colors.plum,
    fontWeight: '900',
  },
  helper: { ...type.small, color: colors.muted, marginTop: -2 },
  inputShell: {
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputShellError: { borderColor: colors.rose },
  input: {
    minHeight: 54,
    flex: 1,
    paddingHorizontal: 18,
    color: colors.ink,
    ...type.body,
  },
  inputWithIcon: { paddingRight: 6 },
  eyeButton: {
    width: 52,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { ...type.small, color: colors.rose },
});
