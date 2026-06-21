import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { useAppTheme } from '@/context/AppThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function IndexScreen() {
  const { palette } = useAppTheme();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (session) {
      router.replace('/(tabs)/home' as never);
      return;
    }

    router.replace('/onboarding' as never);
  }, [loading, session]);

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <ActivityIndicator color={palette.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
