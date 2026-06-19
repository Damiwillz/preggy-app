import React from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { AnimatedPressable } from './AnimatedPressable';

type Props = { label: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; style?: StyleProp<ViewStyle> };
export function Button({ label, onPress, variant = 'primary', style }: Props) {
  return (
    <AnimatedPressable onPress={onPress} style={[styles.button, styles[variant], style]}>
      <Text style={[styles.label, variant === 'primary' || variant === 'danger' ? styles.light : styles.dark]}>{label}</Text>
    </AnimatedPressable>
  );
}
const styles = StyleSheet.create({
  button: { minHeight: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primary: { backgroundColor: colors.plum },
  secondary: { backgroundColor: colors.softSurface, borderWidth: 1, borderColor: colors.line },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.rose },
  label: { ...type.bodyStrong, textAlign: 'center' },
  light: { color: colors.surface },
  dark: { color: colors.plum }
});
