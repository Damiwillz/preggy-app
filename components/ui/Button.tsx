import React from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';

import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  style?: ViewStyle;
  disabled?: boolean;
};

const variants: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: colors.plum },
  secondary: { backgroundColor: colors.softSurface, borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: colors.rose },
};

const labelColors: Record<Variant, string> = {
  primary: colors.darkPrimaryText,
  secondary: colors.plum,
  danger: colors.darkPrimaryText,
};

export function Button({ label, onPress, variant = 'primary', style, disabled = false }: Props) {
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, variants[variant], disabled && styles.disabled, style]}
    >
      <Text style={[styles.label, { color: labelColors[variant] }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    ...type.bodyStrong,
    fontSize: 16,
  },
});
