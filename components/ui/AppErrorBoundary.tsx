import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { Component, ReactNode, type ErrorInfo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { type } from '@/constants/typography';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || 'Something went wrong.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('App screen error:', error);
    console.log('Error details:', errorInfo.componentStack);
  }

  reset = () => {
    this.setState({
      hasError: false,
      message: '',
    });
  };

  goHome = () => {
    this.reset();
    router.replace('/(tabs)/home' as never);
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="heart-circle-outline" size={44} color={colors.rose} />
          </View>

          <Text style={styles.title}>Preggy needs a quick reset</Text>
          <Text style={styles.copy}>
            Something on this screen did not load properly. Your saved app data is still safe.
          </Text>

          <Text style={styles.smallCopy} numberOfLines={2}>
            {this.state.message}
          </Text>

          <AnimatedPressable onPress={this.reset} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Try again</Text>
          </AnimatedPressable>

          <AnimatedPressable onPress={this.goHome} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Go home</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.canvas,
  },
  card: {
    borderRadius: 30,
    padding: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softSurface,
    marginBottom: 16,
  },
  title: {
    ...type.title,
    color: colors.ink,
    textAlign: 'center',
  },
  copy: {
    ...type.body,
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
  },
  smallCopy: {
    ...type.tiny,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 12,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.rose,
    marginTop: 20,
  },
  primaryText: {
    ...type.bodyStrong,
    color: colors.darkPrimaryText,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.softSurface,
    marginTop: 10,
  },
  secondaryText: {
    ...type.bodyStrong,
    color: colors.ink,
  },
});
