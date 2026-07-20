import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/constants/colors';
import { applySavedAppearanceFromAccount } from '@/services/appAppearance';
import { AuthProvider } from '@/context/AuthContext';
import { AppThemeProvider } from '@/context/AppThemeContext';

export default function RootLayout() {
  const scheme = useColorScheme();

  useEffect(() => {
    applySavedAppearanceFromAccount();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
      <AppThemeProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding/index" />
          <Stack.Screen name="onboarding/track-milestones" />
          <Stack.Screen name="onboarding/personal-guidance" />
          <Stack.Screen name="onboarding/pregnancy-profile" />
          <Stack.Screen name="auth/log-in" />
          <Stack.Screen name="auth/create-account" />
          <Stack.Screen name="auth/reset-password" />
          <Stack.Screen name="(tabs)" />
            <Stack.Screen name="log-symptoms" />
          <Stack.Screen name="appointment/details" />
          <Stack.Screen name="appointment/cancel" />
          <Stack.Screen name="calculator/result" />
          <Stack.Screen name="medication" />
          <Stack.Screen name="timeline" />
          <Stack.Screen name="tips/status" />
          <Stack.Screen name="tips/yoga" />
          <Stack.Screen name="tips/sanctuary" />
          <Stack.Screen name="tips/hospital-bag" />
          <Stack.Screen name="privacy/index" />
          <Stack.Screen name="privacy/download-data" />
          <Stack.Screen name="privacy/biometric" />
          <Stack.Screen name="doctor-visit-pack" />
          <Stack.Screen name="safety-center" />
          <Stack.Screen name="documents-checklist" />
          <Stack.Screen name="blood-pressure-tracker" />
          <Stack.Screen name="postpartum-plan" />
          <Stack.Screen name="baby-budget" />
          <Stack.Screen name="partner-support" />
          <Stack.Screen name="baby-registry" />
          <Stack.Screen name="ai-chat" />
        <Stack.Screen name="reminders" options={{ headerShown: false }} />
          <Stack.Screen name="appearance" />
            <Stack.Screen name="edit-profile" />
        </Stack>
      </AppThemeProvider>
    </AuthProvider>
    </GestureHandlerRootView>
  );
}