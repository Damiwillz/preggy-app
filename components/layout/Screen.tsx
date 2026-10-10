import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ViewProps,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/AppThemeContext';
import { screenPad } from '@/utils/responsive';

type Props = ViewProps & {
  scroll?: boolean;
  children: React.ReactNode;
  bottomSpace?: number;
  animate?: boolean;
};

export function Screen({
  children,
  scroll = true,
  bottomSpace = 120,
  style,
  animate = true,
}: Props) {
  const { palette } = useAppTheme();
  const entrance = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      if (!animate) {
        entrance.setValue(1);
        return;
      }

      entrance.setValue(0);

      const animation = Animated.timing(entrance, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

      animation.start();

      return () => animation.stop();
    }, [animate, entrance])
  );

  const animatedStyle = animate
    ? {
        opacity: entrance,
        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
          {
            scale: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [0.99, 1],
            }),
          },
        ],
      }
    : null;

  const content = (
    <Animated.View
      style={[
        styles.content,
        {
          paddingBottom: bottomSpace,
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safe,
        { backgroundColor: palette.canvas },
      ]}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === 'ios' ? 'interactive' : 'on-drag'
            }
            contentContainerStyle={styles.scrollContent}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: screenPad,
    paddingTop: 8,
  },
});
