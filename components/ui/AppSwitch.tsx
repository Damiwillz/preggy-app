import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 24;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - 6;

export function AppSwitch({ value, onValueChange, disabled = false, style, accessibilityLabel }: Props) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      friction: 9,
      tension: 130,
    }).start();
  }, [progress, value]);

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E9DFDB', '#D7B9BE'],
  });

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRAVEL],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={10}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [styles.touchArea, style, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    width: 60,
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#5D454B',
    shadowOpacity: 0.14,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
});
