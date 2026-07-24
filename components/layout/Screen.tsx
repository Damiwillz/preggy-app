import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { screenPad } from '@/utils/responsive';

type Props = ViewProps & {
  scroll?: boolean;
  children: React.ReactNode;
  bottomSpace?: number;
};

export function Screen({ children, scroll = true, bottomSpace = 120, style }: Props) {
  const content = <View style={[styles.content, { paddingBottom: bottomSpace }, style]}>{children}</View>;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
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
    backgroundColor: colors.canvas,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: screenPad,
    paddingTop: 10,
  },
});
