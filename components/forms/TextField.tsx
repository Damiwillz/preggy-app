import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

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
  onFocus,
  onBlur,
  editable = true,
  ...props
}: Props) {
  const { palette } = useAppTheme();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const shouldHidePassword = enablePasswordToggle
    ? !passwordVisible
    : secureTextEntry;

  const borderColor = error
    ? palette.danger
    : focused
      ? palette.accent
      : palette.line;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: palette.ink }]}>
          {label}
        </Text>

        {labelActionText ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={onLabelActionPress}
            style={styles.labelAction}
          >
            <Text
              style={[
                styles.labelActionText,
                { color: palette.accent },
              ]}
            >
              {labelActionText}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {helper ? (
        <Text style={[styles.helper, { color: palette.muted }]}>
          {helper}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: editable
              ? palette.surface
              : palette.softSurface,
            borderColor,
            shadowColor: palette.accent,
          },
          focused && styles.inputFocused,
        ]}
      >
        <TextInput
          placeholderTextColor={palette.muted}
          editable={editable}
          style={[
            styles.input,
            { color: palette.ink },
            enablePasswordToggle && styles.inputWithIcon,
            style,
          ]}
          secureTextEntry={shouldHidePassword}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />

        {enablePasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              passwordVisible ? 'Hide password' : 'Show password'
            }
            hitSlop={12}
            onPress={() =>
              setPasswordVisible((current) => !current)
            }
            style={styles.eyeButton}
          >
            <Ionicons
              name={
                passwordVisible
                  ? 'eye-off-outline'
                  : 'eye-outline'
              }
              size={22}
              color={focused ? palette.accent : palette.muted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle-outline"
            size={15}
            color={palette.danger}
          />

          <Text style={[styles.error, { color: palette.danger }]}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 17,
  },
  labelRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 7,
  },
  label: {
    ...type.small,
    fontSize: 14,
    flexShrink: 0,
  },
  labelAction: {
    minHeight: 28,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelActionText: {
    ...type.small,
  },
  helper: {
    ...type.small,
    marginTop: -3,
    marginBottom: 8,
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputFocused: {
    borderWidth: 1.5,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  input: {
    minHeight: 54,
    flex: 1,
    paddingHorizontal: 16,
    ...type.body,
  },
  inputWithIcon: {
    paddingRight: 4,
  },
  eyeButton: {
    width: 52,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  error: {
    ...type.small,
    flex: 1,
  },
});
