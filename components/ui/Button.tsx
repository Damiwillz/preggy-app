import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { type } from '@/constants/typography';
import { useAppTheme } from '@/context/AppThemeContext';

type Variant = 'primary' | 'secondary' | 'soft' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
  loading = false,
  icon,
}: Props) {
  const { palette } = useAppTheme();

  const backgroundColor =
    variant === 'primary'
      ? palette.accent
      : variant === 'danger'
        ? palette.danger
        : variant === 'soft'
          ? palette.accentSoft
          : palette.surface;

  const borderColor =
    variant === 'primary' || variant === 'danger'
      ? backgroundColor
      : variant === 'soft'
        ? palette.accentSoft
        : palette.line;

  const foregroundColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'soft'
        ? palette.accentStrong
        : palette.ink;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foregroundColor} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={20}
              color={foregroundColor}
            />
          ) : null}

          <Text
            style={[
              styles.label,
              { color: foregroundColor },
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  label: {
    ...type.bodyStrong,
    fontSize: 16,
  },
});
