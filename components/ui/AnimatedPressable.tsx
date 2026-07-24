import * as Haptics from 'expo-haptics';
import React, { PropsWithChildren, useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';

type Props = PropsWithChildren<
  PressableProps & {
    style?: StyleProp<ViewStyle>;
    haptic?: boolean;
  }
>;

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({
  children,
  style,
  onPressIn,
  onPressOut,
  disabled,
  haptic = true,
  ...props
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn: PressableProps['onPressIn'] = event => {
    if (!disabled && haptic) {
      void Haptics.selectionAsync().catch(() => undefined);
    }

    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 7,
      tension: 170,
    }).start();

    onPressIn?.(event);
  };

  const pressOut: PressableProps['onPressOut'] = event => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 170,
    }).start();

    onPressOut?.(event);
  };

  return (
    <AnimatedPressableBase
      {...props}
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}
      style={[style, { transform: [{ scale }] }, disabled && { opacity: 0.5 }]}
    >
      {children}
    </AnimatedPressableBase>
  );
}
